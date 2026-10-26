# Documentación Técnica: Justificación de Arquitectura y Troubleshooting

Este documento recoge los fundamentos de diseño, justificación arquitectónica y la bitácora de resolución de incidencias (*troubleshooting*) de la aplicación SPA desarrollada con **Ionic Framework** y **Angular Standalone**, orientada al catálogo y gestión de inventario/stock valorado mediante la API pública de **Google Books**.

---

## 1. Justificación de Arquitectura: ¿Por qué existe `app.config.ts`?

En las versiones clásicas de Angular (Angular 2 a 14), la configuración global de la aplicación se centralizaba dentro de un módulo raíz decorado con `@NgModule` denominado convencionalmente `AppModule` (`app.module.ts`). Dicho módulo importaba paquetes pesados (`BrowserModule`, `HttpClientModule`, `RouterModule.forRoot()`), declaraba los componentes y definía proveedores mediante arreglos estáticos.

Con la consolidación de la arquitectura **Standalone** (Angular 15+) y su adopción estricta en este proyecto (Angular 19/20+ e Ionic 8/9):

1. **Eliminación Total de `AppModule`**:
   - La aplicación se inicializa en [`src/main.ts`](../main.ts) mediante la función funcional:
     ```typescript
     bootstrapApplication(AppComponent, appConfig);
     ```
   - Al no existir `@NgModule`, Angular requiere una estructura formal y desacoplada para registrar servicios raíz, interceptores y configuraciones de plataforma.

2. **Propósito de [`src/app/app.config.ts`](../app.config.ts)**:
   - Proporciona un objeto tipado `ApplicationConfig` que declara todos los proveedores globales de inyección de dependencias (`providers: [...]`).
   - Reemplaza los módulos legados por **funciones proveedoras funcionales (*tree-shakeable*)**:
     - `provideHttpClient()`: En sustitución de `HttpClientModule`. Permite habilitar características modulares como interceptores funcionales (`withInterceptors`), caché y fetch sin acoplar código muerto.
     - `provideRouter(routes, withPreloading(...))`: En sustitución de `RouterModule.forRoot()`. Gestiona el enrutamiento declarativo y la carga perezosa (*lazy loading*) de los componentes standalone mediante `loadComponent`.
     - `provideIonicAngular()` y `{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }`: Configura el motor de transiciones, gestos táctiles, animaciones móviles y la estrategia de ciclo de vida de Ionic (`ionViewWillEnter`, `IonRouterOutlet`).

```typescript
// Fragmento real de src/app/app.config.ts
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, RouteReuseStrategy } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular({ mode: 'md' }),
    provideRouter(routes),
    provideHttpClient(),
  ],
};
```

---

## 2. Resolución de Incidencias Técnicas (Troubleshooting)

A continuación se detallan los desafíos técnicos reales enfrentados durante el ciclo de vida del proyecto, su diagnóstico de causa raíz y las soluciones de ingeniería aplicadas:

---

### Incidencia 1: Error de resolución de subpaths en `@ionic/angular` (`@ionic/angular/standalone`)

- **Síntoma**:
  Al intentar compilar el proyecto con `ng build` o ejecutar `ng serve`, el compilador TypeScript y el empaquetador Vite/esbuild arrojaban un fallo crítico:
  ```text
  Cannot find module '@ionic/angular/standalone' or its corresponding type declarations.
  Error: Package subpath './standalone' is not defined by "exports" in node_modules/@ionic/angular/package.json
  ```
- **Causa Raíz**:
  En las versiones más recientes de Ionic v8 y v9, la estructura interna del paquete `@ionic/angular` experimentó reestructuraciones en sus campos `"exports"` de `package.json`. Algunas herramientas de resolución estricta de módulos de Node no localizaban la ruta relativa del subpath `./standalone` sin una declaración explícita de exports o mapeo de rutas.
- **Solución Aplicada**:
  1. Se implementó un script de automatización en Node.js ([`scripts/setup-ionic-exports.js`](../../scripts/setup-ionic-exports.js)) que inspecciona el archivo `node_modules/@ionic/angular/package.json` tras la instalación y asegura la exportación correcta:
     ```javascript
     // Fragmento de scripts/setup-ionic-exports.js
     const pkgPath = path.join(__dirname, '../node_modules/@ionic/angular/package.json');
     const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
     pkg.exports = pkg.exports || {};
     pkg.exports['./standalone'] = {
       types: './standalone/index.d.ts',
       import: './standalone/index.mjs',
       default: './standalone/index.js'
     };
     fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
     ```
  2. Se vinculó este script al ciclo de vida `postinstall` en `package.json` (`"postinstall": "node scripts/setup-ionic-exports.js"`).
  3. Se añadió en `tsconfig.json` el alias de ruta explícito:
     ```json
     "paths": {
       "@ionic/angular/standalone": ["node_modules/@ionic/angular/standalone"]
     }
     ```
