(function () {
  const soundToggle = document.getElementById('soundToggle');
  const darkToggle = document.getElementById('darkToggle');
  const backBtn = document.getElementById('backBtn');
  const langSelect = document.getElementById('langSelect');
  const supportLink = document.getElementById('supportLink');
  const adminSectionTitle = document.getElementById('adminSectionTitle');
  const adminSwitchSection = document.getElementById('adminSwitchSection');
  const switchToKitchenBtn = document.getElementById('switchToKitchenBtn');
  const switchToCustomerBtn = document.getElementById('switchToCustomerBtn');
  const switchToSupportBtn = document.getElementById('switchToSupportBtn');

  let me = null;
  const meLoaded = fetch('/api/auth/me').then((r) => r.json()).then((data) => {
    me = data.ok ? data.user : null;
    if (me && me.role === 'kitchen') {
      adminSectionTitle.style.display = 'block';
      adminSwitchSection.style.display = 'flex';
      adminSwitchSection.style.flexDirection = 'column';
    }
    return me;
  }).catch(() => null);

  async function switchAdminView(viewRole, destination) {
    await fetch('/api/auth/set-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: viewRole }),
    });
    window.location.href = destination;
  }
  switchToKitchenBtn.addEventListener('click', () => switchAdminView('kitchen', '/kitchen.html'));
  switchToCustomerBtn.addEventListener('click', () => switchAdminView('customer', '/menu.html'));
  switchToSupportBtn.addEventListener('click', () => switchAdminView('kitchen', '/support.html'));

  supportLink.addEventListener('click', async (e) => {
    e.preventDefault();
    await meLoaded;
    window.location.href = me && me.role === 'kitchen' ? '/support.html' : '/menu.html#chat';
  });

  if (window.ShamiI18n) {
    const { LANGUAGES, currentLang, applyLanguage } = window.ShamiI18n;
    langSelect.innerHTML = LANGUAGES.map((l) => `<option value="${l.code}">${l.name}</option>`).join('');
    langSelect.value = currentLang();
    langSelect.addEventListener('change', () => {
      localStorage.setItem('shami_lang', langSelect.value);
      applyLanguage(langSelect.value);
    });
  }

  const soundEnabled = localStorage.getItem('shami_sound_enabled') !== 'off';
  const darkEnabled = localStorage.getItem('shami_theme') === 'dark';

  soundToggle.classList.toggle('on', soundEnabled);
  darkToggle.classList.toggle('on', darkEnabled);

  soundToggle.addEventListener('click', () => {
    const next = !soundToggle.classList.contains('on');
    soundToggle.classList.toggle('on', next);
    localStorage.setItem('shami_sound_enabled', next ? 'on' : 'off');
  });

  darkToggle.addEventListener('click', () => {
    const next = !darkToggle.classList.contains('on');
    darkToggle.classList.toggle('on', next);
    localStorage.setItem('shami_theme', next ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
  });

  backBtn.addEventListener('click', async () => {
    await meLoaded;
    const active = me ? (me.activeRole || me.role) : 'customer';
    window.location.href = active === 'kitchen' ? '/kitchen.html' : '/menu.html';
  });

  const logoutRow = document.getElementById('logoutRow');
  logoutRow.addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/index.html';
  });
})();
