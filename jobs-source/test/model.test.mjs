import test from 'node:test';
import assert from 'node:assert/strict';
import { classify, employmentType, isUS, mergeSnapshot, normalize, cleanDescription } from '../model.mjs';
import { parseGoogle, parseApple, parseMSR } from '../adapters.mjs';

const source = { id: 'example', name: 'Example', tier: 1, adapter: 'ashby', url: 'https://example.com/jobs' };
const now = '2026-10-05T16:00:00Z';
const raw = { id: '123', title: 'Research Scientist, Audio AI Safety', location: 'San Francisco, CA', type: 'FullTime', description: 'Research adversarial attacks and safety evaluations of multimodal speech models with machine learning.', url: 'https://example.com/jobs/123' };
test('US filter requires evidence of US availability, not ambiguous remote', () => {
  for (const location of ['US, CA, Santa Clara', 'New York', 'San Francisco; London', 'United States - Remote']) assert.equal(isUS(location), true, location);
  for (const location of ['Toronto, Ontario, Canada', 'London, UK', 'Remote', 'Cambridge, UK', 'Vancouver, BC', 'United Kingdom']) assert.equal(isUS(location), false, location);
  assert.equal(isUS('Remote', ['US']), true);
});
test('internships override their full-time hours, without matching internal or residency infrastructure', () => {
  assert.equal(employmentType('2027 Internships: Deep Learning', 'Full time'), 'Internship');
  assert.equal(employmentType('Research Intern', 'FullTime'), 'Internship');
  assert.equal(employmentType('Student Researcher, PhD'), 'Internship');
  assert.equal(employmentType('AI Residency'), 'Internship');
  assert.equal(employmentType('Engineering Manager, Data Residency', 'Full-time'), 'Full-time');
  assert.equal(employmentType('Director, Internal Audit', 'Full-time'), 'Full-time');
  assert.equal(employmentType('Research Scientist'), 'Unspecified');
  assert.equal(employmentType('Audio Researcher', 'Contract'), 'Other');
});
test('technical matches exclude employment boilerplate and unrelated business roles', () => {
  assert.deepEqual(classify('Director, Internal Audit', 'We build AI with safety, audio and multimodal models.').topics, []);
  assert.deepEqual(classify('Strategic Finance, International', 'We build machine learning models.').topics, []);
  assert.deepEqual(classify('Senior Technical Recruiter, AI/ML Research', 'Recruit scientists building voice AI and multimodal models.').topics, []);
  assert.deepEqual(classify('Technical Recruiting Intern', 'Hire researchers for AI safety.').topics, []);
  assert.deepEqual(classify('Software Engineer', 'Build web apps. Our applicant privacy policy protects data.').topics, []);
  assert.equal(classify('Software Engineer', 'Use AI tools and promote cross-functional alignment.').topics.includes('AI Safety'), false);
  const result = classify(raw.title, raw.description);
  assert.ok(result.topics.includes('AI Security'));
  assert.ok(result.topics.includes('Audio'));
  assert.ok(result.topics.includes('Multimodal'));
});
test('company mission and footer do not classify every Anthropic role as safety and multimodal', () => {
  const html = '<div class="content-intro">We develop AI safety and multimodal models.</div><h2>About the role</h2><p>Manage office Wi-Fi and conferencing hardware.</p><div class="content-conclusion">We research interpretability and AI safety.</div>';
  assert.deepEqual(classify('IT Engineer', html).topics, []);
  assert.ok(!cleanDescription(html).includes('interpretability'));
});
test('normalization rejects non-US, non-HTTPS, unrelated and contract listings', () => {
  assert.ok(normalize(raw, source, now));
  assert.equal(normalize({ ...raw, location: 'London' }, source, now), null);
  assert.equal(normalize({ ...raw, url: 'javascript:alert(1)' }, source, now), null);
  assert.equal(normalize({ ...raw, type: 'Contract' }, source, now), null);
});
test('refresh keeps discovery time and deduplicates repeated query results', () => {
  const first = mergeSnapshot(null, [{ source, jobs: [raw, raw], complete: true }], now);
  assert.equal(first.jobs.length, 1);
  const later = mergeSnapshot(first, [{ source, jobs: [raw], complete: true }], '2026-10-06T16:00:00Z');
  assert.equal(later.jobs[0].firstSeen, now);
  assert.equal(later.jobs[0].lastSeen, '2026-10-06T16:00:00Z');
});
test('failed and partial scans preserve listings; only a complete scan marks missing', () => {
  const first = mergeSnapshot(null, [{ source, jobs: [raw], complete: true }], now);
  for (const result of [{ complete: false, error: 'HTTP 403' }, { complete: false, error: 'Pagination cap' }]) {
    const next = mergeSnapshot(first, [{ source, jobs: [], ...result }], '2026-10-06T16:00:00Z');
    assert.equal(next.jobs[0].status, 'unverified');
    assert.equal(next.jobs[0].lastSeen, now);
    assert.equal(next.sources[0].lastSuccess, now);
  }
  assert.equal(mergeSnapshot(first, [{ source, jobs: [], complete: true }], '2026-10-06T16:00:00Z').jobs[0].status, 'not-listed');
});
test('sudden empty successful responses do not close an entire board', () => {
  const first = mergeSnapshot(null, [{ source, jobs: Array.from({ length: 10 }, (_, i) => ({ ...raw, id: String(i) })), complete: true }], now);
  const next = mergeSnapshot(first, [{ source, jobs: [], complete: true }], '2026-10-06T16:00:00Z');
  assert.equal(next.jobs.length, 10);
  assert.ok(next.jobs.every(j => j.status === 'unverified'));
  assert.notEqual(next.sources[0].status, 'ok');
});
test('Google parser resolves canonical job links and reads full role content', () => {
  const row = ['123', 'AI Scientist', null, [null, 'Research adversarial audio models.'], [null, 'PhD required'], null, null, 'DeepMind', null, null, [null, 'This is a full-time position.']];
  const html = `<li><h3>AI Scientist</h3><span class="r0wTof">Seattle, WA, USA</span><div class="Xsxa1e">PhD</div><a href="jobs/results/123-ai-scientist?q=audio">Learn more</a></li><a aria-label="Go to next page" href="https://www.google.com/page2"></a><script>AF_initDataCallback({key: 'ds:1', data:${JSON.stringify([[row]])}, sideChannel: {}});</script>`;
  const result = parseGoogle(html);
  assert.equal(result.jobs[0].url, 'https://www.google.com/about/careers/applications/jobs/results/123-ai-scientist');
  assert.match(result.jobs[0].description, /full-time/);
  assert.ok(result.next);
});
test('Apple and Microsoft parsers reject absent or extract structured roles', () => {
  assert.throws(() => parseApple('<html>Service unavailable</html>'));
  const row = { id: '1', postingTitle: 'Speech ML Intern', jobSummary: 'Train audio models.', locations: [{ city: 'Cupertino', countryName: 'United States' }], positionId: '1', transformedPostingTitle: 'speech-ml-intern', standardWeeklyHours: 40 };
  const data = { loaderData: { search: { totalRecords: 1, searchResults: [row] } } };
  const html = `window.__staticRouterHydrationData = JSON.parse(${JSON.stringify(JSON.stringify(data))})`;
  assert.equal(parseApple(html).jobs[0].title, row.postingTitle);
  const msr = parseMSR('<div class="card"><div class="card-body"><a data-bi-type="job-opportunity" href="https://apply.careers.microsoft.com/careers/job/1">Research Intern</a><div class="card__locations">Location: Redmond, WA, US</div><p>AI safety research</p><time datetime="2026-10-01"></time></div></div>');
  assert.equal(msr.jobs[0].postedAt, '2026-10-01');
  assert.match(msr.jobs[0].location, /Redmond/);
});
