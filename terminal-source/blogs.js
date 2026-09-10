import {XMLParser} from 'fast-xml-parser';
import {load} from 'cheerio';
import {readFile,writeFile} from 'node:fs/promises';
import {classify} from './shared/topics.js';
export const BLOG_SOURCES=[
 {id:'anthropic',name:'Anthropic Research',institution:'Anthropic',url:'https://www.anthropic.com/research',path:'^/research/(?!team/)[^/]+/?$',type:'html'},
 {id:'anthropic-alignment',name:'Anthropic Alignment Science',institution:'Anthropic',group:'Alignment Science',url:'https://alignment.anthropic.com/',path:'^/20\\d{2}/[^/]+/?$',type:'html',dedicated:true},
 {id:'deepmind',name:'Google DeepMind',institution:'Google DeepMind',url:'https://deepmind.google/blog/rss.xml'},
 {id:'google',name:'Google Research',institution:'Google',group:'Google Research',url:'https://research.google/blog/rss/'},
 {id:'nvidia',name:'NVIDIA Blog',institution:'NVIDIA',url:'https://blogs.nvidia.com/feed/'},
 {id:'nvidia-developer',name:'NVIDIA Technical Blog',institution:'NVIDIA',url:'https://developer.nvidia.com/blog/feed/'},
 {id:'openai',name:'OpenAI',institution:'OpenAI',url:'https://openai.com/news/rss.xml'},
 {id:'microsoft',name:'Microsoft Research',institution:'Microsoft',group:'Microsoft Research',url:'https://www.microsoft.com/en-us/research/feed/'},
 {id:'meta',name:'Meta AI',institution:'Meta',group:'Meta AI',url:'https://ai.meta.com/blog/',path:'^/blog/[^/]+/?$',type:'html'},
 {id:'huggingface',name:'Hugging Face',institution:'Hugging Face',url:'https://huggingface.co/blog/feed.xml'},
 {id:'metr',name:'METR',institution:'METR',url:'https://metr.org/feed.xml',dedicated:true},
 {id:'redwood',name:'Redwood Research',institution:'Redwood Research',url:'https://www.redwoodresearch.org/blog',path:'^/blog/[^/]+/?$',type:'html',dedicated:true},
 {id:'aisi',name:'UK AI Security Institute',institution:'UK AI Security Institute',url:'https://www.aisi.gov.uk/blog',path:'^/blog/[^/]+/?$',type:'html',dedicated:true},
];
export const isSafetyPost=s=>/\bsafe(?:ty|guards)?\b|secur|align(?:ment|ed)|misalign|interpretabil|jailbreak|red.team|adversari|robust|hallucinat|privacy|fairness|\bbias\b|deepfake|watermark|provenance|misinform|disinform|decept|deceiv|reward.hack|scheming|unlearn|model.spec|oversight|AI.control|controllab|responsible.AI|trustworthy|frontier.risk|biosecurity|misuse|sabotage|harmful|evaluation|monitoring|safeguard/i.test(s);
const arr=v=>[v??[]].flat();
const plain=s=>load(String(typeof s==='object'?s?.['#text']||'':s||'')).text().replace(/\s+/g,' ').trim();
export function officialURL(value,source){try{const u=new URL(value,source.url),base=new URL(source.url);if(!['https:','http:'].includes(u.protocol)||u.hostname!==base.hostname)return null;u.protocol='https:';u.hash='';for(const key of [...u.searchParams.keys()])if(key.startsWith('utm_'))u.searchParams.delete(key);return u.href.replace(/\/$/,'');}catch{return null;}}
function makePost(raw,source,now=Date.now()){
 const url=officialURL(raw.url,source),title=plain(raw.title);if(!url||!title||(!source.dedicated&&!isSafetyPost(title+' '+(raw.description||'')+' '+(raw.tags||''))))return null;
 const t=Date.parse(raw.published);if(Number.isFinite(t)&&t>now)return null;
 return {id:'blog:'+url,url,title,kind:'blog',publicationType:'blog',source:source.name,sourceId:source.id,institution:source.institution,groups:[source.institution,...(source.group?[source.group]:[])],groupOrigin:'publisher',groupStatus:'available',groupEvidence:'Official publisher website; identifies the host organization, not every author’s affiliation',groupMetadataUrl:source.url,authors:raw.authors||[],published:Number.isFinite(t)?new Date(t).toISOString():null,datePrecision:raw.datePrecision||'day',abstract:plain(raw.description).slice(0,450),abstractAvailable:!!raw.description,topics:classify(title+' '+(raw.description||'')),discoveredAt:new Date(now).toISOString()};
}
export function parseBlogFeed(xml,source,now=Date.now()){
 const data=new XMLParser({ignoreAttributes:false}).parse(xml),feed=data.rss?.channel||data.feed;if(!feed)throw Error('Expected RSS or Atom feed');
 return arr(feed.item||feed.entry).flatMap(e=>{const link=typeof e.link==='string'?e.link:arr(e.link).find(l=>!l['@_rel']||l['@_rel']==='alternate')?.['@_href'];const p=makePost({url:link,title:e.title,description:e.description||e.summary||'',tags:arr(e.category).map(c=>typeof c==='object'?c['@_term']||c['#text']:c).join(' '),published:e.pubDate||e.published||e['dc:date'],authors:arr(e['dc:creator']||e.author).map(a=>plain(a.name||a)).filter(Boolean)},source,now);return p?[p]:[];});
}
const datePattern=/\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+20\d{2}\b/i;
const monthPattern=/\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+20\d{2}\b/i;
export function blogLinks(html,source){const $=load(html),links=new Map();$('main a, article a, body a').each((i,e)=>{const url=officialURL($(e).attr('href'),source);if(!url||!new RegExp(source.path).test(new URL(url).pathname))return;const text=$(e).find('*').addBack().contents().filter((i,n)=>n.type==='text').map((i,n)=>n.data).get().join(' ').replace(/\s+/g,' ').trim();if(!links.has(url)||text.length>links.get(url).text.length)links.set(url,{url,text,date:text.match(datePattern)?.[0]});});return [...links.values()].slice(0,30);}
export function parseBlogPage(html,source,link,now=Date.now()){
 const $=load(html);let structured={};$('script[type="application/ld+json"]').each((i,e)=>{try{const raw=JSON.parse($(e).text());for(const v of arr(raw['@graph']||raw))if(/Article|Posting/.test(v['@type']))structured=v;}catch{}});
 const title=$('meta[property="og:title"]').attr('content')||$('h1').first().text()||structured.headline||$('title').text();
 const description=$('meta[name="description"]').attr('content')||$('meta[property="og:description"]').attr('content')||structured.description||'';
 let published=$('meta[property="article:published_time"]').attr('content')||structured.datePublished||$('time').first().attr('datetime')||link.date;
 $('script,style,nav,footer,header').remove();const intro=$('body').find('*').addBack().contents().filter((i,n)=>n.type==='text').map((i,n)=>n.data).get().join(' ').replace(/\s+/g,' ').slice(0,1200);
 let datePrecision='day';if(!published)published=intro.match(datePattern)?.[0];if(!published){published=intro.match(monthPattern)?.[0];if(published)datePrecision='month';}
 return makePost({url:link.url,title,description,published:published&&/^\d{4}-|T|GMT|UTC|[+-]\d{4}$/.test(published)?published:published?published+' UTC':null,datePrecision,authors:arr(structured.author).map(a=>a.name).filter(Boolean)},source,now);
}
const file=new URL('./data/blog-cache.json',import.meta.url);let cache={version:2,items:[],sources:[],status:'loading'},pending,last=0;
try{const stored=JSON.parse(await readFile(file,'utf8'));if(stored.version===2)cache=stored;}catch{}
async function get(url){const r=await fetch(url,{signal:AbortSignal.timeout(20000),headers:{'User-Agent':'SentinelResearchTerminal/1.0'}});if(!r.ok)throw Error(`HTTP ${r.status}`);return r.text();}
export function blogSnapshot(){return {...cache,refreshing:!!pending,pollInterval:900000,sources:BLOG_SOURCES.map(s=>({id:s.id,name:s.name,url:s.url,...cache.sources.find(c=>c.id===s.id)}))};}
export async function refreshBlogs(){
 if(pending)return pending;if(Date.now()-last<900000)return cache;last=Date.now();
 pending=(async()=>{const map=new Map(cache.items.map(p=>[p.id,p]));const sources=await Promise.all(BLOG_SOURCES.map(async source=>{
 const prior=cache.sources.find(s=>s.id===source.id);try{const body=await get(source.url);let items=[],failures=0;
 if(source.type==='html'){const links=blogLinks(body,source);if(!links.length)throw Error('No article links found; page layout may have changed');const candidates=links.filter(l=>!map.has('blog:'+l.url)).slice(0,18);
 for(let i=0;i<candidates.length;i+=3){const parsed=await Promise.all(candidates.slice(i,i+3).map(async l=>{try{return parseBlogPage(await get(l.url),source,l);}catch{failures++;return null;}}));items.push(...parsed.filter(Boolean));}
 }else items=parseBlogFeed(body,source);
 for(const p of items)map.set(p.id,{...p,discoveredAt:map.get(p.id)?.discoveredAt||p.discoveredAt});return{id:source.id,name:source.name,status:failures?'partial':'connected',count:[...map.values()].filter(p=>p.sourceId===source.id).length,lastSuccess:new Date().toISOString(),error:failures?`${failures} article pages unavailable`:null};
 }catch(e){return{id:source.id,name:source.name,status:prior?.lastSuccess?'stale':'offline',count:cache.items.filter(p=>p.sourceId===source.id).length,lastSuccess:prior?.lastSuccess||null,error:e.message};}}));
 cache={version:2,items:[...map.values()].sort((a,b)=>(Date.parse(b.published)||0)-(Date.parse(a.published)||0)).slice(0,3000),sources,status:sources.every(s=>s.status==='connected')?'connected':sources.some(s=>s.status==='connected')?'partial':'offline',lastAttempt:new Date().toISOString()};try{await writeFile(file,JSON.stringify(cache));}catch{cache.persistenceError=true;}return cache;})().finally(()=>{pending=null});return pending;
}
