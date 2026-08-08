// أدوات مشتركة بين كل الصفحات: تسجيل السيرفس ووركر، إشعارات Toast، حالة الاتصال

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch(() => {});
  });
}

function ensureToastWrap() {
  let wrap = document.querySelector('.toast-wrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.className = 'toast-wrap';
    document.body.appendChild(wrap);
  }
  return wrap;
}

function showToast(message, duration = 2600) {
  const wrap = ensureToastWrap();
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  wrap.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity .25s ease';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 250);
  }, duration);
}

function formatCurrency(n) {
  return `${Number(n).toFixed(0)} ر.س`;
}

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
}

// ---- PWA install prompt ----
let deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  document.querySelectorAll('.install-hint').forEach((btn) => btn.classList.add('show'));
});

function bindInstallButtons() {
  document.querySelectorAll('.install-hint').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!deferredInstallPrompt) return;
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      document.querySelectorAll('.install-hint').forEach((b) => b.classList.remove('show'));
    });
  });
}

document.addEventListener('DOMContentLoaded', bindInstallButtons);

// ---- Connection indicator ----
function bindConnectionIndicator(socket) {
  const dot = document.querySelector('.conn-dot');
  if (!dot) return;
  socket.on('connect', () => dot.classList.add('online'));
  socket.on('disconnect', () => dot.classList.remove('online'));
}
