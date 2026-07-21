// MARD standard 221-color palette (A-H + M). Values are screen-reference HEX
// colors from the public MARD chart; physical beads can still vary by batch.
const MARD_221_SERIES = {
  A: 'FAF4C8 FFFFD5 FEFF8B FBED56 F4D738 FEAC4C FE8B4C FFDA45 FF995B F77C31 FFDD99 FE9F72 FFC365 FD543D FFF365 FFFF9F FFE36E FEBE7D FD7C72 FFD568 FFE395 F4F57D E6C9B7 F7F8A2 FFD67D FFC830',
  B: 'E6EE31 63F347 9EF780 5DE035 35E352 65E2A6 3DAF80 1C9C4F 27523A 95D3C2 5D722A 166F41 CAEB7B ADE946 2E5132 C5ED9C 9BB13A E6EE49 24B88C C2F0CC 156A6B 0B3C43 303A21 EEFCA5 4E846D 8D7A35 CCE1AF 9EE5B9 C5E254 E2FCB1 B0E792 9CAB5A',
  C: 'E8FFE7 A9F9FC A0E2FB 41CCFF 01ACEB 50AAF0 3677D2 0F54C0 324BCA 3EBCE2 28DDDE 1C334D CDE8FF D5FDFF 22C4C6 1557A8 04D1F6 1D3344 1887A2 176DAF BEDDFF 67B4BE C8E2FF 7CC4FF A9E5E5 3CAED8 D3DFFA BBCFED 34488E',
  D: 'AEB4F2 858EDD 2F54AF 182A84 B843C5 AC7BDE 8854B3 E2D3FF D5B9F8 361851 B9BAE1 DE9AD4 B90095 8B279B 2F1F90 E3E1EE C4D4F6 A45EC7 D8C3D7 9C32B2 9A009B 333A95 EBDAFC 7786E5 494FC7 DFC2F8',
  E: 'FDD3CC FEC0DF FFB7E7 E8649E F551A2 F13D74 C63478 FFDBE9 E970CC D33793 FCDDD2 F78FC3 B5006D FFD1BA F8C7C9 FFF3EB FFE2EA FFC7DB FEBAD5 D8C7D1 BD9DA1 B785A1 937A8D E1BCE8',
  F: 'FD957B FC3D46 F74941 FC283C E7002F 943630 971937 BC0028 E2677A 8A4526 5A2121 FD4E6A F35744 FFA9AD D30022 FEC2A6 E69C79 D37C46 C1444A CD9391 F7B4C6 FDC0D0 F67E66 E698AA E54B4F',
  G: 'FFE2CE FFC4AA F4C3A5 E1B383 EDB045 E99C17 9D5B3E 753832 E6B483 D98C39 E0C593 FFC890 B7714A 8D614C FCF9E0 F2D9BA 78524B FFE4CC E07935 A94023 B88558',
  H: 'FDFBFF FEFFFF B6B1BA 89858C 48464E 2F2B2F 000000 E7D6DB EDEDED EEE9EA CECDD5 FFF5ED F5ECD2 CFD7D3 98A6A8 1D1414 F1EDED FFFDF0 F6EFE2 949FA3 FFFBE1 CACAD4 9A9D94',
  M: 'BCC6B8 8AA386 697D80 E3D2BC D0CCAA B0A782 B4A497 B38281 A58767 C5B2BC 9F7594 644749 D19066 C77362 757D78'
};

const MARD_SERIES_NAMES = { A: '黄橙系', B: '绿色系', C: '蓝青系', D: '蓝紫系', E: '粉玫系', F: '红色系', G: '棕肤系', H: '黑白灰系', M: '大地系' };
const PALETTE = Object.entries(MARD_221_SERIES).flatMap(([series, values]) => values.split(' ').map((value, index) => {
  const code = `${series}${index + 1}`;
  const hex = `#${value}`;
  const rgb = hexToRgb(hex);
  return { code, name: `${MARD_SERIES_NAMES[series]} · MARD ${code}`, hex, rgb, lab: rgbToLab(rgb) };
}));
const PALETTE_BY_CODE = new Map(PALETTE.map(color => [color.code, color]));

const els = {
  fileInput: document.querySelector('#fileInput'), uploadZone: document.querySelector('#uploadZone'),
  fileRow: document.querySelector('#fileRow'), fileThumb: document.querySelector('#fileThumb'),
  fileName: document.querySelector('#fileName'), fileMeta: document.querySelector('#fileMeta'),
  replaceButton: document.querySelector('#replaceButton'), demoButton: document.querySelector('#demoButton'),
  emptyUploadButton: document.querySelector('#emptyUploadButton'), gridRange: document.querySelector('#gridRange'),
  gridNumber: document.querySelector('#gridNumber'), gridMinus: document.querySelector('#gridMinus'),
  gridPlus: document.querySelector('#gridPlus'), colorRange: document.querySelector('#colorRange'),
  colorOutput: document.querySelector('#colorOutput'),
  compositionModes: [...document.querySelectorAll('input[name="compositionMode"]')],
  generateButton: document.querySelector('#generateButton'), emptyState: document.querySelector('#emptyState'),
  canvasWrap: document.querySelector('#canvasWrap'), patternCanvas: document.querySelector('#patternCanvas'),
  sourceCanvas: document.querySelector('#sourceCanvas'), processing: document.querySelector('#processing'),
  canvasSize: document.querySelector('#canvasSize'), canvasStage: document.querySelector('#canvasStage'),
  zoomOut: document.querySelector('#zoomOut'), zoomIn: document.querySelector('#zoomIn'),
  zoomLabel: document.querySelector('#zoomLabel'), fitButton: document.querySelector('#fitButton'),
  resultSection: document.querySelector('#resultSection'), legendGrid: document.querySelector('#legendGrid'),
  totalBeads: document.querySelector('#totalBeads'), totalColors: document.querySelector('#totalColors'),
  boardCount: document.querySelector('#boardCount'), downloadButton: document.querySelector('#downloadButton'),
  printButton: document.querySelector('#printButton')
};

const state = {
  image: null, fileName: '', cols: 48, rows: 48, colors: 16, cells: [], selectedColor: null,
  view: 'codes', zoom: 1, generated: false, compositionMode: 'all'
};

const patternCtx = els.patternCanvas.getContext('2d');
const sourceCtx = els.sourceCanvas.getContext('2d', { willReadFrequently: true });

function hexToRgb(hex) {
  const value = parseInt(hex.slice(1), 16);
  return { r: value >> 16, g: (value >> 8) & 255, b: value & 255 };
}

function luminance({ r, g, b }) { return .2126 * r + .7152 * g + .0722 * b; }
function rgbToLab({ r, g, b }) {
  const linear = value => {
    const channel = value / 255;
    return channel > .04045 ? ((channel + .055) / 1.055) ** 2.4 : channel / 12.92;
  };
  const red = linear(r), green = linear(g), blue = linear(b);
  const x = (red * .4124564 + green * .3575761 + blue * .1804375) / .95047;
  const y = red * .2126729 + green * .7151522 + blue * .072175;
  const z = (red * .0193339 + green * .119192 + blue * .9503041) / 1.08883;
  const pivot = value => value > .008856 ? Math.cbrt(value) : 7.787 * value + 16 / 116;
  return { l: 116 * pivot(y) - 16, a: 500 * (pivot(x) - pivot(y)), b: 200 * (pivot(y) - pivot(z)) };
}

