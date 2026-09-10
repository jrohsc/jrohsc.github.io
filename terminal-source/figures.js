import {load} from 'cheerio';
import {readFile,writeFile} from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';
const file=new URL('./data/figures-cache.json',import.meta.url);let cache={version:1,records:{},status:'idle'};
try{cache=JSON.parse(await readFile(file,'utf8'));}catch{}
const norm=s=>String(s||'').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
export function parsePaperFigures(html,p,url){
 const $=load(html),title=$('meta[name="citation_title"]').attr('content')||$('.ltx_title_document').first().text();if(!title||norm(title)!==norm(p.title))return[];
 const figures=[];$('.ltx_figure').each((i,e)=>{const caption=$(e).find('figcaption,.ltx_caption').first().text().replace(/\s+/g,' ').trim();if(!caption)return;const src=$(e).find('img').first().attr('src');if(!src)return;try{const image=new URL(src,url);if(image.protocol!=='https:'||image.hostname!=='arxiv.org')return;figures.push({url:image.href,caption:caption.slice(0,450),sourceUrl:url,label:caption.match(/^Figure\s*\d+/i)?.[0]||'Paper figure',diagram:/overview|architecture|framework|pipeline|illustrat|schematic/i.test(caption)});}catch{}});
 return figures.sort((a,b)=>Number(b.diagram)-Number(a.diagram)).slice(0,2);
}
export async function enrichFigures(papers,{limit=18}={}){
 const candidates=papers.filter(p=>{const id=p.arxivId||(p.source==='arXiv'?p.id:null),old=cache.records[p.id];return id&&/^\d{4}\.\d{4,5}(v\d+)?$/.test(id)&&(!old||(!old.figures?.length&&Date.now()-Date.parse(old.checkedAt)>7*86400000));}).slice(0,limit);
 for(let i=0;i<candidates.length;i+=3){if(i)await delay(1000);await Promise.all(candidates.slice(i,i+3).map(async p=>{const url='https://arxiv.org/html/'+(p.arxivId||p.id);try{const r=await fetch(url,{signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error('Figure source unavailable');cache.records[p.id]={figures:parsePaperFigures(await r.text(),p,url),checkedAt:new Date().toISOString()};}catch{cache.records[p.id]={figures:[],checkedAt:new Date().toISOString(),status:'unavailable'};}}));}
 cache.status='connected';try{await writeFile(file,JSON.stringify(cache));}catch{}return cache;
}
export function figureCache(){return cache;}
