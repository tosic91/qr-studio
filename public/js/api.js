/**
 * API Client helper — wraps fetch with auth handling and error reporting
 */
const API = {
  baseUrl: '/api',

  async request(method, path, body = null) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
    };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`${this.baseUrl}${path}`, opts);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || `Request failed (${res.status})`);
    }
    return data;
  },

  // Auth
  register(email, password, name) {
    return this.request('POST', '/auth/register', { email, password, name });
  },
  login(email, password) {
    return this.request('POST', '/auth/login', { email, password });
  },
  logout() {
    return this.request('POST', '/auth/logout');
  },
  me() {
    return this.request('GET', '/auth/me');
  },

  // QR Codes
  listQR() {
    return this.request('GET', '/qr');
  },
  createQR(data) {
    return this.request('POST', '/qr', data);
  },
  getQR(id) {
    return this.request('GET', `/qr/${id}`);
  },
  updateQR(id, data) {
    return this.request('PUT', `/qr/${id}`, data);
  },
  deleteQR(id) {
    return this.request('DELETE', `/qr/${id}`);
  },
  toggleQR(id) {
    return this.request('PATCH', `/qr/${id}/toggle`);
  },

  // Analytics
  overview() {
    return this.request('GET', '/analytics/overview');
  },
  qrAnalytics(id, days = 30) {
    return this.request('GET', `/analytics/qr/${id}?days=${days}`);
  },
};

// ── Toast Notifications ──
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  toast.innerHTML = `<span>${icons[type] || 'ℹ'}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 300ms ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ── Auth State Helper ──
async function checkAuth() {
  try {
    const data = await API.me();
    return data.user;
  } catch {
    return null;
  }
}

function updateNavForAuth(user) {
  const authNav = document.getElementById('auth-nav');
  if (!authNav) return;

  if (user) {
    authNav.innerHTML = `
      <a href="/dashboard">Dashboard</a>
      <span style="color: var(--text-muted); font-size: var(--font-sm);">${user.name || user.email}</span>
      <a href="#" id="logout-btn" class="btn btn-ghost btn-sm">Logout</a>
    `;
    document.getElementById('logout-btn')?.addEventListener('click', async (e) => {
      e.preventDefault();
      await API.logout();
      window.location.href = '/';
    });
  } else {
    authNav.innerHTML = `
      <a href="/login">Login</a>
      <a href="/register" class="btn btn-primary btn-sm">Sign Up</a>
    `;
  }
}
