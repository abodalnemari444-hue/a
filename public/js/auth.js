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
    choiceSupport: document.getElementById('choiceSupport'),

    forgotPasswordBtn: document.getElementById('forgotPasswordBtn'),
    forgotPhoneForm: document.getElementById('forgotPhoneForm'),
    forgotPhone: document.getElementById('forgotPhone'),
    forgotError: document.getElementById('forgotError'),
    forgotSubmit: document.getElementById('forgotSubmit'),
    forgotBackBtn: document.getElementById('forgotBackBtn'),

    resetPasswordForm: document.getElementById('resetPasswordForm'),
    resetPhoneLabel: document.getElementById('resetPhoneLabel'),
    resetCode: document.getElementById('resetCode'),
    resetNewPassword: document.getElementById('resetNewPassword'),
    resetConfirmPassword: document.getElementById('resetConfirmPassword'),
    resetError: document.getElementById('resetError'),
    resetSubmit: document.getElementById('resetSubmit'),
    resetResendBtn: document.getElementById('resetResendBtn'),
    resetBackBtn: document.getElementById('resetBackBtn'),
  };

  document.querySelectorAll('.toggle-password[data-target]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);
      const hidden = input.type === 'password';
      input.type = hidden ? 'text' : 'password';
      btn.textContent = hidden ? '🙈' : '👁️';
    });
  });

  function showViewChoice() {
    document.querySelector('.auth-tabs').style.display = 'none';
    el.form.style.display = 'none';
    el.viewChoice.style.display = 'block';
  }

  async function chooseView(role, destination) {
    try {
      const res = await fetch('/api/auth/set-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!data.ok) { showError(data.error || 'حدث خطأ'); return; }
      sessionStorage.setItem('shami_show_welcome', '1');
      window.location.href = destination;
    } catch (err) {
      showError('تعذر الاتصال بالسيرفر');
    }
  }

  el.choiceKitchen.addEventListener('click', () => chooseView('kitchen', '/kitchen.html'));
  el.choiceCustomer.addEventListener('click', () => chooseView('customer', '/menu.html'));
  el.choiceSupport.addEventListener('click', () => chooseView('kitchen', '/support.html'));

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
    el.forgotPasswordBtn.style.display = isRegister ? 'none' : 'block';
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
      sessionStorage.setItem('shami_show_welcome', '1');
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
      sessionStorage.setItem('shami_show_welcome', '1');
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

  // ---------------------------------------------------------------------------
  // نسيت كلمة المرور
  // ---------------------------------------------------------------------------

  let resetPhone = null;

  function showForgotPhoneForm() {
    document.querySelector('.auth-tabs').style.display = 'none';
    el.form.style.display = 'none';
    el.forgotError.style.display = 'none';
    el.forgotPhone.value = el.fPhone.value.trim();
    el.forgotPhoneForm.style.display = 'block';
  }
  el.forgotPasswordBtn.addEventListener('click', showForgotPhoneForm);

  function backToLoginFromForgot() {
    resetPhone = null;
    el.forgotPhoneForm.style.display = 'none';
    el.resetPasswordForm.style.display = 'none';
    document.querySelector('.auth-tabs').style.display = 'flex';
    el.form.style.display = 'block';
  }
  el.forgotBackBtn.addEventListener('click', backToLoginFromForgot);
  el.resetBackBtn.addEventListener('click', backToLoginFromForgot);

  function showForgotError(msg) {
    el.forgotError.textContent = msg;
    el.forgotError.style.display = 'block';
  }
  function showResetError(msg) {
    el.resetError.textContent = msg;
    el.resetError.style.display = 'block';
  }

  function showResetPasswordStep(phone, fallback) {
    resetPhone = phone;
    el.resetPhoneLabel.textContent = phone;
    el.forgotPhoneForm.style.display = 'none';
    el.resetPasswordForm.style.display = 'block';
    el.resetError.style.display = 'none';
    el.resetCode.value = '';
    el.resetNewPassword.value = '';
    el.resetConfirmPassword.value = '';
    if (fallback && fallback.smsFailed) {
      el.resetCode.value = fallback.devCode;
      showResetError('تعذر إرسال الرسالة النصية فعلياً، لذا يظهر الرمز مباشرة هنا كبديل مؤقت: ' + fallback.devCode);
    }
    el.resetCode.focus();
  }

  el.forgotPhoneForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    el.forgotError.style.display = 'none';
    el.forgotSubmit.disabled = true;
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: el.forgotPhone.value.trim() }),
      });
      const data = await res.json();
      if (!data.ok) {
        showForgotError(data.error || 'حدث خطأ، حاول مرة أخرى');
        return;
      }
      showResetPasswordStep(data.phone, data);
    } catch (err) {
      showForgotError('تعذر الاتصال بالسيرفر');
    } finally {
      el.forgotSubmit.disabled = false;
    }
  });

  el.resetPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    el.resetError.style.display = 'none';

    if (el.resetNewPassword.value !== el.resetConfirmPassword.value) {
      showResetError('كلمة المرور الجديدة وتأكيدها غير متطابقين');
      return;
    }

    el.resetSubmit.disabled = true;
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: resetPhone,
          code: el.resetCode.value.trim(),
          newPassword: el.resetNewPassword.value,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        showResetError(data.error || 'تعذر تحديث كلمة المرور');
        return;
      }

      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: resetPhone, password: el.resetNewPassword.value }),
      });
      const loginData = await loginRes.json();
      showToast('تم تحديث كلمة المرور ✅');
      if (loginData.ok) {
        if (loginData.canChooseView) {
          resetPhone = null;
          el.resetPasswordForm.style.display = 'none';
          showViewChoice();
          return;
        }
        sessionStorage.setItem('shami_show_welcome', '1');
        window.location.href = loginData.user.role === 'kitchen' ? '/kitchen.html' : '/menu.html';
        return;
      }
      backToLoginFromForgot();
    } catch (err) {
      showResetError('تعذر الاتصال بالسيرفر');
    } finally {
      el.resetSubmit.disabled = false;
    }
  });

  let resetResendCooldownUntil = 0;
  function tickResetResendBtn() {
    const remaining = Math.ceil((resetResendCooldownUntil - Date.now()) / 1000);
    if (remaining > 0) {
      el.resetResendBtn.disabled = true;
      el.resetResendBtn.textContent = `⏳ ${remaining}s`;
      setTimeout(tickResetResendBtn, 1000);
    } else {
      el.resetResendBtn.disabled = false;
      el.resetResendBtn.textContent = 'لم يصلني الرمز؟ إعادة الإرسال';
    }
  }

  el.resetResendBtn.addEventListener('click', async () => {
    el.resetResendBtn.disabled = true;
    try {
      const res = await fetch('/api/auth/forgot-password/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: resetPhone }),
      });
      const data = await res.json();
      if (!data.ok) {
        showResetError(data.error || 'تعذر إعادة الإرسال');
        resetResendCooldownUntil = Date.now() + (data.retryAfterMs || 0);
        tickResetResendBtn();
        return;
      }
      if (data.smsFailed) {
        el.resetCode.value = data.devCode;
        showResetError('تعذر إرسال الرسالة فعلياً، الرمز الجديد: ' + data.devCode);
      } else {
        showToast('تم إرسال رمز جديد إلى جوالك');
      }
      resetResendCooldownUntil = Date.now() + 45000;
      tickResetResendBtn();
    } catch (err) {
      showResetError('تعذر الاتصال بالسيرفر');
      el.resetResendBtn.disabled = false;
    }
  });

  applyMode();
  tickResendBtn();
})();
