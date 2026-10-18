const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
global.window = {};
vm.runInThisContext(fs.readFileSync('public/pdf-reader.js', 'utf8'));

function makeRows(lines) {
  return lines.map((line, index) => {
    const y = 900 - index * 12;
    const parts = String(line).split('|').map(x => x.trim()).filter(Boolean);
    const items = [];
    let x = 200;
    const head = /ACTIVIDADES DE MANTENIMIENTO|PERSONAL DE MANTENIMIENTO|MATERIALES - REPUESTOS - INSUMOS|OBSERVACIONES Y\/O RECOMENDACIONES/i.test(line);
    if (head) return { page: 1, y, items: [{ x: 200, w: line.length * 4, text: line }] };
    const numbered = line.match(/^\s*(\d{1,3})\s*(?:[.)-]?\s*)(.*)$/);
    if (numbered && numbered[2].trim()) {
      items.push({ x: 55, w: 9, text: numbered[1] });
      let desc = numbered[2].trim();
      const cells = desc.split('|').map(x => x.trim()).filter(Boolean);
      let cx = 73;
      for (const cell of cells) { items.push({ x: cx, w: cell.length * 4, text: cell }); cx += Math.max(30, cell.length * 4 + 10); }
    } else if (numbered && !numbered[2].trim()) {
      items.push({ x: 55, w: 9, text: numbered[1] });
    } else {
      const chunks = parts.length ? parts : [line];
      x = 73;
      for (const chunk of chunks) { items.push({ x, w: chunk.length * 4, text: chunk }); x += Math.max(30, chunk.length * 4 + 10); }
    }
    return { page: 1, y, items };
  });
}

const activities = [
 'ACTIVIDADES DE MANTENIMIENTO Y/O SERVICIO',
 'Mantenimiento de Sistema de Combustible',
 '01 Verificación de niveles de combustible.',
 '02 Inspección de filtros de combustible.',
 '03 Cambio de filtros de combustible.',
 '04 Revisión de bombas de combustible.',
 '05 Lubricación de componentes del sistema de combustible.',
 '06 Prueba de funcionamiento del sistema.',
 '07 Revisión de fugas en el sistema.',
 '08 Ajuste de válvulas de control.',
 '09 Limpieza de componentes del sistema de combustible.',
 '10 Prueba de funcionamiento del sistema.',
 'PERSONAL DE MANTENIMIENTO',
 'NOMBRES Y APELLIDOS',
 'Isaias Pantaleon Hernadez',
 'Electricista',
 'Tornero',
 'MATERIALES - REPUESTOS - INSUMOS',
 'Filtro de combustible x 2'
];
const result = window.__otActivityParserTest(makeRows(activities));
assert.equal(result.activityCount, 10);
assert.deepEqual(result.activities, [
 'Verificación de niveles de combustible.',
 'Inspección de filtros de combustible.',
 'Cambio de filtros de combustible.',
 'Revisión de bombas de combustible.',
 'Lubricación de componentes del sistema de combustible.',
 'Prueba de funcionamiento del sistema.',
 'Revisión de fugas en el sistema.',
 'Ajuste de válvulas de control.',
 'Limpieza de componentes del sistema de combustible.',
 'Prueba de funcionamiento del sistema.'
]);
assert.equal(result.activities.some(x => /Isaias|Electricista|Tornero|NOMBRES|Filtro de combustible x 2/.test(x)), false);

for (const count of [3, 7, 17, 25]) {
  const lines = ['ACTIVIDADES DE MANTENIMIENTO Y/O SERVICIO', ...Array.from({length: count}, (_, i) => `${i+1} Revisión preventiva del equipo número ${i+1}`), 'PERSONAL DE MANTENIMIENTO'];
  assert.equal(window.__otActivityParserTest(makeRows(lines)).activityCount, count);
}
const unnumbered = ['ACTIVIDADES DE MANTENIMIENTO Y/O SERVICIO', 'Verificación de niveles de combustible.', 'Inspección de filtros de combustible.', 'Cambio de filtros de combustible.', 'PERSONAL DE MANTENIMIENTO', 'Isaias Pantaleon Hernadez'];
assert.deepEqual(window.__otActivityParserTest(makeRows(unnumbered)).activities, ['Verificación de niveles de combustible.', 'Inspección de filtros de combustible.', 'Cambio de filtros de combustible.']);
console.log('OK: 10 actividades de OT 0042; nombres y especialidades excluidos; duplicados conservados; conteos variables y filas sin numeración probados.');
