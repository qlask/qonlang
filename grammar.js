// ─── GRAMMAR ───
const Grammar = (() => {
  let editingId = null;
  let filterCat = '';

  const CATEGORIES = ['morfología','sintaxis','fonología','ortografía','pragmática','semántica','otro'];

  function render() {
    const container = document.getElementById('view-container');
    const rules = getFilteredRules();
    const d = Store.get();

    container.innerHTML = `
      <div class="section-header">
        <h2 class="section-title">Gramática <span style="color:var(--text-3);font-size:16px;font-family:var(--font-ui)">${d.rules.length} reglas</span></h2>
        <button class="btn btn-accent" onclick="Grammar.openNew()">
          <i class="fa-solid fa-plus"></i> Nueva Regla
        </button>
      </div>

      <div class="filters-bar">
        <button class="filter-btn ${!filterCat ? 'active' : ''}" onclick="Grammar.setFilter('')">Todas</button>
        ${CATEGORIES.map(c =>
          `<button class="filter-btn ${filterCat === c ? 'active' : ''}" onclick="Grammar.setFilter('${c}')">${capitalize(c)}</button>`
        ).join('')}
      </div>

      ${rules.length === 0
        ? `<div class="empty-state">
            <i class="fa-solid fa-scroll"></i>
            <h3>${d.rules.length === 0 ? 'Sin reglas' : 'Sin resultados'}</h3>
            <p>${d.rules.length === 0 ? 'Documenta la gramática de tu idioma: morfología, sintaxis, conjugaciones y más.' : 'No hay reglas en esta categoría.'}</p>
            ${d.rules.length === 0 ? '<button class="btn btn-primary" onclick="Grammar.openNew()"><i class="fa-solid fa-plus"></i> Primera regla</button>' : ''}
          </div>`
        : `<div class="rules-list">${rules.map(renderRuleCard).join('')}</div>`
      }
    `;
  }

  function renderRuleCard(rule) {
    return `
      <div class="rule-card">
        <div class="rule-card-header" onclick="Grammar.toggleRule('${rule.id}')">
          <div class="rule-card-title">
            <span class="rule-category-badge">${rule.category || 'otro'}</span>
            <h3>${rule.title}</h3>
          </div>
          <div class="rule-card-actions" onclick="event.stopPropagation()">
            <button class="icon-btn" onclick="Grammar.openEdit('${rule.id}')" title="Editar">
              <i class="fa-solid fa-pen" style="font-size:12px"></i>
            </button>
            <button class="icon-btn" onclick="Grammar.confirmDelete('${rule.id}')" title="Eliminar">
              <i class="fa-solid fa-trash" style="font-size:12px;color:var(--red)"></i>
            </button>
            <i class="fa-solid fa-chevron-down" style="font-size:12px;color:var(--text-3)" id="chevron-${rule.id}"></i>
          </div>
        </div>
        <div class="rule-card-body" id="rule-body-${rule.id}">
          <div class="md-preview">${MD.render(rule.content)}</div>
        </div>
      </div>
    `;
  }

  function toggleRule(id) {
    const body = document.getElementById(`rule-body-${id}`);
    const chevron = document.getElementById(`chevron-${id}`);
    if (!body) return;
    const isOpen = body.classList.toggle('open');
    if (chevron) {
      chevron.style.transform = isOpen ? 'rotate(180deg)' : '';
      chevron.style.transition = 'transform 0.2s';
    }
  }

  function getFilteredRules() {
    let rules = [...Store.get().rules];
    if (filterCat) rules = rules.filter(r => r.category === filterCat);
    return rules.sort((a, b) => a.title.localeCompare(b.title));
  }

  function setFilter(cat) {
    filterCat = cat;
    render();
  }

  function openNew() {
    editingId = null;
    document.getElementById('rule-modal-title').textContent = 'Nueva Regla Gramatical';
    document.getElementById('rule-title').value = '';
    document.getElementById('rule-content').value = '';
    document.getElementById('rule-category').value = 'morfología';
    const preview = document.getElementById('rule-content-preview');
    const textarea = document.getElementById('rule-content');
    if (preview) preview.classList.add('hidden');
    if (textarea) textarea.classList.remove('hidden');
    App.openModal('modal-rule');
  }

  function openEdit(id) {
    editingId = id;
    const rule = Store.get().rules.find(r => r.id === id);
    if (!rule) return;
    document.getElementById('rule-modal-title').textContent = 'Editar Regla';
    document.getElementById('rule-title').value = rule.title;
    document.getElementById('rule-content').value = rule.content || '';
    document.getElementById('rule-category').value = rule.category || 'morfología';
    const preview = document.getElementById('rule-content-preview');
    const textarea = document.getElementById('rule-content');
    if (preview) preview.classList.add('hidden');
    if (textarea) textarea.classList.remove('hidden');
    App.openModal('modal-rule');
  }

  function saveRule() {
    const title = document.getElementById('rule-title').value.trim();
    if (!title) { App.toast('Escribe un título para la regla', 'error'); return; }

    const ruleData = {
      title,
      content: document.getElementById('rule-content').value.trim(),
      category: document.getElementById('rule-category').value
    };

    if (editingId) {
      Store.updateRule(editingId, ruleData);
      App.toast('Regla actualizada', 'success');
    } else {
      Store.addRule(ruleData);
      App.toast('Regla creada', 'success');
    }

    App.closeModal('modal-rule');
    render();
  }

  function confirmDelete(id) {
    const rule = Store.get().rules.find(r => r.id === id);
    App.confirm(`¿Eliminar la regla "${rule.title}"?`, () => {
      Store.deleteRule(id);
      App.toast('Regla eliminada');
      render();
    });
  }

  function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  return {
    render, openNew, openEdit, saveRule,
    confirmDelete, toggleRule, setFilter
  };
})();
