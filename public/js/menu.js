(function () {
  const STATUS_ORDER = ['pending', 'preparing', 'ready', 'completed'];

  const state = {
    menu: [],
    category: null,
    cart: {}, // id -> qty
    myOrders: new Map(), // id -> order
  };

  const el = {
    tabs: document.getElementById('tabs'),
    grid: document.getElementById('menuGrid'),
    cartBar: document.getElementById('cartBar'),
    cartBarCount: document.getElementById('cartBarCount'),
    cartBarTotal: document.getElementById('cartBarTotal'),
    cartCount: document.getElementById('cartCount'),
    cartOverlay: document.getElementById('cartOverlay'),
    cartItemsList: document.getElementById('cartItemsList'),
    cartTotal: document.getElementById('cartTotal'),
    submitOrderBtn: document.getElementById('submitOrderBtn'),
    closeCartBtn: document.getElementById('closeCartBtn'),
    cartIconBtn: document.getElementById('cartIconBtn'),
    myOrdersTitle: document.getElementById('myOrdersTitle'),
    myOrders: document.getElementById('myOrders'),
    tableNumber: document.getElementById('tableNumber'),
    orderNotes: document.getElementById('orderNotes'),
    userNameBadge: document.getElementById('userNameBadge'),
    logoutBtn: document.getElementById('logoutBtn'),
  };

  el.logoutBtn.addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/index.html';
  });

  async function loadMe() {
    const res = await fetch('/api/auth/me');
    if (!res.ok) { window.location.href = '/index.html'; return null; }
    const data = await res.json();
    el.userNameBadge.textContent = data.user.name;
    return data.user;
  }

  const savedTable = localStorage.getItem('shami_table_number');
  if (savedTable) el.tableNumber.value = savedTable;

  const socket = io();
  bindConnectionIndicator(socket);

  socket.on('order:updated', (order) => {
    const isNewStatus = state.myOrders.get(order.id)?.status !== order.status;
    state.myOrders.set(order.id, order);
    renderMyOrders();
    if (isNewStatus && order.status !== 'pending') {
      showToast(`طلبك ${order.id}: ${order.statusLabel}`);
    }
  });

  async function loadMenu() {
    const res = await fetch('/api/menu');
    state.menu = await res.json();
    const categories = [...new Set(state.menu.map((m) => m.category))];
    state.category = categories[0];
    renderTabs(categories);
    renderGrid();
  }

  function renderTabs(categories) {
    el.tabs.innerHTML = '';
    categories.forEach((cat) => {
      const btn = document.createElement('button');
      btn.className = 'tab' + (cat === state.category ? ' active' : '');
      btn.textContent = cat;
      btn.addEventListener('click', () => {
        state.category = cat;
        [...el.tabs.children].forEach((c) => c.classList.remove('active'));
        btn.classList.add('active');
        renderGrid();
      });
      el.tabs.appendChild(btn);
    });
  }

  function renderGrid() {
    const items = state.menu.filter((m) => m.category === state.category);
    el.grid.innerHTML = '';
    items.forEach((item) => {
      const qty = state.cart[item.id] || 0;
      const card = document.createElement('div');
      card.className = 'menu-card';
      card.innerHTML = `
        <div class="thumb">${item.emoji}</div>
        <div class="info">
          <h3>${item.name}</h3>
          <p>${item.desc}</p>
          <div class="price">${formatCurrency(item.price)}</div>
        </div>
        <div class="cta"></div>
      `;
      const cta = card.querySelector('.cta');
      if (qty > 0) {
        cta.innerHTML = `
          <div class="stepper">
            <button data-action="dec">−</button>
            <span>${qty}</span>
            <button data-action="inc">+</button>
          </div>`;
        cta.querySelector('[data-action="dec"]').addEventListener('click', () => changeQty(item.id, -1));
        cta.querySelector('[data-action="inc"]').addEventListener('click', () => changeQty(item.id, 1));
      } else {
        cta.innerHTML = `<button class="add-btn">+</button>`;
        cta.querySelector('.add-btn').addEventListener('click', () => changeQty(item.id, 1));
      }
      el.grid.appendChild(card);
    });
  }

  function changeQty(id, delta) {
    const next = (state.cart[id] || 0) + delta;
    if (next <= 0) delete state.cart[id];
    else state.cart[id] = Math.min(20, next);
    renderGrid();
    updateCartBar();
  }

  function cartEntries() {
    return Object.entries(state.cart).map(([id, qty]) => {
      const item = state.menu.find((m) => m.id === id);
      return { ...item, qty };
    });
  }

  function cartTotal() {
    return cartEntries().reduce((sum, it) => sum + it.price * it.qty, 0);
  }

  function updateCartBar() {
    const entries = cartEntries();
    const count = entries.reduce((s, it) => s + it.qty, 0);
    const total = cartTotal();
    el.cartBar.classList.toggle('show', count > 0);
    el.cartBarCount.textContent = count;
    el.cartBarTotal.textContent = formatCurrency(total);
    el.cartCount.style.display = count > 0 ? 'flex' : 'none';
    el.cartCount.textContent = count;
  }

  function renderCartSheet() {
    const entries = cartEntries();
    el.cartItemsList.innerHTML = entries.length
      ? entries.map((it) => `
        <div class="cart-row">
          <span class="emoji">${it.emoji}</span>
          <span class="name">${it.name}</span>
          <div class="stepper" data-id="${it.id}">
            <button data-action="dec">−</button>
            <span>${it.qty}</span>
            <button data-action="inc">+</button>
          </div>
          <span class="row-price">${formatCurrency(it.price * it.qty)}</span>
        </div>`).join('')
      : `<p style="color:var(--color-text-muted); font-size:13px;">سلتك فارغة، أضف أطباقاً من المنيو.</p>`;

    el.cartItemsList.querySelectorAll('.stepper').forEach((stepper) => {
      const id = stepper.dataset.id;
      stepper.querySelector('[data-action="dec"]').addEventListener('click', () => { changeQty(id, -1); renderCartSheet(); });
      stepper.querySelector('[data-action="inc"]').addEventListener('click', () => { changeQty(id, 1); renderCartSheet(); });
    });

    el.cartTotal.textContent = formatCurrency(cartTotal());
  }

  function openCart() {
    renderCartSheet();
    el.cartOverlay.classList.add('open');
  }
  function closeCart() {
    el.cartOverlay.classList.remove('open');
  }

  el.cartIconBtn.addEventListener('click', openCart);
  el.cartBar.addEventListener('click', openCart);
  el.closeCartBtn.addEventListener('click', closeCart);
  el.cartOverlay.addEventListener('click', (e) => { if (e.target === el.cartOverlay) closeCart(); });

  el.submitOrderBtn.addEventListener('click', () => {
    const entries = cartEntries();
    if (entries.length === 0) { showToast('السلة فارغة'); return; }
    const tableNumber = el.tableNumber.value.trim();
    if (!tableNumber) {
      showToast('رقم الطاولة مطلوب');
      el.tableNumber.focus();
      return;
    }
    const notes = el.orderNotes.value.trim();

    localStorage.setItem('shami_table_number', tableNumber);

    el.submitOrderBtn.disabled = true;
    el.submitOrderBtn.textContent = 'جاري الإرسال...';

    socket.emit('order:create', {
      items: entries.map((it) => ({ id: it.id, qty: it.qty })),
      tableNumber,
      notes,
    }, (res) => {
      el.submitOrderBtn.disabled = false;
      el.submitOrderBtn.textContent = 'إرسال الطلب للمطبخ';
      if (!res.ok) { showToast('تعذر إرسال الطلب: ' + res.error); return; }

      state.cart = {};
      state.myOrders.set(res.order.id, res.order);
      renderGrid();
      updateCartBar();
      renderMyOrders();
      closeCart();
      el.orderNotes.value = '';
      showToast('تم إرسال طلبك للمطبخ ✅');
    });
  });

  function progressIndex(status) {
    if (status === 'rejected') return -1;
    return STATUS_ORDER.indexOf(status);
  }

  function renderMyOrders() {
    const list = [...state.myOrders.values()].sort((a, b) => b.createdAt - a.createdAt);

    el.myOrdersTitle.style.display = list.length ? 'block' : 'none';
    el.myOrders.innerHTML = list.map((order) => {
      const idx = progressIndex(order.status);
      const segs = STATUS_ORDER.map((_, i) => `<div class="seg ${idx >= 0 && i <= idx ? 'done' : ''}"></div>`).join('');
      const itemsText = order.items.map((it) => `${it.emoji} ${it.name} ×${it.qty}`).join('، ');
      return `
        <div class="order-card">
          <div class="head">
            <span class="oid">${order.id}</span>
            <span class="time">${formatTime(order.createdAt)}</span>
          </div>
          <span class="status-pill status-${order.status}">${order.statusLabel}</span>
          ${order.status === 'rejected' ? '' : `<div class="progress-track">${segs}</div>`}
          <div class="order-items-mini">${itemsText}</div>
          <div class="order-items-mini" style="margin-top:4px; font-weight:700;">${formatCurrency(order.total)}</div>
        </div>`;
    }).join('');
  }

  function loadMyOrdersFromServer() {
    socket.emit('orders:sync', {}, (all) => {
      all.forEach((order) => state.myOrders.set(order.id, order));
      renderMyOrders();
    });
  }

  (async function init() {
    const user = await loadMe();
    if (!user) return;
    await loadMenu();
    socket.on('connect', loadMyOrdersFromServer);
    if (sessionStorage.getItem('shami_show_welcome')) {
      sessionStorage.removeItem('shami_show_welcome');
      showToast('يا مرحبا نورت المطعم 🤍');
    }
  })();
})();
