import {normalizeVenue,venueInfo} from './shared/venues.js';
import {assessRelevance} from './shared/relevance.js';
import {classify} from './shared/topics.js';
const clean=s=>String(s||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
export function parseCrossref(data,now=new Date()){
 if(!Array.isArray(data.message?.items))throw Error('Invalid Crossref response');
 return data.message.items.flatMap(w=>{
  if(!w.DOI)return[];
  if(w.type!=='proceedings-article'&&!(w.type==='journal-article'&&/privacy enhancing technologies/i.test((w['container-title']||[]).join(' '))))return[];
  const title=clean(w.title?.[0]),abstract=clean(w.abstract),venueName=clean([w.event?.name,...(w['container-title']||[])].filter(Boolean).join(' · '));
  if(!title||!venueName)return[];
  const dates=w.published?.['date-parts']?.[0]||w.issued?.['date-parts']?.[0];if(!dates?.[0])return[];
  const publication=`${dates[0]}-${String(dates[1]||1).padStart(2,'0')}-${String(dates[2]||1).padStart(2,'0')}`;
  if(!Number.isFinite(Date.parse(publication))||Date.parse(publication)>+now)return[];
  const venue=venueInfo({venueName}).venue;
  if(!assessRelevance({title,abstract,venue,publicationType:'conference'}).included)return[];
  return[normalizeVenue({id:'crossref:'+w.DOI.toLowerCase(),doi:'https://doi.org/'+w.DOI,kind:'paper',source:'Crossref',publicationType:'conference',title,abstract:abstract||'Abstract not provided in the proceedings metadata. Open the DOI link to read the paper.',abstractAvailable:!!abstract,authors:(w.author||[]).map(a=>[a.given,a.family].filter(Boolean).join(' ')).filter(Boolean),groups:[...new Set((w.author||[]).flatMap(a=>(a.affiliation||[]).map(i=>i.name)).filter(Boolean))],groupEvidence:'Author affiliations deposited with Crossref',published:publication+'T00:00:00Z',conferencePublished:publication,conferenceDatePrecision:dates.length>=3?'day':dates.length===2?'month':'year',datePrecision:dates.length>=3?'day':dates.length===2?'month':'year',year:dates[0],venue,venueName,url:'https://doi.org/'+w.DOI,topics:classify(title+' '+abstract),metadataUrl:'https://api.crossref.org/works/'+encodeURIComponent(w.DOI)})];
 });
}
