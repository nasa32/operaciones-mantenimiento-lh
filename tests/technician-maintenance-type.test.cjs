const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const source = fs.readFileSync(path.join(__dirname, "../public/tecnico.js"), "utf8");
assert.match(source, /Tipo de mantenimiento:<\/strong> \$\{esc\(o\.type\|\|o\.maintenanceType\|\|o\.maintenance_type/);
console.log("Technician maintenance type checks passed");
