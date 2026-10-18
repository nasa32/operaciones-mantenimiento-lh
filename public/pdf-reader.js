// Lector PDF para órdenes OSM. Reconstruye las filas por coordenada vertical,
// reconoce numeraciones con o sin separador y nunca inventa actividades.
function normalizeLine(value) {
  return String(value || '')
    .replace(/[\u00a0\u2007\u202f]/g, ' ')
    .replace(/[‐‑‒–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function isActivitiesHeading(line) {
  const s = normalizeLine(line).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return /actividades?\s+de\s+mantenimiento/.test(s) || /actividades?\s+de\s+servicio/.test(s);
}

function isMaterialsHeading(line) {
  const s = normalizeLine(line).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return /materiales?\s*(?:[-/|]\s*)?repuestos?\s*(?:[-/|]\s*)?insumos?/.test(s) ||
    (/materiales?/.test(s) && /repuestos?/.test(s) && /insumos?/.test(s));
}

// Supports: "01 | Verificación...", "01 Verificación...", "1. Verificación...",
// and fragments emitted by PDF.js where a cell divider is missing.
function isNoiseActivityCell(value) {
  const s = normalizeLine(value).replace(/^[|\s]+|[|\s]+$/g, '');
  if (!s || /^[._\-=—–]+$/.test(s)) return true;
  if (/^(?:REG|OT|EQ|COD|CODIGO|CÓDIGO)[- ]?\d{2,}\b/i.test(s)) return true;
  if (/\b[A-Z]{2,6}-\d{2,}\b/.test(s) && !/[.!?]$/.test(s)) return true;
  if (/^(?:n[º°o.]?|fecha|hora|equipo|c[oó]digo|responsable|t[eé]cnico|actividad(?:es)?|descripci[oó]n|observaciones|materiales?|repuestos?|insumos?)\b/i.test(s)) return true;
  return false;
}

// Extrae la descripción desde la fila numerada. Algunas plantillas incluyen
// celdas vacías, bordes o columnas de personal antes/después de la actividad.
function parseNumberedActivity(line) {
  const s = normalizeLine(line).replace(/^\|\s*/, '');
  const match = s.match(/^(\d{1,3})(?:\s*[.)\-:]\s*|\s+|\s*\|\s*)(.*)$/);
  if (!match) return null;
  const number = Number(match[1]);
  let remainder = normalizeLine(match[2] || '');
  if (!Number.isInteger(number) || number < 1 || !remainder) return null;

  // Separar celdas primero y elegir la primera celda que parezca descripción,
  // en lugar de asumir que la primera celda siempre contiene la actividad.
  // Esto evita perder filas como "04 | -------- | Lubricación... | REG-030...".
  const cells = remainder.includes('|')
    ? remainder.split(/\s*\|\s*/).map(normalizeLine).filter(Boolean)
    : [remainder];
  let text = '';
  for (const cell of cells) {
    if (isNoiseActivityCell(cell)) continue;
    // Si un código de personal aparece pegado a la descripción, cortar antes.
    const cleaned = normalizeLine(cell
      .replace(/\s+(?:REG|OT|EQ|COD|CODIGO|CÓDIGO)[- ]?\d{2,}\b.*$/i, '')
      .replace(/\s+[A-Z]{2,6}-\d{2,}\s+.*$/, ''));
    if (isNoiseActivityCell(cleaned) || cleaned.length < 3) continue;
    if (!/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{3}/.test(cleaned)) continue;
    text = cleaned;
    break;
  }
  if (!text || /^(actividad|descripci[oó]n|realizado|resultado|mantenimiento)$/i.test(text)) return null;
  return { number, text };
}

function extractActivitiesFromRows(rows) {
  // Fuente exclusiva: filas geométricas situadas entre el encabezado de
  // actividades y el encabezado de PERSONAL DE MANTENIMIENTO. No se usa la
  // secuencia numérica para validar, contar ni descartar actividades.
  // En algunas plantillas el número y la descripción tienen una diferencia
  // vertical de 0.5–1.5 pt. Agrupamos elementos próximos antes de analizar filas.
  const clusteredRows = [];
  for (const row of rows) {
    const previous = clusteredRows[clusteredRows.length - 1];
    if (previous && Math.abs(Number(previous.y) - Number(row.y)) <= 2.2) {
      previous.items.push(...(row.items || []));
      previous.items.sort((a, b) => a.x - b.x);
      previous.text = normalizeLine(previous.items.map(i => i.text).join(' '));
    } else {
      clusteredRows.push({ ...row, items: [...(row.items || [])] });
    }
  }
  rows = clusteredRows;
  const rowText = row => normalizeLine((row.items || []).map(i => i.text).join(' '));
  const headingIndex = rows.findIndex(r => isActivitiesHeading(rowText(r)));
  if (headingIndex < 0) return { activities: [], activityCount: 0, activityNumbers: [], missingActivityNumbers: [], sequenceComplete: false };

  let endIndex = rows.length;
  for (let i = headingIndex + 1; i < rows.length; i++) {
    const s = rowText(rows[i]).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (/\bpersonal\s+de\s+mantenimiento\b/.test(s) || isMaterialsHeading(s) || /observaciones\s*(?:y\/o)?\s*recomendaciones/.test(s)) {
      endIndex = i;
      break;
    }
  }

  const activities = [];
  for (let i = headingIndex + 1; i < endIndex; i++) {
    const row = rows[i];
    const items = (row.items || []).filter(it => normalizeLine(it.text));
    if (!items.length) continue;

    // La tabla OSM tiene una columna estrecha N° a la izquierda. Usamos ese
    // marcador solamente para ubicar el inicio de una fila; nunca exigimos
    // numeración consecutiva ni incluimos el número en el checklist.
    const sorted = [...items].sort((a, b) => a.x - b.x);
    const numberIndex = sorted.findIndex(it => it.x < 70 && /^\s*\d{1,3}\s*[.)]?\s*$/.test(it.text));
    let descriptionItems;
    if (numberIndex >= 0) {
      const numberItem = sorted[numberIndex];
      descriptionItems = sorted.filter((it, idx) => idx !== numberIndex && it.x > numberItem.x + 3 && it.x < 300);
    } else {
      // La numeración solo es una ayuda para detectar la fila, no un requisito.
      // En filas sin número, aceptar texto alineado al inicio de la columna de
      // actividades (x≈73 en la plantilla OSM) y no títulos centrados/subtablas.
      const first = sorted.find(it => normalizeLine(it.text));
      if (!first || first.x < 70 || first.x > 125) continue;
      descriptionItems = sorted.filter(it => it.x >= 70 && it.x < 300);
    }
    if (!descriptionItems.length) continue;

    // Reconstruye únicamente el contenido a la derecha de la columna N°.
    // Los separadores de celda se descartan y no se anexan líneas de otras
    // secciones, porque el rango termina antes del bloque de personal.
    let text = '';
    let previousEnd = -Infinity;
    for (const item of descriptionItems) {
      const raw = normalizeLine(item.text);
      if (!raw || /^[|._\-=—–\s]+$/.test(raw)) continue;
      if (/^(?:REG|OT|EQ|COD|CODIGO|CÓDIGO)[- ]?\d{2,}\b/i.test(raw)) continue;
      const gap = item.x - previousEnd;
      // PDF.js puede entregar cada palabra como fragmento; un hueco de ~1.5 pt
      // ya representa un espacio real en esta plantilla.
      text += text ? (gap > 1.2 ? ' ' : '') + raw : raw;
      previousEnd = item.x + (Number(item.w) || raw.length * 3);
    }
    text = normalizeLine(text)
      .replace(/^[|\s._\-=—–]+/, '')
      .replace(/[|\s_\-=—–]+$/, '')
      .replace(/\s+(?:REG|OT|EQ|COD|CODIGO|CÓDIGO)[- ]?\d{2,}\b.*$/i, '')
      .replace(/\s+[A-Z]{2,6}-\d{2,}\s+.*$/, '')
      .trim();

    if (text.length < 4 || /^[\d\s|._\-=—–]+$/.test(text)) continue;
    if (/^(?:mantenimiento de sistema|actividades? de mantenimiento|n[°ºo.]?)\b/i.test(text)) continue;
    if (/^(?:personal de mantenimiento|materiales|repuestos|insumos|observaciones|nombres y apellidos|especialidad)\b/i.test(text)) continue;
    if (!/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{3}/.test(text)) continue;

    // No deduplicar: dos filas diferentes pueden tener exactamente la misma
    // descripción y ambas deben permanecer en el checklist.
    activities.push(text);
  }

  return { activities, activityCount: activities.length, activityNumbers: [], missingActivityNumbers: [], sequenceComplete: activities.length > 0 };
}

window.extractOTFromPdf = async function(file) {
  if (!file || (file.type !== 'application/pdf' && !String(file.name || '').toLowerCase().endsWith('.pdf'))) {
    throw new Error('Seleccione un archivo PDF válido.');
  }
  const pdfjs = await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';
  const bytes = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data: bytes }).promise;
  const lines = [];
  const rowRecords = [];
  try {
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      const content = await page.getTextContent();
      const pageRows = new Map();
      for (const item of content.items) {
        if (!('str' in item) || !item.str.trim()) continue;
        const y = Math.round(item.transform[5] * 2) / 2;
        if (!pageRows.has(y)) pageRows.set(y, []);
        pageRows.get(y).push({ x: item.transform[4], w: item.width, text: item.str });
      }
      for (const y of [...pageRows.keys()].sort((a, b) => b - a)) {
        const items = pageRows.get(y).sort((a, b) => a.x - b.x);
        let line = '', end = -Infinity;
        for (const item of items) {
          const gap = item.x - end;
          line += line ? (gap > 9 ? ' | ' : gap > 1 ? ' ' : '') + item.text : item.text;
          end = item.x + item.w;
        }
        const normalized = normalizeLine(line);
        lines.push(normalized);
        rowRecords.push({ page: p, y, items, text: normalized });
      }
    }
  } finally {
    await doc.destroy();
  }

  const text = lines.join('\n');
  if (text.replace(/\s/g, '').length < 20) {
    throw new Error('Este PDF parece escaneado y no contiene texto seleccionable. Requiere OCR; revise los datos manualmente por ahora.');
  }
  const fields = {};
  const compact = text.replace(/\s*\|\s*/g, ' | ');
  const findValue = (labels) => {
    for (const label of labels) {
      const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp('(?:^|\\n|\\|)\\s*' + escaped + '\\s*[:：]?\\s*(?:\\|\\s*)?([^\\n|]+)', 'i');
      const m = compact.match(re);
      if (m && m[1]) {
        const value = m[1].trim().replace(/^[:：\-–]+\s*/, '').replace(/\s+/g, ' ');
        if (value && !/^(?:-|—|_+|n\/?a)$/i.test(value)) return value;
      }
    }
    return '';
  };
  // N° AVISO is deliberately not accepted as the OT number.
  const numberMatch = compact.match(/(?:N\s*[°ºo]\s*\.?\s*OT|OT\s*(?:N\s*[°ºo]|NÚMERO|NUMERO)|NÚMERO\s+(?:DE\s+)?OT|ORDEN\s+DE\s+TRABAJO)\s*[:：#\-]?\s*(?:\|\s*)?([A-Z]{0,5}[- ]?\d[\w/-]*)/i);
  if (numberMatch) fields.number = numberMatch[1].trim().replace(/\s+/g, '');
  fields.type = findValue(['TIPO DE MANTENIMIENTO', 'TIPO DE MANTTO', 'TIPO DE MANTO', 'TIPO DE MANT.']);
  fields.area = findValue(['ÁREA DE TRABAJO', 'AREA DE TRABAJO', 'ÁREA', 'AREA']);
  fields.equipment = findValue(['DESCRIPCIÓN', 'DESCRIPCION']);
  fields.description = findValue(['DESCRIPCIÓN DEL TRABAJO', 'DESCRIPCION DEL TRABAJO', 'TRABAJO SOLICITADO', 'DETALLE DEL TRABAJO']);
  fields.technician = findValue(['TÉCNICO RESPONSABLE', 'TECNICO RESPONSABLE', 'TÉCNICO ASIGNADO', 'TECNICO ASIGNADO', 'TÉCNICO', 'TECNICO']);
  for (const key of Object.keys(fields)) if (!fields[key]) delete fields[key];

  const result = extractActivitiesFromRows(rowRecords);
  if (!result.activityCount) {
    throw new Error('Se leyó el PDF, pero no se pudieron identificar descripciones dentro del cuadro “Actividades de mantenimiento”. Verifique que el PDF tenga texto seleccionable; no se extrajo contenido de otras secciones.');
  }
  return {
    fields,
    activities: result.activities,
    activityNumbers: result.activityNumbers,
    activityCount: result.activityCount,
    missingActivityNumbers: result.missingActivityNumbers,
    sequenceComplete: result.sequenceComplete,
    pages: doc.numPages,
    textLength: text.length
  };
};

// Exposed only for automated tests; it does not alter application state.
window.__otActivityParserTest = extractActivitiesFromRows;
