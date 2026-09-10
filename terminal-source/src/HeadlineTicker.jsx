import React, {useEffect, useMemo, useRef, useState} from 'react';
import {STATIC_SITE} from './data-client.js';
import {Pause, Play} from 'lucide-react';

export default function HeadlineTicker({papers, social, status, onOpen}) {
  const [paused, setPaused] = useState(false);
  const [width, setWidth] = useState(1600);
  const group = useRef(null);
  const headlines = useMemo(() => [
    ...[...papers.filter(p=>(p.kind||'paper')==='paper').slice(0,6),...papers.filter(p=>p.kind==='blog').slice(0,6)].map(p => ({key:p.id, title:p.title, date:p.published, source:p.source.toUpperCase(), paper:p})),
    ...(social.items || []).slice(0, 2).map((p,i) => ({key:`social-${i}-${p.url}`, title:p.title, date:p.date, source:'SOCIAL', url:p.url})),
  ].sort((a,b) => (Date.parse(b.date)||0) - (Date.parse(a.date)||0)).slice(0, 16), [papers, social.items]);

  useEffect(() => {
    if (!group.current) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(group.current);
    return () => observer.disconnect();
  }, [headlines]);

  function renderHeadline(item, duplicate) {
    const date = Date.parse(item.date);
    const content = <><span className="headline-source">{item.source}</span><time>{Number.isFinite(date) ? new Date(date).toLocaleDateString('en-US',{month:'short',day:'2-digit',timeZone:'UTC'}).toUpperCase() : 'UNDATED'}</time><span className="headline-title">{item.title}</span><span className="headline-separator" aria-hidden="true">◆</span></>;
    return item.paper
      ? <button key={item.key} tabIndex={duplicate ? -1 : 0} onClick={() => onOpen(item.paper)}>{content}</button>
      : <a key={item.key} tabIndex={duplicate ? -1 : 0} href={item.url} target="_blank" rel="noreferrer">{content}</a>;
  }

  return <section className={`headline-ticker${paused ? ' is-paused' : ''}`} aria-label="Latest research headlines">
    <div className="headline-label"><span>LATEST WIRE</span><small>{status === 'connected' ? (STATIC_SITE?'SCHEDULED':'5 MIN UPDATES') : status === 'loading' ? 'CONNECTING' : 'CHECK SOURCES'}</small></div>
    <div className="headline-viewport">
      {headlines.length ? <div className="headline-track" style={{'--ticker-duration':`${Math.max(30,width / 65)}s`}}>
        <div className="headline-group" ref={group}>{headlines.map(item => renderHeadline(item,false))}</div>
        <div className="headline-group headline-copy" aria-hidden="true">{headlines.map(item => renderHeadline(item,true))}</div>
      </div> : <span className="headline-waiting">{status === 'loading' ? 'Connecting to the research wire…' : 'No headlines available · check source connection'}</span>}
    </div>
    <button className="headline-pause" onClick={() => setPaused(p => !p)} aria-label={paused ? 'Resume headline ticker' : 'Pause headline ticker'} aria-pressed={paused} disabled={!headlines.length} title={paused ? 'Resume scrolling' : 'Pause scrolling'}>{paused ? <Play size={13}/> : <Pause size={13}/>}</button>
  </section>;
}
