import {normalizeGroups} from './affiliations.js';
const normalizedTitle=s=>String(s||'').toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}]/gu,'');
const doiKey=s=>String(s||'').toLowerCase().replace(/^https?:\/\/(?:dx\.)?doi\.org\//,'');
const arxivKey=p=>p.arxivId||(p.source==='arXiv'?p.id.replace(/v\d+$/,''):null);
export function mergeResearch(...collections){
 const rows=[],keys=new Map();
 for(const p of collections.flat()){
  const ids=[p.doi&&`doi:${doiKey(p.doi)}`,arxivKey(p)&&`arxiv:${arxivKey(p)}`,p.authors?.[0]&&`title:${normalizedTitle(p.title)}:${normalizedTitle(p.authors[0])}`].filter(Boolean);
  const found=ids.map(k=>keys.get(k)).find(i=>i!==undefined);
  let idx=found;
  if(idx===undefined){idx=rows.length;rows.push({...p,groups:normalizeGroups(p.groups)});}
  else{
   const old=rows[idx],conf=p.publicationType==='conference'?p:old.publicationType==='conference'?old:null;
   const arxiv=p.source==='arXiv'?p:old.source==='arXiv'?old:null;
   rows[idx]={...old,...(conf||{}),id:old.id,abstract:old.abstract?.length>p.abstract?.length?old.abstract:p.abstract||old.abstract,published:new Date(Math.min(Date.parse(old.published),Date.parse(p.published))).toISOString(),datePrecision:Date.parse(old.published)<=Date.parse(p.published)?old.datePrecision||'day':p.datePrecision||'day',groups:normalizeGroups([...(old.groups||[]),...(p.groups||[])]),groupEvidence:[...new Set([old.groupEvidence,p.groupEvidence].filter(Boolean))].join('; '),topics:[...new Set([...old.topics,...p.topics])],categories:[...new Set([...(old.categories||[]),...(p.categories||[])])],arxivUrl:arxiv?.url||old.arxivUrl,arxivId:arxiv?.id||old.arxivId,pdfUrl:conf?.pdfUrl||old.pdfUrl||p.pdfUrl};
  }
  ids.forEach(k=>keys.set(k,idx));
 }
 return rows.sort((a,b)=>Date.parse(b.published)-Date.parse(a.published));
}
export function matchesType(p,type){return type==='all'||type==='conference'&&p.publicationType==='conference'||type==='preprint'&&(p.kind||'paper')==='paper'&&p.publicationType!=='conference'||(p.kind||'paper')===type;}
