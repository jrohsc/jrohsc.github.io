import { createFeedClient } from './feed-client.js';
const $ = selector => document.querySelector(selector);
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const safeLink = value => { try { const u = new URL(value); return u.protocol === 'https:' ? escape(u.href) : '#'; } catch { return '#'; } };
const STORE = 'ai-radar-tracker-v1';
const STATES = ['To review', 'Saved', 'Applied', 'Interviewing', 'Offer', 'Passed'];
const appliedStates = new Set(['Applied', 'Interviewing', 'Offer']);
const topicClasses = { 'AI Security': 'security', 'AI Safety': 'safety', Privacy: 'privacy', Audio: 'audio', Multimodal: 'multimodal' };
const companyGroups = { 1: 'Big Tech', 2: 'Major AI companies', 3: 'Specialist teams' };
const initials = { google: 'G', apple: 'a', microsoft: 'M', amazon: 'a', nvidia: 'N', meta: '∞', openai: 'O', anthropic: 'A', xai: '𝕏', adobe: 'A', dolby: 'D', elevenlabs: 'Ⅱ', scale: 'S' };
let data = null, records = {}, view = 'all', topic = '', roleType = 'Internship', shown = 40, toastTimer, focusedJob = null;
let lastCheckedAt = null, feedMode = 'live', feedError = false, checking = false;
const feed = createFeedClient({ base: location.hostname === 'jrohsc.github.io' ? 'https://raw.githubusercontent.com/jrohsc/jrohsc.github.io/master/ai-jobs' : '.' });
let storageAvailable = true;
try { records = validateRecords(JSON.parse(localStorage.getItem(STORE) || '{}')); } catch { storageAvailable = false; }
function validateRecords(input) {
  if (!input || Array.isArray(input) || typeof input !== 'object') throw new Error('Invalid tracker file');
  const result = {};
  for (const [id, r] of Object.entries(input)) {
    if (!id.includes(':') || id.length > 200 || !r || !STATES.includes(r.status)) continue;
    result[id] = { status: r.status, saved: r.saved === true, updatedAt: String(r.updatedAt || '').slice(0, 50) };
  }
  return result;
}
const record = id => records[id] || { status: 'To review', saved: false };
const isNew = job => Date.now() - Date.parse(job.firstSeen) < 86400000;
const dateLabel = value => value ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: new Date(value).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined }) : 'Not provided';
const timeLabel = value => value ? new Date(value).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }) : 'Not yet verified';
const researchLabel = job => job.research?.roleScope === 'broader' ? 'PhD eligible · broader intake' : 'PhD eligible · research';
const tags = job => job.topics.map(t => `<span class="tag ${topicClasses[t] || ''}">${escape(t)}</span>`).join('');

