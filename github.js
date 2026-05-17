// ─── GITHUB ─── Save data to GitHub repo via REST API
const GitHub = (() => {
  const FILE_PATH = 'conlang-data.json';
  const FONT_PATH = 'conlang-font.json';

  function getConfig() {
    const d = Store.get();
    return d.github;
  }

  function setConfig(cfg) {
    Store.set('github', cfg);
  }

  async function getFileSHA(cfg, path) {
    const res = await fetch(
      `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${path}?ref=${cfg.branch}`,
      { headers: authHeaders(cfg) }
    );
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`GitHub error ${res.status}`);
    const json = await res.json();
    return json.sha;
  }

  function authHeaders(cfg) {
    return {
      Authorization: `token ${cfg.token}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github.v3+json'
    };
  }

  async function pushFile(cfg, path, content, message) {
    const sha = await getFileSHA(cfg, path);
    const body = {
      message,
      content: btoa(unescape(encodeURIComponent(content))),
      branch: cfg.branch
    };
    if (sha) body.sha = sha;

    const res = await fetch(
      `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${path}`,
      { method: 'PUT', headers: authHeaders(cfg), body: JSON.stringify(body) }
    );
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || `GitHub write error ${res.status}`);
    }
    return await res.json();
  }

  async function pullFile(cfg, path) {
    const res = await fetch(
      `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${path}?ref=${cfg.branch}`,
      { headers: authHeaders(cfg) }
    );
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`GitHub read error ${res.status}`);
    const json = await res.json();
    return decodeURIComponent(escape(atob(json.content)));
  }

  async function saveAll() {
    const cfg = getConfig();
    if (!cfg || !cfg.token) throw new Error('GitHub no configurado');

    const langName = Store.get().settings.langName || 'Mi Conlang';
    const timestamp = new Date().toISOString();

    await pushFile(cfg, FILE_PATH, Store.exportJSON(),
      `${langName}: actualización ${timestamp}`);

    // Also save font separately if glyphs exist
    const glyphs = Store.get().glyphs;
    if (Object.keys(glyphs).length > 0) {
      await pushFile(cfg, FONT_PATH, JSON.stringify(glyphs, null, 2),
        `${langName}: actualización de fuente ${timestamp}`);
    }

    // Push a simple index.md for GitHub Pages display
    const mdContent = buildMarkdownSummary();
    await pushFile(cfg, 'README.md', mdContent,
      `${langName}: actualización de README ${timestamp}`);
  }

  async function loadFromGitHub() {
    const cfg = getConfig();
    if (!cfg || !cfg.token) throw new Error('GitHub no configurado');
    const raw = await pullFile(cfg, FILE_PATH);
    if (!raw) return false;
    return Store.importJSON(raw);
  }

  function buildMarkdownSummary() {
    const d = Store.get();
    const s = d.settings;
    const lines = [
      `# ${s.langName}`,
      '',
      d.meta.description ? `> ${d.meta.description}` : '',
      '',
      `## Estadísticas`,
      '',
      `- **Palabras:** ${d.words.length}`,
      `- **Reglas gramaticales:** ${d.rules.length}`,
      `- **Etiquetas:** ${d.tags.length}`,
      '',
      `## Léxico (muestra)`,
      '',
      '| Palabra | Romanización | IPA | Definición |',
      '|---------|-------------|-----|------------|',
      ...d.words.slice(0, 20).map(w =>
        `| ${w.native || '—'} | ${w.romanized || '—'} | ${w.ipa ? `/${w.ipa}/` : '—'} | ${(w.definition || '').replace(/\|/g, '｜').substring(0, 60)} |`
      ),
      '',
      `---`,
      `*Generado por [Conlang Studio](https://github.com/tu-usuario/conlang-studio) el ${new Date().toLocaleDateString('es-ES')}*`
    ];
    return lines.join('\n');
  }

  async function testConnection(cfg) {
    const res = await fetch(
      `https://api.github.com/repos/${cfg.owner}/${cfg.repo}`,
      { headers: authHeaders(cfg) }
    );
    if (!res.ok) throw new Error(`No se pudo conectar: ${res.status}`);
    return await res.json();
  }

  return {
    getConfig, setConfig,
    saveAll, loadFromGitHub,
    testConnection, buildMarkdownSummary
  };
})();
