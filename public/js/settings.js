(function () {
  const soundToggle = document.getElementById('soundToggle');
  const darkToggle = document.getElementById('darkToggle');
  const backBtn = document.getElementById('backBtn');
  const langSelect = document.getElementById('langSelect');
  const supportLink = document.getElementById('supportLink');

  supportLink.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      window.location.href = data.ok && data.user.role === 'kitchen' ? '/support.html' : '/menu.html#chat';
    } catch (err) {
      window.location.href = '/menu.html#chat';
    }
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
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      window.location.href = data.ok && data.user.role === 'kitchen' ? '/kitchen.html' : '/menu.html';
    } catch (err) {
      window.location.href = '/menu.html';
    }
  });

  const logoutRow = document.getElementById('logoutRow');
  logoutRow.addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/index.html';
  });
})();
