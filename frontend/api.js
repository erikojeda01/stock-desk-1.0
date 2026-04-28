/* StockDesk API client — wraps fetch with token handling. */

const DEFAULT_BASE = 'http://localhost:4000/api';
const API_BASE =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) ||
  DEFAULT_BASE;

const TOKEN_KEY = 'stockdesk_access_token';
const REFRESH_KEY = 'stockdesk_refresh_token';
const USER_KEY = 'stockdesk_user';

export const auth = {
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },
  getRefreshToken() {
    return localStorage.getItem(REFRESH_KEY);
  },
  getUser() {
    const raw = localStorage.getItem(USER_KEY);
    try { return raw ? JSON.parse(raw) : null; } catch { return null; }
  },
  setSession({ accessToken, refreshToken, user }) {
    if (accessToken) localStorage.setItem(TOKEN_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  },
  isAuthenticated() {
    return !!localStorage.getItem(TOKEN_KEY);
  },
};

async function request(path, { method = 'GET', body, headers = {}, retry = true } = {}) {
  const token = auth.getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && retry) {
    // Try refresh
    const refreshed = await tryRefresh();
    if (refreshed) return request(path, { method, body, headers, retry: false });
    auth.clear();
    window.dispatchEvent(new CustomEvent('auth:expired'));
    throw new ApiError(401, 'Session expired');
  }

  let data = null;
  if (res.status !== 204) {
    try { data = await res.json(); } catch { data = null; }
  }

  if (!res.ok) {
    const message = data?.error?.message || `Request failed (${res.status})`;
    const details = data?.error?.details;
    throw new ApiError(res.status, message, details);
  }
  return data;
}

async function tryRefresh() {
  const refreshToken = auth.getRefreshToken();
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (data.accessToken) {
      localStorage.setItem(TOKEN_KEY, data.accessToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const api = {
  // Auth
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  me: () => request('/auth/me'),

  // Trades
  listTrades: () => request('/trades'),
  createTrade: (payload) => request('/trades', { method: 'POST', body: payload }),
  updateTrade: (id, payload) => request(`/trades/${id}`, { method: 'PATCH', body: payload }),
  deleteTrade: (id) => request(`/trades/${id}`, { method: 'DELETE' }),
  bulkImportTrades: (trades) => request('/trades/bulk', { method: 'POST', body: { trades } }),

  // Journal
  listJournalEntries: () => request('/journal'),
  upsertJournalEntry: (payload) => request('/journal', { method: 'POST', body: payload }),
  deleteJournalEntry: (id) => request(`/journal/${id}`, { method: 'DELETE' }),
};

export const API_BASE_URL = API_BASE;
