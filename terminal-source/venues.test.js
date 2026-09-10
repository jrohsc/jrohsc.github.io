import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeVenue,venueInfo,matchesConference,latestConference,conferenceDateLabel,CURATED_VENUES} from './shared/venues.js';
import {mergeResearch} from './shared/research.js';
import {parseCrossref} from './crossref.js';
import {signalScore,qualityGate} from './shared/signals.js';
test('signal ranking rewards citations and verified metadata while rejecting obvious junk',()=>{
 const established={title:'A substantial safety research paper',abstract:'A clear abstract with enough research context.',published:'2026-01-01',citationCount:120,venue:'ACL',authors:['A'],groups:['Research lab'],abstractAvailable:true,relevance:{reasons:['Alignment','Robustness']}};
 const emerging={...established,citationCount:0,venue:undefined,groups:[]};
 assert(signalScore(established)>signalScore(emerging));
 assert.equal(qualityGate({title:'asdf',abstract:'anything'}).ok,false);
 assert.equal(qualityGate({title:'Prompt injection in language models',abstract:''}).ok,true);
});
test('curated venues normalize full names and distinguish tracks',()=>{
 assert.equal(CURATED_VENUES.length,27);
 for(const [alias,,full] of CURATED_VENUES)assert.equal(venueInfo({venueName:full}).venue,alias);
 assert.equal(venueInfo({venueName:'Findings of the Association for Computational Linguistics: EMNLP 2025'}).conferenceTrack,'Findings');
 assert.equal(venueInfo({venueName:'Findings of the Association for Computational Linguistics: NAACL 2025'}).venue,'NAACL');
 assert.equal(venueInfo({venue:'CVPR',venueName:'CVPR Workshops 2025'}).conferenceTrack,'Workshop');
 assert.equal(venueInfo({venueName:'ACL Student Research Workshop'}).conferenceTrack,'Workshop');
 assert.equal(venueInfo({venueName:'Lecture Notes in Computer Science'}).curatedVenue,false);
 assert.equal(matchesConference({venue:'An unrelated conference'}),false);
 assert.equal(matchesConference({venue:'An unrelated conference'},'all'),true);
 assert.equal(matchesConference({venue:'ACL',venueName:'ACL Findings'},'curated','Main proceedings'),false);
});
test('latest proceedings ordering survives preprint merge without changing original research date',()=>{
 const pre={id:'arxiv1',source:'arXiv',title:'Privacy study',authors:['Author'],topics:[],published:'2024-01-01T00:00:00Z'};
 const conf=normalizeVenue({...pre,id:'conf1',source:'Crossref',publicationType:'conference',venue:'ICML',published:'2026-08-01T00:00:00Z',conferencePublished:'2026-08-01',datePrecision:'month'});
 const merged=mergeResearch([pre],[conf])[0];
 assert.equal(Date.parse(merged.published),Date.parse(pre.published));
 assert.equal(merged.conferenceDatePrecision,'month');
 assert.equal(conferenceDateLabel(merged),'Aug 2026');
 const other={id:'other',published:'2026-07-01',conferencePublished:'2026-07-01'};
 assert.equal([other,merged].sort(latestConference)[0].id,merged.id);
});
test('Crossref retains Findings and workshop evidence and supports PoPETs journals',()=>{
 const make=(name,type='proceedings-article')=>({type,DOI:'10.123/example',title:['Privacy attacks on language models'],event:{name:'ACL 2025'},'container-title':[name],published:{'date-parts':[[2025]]}});
 const rows=parseCrossref({message:{items:[make('Findings of the Association for Computational Linguistics'),make('ACL Workshops'),{...make('Proceedings on Privacy Enhancing Technologies','journal-article'),event:undefined}]}});
 assert.equal(rows.length,3);
 assert.deepEqual(rows.map(p=>p.conferenceTrack),['Findings','Workshop','Main proceedings']);
 assert.equal(rows[2].venue,'PETS / PoPETs');
 assert.equal(conferenceDateLabel(rows[0]),'2025');
});
