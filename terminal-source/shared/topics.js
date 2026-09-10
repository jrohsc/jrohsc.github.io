// Shared by ingestion, cached-paper migration, and the terminal UI.
export const TOPIC_DEFINITIONS = [
 {name:'Adversarial robustness',code:'ADVR',color:'#ff9b30',pattern:/adversarial|jailbreak|prompt injection|red.team|backdoor|poison/i},
 {name:'Alignment',code:'ALGN',color:'#f4db38',pattern:/alignment|aligning|rlhf|reward hack|constitutional|human feedback|sycophan/i},
 {name:'Interpretability',code:'INTR',color:'#43c8ff',pattern:/interpretability|interpretable|mechanistic|sparse autoencoder|feature attribution|explainab/i},
 {name:'Evaluation & oversight',code:'EVAL',color:'#b997ff',pattern:/evaluat|benchmark|oversight|monitoring|auditing/i},
 {name:'Privacy & security',code:'SECR',color:'#39e68a',pattern:/privacy|security|exfiltrat|membership inference|unlearning|cyber|data leakage|model extraction/i},
 {name:'Governance & risk',code:'GOVR',color:'#ff7171',pattern:/governance|existential|catastrophic|policy|societal|deception|deceptive|regulation|systemic risk/i},
 {name:'Multimodal & vision',code:'MULT',color:'#59d9df',pattern:/multi[ -]?modal|vision.language|visual language|text.to.image|text.to.video|image generation|video generation|diffusion model|image safety|visual (?:attack|safety)/i},
 {name:'Audio & speech',code:'AUDI',color:'#87bfff',pattern:/speech|audio|voice|spoken|full.duplex|speaker verification|text.to.speech/i},
 {name:'Personalization & memory',code:'PERS',color:'#f0a8ff',pattern:/personali[sz]|user profil|user model|long.term memory|agent memory|persistent memory|memory poison|memory safety|recommender|recommendation system/i},
 {name:'Hallucination & reliability',code:'HALL',color:'#ffcc66',pattern:/hallucinat|factuality|factual consistency|factual accuracy|faithfulness|groundedness|confabulation|uncertainty|calibration|abstention|out.of.distribution/i},
 {name:'Deepfakes & provenance',code:'FAKE',color:'#ff8dba',pattern:/deep[ -]?fake|synthetic media|voice clon|face swap|forgery|forgeries|watermark|provenance|content authenticity|ai.generated (?:text|image|video|audio) detection/i},
 {name:'Agents & tool use',code:'AGNT',color:'#74e0a3',pattern:/\bagent(?:s|ic)?\b|tool.use|tool.call|computer.use|browser.use|multi.agent|autonomous system/i},
 {name:'Fairness & bias',code:'BIAS',color:'#dda2ff',pattern:/fairness|\bbias(?:ed|es)?\b|discriminat|stereotyp|demographic|representational harm/i},
 {name:'Harmful content & misuse',code:'HARM',color:'#ff987d',pattern:/harmful|toxicity|toxic content|hate speech|misuse|abuse|content moderation|unsafe content|refusal|disallowed|biosecurity|dual.use/i},
 {name:'Misinformation & persuasion',code:'INFO',color:'#d6d879',pattern:/misinformation|disinformation|persuasi|propaganda|manipulation|social engineering|deceptive content/i},
 {name:'Robotics & embodied safety',code:'ROBO',color:'#7ccfd1',pattern:/robot|embodied|autonomous driving|autonomous vehicle|safe (?:control|reinforcement learning)|collision avoidance|physical safety/i},
 {name:'Human interaction & wellbeing',code:'HUMN',color:'#e2bda4',pattern:/well.?being|mental health|emotional depend|over.?reliance|anthropomorph|human.ai interaction|ai companion|child safety|human autonomy|automation bias/i},
 {name:'Data & model integrity',code:'DATA',color:'#99b8ff',pattern:/data poison|training.data|data contamination|benchmark contamination|supply.chain|model stealing|model extraction|data integrity|dataset (?:quality|bias|security)|model tamper/i},
 {name:'Malware & ransomware',code:'MALW',color:'#ff6262',pattern:/malware|ransomware|trojan|rootkit|spyware|infostealer|botnet|cryptojack|wiper malware/i},
 {name:'Network & infrastructure',code:'NETS',color:'#64caff',pattern:/network security|intrusion|firewall|denial.of.service|\bddos\b|network attack|dns (?:attack|poison|tunnel)|routing security|\bVPN\b|zero.trust/i},
 {name:'Vulnerabilities & CVEs',code:'CVES',color:'#ffb33f',pattern:/vulnerabilit|\bCVE-\d{4}-\d+|zero.day|remote code execution|privilege escalation|buffer overflow|use.after.free/i},
 {name:'Application & software security',code:'APPS',color:'#f7d981',pattern:/application security|software security|web security|sql injection|cross.site|\bXSS\b|\bCSRF\b|\bSSRF\b|fuzzing|secure coding|api security|memory corruption/i},
 {name:'Cloud & container security',code:'CLDS',color:'#adbdff',pattern:/cloud security|container security|kubernetes|container escape|cloud breach|cloud misconfiguration|serverless security/i},
 {name:'Identity & phishing',code:'IDEN',color:'#f8a6d7',pattern:/phishing|credential|authentication|authorization|identity theft|account takeover|password|passkey|multi.factor|social engineering/i},
 {name:'Cryptography & protocols',code:'CRYP',color:'#94e6b2',pattern:/cryptograph|post.quantum|encryption|cryptanaly|zero.knowledge|secure protocol|homomorphic|side.channel|key exchange/i},
 {name:'Threat intelligence & response',code:'THRT',color:'#ef927b',pattern:/threat (?:intel|actor|hunt)|incident response|digital forensic|cyber espionage|cyberattack|cyber.attack|data breach|hacking group|nation.state|security operations|\bAPT\d*/i},
 {name:'Supply chain & dependencies',code:'SUPL',color:'#dbc0ff',pattern:/supply.chain|dependency confusion|typosquat|malicious package|software bill of materials|\bSBOM\b|package security/i},
 {name:'IoT & industrial security',code:'IOTS',color:'#77e3d1',pattern:/iot security|industrial security|industrial control|\bSCADA\b|firmware|embedded security|hardware security|operational technology|smart grid security/i},

];
export function classify(text) {
 const normalized=String(text).replace(/\s+/g,' ');
 const result=TOPIC_DEFINITIONS.filter(t=>t.pattern.test(normalized)).map(t=>t.name);
 return result.length?result:['General safety'];
}
export function reclassifyPaper(paper){return {...paper,topics:[...new Set([...classify(`${paper.title} ${paper.abstract}`),...(paper.knownExploited?['Vulnerabilities & CVEs']:[]),...(paper.ransomware==='Known'?['Malware & ransomware']:[])])].filter(t=>t!=='General safety'||!paper.kind||paper.kind==='paper')}};
