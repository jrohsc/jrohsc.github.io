export const STORE = 'ai-radar-contacts-v1';
export const statuses = { review: '검토 중', planned: '연락 예정', contacted: '연락 완료', replied: '답변 받음', paused: '보류' };
export const modes = ['email', 'dm', 'followup'];
export function validDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}
export function validateRecords(input, ids) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('올바른 연락 기록 파일이 아닙니다.');
  const result = {};
  for (const id of ids) {
    const value = Object.hasOwn(input, id) ? input[id] : null;
    if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
    const drafts = {};
    for (const mode of modes) {
      const draft = value.drafts?.[mode];
      if (draft && typeof draft.subject === 'string' && typeof draft.body === 'string') drafts[mode] = { subject: draft.subject.slice(0, 300), body: draft.body.slice(0, 15000) };
    }
    result[id] = { status: Object.hasOwn(statuses, value.status) ? value.status : 'review', date: validDate(value.date) ? value.date : '', notes: typeof value.notes === 'string' ? value.notes.slice(0, 5000) : '', drafts };
  }
  return result;
}
export function today(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
export function followupDate(date) {
  if (!validDate(date)) return '';
  const next = new Date(`${date}T12:00:00Z`);
  let days = 0;
  while (days < 10) { next.setUTCDate(next.getUTCDate() + 1); if (![0, 6].includes(next.getUTCDay())) days++; }
  return next.toISOString().slice(0, 10);
}
// Hiring claims expire without re-verification. Research contacts remain useful.
export function hiringFresh(contact, now = new Date()) {
  const age = now.getTime() - Date.parse(`${contact.verifiedAt}T00:00:00Z`);
  return age >= -86400000 && age <= 30 * 86400000 && (!contact.hiring.deadline || today(now) <= contact.hiring.deadline);
}
export function mailURL(email, draft) {
  if (!email || !/^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(email)) return '';
  return `mailto:${email}?subject=${encodeURIComponent(draft.subject.replace(/[\r\n]/g, ' '))}&body=${encodeURIComponent(draft.body)}`;
}
