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
  const background = PALETTE_BY_CODE.get('C6');
  const subject = PALETTE_BY_CODE.get('G3');
  const testPixels = Array.from({ length: 49 }, () => ({ ...background.rgb }));
  for (let y = 2; y <= 4; y++) {
    for (let x = 2; x <= 4; x++) testPixels[y * 7 + x] = { ...subject.rgb };
  }

  state.compositionMode = 'all';
  const completeImage = composePattern(testPixels);
  state.compositionMode = 'subject';
  const subjectOnly = composePattern(testPixels);
  const detailPixel = representativePixel([
    ...Array.from({ length: 14 }, () => ({ r: 248, g: 248, b: 248 })),
    { r: 0, g: 0, b: 0 }, { r: 8, g: 8, b: 8 }
  ]);
  const paletteProbe = PALETTE
    .filter(color => color.code !== 'H1' && color.code !== 'H7' && luminance(color.rgb) > 90 && luminance(color.rgb) < 235)
    .slice(0, 20)
    .flatMap(color => Array.from({ length: 4 }, () => ({ ...color.rgb })));
  paletteProbe.push({ r: 0, g: 0, b: 0 });
  const detailPalette = selectPalette(paletteProbe, 4);
  globalThis.testResult = {
    paletteCount: PALETTE.length,
    firstCode: PALETTE[0].code,
    lastCode: PALETTE.at(-1).code,
    blackHex: PALETTE_BY_CODE.get('H7').hex,
    completeBlackCount: completeImage.filter(color => color?.code === 'H7').length,
    completeBlankCount: completeImage.filter(color => color === null).length,
    completeCornerCode: completeImage[0].code,
    subjectBlackCount: subjectOnly.filter(color => color?.code === 'H7').length,
    subjectBlankCount: subjectOnly.filter(color => color === null).length,
    subjectColorCount: subjectOnly.filter(color => color && color.code !== 'H7').length,
    subjectCenterCode: subjectOnly[24].code,
    subjectCorner: subjectOnly[0],
    detailPixelLuminance: luminance(detailPixel),
    detailPaletteHasBlack: detailPalette.some(color => color.code === 'H7')
  };
`, context);

assert.deepEqual(JSON.parse(JSON.stringify(context.testResult)), {
  paletteCount: 221,
  firstCode: 'A1',
  lastCode: 'M15',
  blackHex: '#000000',
  completeBlackCount: 0,
  completeBlankCount: 0,
  completeCornerCode: 'C6',
  subjectBlackCount: 16,
  subjectBlankCount: 24,
  subjectColorCount: 9,
  subjectCenterCode: 'G3',
  subjectCorner: null,
  detailPixelLuminance: 4,
  detailPaletteHasBlack: true
});
assert.match(source, /if \(color && state\.view === 'codes'\)/, 'color codes must render for every non-empty cell');
assert.doesNotMatch(source, /state\.view === 'codes' && cell >=/, 'mobile-sized cells must not hide their codes');
assert.doesNotMatch(source, /backgroundToggle|outlineToggle|addSubjectOutline/, 'legacy independent toggles must stay removed');

console.log('pattern logic tests passed');
