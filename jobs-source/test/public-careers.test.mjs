import test from 'node:test';
import assert from 'node:assert/strict';
import { parseEightfoldSearch, parseEightfoldJob, parseMetaJob } from '../public-careers.mjs';
import { parseAppleDetail, parseDolbyDetail } from '../adapters.mjs';
import { researchFit, normalize } from '../model.mjs';
const microsoft = { id: 'microsoft', name: 'Microsoft', tier: 1, url: 'https://apply.careers.microsoft.com/careers' };
test('Microsoft and Qualcomm public API responses require structured, complete evidence', () => {
  const row = { id: '1', name: 'Research Intern', locations: ['Redmond, WA, US'] };
  assert.equal(parseEightfoldSearch({ status: 200, data: { positions: [row], count: 1 } }).total, 1);
  assert.throws(() => parseEightfoldSearch({ status: 429, data: { positions: [], count: 0 } }));
  assert.throws(() => parseEightfoldSearch({ status: 200, data: { positions: [{ id: '1' }], count: 1 } }));
  const raw = parseEightfoldJob({ status: 200, data: { ...row, jobDescription: 'Currently pursuing a PhD. Conduct research in systems security.', postedTs: 1790899200 } }, microsoft);
  const job = normalize(raw, microsoft, '2026-10-06T12:00:00Z');
  assert.equal(job.type, 'Internship');
  assert.equal(job.research.phdEligible, true);
  assert.deepEqual(job.topics, ['Research']); // Security/AI keywords are not mandatory.
  assert.equal(raw.url, 'https://apply.careers.microsoft.com/careers/job/1');
  assert.throws(() => parseEightfoldJob({ status: 200, data: row }, microsoft));
});
test('Meta details include qualifications and do not silently accept an unavailable page', () => {
  const structured = { '@type': 'JobPosting', title: 'Research Scientist Intern (PhD)', description: 'Conduct robotics research.', qualifications: 'Enrolled in a PhD program.', jobLocation: [{ address: { addressLocality: 'Menlo Park', addressRegion: 'CA', addressCountry: 'US' } }], employmentType: 'FULL_TIME' };
  const job = parseMetaJob(`<script type="application/ld+json">${JSON.stringify(structured)}</script>`, { id: '42', teams: ['Research'] });
  assert.match(job.description, /Enrolled in a PhD/);
  assert.match(job.location, /Menlo Park/);
  assert.throws(() => parseMetaJob('<html>Unavailable</html>', { id: '42' }));
});
test('research filter distinguishes eligible research from recruiting, non-doctoral titles and incidental PhD mentions', () => {
  assert.equal(researchFit('Research Intern', 'Currently pursuing a PhD in physics.').phdEligible, true);
  assert.equal(researchFit('Machine Learning PhD Internships', 'Advance research and publications.').phdEligible, true);
  assert.equal(researchFit('Engineering Intern', 'Pursuing BS, MS or PhD. Conduct research and development in audio.').phdEligible, true);
  assert.equal(researchFit('Research Intern', 'Collaborate with PhD researchers on new ideas.').phdEligible, false);
  assert.equal(researchFit('Research Intern, BS/MS', 'For a PhD program see our other role.').phdEligible, false);
  assert.equal(researchFit('Recruiting Intern', 'Hire PhD students for research.').phdEligible, false);
  assert.equal(researchFit('Engineering Program Management Intern', 'PhD required. Publish research.').phdEligible, false);
  assert.equal(researchFit('Research Intern', 'BS or MS required.').phdEligible, false);
});
test('Apple qualifications and talent-pool status survive detail parsing; Dolby includes research areas', () => {
  const data = { loaderData: { jobDetails: { jobsData: { postingTitle: 'ML Internships', type: 'PIPE', jobSummary: 'Machine learning', description: 'Publish research.', minimumQualifications: 'Pursuing a PhD.', preferredQualifications: 'Audio experience' } } } };
  const html = `window.__staticRouterHydrationData = JSON.parse(${JSON.stringify(JSON.stringify(data))})`;
  const detail = parseAppleDetail(html);
  assert.match(detail.description, /Pursuing a PhD/);
  assert.equal(detail.pipeline, true);
  assert.throws(() => parseAppleDetail('<html>Not found</html>'));
  assert.match(parseDolbyDetail('<div class="jobdescription">PhD research in audio and agentic AI</div>').description, /agentic AI/);
});
