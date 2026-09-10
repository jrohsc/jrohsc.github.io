import test from 'node:test';
import assert from 'node:assert/strict';
import {classify,parseFeed} from './feed.js';
test('parses real Atom shapes and normalizes paper identity',()=>{const papers=parseFeed('<feed><entry><id>http://arxiv.org/abs/2601.01234v2</id><title>Prompt\n injection &amp; safety</title><summary>Attacks against AI agents.</summary><author><name>A. Researcher</name></author><published>2026-01-01T00:00:00Z</published></entry></feed>');assert.equal(papers[0].id,'2601.01234');assert.equal(papers[0].title,'Prompt injection & safety');assert.deepEqual(papers[0].authors,['A. Researcher']);assert.ok(papers[0].topics.includes('Adversarial robustness'));assert.ok(papers[0].url.startsWith('https:'));});
test('empty feed is empty and malformed feed is rejected',()=>{assert.deepEqual(parseFeed('<feed><title>Empty</title></feed>'),[]);assert.throws(()=>parseFeed('<html>Error</html>'));});
test('multi-label classification retains overlapping topics',()=>{assert.deepEqual(classify('Benchmark for prompt injection and model privacy'),['Adversarial robustness','Evaluation & oversight','Privacy & security']);});
test('classifies safety-adjacent domains with overlapping labels',()=>{
 const cases=[
 ['Multimodal hallucination in vision-language models',['Multimodal & vision','Hallucination & reliability']],
 ['Personalized agents with long-term memory and privacy risks',['Personalization & memory','Agents & tool use','Privacy & security']],
 ['Deepfake detection for voice cloning and synthetic speech',['Deepfakes & provenance','Audio & speech']],
 ['Bias and misinformation in AI persuasion',['Fairness & bias','Misinformation & persuasion']],
 ['Safe control for embodied robots',['Robotics & embodied safety']],
 ['AI companions, emotional dependence and mental health',['Human interaction & wellbeing']],
 ['Data poisoning and benchmark contamination',['Adversarial robustness','Data & model integrity']],
 ];
 for(const [text,expected] of cases)for(const topic of expected)assert.ok(classify(text).includes(topic),`${text} should match ${topic}`);
});
test('query families include requested domains and safety constraints',async()=>{
 const {queryFamilies}=await import('./feed.js');
 assert.equal(queryFamilies.length,6);
 assert.equal(queryFamilies.find(f=>f.id==='cybersecurity').query,'cat:cs.CR');
 const all=queryFamilies.map(f=>f.query).join(' ');
 for(const term of ['multimodal','personalization','hallucination','deepfake','speech','embodied','mental health'])assert.ok(all.includes(`all:"${term}"`),term);
 for(const id of ['modalities','human-agent'])assert.ok(queryFamilies.find(f=>f.id===id).query.includes('all:"safety"'));
});
test('old saved papers receive new topic labels without losing metadata',async()=>{
 const {reclassifyPaper}=await import('./shared/topics.js');
 const paper=reclassifyPaper({id:'test',title:'Deepfake audio detection',abstract:'Voice cloning attacks',topics:['General safety']});
 assert.equal(paper.id,'test');assert.ok(paper.topics.includes('Deepfakes & provenance'));assert.ok(paper.topics.includes('Audio & speech'));
});
