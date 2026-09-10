import test from 'node:test';import assert from 'node:assert/strict';
import {analyzeLandscape} from './shared/landscape.js';import {mergeResearch,matchesType} from './shared/research.js';import {decodeAbstract,parseConferenceWorks} from './conferences.js';import {parseCrossref} from './crossref.js';
const now=Date.parse('2026-09-10T16:00:00Z');
const paper=(id,date,topics=['Alignment'])=>({id,title:id,authors:['A. Researcher'],abstract:'test',topics,kind:'paper',source:'arXiv',published:date});
test('trend windows exclude today and compare shares with minimum sample thresholds',()=>{
 const items=[...Array.from({length:20},(_,i)=>paper('a'+i,'2026-09-09',i<10?['Alignment']:[])),...Array.from({length:40},(_,i)=>paper('b'+i,'2026-08-30',i<10?['Alignment']:[])),paper('today','2026-09-10'),{...paper('news','2026-09-09'),kind:'news'}];
 const m=analyzeLandscape(items,{days:7,now});assert.equal(m.recent.length,20);assert.equal(m.previous.length,40);assert.equal(m.rows.find(r=>r.name==='Alignment').delta,25);assert.equal(analyzeLandscape([items[0]],{days:7,now}).rows[1].delta,null);
});
test('weekly bins handle RSS dates, exclude coarse dates and compute intersections',()=>{
 const items=Array.from({length:3},(_,i)=>({...paper('a'+i,'Wed, 09 Sep 2026 12:00:00 GMT',['Alignment','Privacy & security']),kind:'news'}));items.push({...items[0],id:'coarse',datePrecision:'month'});
 const m=analyzeLandscape(items,{kind:'operations',now});assert.equal(m.recent.length,3);assert.equal(m.rows[1].weekly[7],3);assert.equal(m.pairs[0].jaccard,1);
});
test('preprint/proceedings duplicates keep a single identity and earliest research date',()=>{
 const pre=paper('2601.01234','2026-01-01');pre.title='A Study of Safety';
 const conf={...pre,id:'oa:1',source:'OpenAlex',arxivId:'2601.01234',published:'2026-07-01',conferencePublished:'2026-07-01',publicationType:'conference',venue:'ICML',url:'https://doi.org/10.test/one'};
 const merged=mergeResearch([pre],[conf]);assert.equal(merged.length,1);assert.equal(merged[0].venue,'ICML');assert.equal(merged[0].published,'2026-01-01T00:00:00.000Z');assert.equal(merged[0].id,'2601.01234');assert.ok(matchesType(merged[0],'conference'));assert.ok(!matchesType(merged[0],'preprint'));
});
test('conference parsing requires venue evidence and rejects future or retracted records',()=>{
 const w={id:'https://openalex.org/W1',title:'Adversarial safety',publication_date:'2026-01-02',publication_year:2026,primary_location:{source:{id:'https://openalex.org/S4306419644',display_name:'ICML'},landing_page_url:'https://example.org/paper'},authorships:[]};
 assert.equal(parseConferenceWorks({results:[w,{...w,is_retracted:true},{...w,publication_date:'2027-01-01'},{...w,primary_location:null}]},new Date(now)).length,1);assert.equal(decodeAbstract({Safety:[0],research:[1]}),'Safety research');
});
test('Crossref only labels proceedings with venue metadata; preserves date precision',()=>{
 const w={type:'proceedings-article',DOI:'10.1/test',title:['Hallucination detection'],event:{name:'Empirical Methods in Natural Language Processing'},published:{'date-parts':[[2026,1]]},author:[{given:'A',family:'Researcher'}]};const rows=parseCrossref({message:{items:[w,{...w,type:'journal-article'},{...w,event:{},'container-title':[]}]}});assert.equal(rows.length,1);assert.equal(rows[0].venue,'EMNLP');assert.equal(rows[0].datePrecision,'month');
});
