const PALETTE = [
  { code: 'A01', name: '瓷白', hex: '#F7F4EA' }, { code: 'A02', name: '奶油白', hex: '#FFF3CF' },
  { code: 'A03', name: '柠檬黄', hex: '#F7DC43' }, { code: 'A04', name: '向日葵黄', hex: '#F6BD32' },
  { code: 'A05', name: '杏黄', hex: '#F3A84A' }, { code: 'A06', name: '亮橙', hex: '#F27A36' },
  { code: 'A07', name: '珊瑚橙', hex: '#EF5C46' }, { code: 'A08', name: '暖红', hex: '#D83B38' },
  { code: 'B01', name: '樱桃红', hex: '#B72D3C' }, { code: 'B02', name: '酒红', hex: '#782B3A' },
  { code: 'B03', name: '浅粉', hex: '#F7C6D0' }, { code: 'B04', name: '蜜桃粉', hex: '#F39CAF' },
  { code: 'B05', name: '玫粉', hex: '#D95680' }, { code: 'B06', name: '梅子紫', hex: '#9B4975' },
  { code: 'C01', name: '薰衣草', hex: '#C9B7DE' }, { code: 'C02', name: '香芋紫', hex: '#9B82C4' },
  { code: 'C03', name: '葡萄紫', hex: '#70549C' }, { code: 'C04', name: '深紫', hex: '#493660' },
  { code: 'D01', name: '雾蓝', hex: '#BCD7E9' }, { code: 'D02', name: '天空蓝', hex: '#75B8E5' },
  { code: 'D03', name: '湖水蓝', hex: '#358DC2' }, { code: 'D04', name: '钴蓝', hex: '#2F5E9D' },
  { code: 'D05', name: '藏青', hex: '#233852' }, { code: 'D06', name: '冰蓝', hex: '#CDEBE6' },
  { code: 'E01', name: '薄荷绿', hex: '#98D8BE' }, { code: 'E02', name: '青绿', hex: '#48AD91' },
  { code: 'E03', name: '孔雀绿', hex: '#258071' }, { code: 'E04', name: '墨绿', hex: '#28594C' },
  { code: 'E05', name: '嫩芽绿', hex: '#BFD875' }, { code: 'E06', name: '草绿', hex: '#78AD52' },
  { code: 'E07', name: '橄榄绿', hex: '#687A3D' }, { code: 'F01', name: '浅肤色', hex: '#F6D0B0' },
  { code: 'F02', name: '蜜糖肤', hex: '#E7AE7A' }, { code: 'F03', name: '焦糖色', hex: '#B9754E' },
  { code: 'F04', name: '栗棕', hex: '#74472F' }, { code: 'F05', name: '深咖', hex: '#412E28' },
  { code: 'G01', name: '浅灰', hex: '#D7D5D0' }, { code: 'G02', name: '银灰', hex: '#A9AAA7' },
  { code: 'G03', name: '中灰', hex: '#737675' }, { code: 'G04', name: '炭灰', hex: '#474B4C' },
  { code: 'H01', name: '黑色', hex: '#202124' }, { code: 'H02', name: '纯白', hex: '#FFFFFF' },
  { code: 'H03', name: '米灰', hex: '#D6CAB7' }, { code: 'H04', name: '燕麦色', hex: '#B9A78F' },
  { code: 'H05', name: '金棕', hex: '#C89150' }, { code: 'H06', name: '赤陶', hex: '#A75842' },
  { code: 'H07', name: '海盐蓝', hex: '#789AA5' }, { code: 'H08', name: '灰豆绿', hex: '#809C8B' }
].map(color => ({ ...color, rgb: hexToRgb(color.hex) }));

const els = {
  fileInput: document.querySelector('#fileInput'), uploadZone: document.querySelector('#uploadZone'),
  fileRow: document.querySelector('#fileRow'), fileThumb: document.querySelector('#fileThumb'),
  fileName: document.querySelector('#fileName'), fileMeta: document.querySelector('#fileMeta'),
  replaceButton: document.querySelector('#replaceButton'), demoButton: document.querySelector('#demoButton'),
  emptyUploadButton: document.querySelector('#emptyUploadButton'), gridRange: document.querySelector('#gridRange'),
  gridNumber: document.querySelector('#gridNumber'), gridMinus: document.querySelector('#gridMinus'),
  gridPlus: document.querySelector('#gridPlus'), colorRange: document.querySelector('#colorRange'),
  colorOutput: document.querySelector('#colorOutput'), backgroundToggle: document.querySelector('#backgroundToggle'),
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
  view: 'codes', zoom: 1, generated: false, blankThreshold: 238
};

const patternCtx = els.patternCanvas.getContext('2d');
const sourceCtx = els.sourceCanvas.getContext('2d', { willReadFrequently: true });

function hexToRgb(hex) {
  const value = parseInt(hex.slice(1), 16);
  return { r: value >> 16, g: (value >> 8) & 255, b: value & 255 };
}

function luminance({ r, g, b }) { return .2126 * r + .7152 * g + .0722 * b; }
function distance(a, b) {
  const rMean = (a.r + b.r) / 2;
  const r = a.r - b.r, g = a.g - b.g, bl = a.b - b.b;
  return (2 + rMean / 256) * r * r + 4 * g * g + (2 + (255 - rMean) / 256) * bl * bl;
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
    const isBlank = data[i + 3] < 60 || (els.backgroundToggle.checked && rgb.r > state.blankThreshold && rgb.g > state.blankThreshold && rgb.b > state.blankThreshold);
    pixels.push(isBlank ? null : rgb);
  }
  return pixels;
}

function selectPalette(pixels, count) {
  const frequencies = new Map(PALETTE.map(color => [color.code, 0]));
  pixels.forEach(pixel => {
    if (!pixel) return;
    const nearest = PALETTE.reduce((best, color) => distance(pixel, color.rgb) < best.dist ? { color, dist: distance(pixel, color.rgb) } : best, { color: PALETTE[0], dist: Infinity }).color;
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
    return selectedPalette.reduce((best, color) => {
      const dist = distance(pixel, color.rgb);
      return dist < best.dist ? { color, dist } : best;
    }, { color: selectedPalette[0], dist: Infinity }).color;
  });
}

function generatePattern() {
  if (!state.image) { els.fileInput.click(); return; }
  els.processing.hidden = false;
  requestAnimationFrame(() => setTimeout(() => {
    state.cells = quantize(samplePixels());
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
    if (color && state.view === 'codes' && cell >= 14) {
      patternCtx.fillStyle = luminance(color.rgb) > 145 ? '#3d3833' : '#fff';
      patternCtx.font = `700 ${Math.max(6, Math.floor(cell * .31))}px Segoe UI, Microsoft YaHei, sans-serif`;
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
  return [...counts.entries()].map(([code, count]) => ({ color: PALETTE.find(c => c.code === code), count })).sort((a, b) => b.count - a.count);
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
    state.selectedColor = PALETTE.find(color => color.code === card.dataset.code);
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
els.backgroundToggle.addEventListener('change', () => state.image && scheduleGenerate());
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

// --- Photo-to-comic preprocessing workspace ---
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
