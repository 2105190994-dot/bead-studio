const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('app.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');
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
  const featureMask = new Uint8Array(49);
  const featureCells = Array(49).fill(null);
  for (let y = 1; y <= 5; y++) {
    for (let x = 1; x <= 5; x++) {
      const index = y * 7 + x;
      featureMask[index] = 1;
      featureCells[index] = PALETTE_BY_CODE.get('F1');
    }
  }
  for (let y = 2; y <= 4; y++) {
    for (let x = 2; x <= 4; x++) featureCells[y * 7 + x] = PALETTE_BY_CODE.get('H1');
  }
  featureCells[24] = PALETTE_BY_CODE.get('H7');
  const outlinedFeature = outlineLightFeatures(featureCells, featureMask);
  state.cols = 9;
  state.rows = 7;
  const twinEyeMask = new Uint8Array(63);
  const twinEyeCells = Array(63).fill(null);
  for (let y = 1; y <= 5; y++) {
    for (let x = 1; x <= 7; x++) {
      const index = y * 9 + x;
      twinEyeMask[index] = 1;
      twinEyeCells[index] = PALETTE_BY_CODE.get('F1');
    }
  }
  for (let y = 2; y <= 4; y++) {
    for (let x = 2; x <= 6; x++) twinEyeCells[y * 9 + x] = PALETTE_BY_CODE.get('H1');
  }
  twinEyeCells[3 * 9 + 3] = PALETTE_BY_CODE.get('H7');
  twinEyeCells[3 * 9 + 5] = PALETTE_BY_CODE.get('H7');
  const outlinedTwinEyes = outlineLightFeatures(twinEyeCells, twinEyeMask);
  state.cols = 10;
  state.rows = 10;
  const flatLinePixels = Array.from({ length: 100 }, (_, index) => index % 10 === 5
    ? ({ r: 5, g: 5, b: 5 })
    : ({ r: 238, g: 232, b: 224 }));
  const gradientPixels = Array.from({ length: 100 }, (_, index) => {
    const x = index % 10, y = Math.floor(index / 10);
    return { r: x * 25, g: y * 25, b: (x * 31 + y * 17) % 256 };
  });
  const flatDetection = analyzeTemplate(flatLinePixels);
  const gradientDetection = analyzeTemplate(gradientPixels);
  state.featureEnhance = true;
  const paleCells = Array.from({ length: 100 }, () => PALETTE_BY_CODE.get('H2'));
  const averageFeaturePixels = Array.from({ length: 100 }, () => ({ r: 242, g: 238, b: 230 }));
  const detailFeaturePixels = averageFeaturePixels.map(color => ({ ...color }));
  detailFeaturePixels[55] = { r: 4, g: 4, b: 4 };
  const preservedFeature = preserveDarkFeatureLines(paleCells, detailFeaturePixels, averageFeaturePixels);
  const sampledHighlight = representativeHighlightPixel([
    ...Array.from({ length: 35 }, () => ({ r: 2, g: 2, b: 2 })),
    { r: 252, g: 250, b: 247 }
  ]);
  const darkFeatureCells = Array.from({ length: 100 }, () => PALETTE_BY_CODE.get('H7'));
  const darkAveragePixels = Array.from({ length: 100 }, () => ({ r: 8, g: 8, b: 8 }));
  const highlightFeaturePixels = Array(100).fill(null);
  highlightFeaturePixels[55] = { r: 252, g: 250, b: 247 };
  const preservedHighlight = preserveLightFeatureDetails(darkFeatureCells, highlightFeaturePixels, darkAveragePixels);
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
    detailPaletteHasBlack: detailPalette.some(color => color.code === 'H7'),
    featureWhiteCount: outlinedFeature.filter(color => color?.code === 'H1').length,
    featureBlackCount: outlinedFeature.filter(color => color?.code === 'H7').length,
    twinEyeSeparator: outlinedTwinEyes[3 * 9 + 4].code,
    flatDetection: flatDetection.mode,
    gradientDetection: gradientDetection.mode,
    preservedFeature: preservedFeature[55].code,
    sampledHighlightLuminance: Math.round(luminance(sampledHighlight)),
    preservedHighlight: preservedHighlight[55].code
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
  detailPaletteHasBlack: true,
  featureWhiteCount: 8,
  featureBlackCount: 17,
  twinEyeSeparator: 'H7',
  flatDetection: 'lineart',
  gradientDetection: 'gradient',
  preservedFeature: 'H7',
  sampledHighlightLuminance: 250,
  preservedHighlight: 'H1'
});
assert.match(source, /if \(color && state\.view === 'codes'\)/, 'color codes must render for every non-empty cell');
assert.doesNotMatch(source, /state\.view === 'codes' && cell >=/, 'mobile-sized cells must not hide their codes');
assert.doesNotMatch(source, /backgroundToggle|outlineToggle|addSubjectOutline/, 'legacy independent toggles must stay removed');
assert.match(source, /name="templateMode"/, 'automatic template mode selector must be wired');
assert.match(source, /ERASE_TOOL/, 'manual editing must include a blank-cell eraser');
assert.match(source, /MAX_HISTORY = 100/, 'manual editing must keep a bounded undo history');
assert.match(source, /initializePaletteSelect/, 'all MARD colors must be available for manual editing');
assert.match(source, /savePreferences|restorePreferences/, 'manual settings must survive refresh');
assert.match(source, /loadOnnxRuntime/, 'the AI runtime must be loaded lazily');
assert.match(source, /preserveDarkFeatureLines/, 'gradient mode must preserve small dark facial features');
assert.match(source, /preserveLightFeatureDetails/, 'gradient mode must preserve small bright highlights near dark features');
assert.match(source, /samplePixelLayers/, 'average, dark-detail, and highlight samples must be collected in one efficient pass');
assert.match(html, /id="featureEnhance"/, 'facial feature enhancement must be user-controllable');
assert.doesNotMatch(html, /<script[^>]+ort\.min\.js/, 'ONNX runtime must not block the initial page load');

console.log('pattern logic tests passed');