function toast(message) {
  $('#toast').textContent = message; $('#toast').hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 3500);
}
function persist() {
  try { localStorage.setItem(STORE, JSON.stringify(records)); storageAvailable = true; }
  catch { storageAvailable = false; toast('Browser storage is unavailable. Export your tracker to keep these changes.'); }
}
function save(id) {
  const r = record(id), saved = !r.saved;
  records[id] = { ...r, saved, status: r.status === 'To review' && saved ? 'Saved' : r.status === 'Saved' && !saved ? 'To review' : r.status, updatedAt: new Date().toISOString() };
  persist(); render(); toast(saved ? 'Saved to your shortlist.' : 'Removed from saved roles.');
}
function setStatus(id, status) {
  if (!STATES.includes(status)) return;
  records[id] = { ...record(id), status, saved: status === 'Saved' || record(id).saved, updatedAt: new Date().toISOString() };
  persist(); render(); toast(`Marked as ${status.toLowerCase()}.`);
}
function statusOptions(id) {
  return STATES.map(s => `<option${record(id).status === s ? ' selected' : ''}>${s}</option>`).join('');
}
function filtersActive() { return topic || roleType || $('#search').value || $('#company').value || $('#company-group').value || ['phd', 'remote', 'new', 'include-archived'].some(id => $(`#${id}`).checked); }
function updateCompanies() {
  const chosen = $('#company').value, group = $('#company-group').value;
  const sources = data.sources.filter(s => !group || s.tier === Number(group));
  $('#company').innerHTML = '<option value="">All companies</option>' + Object.entries(companyGroups).map(([tier, label]) => {
    const members = sources.filter(s => s.tier === Number(tier));
    return members.length ? `<optgroup label="${label}">${members.map(s => `<option value="${escape(s.id)}">${escape(s.name)}</option>`).join('')}</optgroup>` : '';
  }).join('');
  $('#company').value = sources.some(s => s.id === chosen) ? chosen : '';
}
function filteredJobs(ignoreType = false) {
  if (!data) return [];
  const terms = $('#search').value.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const jobs = data.jobs.filter(job => {
    const r = record(job.id);
    if (view === 'saved' && !r.saved && r.status !== 'Saved') return false;
    if (view === 'applied' && !appliedStates.has(r.status)) return false;
    if (view === 'all' && !$('#include-archived').checked && job.status === 'not-listed') return false;
    if (topic && !job.topics.includes(topic)) return false;
    if (!ignoreType && roleType && job.type !== roleType) return false;
    if ($('#company').value && job.sourceId !== $('#company').value) return false;
    if ($('#company-group').value && job.tier !== Number($('#company-group').value)) return false;
    if ($('#phd').checked && !job.research?.phdEligible) return false;
    if ($('#remote').checked && !job.remote) return false;
    if ($('#new').checked && !isNew(job)) return false;
    const searchable = `${job.title} ${job.company} ${job.location} ${job.department} ${job.topics.join(' ')} ${job.excerpt} ${job.evidence.map(e => e.excerpt).join(' ')}`.toLowerCase();
    return terms.every(term => searchable.includes(term));
  });
  const sort = $('#sort').value;
  jobs.sort((a, b) => {
    if (sort === 'priority') return a.tier - b.tier || b.score - a.score || (Date.parse(b.postedAt) || 0) - (Date.parse(a.postedAt) || 0) || a.title.localeCompare(b.title);
    if (sort === 'match') return b.score - a.score || a.tier - b.tier;
    const key = sort === 'newest' ? 'postedAt' : 'firstSeen';
    return (Date.parse(b[key]) || 0) - (Date.parse(a[key]) || 0) || a.tier - b.tier;
  });
  return jobs;
}
function setRoleType(type) { roleType = type; shown = 40; render(); }
function updateRoleTabs() {
  const jobs = filteredJobs(true);
  document.querySelectorAll('[data-type]').forEach(button => {
    const selected = button.dataset.type === roleType;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-selected', String(selected));
    button.tabIndex = selected ? 0 : -1;
    button.querySelector('span').textContent = (button.dataset.type ? jobs.filter(j => j.type === button.dataset.type).length : jobs.length).toLocaleString();
    if (selected) $('#role-results').setAttribute('aria-labelledby', button.id);
  });
}
function jobCard(job) {
  const r = record(job.id), id = escape(job.id);
  const type = job.type === 'Unspecified' ? 'Type not specified' : job.type;
  return `<article class="job-card" data-id="${id}">
    <div class="company-logo ${escape(job.sourceId)}" aria-hidden="true">${escape(initials[job.sourceId] || job.company.slice(0, 1))}</div>
    <div class="job-content"><div class="job-company">${escape(job.company)} ${job.tier === 1 ? '<span class="priority-badge">BIG TECH</span>' : job.tier === 2 ? '<span class="priority-badge ai-company">MAJOR AI</span>' : ''} ${isNew(job) ? '<span class="new-badge" title="First discovered within the last 24 hours">NEW TO RADAR</span>' : ''}</div>
      <button class="job-title" data-action="details">${escape(job.title)}</button>
      <div class="job-meta"><span class="place" title="${escape(job.location)}">${escape(job.location)}</span><span>${escape(type)}</span><span>${job.postedAt ? `Posted ${dateLabel(job.postedAt)}` : `Discovered ${dateLabel(job.firstSeen)}`}</span></div>
      <div class="job-tags">${tags(job)}${job.research?.phdEligible ? `<span class="tag internship">${researchLabel(job)}</span>` : ''}${job.pipeline ? '<span class="tag warning">Talent pool · no specific opening</span>' : ''}${job.type === 'Internship' ? '<span class="tag internship">Internship</span>' : ''}${job.status !== 'open' ? `<span class="tag warning">${job.status === 'not-listed' ? 'Not in latest scan' : 'Needs verification'}</span>` : ''}</div>
    </div><div class="job-actions"><div class="action-line"><button class="save" data-action="save" aria-label="${r.saved ? 'Unsave' : 'Save'} ${escape(job.title)}" aria-pressed="${r.saved}">${r.saved ? '♥' : '♡'}</button><a class="apply" href="${safeLink(job.applyUrl)}" target="_blank" rel="noopener noreferrer">View &amp; apply</a></div><select class="status-select" data-action="status" aria-label="Application status for ${escape(job.title)}">${statusOptions(job.id)}</select></div>
  </article>`;
}
function updateStats() {
  const open = data.jobs.filter(j => j.status === 'open' && !j.pipeline);
  $('#stat-total').textContent = open.length.toLocaleString();
  $('#stat-bigtech').textContent = open.filter(j => j.tier === 1).length.toLocaleString();
  $('#stat-internships').textContent = open.filter(j => j.type === 'Internship').length;
  $('#stat-new').textContent = open.filter(isNew).length.toLocaleString();
  $('#nav-all').textContent = open.length;
  $('#nav-saved').textContent = data.jobs.filter(j => record(j.id).saved || record(j.id).status === 'Saved').length;
  $('#nav-applied').textContent = data.jobs.filter(j => appliedStates.has(record(j.id).status)).length;
  $('#nav-sources').textContent = data.sources.length;
  const ageMinutes = (Date.now() - Date.parse(data.updatedAt)) / 60000;
  $('#sync-label').textContent = feedError ? 'Connection interrupted · retrying' : `Auto-updating · checked ${lastCheckedAt ? new Date(lastCheckedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' }) : 'just now'}`;
  $('#sync-meta').textContent = `Collected ${ageMinutes < 60 ? `${Math.max(0, Math.floor(ageMinutes))}m` : `${Math.floor(ageMinutes / 60)}h`} ago · checks every 30s`;
  $('#sync-meta').title = timeLabel(data.updatedAt);
  const incomplete = data.sources.filter(s => s.status !== 'ok');
  const note = [];
  if (ageMinutes > Math.max(15, data.refreshMinutes * 2)) note.push(`Feed is overdue: last collected ${timeLabel(data.updatedAt)}.`);
  if (feedError) note.push('Could not check for updates. Keeping current results and retrying automatically.');
  else if (feedMode === 'backup') note.push('Showing the backup feed while reconnecting to the latest collection.');
  if (incomplete.length) note.push(`${incomplete.length} sources have limited or manual coverage. Open Sources to check before relying on the counts.`);
  if (!storageAvailable) note.push('Local storage is unavailable; export your tracker to retain changes.');
  $('#notice').textContent = note.join(' '); $('#notice').hidden = !note.length;
}
function renderSources() {
  const labels = { ok: 'Collected', partial: 'Partial', error: 'Unavailable', manual: 'Manual check' };
  $('#source-panel').innerHTML = `<p class="source-intro">${data.sources.filter(s => s.status === 'ok').length} of ${data.sources.length} sources collected successfully. Collection is scheduled every 5 minutes; this page checks for new data every 30 seconds without a reload. Scheduler delays and employer access limits may slow updates. A source error preserves earlier listings; it does not mean those roles closed. The default view requires doctoral eligibility and research work in the posting; topic preferences do not exclude other research areas. Employer search results can miss roles, so these counts do not represent every available job.</p><div class="source-grid">${data.sources.map(s => `<article class="source-card"><header><h2>${escape(s.name)}</h2><span class="source-status ${escape(s.status)}">${labels[s.status] || 'Unknown'}</span></header><p>${s.status === 'manual' ? 'Open the official board to search current US opportunities.' : `${data.jobs.filter(j => j.sourceId === s.id && j.status === 'open' && !j.pipeline && j.type === 'Internship' && j.research?.phdEligible).length} PhD research internships · ${s.count} matching US roles · ${s.scanned || 0} listings checked`}${s.note ? `<br>${escape(s.note)}` : ''}</p><a href="${safeLink(s.url)}" target="_blank" rel="noopener noreferrer">Open official careers</a><small>Checked: ${timeLabel(s.checkedAt)}<br>Last complete collection: ${timeLabel(s.lastSuccess)}</small></article>`).join('')}</div>`;
}
function render() {
  if (!data) return;
  updateStats();
  const sourceView = view === 'sources';
  $('#opportunities').hidden = sourceView; $('#source-panel').hidden = !sourceView;
  document.querySelectorAll('[data-view]').forEach(b => { b.classList.toggle('active', b.dataset.view === view); b.setAttribute('aria-current', b.dataset.view === view ? 'page' : 'false'); });
  const titles = { all: [roleType === 'Internship' ? 'Find your next PhD research internship.' : 'Find your next research role.', 'US PhD research internships across all topics. AI safety and security are a plus.'], saved: ['Your research shortlist.', 'Saved opportunities, ready for a closer look.'], applied: ['Keep your next step in sight.', 'Your applications and interviews, stored in this browser.'], sources: ['Know what’s being monitored.', 'Official sources, collection status and honest coverage.'] };
  $('#page-title').textContent = titles[view][0]; $('#page-description').textContent = titles[view][1];
  if (sourceView) { renderSources(); return; }
  updateRoleTabs();
  const jobs = filteredJobs();
  $('#results-count').textContent = `${jobs.length.toLocaleString()} ${view === 'all' ? 'opportunities' : view === 'saved' ? 'saved roles' : 'applications'}`;
  $('#reset').hidden = !filtersActive();
  $('#job-list').innerHTML = jobs.length ? jobs.slice(0, shown).map(jobCard).join('') : `<div class="empty"><h2>${view === 'saved' && !filtersActive() ? 'A shortlist starts with one role.' : view === 'applied' && !filtersActive() ? 'Your next chapter starts here.' : 'No matching opportunities.'}</h2><p>${view === 'all' || filtersActive() ? 'Try another topic, company or role type. Source coverage may also be limited.' : view === 'saved' ? 'Use the heart on an opportunity to save it here.' : 'After applying on an employer’s website, mark the role as Applied.'}</p><button id="empty-reset">${filtersActive() ? 'Clear filters' : 'Browse opportunities'}</button></div>`;
  $('#load-more').hidden = jobs.length <= shown;
  $('#load-more').textContent = `Show ${Math.min(40, jobs.length - shown)} more opportunities`;
}
function resetFilters() {
  topic = ''; roleType = ''; shown = 40;
  ['search', 'company', 'company-group'].forEach(id => { $(`#${id}`).value = ''; });
  if (data) updateCompanies();
  ['phd', 'remote', 'new', 'include-archived'].forEach(id => { $(`#${id}`).checked = false; });
  document.querySelectorAll('[data-topic]').forEach(b => { b.classList.toggle('selected', !b.dataset.topic); b.setAttribute('aria-pressed', String(!b.dataset.topic)); });
  render();
}
function setView(next) { view = next; shown = 40; if (next === 'all') { roleType = 'Internship'; $('#phd').checked = true; } render(); }
function details(id) {
  const job = data.jobs.find(j => j.id === id); if (!job) return;
  focusedJob = id;
  $('#detail-content').innerHTML = `<div class="detail"><div class="detail-top"><span>${escape(job.company)}</span><button id="close-details" aria-label="Close role details">×</button></div><h2>${escape(job.title)}</h2><p>${escape(job.location)}</p><div class="job-tags">${tags(job)}</div>${job.research?.phdEligible ? `<h3>Doctoral eligibility</h3><div class="evidence"><strong>${researchLabel(job)}</strong>${escape(job.research.evidence)}</div>` : ''}<h3>Why this role is here</h3>${job.evidence.map(e => `<div class="evidence"><strong>${escape(e.topic)} · ${escape(e.term)}</strong>…${escape(e.excerpt)}…</div>`).join('')}<h3>Posting details</h3><dl><dt>Role type</dt><dd>${job.type === 'Unspecified' ? 'Not specified by the source — confirm on the posting' : escape(job.type)}</dd><dt>Posted</dt><dd>${dateLabel(job.postedAt)}</dd><dt>First discovered</dt><dd>${timeLabel(job.firstSeen)}</dd><dt>Last seen</dt><dd>${timeLabel(job.lastSeen)}</dd><dt>Availability</dt><dd>${job.pipeline ? 'Talent pool only; employer does not advertise a specific opening' : job.status === 'open' ? 'Listed at last collection' : job.status === 'not-listed' ? 'Not present in the latest complete scan; verify with employer' : 'Source unavailable; verify with employer'}</dd></dl><div class="detail-footer"><a class="apply" href="${safeLink(job.applyUrl)}" target="_blank" rel="noopener noreferrer">View &amp; apply on official site</a><a href="${safeLink(job.url)}" target="_blank" rel="noopener noreferrer">Original posting</a></div><p class="local-note">Opening the application does not mark it as submitted. Update your status after you apply.</p></div>`;
  $('#details').showModal(); $('#close-details').focus();
}
async function loadFeed(showToast = false) {
  if (checking) return;
  checking = true;
  $('#refresh').disabled = true;
  try {
    const result = await feed.poll();
    lastCheckedAt = result.checkedAt; feedMode = result.mode; feedError = false;
    if (result.snapshot) {
      const oldIDs = data ? new Set(data.jobs.map(j => j.id)) : null;
      data = result.snapshot;
      const newJobs = oldIDs ? data.jobs.filter(j => !oldIDs.has(j.id) && j.status === 'open').length : 0;
      updateCompanies(); render();
      if (newJobs) toast(`${newJobs} new ${newJobs === 1 ? 'opportunity' : 'opportunities'} added. Your filters are unchanged.`);
      else if (showToast) toast('Latest feed loaded. New opportunities appear automatically.');
    } else { updateStats(); if (showToast) toast('You’re viewing the latest available collection.'); }
  } catch (error) {
    feedError = true;
    $('#sync-label').textContent = 'Feed unavailable';
    $('#notice').hidden = false; $('#notice').textContent = data ? 'Could not reload the feed. The previous results remain available.' : 'Could not load the job feed. Please retry in a moment.';
    if (!data) $('#job-list').innerHTML = '<div class="empty"><h2>The feed could not be loaded.</h2><p>Your saved application states are still stored in this browser.</p><button id="retry">Try again</button></div>';
    else updateStats();
    if (showToast) toast('Could not reload. Please try again.');
  } finally { checking = false; $('#refresh').disabled = false; }
}

