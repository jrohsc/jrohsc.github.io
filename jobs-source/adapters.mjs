import { load } from 'cheerio';
import { plain, isUS, classify } from './model.mjs';

const HEADERS = { 'user-agent': 'Mozilla/5.0', accept: 'application/json,text/html;q=0.9,*/*;q=0.8' };
const MAX_PAGES = 30;
export async function request(url, body) {
  const response = await fetch(url, { headers: { ...HEADERS, ...(body ? { 'content-type': 'application/json' } : {}) },
    method: body ? 'POST' : 'GET', body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`Official source returned HTTP ${response.status}`);
  return response;
}
export async function pool(items, limit, fn) {
  let index = 0;
  const results = new Array(items.length);
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) { const i = index++; results[i] = await fn(items[i], i); }
  }));
  return results;
}

export function parseGoogle(html) {
  const $ = load(html), jobs = [];
  const structured = new Map();
  $('script').each((_, e) => {
    const script = $(e).text();
    if (!script.includes("key: 'ds:1'")) return;
    const match = script.match(/data:(.*), sideChannel:/s);
    if (!match) return;
    try {
      for (const row of JSON.parse(match[1])[0] || []) {
        if (Array.isArray(row) && /^\d+$/.test(row[0]) && typeof row[1] === 'string') structured.set(row[0], row);
      }
    } catch { /* Visible job cards remain usable if Google's hydration changes. */ }
  });
  $('a[href]').filter((_, a) => /jobs\/results\/\d+/.test($(a).attr('href'))).each((_, a) => {
    const card = $(a).closest('li'), title = card.find('h3').first().text();
    if (!title) return;
    const href = $(a).attr('href');
    const id = href.match(/results\/(\d+)/)[1], row = structured.get(id);
    const fullDescription = row ? [row[3]?.[1], row[4]?.[1], row[10]?.[1]].filter(s => typeof s === 'string').join(' ') : '';
    jobs.push({ id, title,
      url: new URL(href.split('?')[0], 'https://www.google.com/about/careers/applications/').href,
      location: [...new Set(card.find('.r0wTof').map((_, e) => $(e).text()).get())].join('; '),
      description: fullDescription || card.find('.Xsxa1e').text(), department: card.find('.RP7SMd').text().replace('corporate_fare', ''),
    });
  });
  return { jobs, next: $('a[aria-label="Go to next page"]').attr('href'), recognized: jobs.length > 0 || /no (?:matching )?(?:jobs|results)|0 jobs/i.test($('body').text()) };
}
export function parseApple(html) {
  const m = html.match(/window\.__staticRouterHydrationData = JSON\.parse\(("(?:[^"\\]|\\.)*")\)/);
  if (!m) throw new Error('Apple search format changed');
  const data = JSON.parse(JSON.parse(m[1])).loaderData.search;
  if (!Array.isArray(data?.searchResults)) throw new Error('Apple returned no structured search result');
  return { total: data.totalRecords, jobs: data.searchResults.map(j => ({
    id: j.id, title: j.postingTitle, description: j.jobSummary,
    location: j.locations.map(l => [l.city, l.stateProvince, l.countryName].filter(Boolean).join(', ')).join('; '),
    countries: j.locations.map(l => l.countryName), postedAt: j.postDateInGMT || j.postingDate,
    department: j.team?.teamName, type: j.standardWeeklyHours >= 35 ? 'Full-time' : '',
    url: `https://jobs.apple.com/en-us/details/${j.positionId}/${j.transformedPostingTitle}`,
  })) };
}
export function parseMSR(html) {
  const $ = load(html), jobs = [];
  $('a[data-bi-type="job-opportunity"]').each((_, a) => {
    const card = $(a).closest('.card');
    jobs.push({ title: $(a).text(), url: $(a).attr('href'),
      location: card.find('.card__locations').text().replace(/Location\s*:/, ''),
      description: card.find('.card-body > p').text(), department: card.find('.card__research-area').text(),
      postedAt: card.find('time').attr('datetime') });
  });
  const next = $('a').filter((_, a) => /next/i.test($(a).attr('aria-label') || $(a).text())).map((_, a) => $(a).attr('href')).get().find(u => /pg=/.test(u));
  return { jobs, next };
}

export async function collectSource(source) {
  const jobs = [], issues = []; let complete = true, scanned = 0;
  const add = rows => { scanned += rows.length; jobs.push(...rows); };
  const attempt = async fn => { try { await fn(); } catch (e) { complete = false; issues.push(e.message); } };
  if (source.adapter === 'manual') return { source, jobs, complete: false, error: source.note, scanned };
  await attempt(async () => {
    if (source.adapter === 'ashby') {
      const data = await (await request(`https://api.ashbyhq.com/posting-api/job-board/${source.board}`)).json();
      if (!Array.isArray(data.jobs)) throw new Error('Job board format changed');
      add(data.jobs.filter(j => j.isListed !== false).map(j => ({ id: j.id, title: j.title,
        location: [j.location, ...(j.secondaryLocations || []).map(l => l.location)].filter(Boolean).join('; '),
        countries: [j.address?.postalAddress?.addressCountry, ...(j.secondaryLocations || []).map(l => l.address?.postalAddress?.addressCountry)],
        description: j.descriptionPlain || j.descriptionHtml, department: `${j.department || ''} ${j.team || ''}`,
        type: j.employmentType, workplace: j.workplaceType, postedAt: j.publishedAt, url: j.jobUrl, applyUrl: j.applyUrl })));
    } else if (source.adapter === 'greenhouse') {
      const data = await (await request(`https://boards-api.greenhouse.io/v1/boards/${source.board}/jobs?content=true`)).json();
      if (!Array.isArray(data.jobs)) throw new Error('Job board format changed');
      add(data.jobs.map(j => ({ id: j.id, title: j.title, location: j.location?.name,
        description: j.content, department: (j.departments || []).map(d => d.name).join('; '),
        type: (j.metadata || []).filter(m => /employment|commitment|type/i.test(m.name)).map(m => m.value).join(' '),
        postedAt: j.first_published, updatedAt: j.updated_at, url: j.absolute_url })));
    } else if (source.adapter === 'lever') {
      const data = await (await request(`https://api.lever.co/v0/postings/${source.board}?mode=json`)).json();
      if (!Array.isArray(data)) throw new Error('Job board format changed');
      add(data.map(j => ({ id: j.id, title: j.text, location: (j.categories?.allLocations || [j.categories?.location]).join('; '),
        description: j.descriptionPlain + ' ' + (j.lists || []).map(x => plain(x.content)).join(' '),
        department: j.categories?.team, type: j.categories?.commitment, workplace: j.workplaceType,
        url: j.hostedUrl, applyUrl: j.applyUrl, postedAt: j.createdAt })));
    } else if (source.adapter === 'google') {
      for (const query of source.queries) await attempt(async () => {
        let url = `https://www.google.com/about/careers/applications/jobs/results/?q=${encodeURIComponent(query)}&location=United%20States`;
        const visited = new Set(); let page = 0;
        while (url && page++ < MAX_PAGES) {
          if (visited.has(url)) throw new Error('Repeated Google pagination; retained earlier results');
          visited.add(url);
          const result = parseGoogle(await (await request(url)).text());
          if (!result.recognized) throw new Error('Google result layout unavailable');
          add(result.jobs); url = result.next;
        }
        if (url) throw new Error('Google search exceeded page limit; coverage is partial');
      });
    } else if (source.adapter === 'apple') {
      for (const query of source.queries) await attempt(async () => {
        let page = 1, total = Infinity, count = 0;
        while (count < total && page <= MAX_PAGES) {
          const result = parseApple(await (await request(`https://jobs.apple.com/en-us/search?key=${encodeURIComponent(query)}&location=united-states-USA&page=${page++}`)).text());
          total = result.total; count += result.jobs.length;
          if (!result.jobs.length && count < total) throw new Error('Apple search ended before all results were returned');
          add(result.jobs);
        }
        if (count < total) throw new Error('Apple search exceeded page limit; coverage is partial');
      });
    } else if (source.adapter === 'amazon') {
      for (const query of source.queries) await attempt(async () => {
        let offset = 0, total = Infinity;
        while (offset < total && offset < MAX_PAGES * 100) {
          const params = new URLSearchParams({ offset, result_limit: 100, sort: 'recent', base_query: query, 'country[]': 'USA' });
          const data = await (await request(`https://www.amazon.jobs/en/search.json?${params}`)).json();
          if (!Array.isArray(data.jobs)) throw new Error('Amazon search format changed');
          total = data.hits; if (!data.jobs.length && offset < total) throw new Error('Amazon search returned an incomplete page');
          add(data.jobs.map(j => ({ id: j.id_icims, title: j.title, location: [j.location, j.normalized_location].filter(Boolean).join('; '), countries: [j.country_code],
            description: `${j.description} ${j.basic_qualifications}`, department: j.job_family,
            type: j.job_schedule_type, postedAt: j.posted_date, url: `https://www.amazon.jobs${j.job_path}`, applyUrl: j.url_next_step })));
          offset += data.jobs.length;
        }
        if (offset < total) throw new Error('Amazon search exceeded page limit; coverage is partial');
      });
    } else if (source.adapter === 'msr') {
      let page = 1, lastIDs = '';
      while (page <= MAX_PAGES) {
        const url = `${source.url}?sort_by=most-recent${page > 1 ? `&pg=${page}` : ''}`;
        const result = parseMSR(await (await request(url)).text());
        if (!result.jobs.length) { if (page === 1) throw new Error('Microsoft Research listings unavailable'); break; }
        const ids = result.jobs.map(j => j.url).join('|');
        if (ids === lastIDs) throw new Error('Microsoft pagination returned repeated results');
        lastIDs = ids; add(result.jobs);
        if (result.jobs.length < 10) break;
        page++;
      }
      if (page > MAX_PAGES) throw new Error('Microsoft Research page limit reached');
    } else if (source.adapter === 'workday') {
      const base = `https://${source.host}/wday/cxs/${source.tenant}/${source.board}`;
      const listings = new Map();
      for (const query of source.queries) await attempt(async () => {
        let offset = 0, total = Infinity;
        while (offset < total && offset < MAX_PAGES * 20) {
          const data = await (await request(`${base}/jobs`, { limit: 20, offset, searchText: query, appliedFacets: {} })).json();
          if (!Array.isArray(data.jobPostings)) throw new Error('Workday search format changed');
          total = data.total;
          if (!data.jobPostings.length && offset < total) throw new Error('Workday search ended early');
          for (const j of data.jobPostings) listings.set(j.externalPath, j);
          offset += data.jobPostings.length;
        }
        if (offset < total) throw new Error('Workday search exceeded page limit; coverage is partial');
      });
      scanned = listings.size;
      // Search results omit locations and descriptions. Verify the actual posting before including it.
      await pool([...listings.values()], 4, async j => attempt(async () => {
        const data = await (await request(base + j.externalPath)).json();
        const d = data.jobPostingInfo;
        if (!d) throw new Error('Workday job detail unavailable');
        jobs.push({ id: d.jobReqId || j.bulletFields?.[0], title: d.title || j.title,
          location: [d.location, ...(d.additionalLocations || [])].filter(Boolean).join('; '), countries: [d.country?.descriptor],
          description: d.jobDescription, type: `${d.timeType || ''} ${d.workerSubType || ''}`,
          postedAt: d.startDate, url: d.externalUrl || `https://${source.host}/en-US/${source.board}${j.externalPath}` });
      }));
    } else if (source.adapter === 'dolby') {
      for (const query of ['research', 'audio', 'speech', 'multimodal', 'machine learning']) await attempt(async () => {
      let start = 0;
      while (start < 500) {
        const $ = load(await (await request(`${source.url}?q=${encodeURIComponent(query)}&startrow=${start}`)).text());
        const rows = [];
        $('.job-tile').each((_, tile) => {
          const el = $(tile), a = el.find('a.jobTitle-link').first();
          if (!a.length) return;
          const location = el.find('.jobLocation').first().text() || el.text().match(/Location\s+(.+?)\s+Date/s)?.[1];
          rows.push({ title: a.text(), location: plain(location), url: new URL(a.attr('href'), source.url).href,
            postedAt: el.text().match(/Date\s+([A-Z][a-z]{2}\s+\d+,?\s+\d{4})/)?.[1] });
        });
        if (!rows.length) { if (!start) throw new Error('Dolby listing format changed'); break; }
        add(rows);
        const next = $('a[href*="startrow="]').map((_, a) => Number(new URL($(a).attr('href'), source.url).searchParams.get('startrow'))).get().filter(n => n > start).sort((a,b) => a-b)[0];
        if (!next) break;
        start = next;
      }
      });
    }
  });
  return { source, jobs, complete, scanned, error: [...new Set(issues)].join('; ').slice(0, 350) };
}
