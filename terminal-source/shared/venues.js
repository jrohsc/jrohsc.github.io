// Editorial coverage groups, not an inferred ranking or acceptance claim.
export const CURATED_VENUES = [
 ['IEEE S&P','Security / privacy','IEEE Symposium on Security and Privacy'],
 ['USENIX Security','Security / privacy','USENIX Security Symposium'],
 ['CCS','Security / privacy','Computer and Communications Security'],
 ['NDSS','Security / privacy','Network and Distributed System Security'],
 ['NeurIPS','AI / language','Neural Information Processing Systems'],
 ['ICML','AI / language','International Conference on Machine Learning'],
 ['ICLR','AI / language','International Conference on Learning Representations'],
 ['ACL','AI / language','Annual Meeting of the Association for Computational Linguistics'],
 ['EMNLP','AI / language','Empirical Methods in Natural Language Processing'],
 ['NAACL','AI / language','North American Chapter of the Association for Computational Linguistics'],
 ['COLM','AI / language','Conference on Language Modeling'],
 ['AAAI','AI / language','AAAI Conference on Artificial Intelligence'],
 ['IJCAI','AI / language','International Joint Conference on Artificial Intelligence'],
 ['CVPR','Multimodal / audio','Computer Vision and Pattern Recognition'],
 ['ICCV','Multimodal / audio','International Conference on Computer Vision'],
 ['ECCV','Multimodal / audio','European Conference on Computer Vision'],
 ['ICASSP','Multimodal / audio','Acoustics, Speech and Signal Processing'],
 ['Interspeech','Multimodal / audio','Interspeech'],
 ['SaTML','Specialist','Secure and Trustworthy Machine Learning'],
 ['PETS / PoPETs','Specialist','Privacy Enhancing Technologies'],
 ['FAccT','Specialist','Fairness, Accountability, and Transparency'],
 ['AIES','Specialist','Artificial Intelligence, Ethics, and Society'],
 ['SOUPS','Specialist','Symposium on Usable Privacy and Security'],
 ['ACSAC','Specialist','Annual Computer Security Applications Conference'],
 ['RAID','Specialist','Research in Attacks, Intrusions and Defenses'],
 ['ESORICS','Specialist','European Symposium on Research in Computer Security'],
 ['CSF','Specialist','Computer Security Foundations Symposium'],
];
const key=s=>String(s||'').toLowerCase().replace(/&(?:amp;)?/g,' and ').replace(/[^a-z0-9]+/g,' ').trim();
export function venueInfo(p){
 const names=[p.venueName,p.venueRawName,p.venue].filter(Boolean), combined=names.join(' '), normalized=key(combined);
 // Findings precedes ACL matching; source strings are retained for evidence.
 const found=CURATED_VENUES.filter(([alias,,full])=>names.some(n=>key(n)===key(alias))||normalized.includes(key(full))||new RegExp(`\\b${alias==='PETS / PoPETs'?'(?:pets|popets)':key(alias).replace(/ /g,'\\s+')}\\b`,'i').test(normalized));
 const match=found.find(v=>v[0]==='NAACL')||found.find(v=>v[0]==='EMNLP')||found[0]||(/association for computational linguistics/i.test(combined)?CURATED_VENUES.find(v=>v[0]==='ACL'):null);
 const track=/\bworkshops?\b|\b(?:cvprw|iccvw|eccvw)\b/i.test(combined)?'Workshop':/\bfindings\b/i.test(combined)?'Findings':/\b(demonstrations?|demos?|student research|doctoral|companion|extended abstracts)\b/i.test(combined)?'Other track':match?'Main proceedings':'Track unverified';
 return {venue:match?.[0]||p.venue||p.venueName,venueGroup:match?.[1]||'Other indexed venues',curatedVenue:!!match,conferenceTrack:track};
}
export function normalizeVenue(p){return p.publicationType==='conference'?{...p,...venueInfo(p),conferenceDatePrecision:p.conferenceDatePrecision||p.datePrecision||'day'}:p;}
export function matchesConference(p,scope='curated',track='all'){const info=venueInfo(p);return (scope==='all'||info.curatedVenue)&&(track==='all'||info.conferenceTrack===track);}
export const conferenceDate=p=>p.conferencePublished||p.published;
export function latestConference(a,b){return (Date.parse(conferenceDate(b))||0)-(Date.parse(conferenceDate(a))||0)||String(a.id).localeCompare(String(b.id));}
export function conferenceDateLabel(p){const date=conferenceDate(p),precision=p.conferenceDatePrecision||p.datePrecision;return date?new Date(date).toLocaleDateString('en-US',precision==='year'?{year:'numeric',timeZone:'UTC'}:precision==='month'?{month:'short',year:'numeric',timeZone:'UTC'}:{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'}):'Date unavailable';}
