var API = 'http://localhost:3001/api';

async function requireAuth() {
  try {
    const res = await fetch(API + '/auth/me', { credentials: 'include' });
    if (!res.ok) throw new Error();
    const { user } = await res.json();
    return user;
  } catch {
    window.location.replace('/index.html');
  }
}

async function initNav(user) {
  if (!user) return;

  const avatar = document.getElementById('nav-avatar');
  const ddName  = document.getElementById('dd-name');
  const ddEmail = document.getElementById('dd-email');

  if (avatar) {
    const initiales = user.raison_sociale
      .split(' ')
      .slice(0, 2)
      .map(w => w[0].toUpperCase())
      .join('');
    avatar.textContent = initiales;
  }
  if (ddName)  ddName.textContent  = user.raison_sociale;
  if (ddEmail) ddEmail.textContent = user.email;

  // Fermer le dropdown en cliquant ailleurs
  // Notifications — chargement immédiat puis toutes les 30s
  await loadNotifications();
  setInterval(loadNotifications, 30000);

  document.addEventListener('click', function(e) {
    const wrap = document.querySelector('.avatar-wrap');
    if (wrap && !wrap.contains(e.target)) closeDropdown();
  });

  // Recherche navbar
  var searchInput = document.querySelector('.navbar-search input[type="search"]');
  if (searchInput) {
    // Pré-remplir si on arrive depuis une recherche
    var qParam = new URLSearchParams(window.location.search).get('q');
    if (qParam) searchInput.value = qParam;

    searchInput.addEventListener('keydown', function(e) {
      if (e.key !== 'Enter') return;
      var q = searchInput.value.trim();
      if (!q) return;
      var isMarketplace = window.location.pathname.endsWith('marketplace.html') || window.location.pathname === '/';
      if (isMarketplace && typeof loadProduits === 'function') {
        // Déjà sur le catalogue — on injecte dans les filtres actifs
        activeFilters.q = q;
        loadProduits();
      } else {
        window.location.href = '/marketplace.html?q=' + encodeURIComponent(q);
      }
    });
  }
}

function toggleDropdown() {
  document.getElementById('avatar-dropdown').classList.toggle('open');
}

function closeDropdown() {
  const dd = document.getElementById('avatar-dropdown');
  if (dd) dd.classList.remove('open');
}

async function loadNotifications() {
  try {
    var res  = await fetch(API + '/messages/unread', { credentials: 'include' });
    var data = await res.json();
    var badge = document.getElementById('msg-badge');
    if (!badge) return;
    if (data.total > 0) {
      badge.textContent = data.total > 99 ? '99+' : data.total;
      badge.style.display = 'block';
    } else {
      badge.style.display = 'none';
    }
  } catch {}
}

async function logout() {
  await fetch(API + '/auth/logout', { method: 'POST', credentials: 'include' });
  window.location.replace('/index.html');
}
