// A transparent triage score for research discovery. It is a ranking aid, not a quality verdict.
export function qualityGate(p={}){
 const title=String(p.title||'').trim(), abstract=String(p.abstract||'').trim();
 if(title.length<8||title.length>500)return {ok:false,reason:'Malformed title metadata'};
 if(/^(test|asdf|untitled|paper\s*\d*)$/i.test(title)||/buy now|click here|free download/i.test(`${title} ${abstract}`))return {ok:false,reason:'Low-quality metadata signal'};
 return {ok:true};
}
export function signalScore(p,now=Date.now()){
 const citations=Math.max(0,Number(p.citationCount)||0);
 const citationSignal=Math.min(40,Math.log1p(citations)*8);
 const recency=Math.max(0,20-Math.max(0,(now-Date.parse(p.published||0))/86400000)*0.045);
 const evidence=Math.min(25,(p.relevance?.reasons?.length||0)*4)+(p.venue?10:0)+(p.groups?.length?5:0);
 const metadata=Math.min(10,(p.authors?.length?4:0)+(p.abstractAvailable!==false?3:0)+(p.figures?.length?3:0));
 return Math.round(citationSignal+recency+evidence+metadata);
}
export function signalLabel(p){const score=signalScore(p);return score>=65?'High signal':score>=45?'Established':'Emerging';}
