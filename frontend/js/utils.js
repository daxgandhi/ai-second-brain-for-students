// ============================================================
// js/utils.js — Shared Utilities
// Used across all pages for API calls, auth, toast, etc.
// ============================================================

const API_BASE = 'http://localhost:5000/api';

// ── Theme Management ───────────────────────────────────────────
(function applyThemeEarly() {
  // Apply theme before any paint to avoid flash
  if (localStorage.getItem('theme') === 'light') {
    document.documentElement.classList.add('light-mode');
  }
})();

// ── Auth Helpers ──────────────────────────────────────────────
const Auth = {
  // Save user data after login/register
  save(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },
  // Get the JWT token
  getToken() {
    return localStorage.getItem('token');
  },
  // Get current user object
  getUser() {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  },
  // Check if logged in
  isLoggedIn() {
    return !!this.getToken();
  },
  // Logout — clear storage and redirect
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
  },
  // Redirect to login if not authenticated
  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = 'login.html';
    }
  },
  // Redirect to dashboard if already logged in
  redirectIfLoggedIn() {
    if (this.isLoggedIn()) {
      window.location.href = 'dashboard.html';
    }
  }
};

// ── API Call Helper ───────────────────────────────────────────
async function apiCall(endpoint, options = {}) {
  const token = Auth.getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    const data = await res.json();

    if (!res.ok) {
      // Handle Unauthorized/Expired token
      if (res.status === 401) {
        console.warn('Unauthorized request, logging out...');
        const msg = data.message || 'Session expired';
        Toast.error(msg + '. Redirecting to login...');
        setTimeout(() => Auth.logout(), 2000);
      }
      throw new Error(data.message || `Error ${res.status}`);
    }

    return data;
  } catch (err) {
    // If we're already handling 401 redirect, don't show another error
    if (err.message.includes('Redirecting to login')) throw err;

    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Cannot connect to server. Make sure the backend is running on port 5000.');
    }
    throw err;
  }
}

// ── Multipart API Call (for file uploads) ────────────────────
async function apiUpload(endpoint, formData) {
  const token = Auth.getToken();
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) {
        Toast.error((data.message || 'Session expired') + '. Redirecting...');
        setTimeout(() => Auth.logout(), 2000);
      }
      throw new Error(data.message || 'Upload failed');
    }
    return data;
  } catch (err) {
    if (err.name === 'TypeError') throw new Error('Cannot connect to server.');
    throw err;
  }
}

