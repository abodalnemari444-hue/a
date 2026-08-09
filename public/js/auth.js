(function () {
  const state = { mode: 'login', role: 'customer', pendingPhone: null };

  const el = {
    tabs: document.querySelectorAll('.auth-tab'),
    nameField: document.getElementById('nameField'),
    fName: document.getElementById('fName'),
    fPhone: document.getElementById('fPhone'),
    fPassword: document.getElementById('fPassword'),
    form: document.getElementById('authForm'),
    submit: document.getElementById('authSubmit'),
    error: document.getElementById('authError'),
    togglePassword: document.getElementById('togglePassword'),

    verifyForm: document.getElementById('verifyForm'),
    verifyPhoneLabel: document.getElementById('verifyPhoneLabel'),
    fCode: document.getElementById('fCode'),
    verifyError: document.getElementById('verifyError'),
    verifySubmit: document.getElementById('verifySubmit'),
    resendCodeBtn: document.getElementById('resendCodeBtn'),
    backToFormBtn: document.getElementById('backToFormBtn'),

    viewChoice: document.getElementById('viewChoice'),
    choiceKitchen: document.getElementById('choiceKitchen'),
    choiceCustomer: document.getElementById('choiceCustomer'),
  };

  function showViewChoice() {
    document.querySelector('.auth-tabs').style.display = 'none';
    el.form.style.display = 'none';
    el.viewChoice.style.display = 'block';
  }

  async function chooseView(role) {
    try {
      const res = await fetch('/api/auth/set-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!data.ok) { showError(data.error || 'حدث خطأ'); return; }
      window.location.href = role === 'kitchen' ? '/kitchen.html' : '/menu.html';
    } catch (err) {
      showError('تعذر الاتصال بالسيرفر');
    }
  }

  el.choiceKitchen.addEventListener('click', () => chooseView('kitchen'));
  el.choiceCustomer.addEventListener('click', () => chooseView('customer'));

  el.togglePassword.addEventListener('click', () => {
    const hidden = el.fPassword.type === 'password';
    el.fPassword.type = hidden ? 'text' : 'password';
    el.togglePassword.textContent = hidden ? '🙈' : '👁️';
    el.togglePassword.setAttribute('aria-label', hidden ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور');
  });

  function t() {
    const i18n = window.ShamiI18n;
    return i18n ? i18n.dict[i18n.currentLang()] || i18n.dict.ar : null;
  }

  function applyMode() {
    const isRegister = state.mode === 'register';
    el.nameField.style.display = isRegister ? 'block' : 'none';
    el.fName.required = isRegister;
    const dict = t();
    el.submit.textContent = dict ? (isRegister ? dict.btn_create_account : dict.btn_login) : (isRegister ? 'إنشاء الحساب' : 'دخول');
    el.error.style.display = 'none';
  }

  el.tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      state.mode = tab.dataset.mode;
      el.tabs.forEach((t) => t.classList.toggle('active', t === tab));
      applyMode();
    });
  });

  function showError(msg) {
    el.error.textContent = msg;
    el.error.style.display = 'block';
  }

  function showVerifyStep(phone, fallback) {
    state.pendingPhone = phone;
    el.verifyPhoneLabel.textContent = phone;
    document.querySelector('.auth-tabs').style.display = 'none';
    el.form.style.display = 'none';
    el.verifyForm.style.display = 'block';
    el.verifyError.style.display = 'none';
    if (fallback && fallback.smsFailed) {
      el.fCode.value = fallback.devCode;
      showVerifyError('تعذر إرسال الرسالة النصية فعلياً (لا توجد بيانات SMS)، لذا يظهر الرمز مباشرة هنا كبديل مؤقت: ' + fallback.devCode);
    } else {
      el.fCode.value = '';
    }
    el.fCode.focus();
  }

  function backToForm() {
    state.pendingPhone = null;
    document.querySelector('.auth-tabs').style.display = 'flex';
    el.verifyForm.style.display = 'none';
    el.form.style.display = 'block';
  }
  el.backToFormBtn.addEventListener('click', backToForm);

  el.form.addEventListener('submit', async (e) => {
    e.preventDefault();
    el.error.style.display = 'none';
    el.submit.disabled = true;

    const isRegister = state.mode === 'register';
    const body = {
      phone: el.fPhone.value.trim(),
      password: el.fPassword.value,
    };
    if (isRegister) {
      body.name = el.fName.value.trim();
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
      el.submit.disabled = false;
      if (data.pendingVerification) {
        showVerifyStep(data.phone, data);
        return;
      }
      if (data.canChooseView) {
        showViewChoice();
        return;
      }
      window.location.href = data.user.role === 'kitchen' ? '/kitchen.html' : '/menu.html';
    } catch (err) {
      showError('تعذر الاتصال بالسيرفر');
      el.submit.disabled = false;
    }
  });

  function showVerifyError(msg) {
    el.verifyError.textContent = msg;
    el.verifyError.style.display = 'block';
  }

  el.verifyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    el.verifyError.style.display = 'none';
    el.verifySubmit.disabled = true;
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: state.pendingPhone, code: el.fCode.value.trim() }),
      });
      const data = await res.json();
      if (!data.ok) {
        showVerifyError(data.error || 'رمز غير صحيح');
        el.verifySubmit.disabled = false;
        return;
      }
      window.location.href = data.user.role === 'kitchen' ? '/kitchen.html' : '/menu.html';
    } catch (err) {
      showVerifyError('تعذر الاتصال بالسيرفر');
      el.verifySubmit.disabled = false;
    }
  });

  let resendCooldownUntil = 0;
  function tickResendBtn() {
    const remaining = Math.ceil((resendCooldownUntil - Date.now()) / 1000);
    if (remaining > 0) {
      el.resendCodeBtn.disabled = true;
      el.resendCodeBtn.textContent = `⏳ ${remaining}s`;
      setTimeout(tickResendBtn, 1000);
    } else {
      const dict = t();
      el.resendCodeBtn.disabled = false;
      el.resendCodeBtn.textContent = dict ? dict.btn_resend : 'لم يصلني الرمز؟ إعادة الإرسال';
    }
  }

  el.resendCodeBtn.addEventListener('click', async () => {
    el.resendCodeBtn.disabled = true;
    try {
      const res = await fetch('/api/auth/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: state.pendingPhone }),
      });
      const data = await res.json();
      if (!data.ok) {
        showVerifyError(data.error || 'تعذر إعادة الإرسال');
        resendCooldownUntil = Date.now() + (data.retryAfterMs || 0);
        tickResendBtn();
        return;
      }
      if (data.smsFailed) {
        el.fCode.value = data.devCode;
        showVerifyError('تعذر إرسال الرسالة فعلياً، الرمز الجديد: ' + data.devCode);
      } else {
        showToast('تم إرسال رمز جديد إلى جوالك');
      }
      resendCooldownUntil = Date.now() + 45000;
      tickResendBtn();
    } catch (err) {
      showVerifyError('تعذر الاتصال بالسيرفر');
      el.resendCodeBtn.disabled = false;
    }
  });

  applyMode();
  tickResendBtn();
})();
