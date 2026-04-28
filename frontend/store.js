/*
  StockDesk Store — talks to the backend API.
  Drop-in replacement for the old localStorage-only store: same shape (state.trades,
  state.journalEntries), same methods (addTrade, addJournalEntry, subscribe, etc.).
*/

import { api, auth } from './api.js';
import { showAuth, logout } from './auth-ui.js';

const defaultState = {
  trades: [],
  journalEntries: [],
  settings: { userName: 'Trader' },
  user: null,
  ready: false,
};

class Store {
  constructor() {
    this.state = { ...defaultState };
    this.listeners = [];
  }

  // --- Auth + bootstrap -------------------------------------------------------

  async bootstrap() {
    if (!auth.isAuthenticated()) {
      const user = await showAuth();
      this.state.user = user;
      this.state.settings.userName = user?.name || 'Trader';
    } else {
      try {
        const { user } = await api.me();
        this.state.user = user;
        this.state.settings.userName = user?.name || 'Trader';
      } catch (err) {
        // bad token — re-auth
        const user = await showAuth();
        this.state.user = user;
      }
    }

    await this.refresh();
    this.state.ready = true;
    this.notify();
    return this.state;
  }

  async refresh() {
    try {
      const [t, j] = await Promise.all([api.listTrades(), api.listJournalEntries()]);
      this.state.trades = (t.trades || []).map(this._normalizeTrade);
      this.state.journalEntries = (j.journalEntries || []).map(this._normalizeJournal);
      this.notify();
    } catch (err) {
      console.error('Failed to refresh data', err);
    }
  }

  _normalizeTrade(t) {
    return {
      id: t._id || t.id,
      createdAt: t.createdAt,
      symbol: t.symbol,
      type: t.type,
      date: typeof t.date === 'string' ? t.date.split('T')[0] : t.date,
      shares: Number(t.shares),
      entry: Number(t.entry),
      exit: Number(t.exit),
      sl: t.sl != null ? Number(t.sl) : null,
      tp: t.tp != null ? Number(t.tp) : null,
      pnl: Number(t.pnl || 0),
      rr: t.rr != null ? Number(t.rr) : null,
    };
  }

  _normalizeJournal(j) {
    return {
      id: j._id || j.id,
      createdAt: j.createdAt,
      date: typeof j.date === 'string' ? j.date.split('T')[0] : j.date,
      mood: j.mood,
      reflection: j.reflection,
    };
  }

  // --- Trades -----------------------------------------------------------------

  async addTrade(input) {
    const payload = {
      symbol: String(input.symbol || '').toUpperCase(),
      type: input.type,
      date: input.date,
      shares: parseFloat(input.shares),
      entry: parseFloat(input.entry),
      exit: parseFloat(input.exit),
      sl: input.sl ? parseFloat(input.sl) : null,
      tp: input.tp ? parseFloat(input.tp) : null,
    };
    const { trade } = await api.createTrade(payload);
    this.state.trades.unshift(this._normalizeTrade(trade));
    this.state.trades.sort((a, b) => new Date(b.date) - new Date(a.date));
    this.notify();
    return trade;
  }

  async addTradesBulk(trades) {
    const { trades: created } = await api.bulkImportTrades(trades);
    for (const t of created) this.state.trades.unshift(this._normalizeTrade(t));
    this.state.trades.sort((a, b) => new Date(b.date) - new Date(a.date));
    this.notify();
    return created;
  }

  async deleteTrade(id) {
    await api.deleteTrade(id);
    this.state.trades = this.state.trades.filter((t) => t.id !== id);
    this.notify();
  }

  getTrades() {
    return this.state.trades;
  }

  // --- Journal ----------------------------------------------------------------

  async addJournalEntry(entry) {
    const { journalEntry } = await api.upsertJournalEntry({
      date: entry.date,
      mood: entry.mood || 'Neutral',
      reflection: entry.reflection,
    });
    const normalized = this._normalizeJournal(journalEntry);
    const idx = this.state.journalEntries.findIndex((e) => e.date === normalized.date);
    if (idx >= 0) this.state.journalEntries[idx] = normalized;
    else this.state.journalEntries.push(normalized);
    this.notify();
    return journalEntry;
  }

  getJournalEntries() {
    return this.state.journalEntries;
  }

  getJournalEntryForDate(dateString) {
    return this.state.journalEntries.find((e) => e.date === dateString);
  }

  // --- Subscriptions ----------------------------------------------------------

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  notify() {
    this.listeners.forEach((cb) => cb(this.state));
  }
}

window.appStore = new Store();
window.appStore.logout = logout;

// Auto-handle expired sessions
window.addEventListener('auth:expired', () => {
  alert('Your session expired. Please sign in again.');
  logout();
});

// Boot the app — fetch data, then notify subscribers
(async () => {
  try {
    await window.appStore.bootstrap();
  } catch (err) {
    console.error('Bootstrap failed:', err);
  }
})();
