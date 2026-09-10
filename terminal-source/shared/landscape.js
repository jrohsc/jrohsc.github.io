import {TOPIC_DEFINITIONS} from './topics.js';
const DAY=86400000;
export const FORESTS=[
 {name:'Alignment & understanding',color:'#f4db38',topics:[0,1,2,3,9]},
 {name:'Models, media & agents',color:'#59d9df',topics:[6,7,8,10,11,15]},
 {name:'People, society & harm',color:'#f0a8ff',topics:[5,12,13,14,16]},
 {name:'Privacy & system integrity',color:'#39e68a',topics:[4,17,22,23,26]},
 {name:'Cyber threats & infrastructure',color:'#ff987d',topics:[18,19,20,21,24,25,27]},
];
export function analyzeLandscape(items,{days=14,now=Date.now(),kind='research'}={}){
 const end=Math.floor(now/DAY)*DAY,start=end-days*DAY,priorStart=start-days*DAY;
 const sample=items.filter(p=>(!p.datePrecision||p.datePrecision==='day')).filter(p=>kind==='research'?(p.kind||'paper')==='paper':p.kind==='news'||p.kind==='vulnerability');
 const recent=sample.filter(p=>Date.parse(p.published)>=start&&Date.parse(p.published)<end);
 const previous=sample.filter(p=>Date.parse(p.published)>=priorStart&&Date.parse(p.published)<start);
 const weeks=Array.from({length:8},(_,i)=>({start:end-(8-i)*7*DAY,end:end-(7-i)*7*DAY}));
 const rows=TOPIC_DEFINITIONS.map(t=>{
  const current=recent.filter(p=>p.topics.includes(t.name)),prior=previous.filter(p=>p.topics.includes(t.name));
  const comparable=recent.length>=20&&previous.length>=20&&current.length+prior.length>=5;
  return{...t,current:current.length,prior:prior.length,share:recent.length?current.length/recent.length*100:0,delta:comparable?(current.length/recent.length-prior.length/previous.length)*100:null,weekly:weeks.map(w=>sample.filter(p=>p.topics.includes(t.name)&&Date.parse(p.published)>=w.start&&Date.parse(p.published)<w.end).length)};
 });
 const pairs=[];for(let a=0;a<rows.length;a++)for(let b=a+1;b<rows.length;b++){const shared=recent.filter(p=>p.topics.includes(rows[a].name)&&p.topics.includes(rows[b].name));if(shared.length>=3)pairs.push({a:rows[a].name,b:rows[b].name,count:shared.length,jaccard:shared.length/(rows[a].current+rows[b].current-shared.length)});}
 return{rows,recent,previous,sample,pairs:pairs.sort((a,b)=>b.jaccard-a.jaccard||b.count-a.count),weeks,start,end,priorStart,days};
}