document.addEventListener('click', event => {
  const viewButton = event.target.closest('[data-view]'); if (viewButton) { resetFilters(); setView(viewButton.dataset.view); }
  const topicButton = event.target.closest('[data-topic]');
  const typeButton = event.target.closest('[data-type]');
  if (typeButton) setRoleType(typeButton.dataset.type);
  if (topicButton) {
    topic = topicButton.dataset.topic; shown = 40;
    document.querySelectorAll('[data-topic]').forEach(b => { b.classList.toggle('selected', b === topicButton); b.setAttribute('aria-pressed', String(b === topicButton)); });
    render();
  }
  const card = event.target.closest('[data-id]'), action = event.target.closest('[data-action]')?.dataset.action;
  if (card && action === 'save') save(card.dataset.id);
  if (card && action === 'details') details(card.dataset.id);
  const stat = event.target.closest('[data-stat]');
  if (stat) { resetFilters(); view = 'all'; if (stat.dataset.stat === 'bigtech') { $('#company-group').value = '1'; updateCompanies(); } if (stat.dataset.stat === 'internship') roleType = 'Internship'; if (stat.dataset.stat === 'new') $('#new').checked = true; render(); }
  if (event.target.id === 'empty-reset') { resetFilters(); setView('all'); }
  if (event.target.id === 'retry') loadFeed(true);
  if (event.target.id === 'close-details') $('#details').close();
});
document.addEventListener('change', event => {
  if (event.target.matches('[data-action="status"]')) setStatus(event.target.closest('[data-id]').dataset.id, event.target.value);
});
['company', 'sort', 'phd', 'remote', 'new', 'include-archived'].forEach(id => $(`#${id}`).addEventListener('change', () => { shown = 40; render(); }));
$('#company-group').addEventListener('change', () => { shown = 40; updateCompanies(); render(); });
$('.role-tabs').addEventListener('keydown', event => {
  const buttons = [...document.querySelectorAll('[data-type]')], index = buttons.indexOf(event.target);
  if (index < 0 || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
  setRoleType(buttons[next].dataset.type); buttons[next].focus();
});
$('#search').addEventListener('input', () => { shown = 40; render(); });
$('#reset').addEventListener('click', resetFilters);
$('#refresh').addEventListener('click', () => loadFeed(true));
$('#coverage-link').addEventListener('click', () => { setView('sources'); $('#page-title').scrollIntoView({ behavior: 'smooth' }); });
$('#load-more').addEventListener('click', () => { shown += 40; render(); });
$('#details').addEventListener('click', e => { if (e.target === $('#details')) { const r = e.target.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) e.target.close(); } });
$('#details').addEventListener('close', () => { [...document.querySelectorAll('.job-card')].find(c => c.dataset.id === focusedJob)?.querySelector('.job-title')?.focus(); });
document.addEventListener('keydown', e => { if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName) && !$('#details').open) { e.preventDefault(); setView('all'); $('#search').focus(); } });
$('#export').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), records }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = 'ai-radar-tracker.json'; a.click(); URL.revokeObjectURL(url); toast('Tracker exported. Keep this file to restore on another browser.');
});
$('#import').addEventListener('click', () => $('#import-file').click());
$('#footer-export').addEventListener('click', () => $('#export').click());
$('#footer-import').addEventListener('click', () => $('#import').click());
$('#import-file').addEventListener('change', async e => {
  try {
    const file = e.target.files[0]; if (!file) return;
    if (file.size > 5 * 1024 * 1024) throw new Error('File too large');
    const input = JSON.parse(await file.text()); if (input.version !== 1) throw new Error('Unsupported version');
    const imported = validateRecords(input.records); records = { ...records, ...imported }; persist(); render(); toast(`Imported ${Object.keys(imported).length} role states.`);
  } catch { toast('Could not import. Choose a tracker JSON exported from this page.'); }
  e.target.value = '';
});
window.addEventListener('storage', e => { if (e.key === STORE) { try { records = validateRecords(JSON.parse(e.newValue || '{}')); render(); } catch {} } });
await loadFeed();
setInterval(() => { if (!document.hidden) loadFeed(); }, 30000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) loadFeed(); });
window.addEventListener('online', () => loadFeed());
