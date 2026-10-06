import { contacts, reviewedAt, papers, defaultDraft } from './data.mjs';
import { STORE, statuses, modes, validateRecords, today, followupDate, hiringFresh, mailURL } from './state.mjs';
const $ = s => document.querySelector(s);
const escape = text => String(text ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const safeURL = value => { try { const u = new URL(value); return u.protocol === 'https:' ? escape(u.href) : '#'; } catch { return '#'; } };
const link = (url, label, className = '') => `<a class="${className}" href="${safeURL(url)}" target="_blank" rel="noopener noreferrer">${escape(label)} ↗</a>`;
const ids = contacts.map(c => c.id);
const approachLabels = { warm: '기존 관계 · 직접 문의', hiring: '공고 기반 · 직접 문의', research: '연구 접점 · 부담 낮게 문의' };
let records = {}, current = null, mode = 'email', toastTimer;
try { records = validateRecords(JSON.parse(localStorage.getItem(STORE) || '{}'), ids); } catch { storageWarning(); }
const record = id => records[id] || { status: 'review', date: '', notes: '', drafts: {} };
function storageWarning() { $('#storage-notice').hidden = false; $('#storage-notice').textContent = '브라우저 저장 공간을 사용할 수 없거나 저장 내용이 손상됐습니다. 내보내기로 현재 초안과 메모를 보관하세요.'; }
function persist() { try { localStorage.setItem(STORE, JSON.stringify(records)); $('#save-state').textContent = '이 브라우저에 저장됨'; } catch { storageWarning(); $('#save-state').textContent = '저장 불가 · 내보내기를 이용하세요'; } }
function patchRecord(id, patch) { records[id] = { ...record(id), ...patch }; persist(); }
function toast(message) { clearTimeout(toastTimer); $('#toast').textContent = message; $('#toast').hidden = false; toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 4000); }
function effectiveHiring(c) { return c.hiring.kind !== 'unannounced' && !hiringFresh(c) ? 'unannounced' : c.hiring.kind; }
function hiringLabel(c) { return c.hiring.kind !== 'unannounced' && !hiringFresh(c) ? '모집 재확인 필요' : c.hiring.label; }
function statusOptions(value) { return Object.entries(statuses).map(([k, label]) => `<option value="${k}"${k === value ? ' selected' : ''}>${label}</option>`).join(''); }
function render() {
  const terms = $('#search').value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const result = contacts.filter(c => {
    const kind = effectiveHiring(c), filter = $('#hiring').value;
    return (!$('#company').value || c.company === $('#company').value) && (!$('#approach').value || c.approach === $('#approach').value) && (!$('#status-filter').value || record(c.id).status === $('#status-filter').value) && (!filter || (filter === 'other-open' ? ['group', 'pool'].includes(kind) : kind === filter)) && terms.every(t => `${c.name} ${c.company} ${c.team} ${c.tags.join(' ')} ${c.why} ${c.alternative?.name || ''}`.toLocaleLowerCase().includes(t));
  });
  $('#results-count').textContent = `${result.length}명의 우선 연락 후보`;
  $('#count-total').textContent = contacts.length;
  $('#nav-count').textContent = contacts.length;
  $('#count-announced').textContent = contacts.filter(c => effectiveHiring(c) === 'announced').length;
  $('#count-warm').textContent = contacts.filter(c => c.approach === 'warm').length;
  $('#count-contacted').textContent = contacts.filter(c => ['contacted', 'replied'].includes(record(c.id).status)).length;
  $('#contacts').innerHTML = result.length ? result.map(card).join('') : '<div class="empty"><h2>조건에 맞는 연락 후보가 없습니다.</h2><button id="reset-filters">전체 후보 보기</button></div>';
}
function card(c) {
  const r = record(c.id), fresh = hiringFresh(c);
  return `<article class="contact-card" id="${c.id}" data-id="${c.id}"><div class="contact-card-top"><span class="company-name">${escape(c.company)}</span><span class="fit-label ${c.fit}">${c.fit === 'core' ? '가까운 연구 접점' : '분야 확장 후보'}</span></div><h2><button data-compose="${c.id}">${escape(c.name)}</button></h2><p class="team">${escape(c.team)}</p><p class="contact-location">${escape(c.location)}</p><div class="hiring-label ${effectiveHiring(c)}">${escape(hiringLabel(c))}</div><p class="why">${escape(c.why)}</p><div class="topic-tags">${c.tags.map(t => `<span>${escape(t)}</span>`).join('')}</div><div class="approach"><strong>${escape(approachLabels[c.approach])}</strong><p>${escape(c.advice)}</p></div><div class="contact-actions"><button class="primary-button" data-compose="${c.id}">맞춤 초안 · 연락 기록</button>${c.links.linkedin ? link(c.links.linkedin, 'LinkedIn', 'secondary-button') : link(c.links.website, '연구 프로필', 'secondary-button')}${c.hiring.url && fresh ? link(c.hiring.url, '공식 공고', 'secondary-button') : ''}</div><details class="evidence-details"><summary>모집 근거 · 연락처 · 관련 논문</summary><p>${escape(c.hiring.note)}</p>${!fresh && c.hiring.kind !== 'unannounced' ? '<p class="expired-note">마지막 확인 이후 30일이 지났거나 기한이 끝났습니다. 지원 링크는 재확인 전까지 표시하지 않습니다.</p>' : ''}<div class="source-links">${c.sources.filter(s => s.kind !== 'hiring' || fresh).map(s => link(s.url, s.label)).join('')}</div><div class="route-links">${c.links.email ? `<span>공개 연락처: <a href="mailto:${escape(c.links.email)}">${escape(c.links.email)}</a></span>` : '<span>공개 이메일 미확인 · 기존 스레드 또는 LinkedIn 이용</span>'}${c.links.x ? link(c.links.x, 'X 프로필 · 채용 확인과 별개') : ''}</div>${c.alternative ? `<p class="alternate">같은 팀 대안: ${link(c.alternative.url, c.alternative.name)}${c.alternative.email ? ` · <a href="mailto:${escape(c.alternative.email)}">${escape(c.alternative.email)}</a>` : ''}<br>한 명에게 먼저 연락한 뒤 연결을 부탁하세요.</p>` : ''}<div class="paper-links">${c.papers.map(key => link(papers[key].url, papers[key].label)).join('')}</div><p class="verified">자료 확인 ${c.verifiedAt} · 연구 적합성은 CV 기반 판단</p></details><div class="card-tracker"><label>내 상태 <select data-status="${c.id}" aria-label="${escape(c.name)} 연락 상태">${statusOptions(r.status)}</select></label>${r.date ? `<span>${escape(r.date)}</span>` : '<span>브라우저에만 저장</span>'}</div></article>`;
}
function openComposer(id) {
  current = contacts.find(c => c.id === id); if (!current) return;
  mode = 'email';
  $('#composer-company').textContent = `${current.company} · ${hiringLabel(current)}`;
  $('#composer-title').textContent = `${current.name}에게 연락`;
  $('#composer-advice').textContent = current.advice;
  $('#composer-route').textContent = current.links.email ? `공개 업무 연락처: ${current.links.email} · CV는 메일 앱에서 첨부하세요.` : '공개 이메일은 확인되지 않았습니다. LinkedIn 또는 기존 대화 스레드에 초안을 붙여 넣으세요.';
  const profileURL = current.links.linkedin || current.links.website;
  $('#open-profile').href = profileURL; $('#open-profile').textContent = current.links.linkedin ? 'LinkedIn 열기 ↗' : '연구 프로필 ↗';
  $('#draft-papers').innerHTML = `<span>함께 보낼 논문</span>${current.papers.map(key => link(papers[key].url, papers[key].label)).join('')}`;
  $('#contact-status').innerHTML = statusOptions(record(id).status);
  $('#contact-date').value = record(id).date;
  $('#contact-notes').value = record(id).notes;
  updateFollowup(); fillDraft();
  history.replaceState(null, '', `#${id}`);
  if (!$('#composer').open) $('#composer').showModal();
  $('#close-composer').focus();
}
function fillDraft() {
  const draft = record(current.id).drafts[mode] || defaultDraft(current, mode);
  $('#draft-subject').value = draft.subject; $('#draft-body').value = draft.body;
  $('#subject-label').hidden = mode === 'dm';
  document.querySelectorAll('[data-mode]').forEach(b => { const active = b.dataset.mode === mode; b.setAttribute('aria-selected', String(active)); b.tabIndex = active ? 0 : -1; });
  $('#draft-panel').setAttribute('aria-labelledby', `tab-${mode}`);
  updateDraftMeta();
}
function editorDraft() { return { subject: $('#draft-subject').value, body: $('#draft-body').value }; }
function updateDraftMeta() {
  const draft = editorDraft();
  $('#draft-count').textContent = `${draft.body.trim().split(/\s+/).filter(Boolean).length} words · ${draft.body.length} characters${mode === 'dm' ? ' · DM 본문용' : ''}`;
  $('#open-mail').hidden = !current.links.email || mode === 'dm';
  $('#open-mail').href = mailURL(current.links.email, draft) || '#';
}
function saveDraft() { const r = record(current.id); patchRecord(current.id, { drafts: { ...r.drafts, [mode]: editorDraft() } }); updateDraftMeta(); }
function updateFollowup() { const r = record(current.id); $('#followup-date').textContent = r.status === 'contacted' && r.date ? `Follow-up 참고일: ${followupDate(r.date)} · 연락 후 10영업일, 공휴일 미반영. 답변이 없을 때 한 번만 권합니다.` : '실제 발송 후 상태와 날짜를 기록하세요. 링크 열기·초안 복사는 발송으로 기록되지 않습니다.'; }
function setStatus(id, status) {
  if (!Object.hasOwn(statuses, status)) return;
  patchRecord(id, { status, date: status === 'contacted' && !record(id).date ? today() : record(id).date });
  if (current?.id === id) { $('#contact-status').value = status; $('#contact-date').value = record(id).date; updateFollowup(); }
  render();
}
$('#company').insertAdjacentHTML('beforeend', [...new Set(contacts.map(c => c.company))].sort().map(company => `<option>${escape(company)}</option>`).join(''));
if (contacts.some(c => !hiringFresh(c))) { $('#freshness-notice').hidden = false; $('#freshness-notice').textContent = `자료 확인일 ${reviewedAt} 이후 시간이 지났습니다. 사람별 연구 접점은 참고하되 소속과 모집 여부를 다시 확인하세요. 오래된 모집 링크는 숨겼습니다.`; }
['company', 'hiring', 'approach', 'status-filter'].forEach(id => $(`#${id}`).addEventListener('change', render));
$('#search').addEventListener('input', render);
document.addEventListener('click', e => {
  const compose = e.target.closest('[data-compose]'); if (compose) openComposer(compose.dataset.compose);
  if (e.target.id === 'reset-filters') { ['search', 'company', 'hiring', 'approach', 'status-filter'].forEach(id => { $(`#${id}`).value = ''; }); render(); }
});
$('#contacts').addEventListener('change', e => { if (e.target.matches('[data-status]')) setStatus(e.target.dataset.status, e.target.value); });
$('#close-composer').addEventListener('click', () => $('#composer').close());
$('#composer').addEventListener('close', () => { history.replaceState(null, '', location.pathname + location.search); render(); });
document.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => { mode = b.dataset.mode; fillDraft(); }));
$('.draft-tabs').addEventListener('keydown', e => {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
  e.preventDefault(); const index = modes.indexOf(mode);
  mode = modes[e.key === 'Home' ? 0 : e.key === 'End' ? modes.length - 1 : (index + (e.key === 'ArrowRight' ? 1 : -1) + modes.length) % modes.length];
  fillDraft(); $(`#tab-${mode}`).focus();
});
$('#draft-subject').addEventListener('input', saveDraft); $('#draft-body').addEventListener('input', saveDraft);
$('#reset-draft').addEventListener('click', () => { const drafts = { ...record(current.id).drafts }; delete drafts[mode]; patchRecord(current.id, { drafts }); fillDraft(); toast('현재 탭을 기본 초안으로 복원했습니다.'); });
$('#copy-draft').addEventListener('click', async () => {
  const draft = editorDraft(), text = mode === 'dm' ? draft.body : `Subject: ${draft.subject}\n\n${draft.body}`;
  try { await navigator.clipboard.writeText(text); toast('초안을 복사했습니다.'); }
  catch { $('#draft-body').focus(); $('#draft-body').select(); toast('클립보드 접근이 차단됐습니다. 선택된 본문을 직접 복사하세요.'); }
});
$('#contact-status').addEventListener('change', e => setStatus(current.id, e.target.value));
$('#contact-date').addEventListener('change', e => { patchRecord(current.id, { date: e.target.value }); updateFollowup(); });
$('#contact-notes').addEventListener('input', e => patchRecord(current.id, { notes: e.target.value }));
$('#export').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ schemaVersion: 1, exportedAt: new Date().toISOString(), contacts: records }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = 'ai-radar-contacts.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
});
$('#import').addEventListener('click', () => $('#import-file').click());
$('#import-file').addEventListener('change', async e => {
  const file = e.target.files[0]; if (!file) return;
  try {
    if (file.size > 2000000) throw new Error('파일이 너무 큽니다.');
    const data = JSON.parse(await file.text());
    if (data.schemaVersion !== 1 || !data.contacts) throw new Error('연락 기록 내보내기 파일을 선택하세요.');
    const incoming = validateRecords(data.contacts, ids); records = { ...records, ...incoming }; persist(); render(); toast(`${Object.keys(incoming).length}개 연락 기록을 가져왔습니다.`);
  } catch (error) { toast(`가져오기 실패: ${error.message}`); }
  e.target.value = '';
});
render();
if (ids.includes(location.hash.slice(1))) openComposer(location.hash.slice(1));
