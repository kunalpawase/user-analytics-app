// Add <script src="http://localhost:3001/tracker.js" data-endpoint="http://localhost:3001/api/events" defer></script>
(() => {
  const script = document.currentScript;
  const endpoint = script?.dataset.endpoint || '/api/events';
  const key = 'cf_analytics_session';
  let sessionId = localStorage.getItem(key);
  if (!sessionId) { sessionId = crypto.randomUUID(); localStorage.setItem(key, sessionId); }
  const send = (payload) => fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ session_id: sessionId, page_url: location.href, timestamp: new Date().toISOString(), ...payload }), keepalive: true }).catch(() => {});
  send({ event_type: 'page_view' });
  document.addEventListener('click', (event) => send({ event_type: 'click', x: event.pageX, y: event.pageY }), { passive: true });
})();
