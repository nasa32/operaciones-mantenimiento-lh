const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const src = fs.readFileSync(path.join(__dirname, '..', 'public', 'tecnico.js'), 'utf8');
const start = src.indexOf('async function detectImageFormat(file)');
const end = src.indexOf('function withDetectedMime', start);
assert(start >= 0 && end > start, 'Image signature detector exists');
const context = { TextDecoder, File, Blob, Uint8Array };
vm.createContext(context);
vm.runInContext(src.slice(start, end) + '\nthis.detectImageFormat = detectImageFormat;', context);
const fixtures = path.join(__dirname, 'image-fixtures');
async function detect(name, bytes, type='') { return context.detectImageFormat(new File([bytes], name, {type})); }
(async () => {
  const cases = [
    ['sample.jpg', 'jpeg'], ['sample.png', 'png'], ['sample.webp', 'webp'],
    ['sample.gif', 'gif'], ['sample.bmp', 'bmp'], ['sample.avif', 'avif']
  ];
  for (const [name, format] of cases) {
    const bytes = fs.readFileSync(path.join(fixtures, name));
    const actual = await detect(name, bytes, 'application/octet-stream');
    assert.equal(actual.format, format, `${name} detected by binary signature`);
    assert.equal(actual.isImage, true, `${name} recognized as image`);
  }
  // JPEG with misleading HEIC extension/MIME remains JPEG based on its bytes.
  const jpeg = fs.readFileSync(path.join(fixtures, 'sample.jpg'));
  const mislabeledJpeg = await detect('photo.heic', jpeg, 'image/heic');
  assert.equal(mislabeledJpeg.format, 'jpeg');
  assert.equal(mislabeledJpeg.heic, false);
  // HEIC content with misleading JPG name/MIME is detected from ISO-BMFF ftyp.
  const heicHeader = Buffer.alloc(64);
  Buffer.from([0,0,0,24]).copy(heicHeader, 0);
  Buffer.from('ftypheic').copy(heicHeader, 4);
  Buffer.from('mif1heic').copy(heicHeader, 16);
  const mislabeledHeic = await detect('1000847189.jpg', heicHeader, 'image/jpeg');
  assert.equal(mislabeledHeic.heic, true);
  assert.equal(mislabeledHeic.isImage, true);
  console.log(`Image format tests passed: ${cases.length + 2} checks (JPEG, PNG, WebP, GIF, BMP, AVIF and mislabeled-format cases).`);
})().catch(error => { console.error(error); process.exit(1); });
