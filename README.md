# relax-dev (Standalone)

Relax Centre als **Standalone**-App (React/Vite UI + Node HTTP API).

## Dev

- Install: `npm install`
- Start (UI + API): `npm run dev`
- UI only: `npm run ui:dev`
- API only: `npm run start`

Ports (Default):
- UI (Vite): `http://127.0.0.1:5904`
- API (Node): `http://127.0.0.1:9004`

## Daten (lokal)

Alle Daten liegen im Repo unter `data/`:
- `data/sessions/YYYY-MM-DD.json` (items: technique/minutes/mood_before/mood_after/note)
- `data/journal/YYYY-MM-DD.md`
- `data/theme.json`

## Export

- `GET /export/csv?days=7`
- `GET /export/csv?days=14`

Response: `{ ok:true, filename, csv }` (CSV wird clientseitig als Download gespeichert).

## Production/Static

`node server.mjs` serviert:
- `dist/` wenn vorhanden (Vite Build)
- sonst fallback `public/`

Override: `RELAX_STATIC_DIR=/path/to/static`.

