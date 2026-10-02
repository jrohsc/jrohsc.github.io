const holiday = '2026-10-12';
let checking = false;
let lastSignature = '';

function easternDateParts(date) {
  const parts = new Intl.DateTimeFormat('en-US', {timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
  return Object.fromEntries(parts.map(part => [part.type, part.value]));
}
function dateKey(date) { const p = easternDateParts(date); return `${p.year}-${p.month}-${p.day}`; }
function daysBetween(a,b) { return Math.round((Date.UTC(+b.slice(0,4),+b.slice(5,7)-1,+b.slice(8))-Date.UTC(+a.slice(0,4),+a.slice(5,7)-1,+a.slice(8)))/86400000); }
function businessDaysSinceReceipt(now) {
  const today=dateKey(now), start='2026-09-22'; let count=0;
  for(let offset=1;offset<=Math.min(60,Math.max(0,daysBetween(start,today)));offset++) {
    const d=new Date(Date.UTC(2026,8,22+offset)); const key=d.toISOString().slice(0,10);
    if(d.getUTCDay()!==0&&d.getUTCDay()!==6&&key!==holiday) count++;
  }
  return count;
}
function updateClock() {
  const now=new Date(); const days=daysBetween(dateKey(now),'2026-10-12');
  const countdown=document.getElementById('target-countdown');
  countdown.textContent=days>1?`${days} calendar days until planned start`:days===1?'Tomorrow is the planned start':days===0?'Planned start date is today':`${Math.abs(days)} calendar day${Math.abs(days)===1?'':'s'} past planned start`;
  const count=businessDaysSinceReceipt(now);
  document.getElementById('business-day').textContent=`Day ${Math.min(count,15)} of 15`;
  document.getElementById('clock-progress').style.width=`${Math.min(100,count/15*100)}%`;
}
function safeLink(value) { try { const url=new URL(value); return url.protocol==='https:'&&['news.google.com','www.reddit.com','reddit.com'].includes(url.hostname)?url.href:null; } catch{return null;} }
function renderFeed(items) {
  const list=document.getElementById('feed-list'); list.replaceChildren();
  if(!items.length){const empty=document.createElement('p');empty.className='feed-empty';empty.textContent='No recent matching posts appeared in the indexed feed. Check the linked reports above while the feed catches up.';list.append(empty);return;}
  for(const item of items.slice(0,8)) {
    const link=safeLink(item.link); if(!link) continue;
    const a=document.createElement('a');a.className='feed-item';a.href=link;a.target='_blank';a.rel='noopener noreferrer';
    const title=document.createElement('span');title.className='feed-title';title.textContent=item.title.replace(/ - Reddit$/i,'');
    const date=document.createElement('time');date.className='feed-date';date.dateTime=item.date.toISOString();date.textContent=new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',timeZone:'America/New_York'}).format(item.date)+' ↗';
    a.append(title,date);list.append(a);
  }
}
async function checkFeed() {
  if(checking||document.hidden)return; checking=true;
  const state=document.getElementById('feed-state');state.textContent='Checking…';
  try {
    // The proxy permits a static GitHub Pages site to read the public RSS feed.
    const source=location.hostname==='jrohsc.github.io'
      ? 'https://raw.githubusercontent.com/jrohsc/jrohsc.github.io/master/h1b-monitoring/feed.json'
      : 'feed.json';
    const url=source+'?check='+Date.now();
    const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),11000);
    let response;
    try { response=await fetch(url,{signal:controller.signal,cache:'no-store'}); } finally {clearTimeout(timer);}
    if(!response.ok)throw new Error('Feed unavailable');
    const data=await response.json();
    if(!Array.isArray(data.items))throw new Error('Invalid feed');
    const recent=data.items.map(item=>({title:item.title||'',link:item.link||'',date:new Date(item.date||0)})).filter(item=>item.title&&Number.isFinite(item.date.getTime())).sort((a,b)=>b.date-a.date);
    const signature=recent.map(item=>item.link).join('|');
    if(signature!==lastSignature){renderFeed(recent);lastSignature=signature;}
    state.textContent=recent.length?`${recent.length} indexed posts`:'Feed checked';
    document.getElementById('last-check').textContent='Last checked '+new Intl.DateTimeFormat('en-US',{hour:'numeric',minute:'2-digit',second:'2-digit',timeZone:'America/New_York'}).format(new Date())+' ET · source scan may lag';
  } catch {
    state.textContent='Feed temporarily unavailable';
    document.getElementById('last-check').textContent='Showing last available results; try again shortly';
    if(!lastSignature)document.getElementById('feed-list').innerHTML='<p class="feed-empty">Could not load the public-post feed right now. The reported timelines above remain available.</p>';
  } finally {checking=false;}
}
updateClock();setInterval(updateClock,60000);
document.getElementById('refresh-feed').addEventListener('click',checkFeed);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkFeed();});
checkFeed();setInterval(checkFeed,15000);