- **Resultado**: Resolución limpia e inmediata de todos los componentes granulares de Ionic (`IonHeader`, `IonToolbar`, `IonButton`, etc.) sin advertencias.

---

### Incidencia 2: Error `NG0908: In this configuration Angular requires Zone.js`

- **Síntoma**:
  Al iniciar la aplicación en el navegador (`localhost:4200`), la consola del desarrollador emitía una excepción bloqueante y la pantalla permanecía en blanco u oscura:
  ```text
  ERROR RuntimeError: NG0908: In this configuration Angular requires Zone.js
  at ComponentFactory.create (core.mjs)
  at IonRouterOutlet.activateWith (ionic-angular-standalone.mjs)
  ```
- **Causa Raíz**:
  Las nuevas plantillas de Angular permiten trabajar en modo *zoneless* (`provideExperimentalZonelessChangeDetection()`). Sin embargo, el componente `IonRouterOutlet` de Ionic Framework depende internamente de `zone.js` para interceptar eventos asíncronos de animación, transiciones de vista y el ciclo de vida de la pila de navegación. Al no estar cargado el polyfill, el enrutador colapsaba en la fase de bootstrap.
- **Solución Aplicada**:
  1. Se garantizó la instalación del paquete `zone.js`.
  2. Se registró `zone.js` en la sección de `polyfills` del archivo [`angular.json`](../../angular.json):
     ```json
     "polyfills": [
       "zone.js"
     ]
     ```
  3. Se importó explícitamente al inicio del punto de entrada [`src/main.ts`](../main.ts):
     ```typescript
     import 'zone.js';
     import { bootstrapApplication } from '@angular/platform-browser';
     // ...
     ```
- **Resultado**: La navegación por pestañas y rutas lazy de `IonRouterOutlet` se estabilizó al 100%, renderizando instantáneamente todas las vistas.

---

### Incidencia 3: Saturación de Cuota Anónima en Google Books API (`HTTP 429 Quota Exceeded`)

- **Síntoma**:
  Al consultar libros en la vista de catálogo, tras varias peticiones sucesivas la API pública de Google Books (`https://www.googleapis.com/books/v1/volumes`) respondía con:
  ```text
  HTTP 429 Too Many Requests - RESOURCE_EXHAUSTED: Quota exceeded for quota metric 'Queries'
  ```
  Esto provocaba un *spinner* de carga infinito o tablas vacías si el servicio dependía exclusivamente de la disponibilidad remota no autenticada.
- **Causa Raíz**:
  Google Books API impone un límite de peticiones por minuto por dirección IP pública para llamadas anónimas (sin API Key). En entornos educativos, compartidos o de desarrollo intensivo, el límite se satura rápidamente.
- **Solución Aplicada**:
  1. En [`BookService`](../services/book.service.ts), se diseñó una arquitectura reactiva tolerante a fallos empleando el operador `catchError` de RxJS:
     ```typescript
     return this.http.get<GoogleBooksResponse>(this.apiUrl, { params }).pipe(
       map((response) => this.mapAndEnrich(response)),
       catchError((error: HttpErrorResponse) => {
         console.warn(`[HTTP ${error.status}] Activando contingencia de catálogo curado:`, error.message);
         return of(this.getCuratedResponse(query, startIndex, maxResults));
       })
     );
     ```
  2. Se configuró un catálogo de contingencia tipado con más de 30 títulos reales de ingeniería de software, arquitectura, Angular y TypeScript.
  3. En [`LibrosPage`](../pages/libros/libros.page.ts) se forzó la detección reactiva con `ChangeDetectorRef.detectChanges()` tanto en la rama de éxito como en contingencia, garantizando que el *spinner* se desactive y la tabla se pinte en menos de 50 ms.
- **Resultado**: Experiencia de usuario ininterrumpida, permitiendo evaluar el catálogo, la paginación y el cálculo de stock valorado en cualquier circunstancia de conectividad o limitación de cuota.

---

## 3. Reto Técnico Implementado: Paginación Dinámica del Catálogo

Para optimizar el rendimiento del renderizado en cliente y cumplir con las mejores prácticas en tablas de datos extensas:

