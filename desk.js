const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
let engine = 'All databases', platform = 'all', category = 'All tasks', query = '', savedOnly = false;
let saved;
try { saved = new Set(JSON.parse(localStorage.getItem('dba-favourites') || '[]')); } catch { saved = new Set(); }
const engines = ['All databases', 'Oracle', 'PostgreSQL', 'MySQL', 'MongoDB'];
const categories = ['All tasks', ...new Set(R.map(r => r[1]))];
const key = r => `${r[0]}:${r[3]}`;
function matches(r, ignoreEngine = false) {
  const technology = r[2].toLowerCase();
  const shared = !engines.slice(1).some(e => technology.includes(e.toLowerCase()));
  return (ignoreEngine || engine === engines[0] || shared || technology.includes(engine.toLowerCase())) &&
    (platform === 'all' || r[0] === platform) && (category === 'All tasks' || r[1] === category) &&
    (!savedOnly || saved.has(key(r))) && query.toLowerCase().trim().split(/\s+/).every(word => r.join(' ').toLowerCase().includes(word));
}
function render() {
  $('#databaseFilters').innerHTML = engines.map((e,i) => `<button data-engine="${e}" aria-pressed="${engine === e}" class="database ${engine === e ? 'selected' : ''}"><span class="database-symbol">${['▦','OR','PG','MY','MO'][i]}</span><strong>${e}</strong><small>${i ? 'Database procedures + host checks' : 'Your complete task library'}</small></button>`).join('');
  $('#categories').innerHTML = categories.map(c => `<button class="nav-item ${category === c ? 'active' : ''}" data-category="${c}" aria-pressed="${category === c}">${c}</button>`).join('');
  const found = R.filter(r => matches(r));
  $('#sectionTitle').textContent = savedOnly ? 'Your favourites' : category;
  $('#resultCount').textContent = `${found.length} of ${R.length} procedures`;
  $('#savedFilter').setAttribute('aria-pressed', String(savedOnly));
  $('#cards').innerHTML = found.length ? found.map(r => {
    const id = R.indexOf(r);
    return `<article class="procedure"><div class="card-top"><span class="eyebrow">${esc(r[2])}</span><button class="save" data-save="${id}" aria-pressed="${saved.has(key(r))}" aria-label="Favourite: ${esc(r[3])}">${saved.has(key(r)) ? '★' : '☆'}</button></div><h3>${esc(r[3])}</h3><div class="tags"><span>${P[r[0]].name}</span><span>${esc(r[1])}</span></div><p>${esc(r[6])}</p><details><summary>Commands & verification</summary><div class="terminal"><div class="terminal-bar"><span>${esc(r[4])}</span><button data-copy="${id}">Copy commands</button></div><pre><code>${esc(r[5])}</code></pre></div><div class="verify"><span>✓</span><div><strong>What to verify</strong><p class="verification">${esc(r[7])}</p></div></div></details>${(r[8] || []).map(([label,url]) => `<a class="procedure-source" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>`).join('')}</article>`;
  }).join('') : '<div class="empty"><h3>No matching procedures</h3><p>Try fewer search words or reset your filters.</p><button data-reset>Show all procedures</button></div>';
}
function reset() { engine = engines[0]; platform = 'all'; category = 'All tasks'; query = ''; savedOnly = false; $('#search').value = ''; $('#platformFilter').value = 'all'; render(); }
document.addEventListener('click', async event => {
  const b = event.target.closest('button'); if (!b) return;
  if (b.dataset.engine) { engine = b.dataset.engine; render(); }
  if (b.dataset.category) { category = b.dataset.category; render(); }
  if (b.id === 'savedFilter') { savedOnly = !savedOnly; render(); }
  if (b.id === 'resetFilters' || b.hasAttribute('data-reset')) reset();
  if (b.dataset.save !== undefined) {
    const id = key(R[+b.dataset.save]); saved.has(id) ? saved.delete(id) : saved.add(id);
    try { localStorage.setItem('dba-favourites', JSON.stringify([...saved])); } catch { $('#actionStatus').textContent = 'Favourites are available for this session; browser storage is unavailable.'; }
    if (savedOnly) render(); else { b.textContent = saved.has(id) ? '★' : '☆'; b.setAttribute('aria-pressed', String(saved.has(id))); }
  }
  if (b.dataset.copy !== undefined) {
    try { await navigator.clipboard.writeText(R[+b.dataset.copy][5]); $('#actionStatus').textContent = 'Commands copied.'; }
    catch { $('#actionStatus').textContent = 'Copy unavailable. Select the command text and copy it manually.'; }
  }
  if (b.id === 'compare') $('#comparison').showModal();
  if (b.id === 'closeDialog') $('#comparison').close();
});
$('#search').addEventListener('input', e => { query = e.target.value; render(); });
$('#platformFilter').addEventListener('change', e => { platform = e.target.value; render(); });
document.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); $('#search').focus(); } });
render();
