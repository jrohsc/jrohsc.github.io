import {filterRelevantPapers} from './shared/relevance.js';
import { XMLParser } from 'fast-xml-parser';
import {classify} from './shared/topics.js';
export {classify} from './shared/topics.js';
export function parseFeed(xml) {
 const feed = new XMLParser({ignoreAttributes:false}).parse(xml).feed;
 if (!feed || feed.entry?.id?.includes('/errors')) throw new Error('Invalid arXiv response');
 return filterRelevantPapers([feed.entry ?? []].flat().map(e=>({id:String(e.id).split('/abs/')[1]?.replace(/v\d+$/,'') || e.id,title:String(e.title).replace(/\s+/g,' ').trim(),abstract:String(e.summary).replace(/\s+/g,' ').trim(),authors:[e.author??[]].flat().map(a=>a.name),groups:[...new Set([e.author??[]].flat().flatMap(a=>[a['arxiv:affiliation']??[]].flat()).map(a=>typeof a==='string'?a:a?.['#text']).filter(Boolean))],groupEvidence:'Author affiliations supplied to arXiv',published:e.published,updated:e.updated,url:String(e.id).replace('http:','https:'),source:'arXiv',kind:'paper',categories:[e.category??[]].flat().map(c=>c['@_term']).filter(Boolean),topics:classify(`${e.title} ${e.summary}`)})));
}
// Separate query families prevent one high-volume topic taking every result slot.
const any = terms => '(' + terms.map(t => `all:"${t}"`).join(' OR ') + ')';
const aiContext = '(cat:cs.AI OR cat:cs.LG OR cat:cs.CL OR cat:cs.CR OR cat:cs.CV OR cat:cs.SD OR cat:cs.RO OR cat:cs.HC OR cat:cs.CY OR cat:cs.SI OR cat:eess.AS OR cat:eess.IV OR cat:stat.ML OR ' + any(['artificial intelligence','machine learning','language model','generative AI','neural network','deep learning']) + ')';
const safetyContext = any(['safety','security','privacy','robustness','adversarial','attack','risk','alignment','trustworthy','harmful','bias','fairness','hallucination','misuse','manipulation','reliability','unlearning']);
export const queryFamilies = [
 {id:'core',label:'Core safety & security',query:aiContext+' AND '+any(['AI safety','AI security','language model alignment','jailbreak','prompt injection','mechanistic interpretability','adversarial robustness','machine unlearning','reward hacking','AI governance','backdoor attack','model privacy','model extraction','data poisoning','training data contamination','benchmark contamination'])},
 {id:'reliability',label:'Reliability, authenticity & harm',query:aiContext+' AND '+any(['hallucination','factuality','faithfulness','deepfake','deep fake','synthetic media','voice cloning','watermarking','content provenance','misinformation','disinformation','AI persuasion','content moderation','AI fairness','language model bias','AI misuse','biosecurity','uncertainty calibration','out of distribution','abstention'])},
 {id:'modalities',label:'Multimodal, audio & embodied AI',query:any(['multimodal','multi-modal','vision language','visual language','text to image','text to video','image generation','video generation','diffusion model','speech','audio','voice','robotics','embodied','autonomous driving','safe reinforcement learning'])+' AND '+safetyContext},
 {id:'audio-safety',label:'Audio deepfakes, speech agents & full duplex',query:any(['audio deepfake','audio spoofing','voice cloning','synthetic speech','speech deepfake','audio watermark','audio authentication','audio security','speech security','audio adversarial','audio jailbreak','speech language model','audio language model','speech agent','voice assistant','full duplex'])+' AND '+any(['safety','security','privacy','risk','robustness','detection','authentication','alignment','harm','attack','evaluation'])},
 {id:'multimodal-safety',label:'Multimodal alignment, omni models & cross-modal attacks',query:any(['multimodal safety','multimodal alignment','vision language safety','vision language alignment','omni model safety','omni-modal','image jailbreak','visual jailbreak','video jailbreak','cross-modal attack','cross modal attack','multimodal hallucination','visual instruction safety','image safety','video safety','multimodal privacy','modality gap'])+' AND '+any(['safety','security','privacy','risk','robustness','alignment','attack','jailbreak','harm','evaluation','hallucination'])},
 {id:'human-agent',label:'Personalization, agents & human impact',query:any(['personalization','personalized','personalisation','agent memory','AI agent','agentic','AI companion','recommender','mental health','long term memory'])+' AND '+any(['safety','security','privacy','risk','alignment','fairness'])},
 {id:'cybersecurity',label:'General cybersecurity & cryptography',query:'cat:cs.CR'},
 {id:'cyber-threats',label:'Malware, networks & vulnerabilities',query:any(['malware','ransomware','network security','intrusion detection','vulnerability detection','software security','cloud security','phishing','industrial security','supply chain attack'])},
];
export const RESULTS_PER_QUERY=200;
export const MAX_RETAINED=5000;
export const coverage=`${queryFamilies.length} query families, up to ${RESULTS_PER_QUERY} newest matches each per sync; up to ${MAX_RETAINED.toLocaleString('en-US')} retained. Broad AI safety and general cybersecurity arXiv coverage, not exhaustive.`;
