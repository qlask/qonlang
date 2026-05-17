// ─── STORE ─── Local persistence + GitHub sync
const Store = (() => {
  const KEY = 'conlang_studio_data';

  const defaults = {
    meta: {
      name: 'Mi Conlang',
      description: '',
      created: new Date().toISOString(),
      version: '1.0'
    },
    words: [],
    rules: [],
    phonology: {
      consonants: {},
      vowels: {},
      notes: '',
      inventory: []
    },
    tags: [
      { id: 't1', name: 'Arcaísmo', color: '#6B5CE7', desc: 'Palabras de uso antiguo' },
      { id: 't2', name: 'Técnico', color: '#5CA4E7', desc: 'Vocabulario técnico o especializado' },
      { id: 't3', name: 'Coloquial', color: '#5CE7A0', desc: 'Uso informal' }
    ],
    glyphs: {},
    github: null,
    settings: {
      langName: 'Mi Conlang',
      nativeScriptName: 'Alfabeto nativo',
      scriptType: 'alphabet',
      rtl: false
    }
  };

  let data = null;

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      data = raw ? { ...defaults, ...JSON.parse(raw) } : JSON.parse(JSON.stringify(defaults));
    } catch {
      data = JSON.parse(JSON.stringify(defaults));
    }
    return data;
  }

  function save() {
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  function get() { return data; }

  function set(key, value) {
    data[key] = value;
    save();
  }

  function addWord(word) {
    word.id = 'w_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    word.created = new Date().toISOString();
    data.words.push(word);
    save();
    return word;
  }

  function updateWord(id, updates) {
    const i = data.words.findIndex(w => w.id === id);
    if (i !== -1) {
      data.words[i] = { ...data.words[i], ...updates, updated: new Date().toISOString() };
      save();
      return data.words[i];
    }
  }

  function deleteWord(id) {
    data.words = data.words.filter(w => w.id !== id);
    save();
  }

  function addRule(rule) {
    rule.id = 'r_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    rule.created = new Date().toISOString();
    data.rules.push(rule);
    save();
    return rule;
  }

  function updateRule(id, updates) {
    const i = data.rules.findIndex(r => r.id === id);
    if (i !== -1) {
      data.rules[i] = { ...data.rules[i], ...updates, updated: new Date().toISOString() };
      save();
      return data.rules[i];
    }
  }

  function deleteRule(id) {
    data.rules = data.rules.filter(r => r.id !== id);
    save();
  }

  function addTag(tag) {
    tag.id = 'tag_' + Date.now();
    data.tags.push(tag);
    save();
    return tag;
  }

  function deleteTag(id) {
    data.tags = data.tags.filter(t => t.id !== id);
    data.words.forEach(w => {
      if (w.tags) w.tags = w.tags.filter(tid => tid !== id);
    });
    save();
  }

  function setGlyph(char, svgData) {
    data.glyphs[char] = svgData;
    save();
  }

  function getGlyph(char) {
    return data.glyphs[char] || null;
  }

  function exportJSON() {
    return JSON.stringify(data, null, 2);
  }

  function importJSON(jsonStr) {
    try {
      const imported = JSON.parse(jsonStr);
      data = { ...defaults, ...imported };
      save();
      return true;
    } catch {
      return false;
    }
  }

  return {
    load, save, get, set,
    addWord, updateWord, deleteWord,
    addRule, updateRule, deleteRule,
    addTag, deleteTag,
    setGlyph, getGlyph,
    exportJSON, importJSON
  };
})();
