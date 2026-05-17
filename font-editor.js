// ─── FONT EDITOR ───
const FontEditor = (() => {
  const CANVAS_SIZE = 280;
  const GRID_DIVISIONS = 4;
  let activeGlyph = null;
  let isDrawing = false;
  let currentPath = [];
  let allPaths = [];
  let tool = 'pen'; // pen | eraser | line
  let strokeWidth = 4;
  let lastX = 0, lastY = 0;

  // Default alphabet characters
  const DEFAULT_CHARS = 'a b c d e f g h i j k l m n o p q r s t u v w x y z'.split(' ');

  function render() {
    const container = document.getElementById('view-container');
    const d = Store.get();
    const settings = d.settings;

    // Build character list from settings or default
    let chars = DEFAULT_CHARS;
    if (settings.customChars) {
      chars = settings.customChars.split(',').map(c => c.trim()).filter(Boolean);
    }

    container.innerHTML = `
      <div class="section-header">
        <h2 class="section-title">Editor de Fuente — ${settings.nativeScriptName || 'Alfabeto'}</h2>
        <div style="display:flex;gap:8px">
          <button class="btn btn-ghost btn-sm" onclick="FontEditor.exportFont()">
            <i class="fa-solid fa-download"></i> Exportar
          </button>
          <button class="btn btn-ghost btn-sm" onclick="FontEditor.showCharConfig()">
            <i class="fa-solid fa-sliders"></i> Caracteres
          </button>
        </div>
      </div>
      <p style="color:var(--text-2);font-size:14px;margin-bottom:20px;font-family:var(--font-ui)">
        Dibuja cada glifo haciendo clic y arrastrando en el lienzo. Los glifos se guardan automáticamente.
      </p>

      <div class="font-editor-layout">
        <!-- Glyph grid -->
        <div>
          <div class="glyph-grid" id="glyph-grid">
            ${chars.map(c => renderGlyphCell(c, d.glyphs)).join('')}
          </div>
        </div>

        <!-- Drawing panel -->
        <div class="glyph-drawing-panel">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            <span style="font-family:var(--font-title);font-size:28px;color:var(--accent)" id="active-glyph-label">—</span>
            <span style="color:var(--text-3);font-size:13px;font-family:var(--font-ui)">Selecciona un carácter</span>
          </div>

          <div class="drawing-canvas-wrap">
            <canvas id="glyph-canvas" width="${CANVAS_SIZE}" height="${CANVAS_SIZE}"></canvas>
          </div>

          <div class="drawing-tools">
            <button class="btn btn-sm ${tool==='pen'?'btn-primary':'btn-ghost'}" onclick="FontEditor.setTool('pen')">
              <i class="fa-solid fa-pen"></i> Pluma
            </button>
            <button class="btn btn-sm ${tool==='line'?'btn-primary':'btn-ghost'}" onclick="FontEditor.setTool('line')">
              <i class="fa-solid fa-minus"></i> Línea
            </button>
            <button class="btn btn-sm ${tool==='eraser'?'btn-primary':'btn-ghost'}" onclick="FontEditor.setTool('eraser')">
              <i class="fa-solid fa-eraser"></i> Borrador
            </button>
          </div>

          <div style="display:flex;align-items:center;gap:10px">
            <label style="font-family:var(--font-ui);font-size:12px;color:var(--text-2);min-width:60px">Grosor: ${strokeWidth}px</label>
            <input type="range" min="1" max="12" value="${strokeWidth}" step="1"
              oninput="FontEditor.setStroke(this.value)" style="flex:1"/>
          </div>

          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <button class="btn btn-ghost btn-sm" onclick="FontEditor.undo()">
              <i class="fa-solid fa-rotate-left"></i> Deshacer
            </button>
            <button class="btn btn-ghost btn-sm" onclick="FontEditor.clearCanvas()">
              <i class="fa-solid fa-trash"></i> Limpiar
            </button>
            <button class="btn btn-primary btn-sm" onclick="FontEditor.saveGlyph()" style="margin-left:auto">
              <i class="fa-solid fa-floppy-disk"></i> Guardar glifo
            </button>
          </div>

          <div style="background:var(--bg-2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px">
            <p style="font-family:var(--font-ui);font-size:11px;color:var(--text-3);margin-bottom:8px">Vista previa de texto</p>
            <div id="font-preview-text" style="font-size:24px;color:var(--text-1);line-height:1.4;min-height:40px"></div>
          </div>
        </div>
      </div>

      <!-- Char config panel (hidden by default) -->
      <div id="char-config-panel" class="hidden" style="margin-top:20px;background:var(--bg-1);border:1px solid var(--border);border-radius:var(--radius-lg);padding:20px">
        <h3 style="font-family:var(--font-title);font-size:18px;font-weight:400;margin-bottom:12px">Configurar caracteres</h3>
        <div class="form-group">
          <label>Caracteres del alfabeto (separados por coma)</label>
          <input type="text" id="custom-chars-input" class="form-input"
            placeholder="a, b, c, d, e..."
            value="${settings.customChars || DEFAULT_CHARS.join(', ')}"/>
        </div>
        <div style="display:flex;gap:8px;margin-top:12px">
          <button class="btn btn-ghost" onclick="FontEditor.hideCharConfig()">Cancelar</button>
          <button class="btn btn-primary" onclick="FontEditor.applyCharConfig()">Aplicar</button>
        </div>
      </div>
    `;

    initCanvas();
  }

  function renderGlyphCell(char, glyphs) {
    const hasGlyph = glyphs && glyphs[char];
    return `
      <div class="glyph-cell ${activeGlyph===char?'active':''}" onclick="FontEditor.selectGlyph('${char}')">
        <div class="glyph-preview">
          ${hasGlyph
            ? `<svg width="40" height="40" viewBox="0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}">${glyphs[char]}</svg>`
            : '<span style="color:var(--bg-4)">·</span>'}
        </div>
        <div class="glyph-label">${char}</div>
      </div>
    `;
  }

  function initCanvas() {
    const canvas = document.getElementById('glyph-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Style canvas
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    canvas.style.maxWidth = CANVAS_SIZE + 'px';
    canvas.style.display = 'block';
    canvas.style.margin = '0 auto';

    drawGrid(ctx);

    // Mouse events
    canvas.addEventListener('mousedown', e => startDraw(e, canvas, ctx));
    canvas.addEventListener('mousemove', e => continueDraw(e, canvas, ctx));
    canvas.addEventListener('mouseup', () => endDraw(ctx));
    canvas.addEventListener('mouseleave', () => endDraw(ctx));

    // Touch events
    canvas.addEventListener('touchstart', e => { e.preventDefault(); startDraw(e.touches[0], canvas, ctx); }, { passive: false });
    canvas.addEventListener('touchmove', e => { e.preventDefault(); continueDraw(e.touches[0], canvas, ctx); }, { passive: false });
    canvas.addEventListener('touchend', () => endDraw(ctx));
  }

  function getPos(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_SIZE / rect.width;
    const scaleY = CANVAS_SIZE / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  function startDraw(e, canvas, ctx) {
    if (!activeGlyph) { App.toast('Selecciona un carácter primero', 'info'); return; }
    isDrawing = true;
    const pos = getPos(e, canvas);
    lastX = pos.x;
    lastY = pos.y;
    currentPath = [{ x: pos.x, y: pos.y }];
  }

  function continueDraw(e, canvas, ctx) {
    if (!isDrawing) return;
    const pos = getPos(e, canvas);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = strokeWidth * 3;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = '#f0ede8';
      ctx.lineWidth = strokeWidth;
    }

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    currentPath.push({ x: pos.x, y: pos.y });
    lastX = pos.x;
    lastY = pos.y;
  }

  function endDraw(ctx) {
    if (!isDrawing) return;
    isDrawing = false;
    ctx.globalCompositeOperation = 'source-over';
    if (currentPath.length > 1) {
      allPaths.push({ points: [...currentPath], strokeWidth, tool });
    }
    currentPath = [];
  }

  function drawGrid(ctx) {
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.fillStyle = '#0f0f10';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    const step = CANVAS_SIZE / GRID_DIVISIONS;
    for (let i = 1; i < GRID_DIVISIONS; i++) {
      ctx.beginPath(); ctx.moveTo(i * step, 0); ctx.lineTo(i * step, CANVAS_SIZE); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * step); ctx.lineTo(CANVAS_SIZE, i * step); ctx.stroke();
    }

    // Baseline
    ctx.strokeStyle = 'rgba(201,169,110,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, CANVAS_SIZE * 0.75);
    ctx.lineTo(CANVAS_SIZE, CANVAS_SIZE * 0.75);
    ctx.stroke();
  }

  function selectGlyph(char) {
    activeGlyph = char;

    // Update UI
    document.querySelectorAll('.glyph-cell').forEach(c => c.classList.remove('active'));
    const cells = document.querySelectorAll('.glyph-cell');
    cells.forEach(c => {
      if (c.querySelector('.glyph-label')?.textContent === char) c.classList.add('active');
    });

    const label = document.getElementById('active-glyph-label');
    if (label) {
      label.textContent = char;
      label.nextElementSibling.textContent = `Dibujando: "${char}"`;
    }

    // Load existing glyph
    const canvas = document.getElementById('glyph-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    allPaths = [];

    const existing = Store.getGlyph(char);
    if (existing) {
      // Redraw from SVG paths (simplified: just show existing image)
      drawGrid(ctx);
      const img = new Image();
      const svgData = `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_SIZE}" height="${CANVAS_SIZE}">${existing}</svg>`;
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    } else {
      drawGrid(ctx);
    }
  }

  function setTool(t) {
    tool = t;
    render();
    if (activeGlyph) setTimeout(() => selectGlyph(activeGlyph), 50);
  }

  function setStroke(val) {
    strokeWidth = parseInt(val);
    document.querySelector('[oninput*="setStroke"]')?.previousElementSibling &&
      (document.querySelector('[oninput*="setStroke"]').previousElementSibling.textContent = `Grosor: ${strokeWidth}px`);
  }

  function undo() {
    if (allPaths.length === 0) return;
    allPaths.pop();
    const canvas = document.getElementById('glyph-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    drawGrid(ctx);
    allPaths.forEach(p => replayPath(ctx, p));
    App.toast('Deshecho', 'info');
  }

  function replayPath(ctx, pathData) {
    const points = pathData.points;
    if (points.length < 2) return;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#f0ede8';
    ctx.lineWidth = pathData.strokeWidth;
    ctx.globalCompositeOperation = pathData.tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
  }

  function clearCanvas() {
    allPaths = [];
    const canvas = document.getElementById('glyph-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    drawGrid(ctx);
  }

  function saveGlyph() {
    if (!activeGlyph) { App.toast('Selecciona un carácter', 'error'); return; }
    const canvas = document.getElementById('glyph-canvas');
    if (!canvas) return;

    // Convert canvas to SVG paths representation
    const svgContent = canvasToSVGPaths();
    Store.setGlyph(activeGlyph, svgContent);

    // Update glyph cell
    const cells = document.querySelectorAll('.glyph-cell');
    cells.forEach(c => {
      if (c.querySelector('.glyph-label')?.textContent === activeGlyph) {
        const preview = c.querySelector('.glyph-preview');
        preview.innerHTML = `<svg width="40" height="40" viewBox="0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}">${svgContent}</svg>`;
      }
    });

    App.toast(`Glifo "${activeGlyph}" guardado`, 'success');
    updateFontPreview();
  }

  function canvasToSVGPaths() {
    const canvas = document.getElementById('glyph-canvas');
    if (!canvas) return '';

    // Build SVG from recorded paths
    const paths = allPaths.map(p => {
      if (p.points.length < 2) return '';
      const d = 'M ' + p.points.map(pt => `${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(' L ');
      const color = p.tool === 'eraser' ? 'transparent' : '#f0ede8';
      return `<path d="${d}" stroke="${color}" stroke-width="${p.strokeWidth}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
    }).join('\n');

    // Also save canvas as embedded image for exact rendering
    const imgData = canvas.toDataURL('image/png');
    return `<image href="${imgData}" width="${CANVAS_SIZE}" height="${CANVAS_SIZE}"/>`;
  }

  function updateFontPreview() {
    const previewEl = document.getElementById('font-preview-text');
    if (!previewEl) return;
    const glyphs = Store.get().glyphs;
    const chars = Object.keys(glyphs);
    if (chars.length === 0) return;

    const sample = chars.slice(0, 8).map(c => {
      const g = glyphs[c];
      if (!g) return `<span style="color:var(--text-3)">${c}</span>`;
      return `<span title="${c}" style="display:inline-block"><svg width="28" height="28" viewBox="0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}">${g}</svg></span>`;
    }).join('');
    previewEl.innerHTML = sample;
  }

  function exportFont() {
    const glyphs = Store.get().glyphs;
    const data = {
      name: Store.get().settings.nativeScriptName || 'Mi Fuente',
      created: new Date().toISOString(),
      glyphs
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'conlang-font.json';
    a.click();
    URL.revokeObjectURL(url);
    App.toast('Fuente exportada', 'success');
  }

  function showCharConfig() {
    const panel = document.getElementById('char-config-panel');
    if (panel) panel.classList.remove('hidden');
  }
  function hideCharConfig() {
    const panel = document.getElementById('char-config-panel');
    if (panel) panel.classList.add('hidden');
  }

  function applyCharConfig() {
    const val = document.getElementById('custom-chars-input')?.value.trim();
    if (!val) return;
    const settings = Store.get().settings;
    settings.customChars = val;
    Store.set('settings', settings);
    hideCharConfig();
    render();
    App.toast('Caracteres actualizados', 'success');
  }

  return {
    render, selectGlyph, setTool, setStroke,
    saveGlyph, clearCanvas, undo,
    exportFont, showCharConfig, hideCharConfig, applyCharConfig
  };
})();