function labDistance(a, b) {
  const dl = a.l - b.l, da = a.a - b.a, db = a.b - b.b;
  return dl * dl + da * da + db * db;
}

function nearestPaletteColor(pixel, palette = PALETTE) {
  const lab = rgbToLab(pixel);
  return palette.reduce((best, color) => {
    const dist = labDistance(lab, color.lab);
    return dist < best.dist ? { color, dist } : best;
  }, { color: palette[0], dist: Infinity }).color;
}

function setRangeFill(input) {
  const ratio = (input.value - input.min) / (input.max - input.min) * 100;
  input.style.setProperty('--fill', `${ratio}%`);
}

function setGrid(value, regenerate = true) {
  state.cols = Math.max(12, Math.min(100, Number(value) || 48));
  els.gridRange.value = state.cols;
  els.gridNumber.value = state.cols;
  setRangeFill(els.gridRange);
  document.querySelectorAll('[data-preset]').forEach(button => {
    const targets = { simple: 32, balanced: 48, detail: 64 };
    button.classList.toggle('active', targets[button.dataset.preset] === state.cols);
  });
  updateEstimatedSize();
  if (regenerate && state.image) scheduleGenerate();
}

function updateEstimatedSize() {
  const ratio = state.image ? state.image.naturalHeight / state.image.naturalWidth : 1;
  const rows = Math.max(1, Math.round(state.cols * ratio));
  els.canvasSize.textContent = `${state.cols} × ${rows} 格`;
}

let generationTimer;
function scheduleGenerate() {
  clearTimeout(generationTimer);
  generationTimer = setTimeout(generatePattern, 260);
}

