import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
app.use(cors());
app.use(express.json({ limit: '32kb' }));
app.use(express.static(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public')));
const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017');
await client.connect();
const db = client.db(process.env.DB_NAME || 'user_analytics');
const events = db.collection('events');
await events.createIndex({ session_id: 1, timestamp: 1 });
await events.createIndex({ page_url: 1, event_type: 1 });

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.post('/api/events', async (req, res) => {
  const { session_id, event_type, page_url, timestamp, x, y } = req.body || {};
  if (!session_id || !['page_view', 'click'].includes(event_type) || !page_url || !timestamp || Number.isNaN(Date.parse(timestamp))) return res.status(400).json({ error: 'Invalid event payload' });
  if (event_type === 'click' && (!Number.isFinite(x) || !Number.isFinite(y))) return res.status(400).json({ error: 'Click events require numeric x and y coordinates' });
  const event = { session_id: String(session_id).slice(0, 128), event_type, page_url: String(page_url).slice(0, 2048), timestamp: new Date(timestamp), ...(event_type === 'click' ? { x, y } : {}) };
  const result = await events.insertOne(event);
  res.status(201).json({ id: result.insertedId });
});
app.get('/api/sessions', async (_req, res) => {
  const rows = await events.aggregate([{ $group: { _id: '$session_id', event_count: { $sum: 1 }, started_at: { $min: '$timestamp' }, last_seen: { $max: '$timestamp' } } }, { $sort: { last_seen: -1 } }]).toArray();
  res.json(rows.map(({ _id, ...rest }) => ({ session_id: _id, ...rest })));
});
app.get('/api/sessions/:id/events', async (req, res) => res.json(await events.find({ session_id: req.params.id }).sort({ timestamp: 1 }).toArray()));
app.get('/api/pages', async (_req, res) => res.json(await events.distinct('page_url')));
app.get('/api/heatmap', async (req, res) => {
  const page = String(req.query.page || '');
  if (!page) return res.status(400).json({ error: 'page query parameter is required' });
  res.json(await events.find({ page_url: page, event_type: 'click' }, { projection: { _id: 0, x: 1, y: 1, timestamp: 1 } }).toArray());
});
app.use((err, _req, res, _next) => { console.error(err); res.status(500).json({ error: 'Internal server error' }); });
const port = Number(process.env.PORT || 3001);
app.listen(port, () => console.log(`Analytics API listening on http://localhost:${port}`));
