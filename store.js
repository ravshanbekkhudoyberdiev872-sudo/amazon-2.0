/* =========================================================
   store.js — shared state + UI wiring for every Kicks Lab page.
   Everything lives on localStorage, so this is a front-end-only
   demo: there is no server, so "accounts" are for prototyping
   the flow only and are NOT secure (passwords aren't hashed).
   ========================================================= */
(function (global) {
  'use strict';

  var LS_CART = 'kl-cart';
  var LS_FAV = 'kl-favorites';
  var LS_USERS = 'kl-users';
  var LS_SESSION = 'kl-session';
  var LS_THEME = 'kl-theme';
  var LS_LAST_ORDER = 'kl-last-order';

  /* ---------------------------------------------------------
     Product catalog — single source of truth for shop.html,
     favorites.html and the "you might also like" rows.
  --------------------------------------------------------- */
  var PRODUCTS = [
    {
      id: 'nova-runner', brand: 'RVLT', name: 'Nova Runner', price: 140, was: null,
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600&auto=format&fit=crop',
      href: 'product-nova-runner.html', category: 'running', dept: 'men', badge: 'new'
    },
    {
      id: 'lab-hoodie', brand: 'KICKS LAB', name: 'Lab Hoodie', price: 65, was: null,
      image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=600&auto=format&fit=crop',
      href: 'product-lab-hoodie.html', category: 'hoodies', dept: 'men', badge: 'new'
    },
    {
      id: 'adidas-samba-og', brand: 'Adidas', name: 'Samba OG', price: 100, was: null,
      image: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?q=80&w=600&auto=format&fit=crop',
      href: 'shop.html', category: 'lifestyle', dept: 'men', badge: null
    },
    {
      id: 'new-balance-550', brand: 'New Balance', name: '550', price: 104, was: 130,
      image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?q=80&w=600&auto=format&fit=crop',
      href: 'shop.html', category: 'lifestyle', dept: 'women', badge: 'sale'
    },
    {
      id: 'jordan-air-jordan-1-high-og', brand: 'Jordan', name: 'Air Jordan 1 High OG', price: 180, was: null,
      image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=600&auto=format&fit=crop',
      href: 'shop.html', category: 'basketball', dept: 'men', badge: 'new'
    },
    {
      id: 'asics-gel-kayano-14', brand: 'ASICS', name: 'Gel-Kayano 14', price: 150, was: null,
      image: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?q=80&w=600&auto=format&fit=crop',
      href: 'shop.html', category: 'running', dept: 'women', badge: null
    },
    {
      id: 'puma-speedcat-og', brand: 'Puma', name: 'Speedcat OG', price: 75, was: 100,
      image: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?q=80&w=600&auto=format&fit=crop',
      href: 'shop.html', category: 'lifestyle', dept: 'women', badge: 'sale'
    },
    {
      id: 'hoka-clifton-9', brand: 'Hoka', name: 'Clifton 9', price: 116, was: 145,
      image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?q=80&w=600&auto=format&fit=crop',
      href: 'shop.html', category: 'running', dept: 'men', badge: 'sale'
    }
  ];

  /* ---------------------------------------------------------
     tiny storage helpers
  --------------------------------------------------------- */
  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }

  /* ---------------------------------------------------------
     Cart
  --------------------------------------------------------- */
  function cartItems() { return read(LS_CART, []); }

  function addToCart(item) {
    var items = cartItems();
    var existing = items.find(function (i) { return i.id === item.id && i.size === item.size; });
    if (existing) {
      existing.qty = Math.min((existing.qty || 1) + (item.qty || 1), 10);
    } else {
      items.push(Object.assign({ qty: 1 }, item));
    }
    write(LS_CART, items);
    updateBadges();
    return items;
  }

  function removeFromCart(id, size) {
    var items = cartItems().filter(function (i) { return !(i.id === id && i.size === size); });
    write(LS_CART, items);
    updateBadges();
    return items;
  }

  function setQty(id, size, qty) {
    var items = cartItems();
    items.forEach(function (i) {
      if (i.id === id && i.size === size) i.qty = Math.max(1, Math.min(qty, 10));
    });
    write(LS_CART, items);
    updateBadges();
    return items;
  }

  function clearCart() { write(LS_CART, []); updateBadges(); }

  function cartCount() {
    return cartItems().reduce(function (sum, i) { return sum + (i.qty || 1); }, 0);
  }

  /* ---------------------------------------------------------
     Favorites
  --------------------------------------------------------- */
  function favItems() { return read(LS_FAV, []); }
  function isFav(id) { return favItems().some(function (i) { return i.id === id; }); }

  function toggleFav(item) {
    var items = favItems();
    var idx = items.findIndex(function (i) { return i.id === item.id; });
    var on;
    if (idx > -1) { items.splice(idx, 1); on = false; }
    else { items.push(item); on = true; }
    write(LS_FAV, items);
    updateBadges();
    return on;
  }

  function removeFav(id) {
    write(LS_FAV, favItems().filter(function (i) { return i.id !== id; }));
    updateBadges();
  }

  function favCount() { return favItems().length; }

  /* ---------------------------------------------------------
     Fake auth — localStorage only. Good enough to demo a
     "sign in to pay" gate; not a real credential store.
  --------------------------------------------------------- */
  function users() { return read(LS_USERS, {}); }
  function saveUsers(u) { write(LS_USERS, u); }

  function currentUser() {
    var email = read(LS_SESSION, null);
    if (!email) return null;
    var u = users()[email.toLowerCase()];
    if (!u) return null;
    return { name: u.name, email: u.email };
  }

  function isAuthed() { return !!currentUser(); }

  function signup(data) {
    var name = (data.name || '').trim();
    var email = (data.email || '').trim().toLowerCase();
    var password = data.password || '';
    if (!name) return { ok: false, error: 'Enter your name.' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'Enter a valid email.' };
    if (password.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' };
    var u = users();
    if (u[email]) return { ok: false, error: 'An account with that email already exists.' };
    u[email] = { name: name, email: email, password: password };
    saveUsers(u);
    write(LS_SESSION, email);
    updateBadges();
    return { ok: true, user: { name: name, email: email } };
  }

  function login(data) {
    var email = (data.email || '').trim().toLowerCase();
    var password = data.password || '';
    var u = users();
    var rec = u[email];
    if (!rec || rec.password !== password) return { ok: false, error: 'Incorrect email or password.' };
    write(LS_SESSION, email);
    updateBadges();
    return { ok: true, user: { name: rec.name, email: rec.email } };
  }

  function logout() {
    try { localStorage.removeItem(LS_SESSION); } catch (e) {}
    closeAccountPanel();
    updateBadges();
  }

  /* ---------------------------------------------------------
     Badges — cart / favorites counters + a11y labels
  --------------------------------------------------------- */
  function bumpEl(el) {
    if (!el) return;
    el.classList.remove('bump');
    void el.offsetWidth;
    el.classList.add('bump');
  }

  function updateBadges() {
    var cCount = cartCount();
    var fCount = favCount();

    document.querySelectorAll('.cart-badge').forEach(function (el) {
      var prev = el.textContent;
      el.textContent = String(cCount);
      el.dataset.zero = String(cCount === 0);
      if (prev !== String(cCount)) bumpEl(el);
      var link = el.closest('a,button');
      if (link) link.setAttribute('aria-label', 'Cart, ' + cCount + (cCount === 1 ? ' item' : ' items'));
    });

    document.querySelectorAll('.fav-badge').forEach(function (el) {
      var prev = el.textContent;
      el.textContent = String(fCount);
      el.dataset.zero = String(fCount === 0);
      if (prev !== String(fCount)) bumpEl(el);
      var link = el.closest('a,button');
      if (link) link.setAttribute('aria-label', 'Favorites, ' + fCount + (fCount === 1 ? ' item' : ' items'));
    });

    renderAccountPanel();
  }

  /* ---------------------------------------------------------
     Toasts
  --------------------------------------------------------- */
  function ensureToastHost() {
    var host = document.getElementById('kl-toasts');
    if (!host) {
      host = document.createElement('div');
      host.id = 'kl-toasts';
      host.setAttribute('role', 'status');
      host.setAttribute('aria-live', 'polite');
      document.body.appendChild(host);
    }
    return host;
  }

  var CHECK_ICON = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var ALERT_ICON = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 8v5M12 16.2v.1" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>';

  function toast(message, opts) {
    opts = opts || {};
    var host = ensureToastHost();
    var el = document.createElement('div');
    el.className = 'kl-toast' + (opts.error ? ' is-error' : '');
    el.innerHTML = '<span class="kt-icon">' + (opts.error ? ALERT_ICON : CHECK_ICON) + '</span><span>' + message + '</span>';
    host.appendChild(el);
    var life = opts.duration || 2600;
    setTimeout(function () {
      el.classList.add('out');
      el.addEventListener('animationend', function () { el.remove(); }, { once: true });
    }, life);
  }

  /* ---------------------------------------------------------
     Account dropdown (header icon)
  --------------------------------------------------------- */
  function closeAccountPanel() {
    var panel = document.getElementById('account-panel');
    var btn = document.getElementById('account-btn');
    if (panel) panel.hidden = true;
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }

  function renderAccountPanel() {
    var panel = document.getElementById('account-panel');
    if (!panel) return;
    var user = currentUser();
    if (user) {
      panel.innerHTML =
        '<p class="ap-hello">Signed in as</p>' +
        '<p class="ap-name">' + escapeHtml(user.name) + '</p>' +
        '<a class="ap-link" href="favorites.html">' +
          '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" stroke-width="2"/></svg>' +
          'My favorites' +
        '</a>' +
        '<a class="ap-link" href="cart.html">' +
          '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 8h12l-1.2 10.2a2 2 0 01-2 1.8H9.2a2 2 0 01-2-1.8L6 8z" stroke="currentColor" stroke-width="2"/></svg>' +
          'My cart' +
        '</a>' +
        '<hr class="ap-divider">' +
        '<button type="button" class="ap-logout" id="ap-logout-btn">Log out</button>';
      var lo = panel.querySelector('#ap-logout-btn');
      if (lo) lo.addEventListener('click', function () {
        logout();
        toast("You're logged out.");
      });
    } else {
      panel.innerHTML =
        '<p class="ap-hello">Welcome</p>' +
        '<p class="ap-name" style="margin-bottom:14px;">Sign in to save your cart and favorites across visits.</p>' +
        '<a class="ap-link" href="login.html" style="justify-content:center;background:var(--text);color:var(--bg);font-weight:800;">Log in</a>' +
        '<a class="ap-link" href="signup.html" style="justify-content:center;">Create an account</a>';
    }
  }

  function mountAccount() {
    var btn = document.getElementById('account-btn');
    var panel = document.getElementById('account-panel');
    if (!btn || !panel) return;
    renderAccountPanel();
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var willOpen = panel.hidden;
      closeAccountPanel();
      if (willOpen) {
        panel.hidden = false;
        btn.setAttribute('aria-expanded', 'true');
      }
    });
    document.addEventListener('click', function (e) {
      if (!panel.hidden && !panel.contains(e.target) && e.target !== btn) closeAccountPanel();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeAccountPanel();
    });
  }

  /* ---------------------------------------------------------
     Auth modal — shared login / signup surface used by the
     account icon and the checkout payment gate.
  --------------------------------------------------------- */
  var modalEl = null;

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function buildModal() {
    var overlay = document.createElement('div');
    overlay.className = 'kl-modal-overlay';
    overlay.id = 'kl-auth-overlay';
    overlay.hidden = true;
    overlay.innerHTML =
      '<div class="kl-modal" role="dialog" aria-modal="true" aria-labelledby="kl-modal-title">' +
        '<button type="button" class="kl-modal-close" id="kl-modal-close" aria-label="Close">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
        '</button>' +
        '<div class="kl-modal-lockup"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 11V8a6 6 0 0 1 12 0v3M5 11h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><span style="font-size:11px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:var(--text-dim);">Kicks Lab account</span></div>' +
        '<h2 id="kl-modal-title" class="display">Welcome back</h2>' +
        '<p class="kl-modal-note" id="kl-modal-note">Log in to save your cart, track orders and check out faster.</p>' +
        '<div class="kl-tabs">' +
          '<button type="button" class="kl-tab is-active" id="kl-tab-login">Log in</button>' +
          '<button type="button" class="kl-tab" id="kl-tab-signup">Sign up</button>' +
        '</div>' +
        '<form id="kl-auth-form" novalidate>' +
          '<div class="kl-form-field" id="kl-field-name" hidden>' +
            '<label for="kl-name">Full name</label>' +
            '<input id="kl-name" type="text" autocomplete="name" placeholder="Jordan Lee">' +
          '</div>' +
          '<div class="kl-form-field">' +
            '<label for="kl-email">Email</label>' +
            '<input id="kl-email" type="email" autocomplete="email" placeholder="you@example.com">' +
          '</div>' +
          '<div class="kl-form-field">' +
            '<label for="kl-password">Password</label>' +
            '<input id="kl-password" type="password" autocomplete="current-password" placeholder="••••••••">' +
          '</div>' +
          '<p class="kl-form-error" id="kl-form-error"></p>' +
          '<button type="submit" class="btn-primary kl-modal-submit" id="kl-modal-submit">Log in</button>' +
        '</form>' +
        '<p class="kl-modal-switch" id="kl-modal-switch">New here? <button type="button" id="kl-switch-btn">Create an account</button></p>' +
        '<p class="kl-modal-demo">Demo store: accounts are saved only in this browser (localStorage), so use any email/password — nothing is sent to a server.</p>' +
      '</div>';
    document.body.appendChild(overlay);
    return overlay;
  }

  function setModalMode(mode) {
    var note = document.getElementById('kl-modal-note');
    var title = document.getElementById('kl-modal-title');
    var nameField = document.getElementById('kl-field-name');
    var submit = document.getElementById('kl-modal-submit');
    var switchWrap = document.getElementById('kl-modal-switch');
    var tabLogin = document.getElementById('kl-tab-login');
    var tabSignup = document.getElementById('kl-tab-signup');
    var pwInput = document.getElementById('kl-password');
    var err = document.getElementById('kl-form-error');
    err.textContent = '';
    modalEl.dataset.mode = mode;
    if (mode === 'signup') {
      title.textContent = 'Create your account';
      note.textContent = 'One quick account and you can check out securely.';
      nameField.hidden = false;
      submit.textContent = 'Create account';
      pwInput.setAttribute('autocomplete', 'new-password');
      switchWrap.innerHTML = 'Already have an account? <button type="button" id="kl-switch-btn">Log in instead</button>';
      tabLogin.classList.remove('is-active');
      tabSignup.classList.add('is-active');
    } else {
      title.textContent = 'Welcome back';
      note.textContent = 'Log in to save your cart, track orders and check out faster.';
      nameField.hidden = true;
      submit.textContent = 'Log in';
      pwInput.setAttribute('autocomplete', 'current-password');
      switchWrap.innerHTML = 'New here? <button type="button" id="kl-switch-btn">Create an account</button>';
      tabLogin.classList.add('is-active');
      tabSignup.classList.remove('is-active');
    }
    document.getElementById('kl-switch-btn').addEventListener('click', function () {
      setModalMode(mode === 'signup' ? 'login' : 'signup');
    });
  }

  function mountAuthModal() {
    if (modalEl) return modalEl;
    modalEl = buildModal();
    var closeBtn = document.getElementById('kl-modal-close');
    var form = document.getElementById('kl-auth-form');
    var errEl = document.getElementById('kl-form-error');

    closeBtn.addEventListener('click', closeAuthModal);
    modalEl.addEventListener('click', function (e) { if (e.target === modalEl) closeAuthModal(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modalEl.hidden) closeAuthModal(); });

    document.getElementById('kl-tab-login').addEventListener('click', function () { setModalMode('login'); });
    document.getElementById('kl-tab-signup').addEventListener('click', function () { setModalMode('signup'); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      errEl.textContent = '';
      var mode = modalEl.dataset.mode;
      var email = document.getElementById('kl-email').value;
      var password = document.getElementById('kl-password').value;
      var result;
      if (mode === 'signup') {
        var name = document.getElementById('kl-name').value;
        result = signup({ name: name, email: email, password: password });
      } else {
        result = login({ email: email, password: password });
      }
      if (!result.ok) {
        errEl.textContent = result.error;
        return;
      }
      var onSuccess = modalEl._onSuccess;
      closeAuthModal();
      toast('Signed in as ' + result.user.name + '.');
      if (typeof onSuccess === 'function') onSuccess(result.user);
    });

    setModalMode('login');
    return modalEl;
  }

  function openAuthModal(opts) {
    opts = opts || {};
    mountAuthModal();
    modalEl.hidden = false;
    modalEl._onSuccess = opts.onSuccess || null;
    setModalMode(opts.mode || 'login');
    if (opts.message) document.getElementById('kl-modal-note').textContent = opts.message;
    var focusTarget = (opts.mode === 'signup') ? document.getElementById('kl-name') : document.getElementById('kl-email');
    setTimeout(function () { if (focusTarget) focusTarget.focus(); }, 30);
    document.body.style.overflow = 'hidden';
  }

  function closeAuthModal() {
    if (!modalEl) return;
    modalEl.hidden = true;
    document.body.style.overflow = '';
    var form = document.getElementById('kl-auth-form');
    if (form) form.reset();
    document.getElementById('kl-form-error').textContent = '';
  }

  /* ---------------------------------------------------------
     Theme persistence (applied ASAP by an inline snippet in
     <head>; this just keeps toggleTheme() in sync).
  --------------------------------------------------------- */
  function setTheme(next) {
    document.documentElement.setAttribute('data-theme', next);
    write(LS_THEME, next);
  }

  /* ---------------------------------------------------------
     Scroll-reveal for elements marked .kl-reveal
  --------------------------------------------------------- */
  function mountReveal() {
    var els = document.querySelectorAll('.kl-reveal');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('in-view'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------------------------------------------------------
     public API
  --------------------------------------------------------- */
  global.KL = {
    PRODUCTS: PRODUCTS,
    // cart
    addToCart: addToCart,
    removeFromCart: removeFromCart,
    setQty: setQty,
    cartItems: cartItems,
    clearCart: clearCart,
    cartCount: cartCount,
    // favorites
    toggleFav: toggleFav,
    isFav: isFav,
    favItems: favItems,
    removeFav: removeFav,
    favCount: favCount,
    // auth
    currentUser: currentUser,
    isAuthed: isAuthed,
    signup: signup,
    login: login,
    logout: logout,
    // ui
    toast: toast,
    updateBadges: updateBadges,
    openAuthModal: openAuthModal,
    closeAuthModal: closeAuthModal,
    setTheme: setTheme,
    // order handoff (checkout -> confirmation)
    LS_LAST_ORDER: LS_LAST_ORDER
  };

  document.addEventListener('DOMContentLoaded', function () {
    updateBadges();
    mountAccount();
    mountAuthModal();
    mountReveal();
  });
})(window);
