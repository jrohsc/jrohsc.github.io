import { createHash } from 'node:crypto';
import { load } from 'cheerio';

export const TOPICS = ['AI Security', 'AI Safety', 'Privacy', 'Audio', 'Multimodal', 'AI Research'];
export const plain = value => load(String(value || '').replace(/<\/(?:p|div|li|h[1-6])>|<br\s*\/?>/gi, ' ')).text().replace(/\s+/g, ' ').trim();
export const cleanDescription = value => {
  let html = String(value || '');
  if (/&lt;(?:p|div|h[1-6])\b/.test(html)) html = load(html).text();
  const $ = load(html);
  $('.content-intro,.content-conclusion,script,style').remove();
  return plain($.html()).split(/(?:we are an equal opportunity|equal employment opportunity|applicant.{0,20}privacy (?:notice|policy)|our commitment to diversity|benefits at a glance|how we[’']re different|annual salary|logistics\s+education requirements)/i)[0];
};
const AI = /\b(?:AI|ML|LLMs?|VLMs?|artificial intelligence|machine learning|deep learning|language models?|foundation models?|neural|generative|reinforcement learning)\b/i;
const TECHNICAL = /\b(?:research(?:er)?|scien(?:tist|ce)|engineer(?:ing)?|technical|student|intern(?:s|ship(?:s)?)?|fellow(?:ship)?|residen(?:cy|t)|postdoc|professor|red team)\b/i;
const RULES = {
  'AI Security': /\b(?:AI (?:and |& )?security|AI\/ML security|model security|adversarial|jailbreak\w*|prompt injection|red[- ]team\w*|AI abuse|model abuse|AI threat|cybersecurity AI|security.{0,16}(?:LLM|AI model))\b/i,
  'AI Safety': /\b(?:AI safety|responsible AI|trustworthy AI|AI responsibility|superalignment|safeguards|(?:AI|model|safety) alignment|alignment (?:research|methods|techniques)|interpretability|model (?:safety|evaluation|evals)|safety (?:evaluation|oversight)|frontier risk|AI risk|adversarial robustness|RLHF)\b/i,
  'Privacy': /\b(?:differential(?:ly private| privacy)|privacy[- ]preserving|federated learning|machine unlearning|membership inference|data memorization|privacy research|privacy engineering)\b/i,
  'Audio': /\b(?:audio|speech|spoken|voice (?:AI|model|agent|generation)|text.to.speech|speech.to.text|ASR|TTS|music generation|acoustic|full.duplex)\b/i,
  'Multimodal': /\b(?:multi[- ]?modal|vision[- ]language|VLMs?|audio[- ]visual|video generation|image generation|text.to.video|text.to.image)\b/i,
};

export function classify(title, description = '', department = '') {
  // Hiring AI researchers is not itself an AI research or engineering role.
  if (/\b(?:recruit(?:er|ers|ing|ment)|talent acquisition)\b/i.test(title)) return { topics: [], evidence: [], score: 0 };
  const body = cleanDescription(description);
  const heading = `${title} ${department}`;
  const text = `${heading}. ${body}`;
  const ai = AI.test(text);
  const topics = [], evidence = [];
  for (const [topic, pattern] of Object.entries(RULES)) {
    let match = text.match(pattern);
    if (!match && ai && topic === 'Privacy') match = heading.match(/\bprivacy\b/i);
    if (!match && ai && topic === 'AI Security') match = heading.match(/\bsecurity\b/i);
    if (!match && ai && topic === 'AI Safety') match = heading.match(/\b(?:safety|alignment|robustness)\b/i);
    if (!match || (!ai && ['AI Security', 'AI Safety', 'Privacy'].includes(topic))) continue;
    // Audio engineers are relevant; recruiting and sales boilerplate is not.
    if (!TECHNICAL.test(title) && !pattern.test(title)) continue;
    topics.push(topic);
    const index = match.index || 0;
    evidence.push({ topic, term: match[0], excerpt: text.slice(Math.max(0, index - 65), index + 200).trim() });
  }
  if (!topics.length && ai && /\b(?:research(?:er)?|scien(?:tist|ce)|student researcher|intern(?:s|ship(?:s)?)?|fellow(?:ship)?|residen(?:cy|t))\b/i.test(title)) {
    topics.push('AI Research');
    evidence.push({ topic: 'AI Research', term: 'Related AI research', excerpt: text.slice(0, 250) });
  }
  return { topics, evidence, score: topics.filter(t => t !== 'AI Research').length * 12 + topics.filter(t => RULES[t]?.test(title)).length * 8 + (/research|scien(?:tist|ce)/i.test(title) ? 4 : 0) };
}

export function isUS(location, countries = []) {
  if (countries.some(c => /^(?:US|USA|United States(?: of America)?)$/i.test(c || ''))) return true;
  return /\bUnited States\b|\bUSA\b|(?:^|[,;\s-])US(?:$|[,;\s-])|\bU\.S\.|\b(?:California|Massachusetts|Washington|Texas|Virginia|Pennsylvania|Illinois|New York|New Jersey|North Carolina|Colorado|Oregon|Georgia|Florida|Utah|Michigan|Minnesota|Arizona)\b|\b(?:San Francisco|San Jose|Mountain View|Sunnyvale|Santa Clara|Palo Alto|Menlo Park|Redwood City|San Diego|Los Angeles|Cupertino|Seattle|Redmond|Bellevue|Kirkland|Boston|Cambridge,? MA|Pittsburgh|Austin|Atlanta|Chicago|New York City|Burlingame|Foster City|South San Francisco)\b/i.test(location || '');
}

export function employmentType(title, type = '', description = '') {
  if (/\b(?:intern(?:s|ship(?:s)?)?|co-?op|student researcher|fellowship)\b|\b(?:AI|research|ML) residen(?:cy|t)\b/i.test(`${title} ${type}`)) return 'Internship';
  if (/contract|temporary|part[- ]?time|freelance/i.test(`${title} ${type}`)) return 'Other';
  if (/full[- _]?time|regular|permanent/i.test(type) || /\bfull[- ]time (?:position|role|employment)\b/i.test(description)) return 'Full-time';
  return 'Unspecified';
}

export function safeURL(value) {
  try { const u = new URL(value); return u.protocol === 'https:' ? u.href : ''; } catch { return ''; }
}
export function isoDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
export function normalize(raw, source, now) {
  const title = plain(raw.title), location = plain(raw.location);
  const url = safeURL(raw.url), description = cleanDescription(raw.description);
  if (!title || !url || !isUS(location, raw.countries)) return null;
  const match = classify(title, description, plain(raw.department));
  if (!match.topics.length) return null;
  const type = employmentType(title, raw.type, description);
  if (type === 'Other') return null;
  return {
    id: `${source.id}:${raw.id || createHash('sha256').update(url.split('?')[0]).digest('hex').slice(0, 16)}`,
    sourceId: source.id, company: source.name, tier: source.tier,
    title, location, type, typeInferred: type === 'Unspecified',
    department: plain(raw.department), url, applyUrl: safeURL(raw.applyUrl) || url,
    postedAt: isoDate(raw.postedAt), sourceUpdatedAt: isoDate(raw.updatedAt),
    remote: /remote/i.test(`${location} ${raw.workplace || ''}`),
    ...match, excerpt: description.slice(0, 480),
    firstSeen: now, lastSeen: now, status: 'open',
  };
}

export function mergeSnapshot(previous, results, now) {
  const oldJobs = new Map((previous?.jobs || []).map(j => [j.id, j]));
  const current = new Map();
  const sources = results.map(({ source, jobs, complete, error, scanned }) => {
    const oldSource = previous?.sources?.find(s => s.id === source.id);
    for (const raw of jobs) {
      const job = normalize(raw, source, now);
      if (!job) continue;
      const old = oldJobs.get(job.id);
      current.set(job.id, { ...job, firstSeen: old?.firstSeen || now, missingSince: null });
    }
    const found = [...current.values()].filter(j => j.sourceId === source.id).length;
    // A sudden empty/reduced response may be a parser change, never a mass closure.
    const oldCount = [...oldJobs.values()].filter(j => j.sourceId === source.id && j.status === 'open').length;
    const suspicious = complete && oldCount >= 5 && found < oldCount * 0.35;
    const trustworthy = complete && !error && !suspicious;
    for (const old of oldJobs.values()) {
      if (old.sourceId !== source.id || current.has(old.id)) continue;
      if (trustworthy) {
        const missingSince = old.missingSince || now;
        if (Date.parse(now) - Date.parse(missingSince) < 30 * 86400000) current.set(old.id, { ...old, status: 'not-listed', missingSince });
      } else current.set(old.id, { ...old, status: old.status === 'not-listed' ? 'not-listed' : 'unverified' });
    }
    return {
      id: source.id, name: source.name, tier: source.tier, url: source.url,
      status: source.adapter === 'manual' ? 'manual' : trustworthy ? 'ok' : jobs.length ? 'partial' : 'error',
      checkedAt: now, lastSuccess: trustworthy ? now : oldSource?.lastSuccess || null,
      count: found, scanned: scanned || jobs.length,
      note: suspicious ? 'Unusually few results; previous listings retained for verification.' : error || source.note || '',
    };
  });
  return { schemaVersion: 1, updatedAt: now, refreshMinutes: 5, region: 'United States', sources,
    jobs: [...current.values()].sort((a, b) => a.tier - b.tier || b.score - a.score || (b.postedAt || '').localeCompare(a.postedAt || '') ) };
}
