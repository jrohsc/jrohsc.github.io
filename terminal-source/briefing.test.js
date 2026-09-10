import test from 'node:test';import assert from 'node:assert/strict';
import {groupDevelopments,selectBriefing,prioritize} from './shared/briefing.js';
import {affiliationMatch} from './affiliations.js';
const now=Date.parse('2026-09-10T12:00:00Z');
const p=(id,title='Paper '+id)=>({id,title,kind:'paper',source:'arXiv',authors:['A. Author'],abstract:'Prompt injection safety',published:'2026-09-09T12:00:00Z',topics:['Adversarial robustness']});
test('visit baseline separates new, updated, unchanged and newly indexed older papers',()=>{
 const original=groupDevelopments([p('1')]);const previous={at:now-86400000,groups:{[original[0].id]:original[0].signature}};
 assert.equal(selectBriefing(original,{previous,mode:'visit',now}).length,0);
 const changed=groupDevelopments([{...p('1'),abstract:'Changed author claims'},p('2'),{...p('3'),published:'2020-01-01'}]);
 const selected=selectBriefing(changed,{previous,mode:'visit',now});assert.equal(selected.length,3);assert.equal(selected.find(g=>g.primary.id==='1').change,'updated');assert.equal(selected.find(g=>g.primary.id==='3').change,'new');
});
test('read status attaches to the specific version; an update becomes unread',()=>{
 const [g]=groupDevelopments([p('1')]);const read={[g.id]:g.signature};assert.equal(selectBriefing([g],{read,now})[0].read,true);
 const [updated]=groupDevelopments([{...p('1'),abstract:'Revised conclusions'}]);assert.equal(selectBriefing([updated],{read,now})[0].read,false);
});
test('explicit paper versions group but similar topics do not',()=>{
 const groups=groupDevelopments([p('2601.01234'),{...p('oa:1'),source:'OpenAlex',arxivId:'2601.01234',publicationType:'conference',venue:'ICML'},p('another')]);assert.equal(groups.length,2);assert.equal(groups[0].members.length,2);
});
test('first visit is bounded to recent papers and excludes future metadata',()=>{
 const groups=groupDevelopments([p('1'),{...p('old'),published:'2020-01-01'},{...p('future'),published:'2028-01-01'}]);assert.equal(selectBriefing(groups,{mode:'week',now}).length,1);
});
test('watchlist matches take precedence over unrelated recent research',()=>{
 const groups=groupDevelopments([{...p('1'),abstract:'Privacy work',topics:['Privacy & security']},{...p('2'),published:'2026-09-08T12:00:00Z'}],['prompt injection']);const picked=prioritize(selectBriefing(groups,{now}),1);assert.equal(picked[0].primary.id,'2');
});
test('affiliation enrichment requires an exact title and first author, including non-Latin names',()=>{
 const source={title:'安全研究',authors:['張三']};assert.equal(affiliationMatch(source,{title:'安全研究',authorships:[{author:{display_name:'李四'}}]}),false);assert.equal(affiliationMatch(source,{title:'安全研究',authorships:[{author:{display_name:'張三'}}]}),true);
});
