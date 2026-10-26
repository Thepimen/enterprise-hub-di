# EnterpriseHub PWA 🚀

> **Sistema de Gestión Multiplataforma B2B y Monitorización de Infraestructura**  
> Aplicación Web Progresiva (PWA) de Alto Rendimiento para la Supervisión Empresarial y Gestión de Incidencias Técnicas en Tiempo Real.

[![Angular](https://img.shields.io/badge/Angular-22.x-red?logo=angular)](https://angular.io)
[![Ionic](https://img.shields.io/badge/Ionic-9.x-blue?logo=ionic)](https://ionicframework.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.x-blue?logo=typescript)](https://www.typescriptlang.org)
[![WCAG](https://img.shields.io/badge/WCAG-2.1%20AA%2FAAA-green)](https://www.w3.org/WAI/WCAG21/quickref/)
[![License](https://img.shields.io/badge/License-Academic-orange)](./LICENSE)

---

## 📋 1. Metadatos Académicos

| Campo | Información Oficial |
| :--- | :--- |
| **Proyecto** | EnterpriseHub PWA — Sistema de Gestión Multiplataforma B2B y Monitorización |
| **Autor** | **Luis Lázaro Pimentel** |
| **Centro Educativo** | **Instituto Nebrija de Formación Profesional** |
| **Ciclo Formativo** | 2º Grado Superior en Desarrollo de Aplicaciones Multiplataforma (DAM) |
| **Módulo Profesional** | Desarrollo de Interfaces |
| **Código del Módulo** | **0488** |
| **Convocatoria / Curso** | 2025 – 2026 |

---

## 🔑 2. Credenciales de Acceso para Evaluación

La aplicación implementa un sistema de control de acceso basado en roles (**RBAC** - *Role-Based Access Control*) con persistencia en sesión y protección perimetral de rutas. Para facilitar la evaluación, la pantalla de inicio de sesión incorpora botones de **acceso rápido** con las siguientes cuentas preconfiguradas:

| Rol | Correo Electrónico | Contraseña | Nivel de Acceso y Permisos |
| :--- | :--- | :--- | :--- |
| **👑 Administrador (`ADMIN`)** | `admin@enterprise.io` | `Admin123!` | **Acceso Total:** Supervisión de KPIs ejecutivos, gráficos analíticos de infraestructura, tabla avanzada de tickets con filtrado/búsqueda, creación de incidencias, exportación de informes en PDF/CSV y centro de ayuda. |
| **👤 Usuario Estándar (`USER`)** | `user@enterprise.io` | `User123!` | **Acceso Operativo:** Visualización y gestión del módulo de Tickets, creación de incidencias y Centro de Ayuda. **Acceso Restringido:** El acceso a `/dashboard` está bloqueado preventivamente a nivel de navegación y enrutador mediante `roleGuard`. |

---

## 🏛️ 3. Arquitectura y Justificación Técnica por Resultados de Aprendizaje

EnterpriseHub PWA ha sido concebida bajo la arquitectura **MVVM (Model-View-ViewModel)** utilizando las características más avanzadas del ecosistema moderno de **Angular** e **Ionic Framework**, asegurando modularidad, desacoplamiento, reactividad y máxima eficiencia.

### RA 1: Planificación de Interfaces y Navegación Reactiva (20%)
- **Arquitectura Standalone y Lazy Loading:** El 100% de las rutas en `app.routes.ts` utilizan componentes independientes (`standalone: true`) cargados bajo demanda mediante `loadComponent: () => import(...)`. Esto minimiza el bundle inicial (*Initial Chunk*) y maximiza las métricas Core Web Vitals (LCP, FID/INP).
- **Control de Acceso Funcional (Guards):**
  - `authGuard`: Protege las rutas privadas interceptando la navegación si el usuario no posee una sesión activa, redirigiendo automáticamente a `/login` con preservación de estado.
  - `roleGuard`: Comprueba los privilegios del usuario autenticado contra los roles requeridos (`data: { roles: ['ADMIN'] }`). Si un usuario de rol `USER` intenta acceder al Dashboard, la navegación se deniega y se redirige a una zona segura informando mediante notificación accesible.
- **Gestión de Estado Reactivo Centralizado:** `AuthService` gestiona el estado global de autenticación a través de un `BehaviorSubject<User | null>`, exponiendo un observable público inmutable `currentUser$`. La sesión se sincroniza bidireccionalmente con `localStorage` para garantizar la persistencia tras recargas accidentales o cierres de ventana.

### RA 2: Formularios Reactivos y Validación Asíncrona (15%)
- **Estrategia de Detección de Cambios Optimizada:** Implementación sistemática de `ChangeDetectionStrategy.OnPush` en componentes y vistas. Las vistas solo recalculan su árbol de renderizado cuando cambian sus referencias de `@Input()` o emiten flujos RxJS locales, eliminando ciclos innecesarios de Zone.js.
- **Formularios Fuertemente Tipados:** Tanto `LoginPage` como `RegisterPage` implementan `ReactiveFormsModule` con validación estricta de formato, longitud, patrones de complejidad de contraseña (`pattern`) y concordancia de campos (`passwordMatchValidator`).
- **Validador Asíncrono de Correo Único (`uniqueEmailValidator`):** En `RegisterPage`, la validación de duplicidad de cuenta se realiza de manera no bloqueante:
  - Aplica un operador de retraso reactivo `timer(300)` para debouncear la pulsación de teclas.
  - Comprueba la disponibilidad del correo frente al servicio simulado.
  - Cancela peticiones obsoletas en vuelo mediante `switchMap`.
- **Accesibilidad en Formularios:** Campos vinculados mediante `aria-invalid`, descripciones de error dinámicas asociadas por `aria-describedby` y contenedores de notificación con `role="alert"` y `aria-live="assertive"` para lectores de pantalla.

### RA 3: Componentes Reutilizables y Agnósticos (20%)
- **Componentes Dumb/Presentational Desacoplados:**
  - `DataTableComponent` (`<app-data-table>`): Componente agnóstico de tabla que abstrae la renderización de datos tabulares, admitiendo columnas configurables (`TableColumn[]`), ordenación, badges semánticos, paginación configurable y acciones personalizadas por fila emitidas hacia el componente padre mediante `@Output() actionTriggered`.
  - `MetricCardComponent` (`<app-metric-card>`): Widget KPI reutilizable que recibe valores numéricos, títulos, iconos dinámicos y métricas de tendencia (`trend`), calculando indicadores visuales y accesibles de estado (`success`, `warning`, `danger`).
- **Ciclo de Vida Completo y Limpieza de Recursos:**
  - Ambos componentes implementan rigurosamente las interfaces de ciclo de vida de Angular: `OnInit`, `OnChanges` y `OnDestroy`.
  - En `data-table.component.ts`, la barra de búsqueda reactiva procesa el flujo mediante `debounceTime(300)` y `distinctUntilChanged()`, asegurando la liberación absoluta de memoria en `ngOnDestroy()` mediante el operador `takeUntil(this.destroy$)`.

### RA 4: Diseño Adaptativo, Estilos y Accesibilidad Universal (15%)
- **Filosofía Mobile-First y Diseño Responsivo:** Estructura basada en rejilla flexible de Ionic Grid (`ion-grid`, `ion-row`, `ion-col`) con puntos de interrupción adaptativos que garantizan visualización óptima desde dispositivos móviles (320px) hasta monitores ultrapanorámicos (4K).
- **Design Tokens y Cumplimiento WCAG 2.1 AA/AAA:**
  - Paleta cromática corporativa configurada mediante variables CSS (`src/theme/variables.scss`), con contrastes de color verificados superiores a **4.5:1** en texto normal y **7:1** en elementos de alta prioridad (AAA).
  - Estilos de foco visible mejorados (`:focus-visible`) con contorno de 3px en contraste inverso, asegurando navegabilidad completa mediante teclado (`Tab`, `Shift+Tab`, `Enter`, `Space`, `Escape`).
  - Atributos semánticos WAI-ARIA enriquecidos: `role="region"`, `role="table"`, `role="columnheader"`, `role="status"`, `aria-label`, y textos alternativos ocultos para lectores de pantalla (`.sr-only`).
  - Respeto explícito a las preferencias de usuario del sistema operativo mediante media queries `@media (prefers-reduced-motion: reduce)`.

### RA 5: Concurrencia de Datos, Visualización y Exportación (15%)
- **Concurrencia Asíncrona con `forkJoin`:** En `DashboardPage`, la carga inicial orquesta en paralelo dos orígenes de datos desacoplados:
  - `SqlMockService`: Emula una base de datos relacional transaccional (tickets, resoluciones, categorías) con retardo controlado de red (300ms).
  - `NoSqlMockService`: Emula una base de datos documental/series temporales que reporta telemetría de servidores y métricas en vivo.
  - La sincronización mediante `forkJoin` garantiza que la interfaz solo presenta los KPIs y gráficos cuando todos los flujos han emitido con éxito, gestionando estados de carga (`loadingState`) transparentes.
- **Visualización Interactiva con Chart.js:** Generación dinámica de gráficos de barras (distribución de tickets por estado y prioridad) y gráficos tipo Donut (utilización de recursos de servidores).
- **Exportación de Informes Profesionales:**
  - **PDF:** Implementado a través de `ExportService` con `jspdf` y `jspdf-autotable`, generando documentos tabulados con diseño vectorial corporativo, paginación automática, fecha de expedición y metadatos académicos de autoría.
  - **CSV:** Generación nativa en cliente codificada en UTF-8 mediante `Blob` y enlace de descarga automática para interoperabilidad con suites ofimáticas (Excel, LibreOffice).

### RA 6: Documentación Técnica y Manual de Usuario (10%)
- **Compodoc Automatizado:** Generación de documentación técnica estática mediante `@compodoc/compodoc`, analizando árboles de dependencias, propiedades `@Input`/`@Output`, contratos de servicios y modelos tipados.
- **Comentarios JSDoc Estrictos:** El 100% de clases, métodos, interfaces y componentes cuentan con anotaciones estructuradas con descripción, parámetros (`@param`) y valores de retorno (`@returns`).
- **Manual de Usuario Integrado:** Centro de ayuda embebido en `/help` interactivo con formato accordion y manual detallado de operaciones.

### RA 7: Control de Versiones, Git Flow y Despliegue en Producción (5%)
- **Estrategia Git Flow Estricta:**
  - Rama `main`: Código de producción estable etiquetado (`release: v1.0.0`).
  - Rama `develop`: Rama base de desarrollo e integración continua.
  - Ramas de características (`feature/*`): Desarrolladas de forma aislada e integradas en `develop` mediante fusiones explícitas sin avance rápido (`--no-ff`).
  - Convención **Conventional Commits** (`feat:`, `fix:`, `style:`, `docs:`, `refactor:`, `chore:`).
- **Preparación para Producción:**
  - Build optimizado con Angular Ahead-of-Time (AOT), Tree-Shaking, minimización de estilos y compresión de assets (`npm run build:prod` -> `www/`).
  - Configuración declarativa `vercel.json` con soporte para rutas SPA (reescrituras hacia `index.html`), caché inmutable para assets estáticos y cabeceras de seguridad HTTP (`X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`).

---

## 📖 4. Manual de Usuario Paso a Paso

### 4.1. Acceso al Sistema (Login)
1. Inicie la aplicación en el navegador. La ruta raíz `/` redirigirá automáticamente a `/login`.
2. Para acceder manualmente, introduzca el correo electrónico y contraseña.
3. Para agilizar la evaluación, pulse directamente sobre los botones rápidos:
   - **"Acceso Rápido Administrador"** para cargar `admin@enterprise.io`.
   - **"Acceso Rápido Usuario"** para cargar `user@enterprise.io`.
4. Pulse **"Iniciar Sesión"** o presione `Enter`. El sistema validará las credenciales y le redirigirá al módulo correspondiente.

### 4.2. Registro de Nuevas Cuentas con Validación Asíncrona
1. Desde la pantalla de Login, pulse en el enlace **"¿No tienes cuenta? Regístrate aquí"**.
2. Complete el formulario de registro:
   - **Nombre completo:** Mínimo 3 caracteres.
   - **Correo Electrónico:** Introduzca un correo corporativo. Si prueba a escribir `admin@enterprise.io` o `user@enterprise.io`, observará cómo el validador asíncrono detecta la duplicidad tras 300ms y muestra un mensaje de advertencia accesible sin enviar el formulario.
   - **Contraseña:** Requiere al menos 8 caracteres, una letra mayúscula, una minúscula y un número.
   - **Confirmar Contraseña:** Validación cruzada en tiempo real.
3. Al completar los campos válidos, el botón de envío se habilitará. Al registrarse, se iniciará sesión automáticamente.

### 4.3. Dashboard de Monitorización (Solo Perfil ADMIN)
1. Tras iniciar sesión como Administrador, se abrirá `/dashboard`.
2. **KPIs en Tiempo Real:** En la zona superior se muestran 4 tarjetas con indicadores de tickets abiertos, tiempo medio de resolución, servidores activos y tasa de cumplimiento de SLA.
3. **Gráficos Analíticos:** Inspeccione visualmente el estado del parque de servidores y la volumetría de tickets clasificados por gravedad.
4. **Exportación Rápida:** Utilice los botones superiores **"Exportar PDF"** o **"Exportar CSV"** para descargar instantáneamente el informe consolidado.

### 4.4. Gestión y Filtrado de Tickets
1. Diríjase a la sección **"Tickets"** desde el menú lateral o la barra de navegación.
2. **Búsqueda Reactiva:** Escriba en la caja de búsqueda cualquier término (identificador, título, asignado o estado). La tabla filtrará al instante respetando el debounce de 300ms.
3. **Paginación:** Utilice los controles numéricos inferiores para navegar entre páginas de resultados.
4. **Creación de Tickets:** Pulse el botón flotante **"+"** o **"Nuevo Ticket"** para desplegar el modal interactivo, complete la información técnica requerida y guarde los cambios.

### 4.5. Navegación por Teclado y Accesibilidad
- La aplicación puede utilizarse íntegramente sin ratón:
  - `Tab`: Avanza al siguiente elemento interactivo (inputs, botones, enlaces).
  - `Shift + Tab`: Retrocede al elemento anterior.
  - `Enter` / `Espacio`: Acciona botones, despliega menús y activa filas en la tabla.
  - `Escape`: Cierra modales y cancela búsquedas.

---

## 💻 5. Comandos de Desarrollo, Compodoc y Producción

### Instalación de Dependencias
```bash
npm install
```

### Servidor de Desarrollo Local
Inicia el entorno de desarrollo local con recarga en caliente:
```bash
npm start
# o alternativamente: ng serve --open
# Disponible en: http://localhost:4200
```

### Generación de Documentación Técnica (Compodoc)
Genera el informe HTML interactivo con la documentación de todos los componentes, servicios y tipos:
```bash
# Generar documentación estática en carpeta documentation/
npx @compodoc/compodoc -p tsconfig.app.json --output documentation

# Iniciar servidor local de visualización de Compodoc
npm run compodoc
# Disponible en: http://localhost:8080
```

### Compilación y Bundle de Producción
Genera el paquete optimizado de producción en la carpeta `www/`:
```bash
npm run build:prod
# Realiza optimización AOT, minificación de CSS/JS y hashing de ficheros.
```

---

## 🌐 6. Despliegue en la Nube (Vercel)

El proyecto cuenta con un archivo `vercel.json` preconfigurado con reglas de reescritura para Single Page Applications (evitando errores 404 al refrescar rutas) y cabeceras de seguridad HTTP:

```bash
# Despliegue directo mediante Vercel CLI
npx vercel --prod
```

---

## 📄 Licencia y Reconocimientos

Proyecto desarrollado bajo fines estrictamente académicos para la superación con máxima calificación del módulo **Desarrollo de Interfaces (Código: 0488)** en el **2º Grado Superior en Desarrollo de Aplicaciones Multiplataforma (DAM)** del **Instituto Nebrija de Formación Profesional**.

**Autor:** Luis Lázaro Pimentel  
*Curso Académico 2025 – 2026*
