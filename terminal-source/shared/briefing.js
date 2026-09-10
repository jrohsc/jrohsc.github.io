const textKey=s=>String(s||'').toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}]/gu,'');
const doi=s=>String(s||'').toLowerCase().replace(/^https?:\/\/(?:dx\.)?doi\.org\//,'');
export function fingerprint(value){let h=2166136261;for(const c of value){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return (h>>>0).toString(36);}
function identities(p){
 const text=`${p.title||''} ${p.abstract||''} ${p.url||''}`;
 const cves=[...new Set((text.match(/\bCVE-\d{4}-\d{4,}\b/gi)||[]).map(s=>s.toUpperCase()))];
 if(p.cve)return ['cve:'+p.cve.toUpperCase()];
 if(p.kind==='news'&&cves.length===1)return ['cve:'+cves[0]];
 const arxiv=p.arxivId||(p.source==='arXiv'?p.id:null)||text.match(/arxiv\.org\/abs\/(\d{4}\.\d{4,5})/)?.[1];
 const keys=[arxiv&&'arxiv:'+arxiv.replace(/v\d+$/,''),p.doi&&'doi:'+doi(p.doi)];
 if((p.kind||'paper')==='paper'&&p.authors?.[0])keys.push('title:'+textKey(p.title)+':'+textKey(p.authors[0]));
 return keys.filter(Boolean).length?keys.filter(Boolean):['item:'+p.id];
}
export function groupDevelopments(items,watch=[]){
 const groups=[],index=new Map();
 // Papers first: references in a headline can then join a known paper.
 const ordered=[...items].sort((a,b)=>Number((b.kind||'paper')==='paper')-Number((a.kind||'paper')==='paper'));
 for(const p of ordered){
  let keys=identities(p);
  if(p.kind==='news'&&keys[0].startsWith('item:')){
   const headline=textKey(p.title);const match=groups.find(g=>g.members.some(m=>(m.kind||'paper')==='paper'&&textKey(m.title).length>=45&&headline.includes(textKey(m.title))));
   if(match)keys=[match.id];
  }
  const existing=keys.map(k=>index.get(k)).find(g=>g);
  const group=existing||{id:keys[0],members:[]};if(!existing)groups.push(group);
  group.members.push(p);keys.forEach(k=>index.set(k,group));
 }
 return groups.map(g=>{
  const members=[...g.members].sort((a,b)=>Number(!!b.knownExploited)-Number(!!a.knownExploited)||Number((b.kind||'paper')==='paper')-Number((a.kind||'paper')==='paper')||Date.parse(b.published)-Date.parse(a.published));
  const primary=members[0];const combined=members.map(p=>`${p.title} ${p.abstract}`).join(' ').toLowerCase();
  const matches=watch.filter(w=>combined.includes(w.toLowerCase()));
  const signature=fingerprint(JSON.stringify(members.map(p=>[p.id,p.title,p.abstract,p.source,p.venue,p.conferencePublished,p.updated,p.cvss,p.knownExploited,p.action,p.ransomware]).sort((a,b)=>a[0].localeCompare(b[0]))));
  const lastEvent=Math.max(...members.map(p=>Math.max(Date.parse(p.published)||0,Date.parse(p.updated)||0,Date.parse(p.conferencePublished)||0)));
  return {...g,members,primary,signature,lastEvent,topics:[...new Set(members.flatMap(p=>p.topics||[]))],matches,knownExploited:members.some(p=>p.knownExploited),kind:members.some(p=>p.cve||p.kind==='vulnerability')?'security':members.some(p=>(p.kind||'paper')==='paper')?'research':'news'};
 });
}
export function briefState(group,previous){
 const old=previous?.groups?.[group.id];
 return !old?'new':old===group.signature?'unchanged':'updated';
}
export function selectBriefing(groups,{previous,mode='week',now=Date.now(),read={}}={}){
 const cutoff=now-(mode==='day'?86400000:7*86400000);
 return groups.map(g=>({...g,change:briefState(g,previous),read:read[g.id]===g.signature})).filter(g=>g.lastEvent<=now&&(mode==='visit'&&previous?g.change!=='unchanged':g.lastEvent>=cutoff));
}
export function prioritize(groups,limit=3){
 const remaining=[...groups].sort((a,b)=>Number(b.knownExploited)-Number(a.knownExploited)||b.matches.length-a.matches.length||Number(b.change==='updated')-Number(a.change==='updated')||b.lastEvent-a.lastEvent);
 const picked=[];const seen=new Set();
 while(remaining.length&&picked.length<limit){let i=remaining.findIndex(g=>!seen.has(g.topics.find(t=>t!=='Evaluation & oversight'&&t!=='Privacy & security')||g.id));if(i<0)i=0;const g=remaining.splice(i,1)[0];picked.push(g);seen.add(g.topics.find(t=>t!=='Evaluation & oversight'&&t!=='Privacy & security')||g.id);}
 return picked;
}
export function describeDevelopment(g){
 const p=g.primary;
 const watch=g.matches.length?`Matches your watchlist: ${g.matches.join(', ')}.`:'Selected for recency and topic variety.';
 if(g.knownExploited)return{why:'CISA lists this vulnerability as exploited in the wild. Whether it affects you depends on the products and versions you use.',evidence:'Known exploitation · CISA catalog',limit:'This is not evidence that your systems are affected. Check the vendor advisory and your inventory.',excerpt:p.abstract||'See the source record for the vulnerability description.'};
 if(g.kind==='security')return{why:watch+' A vulnerability record can help identify affected software; a score alone does not establish active exploitation.',evidence:p.cvss!=null?`NVD record · CVSS ${p.cvssVersion}: ${p.cvss}`:'Vulnerability record · score may be unavailable',limit:'A newly published CVE is not proof of exploitation. Product applicability has not been checked.',excerpt:p.abstract};
 if(g.kind==='news')return{why:watch,evidence:'Publisher headline · article not analyzed',limit:'Only the publisher headline and metadata are available here; open the original report before drawing conclusions.',excerpt:'Read the publisher’s report for the full account.'};
 const topic=g.topics.find(t=>!['Evaluation & oversight','Governance & risk'].includes(t));
 return{why:watch+(topic?` Relevant area: ${topic}.`:''),evidence:p.venue?`Proceedings metadata · ${p.venue}`:'Preprint / venue unverified',limit:'The excerpt reports the authors’ framing. Results and significance have not been independently verified; source indexing can lag publication.',excerpt:p.abstractAvailable===false||/^(Abstract not |Open the publisher)/.test(p.abstract||'')?'Abstract unavailable. Open the paper to assess its claims.':p.abstract||'Abstract unavailable.'};
}
