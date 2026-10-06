import { load } from 'cheerio';
import { isUS } from './model.mjs';

const MAX_PAGES = 100;
const RESEARCH_OR_INTERN = /\b(?:research(?:er)?|scien(?:tist|ce)|intern(?:s|ship(?:s)?)?|Ph\.?D|student|postdoc)\b/i;

export function parseEightfoldSearch(data) {
  const result = data?.data;
  if (data?.status !== 200 || !Array.isArray(result?.positions) || !Number.isInteger(result.count) || result.count < 0) {
    throw new Error('Official careers search format changed');
  }
  if (result.positions.some(j => !j.id || !j.name || !Array.isArray(j.locations))) throw new Error('Official careers search returned an incomplete listing');
  return { jobs: result.positions, total: result.count };
}

export function parseEightfoldJob(data, source) {
  const j = data?.data;
  if (data?.status !== 200 || !j?.id || !j.name || !j.jobDescription || !Array.isArray(j.locations)) {
    throw new Error('Official job description unavailable');
  }
  const fields = j.positionFields || [];
  return { id: String(j.id), title: j.name, description: j.jobDescription,
    location: j.locations.join('; '), department: j.department,
    type: Array.isArray(fields) ? fields.filter(f => /employment.?type|job.?type/i.test(f.name || f.label || '')).map(f => f.value).join(' ') : '',
    postedAt: j.postedTs ? j.postedTs * 1000 : null, workplace: j.workLocationOption,
    url: `${new URL(source.url).origin}/careers/job/${j.id}` };
}

export function parseMetaJob(html, listing) {
  const $ = load(html);
  let posting;
  $('script[type="application/ld+json"]').each((_, element) => {
    try {
      const value = JSON.parse($(element).text());
      const candidates = Array.isArray(value) ? value : value['@graph'] || [value];
      posting ||= candidates.find(row => row['@type'] === 'JobPosting');
    } catch { /* Other structured-data blocks can contain the job. */ }
  });
  if (!posting?.title) throw new Error('Meta job description unavailable');
  const locations = Array.isArray(posting.jobLocation) ? posting.jobLocation : [posting.jobLocation].filter(Boolean);
  return { id: listing.id, title: posting.title,
    description: [posting.description, posting.responsibilities, posting.qualifications, posting.educationRequirements].filter(v => typeof v === 'string').join(' '),
    department: [...(listing.teams || []), ...(listing.sub_teams || [])].join('; '),
    location: locations.map(l => l.name || [l.address?.addressLocality, l.address?.addressRegion, l.address?.addressCountry].filter(Boolean).join(', ')).join('; ') || listing.locations?.join('; '),
    countries: locations.map(l => l.address?.addressCountry), type: posting.employmentType,
    postedAt: posting.datePosted, url: `https://www.metacareers.com/profile/job_details/${listing.id}` };
}

export async function collectPublicCareers(source, { request, pool }) {
  const jobs = [], issues = [], listings = new Map();
  let scanned = 0;
  const attempt = async fn => { try { await fn(); } catch (error) { issues.push(error.message); } };
  if (source.adapter === 'eightfold') {
    const origin = new URL(source.url).origin;
    for (const query of source.queries) await attempt(async () => {
      let start = 0, total = Infinity, page = 0;
      const visited = new Set();
      while (start < total && page++ < MAX_PAGES) {
        // Match the careers site's URI encoding; Microsoft's edge rejects spaces encoded as '+'.
        const params = `domain=${encodeURIComponent(source.domain)}&query=${encodeURIComponent(query)}&location=United%20States&start=${start}&`;
        const result = parseEightfoldSearch(await (await request(`${origin}/api/pcsx/search?${params}`)).json());
        total = result.total;
        const ids = result.jobs.map(j => j.id).join(',');
        if ((!result.jobs.length && start < total) || (ids && visited.has(ids))) throw new Error('Official search returned an incomplete or repeated page');
        visited.add(ids);
        for (const j of result.jobs) listings.set(String(j.id), j);
        start += result.jobs.length;
      }
      if (start < total) throw new Error('Official search page limit reached; coverage is partial');
    });
    scanned = listings.size;
    const candidates = [...listings.values()].filter(j => isUS(j.locations.join('; ')) && RESEARCH_OR_INTERN.test(`${j.name} ${j.department || ''}`));
    await pool(candidates, 2, async j => attempt(async () => {
      const params = new URLSearchParams({ domain: source.domain, position_id: j.id, hl: 'en' });
      jobs.push(parseEightfoldJob(await (await request(`${origin}/api/pcsx/position_details?${params}`)).json(), source));
    }));
  } else if (source.adapter === 'meta') await attempt(async () => {
    // The same public, logged-out search query used by Meta's careers page.
    const html = await (await request(source.url)).text();
    const token = html.match(/\["LSD",\[\],\{"token":"([^"]+)"/);
    if (!token) throw new Error('Meta public careers search format changed');
    const variables = { search_input: { q: '', divisions: [], offices: [], roles: [], leadership_levels: [], saved_jobs: [], saved_searches: [], sub_teams: [], teams: [], is_leadership: false, is_remote_only: false, sort_by_new: false, results_per_page: null }, viewasUserID: null, isLoggedIn: false };
    const response = await fetch('https://www.metacareers.com/graphql', { method: 'POST', signal: AbortSignal.timeout(30000),
      headers: { 'user-agent': 'Mozilla/5.0', 'content-type': 'application/x-www-form-urlencoded', 'x-fb-lsd': token[1] },
      body: new URLSearchParams({ lsd: token[1], doc_id: '27129360303422352', fb_api_req_friendly_name: 'CareersJobSearchResultsV2DataQuery', variables: JSON.stringify(variables) }) });
    if (!response.ok) throw new Error(`Meta public search returned HTTP ${response.status}`);
    const data = JSON.parse((await response.text()).split('\n')[0]);
    const rows = data.data?.job_search_with_featured_jobs_v2?.all_jobs;
    if (data.errors?.length || !Array.isArray(rows)) throw new Error('Meta public search query changed or is unavailable');
    scanned = rows.length;
    const candidates = rows.filter(j => (!j.locations?.length || isUS(j.locations.join('; '))) && RESEARCH_OR_INTERN.test(j.title));
    if (candidates.length > 1000) throw new Error('Meta research detail limit reached; coverage is partial');
    await pool(candidates, 3, async j => attempt(async () => {
      jobs.push(parseMetaJob(await (await request(`https://www.metacareers.com/profile/job_details/${j.id}`)).text(), j));
    }));
  });
  return { source, jobs, complete: !issues.length, error: [...new Set(issues)].join('; '), scanned };
}