// ── Upload with real progress (uses XMLHttpRequest) ──────────
// onProgress(pct, bytesUploaded, totalBytes) called during upload
function apiUploadWithProgress(endpoint, formData, onProgress) {
  return new Promise((resolve, reject) => {
    const token = Auth.getToken();
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}${endpoint}`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const pct = Math.round((e.loaded / e.total) * 100);
        onProgress(pct, e.loaded, e.total);
      }
    });

    xhr.addEventListener('load', () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(data);
        } else {
          if (xhr.status === 401) {
            Toast.error((data.message || 'Session expired') + '. Redirecting...');
            setTimeout(() => Auth.logout(), 2000);
          }
          reject(new Error(data.message || 'Upload failed'));
        }
      } catch (e) {
        reject(new Error('Server response parse error'));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Cannot connect to server.')));
    xhr.send(formData);
  });
}

// ── Toast Notifications ───────────────────────────────────────
const Toast = {
  container: null,

  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      document.body.appendChild(this.container);
    }
  },

  show(message, type = 'info', duration = 3500) {
    this.init();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    toast.innerHTML = `${icons[type] || ''} ${message}`;
    this.container.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'toastIn 0.3s ease reverse';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  success(msg) { this.show(msg, 'success'); },
  error(msg) { this.show(msg, 'error'); },
  info(msg) { this.show(msg, 'info'); }
};

// ── Sidebar Setup (for authenticated pages) ──────────────────
function initSidebar(activePage) {
  const user = Auth.getUser();
  if (!user) return;

  // Populate user info
  const nameEl = document.getElementById('sidebar-name');
  const emailEl = document.getElementById('sidebar-email');
  const avatarEl = document.getElementById('sidebar-avatar');
  if (nameEl) nameEl.textContent = user.name;
  if (emailEl) emailEl.textContent = user.email;
  if (avatarEl) avatarEl.textContent = user.name.charAt(0).toUpperCase();

  // Set active nav item
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    if (item.dataset.page === activePage) {
      item.classList.add('active');
    }
  });

  // Logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      Auth.logout();
    });
  }

  // Mobile sidebar toggle
  const toggle = document.getElementById('sidebar-toggle');
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  if (toggle && sidebar && overlay) {
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('show');
    });
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
    });
  }

  // ── Theme Toggle Button ──────────────────────────────
  const sidebarFooter = document.querySelector('.sidebar-footer');
  if (sidebarFooter && !document.getElementById('theme-toggle')) {
    const isLight = document.documentElement.classList.contains('light-mode');
    const themeBtn = document.createElement('button');
    themeBtn.id = 'theme-toggle';
    themeBtn.innerHTML = `
      <span id="theme-label">${isLight ? '☀️ Light Mode' : '🌙 Dark Mode'}</span>
      <div class="toggle-track"><div class="toggle-thumb"></div></div>
    `;
    sidebarFooter.insertBefore(themeBtn, sidebarFooter.firstChild);

    themeBtn.addEventListener('click', () => {
      const html = document.documentElement;
      const nowLight = html.classList.toggle('light-mode');
      localStorage.setItem('theme', nowLight ? 'light' : 'dark');
      document.getElementById('theme-label').textContent = nowLight ? '☀️ Light Mode' : '🌙 Dark Mode';
    });
  }
}

// ── Set button loading state ──────────────────────────────────
function setLoading(btn, isLoading, originalText) {
  btn.disabled = isLoading;
  if (isLoading) {
    btn.dataset.original = btn.innerHTML;
    btn.innerHTML = '<span class="spinner"></span> Loading...';
  } else {
    btn.innerHTML = btn.dataset.original || originalText || 'Submit';
  }
}

// ── Format file size ──────────────────────────────────────────
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ── Format date ───────────────────────────────────────────────
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Escape HTML to prevent XSS ───────────────────────────────
function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

// ── Parse markdown-like text to HTML ─────────────────────────
function parseMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');
}

// ── Global Floating Timer Widget ─────────────────────────────
function initGlobalTimerWidget() {
  const isRunning = localStorage.getItem('studyTimer_isRunning') === 'true';
  const savedSeconds = parseInt(localStorage.getItem('studyTimer_savedSeconds')) || 0;

  // Only show if actually running or has saved seconds (paused)
  if (!isRunning && savedSeconds === 0) return;

  // Don't show the global widget on the session.html page itself to avoid visual duplication
  if (window.location.pathname.endsWith('session.html')) return;

  let widget = document.getElementById('global-timer-widget');
  if (!widget) {
    widget = document.createElement('a');
    widget.id = 'global-timer-widget';
    widget.href = 'session.html';
    widget.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-left: 4px solid var(--accent);
      border-radius: var(--radius);
      padding: 12px 20px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
      display: flex;
      align-items: center;
      gap: 16px;
      z-index: 1000;
      text-decoration: none;
      color: var(--text-primary);
      transition: var(--transition);
      cursor: pointer;
    `;
    widget.innerHTML = `
      <div style="width: 12px; height: 12px; border-radius: 50%; background: ${isRunning ? 'var(--success)' : 'var(--warning)'}; animation: ${isRunning ? 'pulse 2s infinite' : 'none'}"></div>
      <div>
        <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px;">Study Timer</div>
        <div id="global-timer-display" style="font-weight: 800; font-family: var(--font-display); font-variant-numeric: tabular-nums; color: var(--text-primary); font-size: 1.25rem; line-height: 1;">00:00</div>
      </div>
    `;

    // Add keyframe animation for pulse if it doesn't exist
    if (!document.getElementById('timer-pulse-style')) {
      const style = document.createElement('style');
      style.id = 'timer-pulse-style';
      style.innerHTML = `
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
          70% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        #global-timer-widget:hover {
          transform: translateY(-4px);
          box-shadow: 0 14px 28px rgba(0,0,0,0.15);
          border-left-color: var(--success);
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(widget);
  }

  const display = document.getElementById('global-timer-display');

  if (isRunning) {
    const startTime = parseInt(localStorage.getItem('studyTimer_startTime')) || Date.now();
    setInterval(() => {
      const current = savedSeconds + Math.floor((Date.now() - startTime) / 1000);
      const m = Math.floor(current / 60).toString().padStart(2, '0');
      const s = (current % 60).toString().padStart(2, '0');
      display.textContent = `${m}:${s}`;
    }, 1000);
  } else {
    const m = Math.floor(savedSeconds / 60).toString().padStart(2, '0');
    const s = (savedSeconds % 60).toString().padStart(2, '0');
    display.textContent = `${m}:${s}`;
  }
}

// Call it after DOM load or export it (but initSidebar runs on all pages, so we can run this directly)
document.addEventListener('DOMContentLoaded', initGlobalTimerWidget);
