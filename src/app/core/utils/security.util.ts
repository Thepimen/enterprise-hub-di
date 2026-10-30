/**
 * @file security.util.ts
 * @description Utilidades de seguridad defensiva y desinfección de entradas.
 * Mitigación de inyecciones SQL / NoSQL (CWE-89, CWE-943) y neutralización de payloads maliciosos.
 */

/**
 * Patrones conocidos de inyección SQL y operadores de consulta NoSQL peligrosos.
 */
const SQL_INJECTION_PATTERNS = [
  /(--|#|\/\*|\*\/)/gi,                           // Comentarios SQL
  /(\b(DROP|ALTER|TRUNCATE|DELETE|INSERT|UPDATE|UNION|SELECT)\b)/gi, // Palabras clave DDL/DML destructivas
  /(\$where|\$ne|\$gt|\$gte|\$lt|\$lte|\$regex)/gi, // Operadores NoSQL/MongoDB
  /['";]/g,                                       // Delimitadores de cadenas y finalizadores de sentencia
  /(<script\b[^>]*>[\s\S]*?<\/script>)/gi,       // Inyecciones de scripts XSS directos
];

/**
 * Función pura de sanitización y escapado de entradas de texto libre (búsquedas, filtros, títulos).
 * Neutraliza vectores típicos de inyección antes de que sean procesados por capas mock o APIs.
 *
 * @param input Cadena de entrada introducida por el usuario
 * @returns Cadena sanitizada y segura
 */
export function sanitizeQueryInput(input: string | null | undefined): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  let sanitized = input.trim();

  // Eliminar patrones de inyección detectados
  for (const pattern of SQL_INJECTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }

  // Normalizar espacios múltiples
  sanitized = sanitized.replace(/\s{2,}/g, ' ');

  return sanitized;
}

/**
 * Comprueba si una cadena contiene patrones sospechosos de inyección SQL / NoSQL.
 * @param input Cadena a analizar
 * @returns boolean indicando si contiene patrones de ataque
 */
export function containsInjectionPattern(input: string | null | undefined): boolean {
  if (!input || typeof input !== 'string') {
    return false;
  }
  return SQL_INJECTION_PATTERNS.some((pattern) => pattern.test(input));
}
