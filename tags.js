// ─── TAGS ───
const Tags = (() => {
  let selectedColor = '#6B5CE7';

  function render() {
    const tags = Store.get().tags;
    const container = document.getElementById('view-container');

    container.innerHTML = `
      <div class="section-header">
        <h2 class="section-title">Etiquetas</h2>
        <button class="btn btn-accent" onclick="App.openModal('modal-tag')">
          <i class="fa-solid fa-plus"></i> Nueva Etiqueta
        </button>
      </div>
      <div class="tags-grid" id="tags-grid">
        ${tags.length === 0 ? renderEmpty() : tags.map(renderTagCard).join('')}
      </div>
    `;

    // Color picker
    document.querySelectorAll('.swatch').forEach(s => {
      s.addEventListener('click', () => {
        document.querySelectorAll('.swatch').forEach(x => x.classList.remove('active'));
        s.classList.add('active');
        selectedColor = s.dataset.color;
      });
    });
  }

  function renderTagCard(tag) {
    const count = Store.get().words.filter(w => w.tags && w.tags.includes(tag.id)).length;
    return `
      <div class="tag-card">
        <div class="tag-swatch" style="background:${tag.color}"></div>
        <div class="tag-card-info">
          <div class="tag-card-name">${tag.name}</div>
          ${tag.desc ? `<div class="tag-card-desc">${tag.desc}</div>` : ''}
        </div>
        <span class="tag-card-count">${count} palabras</span>
        <button class="icon-btn" onclick="Tags.confirmDelete('${tag.id}')" title="Eliminar">
          <i class="fa-solid fa-trash" style="color:var(--red);font-size:12px"></i>
        </button>
      </div>
    `;
  }

  function renderEmpty() {
    return `<div class="empty-state" style="grid-column:1/-1">
      <i class="fa-solid fa-tags"></i>
      <h3>Sin etiquetas</h3>
      <p>Crea etiquetas para organizar tu léxico por categorías semánticas, registros o características.</p>
    </div>`;
  }

  function saveTag() {
    const name = document.getElementById('tag-name').value.trim();
    if (!name) { App.toast('Escribe un nombre para la etiqueta', 'error'); return; }

    Store.addTag({
      name,
      color: selectedColor,
      desc: document.getElementById('tag-desc').value.trim()
    });

    App.closeModal('modal-tag');
    App.toast('Etiqueta creada', 'success');
    document.getElementById('tag-name').value = '';
    document.getElementById('tag-desc').value = '';
    if (App.currentView === 'tags') render();
  }

  function confirmDelete(id) {
    const tag = Store.get().tags.find(t => t.id === id);
    App.confirm(`¿Eliminar la etiqueta "${tag.name}"? Se quitará de todas las palabras.`, () => {
      Store.deleteTag(id);
      App.toast('Etiqueta eliminada');
      render();
    });
  }

  function buildTagSelector(selectedIds = []) {
    const tags = Store.get().tags;
    return tags.map(t => {
      const isSelected = selectedIds.includes(t.id);
      const contrast = hexToLuma(t.color) > 128 ? '#1a1a1a' : '#ffffff';
      return `<span class="tag tag-option ${isSelected ? 'selected' : ''}"
        data-tag-id="${t.id}"
        style="background:${t.color}20;border-color:${t.color};color:${t.color}"
        onclick="Tags.toggleTagSelect(this)"
      >${t.name}</span>`;
    }).join('');
  }

  function toggleTagSelect(el) {
    el.classList.toggle('selected');
  }

  function getSelectedTagIds(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return [];
    return Array.from(container.querySelectorAll('.tag-option.selected')).map(el => el.dataset.tagId);
  }

  function renderTagBadges(tagIds) {
    if (!tagIds || tagIds.length === 0) return '';
    const tags = Store.get().tags;
    return tagIds.map(id => {
      const t = tags.find(tg => tg.id === id);
      if (!t) return '';
      return `<span class="tag" style="background:${t.color}20;border-color:${t.color};color:${t.color}">${t.name}</span>`;
    }).join('');
  }

  function hexToLuma(hex) {
    const c = hex.replace('#', '');
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  return {
    render, saveTag, confirmDelete,
    buildTagSelector, toggleTagSelect,
    getSelectedTagIds, renderTagBadges
  };
})();