1. **Parámetros en Servicio (`BookService.getBooks`)**:
   - `startIndex`: Índice del primer elemento solicitado (cero-indexado).
   - `maxResults`: Tamaño del lote de elementos por página (definido en 8 unidades).
   - Soportado tanto en la query HTTP hacia Google Books (`&startIndex=X&maxResults=Y`) como en el catálogo de contingencia mediante `.slice(startIndex, startIndex + maxResults)`.
2. **Controlador Reactivo (`LibrosPage`)**:
   - Estados: `currentPage`, `pageSize = 8`, `totalItems` y getter derivado `totalPages = Math.ceil(totalItems / pageSize)`.
   - Navegación bidireccional y directa: `prevPage()`, `nextPage()`, `goToPage(p)` con prevención de llamadas redundantes durante estados de carga (`isLoading`).
   - Reinicio automático a la página 1 cuando el usuario aplica un filtro temático o realiza una búsqueda en el `IonSearchbar`.
3. **Interfaz de Usuario**:
   - Resumen superior con rango dinámico: `Mostrando {startIndex} - {endIndex} de {totalItems} volúmenes`.
   - Barra de navegación con botones accesibles, estados `:disabled` limpios y selector de páginas numéricas con realce de la página activa.

---

## 4. Flujo de Integración Profesional Git: de desarrollo a main

### 4.1. Justificación Técnica para el Cliente

En entornos de ingeniería de software profesional y arquitecturas con despliegue continuo (**CI/CD** como Vercel o Netlify), la gestión de ramas responde a una estricta separación de responsabilidades:

1. **La rama `main` como estándar de Producción**:
   - Representa el código **estable, auditado, compilado y listo para el usuario final**.
   - Vercel está configurado para vigilar `main` como rama de producción (*Production Branch*). Cada *commit* o *merge* recibido en `main` desencadena automáticamente la compilación del bundle (`npm run build`), ejecuta verificaciones de calidad y publica el sitio en el dominio de producción con certificado SSL y distribución global en CDN.
2. **La rama `desarrollo` (o *features*) como entorno de Staging/Preview**:
   - Es el entorno de trabajo activo donde se integran, prueban y corrigen nuevas funcionalidades (por ejemplo, el cálculo de stock valorado, paginación o el selector de temas claro/oscuro).
   - Trabajar directamente sobre `main` introduce riesgos críticos de desplegar código incompleto o en pruebas a los usuarios finales. Vercel genera *Preview Deployments* para ramas como `desarrollo`, permitiendo validar cambios en URLs temporales antes de pasarlos a producción.

---

### 4.2. Guía Paso a Paso: Promover Cambios de `desarrollo` a `main`

A continuación se detalla la secuencia estándar de comandos de Git para consolidar el trabajo y desplegar a producción:

#### Paso 1: Asegurar y commitear el trabajo en `desarrollo`
Verifica que no queden archivos sin guardar y genera el commit con los cambios validados:
```bash
# Comprobar el estado del árbol de trabajo
git status

# Añadir todos los ficheros modificados y creados
git add .

# Registrar el commit descriptivo
git commit -m "feat: implementacion de paginacion, modo oscuro/claro y documentacion tecnica"

# Sincronizar la rama desarrollo con el repositorio remoto
git push origin desarrollo
```

#### Paso 2: Cambiar a la rama `main`
Si la rama `main` aún no existe localmente, se crea a partir del estado actual; si ya existe, nos posicionamos en ella:
```bash
# Cambiar a main (o crearla con -b si es la primera vez)
git checkout main || git checkout -b main

# Opcional: asegurar que main local esté al día con el origen
git pull origin main
```

#### Paso 3: Integrar los cambios mediante Merge
Incorpora todo el historial de commits y características validadas desde `desarrollo`:
```bash
# Fusionar los cambios probados de desarrollo en main
git merge desarrollo -m "merge: integracion de version estable desde desarrollo a main"
```

#### Paso 4: Desplegar a Producción en Vercel vía Push
Al subir la rama `main` a GitHub, Vercel detecta el evento de webhook y lanza automáticamente la compilación y despliegue a producción:
```bash
# Publicar en main remoto (dispara el deployment automático de Vercel)
git push origin main
```

#### Paso 5: Regresar a `desarrollo` para continuar el ciclo de trabajo
Una vez desplegada la versión estable, el desarrollador vuelve a la rama de trabajo cotidiano:
```bash
git checkout desarrollo
```

