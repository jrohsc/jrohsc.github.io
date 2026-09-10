import {filterRelevantPapers} from './shared/relevance.js';
import {readFile,writeFile} from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';
import {parseFeed,queryFamilies,RESULTS_PER_QUERY,MAX_RETAINED,coverage} from './feed.js';
import {reclassifyPaper} from './shared/topics.js';
let cache={papers:[],lastSuccess:null,families:[]};let lastAttempt=0;let pending;let error=null;
try {cache=JSON.parse(await readFile(new URL('./data/cache.json',import.meta.url),'utf8'));cache.papers=filterRelevantPapers(cache.papers.map(reclassifyPaper));}catch{}
export async function refreshPapers(){
 if(pending)return pending;
 if(Date.now()-lastAttempt<300000)return;
 lastAttempt=Date.now();
 pending=(async()=>{
  const merged=new Map(cache.papers.map(p=>[p.id,p]));const families=[];
  for(const [i,family] of queryFamilies.entries()){
   // Keep requests serial, with at least three seconds between arXiv calls.
   if(i)await delay(3100);
   try{
    const url=new URL('https://export.arxiv.org/api/query');
    url.search=new URLSearchParams({search_query:family.query,start:'0',max_results:String(RESULTS_PER_QUERY),sortBy:'submittedDate',sortOrder:'descending'});
    const res=await fetch(url,{signal:AbortSignal.timeout(45000),headers:{'User-Agent':'SentinelResearchTerminal/1.0'}});
    if(!res.ok)throw Error(`arXiv returned ${res.status}`);
    const papers=parseFeed(await res.text());papers.forEach(p=>merged.set(p.id,p));
    families.push({id:family.id,label:family.label,status:'connected',count:papers.length,lastSuccess:new Date().toISOString()});
   }catch(e){families.push({id:family.id,label:family.label,status:'offline',error:e.message,lastSuccess:cache.families?.find(f=>f.id===family.id)?.lastSuccess||null});}
  }
  const failed=families.filter(f=>f.status==='offline');
  error=failed.length?failed.map(f=>`${f.label}: ${f.error}`).join('; '):null;
  cache={papers:[...merged.values()].sort((a,b)=>new Date(b.published)-new Date(a.published)).slice(0,MAX_RETAINED),lastSuccess:failed.length===families.length?cache.lastSuccess:new Date().toISOString(),families};
  try{await writeFile(new URL('./data/cache.json',import.meta.url),JSON.stringify(cache));}catch{error=[error,'Could not persist cache to disk'].filter(Boolean).join('; ');}
 })().finally(()=>{pending=null});return pending;
}

export function paperSnapshot(){return {...cache,refreshing:!!pending,status:error?(cache.papers.length?'stale':'offline'):cache.papers.length?'connected':'loading',error,nextRefresh:new Date(lastAttempt+300000).toISOString(),coverage,pollInterval:300000};}
