export const STATIC_SITE=import.meta.env.VITE_STATIC_DATA==='true';
let snapshotPromise,snapshotTime=0;
export async function apiFetch(path){
 if(!STATIC_SITE)return fetch(path);
 if(!snapshotPromise||Date.now()-snapshotTime>60000){snapshotTime=Date.now();snapshotPromise=fetch(import.meta.env.BASE_URL+'data.json?t='+Math.floor(Date.now()/60000),{cache:'no-cache'}).then(async r=>{if(!r.ok)throw Error('Published feed data is unavailable');const data=await r.json();if(data.schemaVersion!==1)throw Error('Unsupported feed snapshot');return data;}).catch(e=>{snapshotPromise=null;throw e;});}
 const data=await snapshotPromise;const key=path.replace('/api/','').split('?')[0];if(!data[key])throw Error('Unknown data source');
 const result={...data[key],snapshotAt:data.generatedAt,updateMode:'scheduled',refreshing:false};
 if(Date.now()-Date.parse(data.generatedAt)>2*3600000){result.status='stale';result.error='Scheduled data is over two hours old. The next successful update will replace it.';}
 return {ok:true,status:200,json:async()=>result};
}
