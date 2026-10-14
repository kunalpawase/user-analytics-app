# User Analytics Dashboard

A small full stack analytics app for tracking page views and clicks, reviewing session journeys, and viewing click coordinates by page.

## Tech stack

- React 18 and Vite dashboard
- Express and Node.js API
- MongoDB events collection
- Standalone browser tracker (`public/tracker.js`)

## Requirements

- Node.js 18 or later
- MongoDB Community Server or a MongoDB Atlas connection string

## Run locally

1. Copy `.env.example` to `.env` and set `MONGODB_URI` if MongoDB is not running locally.
2. Install dependencies: `npm install`.
3. Start the dashboard and API: `npm run dev`.
4. Open the dashboard at `http://localhost:5173`.
5. Open the demo tracker page at `http://localhost:3001/demo.html`.

The API listens on port 3001 by default. The Vite development server proxies `/api` requests to it. To build the dashboard, run `npm run build`; the generated files go to `dist/`.

## Tracker installation

Include the script on a page served from the same origin as the API, or set an explicit API endpoint:

```html
<script src="https://your-host/tracker.js" data-endpoint="https://your-api/api/events" defer></script>
```

The tracker creates a persistent browser `session_id` in localStorage, sends one `page_view` on load, and sends `click` events with page-relative x/y coordinates. Event timestamps use ISO 8601. The API stores events as MongoDB documents and indexes session/time and page/type lookups.

## API

- `POST /api/events` — validate and store a page view or click
- `GET /api/sessions` — sessions with event counts and first/last timestamps
- `GET /api/sessions/:id/events` — ordered events for one session
- `GET /api/pages` — distinct page URLs
- `GET /api/heatmap?page=<encoded-url>` — click positions for a page
- `GET /api/health` — health check

## Assumptions and trade-offs

- A session is a browser identifier persisted in localStorage. This keeps the example simple; production analytics usually define session expiration and account for consent, retention, and privacy requirements.
- Click coordinates are page-relative pixels. The dashboard places them proportionally on a schematic surface, so it is useful for a quick overview rather than a faithful screenshot overlay.
- Events are append-only and do not include user identity or device fingerprinting.
- The sample API enables CORS for easy local use. Restrict origins, add authentication/rate limiting, and configure HTTPS before public deployment.
- MongoDB is required; there is no in-memory fallback.

## Deployment

Set `MONGODB_URI`, `DB_NAME`, and `PORT` in the server environment. Build the Vite frontend and host `dist/` on a static host; configure `VITE_API_URL` at build time to point to the API. Host `public/tracker.js` from the API/static host and update the demo script endpoint if needed.
