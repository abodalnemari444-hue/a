(function () {
  const state = { mode: 'login', role: 'customer', pendingEmail: null };

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
    togglePassword: document.getElementById('togglePassword'),

    verifyForm: document.getElementById('verifyForm'),
    verifyEmailLabel: document.getElementById('verifyEmailLabel'),
    fCode: document.getElementById('fCode'),
    verifyError: document.getElementById('verifyError'),
    verifySubmit: document.getElementById('verifySubmit'),
    resendCodeBtn: document.getElementById('resendCodeBtn'),
    backToFormBtn: document.getElementById('backToFormBtn'),
  };

  el.togglePassword.addEventListener('click', () => {
    const hidden = el.fPassword.type === 'password';
    el.fPassword.type = hidden ? 'text' : 'password';
    el.togglePassword.textContent = hidden ? '🙈' : '👁️';
    el.togglePassword.setAttribute('aria-label', hidden ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور');
  });

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

  function showVerifyStep(email, phone, fallback) {
    state.pendingEmail = email;
    el.verifyEmailLabel.textContent = phone || email;
    document.querySelector('.auth-tabs').style.display = 'none';
    document.getElementById('roleSegment').style.display = 'none';
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
    state.pendingEmail = null;
    document.querySelector('.auth-tabs').style.display = 'flex';
    document.getElementById('roleSegment').style.display = 'flex';
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
      el.submit.disabled = false;
      if (data.pendingVerification) {
        showVerifyStep(data.email, data.phone, data);
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
        body: JSON.stringify({ email: state.pendingEmail, code: el.fCode.value.trim() }),
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
      el.resendCodeBtn.textContent = `إعادة الإرسال بعد ${remaining} ثانية`;
      setTimeout(tickResendBtn, 1000);
    } else {
      el.resendCodeBtn.disabled = false;
      el.resendCodeBtn.textContent = 'إعادة إرسال الرمز';
    }
  }

  el.resendCodeBtn.addEventListener('click', async () => {
    el.resendCodeBtn.disabled = true;
    try {
      const res = await fetch('/api/auth/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: state.pendingEmail }),
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
})();
