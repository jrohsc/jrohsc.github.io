import React,{useState} from 'react';
export default function PaperFigure({paper,expanded=false}){
 const [failed,setFailed]=useState(false),[zoom,setZoom]=useState(false);const figures=paper.figures||[];if(failed||!figures.length)return null;const f=figures[0];
 return <figure className={'paper-figure '+(expanded?'figure-detail':'')+(zoom?' figure-zoom':'')}><button className="figure-image" onClick={()=>setZoom(v=>!v)} aria-label={zoom?'Reduce paper figure':'Enlarge paper figure'} aria-expanded={zoom}><img src={f.url} alt={f.caption} loading="lazy" referrerPolicy="no-referrer" onError={()=>setFailed(true)}/><span>{zoom?'− Reduce':'+ Enlarge'}</span></button><figcaption><strong>{f.label} · from the paper</strong>{expanded&&<p>{f.caption}</p>}<a href={f.sourceUrl} target="_blank" rel="noreferrer">Original figure ↗</a></figcaption></figure>;
}
