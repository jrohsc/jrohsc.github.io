import test from 'node:test';
import assert from 'node:assert/strict';
import { contacts, defaultDraft, papers } from '../../ai-jobs/contacts/data.mjs';
import { validateRecords, followupDate, hiringFresh, mailURL } from '../../ai-jobs/contacts/state.mjs';

test('contact drafts are actionable without inventing an application or an email address', () => {
  assert.equal(new Set(contacts.map(c => c.id)).size, contacts.length);
  for (const c of contacts) {
    assert.ok(c.links.linkedin || c.links.website, c.name);
    assert.ok(c.sources.length && c.papers.every(p => papers[p]), c.name);
    for (const mode of ['email', 'dm', 'followup']) {
      const draft = defaultDraft(c, mode);
      assert.ok(draft.body.includes(c.first), `${c.name}: personal salutation`);
      assert.doesNotMatch(draft.body, /\[your|\[name|I (?:have |already )?applied|I(?:’|')ve applied/i);
    }
    if (c.hiring.kind !== 'unannounced') assert.ok(c.sources.some(s => s.kind === 'hiring'));
    for (const s of c.sources) assert.equal(new URL(s.url).protocol, 'https:');
  }
  const ozlem = contacts.find(c => c.id === 'ozlem-kalinli');
  assert.equal(ozlem.hiring.kind, 'unannounced');
  assert.equal(mailURL(ozlem.links.email, defaultDraft(ozlem, 'email')), '');
  assert.equal(contacts.find(c => c.id === 'desh-raj').company, 'NVIDIA');
  assert.equal(contacts.find(c => c.id === 'koki-nagano').subject, 'Seeking Research Internship 2027');
});
test('hiring freshness expires, including a stated deadline, without deleting research contacts', () => {
  const c = contacts.find(c => c.id === 'koki-nagano');
  assert.equal(hiringFresh(c, new Date('2026-10-06T12:00:00Z')), true);
  assert.equal(hiringFresh(c, new Date('2026-11-07T12:00:00Z')), false);
  assert.equal(hiringFresh({ ...c, hiring: { ...c.hiring, deadline: '2026-10-07' } }, new Date('2026-10-08T12:00:00Z')), false);
});
test('tracker import keeps only known people and bounded editable fields', () => {
  const input = JSON.parse('{"ozlem-kalinli":{"status":"contacted","date":"2026-02-30","notes":"<img src=x onerror=alert(1)>","email":"attacker@example.com","drafts":{"email":{"subject":"Hello","body":"Editable"}}},"__proto__":{"polluted":true},"unknown":{"status":"replied"}}');
  const clean = validateRecords(input, contacts.map(c => c.id));
  assert.deepEqual(Object.keys(clean), ['ozlem-kalinli']);
  assert.equal(clean['ozlem-kalinli'].date, '');
  assert.equal(clean['ozlem-kalinli'].email, undefined);
  assert.equal(clean['ozlem-kalinli'].drafts.email.body, 'Editable');
  assert.equal({}.polluted, undefined);
  assert.throws(() => validateRecords([], []));
});
test('follow-up date skips weekends and mail composition preserves text safely', () => {
  assert.equal(followupDate('2026-10-09'), '2026-10-23');
  assert.equal(followupDate('not-a-date'), '');
  const url = new URL(mailURL('test@example.com', { subject: 'Research & speech\r\nBcc: invalid', body: 'Hello\nQuestion? #1 & 2' }));
  assert.equal(url.searchParams.get('subject'), 'Research & speech  Bcc: invalid');
  assert.equal(url.searchParams.get('body'), 'Hello\nQuestion? #1 & 2');
  assert.equal(url.searchParams.get('bcc'), null);
  assert.equal(mailURL('test@example.com?bcc=other@example.com', { subject: '', body: '' }), '');
});
