# StockDesk — Backend

The Node + Express + MongoDB API for [StockDesk](../README.md).

For full architecture and feature docs see the [top-level README](../README.md).

## Run locally

```bash
npm install
cp .env.example .env             # set JWT_SECRET, JWT_REFRESH_SECRET, MONGODB_URI
brew services start mongodb-community
npm run seed                     # optional: demo data
npm run dev                      # http://localhost:4000
```

> Demo login (after `npm run seed`): `demo@stockdesk.io` / `demo1234`

## REST API

All non-public endpoints expect `Authorization: Bearer <accessToken>`.

<details>
<summary><b>Auth</b></summary>

| Method | Path | Body |
|---|---|---|
| `POST` | `/api/auth/register` | `{ name, email, password }` |
| `POST` | `/api/auth/login` | `{ email, password }` |
| `POST` | `/api/auth/refresh` | `{ refreshToken }` |
| `GET`  | `/api/auth/me` | — |
| `POST` | `/api/auth/change-password` | `{ currentPassword, newPassword }` |

</details>

<details>
<summary><b>Trades & Journal</b></summary>

| Method | Path | Notes |
|---|---|---|
| `GET`    | `/api/trades` | filters: `symbol`, `from`, `to` |
| `POST`   | `/api/trades` | `{ symbol, type, date, shares, entry, exit, sl?, tp? }` — server computes pnl & rr |
| `POST`   | `/api/trades/bulk` | array import for CSV |
| `PATCH`  | `/api/trades/:id` | |
| `DELETE` | `/api/trades/:id` | |
| `GET`    | `/api/journal` | all entries |
| `POST`   | `/api/journal` | upserts by date — `{ date, mood, reflection }` |

</details>

<details>
<summary><b>Public market data</b></summary>

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/stocks` | all known symbols |
| `GET` | `/api/stocks/search?q=apple` | text search |
| `GET` | `/api/stocks/quotes?symbols=AAPL,MSFT` | bulk |
| `GET` | `/api/stocks/:symbol` | single quote |
| `GET` | `/api/stocks/:symbol/history` | rolling tick history |

</details>

<details>
<summary><b>Portfolios, holdings, watchlists, transactions</b></summary>

Available for future expansion (live paper-trading mode). See [routes folder](src/routes) for the full surface.

</details>

## WebSockets

```js
const socket = io('http://localhost:4000', { auth: { token: accessToken } });
socket.emit('subscribe', ['AAPL', 'NVDA']);
socket.on('quote:AAPL', tick => updateChart(tick));
socket.on('market:tick', ticks => updateTicker(ticks));
socket.on('portfolio:updated', () => refreshPortfolio());
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | nodemon, hot-reload |
| `npm start` | production start |
| `npm run seed` | wipe + seed demo data |
| `npm test` | Jest + Supertest (in-memory MongoDB) |
| `npm run lint` | ESLint |

## Tech

Node · Express · Mongoose · Socket.IO · JWT · bcrypt · Jest · helmet · express-validator

---

> Built by [Erik Ojeda](https://github.com/erikojeda01) · [MIT licensed](../LICENSE)
