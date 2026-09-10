import {filterRelevantPapers} from '../shared/relevance.js';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=new URL('../',import.meta.url),refresh=process.argv.includes('--refresh');
const output=resolve(process.argv.find(a=>a.startsWith('--output='))?.slice(9)||'dist/data.json');
await mkdir(new URL('data/',root),{recursive:true});
async function seed(snapshot){if(snapshot?.schemaVersion!==1)throw Error('Invalid seed snapshot');for(const [name,key] of [['cache.json','papers'],['conference-cache.json','conferences'],['blog-cache.json','blogs'],['affiliations-cache.json','affiliations'],['figures-cache.json','figures']])if(snapshot[key])await writeFile(new URL('data/'+name,root),JSON.stringify(snapshot[key]));}
const seedPath=process.argv.find(a=>a.startsWith('--seed='))?.slice(7);if(seedPath)await seed(JSON.parse(await readFile(seedPath,'utf8')));
if(refresh){try{const r=await fetch('https://jrohsc.github.io/ai-safety-monitor/data.json?sync='+Date.now(),{signal:AbortSignal.timeout(15000)});if(r.ok){await seed(await r.json());console.log('Loaded last published snapshot for continuity.');}}catch{console.log('Published snapshot unavailable; using existing seed.');}}
const {refreshPapers,paperSnapshot}=await import('../papers.js');
const {getConferences}=await import('../conferences.js');
const {refreshBlogs,blogSnapshot}=await import('../blogs.js');
const {enrichFigures,figureCache}=await import('../figures.js');
const {enrichAffiliations,affiliationCache}=await import('../affiliations.js');
let conferences;
if(refresh){const results=await Promise.allSettled([refreshPapers(),getConferences(),refreshBlogs()]);for(const [i,r] of results.entries())if(r.status==='rejected')console.log(`Source group ${i} failed: ${r.reason?.message}`);conferences=results[1].status==='fulfilled'?results[1].value:JSON.parse(await readFile(new URL('data/conference-cache.json',root),'utf8'));await Promise.all([enrichAffiliations(paperSnapshot().papers,{limit:18}),enrichFigures(paperSnapshot().papers,{limit:18})]);}
else conferences=JSON.parse(await readFile(new URL('data/conference-cache.json',root),'utf8'));
conferences={...conferences,papers:filterRelevantPapers(conferences.papers)};
const snapshot={schemaVersion:1,generatedAt:new Date().toISOString(),updateMode:'scheduled',scheduleMinutes:15,papers:{...paperSnapshot(),refreshing:false},conferences,blogs:{...blogSnapshot(),refreshing:false},affiliations:{...affiliationCache(),refreshing:false},figures:figureCache()};
if(!snapshot.papers.papers.length||!snapshot.blogs.items.length)throw Error('Refusing to publish an empty research or blog snapshot');
await mkdir(resolve(output,'..'),{recursive:true});await writeFile(output,JSON.stringify(snapshot));
console.log(JSON.stringify({output,papers:snapshot.papers.papers.length,conferences:conferences.papers.length,blogs:snapshot.blogs.items.length,affiliations:Object.values(snapshot.affiliations.records).filter(r=>r.groups?.length).length,generatedAt:snapshot.generatedAt}));
