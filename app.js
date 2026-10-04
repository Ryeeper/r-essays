const app = document.querySelector('#app');
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));
const title = essay => essay.title?.trim() || 'Untitled';
const dateText = date => new Date(`${date}T12:00:00`).toLocaleDateString('en-US', {
  month: 'short', day: 'numeric'
});
const words = body => body.trim().split(/\s+/).filter(Boolean).length;
const readTime = essay => `${Math.max(1, Math.ceil(words(essay.body || '') / 220))} min read`;
const sorted = list => [...list].sort((a, b) =>
  b.date.localeCompare(a.date) || (b.updatedAt || '').localeCompare(a.updatedAt || '')
);
const searchIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>';
let essays = [];
let query = '';
let category = '';

function header() {
  return `<header class="site-header"><a class="wordmark" href="#" aria-label="R’s essays home"><span class="brand-star" aria-hidden="true">✳</span> R’s essays</a><nav aria-label="Main navigation"><a href="#collection">Essays</a></nav></header>`;
}

function metadata(essay) {
  return `<div class="metadata"><time datetime="${esc(essay.date)}">${dateText(essay.date)}, ${esc(essay.date.slice(0, 4))}</time>${essay.category ? `<span>·</span><span>${esc(essay.category)}</span>` : ''}</div>`;
}

function renderHome() {
  const list = sorted(essays);
  const featured = list[0];
  const categories = [...new Set(essays.map(essay => essay.category).filter(Boolean))].sort();
  app.innerHTML = `${header()}<main class="home"><section class="feature"><div class="feature-copy">${featured ? `${metadata(featured)}<a href="#essay/${encodeURIComponent(featured.id)}"><h1>${esc(title(featured))}</h1></a><a class="read-link" href="#essay/${encodeURIComponent(featured.id)}">Read essay <span aria-hidden="true">↗</span></a>` : '<h1>No essays yet.</h1>'}</div><div class="feature-art"><img src="landscape.svg" alt="A blue landscape in a circular window" width="500" height="500"></div></section><section class="collection" id="collection" aria-label="Essay collection"><div class="collection-tools"><div class="collection-label">Essays <span>${essays.length}</span></div><div class="find-tools"><label class="search-field">${searchIcon}<input id="search" type="search" placeholder="Search" aria-label="Search essays" value="${esc(query)}"></label><label class="sr-only" for="category">Filter by topic</label><select id="category"><option value="">All topics</option>${categories.map(topic => `<option value="${esc(topic)}" ${category === topic ? 'selected' : ''}>${esc(topic)}</option>`).join('')}</select></div></div><div id="essay-list"></div></section><footer class="site-footer"><span>R’s essays</span></footer></main>`;
  document.querySelector('#search').addEventListener('input', event => {
    query = event.target.value;
    renderList();
  });
  document.querySelector('#category').addEventListener('change', event => {
    category = event.target.value;
    renderList();
  });
  renderList();
}

function renderList() {
  const normalizedQuery = query.toLowerCase();
  const list = sorted(essays.filter(essay =>
    (!category || essay.category === category) &&
    `${essay.title} ${essay.body} ${essay.category}`.toLowerCase().includes(normalizedQuery)
  ));
  let year = '';
  const rows = list.map(essay => {
    const essayYear = essay.date.slice(0, 4);
    const heading = essayYear !== year ? `<h2 class="year-label">${esc(essayYear)}</h2>` : '';
    year = essayYear;
    return `${heading}<a class="essay-row" href="#essay/${encodeURIComponent(essay.id)}"><time datetime="${esc(essay.date)}">${dateText(essay.date)}</time><h3>${esc(title(essay))}</h3><span class="row-topic">${esc(essay.category || '')}</span><span class="row-time">${readTime(essay)}</span><span class="row-arrow" aria-hidden="true">↗</span></a>`;
  }).join('');
  document.querySelector('#essay-list').innerHTML = rows || `<div class="empty-list"><p>${normalizedQuery || category ? 'No matching essays.' : 'No essays yet.'}</p>${normalizedQuery || category ? '<button id="clear-filters" class="text-button">Clear filters</button>' : ''}</div>`;
  document.querySelector('#clear-filters')?.addEventListener('click', () => {
    query = '';
    category = '';
    document.querySelector('#search').value = '';
    document.querySelector('#category').value = '';
    renderList();
  });
}

