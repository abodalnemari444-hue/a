(function () {
  const orders = new Map(); // id -> order
  const knownIds = new Set();

  const cols = {
    pending: document.getElementById('colPending'),
    preparing: document.getElementById('colPreparing'),
    ready: document.getElementById('colReady'),
  };
  const counts = {
    pending: document.getElementById('countPending'),
    preparing: document.getElementById('countPreparing'),
    ready: document.getElementById('countReady'),
  };

  const logoutBtn = document.getElementById('logoutBtn');
  const userNameBadge = document.getElementById('userNameBadge');

  logoutBtn.addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/index.html';
  });

  async function loadMe() {
    const res = await fetch('/api/auth/me');
    if (!res.ok) { window.location.href = '/index.html'; return null; }
    const data = await res.json();
    userNameBadge.textContent = data.user.name;
    return data.user;
  }

  const socket = io();
  socket.on('connect', () => {
    socket.emit('orders:sync', {}, (all) => {
      all.forEach((order) => {
        orders.set(order.id, order);
        knownIds.add(order.id);
      });
      renderBoard();
    });
  });
  bindConnectionIndicator(socket);

  socket.on('order:updated', (order) => {
    const isNew = !knownIds.has(order.id);
    knownIds.add(order.id);
    orders.set(order.id, order);
    renderBoard(isNew ? order.id : null);
    if (isNew) {
      beep();
      showToast(`طلب جديد ${order.id} 🛎️`);
    }
  });

  function beep() {
    if (localStorage.getItem('shami_sound_enabled') === 'off') return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) { /* التصفح لا يدعم الصوت التلقائي */ }
  }

  function updateStatus(id, status) {
    socket.emit('order:status', { id, status }, (res) => {
      if (!res.ok) showToast('خطأ: ' + res.error);
    });
  }

  function cardHTML(order) {
    const itemsHTML = order.items.map((it) => `<li><span>${it.emoji} ${it.name}</span><span class="q">×${it.qty}</span></li>`).join('');
    const meta = `${order.customerName}${order.tableNumber ? ' · طاولة ' + order.tableNumber : ''} · ${formatTime(order.createdAt)}`;

    let actions = '';
    if (order.status === 'pending') {
      actions = `
        <button class="btn btn-success btn-sm" data-action="preparing">✅ قبول وبدء التحضير</button>
        <button class="btn btn-danger btn-sm" data-action="rejected">✖ رفض</button>`;
    } else if (order.status === 'preparing') {
      actions = `<button class="btn btn-primary btn-sm" data-action="ready">🍽️ الطلب جاهز</button>`;
    } else if (order.status === 'ready') {
      actions = `<button class="btn btn-outline btn-sm" data-action="completed">📦 تم التسليم</button>`;
    }

    return `
      <div class="kitchen-card" data-id="${order.id}">
        <div class="head">
          <div>
            <div class="oid">${order.id}</div>
            <div class="meta">${meta}</div>
          </div>
          <div style="font-weight:800; color:var(--color-primary-dark);">${formatCurrency(order.total)}</div>
        </div>
        <ul>${itemsHTML}</ul>
        ${order.notes ? `<div class="notes">📝 ${order.notes}</div>` : ''}
        <div class="actions">${actions}</div>
      </div>`;
  }

  function renderBoard(flashId) {
    const buckets = { pending: [], preparing: [], ready: [] };
    [...orders.values()]
      .sort((a, b) => a.createdAt - b.createdAt)
      .forEach((order) => {
        if (buckets[order.status]) buckets[order.status].push(order);
      });

    Object.entries(buckets).forEach(([status, list]) => {
      counts[status].textContent = list.length;
      cols[status].innerHTML = list.length
        ? list.map(cardHTML).join('')
        : `<div class="empty-col">لا يوجد طلبات</div>`;

      cols[status].querySelectorAll('.kitchen-card').forEach((cardEl) => {
        const id = cardEl.dataset.id;
        if (id === flashId) cardEl.classList.add('new-flash');
        cardEl.querySelectorAll('[data-action]').forEach((btn) => {
          btn.addEventListener('click', () => updateStatus(id, btn.dataset.action));
        });
      });
    });
  }

  loadMe();
  renderBoard();

  if (sessionStorage.getItem('shami_show_welcome')) {
    sessionStorage.removeItem('shami_show_welcome');
    showToast('يا مرحبا نورت المطعم 🤍');
  }
})();
