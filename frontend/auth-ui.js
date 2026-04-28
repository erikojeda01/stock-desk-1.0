/* Login/Register overlay shown before the app loads. */

import { api, auth } from './api.js';

const STYLE = `
  .auth-overlay{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;
    background:radial-gradient(1200px 600px at 30% 20%, rgba(99,102,241,.18), transparent 60%),
              radial-gradient(900px 600px at 80% 80%, rgba(16,185,129,.12), transparent 60%),
              #0a0a0c;z-index:9999;font-family:Inter,system-ui,sans-serif;}
  .auth-card{width:100%;max-width:420px;padding:2.5rem;border-radius:16px;
    background:rgba(20,20,24,.8);backdrop-filter:blur(24px);
    border:1px solid rgba(255,255,255,.08);
    box-shadow:0 20px 60px rgba(0,0,0,.5);}
  .auth-logo{display:flex;align-items:center;gap:.5rem;margin-bottom:.5rem;color:#fff;font-weight:700;font-size:1.25rem}
  .auth-logo i{color:#10b981}
  .auth-card h2{color:#fff;margin:.25rem 0 .25rem;font-size:1.5rem}
  .auth-card p.sub{color:#a1a1aa;margin-bottom:1.5rem;font-size:.875rem}
  .auth-card label{display:block;color:#a1a1aa;font-size:.75rem;text-transform:uppercase;letter-spacing:.04em;margin:1rem 0 .25rem}
  .auth-card input{width:100%;padding:.75rem 1rem;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);
    border-radius:8px;color:#fff;font-size:.95rem;outline:none;transition:border-color .15s}
  .auth-card input:focus{border-color:#6366f1}
  .auth-card .auth-btn{width:100%;margin-top:1.5rem;padding:.85rem;background:linear-gradient(135deg,#6366f1,#8b5cf6);
    color:#fff;border:0;border-radius:8px;font-weight:600;cursor:pointer;font-size:.95rem;transition:transform .1s, box-shadow .15s}
  .auth-card .auth-btn:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(99,102,241,.3)}
  .auth-card .auth-btn:disabled{opacity:.6;cursor:not-allowed;transform:none}
  .auth-toggle{margin-top:1rem;color:#a1a1aa;font-size:.875rem;text-align:center}
  .auth-toggle a{color:#6366f1;text-decoration:none;font-weight:500;cursor:pointer}
  .auth-error{margin-top:1rem;padding:.75rem;background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.3);
    color:#fca5a5;border-radius:8px;font-size:.85rem;display:none}
  .auth-demo{margin-top:1rem;padding:.75rem;background:rgba(16,185,129,.08);border:1px dashed rgba(16,185,129,.3);
    color:#86efac;border-radius:8px;font-size:.8rem;text-align:center;cursor:pointer}
  .auth-demo:hover{background:rgba(16,185,129,.14)}
`;

let mode = 'login'; // or 'register'

function injectStyle() {
  if (document.getElementById('auth-style')) return;
  const s = document.createElement('style');
  s.id = 'auth-style';
  s.textContent = STYLE;
  document.head.appendChild(s);
}

function template() {
  return `
    <div class="auth-overlay" id="auth-overlay">
      <div class="auth-card">
        <div class="auth-logo"><i class="ph ph-trend-up"></i><span>StockDesk</span></div>
        <h2 id="auth-title">${mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
        <p class="sub" id="auth-sub">${mode === 'login' ? 'Sign in to your trading journal.' : 'Start logging trades in seconds.'}</p>

        <form id="auth-form" autocomplete="off">
          <div id="name-group" style="display:${mode === 'register' ? 'block' : 'none'}">
            <label>Name</label>
            <input id="auth-name" type="text" placeholder="Trader" />
          </div>
          <label>Email</label>
          <input id="auth-email" type="email" placeholder="you@example.com" required />
          <label>Password</label>
          <input id="auth-password" type="password" placeholder="••••••••" minlength="8" required />

          <button type="submit" class="auth-btn" id="auth-submit">
            ${mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div class="auth-error" id="auth-error"></div>

        <div class="auth-toggle">
          <span id="auth-toggle-text">${mode === 'login' ? "Don't have an account?" : 'Already have one?'}</span>
          <a id="auth-toggle">${mode === 'login' ? 'Create account' : 'Sign in'}</a>
        </div>

        <div class="auth-demo" id="auth-demo">
          Try the demo: <strong>demo@stockdesk.io / demo1234</strong>
        </div>
      </div>
    </div>
  `;
}

function showError(msg) {
  const el = document.getElementById('auth-error');
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
}

function clearError() {
  const el = document.getElementById('auth-error');
  if (el) el.style.display = 'none';
}

function bind() {
  document.getElementById('auth-toggle').addEventListener('click', () => {
    mode = mode === 'login' ? 'register' : 'login';
    document.getElementById('auth-overlay').remove();
    render();
  });

  document.getElementById('auth-demo').addEventListener('click', () => {
    document.getElementById('auth-email').value = 'demo@stockdesk.io';
    document.getElementById('auth-password').value = 'demo1234';
  });

  document.getElementById('auth-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();
    const submitBtn = document.getElementById('auth-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = mode === 'login' ? 'Signing in…' : 'Creating account…';

    try {
      const email = document.getElementById('auth-email').value.trim();
      const password = document.getElementById('auth-password').value;
      let res;
      if (mode === 'register') {
        const name = document.getElementById('auth-name').value.trim() || email.split('@')[0];
        res = await api.register({ name, email, password });
      } else {
        res = await api.login({ email, password });
      }
      auth.setSession(res);
      document.getElementById('auth-overlay').remove();
      window.dispatchEvent(new CustomEvent('auth:ready', { detail: res.user }));
    } catch (err) {
      const msg = err?.message?.includes('Failed to fetch')
        ? 'Cannot reach the API at http://localhost:4000. Make sure the backend is running.'
        : err.message;
      showError(msg || 'Something went wrong');
      submitBtn.disabled = false;
      submitBtn.textContent = mode === 'login' ? 'Sign in' : 'Create account';
    }
  });
}

function render() {
  injectStyle();
  document.body.insertAdjacentHTML('beforeend', template());
  bind();
}

export function showAuth() {
  render();
  return new Promise((resolve) => {
    window.addEventListener('auth:ready', (e) => resolve(e.detail), { once: true });
  });
}

export function logout() {
  auth.clear();
  location.reload();
}