function richText(body) {
  return window.EssayMarkdown.render(body || '');
}

function downloadEssay(essay) {
  const content = `# ${title(essay)}\n\n${essay.body || ''}\n`;
  const url = URL.createObjectURL(new Blob([content], { type: 'text/markdown;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title(essay)}.md`.replace(/[<>:"/\\|?*]/g, '-');
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function renderReader(id) {
  const essay = essays.find(item => item.id === id);
  if (!essay) return renderMissing();
  const list = sorted(essays);
  const index = list.findIndex(item => item.id === id);
  const next = list.length > 1 ? list[(index + 1) % list.length] : null;
  app.innerHTML = `${header()}<main class="reader"><div class="reader-toolbar"><a href="#collection" class="back-link">← Essays</a><div><button id="download-essay" class="text-button">Download</button></div></div><header class="reader-heading"><div class="metadata">${essay.category ? `<span>${esc(essay.category)}</span><span>·</span>` : ''}<span>${readTime(essay)}</span>${essay.sample ? '<span class="sample-label">Sample essay</span>' : ''}</div><h1>${esc(title(essay))}</h1><time datetime="${esc(essay.date)}">${dateText(essay.date)}, ${esc(essay.date.slice(0, 4))}</time></header><article class="prose">${richText(essay.body) || '<p class="empty-body">This essay is empty.</p>'}</article><div class="reader-end"><a href="#collection">← All essays</a>${next ? `<a class="next-essay" href="#essay/${encodeURIComponent(next.id)}"><span>Next essay ↗</span><strong>${esc(title(next))}</strong></a>` : ''}</div></main>`;
  document.querySelector('#download-essay').addEventListener('click', () => downloadEssay(essay));
}

function renderMissing() {
  app.innerHTML = `${header()}<main class="reader"><h1 class="missing-title">Essay not found.</h1><a class="text-button" href="#collection">Back to essays →</a></main>`;
}

function route() {
  const target = location.hash;
  const match = target.match(/^#essay\/(.+)$/);
  if (match) {
    let id;
    try {
      id = decodeURIComponent(match[1]);
    } catch {
      renderMissing();
      return;
    }
    renderReader(id);
    window.scrollTo(0, 0);
  } else {
    renderHome();
    if (target === '#collection') document.querySelector('#collection').scrollIntoView();
    else window.scrollTo(0, 0);
  }
}

window.addEventListener('hashchange', route);
let refreshing = false;
let loaded = false;
let essayVersion = '';
async function refreshEssays() {
  if (refreshing) return;
  refreshing = true;
  try {
    const response = await fetch(`essays.json?v=${Date.now()}`, {cache: 'no-store'});
    if (!response.ok) throw new Error('The essay list could not be loaded.');
    const published = await response.json();
    if (!Array.isArray(published)) throw new Error('The essay list has an invalid format.');
    const version = JSON.stringify(published);
    if (!loaded || version !== essayVersion) {
      const oldScroll = {x: window.scrollX, y: window.scrollY};
      const active = document.activeElement;
      const focusId = active?.id;
      const selection = active instanceof HTMLInputElement ? [active.selectionStart, active.selectionEnd] : null;
      const wasLoaded = loaded;
      essays = published;
      essayVersion = version;
      loaded = true;
      if (category && !essays.some(essay => essay.category === category)) category = '';
      route();
      if (wasLoaded) {
        window.scrollTo(oldScroll.x, oldScroll.y);
        const replacement = focusId && document.getElementById(focusId);
        replacement?.focus({preventScroll: true});
        if (selection && replacement instanceof HTMLInputElement) {
          try { replacement.setSelectionRange(...selection); } catch {}
        }
      }
    }
  } catch {
    if (!loaded) app.innerHTML = '<main class="connection-error"><h1>R’s essays</h1><p>The essay collection could not be loaded. Please try again later.</p></main>';
  } finally {
    refreshing = false;
  }
}
window.addEventListener('focus', refreshEssays);
window.addEventListener('pageshow', refreshEssays);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) refreshEssays();
});
setInterval(() => { if (!document.hidden) refreshEssays(); }, 30000);
refreshEssays();
