import {readFile,writeFile} from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';
import {load} from 'cheerio';
import {normalizeGroups} from './shared/affiliations.js';
const file=new URL('./data/affiliations-cache.json',import.meta.url);let cache={version:3,records:{},status:'idle'},pending;
try{const stored=JSON.parse(await readFile(file,'utf8'));if(stored.version===3)cache=stored;}catch{}
const norm=s=>String(s||'').toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}]/gu,'');
export function affiliationMatch(p,w){return norm(p.title)===norm(w.title)&&!!p.authors?.[0]&&norm(p.authors[0])===norm(w.authorships?.[0]?.author?.display_name);}
export function parsePaperAffiliations(html,p){
 const $=load(html);const title=$('meta[name="citation_title"]').attr('content')||$('.ltx_title_document').first().text();
 if(!title||norm(title)!==norm(p.title))return [];
 const values=$('meta[name="citation_author_institution"]').map((i,e)=>$(e).attr('content')).get();
 $('.ltx_authors .ltx_role_affiliation').each((i,e)=>{const block=$(e).clone();block.find('.ltx_contact_name,.ltx_role_email,.ltx_note').remove();block.find('sup,math').replaceWith('|||');block.find('br').replaceWith('\n');
 const text=block.text().split('\n').map(line=>line.replace(/\b(?:Corresponding author|Correspondence|E-?mail):.*$/i,'')).filter(line=>!line.includes('@')).join(' ');
 for(let name of text.split('|||')){name=name.replace(/^Affiliation:\s*/i,'').replace(/Equal contribution.*$/i,'').trim();if(!name)continue;name=name.replace(/^.+?\b(?:is|are) (?:with|at)\s+/,'').replace(/\.$/,'');values.push(name);}});
 return normalizeGroups(values);
}
async function resolve(p){
 let failed=false;const arxiv=p.arxivId||(p.source==='arXiv'?p.id:null);
 if(arxiv&&/^\d{4}\.\d{4,5}(v\d+)?$/.test(arxiv)){
  const url='https://arxiv.org/html/'+arxiv;
  try{const r=await fetch(url,{signal:AbortSignal.timeout(12000)});if(r.ok){const groups=parsePaperAffiliations(await r.text(),p);if(groups.length)return{groups,groupOrigin:'paper',groupEvidence:'Affiliations found in the paper’s arXiv HTML; the PDF may list additional affiliations',groupMetadataUrl:url,groupStatus:'available'};}else if(r.status!==404)failed=true;}catch{failed=true;}
 }
 // Individual exact-title lookup avoids treating a long OR search as one phrase.
 try{const url=new URL(p.doi?'https://api.openalex.org/works/https://doi.org/'+p.doi.replace(/^https?:\/\/(?:dx\.)?doi\.org\//,''):'https://api.openalex.org/works');const params=p.doi?{}:{search:p.title,per_page:'5'};if(process.env.OPENALEX_API_KEY)params.api_key=process.env.OPENALEX_API_KEY;url.search=new URLSearchParams(params);
 const r=await fetch(url,{signal:AbortSignal.timeout(10000)});if(r.ok){const data=await r.json();const w=(data.results||[data]).find(w=>affiliationMatch(p,w));const groups=normalizeGroups((w?.authorships||[]).flatMap(a=>(a.institutions||[]).map(i=>i.display_name)));if(groups.length)return{groups,groupOrigin:'index',groupEvidence:'OpenAlex work-specific author affiliations; exact title and first-author match',groupMetadataUrl:w.id,groupStatus:'available'};}else failed=true;
 }catch{failed=true;}
 return{groups:[],groupStatus:failed?'error':'unavailable'};
}
export async function enrichAffiliations(papers,{limit=18}={}){
 if(pending){await pending;return enrichAffiliations(papers,{limit});}
 const candidates=papers.filter(p=>{const r=cache.records[p.id];return !p.groups?.length&&(!r||(!r.groups?.length&&Date.now()-Date.parse(r.checkedAt)> (r.groupStatus==='error'?3600000:7*86400000)));}).slice(0,limit);
 if(!candidates.length)return cache;
 pending=(async()=>{for(let i=0;i<candidates.length;i+=3){if(i)await delay(1000);await Promise.all(candidates.slice(i,i+3).map(async p=>{cache.records[p.id]={...await resolve(p),checkedAt:new Date().toISOString()};}));}
 cache.status=candidates.some(p=>cache.records[p.id].groupStatus==='error')?'partial':'connected';cache.lastAttempt=new Date().toISOString();try{await writeFile(file,JSON.stringify(cache));}catch{cache.persistenceError=true;}return cache;})().finally(()=>{pending=null});return pending;
}
export function affiliationCache(){return cache;}
