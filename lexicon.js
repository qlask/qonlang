// ─── LEXICON ───
const Lexicon = (() => {
  let editingId = null;
  let filterPOS = '';
  let filterTag = '';
  let searchQuery = '';

  const IPA_KEYS = [
    'p','b','t','d','k','g','q','ʔ','m','n','ŋ','ɲ','ɳ',
    'f','v','θ','ð','s','z','ʃ','ʒ','x','ɣ','χ','h','ħ',
    'r','ɾ','ɹ','l','ɭ','ʎ','j','w',
    'i','y','ɨ','u','e','ø','ə','o','ɛ','œ','ɔ','æ','a','ɑ',
    'ˈ','ˌ','ː','ˑ','.',',','-',
    'tʃ','dʒ','ts','dz','pf'
  ];

  function render() {
    const container = document.getElementById('view-container');
    const d = Store.get();
    const words = getFilteredWords();

    container.innerHTML = `
      <div class="section-header">
        <h2 class="section-title">Léxico <span style="color:var(--text-3);font-size:16px;font-family:var(--font-ui)">${d.words.length} palabras</span></h2>
        <button class="btn btn-accent" onclick="Lexicon.openNew()">
          <i class="fa-solid fa-plus"></i> Nueva Palabra
        </button>
      </div>

      <div class="search-bar">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input type="text" class="search-input" placeholder="Buscar por palabra, romanización, definición..."
          id="lex-search" value="${searchQuery}"
          oninput="Lexicon.onSearch(this.value)"/>
      </div>

      <div class="filters-bar" id="lex-filters">
        <button class="filter-btn ${!filterPOS ? 'active' : ''}" onclick="Lexicon.setFilter('pos','')">Todos</button>
        ${['sustantivo','verbo','adjetivo','adverbio','pronombre','preposición','conjunción'].map(p =>
          `<button class="filter-btn ${filterPOS === p ? 'active' : ''}" onclick="Lexicon.setFilter('pos','${p}')">${p.charAt(0).toUpperCase()+p.slice(1)}</button>`
        ).join('')}
        ${d.tags.length > 0 ? '<span style="color:var(--text-3);font-size:12px;margin:0 4px">|</span>' : ''}
        ${d.tags.map(t =>
          `<button class="filter-btn ${filterTag === t.id ? 'active' : ''}" style="${filterTag===t.id?`background:${t.color}20;border-color:${t.color};color:${t.color}`:''}" onclick="Lexicon.setFilter('tag','${t.id}')">${t.name}</button>`
        ).join('')}
      </div>

      ${words.length === 0
        ? `<div class="empty-state">
            <i class="fa-solid fa-book-open"></i>
            <h3>${d.words.length === 0 ? 'Léxico vacío' : 'Sin resultados'}</h3>
            <p>${d.words.length === 0 ? 'Empieza añadiendo palabras a tu idioma construido.' : 'Prueba con otros filtros o términos de búsqueda.'}</p>
            ${d.words.length === 0 ? '<button class="btn btn-primary" onclick="Lexicon.openNew()"><i class="fa-solid fa-plus"></i> Añadir primera palabra</button>' : ''}
          </div>`
        : `<div class="words-grid">${words.map(renderWordCard).join('')}</div>`
      }
    `;
  }

  function renderWordCard(word) {
    const settings = Store.get().settings;
    return `
      <div class="word-card" onclick="Lexicon.openEdit('${word.id}')">
        <div class="word-card-actions">
          <button class="icon-btn" onclick="event.stopPropagation();Lexicon.confirmDelete('${word.id}')" title="Eliminar">
            <i class="fa-solid fa-trash" style="font-size:12px;color:var(--red)"></i>
          </button>
        </div>
        <div class="word-card-header">
          <div class="word-card-left">
            ${word.native ? `<div class="word-native">${word.native}</div>` : ''}
            ${word.romanized ? `<div class="word-romanized">${word.romanized}</div>` : ''}
            ${word.ipa ? `<div class="word-ipa">/${word.ipa}/</div>` : ''}
          </div>
          ${word.pos ? `<span class="word-pos">${word.pos}</span>` : ''}
        </div>
        ${word.definition ? `<div class="word-definition">${word.definition}</div>` : ''}
        ${word.tags && word.tags.length > 0 ? `<div class="word-footer">${Tags.renderTagBadges(word.tags)}</div>` : ''}
      </div>
    `;
  }

  function getFilteredWords() {
    let words = [...Store.get().words];
    if (filterPOS) words = words.filter(w => w.pos === filterPOS);
    if (filterTag) words = words.filter(w => w.tags && w.tags.includes(filterTag));
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      words = words.filter(w =>
        (w.native && w.native.toLowerCase().includes(q)) ||
        (w.romanized && w.romanized.toLowerCase().includes(q)) ||
        (w.definition && w.definition.toLowerCase().includes(q)) ||
        (w.ipa && w.ipa.toLowerCase().includes(q))
      );
    }
    return words.sort((a, b) => (a.romanized || a.native || '').localeCompare(b.romanized || b.native || ''));
  }

  function onSearch(val) {
    searchQuery = val;
    render();
    // re-focus
    const el = document.getElementById('lex-search');
    if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
  }

  function setFilter(type, val) {
    if (type === 'pos') filterPOS = val;
    if (type === 'tag') filterTag = filterTag === val ? '' : val;
    render();
  }

  function openNew() {
    editingId = null;
    document.getElementById('word-modal-title').textContent = 'Nueva Palabra';
    clearWordForm();
    buildIPAKeyboard();
    refreshTagSelector([]);
    App.openModal('modal-word');
  }

  function openEdit(id) {
    editingId = id;
    const word = Store.get().words.find(w => w.id === id);
    if (!word) return;

    document.getElementById('word-modal-title').textContent = 'Editar Palabra';
    document.getElementById('word-native').value = word.native || '';
    document.getElementById('word-romanized').value = word.romanized || '';
    document.getElementById('word-ipa').value = word.ipa || '';
    document.getElementById('word-pos').value = word.pos || '';
    document.getElementById('word-definition').value = word.definition || '';
    document.getElementById('word-notes').value = word.notes || '';

    // Hide preview if showing
    const preview = document.getElementById('word-notes-preview');
    const textarea = document.getElementById('word-notes');
    if (preview) preview.classList.add('hidden');
    if (textarea) textarea.classList.remove('hidden');

    // Examples
    const exList = document.getElementById('word-examples');
    exList.innerHTML = '';
    const examples = word.examples && word.examples.length > 0
      ? word.examples
      : [{ native: '', translation: '' }];
    examples.forEach(ex => addExampleRow(ex.native, ex.translation));

    buildIPAKeyboard();
    refreshTagSelector(word.tags || []);
    App.openModal('modal-word');
  }

  function clearWordForm() {
    ['word-native','word-romanized','word-ipa','word-definition','word-notes'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    document.getElementById('word-pos').value = '';
    const exList = document.getElementById('word-examples');
    exList.innerHTML = '';
    addExampleRow();
    const preview = document.getElementById('word-notes-preview');
    const textarea = document.getElementById('word-notes');
    if (preview) preview.classList.add('hidden');
    if (textarea) textarea.classList.remove('hidden');
  }

  function refreshTagSelector(selectedIds) {
    const container = document.getElementById('word-tags-container');
    if (!container) return;
    container.innerHTML = Tags.buildTagSelector(selectedIds);
    if (Store.get().tags.length === 0) {
      container.innerHTML = `<span style="color:var(--text-3);font-size:13px">No hay etiquetas. <a href="#" onclick="App.navigate('tags');return false" style="color:var(--accent)">Crear etiquetas</a></span>`;
    }
  }

  function buildIPAKeyboard() {
    const kb = document.getElementById('ipa-keyboard');
    if (!kb) return;
    kb.innerHTML = IPA_KEYS.map(k =>
      `<button type="button" class="ipa-key" onclick="Lexicon.insertIPA('${k}')">${k}</button>`
    ).join('');
  }

  function insertIPA(char) {
    const el = document.getElementById('word-ipa');
    if (!el) return;
    const pos = el.selectionStart;
    el.value = el.value.substring(0, pos) + char + el.value.substring(pos);
    el.selectionStart = el.selectionEnd = pos + char.length;
    el.focus();
  }

  function addExample(native = '', translation = '') {
    addExampleRow(native, translation);
  }

  function addExampleRow(native = '', translation = '') {
    const list = document.getElementById('word-examples');
    const div = document.createElement('div');
    div.className = 'example-item';
    div.innerHTML = `
      <input type="text" class="form-input ex-native native-font" placeholder="Frase en el idioma" value="${native}"/>
      <input type="text" class="form-input ex-translation" placeholder="Traducción" value="${translation}"/>
      <button type="button" class="example-remove" onclick="this.parentElement.remove()">✕</button>
    `;
    list.appendChild(div);
  }

  function saveWord() {
    const romanized = document.getElementById('word-romanized').value.trim();
    const native = document.getElementById('word-native').value.trim();
    if (!romanized && !native) {
      App.toast('Escribe al menos la romanización o la escritura nativa', 'error');
      return;
    }

    // Collect examples
    const exRows = document.querySelectorAll('#word-examples .example-item');
    const examples = [];
    exRows.forEach(row => {
      const n = row.querySelector('.ex-native')?.value.trim();
      const t = row.querySelector('.ex-translation')?.value.trim();
      if (n || t) examples.push({ native: n || '', translation: t || '' });
    });

    const wordData = {
      native,
      romanized,
      ipa: document.getElementById('word-ipa').value.trim(),
      pos: document.getElementById('word-pos').value,
      definition: document.getElementById('word-definition').value.trim(),
      notes: document.getElementById('word-notes').value.trim(),
      tags: Tags.getSelectedTagIds('word-tags-container'),
      examples
    };

    if (editingId) {
      Store.updateWord(editingId, wordData);
      App.toast('Palabra actualizada', 'success');
    } else {
      Store.addWord(wordData);
      App.toast('Palabra añadida', 'success');
    }

    App.closeModal('modal-word');
    render();
  }

  function confirmDelete(id) {
    const word = Store.get().words.find(w => w.id === id);
    const name = word.romanized || word.native || 'esta palabra';
    App.confirm(`¿Eliminar "${name}"?`, () => {
      Store.deleteWord(id);
      App.toast('Palabra eliminada');
      render();
    });
  }

  return {
    render, openNew, openEdit, saveWord, confirmDelete,
    addExample, insertIPA, onSearch, setFilter
  };
})();
