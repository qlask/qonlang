// ─── APP ─── Main controller
const App = (() => {
  let currentView = 'dashboard';
  let confirmCallback = null;

  const VIEW_TITLES = {
    dashboard: 'Dashboard',
    lexicon: 'Léxico',
    grammar: 'Gramática',
    phonology: 'Fonología',
    'font-editor': 'Editor de Fuente',
    tags: 'Etiquetas',
    settings: 'Ajustes'
  };

  function init() {
    Store.load();
    setupRouter();
    setupMenuToggle();
    setupConfirmModal();

    // Parse slug from URL
    const slug = getSlugFromURL();
    navigate(slug || 'dashboard');
  }

  function getSlugFromURL() {
    const hash = window.location.hash.replace('#', '');
    const path = window.location.pathname.split('/').pop()?.replace('.html','');
    return hash || (path !== 'index' ? path : '') || 'dashboard';
  }

  function navigate(view) {
    if (!VIEW_TITLES[view]) view = 'dashboard';
    currentView = view;

    // Update URL hash
    window.location.hash = view;

    // Update active nav
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === view);
    });

    // Update title
    const langName = Store.get().settings.langName || 'Mi Conlang';
    document.getElementById('view-title').textContent = VIEW_TITLES[view] || view;
    document.title = `${VIEW_TITLES[view]} — ${langName} | Conlang Studio`;

    // Update "New" button visibility
    const btnNew = document.getElementById('btn-new');
    const showNewBtn = ['lexicon','grammar','tags'].includes(view);
    btnNew.style.display = showNewBtn ? '' : 'none';

    // Render view
    switch (view) {
      case 'dashboard': renderDashboard(); break;
      case 'lexicon': Lexicon.render(); break;
      case 'grammar': Grammar.render(); break;
      case 'phonology': Phonology.render(); break;
      case 'font-editor': FontEditor.render(); break;
      case 'tags': Tags.render(); break;
      case 'settings': renderSettings(); break;
    }

    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
      document.getElementById('sidebar').classList.remove('open');
    }
  }

  function renderDashboard() {
    const d = Store.get();
    const container = document.getElementById('view-container');
    const recentWords = [...d.words].sort((a, b) => new Date(b.created) - new Date(a.created)).slice(0, 6);

    container.innerHTML = `
      <div style="margin-bottom:28px">
        <h2 style="font-family:var(--font-title);font-size:32px;font-weight:400;color:var(--text-1);margin-bottom:6px">
          ${d.settings.langName || 'Mi Conlang'}
        </h2>
        ${d.meta.description
          ? `<p style="color:var(--text-2);font-size:16px">${d.meta.description}</p>`
          : `<p style="color:var(--text-3);font-size:14px;font-family:var(--font-ui)">Sin descripción — añade una en <a href="#settings" onclick="App.navigate('settings');return false" style="color:var(--accent)">Ajustes</a></p>`
        }
      </div>

      <div class="dashboard-grid">
        <div class="stat-card">
          <div class="stat-icon gold"><i class="fa-solid fa-book-open"></i></div>
          <div class="stat-info">
            <div class="stat-value">${d.words.length}</div>
            <div class="stat-label">Palabras</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon purple"><i class="fa-solid fa-scroll"></i></div>
          <div class="stat-info">
            <div class="stat-value">${d.rules.length}</div>
            <div class="stat-label">Reglas gramaticales</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon green"><i class="fa-solid fa-microphone"></i></div>
          <div class="stat-info">
            <div class="stat-value">${countPhonemes()}</div>
            <div class="stat-label">Fonemas</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon blue"><i class="fa-solid fa-pen-nib"></i></div>
          <div class="stat-info">
            <div class="stat-value">${Object.keys(d.glyphs).length}</div>
            <div class="stat-label">Glifos diseñados</div>
          </div>
        </div>
      </div>

      ${recentWords.length > 0 ? `
        <div class="section-header">
          <h3 class="section-title" style="font-size:20px">Palabras recientes</h3>
          <button class="btn btn-ghost btn-sm" onclick="App.navigate('lexicon')">Ver todas <i class="fa-solid fa-arrow-right"></i></button>
        </div>
        <div class="words-grid">
          ${recentWords.map(w => `
            <div class="word-card" onclick="App.navigate('lexicon')">
              <div class="word-card-header">
                <div class="word-card-left">
                  ${w.native ? `<div class="word-native">${w.native}</div>` : ''}
                  ${w.romanized ? `<div class="word-romanized">${w.romanized}</div>` : ''}
                  ${w.ipa ? `<div class="word-ipa">/${w.ipa}/</div>` : ''}
                </div>
                ${w.pos ? `<span class="word-pos">${w.pos}</span>` : ''}
              </div>
              ${w.definition ? `<div class="word-definition">${w.definition}</div>` : ''}
            </div>
          `).join('')}
        </div>
      ` : `
        <div class="empty-state" style="padding:40px">
          <i class="fa-solid fa-seedling" style="font-size:40px;color:var(--accent)"></i>
          <h3>¡Empieza a construir tu idioma!</h3>
          <p>Añade tus primeras palabras, documenta la gramática y diseña el alfabeto.</p>
          <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center">
            <button class="btn btn-primary" onclick="App.navigate('lexicon')"><i class="fa-solid fa-plus"></i> Primera palabra</button>
            <button class="btn btn-ghost" onclick="App.navigate('grammar')"><i class="fa-solid fa-scroll"></i> Gramática</button>
          </div>
        </div>
      `}

      ${d.github ? `
        <div style="background:var(--bg-1);border:1px solid var(--border);border-radius:var(--radius-lg);padding:16px 20px;margin-top:24px;display:flex;align-items:center;gap:12px">
          <i class="fa-brands fa-github" style="font-size:20px;color:var(--text-2)"></i>
          <div style="flex:1">
            <div style="font-family:var(--font-ui);font-size:13px;font-weight:500;color:var(--text-1)">${d.github.owner}/${d.github.repo}</div>
            <div style="font-family:var(--font-ui);font-size:12px;color:var(--text-3)">Rama: ${d.github.branch}</div>
          </div>
          <button class="btn btn-sm btn-primary" onclick="App.saveToGitHub()">
            <i class="fa-solid fa-cloud-arrow-up"></i> Sincronizar
          </button>
        </div>
      ` : `
        <div style="background:var(--bg-1);border:1px dashed var(--border-hover);border-radius:var(--radius-lg);padding:16px 20px;margin-top:24px;display:flex;align-items:center;gap:12px">
          <i class="fa-brands fa-github" style="font-size:20px;color:var(--text-3)"></i>
          <div style="flex:1">
            <div style="font-family:var(--font-ui);font-size:13px;color:var(--text-2)">Conecta con GitHub para guardar tu conlang en la nube</div>
          </div>
          <button class="btn btn-sm btn-ghost" onclick="openModal('modal-github')">Conectar</button>
        </div>
      `}
    `;
  }

  function countPhonemes() {
    const phon = Store.get().phonology;
    const c = Object.values(phon.consonants || {}).filter(Boolean).length;
    const v = Object.values(phon.vowels || {}).filter(Boolean).length;
    return c + v;
  }

  function renderSettings() {
    const d = Store.get();
    const s = d.settings;
    const gh = d.github;
    const container = document.getElementById('view-container');

    container.innerHTML = `
      <h2 class="section-title" style="margin-bottom:24px">Ajustes</h2>

      <div class="settings-section">
        <div class="settings-section-title">Idioma</div>
        <div class="settings-body">
          <div class="settings-row">
            <div class="settings-row-info">
              <div class="settings-row-label">Nombre del idioma</div>
              <div class="settings-row-desc">Nombre de tu conlang</div>
            </div>
            <input type="text" class="form-input" style="max-width:240px"
              value="${s.langName || ''}"
              oninput="App.updateSetting('langName', this.value)"
              placeholder="Ej: Quenya, Klingon..."/>
          </div>
          <div class="settings-row">
            <div class="settings-row-info">
              <div class="settings-row-label">Descripción</div>
            </div>
            <input type="text" class="form-input" style="max-width:340px"
              value="${d.meta.description || ''}"
              oninput="App.updateMeta('description', this.value)"
              placeholder="Breve descripción..."/>
          </div>
          <div class="settings-row">
            <div class="settings-row-info">
              <div class="settings-row-label">Nombre del script</div>
              <div class="settings-row-desc">Nombre de tu alfabeto o alfasilabario</div>
            </div>
            <input type="text" class="form-input" style="max-width:240px"
              value="${s.nativeScriptName || ''}"
              oninput="App.updateSetting('nativeScriptName', this.value)"
              placeholder="Ej: Tengwar, Devanagari..."/>
          </div>
          <div class="settings-row">
            <div class="settings-row-info">
              <div class="settings-row-label">Tipo de script</div>
            </div>
            <select class="form-select" style="max-width:200px"
              onchange="App.updateSetting('scriptType', this.value)">
              <option value="alphabet" ${s.scriptType==='alphabet'?'selected':''}>Alfabeto</option>
              <option value="abjad" ${s.scriptType==='abjad'?'selected':''}>Abyad</option>
              <option value="abugida" ${s.scriptType==='abugida'?'selected':''}>Abugida (alfasilabario)</option>
              <option value="syllabary" ${s.scriptType==='syllabary'?'selected':''}>Silabario</option>
              <option value="logographic" ${s.scriptType==='logographic'?'selected':''}>Logográfico</option>
            </select>
          </div>
          <div class="settings-row">
            <div class="settings-row-info">
              <div class="settings-row-label">Dirección de escritura</div>
            </div>
            <select class="form-select" style="max-width:200px"
              onchange="App.updateSetting('rtl', this.value==='true')">
              <option value="false" ${!s.rtl?'selected':''}>Izquierda a derecha</option>
              <option value="true" ${s.rtl?'selected':''}>Derecha a izquierda</option>
            </select>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-section-title">GitHub</div>
        <div class="settings-body">
          ${gh ? `
            <div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--green-dim);border:1px solid rgba(110,231,183,0.2);border-radius:var(--radius-sm)">
              <i class="fa-solid fa-circle-check" style="color:var(--green)"></i>
              <span style="font-family:var(--font-ui);font-size:13px;color:var(--text-1)">Conectado: <strong>${gh.owner}/${gh.repo}</strong> (rama: ${gh.branch})</span>
            </div>
            <div style="display:flex;gap:8px">
              <button class="btn btn-primary" onclick="App.saveToGitHub()">
                <i class="fa-solid fa-cloud-arrow-up"></i> Guardar ahora
              </button>
              <button class="btn btn-ghost" onclick="App.openModal('modal-github')">
                <i class="fa-solid fa-pen"></i> Editar configuración
              </button>
              <button class="btn btn-ghost" onclick="App.loadFromGitHub()">
                <i class="fa-solid fa-cloud-arrow-down"></i> Cargar desde GitHub
              </button>
            </div>
          ` : `
            <p style="font-family:var(--font-ui);font-size:13px;color:var(--text-3)">No conectado a GitHub</p>
            <button class="btn btn-primary" onclick="App.openModal('modal-github')">
              <i class="fa-brands fa-github"></i> Conectar GitHub
            </button>
          `}
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-section-title">Datos</div>
        <div class="settings-body">
          <div class="settings-row">
            <div class="settings-row-info">
              <div class="settings-row-label">Exportar datos</div>
              <div class="settings-row-desc">Descarga todos tus datos como JSON</div>
            </div>
            <button class="btn btn-ghost btn-sm" onclick="App.exportData()">
              <i class="fa-solid fa-download"></i> Exportar JSON
            </button>
          </div>
          <div class="settings-row">
            <div class="settings-row-info">
              <div class="settings-row-label">Importar datos</div>
              <div class="settings-row-desc">Carga un archivo JSON exportado previamente</div>
            </div>
            <label class="btn btn-ghost btn-sm" style="cursor:pointer">
              <i class="fa-solid fa-upload"></i> Importar JSON
              <input type="file" accept=".json" style="display:none" onchange="App.importData(event)"/>
            </label>
          </div>
          <div class="settings-row" style="border-top:1px solid var(--border);padding-top:16px;margin-top:4px">
            <div class="settings-row-info">
              <div class="settings-row-label" style="color:var(--red)">Borrar todo</div>
              <div class="settings-row-desc">Elimina todos los datos locales</div>
            </div>
            <button class="btn btn-danger btn-sm" onclick="App.clearAllData()">
              <i class="fa-solid fa-trash"></i> Borrar todo
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function updateSetting(key, value) {
    const settings = Store.get().settings;
    settings[key] = value;
    Store.set('settings', settings);
    if (key === 'langName') {
      document.title = `Ajustes — ${value} | Conlang Studio`;
    }
  }

  function updateMeta(key, value) {
    const meta = Store.get().meta;
    meta[key] = value;
    Store.set('meta', meta);
  }

  function setupRouter() {
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => navigate(btn.dataset.view));
    });
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && VIEW_TITLES[hash]) navigate(hash);
    });
  }

  function setupMenuToggle() {
    const toggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    toggle?.addEventListener('click', () => sidebar.classList.toggle('open'));
    document.getElementById('app')?.addEventListener('click', e => {
      if (window.innerWidth <= 768 && sidebar.classList.contains('open') && !sidebar.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    });
  }

  function setupConfirmModal() {
    document.getElementById('confirm-action')?.addEventListener('click', () => {
      if (confirmCallback) { confirmCallback(); confirmCallback = null; }
      closeModal('modal-confirm');
    });
  }

  function openModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.remove('hidden');
  }

  function closeModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.add('hidden');
  }

  function confirm(message, callback) {
    document.getElementById('confirm-message').textContent = message;
    confirmCallback = callback;
    openModal('modal-confirm');
  }

  function openNewModal() {
    if (currentView === 'lexicon') Lexicon.openNew();
    else if (currentView === 'grammar') Grammar.openNew();
    else if (currentView === 'tags') openModal('modal-tag');
    else navigate('lexicon'), setTimeout(() => Lexicon.openNew(), 50);
  }

  function toast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', info: 'fa-circle-info' };
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i> ${message}`;
    container.appendChild(t);
    setTimeout(() => t.remove(), 3200);
  }

  async function saveToGitHub() {
    const cfg = GitHub.getConfig();
    if (!cfg) { openModal('modal-github'); return; }

    const status = document.getElementById('sync-status');
    status.innerHTML = '<i class="fa-solid fa-rotate fa-spin"></i><span>Guardando...</span>';
    status.className = 'sync-status syncing';

    try {
      await GitHub.saveAll();
      status.innerHTML = '<i class="fa-solid fa-circle-check"></i><span>Sincronizado</span>';
      status.className = 'sync-status synced';
      toast('Guardado en GitHub ✓', 'success');
    } catch (err) {
      status.innerHTML = '<i class="fa-solid fa-circle-xmark"></i><span>Error</span>';
      status.className = 'sync-status error';
      toast(`Error: ${err.message}`, 'error');
    }
  }

  async function loadFromGitHub() {
    const cfg = GitHub.getConfig();
    if (!cfg) { openModal('modal-github'); return; }
    try {
      toast('Cargando desde GitHub...', 'info');
      const ok = await GitHub.loadFromGitHub();
      if (ok) {
        toast('Datos cargados ✓', 'success');
        navigate(currentView);
      } else {
        toast('No se encontraron datos en el repo', 'error');
      }
    } catch (err) {
      toast(`Error: ${err.message}`, 'error');
    }
  }

  async function saveGitHubConfig() {
    const cfg = {
      token: document.getElementById('gh-token').value.trim(),
      owner: document.getElementById('gh-owner').value.trim(),
      repo: document.getElementById('gh-repo').value.trim(),
      branch: document.getElementById('gh-branch').value.trim() || 'main'
    };
    if (!cfg.token || !cfg.owner || !cfg.repo) {
      toast('Completa todos los campos', 'error');
      return;
    }
    try {
      toast('Verificando conexión...', 'info');
      await GitHub.testConnection(cfg);
      GitHub.setConfig(cfg);
      closeModal('modal-github');
      toast('GitHub conectado ✓', 'success');
      if (currentView === 'settings') renderSettings();
      else if (currentView === 'dashboard') renderDashboard();
    } catch (err) {
      toast(`Error de conexión: ${err.message}`, 'error');
    }
  }

  function exportData() {
    const json = Store.exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${Store.get().settings.langName || 'conlang'}-data.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Datos exportados', 'success');
  }

  function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const ok = Store.importJSON(e.target.result);
      if (ok) {
        toast('Datos importados ✓', 'success');
        navigate(currentView);
      } else {
        toast('Error al importar el archivo', 'error');
      }
    };
    reader.readAsText(file);
  }

  function clearAllData() {
    confirm('¿Borrar todos los datos locales? Esta acción no se puede deshacer.', () => {
      localStorage.clear();
      Store.load();
      toast('Datos borrados', 'info');
      navigate('dashboard');
    });
  }

  // Pre-fill GitHub modal if config exists
  function prefillGitHubModal() {
    const cfg = GitHub.getConfig();
    if (!cfg) return;
    document.getElementById('gh-token').value = cfg.token || '';
    document.getElementById('gh-owner').value = cfg.owner || '';
    document.getElementById('gh-repo').value = cfg.repo || '';
    document.getElementById('gh-branch').value = cfg.branch || 'main';
  }

  // Close modals on overlay click
  document.addEventListener('click', e => {
    if (e.target.classList.contains('modal-overlay')) {
      e.target.classList.add('hidden');
    }
  });

  // Intercept GitHub modal open to pre-fill
  const origOpenModal = id => {
    const m = document.getElementById(id);
    if (m) { m.classList.remove('hidden'); if (id === 'modal-github') prefillGitHubModal(); }
  };

  return {
    init, navigate, currentView: () => currentView,
    openModal: origOpenModal,
    closeModal,
    confirm,
    openNewModal,
    toast,
    saveToGitHub, loadFromGitHub, saveGitHubConfig,
    updateSetting, updateMeta,
    exportData, importData, clearAllData,
    renderDashboard
  };
})();

// ─── INIT ───
document.addEventListener('DOMContentLoaded', () => App.init());
