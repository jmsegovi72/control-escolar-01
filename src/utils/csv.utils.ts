/**
 * Normaliza una cadena de texto (quita espacios, acentos y convierte a minúsculas)
 * para realizar comparaciones seguras.
 */
export function normalizeHeader(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Procesa una línea de un CSV teniendo en cuenta comillas dobles que puedan contener el delimitador.
 */
export function parseCSVLine(line: string, separator = ','): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === separator && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result.map((val) => val.replace(/^"|"$/g, '').trim());
}

/**
 * Parsea un texto plano en formato CSV y lo convierte a una lista de registros clave-valor.
 * Detecta automáticamente si el delimitador es coma (,) o punto y coma (;).
 * Soporta de manera robusta BOM de UTF-8, comillas dobles escapadas y saltos de línea internos.
 */
export function parseCSV(text: string): {
  headers: string[];
  rows: Record<string, string>[];
} {
  // 1. Quitar el BOM si existe (evita problemas de comparación en el primer encabezado)
  const cleanText = text.replace(/^\uFEFF/, '');

  if (!cleanText.trim()) {
    return { headers: [], rows: [] };
  }

  // 2. Detectar el separador buscando la primera línea sin comillas
  let firstLineEndIndex = cleanText.length;
  let inQuotes = false;
  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      firstLineEndIndex = i;
      break;
    }
  }
  const firstLine = cleanText.substring(0, firstLineEndIndex);
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const separator = semicolonCount > commaCount ? ';' : ',';

  // 3. Parser de una sola pasada respetando saltos de línea y comillas escapadas
  const result: string[][] = [];
  let currentRow: string[] = [];
  let currentVal = '';
  inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Comilla doble escapada ("") dentro de comillas
        currentVal += '"';
        i++; // Saltar la siguiente comilla
      } else {
        // Cambiar estado de comillas
        inQuotes = !inQuotes;
      }
    } else if (char === separator && !inQuotes) {
      currentRow.push(currentVal.trim());
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      currentRow.push(currentVal.trim());
      currentVal = '';

      if (currentRow.some((val) => val !== '')) {
        result.push(currentRow);
      }
      currentRow = [];

      // Manejar saltos de línea CRLF (\r\n)
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
    } else {
      currentVal += char;
    }
  }

  // Añadir la última celda/fila pendiente
  if (currentVal !== '' || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    if (currentRow.some((val) => val !== '')) {
      result.push(currentRow);
    }
  }

  if (result.length === 0) {
    return { headers: [], rows: [] };
  }

  // Limpiar y extraer los encabezados
  const headers = result[0].map((h) => h.replace(/^"|"$/g, '').trim());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < result.length; i++) {
    const values = result[i];
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      if (header) {
        // Remover comillas iniciales/finales de los valores de celdas
        const rawVal = values[index] ?? '';
        row[header] = rawVal.replace(/^"|"$/g, '').trim();
      }
    });
    rows.push(row);
  }

  return { headers, rows };
}

/**
 * Compara las cabeceras leídas de un archivo con los campos obligatorios
 * según un mapeo de variantes permitidas.
 */
export function validateCSVHeaders(
  fileHeaders: string[],
  requiredKeys: string[],
  mapping: Record<string, string[]>,
): boolean {
  const normalizedFileHeaders = fileHeaders.map(normalizeHeader);

  return requiredKeys.every((key) => {
    const variants = mapping[key] || [key];
    const normalizedVariants = variants.map(normalizeHeader);
    return normalizedVariants.some((variant) =>
      normalizedFileHeaders.includes(variant),
    );
  });
}

/**
 * Convierte un registro con cabeceras originales del CSV a un objeto
 * estandarizado según las llaves del DTO y su mapeo de variantes.
 */
export function standardizeRow(
  row: Record<string, string>,
  mapping: Record<string, string[]>,
): any {
  const result: any = {};

  for (const [standardKey, variants] of Object.entries(mapping)) {
    const normalizedVariants = variants.map(normalizeHeader);

    // Buscar en el registro original si existe alguna de las variantes
    for (const [originalKey, val] of Object.entries(row)) {
      if (normalizedVariants.includes(normalizeHeader(originalKey))) {
        result[standardKey] = val;
        break;
      }
    }
  }

  return result;
}
