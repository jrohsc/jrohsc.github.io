import {qualityGate} from './signals.js';
// Admission is separate from topic tagging: a modality or generic benchmark is not evidence of safety relevance.
export const RELEVANCE_VERSION=1;
const AI=/\b(?:AI|LLMs?|VLMs?|ML|RLHF|DPO)\b|artificial intelligence|machine learning|deep learning|neural network|language model|foundation model|generative model|vision.language|diffusion model|reinforcement learning|recommender|autonomous (?:agent|vehicle|driving)|\brobot(?:ic|ics|s)?\b/i;
const AI_VENUES=new Set(['NeurIPS','ICLR','ICML','ACL','EMNLP','NAACL','CVPR','ICCV','ECCV','COLM','AAAI','IJCAI']);
const AI_CATEGORY=/^(?:cs\.(?:AI|LG|CL|CV|SD|RO)|stat\.ML|eess\.(?:AS|IV))$/;
const SECURITY_VENUES=new Set(['USENIX Security','CCS','NDSS','IEEE S&P']);
const cyber=[
 ['Cyber threats',/cyber(?:security|[ -]?(?:attack|threat|defen[cs]e|security))|malware|ransomware|phishing|botnet|rootkit|intrusion detection|digital forensics|threat intelligence/i],
 ['Software / network security',/(?:network|software|application|web|cloud|container|hardware|firmware|API|information|computer|IoT|industrial|system|systems) security|vulnerability (?:detection|discovery|analysis|exploit)|remote code execution|privilege escalation|buffer overflow|use.after.free|SQL injection|cross.site scripting|denial.of.service|side.channel attack|container escape|memory corruption|fuzzing|endpoint protection|steganograph|privacy computing|privacy.computing/i],
 ['Cryptography / privacy',/cryptograph|cryptanaly|homomorphic encryption|zero.knowledge proof|secure multiparty|secure multi.party|differential privacy|membership inference|model extraction|model stealing|data exfiltration|secure aggregation|privacy.preserving/i],
];
const direct=[
 ['Adversarial attacks / misuse',/jailbreak|prompt injection|adversarial (?:attack|example|robustness|perturbation|defen[cs]e)|backdoor attack|data poisoning|model poisoning|training.data poisoning|cross.modal attack|multimodal attack|red.teaming|model misuse|AI misuse|harmful (?:content|request|output)|unsafe (?:content|output|model)|refusal behavior|content moderation|moderate online content/i],
 ['Alignment / control',/misalignment|reward hacking|specification gaming|sycophancy|scheming|alignment faking|(?:human|value|preference|safety|ethical|behavioral|AI|LLM|language model|multimodal|vision.language|omni model)[ -]alignment|aligning (?:AI|LLM|language model|multimodal)|constitutional AI|reinforcement learning from human feedback|\bRLHF\b|direct preference optimization|scalable oversight|AI control|AI deception/i],
 ['Hallucination / authenticity',/hallucinat|factuality|factual (?:consistency|accuracy)|deep[ -]?fake|voice clon|synthetic media (?:detect|authentic)|content provenance|AI.generated (?:text|image|video|audio) detection|audio spoof|speech spoof|synthetic speech|audio watermark|voice authentication|multimodal hallucination|visual jailbreak|image jailbreak|video jailbreak|misinformation|disinformation/i],
 ['Fairness / human harm',/fairness|demographic (?:bias|disparit)|gender bias|racial bias|social bias|algorithmic bias|representational harm|stereotyp|hate speech|toxic(?:ity| content)|automation bias|over.reliance|emotional dependen|child safety/i],
 ['Privacy / interpretability',/machine unlearning|model unlearning|mechanistic interpretability|sparse autoencoder|training.data (?:leak|contamin)|benchmark contamination|model inversion|privacy (?:leak|attack|risk|protect)|memorization (?:risk|attack)|model interpretability/i],
];
const adjacent=[
 ['Safety / security',/\b(?:safety|safe|security|secure|privacy|safeguard|trustworthy)\b/i],
 ['Robustness / reliability',/robustness|out.of.distribution|distribution shift|uncertainty|calibrat|\babstention\b|reliability|faithfulness|watermark|audio security|speech security|audio adversarial|speech agent|audio language model|speech language model|full duplex|omni model|multimodal safety|multimodal security|vision.language safety|vision.language security/i],
 ['Interpretability / governance',/interpretability|interpretable|explainability|responsible AI|AI governance|AI regulation|AI risk|catastrophic risk|existential risk|alignment|human feedback/i],
];
const unrelatedSecurity=/\b(?:food|water|energy|job|employment|social|financial|economic|livelihood) security\b/gi;
export function assessRelevance(p){
 if(p.kind==='blog')return {included:true,reasons:['Lab blog'],version:RELEVANCE_VERSION};
 if(p.categories?.includes('cs.CR'))return {included:true,reasons:['arXiv cs.CR (cryptography and security)'],version:RELEVANCE_VERSION};
 if(p.publicationType==='conference'&&SECURITY_VENUES.has(p.venue))return {included:true,reasons:['Security conference: '+p.venue],version:RELEVANCE_VERSION};
 const title=String(p.title||'').replace(unrelatedSecurity,''),abstract=String(p.abstractAvailable===false?'':p.abstract||'').replace(unrelatedSecurity,''),text=title+' '+abstract;
 const reasons=cyber.filter(([,r])=>r.test(text)).map(([label])=>label);
 const ai=AI.test(text)||AI_VENUES.has(p.venue)||p.categories?.some(c=>AI_CATEGORY.test(c));
 if(/jailbreak|prompt injection|adversarial (?:defen[cs]e|robustness|attack)|machine unlearning|LLM|language model/i.test(title))reasons.push(...direct.filter(([,r])=>r.test(title)).map(([label])=>label));
 if(ai){reasons.push(...direct.filter(([,r])=>r.test(text)).map(([label])=>label));
 const focusedTitle=title.replace(/(?:distribution|feature|spatial|temporal|representation|cross.modal|image.text|vision.language) alignment/gi,'');
 const titleSignals=adjacent.filter(([,r])=>r.test(focusedTitle));reasons.push(...titleSignals.map(([label])=>label));
 const abstractSignals=adjacent.filter(([,r])=>r.test(abstract));if(abstractSignals.length>=2)reasons.push(...abstractSignals.map(([label])=>label));
 }
 return {included:reasons.length>0,reasons:[...new Set(reasons)],version:RELEVANCE_VERSION};
}
export function filterRelevantPapers(papers){return papers.flatMap(p=>{const relevance=assessRelevance(p);const quality=p.source==='arXiv'?qualityGate(p):{ok:true};return relevance.included&&quality.ok?[{...p,relevance}]:[];});}
