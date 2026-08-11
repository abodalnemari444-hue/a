(function () {
  const chatIconBtn = document.getElementById('chatIconBtn');
  const chatOverlay = document.getElementById('chatOverlay');
  if (!chatIconBtn || !chatOverlay) return;

  const isKitchenPage = !!document.getElementById('chatThreadList');
  const chatBadge = document.getElementById('chatBadge');
  const chatMessages = document.getElementById('chatMessages');
  const chatInput = document.getElementById('chatInput');
  const chatSendBtn = document.getElementById('chatSendBtn');

  const socket = io();
  let activeCustomerId = null; // للمشرف فقط: المحادثة المفتوحة حالياً

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function renderMessages(messages, mySender) {
    chatMessages.innerHTML = messages.length
      ? messages.map((m) => `
        <div class="chat-bubble ${m.sender === mySender ? 'mine' : 'theirs'}">
          ${escapeHtml(m.text)}
          <span class="c-time">${formatTime(m.createdAt)}</span>
        </div>`).join('')
      : `<div class="chat-empty">ابدأ المحادثة بإرسال رسالة</div>`;
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function openOverlay() { chatOverlay.classList.add('open'); }
  function closeOverlay() { chatOverlay.classList.remove('open'); }
  chatOverlay.addEventListener('click', (e) => { if (e.target === chatOverlay) closeOverlay(); });

  if (!isKitchenPage) {
    // ---------------- وضع العميل: محادثة واحدة مع خدمة العملاء ----------------
    function refreshHistory() {
      socket.emit('chat:history', {}, (res) => {
        if (res.ok) renderMessages(res.messages, 'customer');
      });
    }

    chatIconBtn.addEventListener('click', () => {
      openOverlay();
      refreshHistory();
      socket.emit('chat:read', {});
      chatBadge.style.display = 'none';
    });

    function sendCustomerMessage(overrideText) {
      const text = (overrideText ?? chatInput.value).trim();
      if (!text) return;
      chatInput.value = '';
      socket.emit('chat:send', { text }, (res) => {
        if (!res.ok) showToast('تعذر إرسال الرسالة: ' + res.error);
      });
    }
    chatSendBtn.addEventListener('click', () => sendCustomerMessage());
    chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendCustomerMessage(); });

    const chatQuickOptions = document.getElementById('chatQuickOptions');
    if (chatQuickOptions) {
      chatQuickOptions.querySelectorAll('.chat-quick-btn').forEach((btn) => {
        btn.addEventListener('click', () => sendCustomerMessage(btn.dataset.msg));
      });
    }

    // فتح المحادثة تلقائياً لو وصلنا من رابط خارجي مثل /menu.html#chat
    if (location.hash === '#chat') chatIconBtn.click();

    socket.on('chat:message', ({ message }) => {
      if (chatOverlay.classList.contains('open')) {
        refreshHistory();
        socket.emit('chat:read', {});
      } else if (message.sender === 'admin') {
        chatBadge.style.display = 'flex';
        chatBadge.textContent = '•';
        showToast('رسالة جديدة من خدمة العملاء 💬');
      }
    });
  } else {
    // ---------------- وضع المطبخ/المشرف: قائمة محادثات + عرض واحدة ----------------
    const chatListView = document.getElementById('chatListView');
    const chatThreadView = document.getElementById('chatThreadView');
    const chatThreadList = document.getElementById('chatThreadList');
    const chatThreadName = document.getElementById('chatThreadName');
    const chatBackBtn = document.getElementById('chatBackBtn');

    function renderThreadList(threads) {
      const totalUnread = threads.reduce((s, t) => s + t.unreadForAdmin, 0);
      chatBadge.style.display = totalUnread > 0 ? 'flex' : 'none';
      chatBadge.textContent = totalUnread;

      chatThreadList.innerHTML = threads.length
        ? threads.map((t) => `
          <button class="chat-thread-item" data-id="${t.customerId}" data-name="${escapeHtml(t.customerName)}">
            <div class="t-avatar">🧑</div>
            <div class="t-info">
              <div class="t-name">${escapeHtml(t.customerName)}</div>
              <div class="t-last">${escapeHtml(t.lastMessage || 'لا رسائل بعد')}</div>
            </div>
            ${t.unreadForAdmin > 0 ? `<span class="t-unread">${t.unreadForAdmin}</span>` : ''}
          </button>`).join('')
        : `<div class="chat-empty">لا توجد محادثات بعد</div>`;

      chatThreadList.querySelectorAll('.chat-thread-item').forEach((btn) => {
        btn.addEventListener('click', () => openThread(btn.dataset.id, btn.dataset.name));
      });
    }

    function openThread(customerId, name) {
      activeCustomerId = customerId;
      chatThreadName.textContent = name;
      chatListView.style.display = 'none';
      chatThreadView.style.display = 'flex';
      socket.emit('chat:history', { customerId }, (res) => {
        if (res.ok) renderMessages(res.messages, 'admin');
      });
      socket.emit('chat:read', { customerId });
    }

    chatBackBtn.addEventListener('click', () => {
      activeCustomerId = null;
      chatThreadView.style.display = 'none';
      chatListView.style.display = 'block';
    });

    chatIconBtn.addEventListener('click', () => {
      openOverlay();
      activeCustomerId = null;
      chatThreadView.style.display = 'none';
      chatListView.style.display = 'block';
      socket.emit('chat:threads', {}, (threads) => renderThreadList(threads));
    });

    function sendAdminMessage() {
      const text = chatInput.value.trim();
      if (!text || !activeCustomerId) return;
      chatInput.value = '';
      socket.emit('chat:send', { text, customerId: activeCustomerId }, (res) => {
        if (!res.ok) showToast('تعذر إرسال الرسالة: ' + res.error);
      });
    }
    chatSendBtn.addEventListener('click', sendAdminMessage);
    chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendAdminMessage(); });

    socket.on('chat:threads', (threads) => renderThreadList(threads));

    socket.on('chat:message', ({ customerId, message }) => {
      if (activeCustomerId === customerId && chatOverlay.classList.contains('open')) {
        socket.emit('chat:history', { customerId }, (res) => {
          if (res.ok) renderMessages(res.messages, 'admin');
        });
        socket.emit('chat:read', { customerId });
      } else if (message.sender === 'customer') {
        showToast('رسالة جديدة من عميل 💬');
      }
    });

    socket.on('connect', () => {
      socket.emit('chat:threads', {}, (threads) => renderThreadList(threads));
    });
  }
})();
