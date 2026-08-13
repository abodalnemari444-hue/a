(function () {
  const backBtn = document.getElementById('backBtn');
  const profileName = document.getElementById('profileName');
  const profileRoleBadge = document.getElementById('profileRoleBadge');
  const profilePhone = document.getElementById('profilePhone');
  const profileSince = document.getElementById('profileSince');

  const ROLE_LABELS = { customer: 'عميل', kitchen: 'طاقم المطبخ' };

  async function loadProfile() {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) { window.location.href = '/index.html'; return; }
      const { user } = await res.json();
      profileName.textContent = user.name;
      profileRoleBadge.textContent = ROLE_LABELS[user.role] || user.role;
      profilePhone.textContent = user.phone;
      profileSince.textContent = user.createdAt
        ? new Date(user.createdAt).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })
        : '—';
    } catch (err) {
      window.location.href = '/index.html';
    }
  }

  backBtn.addEventListener('click', () => {
    window.location.href = '/settings.html';
  });

  loadProfile();

  document.querySelectorAll('.toggle-password[data-target]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);
      const hidden = input.type === 'password';
      input.type = hidden ? 'text' : 'password';
      btn.textContent = hidden ? '🙈' : '👁️';
    });
  });

  const changePasswordRow = document.getElementById('changePasswordRow');
  const changePasswordOverlay = document.getElementById('changePasswordOverlay');
  const closeChangePasswordBtn = document.getElementById('closeChangePasswordBtn');
  const changePasswordForm = document.getElementById('changePasswordForm');
  const currentPassword = document.getElementById('currentPassword');
  const newPassword = document.getElementById('newPassword');
  const confirmPassword = document.getElementById('confirmPassword');
  const passwordError = document.getElementById('passwordError');
  const changePasswordBtn = document.getElementById('changePasswordBtn');

  function openChangePassword() {
    changePasswordForm.reset();
    passwordError.style.display = 'none';
    changePasswordOverlay.classList.add('open');
  }
  function closeChangePassword() {
    changePasswordOverlay.classList.remove('open');
  }
  changePasswordRow.addEventListener('click', openChangePassword);
  closeChangePasswordBtn.addEventListener('click', closeChangePassword);
  changePasswordOverlay.addEventListener('click', (e) => { if (e.target === changePasswordOverlay) closeChangePassword(); });

  function showPasswordError(msg) {
    passwordError.textContent = msg;
    passwordError.style.display = 'block';
  }

  changePasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    passwordError.style.display = 'none';

    if (newPassword.value !== confirmPassword.value) {
      showPasswordError('كلمة المرور الجديدة وتأكيدها غير متطابقين');
      return;
    }

    changePasswordBtn.disabled = true;
    changePasswordBtn.textContent = 'جاري التحديث...';
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: currentPassword.value,
          newPassword: newPassword.value,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        showPasswordError(data.error || 'تعذر تحديث كلمة المرور');
        return;
      }
      changePasswordForm.reset();
      closeChangePassword();
      showToast('تم تحديث كلمة المرور ✅');
    } catch (err) {
      showPasswordError('تعذر الاتصال بالسيرفر');
    } finally {
      changePasswordBtn.disabled = false;
      changePasswordBtn.textContent = 'تحديث كلمة المرور';
    }
  });
})();
