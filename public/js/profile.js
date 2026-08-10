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
})();
