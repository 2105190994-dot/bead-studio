const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('app.js', 'utf8');
const prefix = source.slice(0, source.indexOf('function generatePattern()'));
const fakeElement = () => ({
  checked: true,
  getContext: () => ({}),
  style: { setProperty() {} },
  classList: { toggle() {}, add() {}, remove() {} }
});
const context = {
  document: { querySelector: fakeElement, querySelectorAll: () => [] },
  window: {}
};

vm.createContext(context);
vm.runInContext(`${prefix}
  state.cols = 7;
  state.rows = 7;
  els.outlineToggle.checked = true;
  const background = PALETTE_BY_CODE.get('C6');
  const subject = PALETTE_BY_CODE.get('G3');
  const testCells = Array(49).fill(background);
  for (let y = 2; y <= 4; y++) {
    for (let x = 2; x <= 4; x++) testCells[y * 7 + x] = subject;
  }
  const outlined = addSubjectOutline(testCells);
  globalThis.testResult = {
    paletteCount: PALETTE.length,
    firstCode: PALETTE[0].code,
    lastCode: PALETTE.at(-1).code,
    blackHex: PALETTE_BY_CODE.get('H7').hex,
    blackCount: outlined.filter(color => color?.code === 'H7').length,
    centerCode: outlined[24].code,
    cornerCode: outlined[0].code
  };
`, context);

assert.deepEqual(JSON.parse(JSON.stringify(context.testResult)), {
  paletteCount: 221,
  firstCode: 'A1',
  lastCode: 'M15',
  blackHex: '#000000',
  blackCount: 8,
  centerCode: 'G3',
  cornerCode: 'C6'
});
assert.match(source, /if \(color && state\.view === 'codes'\)/, 'color codes must render for every non-empty cell');
assert.doesNotMatch(source, /state\.view === 'codes' && cell >=/, 'mobile-sized cells must not hide their codes');

console.log('pattern logic tests passed');