function loadFile(file) {
  if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = event => {
    const image = new Image();
    image.onload = () => {
      state.image = image;
      state.fileName = file.name;
      els.fileThumb.src = event.target.result;
      els.fileName.textContent = file.name;
      els.fileMeta.textContent = `${image.naturalWidth} × ${image.naturalHeight}`;
      els.uploadZone.hidden = true;
      els.fileRow.hidden = false;
      const suggested = autoGridSize(image.naturalWidth, image.naturalHeight);
      setGrid(suggested, false);
      generatePattern();
    };
    image.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

function autoGridSize(width, height) {
  const longSide = Math.max(width, height);
  const shortSide = Math.min(width, height);
  const detailBias = Math.min(8, Math.round((longSide / Math.max(1, shortSide) - 1) * 4));
  return Math.max(36, Math.min(56, 48 - detailBias));
}

function createDemo() {
  const canvas = document.createElement('canvas');
  canvas.width = 720; canvas.height = 640;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 720, 640);
  ctx.fillStyle = '#f2c94c'; ctx.beginPath(); ctx.arc(360, 335, 202, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#dca63a';
  ctx.beginPath(); ctx.moveTo(212, 208); ctx.lineTo(160, 80); ctx.lineTo(300, 164); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(508, 208); ctx.lineTo(560, 80); ctx.lineTo(420, 164); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#fff0d1'; ctx.beginPath(); ctx.ellipse(360, 400, 130, 108, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#3e332a'; ctx.beginPath(); ctx.arc(295, 307, 20, 0, Math.PI * 2); ctx.arc(425, 307, 20, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2b2420'; ctx.beginPath(); ctx.ellipse(360, 380, 26, 19, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#2b2420'; ctx.lineWidth = 9; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(360, 399); ctx.quadraticCurveTo(335, 430, 307, 409); ctx.moveTo(360, 399); ctx.quadraticCurveTo(385, 430, 413, 409); ctx.stroke();
  ctx.fillStyle = '#f18b94'; ctx.beginPath(); ctx.ellipse(257, 369, 31, 18, 0, 0, Math.PI * 2); ctx.ellipse(463, 369, 31, 18, 0, 0, Math.PI * 2); ctx.fill();
  const image = new Image();
  image.onload = () => {
    state.image = image; state.fileName = '柯基示例.png';
    els.fileThumb.src = canvas.toDataURL('image/png');
    els.fileName.textContent = state.fileName; els.fileMeta.textContent = '720 × 640';
    els.uploadZone.hidden = true; els.fileRow.hidden = false; setGrid(48, false); generatePattern();
  };
  image.src = canvas.toDataURL('image/png');
}

function samplePixels() {
  const ratio = state.image.naturalHeight / state.image.naturalWidth;
  state.rows = Math.max(1, Math.round(state.cols * ratio));
  els.sourceCanvas.width = state.cols; els.sourceCanvas.height = state.rows;
  sourceCtx.clearRect(0, 0, state.cols, state.rows);
  sourceCtx.imageSmoothingEnabled = true;
  sourceCtx.imageSmoothingQuality = 'high';
  sourceCtx.drawImage(state.image, 0, 0, state.cols, state.rows);
  const data = sourceCtx.getImageData(0, 0, state.cols, state.rows).data;
  const pixels = [];
  for (let i = 0; i < data.length; i += 4) {
    const rgb = { r: data[i], g: data[i + 1], b: data[i + 2] };
    const isBlank = data[i + 3] < 60;
    pixels.push(isBlank ? null : rgb);
  }
  return pixels;
}

function selectPalette(pixels, count) {
  const frequencies = new Map(PALETTE.map(color => [color.code, 0]));
  pixels.forEach(pixel => {
    if (!pixel) return;
    const nearest = nearestPaletteColor(pixel);
    frequencies.set(nearest.code, frequencies.get(nearest.code) + 1);
  });
  const ranked = [...PALETTE].sort((a, b) => frequencies.get(b.code) - frequencies.get(a.code));
  const selected = ranked.slice(0, Math.min(count, ranked.filter(c => frequencies.get(c.code) > 0).length || 1));
  const essentials = ranked.filter(c => frequencies.get(c.code) > 0 && (luminance(c.rgb) < 45 || luminance(c.rgb) > 242));
  essentials.forEach(color => { if (!selected.includes(color) && selected.length) selected[selected.length - 1] = color; });
  return [...new Map(selected.map(c => [c.code, c])).values()];
}

function quantize(pixels) {
  const selectedPalette = selectPalette(pixels, state.colors);
  return pixels.map(pixel => {
    if (!pixel) return null;
    return nearestPaletteColor(pixel, selectedPalette);
  });
}

const EIGHT_NEIGHBORS = [[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]];

function detectBorderBackground(cells) {
  const borderIndexes = new Set();
  const borderStats = new Map();
  const record = (index, side) => {
    borderIndexes.add(index);
    const code = cells[index]?.code;
    if (!code) return;
    const stats = borderStats.get(code) || { count: 0, sides: 0 };
    stats.count += 1;
    stats.sides |= side;
    borderStats.set(code, stats);
  };
  for (let x = 0; x < state.cols; x++) {
    record(x, 1);
    if (state.rows > 1) record((state.rows - 1) * state.cols + x, 2);
  }
  for (let y = 0; y < state.rows; y++) {
    record(y * state.cols, 4);
    if (state.cols > 1) record(y * state.cols + state.cols - 1, 8);
  }

  const sideCount = bits => (bits & 1 ? 1 : 0) + (bits & 2 ? 1 : 0) + (bits & 4 ? 1 : 0) + (bits & 8 ? 1 : 0);
  const backgroundCodes = new Set(
    [...borderStats.entries()]
      .filter(([code, stats]) => code !== 'H7' && stats.count >= 2 && sideCount(stats.sides) >= 2)
      .map(([code]) => code)
  );
  if (!backgroundCodes.size) {
    [...borderStats.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 2)
      .forEach(([code]) => { if (code !== 'H7') backgroundCodes.add(code); });
  }

  const background = new Uint8Array(cells.length);
  const queue = [];
  const canBeBackground = index => !cells[index] || backgroundCodes.has(cells[index].code);
  borderIndexes.forEach(index => {
    if (canBeBackground(index)) {
      background[index] = 1;
      queue.push(index);
    }
  });
  for (let head = 0; head < queue.length; head++) {
    const index = queue[head], x = index % state.cols, y = Math.floor(index / state.cols);
    const neighbors = [];
    if (x > 0) neighbors.push(index - 1);
    if (x + 1 < state.cols) neighbors.push(index + 1);
    if (y > 0) neighbors.push(index - state.cols);
    if (y + 1 < state.rows) neighbors.push(index + state.cols);
    neighbors.forEach(next => {
      if (!background[next] && canBeBackground(next)) {
        background[next] = 1;
        queue.push(next);
      }
    });
  }
  return background;
}

function extractSubjectMask(cells) {
  const background = detectBorderBackground(cells);
  const candidate = new Uint8Array(cells.length);
  cells.forEach((color, index) => { if (color && !background[index]) candidate[index] = 1; });

  const visited = new Uint8Array(cells.length);
  const components = [];
  candidate.forEach((value, start) => {
    if (!value || visited[start]) return;
    const component = [], queue = [start];
    visited[start] = 1;
    for (let head = 0; head < queue.length; head++) {
      const index = queue[head], x = index % state.cols, y = Math.floor(index / state.cols);
      component.push(index);
      EIGHT_NEIGHBORS.forEach(([dx, dy]) => {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= state.cols || ny >= state.rows) return;
        const next = ny * state.cols + nx;
        if (candidate[next] && !visited[next]) {
          visited[next] = 1;
          queue.push(next);
        }
      });
    }
    components.push(component);
  });

  const largest = Math.max(0, ...components.map(component => component.length));
  const minimumComponent = Math.max(4, Math.ceil(largest * .08));
  const subject = new Uint8Array(cells.length);
  components.filter(component => component.length >= minimumComponent).forEach(component => {
    component.forEach(index => { subject[index] = 1; });
  });
  return subject;
}

function outlineSubject(cells, subjectMask) {
  const black = PALETTE_BY_CODE.get('H7');
  return cells.map((color, index) => {
    if (!subjectMask[index] || !color) return null;
    const x = index % state.cols, y = Math.floor(index / state.cols);
    const touchesOutside = EIGHT_NEIGHBORS.some(([dx, dy]) => {
      const nx = x + dx, ny = y + dy;
      return nx < 0 || ny < 0 || nx >= state.cols || ny >= state.rows || !subjectMask[ny * state.cols + nx];
    });
    return touchesOutside ? black : color;
  });
}

function composePattern(pixels) {
  if (state.compositionMode === 'all') return quantize(pixels);
  const draft = quantize(pixels);
  const subjectMask = extractSubjectMask(draft);
  const subjectPixels = pixels.map((pixel, index) => subjectMask[index] ? pixel : null);
  return outlineSubject(quantize(subjectPixels), subjectMask);
}

function generatePattern() {
  if (!state.image) { els.fileInput.click(); return; }
  els.processing.hidden = false;
  requestAnimationFrame(() => setTimeout(() => {
    const pixels = samplePixels();
    state.cells = composePattern(pixels);
    state.generated = true; state.selectedColor = null;
    els.emptyState.hidden = true; els.canvasWrap.hidden = false; els.resultSection.hidden = false;
    renderPattern(); renderLegend(); updateStats(); fitCanvas();
    els.processing.hidden = true;
  }, 30));
}

function canvasMetrics(forExport = false) {
  const maxDisplayWidth = Math.max(420, els.canvasStage.clientWidth - 68);
  const targetCell = forExport ? Math.max(26, state.cols > 70 ? 22 : 30) : Math.max(12, Math.min(26, Math.floor(maxDisplayWidth / (state.cols + 2))));
  const margin = state.view === 'original' ? 0 : targetCell;
  return { cell: targetCell, margin, width: state.cols * targetCell + margin * 2, height: state.rows * targetCell + margin * 2 };
}

function renderPattern(forExport = false) {
  if (!state.generated) return;
  const metrics = canvasMetrics(forExport);
  const dpr = forExport ? 1 : Math.min(2, window.devicePixelRatio || 1);
  els.patternCanvas.width = metrics.width * dpr; els.patternCanvas.height = metrics.height * dpr;
  els.patternCanvas.style.width = `${metrics.width}px`; els.patternCanvas.style.height = `${metrics.height}px`;
  patternCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  patternCtx.clearRect(0, 0, metrics.width, metrics.height);
  patternCtx.fillStyle = '#fff'; patternCtx.fillRect(0, 0, metrics.width, metrics.height);

  if (state.view === 'original') {
    patternCtx.imageSmoothingEnabled = false;
    patternCtx.drawImage(state.image, 0, 0, metrics.width, metrics.height);
    return;
  }

  drawCoordinates(patternCtx, metrics);
  const cell = metrics.cell, margin = metrics.margin;
  state.cells.forEach((color, index) => {
    const x = index % state.cols, y = Math.floor(index / state.cols);
    const px = margin + x * cell, py = margin + y * cell;
    patternCtx.fillStyle = color ? color.hex : '#fff'; patternCtx.fillRect(px, py, cell, cell);
    patternCtx.strokeStyle = x % 5 === 4 || y % 5 === 4 ? '#c8bdb0' : '#ded9d3';
    patternCtx.lineWidth = x % 5 === 4 || y % 5 === 4 ? 1 : .55;
    patternCtx.strokeRect(px + .25, py + .25, cell - .5, cell - .5);
    if (color && state.view === 'codes') {
      patternCtx.fillStyle = luminance(color.rgb) > 145 ? '#3d3833' : '#fff';
      patternCtx.font = `800 ${Math.max(5, cell * .34).toFixed(1)}px Arial Narrow, Segoe UI, Microsoft YaHei, sans-serif`;
      patternCtx.textAlign = 'center'; patternCtx.textBaseline = 'middle';
      patternCtx.fillText(color.code, px + cell / 2, py + cell / 2 + .4);
    }
  });
  patternCtx.strokeStyle = '#8f857c'; patternCtx.lineWidth = 1.2;
  patternCtx.strokeRect(margin, margin, state.cols * cell, state.rows * cell);
}

function drawCoordinates(ctx, { cell, margin, width, height }) {
  ctx.fillStyle = '#faf8f4';
  ctx.fillRect(margin, 0, width - margin * 2, margin);
  ctx.fillRect(0, margin, margin, height - margin * 2);
  ctx.fillRect(margin, height - margin, width - margin * 2, margin);
  ctx.fillRect(width - margin, margin, margin, height - margin * 2);
  ctx.fillStyle = '#68615b'; ctx.font = `700 ${Math.max(7, Math.floor(cell * .34))}px Segoe UI, Microsoft YaHei, sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (let x = 0; x < state.cols; x++) {
    const label = String(x + 1); const px = margin + x * cell + cell / 2;
    if (cell >= 18 || x % 2 === 0) { ctx.fillText(label, px, margin / 2); ctx.fillText(label, px, height - margin / 2); }
  }
  for (let y = 0; y < state.rows; y++) {
    const label = String(y + 1); const py = margin + y * cell + cell / 2;
    if (cell >= 18 || y % 2 === 0) { ctx.fillText(label, margin / 2, py); ctx.fillText(label, width - margin / 2, py); }
  }
}

function countsByColor() {
  const counts = new Map();
  state.cells.forEach(color => { if (color) counts.set(color.code, (counts.get(color.code) || 0) + 1); });
  return [...counts.entries()].map(([code, count]) => ({ color: PALETTE_BY_CODE.get(code), count })).sort((a, b) => b.count - a.count);
}

function renderLegend() {
  const counts = countsByColor();
  els.legendGrid.innerHTML = counts.map(({ color, count }) => {
    const text = luminance(color.rgb) > 145 ? '#35322f' : '#fff';
    return `<button type="button" class="legend-card${state.selectedColor?.code === color.code ? ' selected' : ''}" data-code="${color.code}">
      <span class="swatch" style="background:${color.hex};--text:${text}">${color.code}</span>
      <div><strong>${color.name}</strong><small>${color.hex}</small></div><b>${count} 颗</b>
    </button>`;
  }).join('');
  els.legendGrid.querySelectorAll('.legend-card').forEach(card => card.addEventListener('click', () => {
    state.selectedColor = PALETTE_BY_CODE.get(card.dataset.code);
    renderLegend();
  }));
}

function updateStats() {
  const counts = countsByColor();
  const total = counts.reduce((sum, item) => sum + item.count, 0);
  els.totalBeads.textContent = total.toLocaleString('zh-CN');
  els.totalColors.textContent = counts.length;
  els.boardCount.textContent = Math.max(1, Math.ceil(state.cols / 29) * Math.ceil(state.rows / 29));
  els.canvasSize.textContent = `${state.cols} × ${state.rows} 格`;
}

function fitCanvas() {
  state.zoom = 1; applyZoom();
  requestAnimationFrame(() => {
    const canvasWidth = els.patternCanvas.getBoundingClientRect().width;
    const available = els.canvasStage.clientWidth - 58;
    if (canvasWidth > available) state.zoom = Math.max(.35, available / canvasWidth);
    applyZoom();
  });
}
function applyZoom() { els.canvasWrap.style.transform = `scale(${state.zoom})`; els.zoomLabel.textContent = `${Math.round(state.zoom * 100)}%`; }

function exportPng() {
  if (!state.generated) { els.fileInput.click(); return; }
  const previousView = state.view; state.view = 'codes'; renderPattern(true);
  const link = document.createElement('a');
  link.download = `${(state.fileName || '拼豆图纸').replace(/\.[^.]+$/, '')}-${state.cols}x${state.rows}.png`;
  link.href = els.patternCanvas.toDataURL('image/png'); link.click();
  state.view = previousView; renderPattern(); applyZoom();
}

function editCell(event) {
  if (!state.generated || !state.selectedColor || state.view === 'original') return;
  const rect = els.patternCanvas.getBoundingClientRect();
  const metrics = canvasMetrics(false);
  const x = (event.clientX - rect.left) / rect.width * metrics.width - metrics.margin;
  const y = (event.clientY - rect.top) / rect.height * metrics.height - metrics.margin;
  const col = Math.floor(x / metrics.cell), row = Math.floor(y / metrics.cell);
  if (col < 0 || row < 0 || col >= state.cols || row >= state.rows) return;
  state.cells[row * state.cols + col] = state.selectedColor;
  renderPattern(); renderLegend(); updateStats();
}

els.fileInput.addEventListener('change', event => loadFile(event.target.files[0]));
els.replaceButton.addEventListener('click', () => els.fileInput.click());
els.emptyUploadButton.addEventListener('click', () => els.fileInput.click());
els.demoButton.addEventListener('click', createDemo);
['dragenter', 'dragover'].forEach(type => els.uploadZone.addEventListener(type, event => { event.preventDefault(); els.uploadZone.classList.add('dragging'); }));
['dragleave', 'drop'].forEach(type => els.uploadZone.addEventListener(type, event => { event.preventDefault(); els.uploadZone.classList.remove('dragging'); }));
els.uploadZone.addEventListener('drop', event => loadFile(event.dataTransfer.files[0]));
els.gridRange.addEventListener('input', event => setGrid(event.target.value));
els.gridNumber.addEventListener('change', event => setGrid(event.target.value));
els.gridMinus.addEventListener('click', () => setGrid(state.cols - 1));
els.gridPlus.addEventListener('click', () => setGrid(state.cols + 1));
document.querySelectorAll('[data-preset]').forEach(button => button.addEventListener('click', () => setGrid({ simple: 32, balanced: 48, detail: 64 }[button.dataset.preset])));
els.colorRange.addEventListener('input', event => { state.colors = Number(event.target.value); els.colorOutput.textContent = `${state.colors} 色`; setRangeFill(event.target); if (state.image) scheduleGenerate(); });
els.compositionModes.forEach(input => input.addEventListener('change', event => {
  if (!event.target.checked) return;
  state.compositionMode = event.target.value;
  if (state.image) scheduleGenerate();
}));
els.generateButton.addEventListener('click', generatePattern);
els.zoomOut.addEventListener('click', () => { state.zoom = Math.max(.35, state.zoom - .15); applyZoom(); });
els.zoomIn.addEventListener('click', () => { state.zoom = Math.min(2.5, state.zoom + .15); applyZoom(); });
els.fitButton.addEventListener('click', fitCanvas);
document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => {
  state.view = button.dataset.view;
  document.querySelectorAll('[data-view]').forEach(item => item.classList.toggle('active', item === button));
  renderPattern(); fitCanvas();
}));
els.patternCanvas.addEventListener('click', editCell);
els.downloadButton.addEventListener('click', exportPng);
els.printButton.addEventListener('click', () => state.generated ? window.print() : els.fileInput.click());
window.addEventListener('resize', () => state.generated && fitCanvas());

setRangeFill(els.gridRange); setRangeFill(els.colorRange); updateEstimatedSize();

// --- Legacy pixel-filter workspace kept only for reference; the live UI now uses local neural inference. ---
if (false) {
const cartoonEls = {
  beadMode: document.querySelector('#beadMode'), cartoonMode: document.querySelector('#cartoonMode'),
  beadTopActions: document.querySelector('#beadTopActions'), cartoonTopActions: document.querySelector('#cartoonTopActions'),
  fileInput: document.querySelector('#cartoonFileInput'), uploadZone: document.querySelector('#cartoonUploadZone'),
  fileRow: document.querySelector('#cartoonFileRow'), fileThumb: document.querySelector('#cartoonFileThumb'),
  fileName: document.querySelector('#cartoonFileName'), fileMeta: document.querySelector('#cartoonFileMeta'),
  replaceButton: document.querySelector('#cartoonReplaceButton'), emptyUpload: document.querySelector('#cartoonEmptyUpload'),
  empty: document.querySelector('#cartoonEmpty'), previewGrid: document.querySelector('#cartoonPreviewGrid'),
  originalCanvas: document.querySelector('#cartoonOriginalCanvas'), resultCanvas: document.querySelector('#cartoonResultCanvas'),
  processing: document.querySelector('#cartoonProcessing'), imageSize: document.querySelector('#cartoonImageSize'),
  activeStyleName: document.querySelector('#activeStyleName'), smooth: document.querySelector('#smoothRange'),
  smoothOutput: document.querySelector('#smoothOutput'), edge: document.querySelector('#edgeRange'),
  edgeOutput: document.querySelector('#edgeOutput'), tones: document.querySelector('#toneRange'),
  toneOutput: document.querySelector('#toneOutput'), saturation: document.querySelector('#saturationRange'),
  saturationOutput: document.querySelector('#saturationOutput'), reset: document.querySelector('#resetCartoonButton'),
  download: document.querySelector('#cartoonDownloadButton'), topDownload: document.querySelector('#cartoonTopDownload'),
  sendToBead: document.querySelector('#sendToBeadButton')
};

const CARTOON_PRESETS = {
  soft: { name: '柔和动画', smooth: 65, edge: 42, tones: 10, saturation: 115, warm: 3, grain: 0, mono: false },
  ink: { name: '清线漫画', smooth: 43, edge: 74, tones: 8, saturation: 108, warm: 0, grain: 0, mono: false },
  pop: { name: '糖果卡通', smooth: 58, edge: 57, tones: 7, saturation: 155, warm: 4, grain: 0, mono: false },
  retro: { name: '复古印刷', smooth: 48, edge: 52, tones: 7, saturation: 86, warm: 14, grain: 11, mono: false },
  mono: { name: '黑白线稿', smooth: 28, edge: 86, tones: 5, saturation: 0, warm: 0, grain: 3, mono: true },
  bead: { name: '拼豆优先', smooth: 82, edge: 34, tones: 5, saturation: 120, warm: 2, grain: 0, mono: false }
};

const cartoonState = { image: null, fileName: '', preset: 'soft', rendering: false, renderQueued: false };
const cartoonOriginalCtx = cartoonEls.originalCanvas.getContext('2d', { willReadFrequently: true });
const cartoonResultCtx = cartoonEls.resultCanvas.getContext('2d', { willReadFrequently: true });
const cartoonWorkCanvas = document.createElement('canvas');
const cartoonWorkCtx = cartoonWorkCanvas.getContext('2d', { willReadFrequently: true });

function switchMode(mode, scroll = true) {
  const cartoon = mode === 'cartoon';
  cartoonEls.beadMode.hidden = cartoon;
  cartoonEls.cartoonMode.hidden = !cartoon;
  cartoonEls.beadTopActions.hidden = cartoon;
  cartoonEls.cartoonTopActions.hidden = !cartoon;
  document.querySelectorAll('[data-mode]').forEach(button => button.classList.toggle('active', button.dataset.mode === mode));
  if (scroll) window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cartoonDimensions(image) {
  const maxSide = 1200;
  const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
  return { width: Math.max(1, Math.round(image.naturalWidth * scale)), height: Math.max(1, Math.round(image.naturalHeight * scale)) };
}

function loadCartoonFile(file) {
  if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = event => {
    const image = new Image();
    image.onload = () => {
      cartoonState.image = image;
      cartoonState.fileName = file.name;
      cartoonEls.fileThumb.src = event.target.result;
      cartoonEls.fileName.textContent = file.name;
      cartoonEls.fileMeta.textContent = `${image.naturalWidth} × ${image.naturalHeight}`;
      cartoonEls.imageSize.textContent = `${image.naturalWidth} × ${image.naturalHeight}`;
      cartoonEls.uploadZone.hidden = true;
      cartoonEls.fileRow.hidden = false;
      cartoonEls.empty.hidden = true;
      cartoonEls.previewGrid.hidden = false;
      renderCartoon();
    };
    image.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

function currentCartoonSettings() {
  const preset = CARTOON_PRESETS[cartoonState.preset];
  return {
    smooth: Number(cartoonEls.smooth.value), edge: Number(cartoonEls.edge.value),
    tones: Number(cartoonEls.tones.value), saturation: Number(cartoonEls.saturation.value),
    warm: preset.warm, grain: preset.grain, mono: preset.mono
  };
}

function updateCartoonOutputs() {
  cartoonEls.smoothOutput.textContent = `${cartoonEls.smooth.value}%`;
  cartoonEls.edgeOutput.textContent = `${cartoonEls.edge.value}%`;
  cartoonEls.toneOutput.textContent = `${cartoonEls.tones.value} 级`;
  cartoonEls.saturationOutput.textContent = `${cartoonEls.saturation.value}%`;
  [cartoonEls.smooth, cartoonEls.edge, cartoonEls.tones, cartoonEls.saturation].forEach(setRangeFill);
}

function applyCartoonPreset(key, render = true) {
  const preset = CARTOON_PRESETS[key];
  cartoonState.preset = key;
  cartoonEls.smooth.value = preset.smooth;
  cartoonEls.edge.value = preset.edge;
  cartoonEls.tones.value = preset.tones;
  cartoonEls.saturation.value = preset.saturation;
  cartoonEls.activeStyleName.textContent = preset.name;
  document.querySelectorAll('[data-cartoon-preset]').forEach(button => button.classList.toggle('active', button.dataset.cartoonPreset === key));
  updateCartoonOutputs();
  if (render && cartoonState.image) scheduleCartoonRender();
}

let cartoonRenderTimer;
function scheduleCartoonRender() {
  clearTimeout(cartoonRenderTimer);
  cartoonRenderTimer = setTimeout(renderCartoon, 160);
}

function renderCartoon() {
  if (!cartoonState.image) return;
  if (cartoonState.rendering) { cartoonState.renderQueued = true; return; }
  cartoonState.rendering = true;
  cartoonEls.processing.hidden = false;
  requestAnimationFrame(() => setTimeout(() => {
    const { width, height } = cartoonDimensions(cartoonState.image);
    cartoonEls.originalCanvas.width = width; cartoonEls.originalCanvas.height = height;
    cartoonEls.resultCanvas.width = width; cartoonEls.resultCanvas.height = height;
    cartoonOriginalCtx.clearRect(0, 0, width, height);
    cartoonOriginalCtx.drawImage(cartoonState.image, 0, 0, width, height);
    processCartoonPixels(width, height, currentCartoonSettings());
    cartoonEls.processing.hidden = true;
    cartoonState.rendering = false;
    if (cartoonState.renderQueued) { cartoonState.renderQueued = false; scheduleCartoonRender(); }
  }, 30));
}

function processCartoonPixels(width, height, settings) {
  const shrink = Math.max(.28, 1 - settings.smooth * .0068);
  const smallWidth = Math.max(80, Math.round(width * shrink));
  const smallHeight = Math.max(80, Math.round(height * shrink));
  cartoonWorkCanvas.width = smallWidth; cartoonWorkCanvas.height = smallHeight;
  cartoonWorkCtx.imageSmoothingEnabled = true;
  cartoonWorkCtx.imageSmoothingQuality = 'high';
  cartoonWorkCtx.clearRect(0, 0, smallWidth, smallHeight);
  cartoonWorkCtx.drawImage(cartoonState.image, 0, 0, smallWidth, smallHeight);
  cartoonResultCtx.clearRect(0, 0, width, height);
  cartoonResultCtx.imageSmoothingEnabled = true;
  cartoonResultCtx.imageSmoothingQuality = 'high';
  cartoonResultCtx.drawImage(cartoonWorkCanvas, 0, 0, width, height);

  const imageData = cartoonResultCtx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const gray = new Uint8Array(width * height);
  for (let p = 0, i = 0; i < data.length; i += 4, p++) gray[p] = Math.round(data[i] * .299 + data[i + 1] * .587 + data[i + 2] * .114);

  const step = 255 / Math.max(2, settings.tones - 1);
  const saturation = settings.saturation / 100;
  const edgePower = settings.edge / 100;
  const edgeThreshold = 118 - settings.edge * .72;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = y * width + x, i = p * 4;
      let r = data[i], g = data[i + 1], b = data[i + 2];
      const light = gray[p];
      r = light + (r - light) * saturation;
      g = light + (g - light) * saturation;
      b = light + (b - light) * saturation;
      if (settings.mono) r = g = b = light;
      r = Math.round(Math.max(0, Math.min(255, r + settings.warm)) / step) * step;
      g = Math.round(Math.max(0, Math.min(255, g + settings.warm * .25)) / step) * step;
      b = Math.round(Math.max(0, Math.min(255, b - settings.warm * .65)) / step) * step;

      let magnitude = 0;
      if (x > 0 && y > 0 && x < width - 1 && y < height - 1 && edgePower > 0) {
        const tl = gray[p - width - 1], tc = gray[p - width], tr = gray[p - width + 1];
        const ml = gray[p - 1], mr = gray[p + 1];
        const bl = gray[p + width - 1], bc = gray[p + width], br = gray[p + width + 1];
        const gx = -tl + tr - 2 * ml + 2 * mr - bl + br;
        const gy = -tl - 2 * tc - tr + bl + 2 * bc + br;
        magnitude = Math.sqrt(gx * gx + gy * gy);
      }
      const edge = Math.max(0, Math.min(1, (magnitude - edgeThreshold) / 145)) * edgePower;
      const darken = 1 - edge * (settings.mono ? 1 : .88);
      const grain = settings.grain ? (((p * 17 + y * 13) % 19) - 9) * settings.grain / 20 : 0;
      data[i] = Math.max(0, Math.min(255, r * darken + grain));
      data[i + 1] = Math.max(0, Math.min(255, g * darken + grain));
      data[i + 2] = Math.max(0, Math.min(255, b * darken + grain));
    }
  }
  cartoonResultCtx.putImageData(imageData, 0, 0);
}

function downloadCartoon() {
  if (!cartoonState.image) { cartoonEls.fileInput.click(); return; }
  cartoonEls.resultCanvas.toBlob(blob => {
    const link = document.createElement('a');
    const base = (cartoonState.fileName || '漫画处理').replace(/\.[^.]+$/, '');
    link.download = `${base}-${CARTOON_PRESETS[cartoonState.preset].name}.png`;
    link.href = URL.createObjectURL(blob);
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }, 'image/png');
}

function sendCartoonToBead() {
  if (!cartoonState.image) { cartoonEls.fileInput.click(); return; }
  const dataUrl = cartoonEls.resultCanvas.toDataURL('image/png');
  const image = new Image();
  image.onload = () => {
    state.image = image;
    state.fileName = `${(cartoonState.fileName || '照片').replace(/\.[^.]+$/, '')}-漫画.png`;
    els.fileThumb.src = dataUrl;
    els.fileName.textContent = state.fileName;
    els.fileMeta.textContent = `${image.naturalWidth} × ${image.naturalHeight}`;
    els.uploadZone.hidden = true; els.fileRow.hidden = false;
    setGrid(autoGridSize(image.naturalWidth, image.naturalHeight), false);
    switchMode('bead', false);
    generatePattern();
    setTimeout(() => document.querySelector('.workspace').scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  };
  image.src = dataUrl;
}

document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => switchMode(button.dataset.mode)));
document.querySelectorAll('[data-cartoon-preset]').forEach(button => button.addEventListener('click', () => applyCartoonPreset(button.dataset.cartoonPreset)));
document.querySelectorAll('[data-cartoon-view]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-cartoon-view]').forEach(item => item.classList.toggle('active', item === button));
  cartoonEls.previewGrid.classList.toggle('single', button.dataset.cartoonView === 'result');
}));
cartoonEls.fileInput.addEventListener('change', event => loadCartoonFile(event.target.files[0]));
cartoonEls.replaceButton.addEventListener('click', () => cartoonEls.fileInput.click());
cartoonEls.emptyUpload.addEventListener('click', () => cartoonEls.fileInput.click());
['dragenter', 'dragover'].forEach(type => cartoonEls.uploadZone.addEventListener(type, event => { event.preventDefault(); cartoonEls.uploadZone.classList.add('dragging'); }));
['dragleave', 'drop'].forEach(type => cartoonEls.uploadZone.addEventListener(type, event => { event.preventDefault(); cartoonEls.uploadZone.classList.remove('dragging'); }));
cartoonEls.uploadZone.addEventListener('drop', event => loadCartoonFile(event.dataTransfer.files[0]));
[cartoonEls.smooth, cartoonEls.edge, cartoonEls.tones, cartoonEls.saturation].forEach(input => input.addEventListener('input', () => { updateCartoonOutputs(); if (cartoonState.image) scheduleCartoonRender(); }));
cartoonEls.reset.addEventListener('click', () => applyCartoonPreset(cartoonState.preset));
cartoonEls.download.addEventListener('click', downloadCartoon);
cartoonEls.topDownload.addEventListener('click', downloadCartoon);
cartoonEls.sendToBead.addEventListener('click', sendCartoonToBead);
applyCartoonPreset('soft', false);
}

// --- Free local AI cartoon workspace (AnimeGANv2 + ONNX Runtime Web) ---
const LOCAL_CARTOON_MODEL = 'models/Shinkai_53.onnx';

const aiCartoonEls = {
  beadMode: document.querySelector('#beadMode'), cartoonMode: document.querySelector('#cartoonMode'),
  beadTopActions: document.querySelector('#beadTopActions'), cartoonTopActions: document.querySelector('#cartoonTopActions'),
  fileInput: document.querySelector('#cartoonFileInput'), uploadZone: document.querySelector('#cartoonUploadZone'),
  fileRow: document.querySelector('#cartoonFileRow'), fileThumb: document.querySelector('#cartoonFileThumb'),
  fileName: document.querySelector('#cartoonFileName'), fileMeta: document.querySelector('#cartoonFileMeta'),
  replaceButton: document.querySelector('#cartoonReplaceButton'), emptyUpload: document.querySelector('#cartoonEmptyUpload'),
  empty: document.querySelector('#cartoonEmpty'), previewGrid: document.querySelector('#cartoonPreviewGrid'),
  originalCanvas: document.querySelector('#cartoonOriginalCanvas'), resultCanvas: document.querySelector('#cartoonResultCanvas'),
  resultWaiting: document.querySelector('#resultWaiting'), processing: document.querySelector('#cartoonProcessing'),
  processingText: document.querySelector('#cartoonProcessingText'), imageSize: document.querySelector('#cartoonImageSize'),
  run: document.querySelector('#runCartoonButton'), download: document.querySelector('#cartoonDownloadButton'),
  topDownload: document.querySelector('#cartoonTopDownload'), sendToBead: document.querySelector('#sendToBeadButton'),
  status: document.querySelector('#modelStatus'), statusTitle: document.querySelector('#modelStatusTitle'),
  statusDetail: document.querySelector('#modelStatusDetail')
};

const aiCartoonState = {
  image: null, fileName: '', maxSide: 512, session: null, sessionPromise: null,
  running: false, generated: false
};

const aiOriginalCtx = aiCartoonEls.originalCanvas.getContext('2d', { willReadFrequently: true });
const aiResultCtx = aiCartoonEls.resultCanvas.getContext('2d', { willReadFrequently: true });
const aiInputCanvas = document.createElement('canvas');
const aiInputCtx = aiInputCanvas.getContext('2d', { willReadFrequently: true });
const aiOutputCanvas = document.createElement('canvas');
const aiOutputCtx = aiOutputCanvas.getContext('2d');

function switchWorkspaceMode(mode, scroll = true) {
  const cartoon = mode === 'cartoon';
  aiCartoonEls.beadMode.hidden = cartoon;
  aiCartoonEls.cartoonMode.hidden = !cartoon;
  aiCartoonEls.beadTopActions.hidden = cartoon;
  aiCartoonEls.cartoonTopActions.hidden = !cartoon;
  document.querySelectorAll('[data-mode]').forEach(button => button.classList.toggle('active', button.dataset.mode === mode));
  if (scroll) window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setAiStatus(kind, title, detail) {
  aiCartoonEls.status.dataset.state = kind;
  aiCartoonEls.statusTitle.textContent = title;
  aiCartoonEls.statusDetail.textContent = detail;
}

function setAiActionsReady(ready) {
  aiCartoonEls.download.disabled = !ready;
  aiCartoonEls.topDownload.disabled = !ready;
  aiCartoonEls.sendToBead.disabled = !ready;
}

function displayDimensions(image, maxSide = 1200) {
  const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
  return {
    width: Math.max(1, Math.round(image.naturalWidth * scale)),
    height: Math.max(1, Math.round(image.naturalHeight * scale))
  };
}

function inferenceDimensions(image, maxSide) {
  const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
  const to32 = value => Math.max(256, Math.floor(value * scale / 32) * 32);
  return { width: to32(image.naturalWidth), height: to32(image.naturalHeight) };
}

function drawOriginalPreview() {
  const { width, height } = displayDimensions(aiCartoonState.image);
  aiCartoonEls.originalCanvas.width = width;
  aiCartoonEls.originalCanvas.height = height;
  aiOriginalCtx.clearRect(0, 0, width, height);
  aiOriginalCtx.drawImage(aiCartoonState.image, 0, 0, width, height);
  aiCartoonEls.resultCanvas.width = width;
  aiCartoonEls.resultCanvas.height = height;
  aiResultCtx.clearRect(0, 0, width, height);
}

function loadAiCartoonFile(file) {
  if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = event => {
    const image = new Image();
    image.onload = () => {
      aiCartoonState.image = image;
      aiCartoonState.fileName = file.name;
      aiCartoonState.generated = false;
      aiCartoonEls.fileThumb.src = event.target.result;
      aiCartoonEls.fileName.textContent = file.name;
      aiCartoonEls.fileMeta.textContent = `${image.naturalWidth} × ${image.naturalHeight}`;
      aiCartoonEls.imageSize.textContent = `${image.naturalWidth} × ${image.naturalHeight}`;
      aiCartoonEls.uploadZone.hidden = true;
      aiCartoonEls.fileRow.hidden = false;
      aiCartoonEls.empty.hidden = true;
      aiCartoonEls.previewGrid.hidden = false;
      aiCartoonEls.resultWaiting.hidden = false;
      aiCartoonEls.run.disabled = false;
      setAiActionsReady(false);
      drawOriginalPreview();
      setAiStatus('ready', '照片已准备好', '点击上方按钮，让本地 AI 重新绘制');
    };
    image.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

async function fetchModelWithProgress() {
  const response = await fetch(LOCAL_CARTOON_MODEL);
  if (!response.ok) throw new Error(`模型文件加载失败（${response.status}）`);
  const total = Number(response.headers.get('content-length')) || 0;
  if (!response.body?.getReader) return new Uint8Array(await response.arrayBuffer());
  const reader = response.body.getReader();
  const chunks = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    const progress = total ? `${Math.round(received / total * 100)}%` : `${(received / 1048576).toFixed(1)} MB`;
    setAiStatus('loading', '正在加载免费模型', `${progress} · 首次加载后浏览器会缓存`);
  }
  const bytes = new Uint8Array(received);
  let offset = 0;
  chunks.forEach(chunk => { bytes.set(chunk, offset); offset += chunk.length; });
  return bytes;
}

async function ensureLocalCartoonModel() {
  if (aiCartoonState.session) return aiCartoonState.session;
  if (aiCartoonState.sessionPromise) return aiCartoonState.sessionPromise;
  aiCartoonState.sessionPromise = (async () => {
    if (!window.ort) throw new Error('本地 AI 运行组件没有加载成功，请刷新页面重试');
    ort.env.wasm.numThreads = 1;
    ort.env.wasm.simd = true;
    ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/';
    const modelBytes = await fetchModelWithProgress();
    setAiStatus('loading', '正在启动漫画模型', '第一次启动会比之后稍慢');
    aiCartoonState.session = await ort.InferenceSession.create(modelBytes, {
      executionProviders: ['wasm'], graphOptimizationLevel: 'all'
    });
    return aiCartoonState.session;
  })();
  try {
    return await aiCartoonState.sessionPromise;
  } catch (error) {
    aiCartoonState.sessionPromise = null;
    throw error;
  }
}

function createModelInput(image, width, height) {
  aiInputCanvas.width = width;
  aiInputCanvas.height = height;
  aiInputCtx.imageSmoothingEnabled = true;
  aiInputCtx.imageSmoothingQuality = 'high';
  aiInputCtx.drawImage(image, 0, 0, width, height);
  const rgba = aiInputCtx.getImageData(0, 0, width, height).data;
  const rgb = new Float32Array(width * height * 3);
  for (let source = 0, target = 0; source < rgba.length; source += 4) {
    rgb[target++] = rgba[source] / 127.5 - 1;
    rgb[target++] = rgba[source + 1] / 127.5 - 1;
    rgb[target++] = rgba[source + 2] / 127.5 - 1;
  }
  return new ort.Tensor('float32', rgb, [1, height, width, 3]);
}

function paintModelOutput(tensor, width, height) {
  const pixels = tensor.data;
  const imageData = aiOutputCtx.createImageData(width, height);
  for (let source = 0, target = 0; source < pixels.length; source += 3) {
    imageData.data[target++] = Math.max(0, Math.min(255, (pixels[source] + 1) * 127.5));
    imageData.data[target++] = Math.max(0, Math.min(255, (pixels[source + 1] + 1) * 127.5));
    imageData.data[target++] = Math.max(0, Math.min(255, (pixels[source + 2] + 1) * 127.5));
    imageData.data[target++] = 255;
  }
  aiOutputCtx.putImageData(imageData, 0, 0);
  const display = displayDimensions(aiCartoonState.image);
  aiCartoonEls.resultCanvas.width = display.width;
  aiCartoonEls.resultCanvas.height = display.height;
  aiResultCtx.imageSmoothingEnabled = true;
  aiResultCtx.imageSmoothingQuality = 'high';
  aiResultCtx.drawImage(aiOutputCanvas, 0, 0, display.width, display.height);
}

async function runLocalCartoonModel() {
  if (!aiCartoonState.image) { aiCartoonEls.fileInput.click(); return; }
  if (aiCartoonState.running) return;
  aiCartoonState.running = true;
  aiCartoonEls.run.disabled = true;
  aiCartoonEls.processing.hidden = false;
  aiCartoonEls.processingText.textContent = '正在加载本地漫画模型…';
  setAiActionsReady(false);
  try {
    const session = await ensureLocalCartoonModel();
    const { width, height } = inferenceDimensions(aiCartoonState.image, aiCartoonState.maxSide);
    aiInputCanvas.width = width; aiInputCanvas.height = height;
    aiOutputCanvas.width = width; aiOutputCanvas.height = height;
    aiCartoonEls.processingText.textContent = `正在重新绘制 ${width} × ${height} 个像素…`;
    setAiStatus('running', 'AI 正在重新绘制', '请保持页面打开，手机可能需要几十秒');
    await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 30)));
    const inputTensor = createModelInput(aiCartoonState.image, width, height);
    const feeds = { [session.inputNames[0]]: inputTensor };
    const results = await session.run(feeds);
    paintModelOutput(results[session.outputNames[0]], width, height);
    aiCartoonState.generated = true;
    aiCartoonEls.resultWaiting.hidden = true;
    setAiActionsReady(true);
    setAiStatus('done', '漫画图完成', `${width} × ${height} 本地 AI 推理 · 照片未上传`);
  } catch (error) {
    console.error(error);
    setAiStatus('error', '这次转换没有完成', error.message || '请刷新页面后重试');
  } finally {
    aiCartoonEls.processing.hidden = true;
    aiCartoonState.running = false;
    aiCartoonEls.run.disabled = false;
  }
}

function downloadAiCartoon() {
  if (!aiCartoonState.generated) { runLocalCartoonModel(); return; }
  aiCartoonEls.resultCanvas.toBlob(blob => {
    const link = document.createElement('a');
    const base = (aiCartoonState.fileName || '照片').replace(/\.[^.]+$/, '');
    link.download = `${base}-AI清线动画.png`;
    link.href = URL.createObjectURL(blob);
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }, 'image/png');
}

function sendAiCartoonToBead() {
  if (!aiCartoonState.generated) { runLocalCartoonModel(); return; }
  const dataUrl = aiCartoonEls.resultCanvas.toDataURL('image/png');
  const image = new Image();
  image.onload = () => {
    state.image = image;
    state.fileName = `${(aiCartoonState.fileName || '照片').replace(/\.[^.]+$/, '')}-AI漫画.png`;
    els.fileThumb.src = dataUrl;
    els.fileName.textContent = state.fileName;
    els.fileMeta.textContent = `${image.naturalWidth} × ${image.naturalHeight}`;
    els.uploadZone.hidden = true; els.fileRow.hidden = false;
    setGrid(autoGridSize(image.naturalWidth, image.naturalHeight), false);
    switchWorkspaceMode('bead', false);
    generatePattern();
    setTimeout(() => document.querySelector('.workspace').scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  };
  image.src = dataUrl;
}

document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => switchWorkspaceMode(button.dataset.mode)));
document.querySelectorAll('[data-cartoon-view]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-cartoon-view]').forEach(item => item.classList.toggle('active', item === button));
  aiCartoonEls.previewGrid.classList.toggle('single', button.dataset.cartoonView === 'result');
}));
document.querySelectorAll('[data-ai-size]').forEach(button => button.addEventListener('click', () => {
  aiCartoonState.maxSide = Number(button.dataset.aiSize);
  document.querySelectorAll('[data-ai-size]').forEach(item => item.classList.toggle('active', item === button));
  if (aiCartoonState.image) setAiStatus('ready', '处理尺寸已调整', `将以最长边 ${aiCartoonState.maxSide} 像素重新绘制`);
}));
aiCartoonEls.fileInput.addEventListener('change', event => loadAiCartoonFile(event.target.files[0]));
aiCartoonEls.replaceButton.addEventListener('click', () => aiCartoonEls.fileInput.click());
aiCartoonEls.emptyUpload.addEventListener('click', () => aiCartoonEls.fileInput.click());
['dragenter', 'dragover'].forEach(type => aiCartoonEls.uploadZone.addEventListener(type, event => { event.preventDefault(); aiCartoonEls.uploadZone.classList.add('dragging'); }));
['dragleave', 'drop'].forEach(type => aiCartoonEls.uploadZone.addEventListener(type, event => { event.preventDefault(); aiCartoonEls.uploadZone.classList.remove('dragging'); }));
aiCartoonEls.uploadZone.addEventListener('drop', event => loadAiCartoonFile(event.dataTransfer.files[0]));
aiCartoonEls.run.addEventListener('click', runLocalCartoonModel);
aiCartoonEls.download.addEventListener('click', downloadAiCartoon);
aiCartoonEls.topDownload.addEventListener('click', downloadAiCartoon);
aiCartoonEls.sendToBead.addEventListener('click', sendAiCartoonToBead);
setAiActionsReady(false);
