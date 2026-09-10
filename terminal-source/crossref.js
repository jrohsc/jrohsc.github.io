import {assessRelevance} from './shared/relevance.js';
import {classify} from './shared/topics.js';
const clean=s=>String(s||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
export function parseCrossref(data,now=new Date()){
 if(!Array.isArray(data.message?.items))throw Error('Invalid Crossref response');
 return data.message.items.flatMap(w=>{
  if(w.type!=='proceedings-article'||!w.DOI)return[];
  const title=clean(w.title?.[0]),abstract=clean(w.abstract),venueName=clean(w.event?.name||w['container-title']?.[0]);
  if(!title||!venueName)return[];
  const dates=w.published?.['date-parts']?.[0]||w.issued?.['date-parts']?.[0];if(!dates?.[0])return[];
  const publication=`${dates[0]}-${String(dates[1]||1).padStart(2,'0')}-${String(dates[2]||1).padStart(2,'0')}`;
  if(!Number.isFinite(Date.parse(publication))||Date.parse(publication)>+now)return[];
  const aliases=[[/neural information processing/i,'NeurIPS'],[/international conference on machine learning/i,'ICML'],[/learning representations/i,'ICLR'],[/empirical methods in natural language/i,'EMNLP'],[/north american.*computational linguistics/i,'NAACL'],[/association for computational linguistics/i,'ACL'],[/computer vision and pattern recognition/i,'CVPR'],[/international conference on computer vision/i,'ICCV'],[/european conference on computer vision/i,'ECCV'],[/computer and communications security/i,'CCS'],[/network and distributed system security/i,'NDSS'],[/usenix.*security/i,'USENIX Security'],[/symposium on security and privacy/i,'IEEE S&P']];
  const venue=aliases.find(([r])=>r.test(venueName))?.[1]||venueName;
  if(!assessRelevance({title,abstract,venue,publicationType:'conference'}).included)return[];
  return[{id:'crossref:'+w.DOI.toLowerCase(),doi:'https://doi.org/'+w.DOI,kind:'paper',source:'Crossref',publicationType:'conference',title,abstract:abstract||'Abstract not provided in the proceedings metadata. Open the DOI link to read the paper.',abstractAvailable:!!abstract,authors:(w.author||[]).map(a=>[a.given,a.family].filter(Boolean).join(' ')).filter(Boolean),groups:[...new Set((w.author||[]).flatMap(a=>(a.affiliation||[]).map(i=>i.name)).filter(Boolean))],groupEvidence:'Author affiliations deposited with Crossref',published:publication+'T00:00:00Z',conferencePublished:publication,datePrecision:dates.length>=3?'day':dates.length===2?'month':'year',year:dates[0],venue,venueName,url:'https://doi.org/'+w.DOI,topics:classify(title+' '+abstract),metadataUrl:'https://api.crossref.org/works/'+encodeURIComponent(w.DOI)}];
 });
}
