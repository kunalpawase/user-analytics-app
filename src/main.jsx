import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

const API = import.meta.env.VITE_API_URL || '/api';
const date = (d) => d ? new Date(d).toLocaleString() : '—';
function App() {
  const [sessions, setSessions] = useState([]), [selected, setSelected] = useState(null), [journey, setJourney] = useState([]), [pages, setPages] = useState([]), [page, setPage] = useState(''), [clicks, setClicks] = useState([]), [tab, setTab] = useState('sessions'), [error, setError] = useState('');
  const request = async (url) => { const r = await fetch(url); if (!r.ok) throw new Error(`API returned ${r.status}`); return r.json(); };
  const refresh = () => Promise.all([request(`${API}/sessions`).then(setSessions), request(`${API}/pages`).then((p) => { setPages(p); if (!page && p.length) setPage(p[0]); })]).catch(() => setError('Could not reach the API. Start MongoDB and the server, then refresh.'));
  useEffect(() => { refresh(); const timer = setInterval(refresh, 10000); return () => clearInterval(timer); }, []);
  useEffect(() => { if (selected) request(`${API}/sessions/${encodeURIComponent(selected)}/events`).then(setJourney).catch(() => setJourney([])); }, [selected]);
  useEffect(() => { if (page) request(`${API}/heatmap?page=${encodeURIComponent(page)}`).then(setClicks).catch(() => setClicks([])); }, [page]);
  const chooseSession = (id) => { setSelected(id); setTab('sessions'); };
  return <main><header><div><span className="eyebrow">CAUSALFUNNEL · PRODUCT ANALYTICS</span><h1>User activity</h1><p>Understand the journeys behind every session.</p></div><button onClick={refresh}>↻ Refresh</button></header>
    <nav><button className={tab === 'sessions' ? 'active' : ''} onClick={() => setTab('sessions')}>Sessions <b>{sessions.length}</b></button><button className={tab === 'heatmap' ? 'active' : ''} onClick={() => setTab('heatmap')}>Click map</button></nav>
    {error && <p className="notice">{error}</p>}
    {tab === 'sessions' ? <section className="layout"><article className="panel"><div className="panel-head"><div><h2>Sessions</h2><p>Most recent activity first</p></div></div><div className="session-list">{sessions.length ? sessions.map(s => <button className={`session ${selected === s.session_id ? 'chosen' : ''}`} key={s.session_id} onClick={() => chooseSession(s.session_id)}><span className="avatar">{s.session_id.slice(0, 2).toUpperCase()}</span><span className="session-info"><strong>{s.session_id.slice(0, 18)}…</strong><small>Last seen {date(s.last_seen)}</small></span><span className="count">{s.event_count} events</span></button>) : <div className="empty">No sessions yet. Open the demo page to generate activity.</div>}</div></article>
      <article className="panel journey"><div className="panel-head"><div><h2>Journey</h2><p>{selected ? `Session ${selected}` : 'Select a session to inspect its events'}</p></div></div>{journey.length ? <div className="timeline">{journey.map((e, i) => <div className="event" key={e._id || i}><i className={e.event_type === 'click' ? 'dot click' : 'dot'}></i><div><strong>{e.event_type.replace('_', ' ')}</strong><small>{date(e.timestamp)} · {e.page_url}</small>{e.event_type === 'click' && <small>Position x {e.x}, y {e.y}</small>}</div></div>)}</div> : <div className="empty">Select a session to see its ordered events.</div>}</article></section> : <section className="panel heat"><div className="panel-head"><div><h2>Click map</h2><p>Click coordinates collected for a page</p></div><select value={page} onChange={e => setPage(e.target.value)}>{pages.map(p => <option key={p} value={p}>{p}</option>)}</select></div>{page ? <div className="map"><div className="map-label">{new URL(page).pathname}</div>{clicks.map((c, i) => <span className="click-dot" key={i} title={`x ${c.x}, y ${c.y}`} style={{ left: `${Math.max(1, Math.min(99, c.x / Math.max(document.documentElement.clientWidth, 1) * 100))}%`, top: `${Math.max(4, Math.min(96, c.y / Math.max(document.documentElement.scrollHeight, 1) * 100))}%` }} />)}{!clicks.length && <div className="empty">No clicks recorded for this page yet.</div>}</div> : <div className="empty">Page URLs will appear after tracking starts.</div>}</section>}
    <footer>Events refresh every 10 seconds <span>·</span> Tracking is active on the demo page</footer>
  </main>;
}
createRoot(document.getElementById('root')).render(<App />);
