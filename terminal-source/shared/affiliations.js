// Preserve supplied names; only collapse punctuation/spacing and spelling duplicates.
export function normalizeGroups(values=[]){
 const found=new Map();
 for(const value of values){const name=String(value||'').replace(/\s+/g,' ').trim();if(name.length<3||name.length>350||!/[\p{L}]{2}/u.test(name))continue;
 const key=name.toLowerCase().normalize('NFKD').replace(/\bcentre\b/g,'center').replace(/[^\p{L}\p{N}]/gu,'');if(!found.has(key))found.set(key,name);}
 return [...found.values()];
}
export function withAffiliations(p,record){
 const direct=record?.groups?.length&&record.groupOrigin==='paper';
 const groups=normalizeGroups(direct?record.groups:[...(p.groups||[]),...(record?.groups||[])]);
 return {...p,groups,groupEvidence:direct?record.groupEvidence:[p.groupEvidence,record?.groups?.length?record.groupEvidence:null].filter(Boolean).join('; '),groupMetadataUrl:direct?record.groupMetadataUrl:record?.groupMetadataUrl||p.groupMetadataUrl||p.metadataUrl||p.url,groupStatus:groups.length?'available':record?.groupStatus||'unchecked',groupOrigin:direct?'paper':p.groupOrigin||record?.groupOrigin||'index'};
}
export function affiliationLabel(p){return p.groups?.length?p.groups.join(' · '):p.groupStatus==='checking'?'Checking paper affiliations…':p.groupStatus==='unavailable'?'Not recoverable automatically · check paper':p.groupStatus==='error'?'Lookup delayed · check paper':'Affiliation pending · check paper';}
