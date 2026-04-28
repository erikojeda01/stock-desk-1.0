# StockDesk — Frontend

The Vite + vanilla JS frontend for [StockDesk](../README.md).

For full documentation (architecture, features, design system) see the [top-level README](../README.md).

## Run locally

```bash
npm install
npm run dev          # http://localhost:5173
```

The frontend expects the API at `http://localhost:4000/api`. Override via `.env`:

```env
VITE_API_URL=https://api.your-domain.com/api
```

## Layout

```
index.html              shell, modals, view containers
app.js                  navigation + global UI
api.js                  fetch wrapper, JWT auth, refresh
auth-ui.js              login / register overlay
store.js                state container — talks to the API
styles.css              design tokens
js/
  dashboard.js          equity curve, win rate, R:R cards
  trades.js             trade ledger
  calendar.js           P&L calendar heatmap
  journal.js            daily reflections
  aicoach.js            placeholder for AI coach view
  import.js             CSV import wizard
```

## Tech

Vite · Chart.js · Phosphor Icons · Inter · custom design system

---

> Built by [Erik Ojeda](https://github.com/erikojeda01) · [MIT licensed](../LICENSE)
