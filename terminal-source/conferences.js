import {assessRelevance,filterRelevantPapers} from './shared/relevance.js';
import {setTimeout as delay} from 'node:timers/promises';
import {readFile,writeFile} from 'node:fs/promises';
import {classify} from './shared/topics.js';
import {parseCrossref} from './crossref.js';
import {mergeResearch} from './shared/research.js';
export const VENUES=[
 ['NeurIPS','S4306420609','ML'],['ICLR','S4306419637','ML'],['ICML','S4306419644','ML'],
 ['ACL','S4306420508','NLP'],['EMNLP','S4306418267','NLP'],
 ['CVPR','S4210176548','Vision'],['ICCV','S4306419272','Vision'],['ECCV','S4306418318','Vision'],
 ['USENIX Security','S4306421123','Security'],['CCS','S4306417956','Security'],['CCS','S4393917527','Security'],['NDSS','S4306420590','Security'],['IEEE S&P','S4210233669','Security'],
];
const safeURL=s=>{try{const u=new URL(s);return ['http:','https:'].includes(u.protocol)?u.href:null}catch{return null}};
export function decodeAbstract(index){const words=[];for(const [word,positions] of Object.entries(index||{}))for(const i of positions)if(Number.isInteger(i)&&i>=0&&i<10000)words[i]=word;return words.join(' ').trim();}
export function parseConferenceWorks(data,now=new Date()){
 if(!Array.isArray(data.results))throw Error('Invalid OpenAlex response');
 return data.results.flatMap(w=>{
  if(w.is_retracted||!w.title||!w.publication_date||Date.parse(w.publication_date)>+now)return[];
  const locations=[w.primary_location,...(w.locations||[])].filter(Boolean);
  const location=locations.find(l=>VENUES.some(v=>l.source?.id?.endsWith('/'+v[1])))||locations.find(l=>w.type==='conference-paper'&&l.is_published&&l.source?.type!=='repository'&&l.source?.display_name);
  if(!location)return[];
  const venue=VENUES.find(v=>location.source.id.endsWith('/'+v[1]))||[location.raw_source_name||location.source.display_name,location.source.id,'Other'];const abstract=decodeAbstract(w.abstract_inverted_index);
  if(!assessRelevance({title:w.title,abstract,venue:venue[0],publicationType:'conference'}).included)return[];
  const arxiv=locations.map(l=>l.landing_page_url||'').map(u=>u.match(/arxiv\.org\/abs\/([^?#]+)/)?.[1]?.replace(/v\d+$/,'')).find(Boolean);
  const url=safeURL(location.landing_page_url)||safeURL(w.doi)||safeURL(w.id);if(!url)return[];
  return[{id:`openalex:${w.id.split('/').pop()}`,kind:'paper',source:'OpenAlex',publicationType:'conference',venue:venue[0],venueName:location.source.display_name,venueEvidence:location.source.id,conferencePublished:w.publication_date,published:w.publication_date+'T00:00:00Z',year:w.publication_year,title:w.title,abstract:abstract||'Abstract not supplied by the conference metadata index. Open the proceedings link to read the paper.',abstractAvailable:!!abstract,authors:(w.authorships||[]).map(a=>a.author?.display_name).filter(Boolean),groups:[...new Set((w.authorships||[]).flatMap(a=>(a.institutions||[]).map(i=>i.display_name)).filter(Boolean))],groupEvidence:'Author affiliations indexed by OpenAlex',topics:classify(`${w.title} ${abstract}`),doi:w.doi,url,pdfUrl:safeURL(location.pdf_url)||safeURL(w.best_oa_location?.pdf_url),arxivId:arxiv,metadataUrl:safeURL(w.id),citationCount:w.cited_by_count||0}];
 });
}
const cacheURL=new URL('./data/conference-cache.json',import.meta.url);let cache={papers:[],sources:[],status:'loading',venues:VENUES.map(v=>v[0])},last=0,pending;
try{cache=JSON.parse(await readFile(cacheURL,'utf8'));cache.papers=filterRelevantPapers(cache.papers);}catch{}
export async function getConferences(){
 if(pending)return pending;if(Date.now()-last<3600000)return cache;last=Date.now();
 pending=(async()=>{
 const since=`${new Date().getUTCFullYear()-2}-01-01`,until=new Date().toISOString().slice(0,10);
 const results=await Promise.allSettled(['ML','NLP','Vision','Security','Other proceedings','Crossref hallucination','Crossref adversarial','Crossref privacy','Crossref ransomware'].map(async (group,index)=>{
  await delay(index*1400);
  if(group.startsWith('Crossref ')){
   const url=new URL('https://api.crossref.org/works');url.search=new URLSearchParams({filter:`type:proceedings-article,from-pub-date:${since},until-pub-date:${until}`,query:group.split(' ')[1],rows:'100',sort:'published',order:'desc'});
   const res=await fetch(url,{signal:AbortSignal.timeout(30000),headers:{'User-Agent':'SentinelResearchTerminal/1.0'}});if(!res.ok)throw Error(`Crossref HTTP ${res.status}`);
   const data=await res.json();return{group,papers:parseCrossref(data),totalAvailable:data.message?.['total-results']};
  }
  const url=new URL('https://api.openalex.org/works');
  const params={filter:`${group==='Other proceedings'?'type:conference-paper':'locations.source.id:'+VENUES.filter(v=>v[2]===group).map(v=>v[1]).join('|')},from_publication_date:${since},to_publication_date:${until},is_retracted:false`,sort:'publication_date:desc',per_page:'200',select:'id,type,doi,title,publication_date,publication_year,primary_location,locations,best_oa_location,authorships,abstract_inverted_index,cited_by_count,is_retracted'};
  if(group!=='Security')params.search='safety OR security OR adversarial OR hallucination OR privacy OR alignment OR fairness OR interpretability OR personalization OR deepfake OR watermark';
  if(process.env.OPENALEX_API_KEY)params.api_key=process.env.OPENALEX_API_KEY;
  url.search=new URLSearchParams(params);const res=await fetch(url,{signal:AbortSignal.timeout(30000)});if(!res.ok)throw Error(`OpenAlex HTTP ${res.status}`);
  const data=await res.json();return{group,papers:parseConferenceWorks(data),totalAvailable:data.meta?.count};
 }));
 const sources=results.map((r,i)=>r.status==='fulfilled'?{name:['ML','NLP','Vision','Security','Other proceedings','Crossref hallucination','Crossref adversarial','Crossref privacy','Crossref ransomware'][i],status:'connected',count:r.value.papers.length,totalAvailable:r.value.totalAvailable,lastSuccess:new Date().toISOString()}:{name:['ML','NLP','Vision','Security','Other proceedings','Crossref hallucination','Crossref adversarial','Crossref privacy','Crossref ransomware'][i],status:'offline',error:r.reason.message});
 cache={papers:filterRelevantPapers(mergeResearch(cache.papers,...results.filter(r=>r.status==='fulfilled').map(r=>r.value.papers))).slice(0,3000),sources,status:sources.every(s=>s.status==='connected')?'connected':sources.some(s=>s.status==='connected')?'partial':'offline',venues:[...new Set(VENUES.map(v=>v[0]))],since,until,pollInterval:3600000};
 try{await writeFile(cacheURL,JSON.stringify(cache));}catch{cache.persistenceError='Unable to save conference metadata';}return cache;
 })().finally(()=>{pending=null});return pending;
}
