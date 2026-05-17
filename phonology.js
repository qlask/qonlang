// ─── PHONOLOGY ───
const Phonology = (() => {
  let activeTab = 'consonants';

  const CONSONANT_PLACES = ['Bilabial','Labiodental','Dental','Alveolar','Postalveolar','Retroflex','Palatal','Velar','Uvular','Faríngeo','Glotal'];
  const CONSONANT_MANNERS = ['Oclusiva','Nasal','Vibrante','Fricativa','Africada','Lateral','Aproximante'];

  const CONSONANT_MAP = {
    'Oclusiva': { 'Bilabial': ['p','b'], 'Dental': ['t̪','d̪'], 'Alveolar': ['t','d'], 'Palatal': ['c','ɟ'], 'Velar': ['k','g'], 'Uvular': ['q','ɢ'], 'Glotal': ['ʔ'] },
    'Nasal': { 'Bilabial': ['m'], 'Labiodental': ['ɱ'], 'Alveolar': ['n'], 'Retroflex': ['ɳ'], 'Palatal': ['ɲ'], 'Velar': ['ŋ'], 'Uvular': ['ɴ'] },
    'Vibrante': { 'Alveolar': ['r'], 'Uvular': ['ʀ'] },
    'Fricativa': { 'Bilabial': ['ɸ','β'], 'Labiodental': ['f','v'], 'Dental': ['θ','ð'], 'Alveolar': ['s','z'], 'Postalveolar': ['ʃ','ʒ'], 'Palatal': ['ç','ʝ'], 'Velar': ['x','ɣ'], 'Uvular': ['χ','ʁ'], 'Faríngeo': ['ħ','ʕ'], 'Glotal': ['h'] },
    'Africada': { 'Alveolar': ['ts','dz'], 'Postalveolar': ['tʃ','dʒ'], 'Palatal': ['tɕ','dʑ'] },
    'Lateral': { 'Alveolar': ['l'], 'Retroflex': ['ɭ'], 'Palatal': ['ʎ'], 'Velar': ['ʟ'] },
    'Aproximante': { 'Bilabial': ['w'], 'Labiodental': ['ʋ'], 'Alveolar': ['ɹ'], 'Palatal': ['j'], 'Velar': ['ɰ'] }
  };

  const VOWEL_ROWS = [
    { label: 'Cerrada', symbols: [['i','y'],['ɨ','ʉ'],['ɯ','u']] },
    { label: 'Semicerrada', symbols: [['e','ø'],['',''],['ɤ','o']] },
    { label: 'Semiabierta', symbols: [['ɛ','œ'],['',''],['ʌ','ɔ']] },
    { label: 'Abierta', symbols: [['a','æ'],['',''],['ɑ','ɒ']] }
  ];
  const VOWEL_COLS = ['Anterior','Central','Posterior'];

  function render() {
    const container = document.getElementById('view-container');
    const d = Store.get();
    const phon = d.phonology;

    container.innerHTML = `
      <div class="section-header">
        <h2 class="section-title">Fonología</h2>
      </div>

      <div class="phonology-tabs">
        <button class="phon-tab ${activeTab==='consonants'?'active':''}" onclick="Phonology.switchTab('consonants')">Consonantes</button>
        <button class="phon-tab ${activeTab==='vowels'?'active':''}" onclick="Phonology.switchTab('vowels')">Vocales</button>
        <button class="phon-tab ${activeTab==='inventory'?'active':''}" onclick="Phonology.switchTab('inventory')">Inventario</button>
        <button class="phon-tab ${activeTab==='notes'?'active':''}" onclick="Phonology.switchTab('notes')">Notas</button>
      </div>

      <div id="phon-content"></div>
    `;

    renderTab();
  }

  function switchTab(tab) {
    activeTab = tab;
    document.querySelectorAll('.phon-tab').forEach(t => t.classList.toggle('active', t.textContent.toLowerCase().includes(tab.split('s')[0]) || t.onclick.toString().includes(tab)));
    document.querySelectorAll('.phon-tab').forEach(t => {
      t.classList.toggle('active', t.getAttribute('onclick') === `Phonology.switchTab('${tab}')`);
    });
    renderTab();
  }

  function renderTab() {
    const el = document.getElementById('phon-content');
    if (!el) return;

    if (activeTab === 'consonants') el.innerHTML = renderConsonantTable();
    else if (activeTab === 'vowels') el.innerHTML = renderVowelTable();
    else if (activeTab === 'inventory') el.innerHTML = renderInventory();
    else if (activeTab === 'notes') el.innerHTML = renderPhonNotes();
  }

  function renderConsonantTable() {
    const consonants = Store.get().phonology.consonants || {};
    let html = `<p style="color:var(--text-2);font-size:13px;margin-bottom:16px;font-family:var(--font-ui)">Haz clic en los símbolos para marcarlos como parte de tu inventario fonémico.</p>
    <div style="overflow-x:auto">
    <table class="phoneme-table">
      <thead><tr><th></th>${CONSONANT_PLACES.map(p=>`<th>${p}</th>`).join('')}</tr></thead>
      <tbody>`;

    CONSONANT_MANNERS.forEach(manner => {
      html += `<tr><th style="text-align:left">${manner}</th>`;
      CONSONANT_PLACES.forEach(place => {
        const symbols = (CONSONANT_MAP[manner] && CONSONANT_MAP[manner][place]) || [];
        if (symbols.length === 0) {
          html += `<td></td>`;
        } else {
          html += `<td>${symbols.map(s => {
            const active = consonants[s];
            return `<span class="phoneme-cell ${active?'has-sound':''}" onclick="Phonology.togglePhoneme('consonants','${s}')" title="${s}">${s}</span>`;
          }).join(' ')}</td>`;
        }
      });
      html += `</tr>`;
    });

    html += `</tbody></table></div>`;
    return html;
  }

  function renderVowelTable() {
    const vowels = Store.get().phonology.vowels || {};
    let html = `<p style="color:var(--text-2);font-size:13px;margin-bottom:16px;font-family:var(--font-ui)">Haz clic para activar vocales en tu inventario.</p>
    <div style="overflow-x:auto">
    <table class="phoneme-table" style="max-width:500px">
      <thead><tr><th></th>${VOWEL_COLS.map(c=>`<th>${c}</th>`).join('')}</tr></thead>
      <tbody>`;

    VOWEL_ROWS.forEach(row => {
      html += `<tr><th style="text-align:left">${row.label}</th>`;
      row.symbols.forEach(pair => {
        const symbols = pair.filter(s => s);
        if (symbols.length === 0) {
          html += `<td></td>`;
        } else {
          html += `<td>${symbols.map(s => {
            const active = vowels[s];
            return `<span class="phoneme-cell ${active?'has-sound':''}" onclick="Phonology.togglePhoneme('vowels','${s}')" title="${s}">${s}</span>`;
          }).join(' • ')}</td>`;
        }
      });
      html += `</tr>`;
    });

    html += `</tbody></table></div>`;
    return html;
  }

  function renderInventory() {
    const phon = Store.get().phonology;
    const cons = Object.keys(phon.consonants || {}).filter(k => phon.consonants[k]);
    const vows = Object.keys(phon.vowels || {}).filter(k => phon.vowels[k]);

    return `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px">
        <div style="background:var(--bg-1);border:1px solid var(--border);border-radius:var(--radius-lg);padding:20px">
          <h3 style="font-family:var(--font-title);font-size:18px;font-weight:400;margin-bottom:12px">Consonantes (${cons.length})</h3>
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            ${cons.length === 0
              ? '<span style="color:var(--text-3);font-size:13px">Ninguna seleccionada</span>'
              : cons.map(s => `<span style="font-family:var(--font-mono);font-size:18px;background:var(--bg-3);padding:4px 10px;border-radius:6px;color:var(--accent)">${s}</span>`).join('')}
          </div>
        </div>
        <div style="background:var(--bg-1);border:1px solid var(--border);border-radius:var(--radius-lg);padding:20px">
          <h3 style="font-family:var(--font-title);font-size:18px;font-weight:400;margin-bottom:12px">Vocales (${vows.length})</h3>
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            ${vows.length === 0
              ? '<span style="color:var(--text-3);font-size:13px">Ninguna seleccionada</span>'
              : vows.map(s => `<span style="font-family:var(--font-mono);font-size:18px;background:var(--bg-3);padding:4px 10px;border-radius:6px;color:var(--purple)">${s}</span>`).join('')}
          </div>
        </div>
      </div>
      <div style="background:var(--bg-1);border:1px solid var(--border);border-radius:var(--radius-lg);padding:20px">
        <h3 style="font-family:var(--font-title);font-size:18px;font-weight:400;margin-bottom:12px">Estructura silábica</h3>
        <div style="display:flex;align-items:center;gap:10px">
          <input type="text" class="form-input" id="syllable-structure"
            placeholder="Ej: (C)V(C), CV, CCV..."
            value="${Store.get().phonology.syllableStructure || ''}"
            style="max-width:300px"
            oninput="Phonology.saveSyllable(this.value)"/>
        </div>
        <p style="color:var(--text-3);font-size:13px;margin-top:8px;font-family:var(--font-ui)">C = Consonante, V = Vocal, paréntesis = opcional</p>
      </div>
    `;
  }

  function renderPhonNotes() {
    const notes = Store.get().phonology.notes || '';
    return `
      <div style="background:var(--bg-1);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden">
        <div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
          <h3 style="font-family:var(--font-title);font-size:18px;font-weight:400">Notas fonológicas</h3>
          <div class="md-toolbar" style="padding:0;background:none;border:none">
            <button type="button" onclick="MD.wrap('phon-notes','**','**')"><b>B</b></button>
            <button type="button" onclick="MD.insertTable('phon-notes')"><i class="fa-solid fa-table"></i></button>
            <button type="button" onclick="MD.togglePreview('phon-notes')"><i class="fa-solid fa-eye"></i></button>
          </div>
        </div>
        <textarea id="phon-notes" class="form-textarea md-input" rows="16"
          style="border:none;border-radius:0"
          placeholder="Documenta reglas de alófonos, sílabas, prosodia, sandhi...&#10;&#10;## Ejemplo&#10;/k/ → [x] / _i (palatalización)"
          oninput="Phonology.saveNotes(this.value)">${notes}</textarea>
        <div id="phon-notes-preview" class="md-preview hidden"></div>
      </div>
    `;
  }

  function togglePhoneme(type, symbol) {
    const phon = Store.get().phonology;
    if (!phon[type]) phon[type] = {};
    phon[type][symbol] = !phon[type][symbol];
    Store.set('phonology', phon);

    // Update cell without re-render
    const cells = document.querySelectorAll('.phoneme-cell');
    cells.forEach(c => {
      if (c.textContent === symbol) {
        c.classList.toggle('has-sound', !!phon[type][symbol]);
      }
    });
  }

  function saveNotes(val) {
    const phon = Store.get().phonology;
    phon.notes = val;
    Store.set('phonology', phon);
  }

  function saveSyllable(val) {
    const phon = Store.get().phonology;
    phon.syllableStructure = val;
    Store.set('phonology', phon);
  }

  return { render, switchTab, togglePhoneme, saveNotes, saveSyllable };
})();
