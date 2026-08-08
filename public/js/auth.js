(function () {
  const state = { mode: 'login', role: 'customer' };

  const el = {
    tabs: document.querySelectorAll('.auth-tab'),
    roleSegment: document.getElementById('roleSegment'),
    roleBtns: document.querySelectorAll('.seg-btn'),
    nameField: document.getElementById('nameField'),
    phoneField: document.getElementById('phoneField'),
    fName: document.getElementById('fName'),
    fEmail: document.getElementById('fEmail'),
    fPhone: document.getElementById('fPhone'),
    fPassword: document.getElementById('fPassword'),
    form: document.getElementById('authForm'),
    submit: document.getElementById('authSubmit'),
    error: document.getElementById('authError'),
  };

  function applyMode() {
    const isRegister = state.mode === 'register';
    el.nameField.style.display = isRegister ? 'block' : 'none';
    el.phoneField.style.display = isRegister ? 'block' : 'none';
    el.fName.required = isRegister;
    el.fPhone.required = isRegister;
    el.submit.textContent = isRegister ? 'إنشاء الحساب' : 'دخول';
    el.error.style.display = 'none';
  }

  el.tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      state.mode = tab.dataset.mode;
      el.tabs.forEach((t) => t.classList.toggle('active', t === tab));
      applyMode();
    });
  });

  el.roleBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      state.role = btn.dataset.role;
      el.roleBtns.forEach((b) => b.classList.toggle('active', b === btn));
    });
  });

  function showError(msg) {
    el.error.textContent = msg;
    el.error.style.display = 'block';
  }

  el.form.addEventListener('submit', async (e) => {
    e.preventDefault();
    el.error.style.display = 'none';
    el.submit.disabled = true;

    const isRegister = state.mode === 'register';
    const body = {
      email: el.fEmail.value.trim(),
      password: el.fPassword.value,
    };
    if (isRegister) {
      body.name = el.fName.value.trim();
      body.phone = el.fPhone.value.trim();
      body.role = state.role;
    }

    try {
      const res = await fetch(isRegister ? '/api/auth/register' : '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.ok) {
        showError(data.error || 'حدث خطأ، حاول مرة أخرى');
        el.submit.disabled = false;
        return;
      }
      window.location.href = data.user.role === 'kitchen' ? '/kitchen.html' : '/menu.html';
    } catch (err) {
      showError('تعذر الاتصال بالسيرفر');
      el.submit.disabled = false;
    }
  });

  applyMode();
})();
