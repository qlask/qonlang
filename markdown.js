// ─── MARKDOWN ─── Editor helpers
const MD = (() => {
  function wrap(id, before, after) {
    const el = document.getElementById(id);
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = el.value.substring(start, end);
    el.value = el.value.substring(0, start) + before + selected + after + el.value.substring(end);
    el.selectionStart = start + before.length;
    el.selectionEnd = end + before.length;
    el.focus();
  }

  function insertLine(id, prefix) {
    const el = document.getElementById(id);
    if (!el) return;
    const pos = el.selectionStart;
    const lineStart = el.value.lastIndexOf('\n', pos - 1) + 1;
    el.value = el.value.substring(0, lineStart) + prefix + el.value.substring(lineStart);
    const newPos = lineStart + prefix.length + (pos - lineStart);
    el.selectionStart = el.selectionEnd = newPos;
    el.focus();
  }

  function insertTable(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const tbl = '\n| Columna 1 | Columna 2 | Columna 3 |\n|-----------|-----------|----------|\n| Celda     | Celda     | Celda     |\n';
    const pos = el.selectionStart;
    el.value = el.value.substring(0, pos) + tbl + el.value.substring(pos);
    el.focus();
  }

  function togglePreview(id) {
    const textarea = document.getElementById(id);
    const preview = document.getElementById(id + '-preview');
    if (!textarea || !preview) return;

    if (preview.classList.contains('hidden')) {
      preview.innerHTML = marked.parse(textarea.value || '*Sin contenido*');
      preview.classList.remove('hidden');
      textarea.classList.add('hidden');
    } else {
      preview.classList.add('hidden');
      textarea.classList.remove('hidden');
    }
  }

  function render(text) {
    if (!text) return '';
    return marked.parse(text);
  }

  return { wrap, insertLine, insertTable, togglePreview, render };
})();
