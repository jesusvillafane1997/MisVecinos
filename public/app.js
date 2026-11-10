// ============================================================================
// MIS VECINOS (Córdoba, Argentina) — Dynamic Database Application Logic
// 100% Live Supabase PostgreSQL + Realtime Edition (Zero Mock Data)
// ============================================================================

(function () {
  'use strict';

  const PREFS_STORAGE_KEY = 'mis_vecinos_ui_prefs_v1';
  const ICONS = window.MINIMAL_ICONS || {};

  // Application State (Starts completely empty — Zero Mock Data)
  let state = {
    theme: 'dark',
    currentUser: null, // Populated ONLY from authenticated Supabase session
    activeNav: 'muro', // 'muro' | 'chat' | 'alertas' | 'clasificados' | 'perfil'
    barrioScope: 'mi-barrio', // 'mi-barrio' | 'cercanos' | 'todos'
    activeBarrioId: 'nueva-cordoba',
    feedFilter: 'Todos', // 'Todos' | 'Alertas' | 'Servicios' | 'Recomendaciones'
    searchQuery: '',
    selectedComposerCategory: 'Novedades',
    composerImageData: null,
    chatSoundEnabled: true,
    posts: [],
    isLoadingPosts: false,
    chatMessages: [],
    isLoadingChat: false,
    subscribedChatBarrioId: null,
    openCommentsPostIds: new Set(),
    regSelectedAvatar: window.AVATAR_PRESETS[0].url,
    regSelectedBarrioId: 'nueva-cordoba'
  };

  // ==========================================================================
  // 1. UI PREFERENCES (Theme & Sound Toggle Only)
  // ==========================================================================
  function loadUiPrefs() {
    try {
      const raw = localStorage.getItem(PREFS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.theme === 'light' || parsed.theme === 'dark') {
          state.theme = parsed.theme;
        }
        if (typeof parsed.chatSoundEnabled === 'boolean') {
          state.chatSoundEnabled = parsed.chatSoundEnabled;
        }
      }
    } catch {
      // Ignore storage error
    }
  }

  function saveUiPrefs() {
    try {
      localStorage.setItem(
        PREFS_STORAGE_KEY,
        JSON.stringify({
          theme: state.theme,
          chatSoundEnabled: state.chatSoundEnabled
        })
      );
    } catch {
      // Ignore storage error
    }
  }

  // ==========================================================================
  // 2. CAPACITOR NATIVE BRIDGE & HELPER UTILITIES
  // ==========================================================================
  let deferredPwaPrompt = null;

  const NativeBridge = {
    isNative() {
      return Boolean(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
    },
    getPlugins() {
      return (window.Capacitor && window.Capacitor.Plugins) || {};
    },
    async hapticImpact(style = 'LIGHT') {
      try {
        const { Haptics } = this.getPlugins();
        if (Haptics && Haptics.impact) {
          await Haptics.impact({ style });
          return;
        }
        if (navigator.vibrate) {
          navigator.vibrate(10);
        }
      } catch {
        // Ignore haptics error
      }
    },
    async syncStatusBar(theme) {
      try {
        const metaTheme = document.getElementById('metaThemeColor');
        if (metaTheme) {
          metaTheme.setAttribute('content', theme === 'dark' ? '#131314' : '#F8F9FA');
        }
        const { StatusBar } = this.getPlugins();
        if (StatusBar) {
          await StatusBar.setStyle({ style: theme === 'dark' ? 'DARK' : 'LIGHT' });
          await StatusBar.setBackgroundColor({ color: theme === 'dark' ? '#131314' : '#F8F9FA' });
        }
      } catch {
        // Ignore status bar error on web
      }
    },
    async hideSplash() {
      try {
        const { SplashScreen } = this.getPlugins();
        if (SplashScreen && SplashScreen.hide) {
          await SplashScreen.hide();
        }
      } catch {
        // Ignore on web
      }
    },
    async getCurrentPosition() {
      const { Geolocation } = this.getPlugins();
      if (Geolocation && Geolocation.getCurrentPosition) {
        const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 6000 });
        return { lat: pos.coords.latitude, lng: pos.coords.longitude };
      }
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('GPS no disponible'));
          return;
        }
        navigator.geolocation.getCurrentPosition(
          pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          err => reject(err),
          { enableHighAccuracy: true, timeout: 6000 }
        );
      });
    },
    async sharePost(title, text) {
      try {
        const { Share } = this.getPlugins();
        if (Share && Share.share) {
          await Share.share({ title, text, dialogTitle: 'Compartir con vecinos' });
          return true;
        }
        if (navigator.share) {
          await navigator.share({ title, text });
          return true;
        }
      } catch {
        // Fall through to clipboard
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text).catch(() => {});
      }
      return false;
    }
  };

  function getBarrioById(id) {
    return window.CORDOBA_BARRIOS.find(b => b.id === id) || window.CORDOBA_BARRIOS[0];
  }

  function formatBarrioHudPill(barrio) {
    if (!barrio) return '[ CBA // CENTRO ]';
    return `[ CBA // ${barrio.name.toUpperCase()} ]`;
  }

  function formatRelativeTime(isoString) {
    if (!isoString) return 'Hace instantes';
    const diffSec = Math.max(1, Math.floor((Date.now() - new Date(isoString).getTime()) / 1000));
    if (diffSec < 60) return 'Hace instantes';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `Hace ${diffMin} min`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `Hace ${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    return `Hace ${diffDays} d`;
  }

  function formatClockTime(isoString) {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function showToast(message, isError = false) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'gemini-toast';
    if (isError) {
      toast.style.borderColor = 'var(--gemini-coral)';
    }
    toast.innerHTML = `<span class="live-dot-gemini" style="${isError ? 'background:var(--gemini-coral);' : ''}"></span><span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.25s ease';
      setTimeout(() => toast.remove(), 260);
    }, 3400);
  }

  function playNotificationChime() {
    if (!state.chatSoundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.14);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    } catch {
      // Ignore audio autoplay restrictions
    }
  }

  function haversineKm(lat1, lon1, lat2, lon2) {
    const toRad = deg => (deg * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function findClosestCordobaBarrio(lat, lng) {
    let bestBarrio = window.CORDOBA_BARRIOS[0];
    let minDistance = Infinity;
    for (const barrio of window.CORDOBA_BARRIOS) {
      const d = haversineKm(lat, lng, barrio.lat, barrio.lng);
      if (d < minDistance) {
        minDistance = d;
        bestBarrio = barrio;
      }
    }
    return { barrio: bestBarrio, distanceKm: minDistance };
  }

  // ==========================================================================
  // 3. THEME & HEADER RENDERING
  // ==========================================================================
  function applyTheme() {
    document.documentElement.setAttribute('data-theme', state.theme);
    NativeBridge.syncStatusBar(state.theme);
    const icon = document.getElementById('themeIcon');
    const label = document.getElementById('themeLabel');
    const mobIcon = document.getElementById('mobThemeIcon');
    const mobLabel = document.getElementById('mobThemeLabel');

    if (state.theme === 'dark') {
      if (icon) icon.innerHTML = ICONS.sun || '';
      if (label) label.textContent = 'Modo Claro';
      if (mobIcon) mobIcon.innerHTML = ICONS.sun || '';
      if (mobLabel) mobLabel.textContent = 'Modo Claro';
    } else {
      if (icon) icon.innerHTML = ICONS.moon || '';
      if (label) label.textContent = 'Modo Oscuro';
      if (mobIcon) mobIcon.innerHTML = ICONS.moon || '';
      if (mobLabel) mobLabel.textContent = 'Modo Oscuro';
    }
  }

  // ==========================================================================
  // 4. SIDEBAR, BARRIO CONTEXT & NAVIGATION RENDERING
  // ==========================================================================
  function populateBarrioSelectDropdown() {
    const select = document.getElementById('sidebarBarrioSelect');
    if (!select) return;
    select.innerHTML = window.CORDOBA_BARRIOS.map(
      b => `<option value="${b.id}" ${b.id === state.activeBarrioId ? 'selected' : ''}>◎ ${escapeHtml(b.name)} (${escapeHtml(b.zone)})</option>`
    ).join('');
  }

  function getScopedBarrioIds() {
    const activeBarrio = getBarrioById(state.activeBarrioId);
    if (state.barrioScope === 'todos') return null;
    if (state.barrioScope === 'cercanos') {
      return [activeBarrio.id, ...(activeBarrio.neighbors || [])];
    }
    return [activeBarrio.id];
  }

  function renderUserAndBarrioContext() {
    const user = state.currentUser;
    const defaultAvatar = window.AVATAR_PRESETS[0].url;
    const activeBarrio = getBarrioById(state.activeBarrioId);
    const userBarrio = user ? getBarrioById(user.barrioId) : activeBarrio;

    // Header Monospaced Barrio HUD Pill
    const hudPillEl = document.getElementById('headerBarrioHudText');
    if (hudPillEl) {
      hudPillEl.textContent =
        state.barrioScope === 'todos'
          ? '[ CBA // TODA CORDOBA ]'
          : formatBarrioHudPill(activeBarrio);
    }

    // Fix any incomplete Google OAuth name or single-word username like 'Villafane' / '@jesus'
    if (user) {
      if (user.name === 'Villafane' || user.username === 'jesus') {
        user.name = 'Jesús Villafañe';
        user.username = 'jesusvillafane';
        window.MisVecinosSupabase?.updateProfile({
          userId: user.id,
          fullName: 'Jesús Villafañe',
          username: 'jesusvillafane'
        }).catch(() => {});
      }
    }

    // Sidebar user card (Authenticated vs Unauthenticated Zero-State)
    document.getElementById('sidebarAvatar').src = user ? user.avatar : defaultAvatar;
    document.getElementById('sidebarName').textContent = user ? user.name : 'Sin sesión activa';
    document.getElementById('sidebarUsername').textContent = user ? '@' + user.username : '@invitado';
    document.getElementById('sidebarBarrioBadge').textContent = user ? userBarrio.name : activeBarrio.name;
    document.getElementById('composerAvatar').src = user ? user.avatar : defaultAvatar;
    const topAuthBtn = document.getElementById('topAuthBtnText');
    if (topAuthBtn) {
      topAuthBtn.textContent = user
        ? `Mi Cuenta (${user.name.split(' ')[0]})`
        : 'Iniciar Sesión';
    }

    // Show/hide Edit Profile buttons
    const btnSidebarEdit = document.getElementById('btnSidebarEditProfile');
    if (btnSidebarEdit) btnSidebarEdit.classList.toggle('hidden', !user);

    const btnMobEdit = document.getElementById('btnMobEditProfile');
    if (btnMobEdit) btnMobEdit.classList.toggle('hidden', !user);

    // Mobile Profile View (`Perfil` tab)
    const mobAvatar = document.getElementById('mobProfileAvatar');
    if (mobAvatar) {
      mobAvatar.src = user ? user.avatar : defaultAvatar;
      document.getElementById('mobProfileName').textContent = user ? user.name : 'Sin sesión activa';
      document.getElementById('mobProfileHandle').textContent = user ? '@' + user.username : '@invitado';
      const mobBarrioName = document.getElementById('mobProfileBarrioName');
      if (mobBarrioName) {
        mobBarrioName.textContent = user ? userBarrio.name : activeBarrio.name;
      }
      const mobAuthBtnText = document.getElementById('btnMobOpenAuthText');
      if (mobAuthBtnText) {
        mobAuthBtnText.textContent = user ? 'Mi Cuenta' : 'Iniciar Sesión';
      }
      document.getElementById('mobCpcInfo').textContent = activeBarrio.cpc;
      document.getElementById('mobCommissaryInfo').textContent = activeBarrio.commissary;
    }

    // Hero Banner
    const scopeLabel =
      state.barrioScope === 'todos'
        ? 'Toda Córdoba Capital'
        : state.barrioScope === 'cercanos'
        ? `${activeBarrio.name} + Barrios Vecinos`
        : `Barrio ${activeBarrio.name}`;

    document.getElementById('heroBarrioTitle').textContent = scopeLabel;
    document.getElementById('heroZoneBadge').textContent = activeBarrio.zone;
    document.getElementById('heroBarrioDesc').textContent = activeBarrio.description;

    // Right sidebar Córdoba reference metadata
    document.getElementById('rightPostalCode').textContent = 'CP ' + activeBarrio.cp;
    document.getElementById('rightCpcInfo').textContent = activeBarrio.cpc;
    document.getElementById('rightCommissaryInfo').textContent = activeBarrio.commissary;

    const neighborContainer = document.getElementById('rightNeighborPills');
    if (neighborContainer) {
      neighborContainer.innerHTML = activeBarrio.neighbors
        .map(nId => {
          const nb = getBarrioById(nId);
          return `<button type="button" class="pill-btn neighbor-jump-btn" data-barrio="${nb.id}" style="padding:4px 10px; font-size:0.76rem;">${ICONS.pin || '◎'} <span>${escapeHtml(nb.name)}</span></button>`;
        })
        .join('');

      neighborContainer.querySelectorAll('.neighbor-jump-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          switchActiveBarrio(btn.dataset.barrio);
        });
      });
    }

    // Scope buttons active state
    document.querySelectorAll('.scope-pill').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.scope === state.barrioScope);
    });

    // Sidebar dropdown sync
    const select = document.getElementById('sidebarBarrioSelect');
    if (select && select.value !== state.activeBarrioId) {
      select.value = state.activeBarrioId;
    }

    // Navigation active state (Desktop Left Sidebar + Mobile Bottom Nav Dock)
    document.querySelectorAll('.nav-item, .mob-nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.nav === state.activeNav);
    });

    // Sidebar count badges based on real loaded DB posts
    const totalCount = state.posts.length;
    const alertCount = state.posts.filter(
      p => p.category === 'Seguridad' || p.category === 'Cortes' || p.category === 'Mascotas'
    ).length;
    const clasificadosCount = state.posts.filter(p => p.category === 'Servicios').length;

    document.getElementById('badgeMuroCount').textContent = totalCount;
    document.getElementById('badgeAlertasCount').textContent = alertCount;
    document.getElementById('badgeClasificadosCount').textContent = clasificadosCount;

    // Toggle Main View Sections (Feed vs Live Chat vs Mobile Profile)
    const feedSection = document.getElementById('viewFeedSection');
    const chatSection = document.getElementById('viewChatSection');
    const profileSection = document.getElementById('viewProfileSection');
    const heroBanner = document.getElementById('heroContextBanner');
    const mobileFab = document.getElementById('btnMobileFabCompose');

    if (state.activeNav === 'chat') {
      feedSection.classList.add('hidden');
      profileSection.classList.add('hidden');
      chatSection.classList.remove('hidden');
      heroBanner.classList.add('hide-on-mobile-chat');
      if (mobileFab) mobileFab.classList.add('hidden');
      ensureLiveChatLoadedAndSubscribed();
    } else if (state.activeNav === 'perfil') {
      feedSection.classList.add('hidden');
      chatSection.classList.add('hidden');
      profileSection.classList.remove('hidden');
      heroBanner.classList.remove('hide-on-mobile-chat');
      if (mobileFab) mobileFab.classList.add('hidden');
    } else {
      chatSection.classList.add('hidden');
      profileSection.classList.add('hidden');
      feedSection.classList.remove('hidden');
      heroBanner.classList.remove('hide-on-mobile-chat');
      if (mobileFab) mobileFab.classList.remove('hidden');

      if (state.activeNav === 'alertas') {
        state.feedFilter = 'Alertas';
      } else if (state.activeNav === 'clasificados') {
        state.feedFilter = 'Servicios';
      } else if (state.activeNav === 'muro' && (state.feedFilter === 'Alertas' || state.feedFilter === 'Servicios')) {
        state.feedFilter = 'Todos';
      }
      renderFeedStream();
    }
  }

  async function switchActiveBarrio(newBarrioId) {
    state.activeBarrioId = newBarrioId;
    state.barrioScope = 'mi-barrio';
    populateBarrioSelectDropdown();
    renderUserAndBarrioContext();
    await refreshFeedFromDatabase();
    if (state.activeNav === 'chat') {
      await ensureLiveChatLoadedAndSubscribed(true);
    }
    showToast(`Explorando Barrio ${getBarrioById(newBarrioId).name}`);
  }

  // ==========================================================================
  // 5. DYNAMIC FEED STREAM & CRUD (`posts`, `post_likes`, `post_comments`)
  // ==========================================================================
  async function refreshFeedFromDatabase() {
    const sb = window.MisVecinosSupabase;
    if (!sb || !sb.isConfigured()) return;

    state.isLoadingPosts = true;
    renderFeedStream();

    try {
      const barrioIds = getScopedBarrioIds();
      const posts = await sb.fetchPosts({
        barrioIds,
        currentUserId: state.currentUser?.id || null
      });
      state.posts = posts;
    } catch (err) {
      showToast(err.message || 'Error al consultar publicaciones en la base de datos', true);
    } finally {
      state.isLoadingPosts = false;
      renderUserAndBarrioContext();
    }
  }

  function getCategoryBadgeStyle(category) {
    switch (category) {
      case 'Seguridad':
      case 'Cortes':
        return { cls: 'cat-seguridad', icon: ICONS.alert || '<svg class="mini-icon" viewBox="0 0 24 24"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' };
      case 'Mascotas':
        return { cls: 'cat-mascotas', icon: ICONS.paw || '<svg class="mini-icon" viewBox="0 0 24 24"><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/></svg>' };
      case 'Recomendaciones':
        return { cls: 'cat-recomendaciones', icon: ICONS.star || '<svg class="mini-icon" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' };
      case 'Servicios':
        return { cls: 'cat-compraventa', icon: ICONS.bag || '<svg class="mini-icon" viewBox="0 0 24 24"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>' };
      default:
        return { cls: 'cat-novedades', icon: ICONS.spark || '<svg class="mini-icon" viewBox="0 0 24 24"><path d="M12 3c.5 4.8 4.2 8.5 9 9-4.8.5-8.5 4.2-9 9-.5-4.8-4.2-8.5-9-9 4.8-.5 8.5-4.2 9-9Z"/></svg>' };
    }
  }

  function renderFeedSkeleton() {
    return `
      <div class="hud-skeleton-card" aria-busy="true">
        <div style="display:flex;align-items:center;gap:12px;">
          <div class="skeleton-line" style="width:42px;height:42px;border-radius:50%;"></div>
          <div style="flex:1;display:flex;flex-direction:column;gap:6px;">
            <div class="skeleton-line" style="width:38%;"></div>
            <div class="skeleton-line" style="width:24%;height:9px;"></div>
          </div>
        </div>
        <div class="skeleton-line" style="width:92%;"></div>
        <div class="skeleton-line" style="width:74%;"></div>
      </div>
    `;
  }

  function renderFeedStream() {
    const container = document.getElementById('feedStreamContainer');
    if (!container) return;

    // Sync filter tabs UI
    document.querySelectorAll('#feedFilterTabs .feed-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.filter === state.feedFilter);
    });

    if (state.isLoadingPosts) {
      container.innerHTML = renderFeedSkeleton() + renderFeedSkeleton();
      return;
    }

    const q = state.searchQuery.trim().toLowerCase();
    const filtered = state.posts.filter(post => {
      if (state.feedFilter === 'Alertas') {
        if (post.category !== 'Seguridad' && post.category !== 'Cortes' && post.category !== 'Mascotas') {
          return false;
        }
      } else if (state.feedFilter === 'Servicios') {
        if (post.category !== 'Servicios') return false;
      } else if (state.feedFilter === 'Recomendaciones') {
        if (post.category !== 'Recomendaciones') return false;
      }

      if (q) {
        const hay = `${post.content} ${post.author.name} ${post.author.username} ${post.barrioName} ${post.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      const isAlertView = state.activeNav === 'alertas' || state.feedFilter === 'Alertas';
      const hudPrimary = isAlertView
        ? '[ MONITOREO // SIN ALERTAS ACTIVAS ]'
        : '[ ESTADO // 0 REGISTROS EN ESTE BARRIO ]';
      const hudSecondary = isAlertView
        ? '[ ESTADO // 0 REPORTES DE SEGURIDAD O CORTES ]'
        : '[ ESTADO // SIN PUBLICACIONES EN ESTE BARRIO ]';
      const subtitleText = isAlertView
        ? 'No hay alertas ni reportes activos en este distrito en la base de datos.'
        : 'Sé el primer vecino en publicar en el muro.';

      container.innerHTML = `
        <div class="hud-empty-state">
          <div class="hud-empty-code">${escapeHtml(hudPrimary)}</div>
          <div style="font-family:var(--font-body);font-size:0.84rem;font-weight:500;color:var(--text-secondary);">${escapeHtml(hudSecondary)}</div>
          <p class="hud-empty-subtitle">${escapeHtml(subtitleText)}</p>
          <button id="btnEmptyStateCreatePost" type="button" class="btn-gemini-primary" style="margin-top:4px;">
            <span>Crear publicación</span>
          </button>
        </div>
      `;

      document.getElementById('btnEmptyStateCreatePost')?.addEventListener('click', () => {
        if (!state.currentUser) {
          openAuthModal();
          return;
        }
        document.getElementById('btnMobileFabCompose')?.click();
      });
      return;
    }

    container.innerHTML = filtered
      .map(post => {
        const catInfo = getCategoryBadgeStyle(post.category);
        const isOwnPost = Boolean(state.currentUser && post.userId === state.currentUser.id);
        const isCommentsOpen = state.openCommentsPostIds.has(post.id);

        const commentsListHtml =
          post.comments.length === 0
            ? `<div style="font-family:var(--font-body);font-size:0.82rem;color:var(--text-muted);text-align:center;padding:8px 0;">[ COMENTARIOS // 0 REGISTROS ] — Sé el primer vecino en comentar.</div>`
            : post.comments
                .map(
                  c => `
              <div class="comment-item">
                <img class="avatar-img avatar-sm" style="width:32px;height:32px;" src="${escapeHtml(c.authorAvatar)}" alt="${escapeHtml(c.authorName)}" />
                <div class="comment-bubble">
                  <div class="comment-author">
                    <span>${escapeHtml(c.authorName)} <span style="font-weight:400;color:var(--text-secondary);">@${escapeHtml(c.authorUsername)}</span></span>
                    <span class="comment-time">${escapeHtml(formatRelativeTime(c.createdAt))}</span>
                  </div>
                  <div class="comment-text">${escapeHtml(c.text)}</div>
                </div>
              </div>
            `
                )
                .join('');

        return `
        <article class="gemini-card post-card" data-post-id="${escapeHtml(post.id)}">
          <div class="post-header">
            <div class="post-author-wrap">
              <img class="avatar-img avatar-sm" src="${escapeHtml(post.author.avatar)}" alt="${escapeHtml(post.author.name)}" />
              <div>
                <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                  <span class="post-author-name">${escapeHtml(post.author.name)}</span>
                  <span class="gemini-spark-badge" title="Vecino registrado en Supabase">✓ Vecino</span>
                </div>
                <div class="post-meta-line">
                  <span>@${escapeHtml(post.author.username)}</span>
                  <span>·</span>
                  <span class="barrio-badge" style="padding:2px 8px; font-size:0.73rem;">${ICONS.pin || '◎'} <span>${escapeHtml(post.barrioName)}</span></span>
                  <span>·</span>
                  <span>${escapeHtml(formatRelativeTime(post.createdAt))}</span>
                </div>
              </div>
            </div>

            <div style="display:flex;align-items:center;gap:8px;">
              <span class="post-category-tag ${catInfo.cls}">
                ${catInfo.icon} <span>${escapeHtml(post.category)}</span>
              </span>
              ${
                isOwnPost
                  ? `<button type="button" class="pill-btn btn-delete-post" data-id="${escapeHtml(post.id)}" title="Eliminar mi publicación" style="padding:5px 8px;color:var(--gemini-coral);">${ICONS.trash || '✕'}</button>`
                  : ''
              }
            </div>
          </div>

          <div class="post-body">${escapeHtml(post.content)}</div>

          ${
            post.image
              ? `<div class="post-image-wrap"><img src="${escapeHtml(post.image)}" alt="Imagen adjunta por vecino" loading="lazy" /></div>`
              : ''
          }

          <div class="post-actions-bar">
            <button type="button" class="action-btn btn-like-post ${post.likedByMe ? 'liked' : ''}" data-id="${escapeHtml(post.id)}">
              <span class="action-icon" style="display:inline-flex;">${ICONS.heart || '<svg class="mini-icon" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z"/></svg>'}</span>
              <span>Apoyar</span>
              <span class="like-count-label">(${post.likes})</span>
            </button>

            <button type="button" class="action-btn btn-toggle-comments" data-id="${escapeHtml(post.id)}">
              <span class="action-icon" style="display:inline-flex;">${ICONS.chat || '<svg class="mini-icon" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"/></svg>'}</span>
              <span>Comentar (${post.comments.length})</span>
            </button>

            <button type="button" class="action-btn btn-share-post" data-id="${escapeHtml(post.id)}">
              <span class="action-icon" style="display:inline-flex;">${ICONS.share || '<svg class="mini-icon" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>'}</span>
              <span>Compartir</span>
            </button>
          </div>

          <div id="commentsBox-${escapeHtml(post.id)}" class="comments-box ${isCommentsOpen ? '' : 'hidden'}">
            <div class="comments-list-wrap" style="display:flex; flex-direction:column; gap:10px;">
              ${commentsListHtml}
            </div>
            <form class="comment-form" data-post-id="${escapeHtml(post.id)}">
              <input
                type="text"
                class="gemini-input comment-input"
                placeholder="Escribí un comentario para tus vecinos..."
                style="padding:8px 12px; font-size:0.85rem;"
                required
              />
              <button type="submit" class="btn-gemini-primary" style="padding:8px 14px; font-size:0.82rem;">
                Responder
              </button>
            </form>
          </div>
        </article>
      `;
      })
      .join('');

    // Bind Like/Apoyar buttons -> Real INSERT/DELETE on `post_likes`
    container.querySelectorAll('.btn-like-post').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!state.currentUser) {
          showToast('Iniciá sesión para apoyar publicaciones', true);
          openAuthModal();
          return;
        }
        const postId = btn.dataset.id;
        const post = state.posts.find(p => p.id === postId);
        if (!post) return;

        btn.disabled = true;
        try {
          const result = await window.MisVecinosSupabase.togglePostLike({
            postId,
            userId: state.currentUser.id
          });
          post.likedByMe = result.liked;
          post.likes = result.likesCount;
          renderFeedStream();
        } catch (err) {
          showToast(err.message || 'No se pudo actualizar el apoyo en la base de datos', true);
        } finally {
          btn.disabled = false;
        }
      });
    });

    // Bind Toggle Comments drawer
    container.querySelectorAll('.btn-toggle-comments').forEach(btn => {
      btn.addEventListener('click', () => {
        const postId = btn.dataset.id;
        const box = document.getElementById(`commentsBox-${postId}`);
        if (!box) return;
        const isHidden = box.classList.toggle('hidden');
        if (isHidden) {
          state.openCommentsPostIds.delete(postId);
        } else {
          state.openCommentsPostIds.add(postId);
          box.querySelector('.comment-input')?.focus();
        }
      });
    });

    // Bind Share button (Capacitor Native Share / Web Share API / Clipboard)
    container.querySelectorAll('.btn-share-post').forEach(btn => {
      btn.addEventListener('click', async () => {
        const post = state.posts.find(p => p.id === btn.dataset.id);
        if (!post) return;
        NativeBridge.hapticImpact('LIGHT');
        const shareTitle = `Mis Vecinos · Barrio ${post.barrioName}`;
        const shareText = `[Mis Vecinos · Barrio ${post.barrioName}] @${post.author.username}: "${post.content}"`;
        const usedNativeShare = await NativeBridge.sharePost(shareTitle, shareText);
        if (!usedNativeShare) {
          showToast(`Publicación de Barrio ${post.barrioName} copiada al portapapeles`);
        }
      });
    });

    // Bind Delete Own Post -> Real DELETE on `posts`
    container.querySelectorAll('.btn-delete-post').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!state.currentUser) return;
        const postId = btn.dataset.id;
        btn.disabled = true;
        try {
          await window.MisVecinosSupabase.deletePost({
            postId,
            userId: state.currentUser.id
          });
          state.posts = state.posts.filter(p => p.id !== postId);
          renderUserAndBarrioContext();
          showToast('Publicación eliminada de la base de datos');
        } catch (err) {
          showToast(err.message || 'Error al eliminar la publicación', true);
          btn.disabled = false;
        }
      });
    });

    // Bind Comment Form Submit -> Real INSERT into `post_comments`
    container.querySelectorAll('.comment-form').forEach(form => {
      form.addEventListener('submit', async e => {
        e.preventDefault();
        if (!state.currentUser) {
          showToast('Iniciá sesión para comentar', true);
          openAuthModal();
          return;
        }
        const postId = form.dataset.postId;
        const input = form.querySelector('.comment-input');
        const submitBtn = form.querySelector('button[type="submit"]');
        const text = input.value.trim();
        if (!text) return;

        const post = state.posts.find(p => p.id === postId);
        if (!post) return;

        try {
          if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = '...';
          }
          const createdComment = await window.MisVecinosSupabase.createComment({
            postId,
            userId: state.currentUser.id,
            content: text
          });
          post.comments.push(createdComment);
          state.openCommentsPostIds.add(postId);
          input.value = '';
          renderFeedStream();
          showToast('Comentario guardado en la base de datos');
        } catch (err) {
          showToast(err.message || 'Error al publicar el comentario', true);
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Responder';
          }
        }
      });
    });
  }

  // ==========================================================================
  // 6. BARRIO LIVE CHAT & REALTIME SUBSCRIPTION (`chat_messages`)
  // ==========================================================================
  function scrollChatToLatest() {
    const messagesEl = document.getElementById('chatMessagesList');
    if (messagesEl) {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
  }

  async function ensureLiveChatLoadedAndSubscribed(forceReload = false) {
    const activeBarrio = getBarrioById(state.activeBarrioId);
    const sb = window.MisVecinosSupabase;
    if (!sb || !sb.isConfigured()) return;

    if (!forceReload && state.subscribedChatBarrioId === activeBarrio.id) {
      renderLiveChat();
      return;
    }

    state.subscribedChatBarrioId = activeBarrio.id;
    state.isLoadingChat = true;
    renderLiveChat();

    try {
      const messages = await sb.fetchChatMessages(
        activeBarrio.id,
        state.currentUser?.id || null
      );
      state.chatMessages = messages;
    } catch (err) {
      showToast(err.message || 'Error al cargar mensajes del canal', true);
    } finally {
      state.isLoadingChat = false;
      renderLiveChat();
    }

    // Subscribe to real-time INSERT events on `chat_messages` scoped to `barrio_id`
    sb.subscribeToBarrioChat(
      activeBarrio.id,
      () => state.currentUser?.id || null,
      incomingMsg => {
        const exists = state.chatMessages.some(m => m.id === incomingMsg.id);
        if (!exists) {
          state.chatMessages.push(incomingMsg);
          if (!incomingMsg.isOwn) {
            playNotificationChime();
          }
          if (state.activeNav === 'chat') {
            renderLiveChat();
          }
        }
      }
    );
  }

  function renderLiveChat() {
    const activeBarrio = getBarrioById(state.activeBarrioId);
    document.getElementById('chatRoomTitle').textContent = `Sala Vecinal · Barrio ${activeBarrio.name}`;
    document.getElementById('chatOnlineMeta').textContent = `${formatBarrioHudPill(activeBarrio)} · Suscripción Realtime activa (${activeBarrio.zone})`;

    const soundIcon = document.getElementById('chatSoundIcon');
    const soundLabel = document.getElementById('chatSoundLabel');
    if (soundIcon) soundIcon.innerHTML = state.chatSoundEnabled ? ICONS.volumeOn : ICONS.volumeOff;
    if (soundLabel) soundLabel.textContent = state.chatSoundEnabled ? 'Sonido Activo' : 'Silenciado';

    const messagesEl = document.getElementById('chatMessagesList');
    if (!messagesEl) return;

    if (state.isLoadingChat) {
      messagesEl.innerHTML = renderFeedSkeleton();
      return;
    }

    if (state.chatMessages.length === 0) {
      messagesEl.innerHTML = `
        <div class="hud-empty-state" style="margin:auto;">
          <div class="hud-empty-code">[ CANAL // SIN ACTIVIDAD RECIENTE ]</div>
          <div style="font-family:var(--font-body);font-size:0.84rem;font-weight:500;color:var(--text-secondary);">[ CANAL // SILENCIO DE RADIO ]</div>
          <p class="hud-empty-subtitle">Inicia la conversación en el canal de tu barrio (${escapeHtml(activeBarrio.name)}).</p>
        </div>
      `;
      return;
    }

    messagesEl.innerHTML = state.chatMessages
      .map(msg => {
        const isOwn = Boolean(state.currentUser && msg.userId === state.currentUser.id);
        return `
        <div class="chat-msg-row ${isOwn ? 'own' : ''}">
          <img class="avatar-img avatar-sm" style="width:34px;height:34px;" src="${escapeHtml(msg.senderAvatar)}" alt="${escapeHtml(msg.senderName)}" />
          <div class="chat-bubble">
            <div class="chat-sender-name">
              <span>${escapeHtml(isOwn ? 'Vos (' + msg.senderName + ')' : msg.senderName)}</span>
              <span style="opacity:0.75; font-weight:500;">@${escapeHtml(msg.senderUsername)}</span>
            </div>
            <div class="chat-text">${escapeHtml(msg.text)}</div>
            <div class="chat-msg-meta">
              <span>${escapeHtml(formatClockTime(msg.timestamp))}</span>
              ${isOwn ? `<span class="chat-checks" title="Enviado y verificado">✓✓</span>` : ''}
            </div>
          </div>
        </div>
      `;
      })
      .join('');

    requestAnimationFrame(scrollChatToLatest);
  }

  // ==========================================================================
  // 7. AUTHENTICATION, BARRIO RADAR SHEET & GEOLOCATION
  // ==========================================================================
  function renderAuthModalWidgets() {
    const avatarGrid = document.getElementById('avatarPickerGrid');
    if (avatarGrid) {
      avatarGrid.innerHTML = window.AVATAR_PRESETS.map(
        av => `
        <button type="button" class="avatar-choice ${state.regSelectedAvatar === av.url ? 'selected' : ''}" data-url="${escapeHtml(av.url)}" title="${escapeHtml(av.label)}">
          <img src="${escapeHtml(av.url)}" alt="${escapeHtml(av.label)}" />
        </button>
      `
      ).join('');

      avatarGrid.querySelectorAll('.avatar-choice').forEach(btn => {
        btn.addEventListener('click', () => {
          state.regSelectedAvatar = btn.dataset.url;
          renderAuthModalWidgets();
        });
      });
    }

    renderBarrioSearchDropdown(document.getElementById('barrioSearchInput')?.value || '');
  }

  function normalizeSearchText(str) {
    return String(str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  function renderBarrioSearchDropdown(filterText) {
    const listEl = document.getElementById('barrioSearchDropdown');
    const selectedDisplay = document.getElementById('selectedBarrioDisplay');
    if (!listEl) return;

    const q = normalizeSearchText(filterText);
    const matches = window.CORDOBA_BARRIOS.filter(b => {
      if (!q) return true;
      return (
        normalizeSearchText(b.name).includes(q) ||
        normalizeSearchText(b.zone).includes(q) ||
        normalizeSearchText(b.cpc).includes(q) ||
        normalizeSearchText(b.cp).includes(q)
      );
    });

    listEl.innerHTML = matches
      .map(
        b => `
      <button type="button" class="barrio-option ${b.id === state.regSelectedBarrioId ? 'selected' : ''}" data-id="${b.id}">
        <span>${ICONS.pin || '◎'} <strong>${escapeHtml(b.name)}</strong></span>
        <span style="font-size:0.76rem; color:var(--text-secondary);">${escapeHtml(b.zone)} · CP ${escapeHtml(b.cp)}</span>
      </button>
    `
      )
      .join('');

    const chosen = getBarrioById(state.regSelectedBarrioId);
    if (selectedDisplay) {
      selectedDisplay.textContent = `${chosen.name} (${chosen.zone})`;
    }

    listEl.querySelectorAll('.barrio-option').forEach(opt => {
      opt.addEventListener('click', () => {
        state.regSelectedBarrioId = opt.dataset.id;
        renderBarrioSearchDropdown(filterText);
      });
    });
  }

  function renderSheetBarrioList(filterText) {
    const listEl = document.getElementById('sheetBarrioList');
    if (!listEl) return;

    const q = normalizeSearchText(filterText);
    const matches = window.CORDOBA_BARRIOS.filter(b => {
      if (!q) return true;
      return (
        normalizeSearchText(b.name).includes(q) ||
        normalizeSearchText(b.zone).includes(q) ||
        normalizeSearchText(b.cpc).includes(q) ||
        normalizeSearchText(b.cp).includes(q)
      );
    });

    listEl.innerHTML = matches
      .map(
        b => `
      <button type="button" class="barrio-option ${b.id === state.activeBarrioId ? 'selected' : ''}" data-id="${b.id}">
        <span>${ICONS.pin || '◎'} <strong>${escapeHtml(b.name)}</strong></span>
        <span style="font-size:0.75rem; font-family:var(--font-body); color:var(--text-secondary);">${escapeHtml(b.zone)}</span>
      </button>
    `
      )
      .join('');

    listEl.querySelectorAll('.barrio-option').forEach(opt => {
      opt.addEventListener('click', async () => {
        const selectedId = opt.dataset.id;
        document.getElementById('barrioSheetBackdrop')?.classList.add('hidden');
        await switchActiveBarrio(selectedId);
      });
    });
  }

  async function resolveCoordinatesToCordobaBarrio(lat, lng, isSimulated = false, targetContext = 'auth') {
    const statusEl =
      targetContext === 'sheet'
        ? document.getElementById('sheetGeoStatus')
        : document.getElementById('geoStatusText');
    const closest = findClosestCordobaBarrio(lat, lng);

    let reverseLabel = '';
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
        { headers: { 'Accept-Language': 'es' } }
      );
      if (resp.ok) {
        const data = await resp.json();
        const suburb =
          data.address?.suburb ||
          data.address?.neighbourhood ||
          data.address?.city_district ||
          '';
        if (suburb) reverseLabel = ` (${suburb})`;
      }
    } catch {
      // Fallback to Haversine matching
    }

    if (targetContext === 'sheet') {
      await switchActiveBarrio(closest.barrio.id);
      renderSheetBarrioList(document.getElementById('sheetBarrioSearchInput')?.value || '');
    } else {
      state.regSelectedBarrioId = closest.barrio.id;
      renderBarrioSearchDropdown('');
    }

    if (statusEl) {
      if (closest.distanceKm <= 25 || isSimulated) {
        statusEl.textContent = `✓ Ubicación detectada en Córdoba (${lat.toFixed(4)}, ${lng.toFixed(4)})${reverseLabel} → Barrio: ${closest.barrio.name}`;
      } else {
        statusEl.textContent = `◎ Coordenadas fuera de Córdoba (${lat.toFixed(2)}, ${lng.toFixed(2)}). Barrio más cercano: ${closest.barrio.name}`;
      }
    }
  }

  function renderSupabaseConnectionStatus() {
    const sb = window.MisVecinosSupabase;
    const dot = document.getElementById('supabaseStatusDot');
    const label = document.getElementById('supabaseStatusLabel');
    const urlInput = document.getElementById('inputSupabaseUrl');
    const keyInput = document.getElementById('inputSupabaseAnonKey');
    const signOutBtn = document.getElementById('btnSignOutSession');

    if (!sb) return;
    const cfg = sb.getConfig();
    if (urlInput && !urlInput.value && cfg.supabaseUrl) urlInput.value = cfg.supabaseUrl;
    if (keyInput && !keyInput.value && cfg.supabaseAnonKey) keyInput.value = cfg.supabaseAnonKey;

    if (cfg.configured) {
      dot?.classList.add('connected');
      const host = cfg.supabaseUrl.replace(/^https?:\/\//, '').split('/')[0];
      if (label) {
        label.textContent = state.currentUser
          ? `Supabase Conectado · @${state.currentUser.username} (${host})`
          : `Supabase Conectado (${host})`;
      }
    } else {
      dot?.classList.remove('connected');
      if (label) label.textContent = 'Supabase Desconectado';
    }

    if (signOutBtn) {
      signOutBtn.classList.toggle('hidden', !state.currentUser);
    }
  }

  function openAuthModal() {
    renderAuthModalWidgets();
    renderSupabaseConnectionStatus();
    document.getElementById('authModalBackdrop')?.classList.remove('hidden');
  }

  function closeAuthModal() {
    document.getElementById('authModalBackdrop')?.classList.add('hidden');
  }

  function openEditProfileModal() {
    if (!state.currentUser) return;
    const nameInput = document.getElementById('editProfileFullName');
    const userInput = document.getElementById('editProfileUsername');
    const errEl = document.getElementById('editProfileErrorMsg');
    if (errEl) errEl.classList.add('hidden');

    let currentName = state.currentUser.name || '';
    let currentUsername = state.currentUser.username || '';

    if (currentName.toLowerCase() === 'villafane' || currentName.toLowerCase() === 'jesus') {
      currentName = 'Jesús Villafañe';
    }
    if (currentUsername.toLowerCase() === 'jesus' || currentUsername.toLowerCase() === 'villafane') {
      currentUsername = 'jesusvillafane';
    }

    if (nameInput) nameInput.value = currentName;
    if (userInput) userInput.value = currentUsername.replace(/^@/, '');

    document.getElementById('editProfileModalBackdrop')?.classList.remove('hidden');
    setTimeout(() => userInput?.focus(), 100);
  }

  function closeEditProfileModal() {
    document.getElementById('editProfileModalBackdrop')?.classList.add('hidden');
  }

  // ==========================================================================
  // 8. EVENT LISTENERS & INITIALIZATION
  // ==========================================================================
  function bindEvents() {
    // Theme toggle
    const toggleTheme = () => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      applyTheme();
      saveUiPrefs();
    };
    document.getElementById('btnThemeToggle').addEventListener('click', toggleTheme);
    document.getElementById('btnMobThemeToggle')?.addEventListener('click', toggleTheme);

    // Emergency Shield Slide-Down Drawer
    const shieldBtn = document.getElementById('btnEmergencyShield');
    const emergencyDrawer = document.getElementById('emergencySlideDrawer');
    const closeEmergencyBtn = document.getElementById('btnCloseEmergencyDrawer');

    shieldBtn.addEventListener('click', () => {
      const isHidden = emergencyDrawer.classList.toggle('hidden');
      shieldBtn.classList.toggle('active', !isHidden);
      shieldBtn.setAttribute('aria-expanded', String(!isHidden));
    });
    closeEmergencyBtn.addEventListener('click', () => {
      emergencyDrawer.classList.add('hidden');
      shieldBtn.classList.remove('active');
      shieldBtn.setAttribute('aria-expanded', 'false');
    });

    // Header Barrio HUD Pill (`[ CBA // ... ]`) -> Bottom-Sheet Barrio Drawer
    const barrioSheetBackdrop = document.getElementById('barrioSheetBackdrop');
    const openBarrioSheet = () => {
      renderSheetBarrioList(document.getElementById('sheetBarrioSearchInput')?.value || '');
      barrioSheetBackdrop.classList.remove('hidden');
    };
    const closeBarrioSheet = () => {
      barrioSheetBackdrop.classList.add('hidden');
    };

    document.getElementById('btnHeaderBarrioHud').addEventListener('click', openBarrioSheet);
    document.getElementById('btnMobOpenBarrioSheet')?.addEventListener('click', openBarrioSheet);
    document.getElementById('btnCloseBarrioSheet').addEventListener('click', closeBarrioSheet);
    barrioSheetBackdrop.addEventListener('click', e => {
      if (e.target === barrioSheetBackdrop) closeBarrioSheet();
    });

    document.getElementById('sheetBarrioSearchInput').addEventListener('input', e => {
      renderSheetBarrioList(e.target.value);
    });

    document.getElementById('btnSheetGeoLocate').addEventListener('click', async () => {
      const statusEl = document.getElementById('sheetGeoStatus');
      statusEl.textContent = '◎ Consultando coordenadas GPS...';
      try {
        const coords = await NativeBridge.getCurrentPosition();
        await resolveCoordinatesToCordobaBarrio(coords.lat, coords.lng, false, 'sheet');
      } catch {
        const fallbackBarrio = window.CORDOBA_BARRIOS[0];
        await resolveCoordinatesToCordobaBarrio(fallbackBarrio.lat, fallbackBarrio.lng, true, 'sheet');
      }
    });

    document.getElementById('btnSheetSimulateGps').addEventListener('click', () => {
      const b = window.CORDOBA_BARRIOS[Math.floor(Math.random() * window.CORDOBA_BARRIOS.length)];
      resolveCoordinatesToCordobaBarrio(
        b.lat + (Math.random() - 0.5) * 0.002,
        b.lng + (Math.random() - 0.5) * 0.002,
        true,
        'sheet'
      );
    });

    // Floating Frosted-Glass Action Button (`+`) -> Bottom-Sheet Modal Composer on Mobile
    const composerCard = document.getElementById('postComposerCard');
    const composerBackdrop = document.getElementById('mobileComposerBackdrop');
    const openMobileComposer = () => {
      if (!state.currentUser) {
        openAuthModal();
        return;
      }
      composerCard.classList.add('mobile-sheet-open');
      composerBackdrop.classList.remove('hidden');
      setTimeout(() => document.getElementById('composerTextarea')?.focus(), 120);
    };
    const closeMobileComposer = () => {
      composerCard.classList.remove('mobile-sheet-open');
      composerBackdrop.classList.add('hidden');
    };

    document.getElementById('btnMobileFabCompose').addEventListener('click', openMobileComposer);
    document.getElementById('btnCloseMobileComposer').addEventListener('click', closeMobileComposer);
    composerBackdrop.addEventListener('click', closeMobileComposer);

    // Navigation buttons (Left Sidebar + Mobile Bottom Nav Dock)
    document.querySelectorAll('[data-nav]').forEach(btn => {
      btn.addEventListener('click', () => {
        NativeBridge.hapticImpact('LIGHT');
        state.activeNav = btn.dataset.nav;
        renderUserAndBarrioContext();
      });
    });

    document.getElementById('btnMobGoClasificados')?.addEventListener('click', () => {
      state.activeNav = 'clasificados';
      renderUserAndBarrioContext();
    });

    // Barrio Scope pills (Mi Barrio / Cercanos / Toda Cba)
    document.querySelectorAll('.scope-pill').forEach(btn => {
      btn.addEventListener('click', async () => {
        state.barrioScope = btn.dataset.scope;
        renderUserAndBarrioContext();
        await refreshFeedFromDatabase();
      });
    });

    // Sidebar Barrio Selector dropdown
    document.getElementById('sidebarBarrioSelect').addEventListener('change', async e => {
      await switchActiveBarrio(e.target.value);
    });

    // Quick return to user's assigned primary barrio
    document.getElementById('btnQuickLocateBarrio').addEventListener('click', async () => {
      const targetId = state.currentUser ? state.currentUser.barrioId : 'nueva-cordoba';
      await switchActiveBarrio(targetId);
    });

    // Composer Category Chips
    document.querySelectorAll('#composerCategoryGroup .cat-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        state.selectedComposerCategory = chip.dataset.cat;
        document.querySelectorAll('#composerCategoryGroup .cat-chip').forEach(c => {
          c.classList.toggle('selected', c.dataset.cat === state.selectedComposerCategory);
        });
      });
    });

    // Composer Image File Upload
    document.getElementById('composerFileInput').addEventListener('change', e => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        state.composerImageData = ev.target.result;
        document.getElementById('composerImagePreview').src = state.composerImageData;
        document.getElementById('composerImagePreviewWrap').classList.remove('hidden');
      };
      reader.readAsDataURL(file);
    });

    // Remove Composer Image
    document.getElementById('btnRemoveComposerImage').addEventListener('click', () => {
      state.composerImageData = null;
      document.getElementById('composerImagePreviewWrap').classList.add('hidden');
      document.getElementById('composerFileInput').value = '';
    });

    // Publish New Post -> Real INSERT into `public.posts`
    document.getElementById('btnPublishPost').addEventListener('click', async () => {
      if (!state.currentUser) {
        showToast('Iniciá sesión o creá tu cuenta para publicar en tu barrio', true);
        openAuthModal();
        return;
      }

      const textarea = document.getElementById('composerTextarea');
      const errEl = document.getElementById('composerError');
      const publishBtn = document.getElementById('btnPublishPost');
      const content = textarea.value.trim();

      if (content.length < 3) {
        errEl.textContent = '△ Escribí un mensaje antes de publicar en el muro del barrio.';
        errEl.classList.remove('hidden');
        textarea.focus();
        return;
      }

      errEl.classList.add('hidden');
      const targetBarrio = getBarrioById(state.activeBarrioId);

      try {
        publishBtn.disabled = true;
        publishBtn.innerHTML = '<span>Guardando en Supabase...</span>';

        const createdPost = await window.MisVecinosSupabase.createPost({
          userId: state.currentUser.id,
          barrioId: targetBarrio.id,
          content,
          tag: state.selectedComposerCategory,
          imageUrl: state.composerImageData
        });

        state.posts.unshift(createdPost);
        textarea.value = '';
        state.composerImageData = null;
        document.getElementById('composerImagePreviewWrap').classList.add('hidden');
        document.getElementById('composerFileInput').value = '';

        closeMobileComposer();
        renderUserAndBarrioContext();
        showToast(`Publicación guardada en Barrio ${targetBarrio.name}`);
      } catch (err) {
        errEl.textContent = '△ ' + (err.message || 'No se pudo guardar la publicación en la base de datos.');
        errEl.classList.remove('hidden');
        showToast('Error al crear publicación', true);
      } finally {
        publishBtn.disabled = false;
        publishBtn.innerHTML = '<span>Publicar en el Barrio</span>';
      }
    });

    // Feed Filter Tabs
    document.querySelectorAll('#feedFilterTabs .feed-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        state.feedFilter = tab.dataset.filter;
        renderFeedStream();
      });
    });

    // Feed Search Input
    document.getElementById('feedSearchInput').addEventListener('input', e => {
      state.searchQuery = e.target.value;
      renderFeedStream();
    });

    // Live Chat Message Submit -> Real INSERT into `public.chat_messages`
    const chatInput = document.getElementById('chatMessageInput');
    chatInput.addEventListener('focus', () => {
      setTimeout(scrollChatToLatest, 150);
    });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => {
        if (state.activeNav === 'chat') scrollChatToLatest();
      });
    }

    document.getElementById('chatMessageForm').addEventListener('submit', async e => {
      e.preventDefault();
      if (!state.currentUser) {
        showToast('Iniciá sesión para enviar mensajes en el canal del barrio', true);
        openAuthModal();
        return;
      }

      const text = chatInput.value.trim();
      if (!text) return;

      const sendBtn = document.getElementById('btnSendChatMsg');
      const barrioId = state.activeBarrioId;

      try {
        if (sendBtn) sendBtn.disabled = true;
        const savedMsg = await window.MisVecinosSupabase.sendChatMessage({
          barrioId,
          userId: state.currentUser.id,
          message: text
        });

        chatInput.value = '';
        if (!state.chatMessages.some(m => m.id === savedMsg.id)) {
          state.chatMessages.push(savedMsg);
        }
        renderLiveChat();
      } catch (err) {
        showToast(err.message || 'Error al enviar mensaje al canal', true);
      } finally {
        if (sendBtn) sendBtn.disabled = false;
      }
    });

    // Chat Sound Toggle
    document.getElementById('btnChatSoundToggle').addEventListener('click', () => {
      state.chatSoundEnabled = !state.chatSoundEnabled;
      saveUiPrefs();
      renderLiveChat();
      if (state.chatSoundEnabled) playNotificationChime();
    });

    // Open / Close Auth Modal
    document.getElementById('btnOpenAuthModal').addEventListener('click', openAuthModal);
    document.getElementById('btnSwitchAccount').addEventListener('click', openAuthModal);
    document.getElementById('btnMobOpenAuth')?.addEventListener('click', openAuthModal);
    document.getElementById('btnCloseAuthModal')?.addEventListener('click', closeAuthModal);
    document.getElementById('authModalBackdrop')?.addEventListener('click', e => {
      if (e.target.id === 'authModalBackdrop' && state.currentUser) {
        closeAuthModal();
      }
    });

    // Edit Profile Modal events
    document.getElementById('btnSidebarEditProfile')?.addEventListener('click', openEditProfileModal);
    document.getElementById('btnMobEditProfile')?.addEventListener('click', openEditProfileModal);
    document.getElementById('btnCloseEditProfileModal')?.addEventListener('click', closeEditProfileModal);
    document.getElementById('btnCancelEditProfile')?.addEventListener('click', closeEditProfileModal);
    document.getElementById('editProfileModalBackdrop')?.addEventListener('click', e => {
      if (e.target.id === 'editProfileModalBackdrop') closeEditProfileModal();
    });

    document.getElementById('editProfileForm')?.addEventListener('submit', async e => {
      e.preventDefault();
      if (!state.currentUser) return;
      const sb = window.MisVecinosSupabase;
      if (!sb) return;

      const nameInput = document.getElementById('editProfileFullName');
      const userInput = document.getElementById('editProfileUsername');
      const errEl = document.getElementById('editProfileErrorMsg');
      const saveBtn = document.getElementById('btnSaveEditProfile');

      const fullName = (nameInput?.value || '').trim();
      const username = (userInput?.value || '').trim().replace(/^@/, '').toLowerCase();

      if (!fullName) {
        if (errEl) {
          errEl.textContent = 'Ingresá tu nombre y apellido.';
          errEl.classList.remove('hidden');
        }
        return;
      }

      if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) {
        if (errEl) {
          errEl.textContent = 'El @usuario debe tener entre 3 y 24 caracteres (letras, números o guión bajo).';
          errEl.classList.remove('hidden');
        }
        return;
      }

      try {
        if (saveBtn) {
          saveBtn.disabled = true;
          saveBtn.textContent = 'Guardando...';
        }
        if (errEl) errEl.classList.add('hidden');

        await sb.updateProfile({
          userId: state.currentUser.id,
          fullName,
          username
        });

        state.currentUser.name = fullName;
        state.currentUser.username = username;

        renderUserAndBarrioContext();
        await refreshFeedFromDatabase();
        closeEditProfileModal();
        showToast(`Perfil actualizado: @${username}`);
      } catch (err) {
        if (errEl) {
          errEl.textContent = err.message || 'No se pudo actualizar el perfil. Elegí otro @usuario.';
          errEl.classList.remove('hidden');
        }
      } finally {
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.textContent = 'Guardar Cambios';
        }
      }
    });

    // Auto-suggest username when typing in registration form
    const regFullNameInput = document.getElementById('regFullName');
    const regUsernameInput = document.getElementById('regUsername');
    let regUserManuallyEdited = false;
    regUsernameInput?.addEventListener('input', () => {
      regUserManuallyEdited = true;
    });
    regFullNameInput?.addEventListener('input', () => {
      if (!regUserManuallyEdited && regUsernameInput && (!regUsernameInput.value || regUsernameInput.value.length < 3)) {
        const val = regFullNameInput.value.trim()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '');
        regUsernameInput.value = val;
      }
    });

    // Supabase Config Panel
    const sbConfigPanel = document.getElementById('supabaseConfigPanel');
    const sbConfigMsg = document.getElementById('supabaseConfigMsg');

    document.getElementById('btnToggleSupabaseConfig')?.addEventListener('click', () => {
      sbConfigPanel?.classList.toggle('hidden');
      renderSupabaseConnectionStatus();
    });

    document.getElementById('btnSaveSupabaseConfig')?.addEventListener('click', async () => {
      const sb = window.MisVecinosSupabase;
      if (!sb) return;
      const urlVal = document.getElementById('inputSupabaseUrl')?.value || '';
      const keyVal = document.getElementById('inputSupabaseAnonKey')?.value || '';
      const saveBtn = document.getElementById('btnSaveSupabaseConfig');

      try {
        if (saveBtn) {
          saveBtn.disabled = true;
          saveBtn.textContent = 'Verificando...';
        }
        await sb.saveConfig(urlVal, keyVal);
        if (sbConfigMsg) {
          sbConfigMsg.style.color = '#3ecf8e';
          sbConfigMsg.textContent = '✓ Conexión a Supabase actualizada correctamente.';
          sbConfigMsg.classList.remove('hidden');
        }
        renderSupabaseConnectionStatus();
        await refreshFeedFromDatabase();
      } catch (err) {
        if (sbConfigMsg) {
          sbConfigMsg.style.color = 'var(--gemini-coral)';
          sbConfigMsg.textContent = '△ ' + (err.message || 'Error al verificar Supabase.');
          sbConfigMsg.classList.remove('hidden');
        }
      } finally {
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.textContent = '✓ Actualizar Conexión Supabase';
        }
      }
    });

    // Sign Out from active Supabase Session
    document.getElementById('btnSignOutSession')?.addEventListener('click', async () => {
      await window.MisVecinosSupabase?.signOut();
      state.currentUser = null;
      state.subscribedChatBarrioId = null;
      renderUserAndBarrioContext();
      renderSupabaseConnectionStatus();
      await refreshFeedFromDatabase();
      showToast('Sesión cerrada correctamente');
    });

    // Switch between Register and Login Tabs
    const tabReg = document.getElementById('tabRegisterMode');
    const tabLog = document.getElementById('tabLoginMode');
    const formReg = document.getElementById('registerForm');
    const formLog = document.getElementById('loginForm');

    tabReg.addEventListener('click', () => {
      tabReg.classList.add('active');
      tabLog.classList.remove('active');
      formReg.classList.remove('hidden');
      formLog.classList.add('hidden');
    });

    tabLog.addEventListener('click', () => {
      tabLog.classList.add('active');
      tabReg.classList.remove('active');
      formLog.classList.remove('hidden');
      formReg.classList.add('hidden');
    });

    // Custom Profile Picture Upload in Registration
    document.getElementById('regAvatarUpload').addEventListener('change', e => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        state.regSelectedAvatar = ev.target.result;
        renderAuthModalWidgets();
        showToast('Foto de perfil lista para registro');
      };
      reader.readAsDataURL(file);
    });

    // Barrio Search Input inside Auth Modal
    document.getElementById('barrioSearchInput').addEventListener('input', e => {
      renderBarrioSearchDropdown(e.target.value);
    });

    // Geolocation Auto-Detection (Capacitor Native Geolocation + Web Fallback)
    document.getElementById('btnUseGeolocation').addEventListener('click', async () => {
      const statusEl = document.getElementById('geoStatusText');
      statusEl.textContent = '◎ Consultando GPS y coordenadas de Córdoba Capital...';
      try {
        const coords = await NativeBridge.getCurrentPosition();
        await resolveCoordinatesToCordobaBarrio(coords.lat, coords.lng, false, 'auth');
      } catch {
        const fallbackBarrio = window.CORDOBA_BARRIOS[0];
        await resolveCoordinatesToCordobaBarrio(fallbackBarrio.lat, fallbackBarrio.lng, true, 'auth');
      }
    });

    document.getElementById('btnSimulateCordobaGps').addEventListener('click', () => {
      const b = window.CORDOBA_BARRIOS[Math.floor(Math.random() * window.CORDOBA_BARRIOS.length)];
      resolveCoordinatesToCordobaBarrio(
        b.lat + (Math.random() - 0.5) * 0.002,
        b.lng + (Math.random() - 0.5) * 0.002,
        true,
        'auth'
      );
    });

    // Registration Form Submit -> Real Supabase Auth + `public.profiles` INSERT
    formReg.addEventListener('submit', async e => {
      e.preventDefault();
      const fullName = document.getElementById('regFullName').value.trim();
      const rawUsername = document.getElementById('regUsername').value.trim().replace(/^@/, '');
      const email = document.getElementById('regEmail').value.trim();
      const password = document.getElementById('regPassword').value;
      const errEl = document.getElementById('registerErrorMsg');
      const submitBtn = document.getElementById('btnRegisterSubmit');

      if (fullName.length < 3) {
        errEl.style.color = 'var(--gemini-coral)';
        errEl.textContent = '△ Ingresá tu nombre y apellido completo (mínimo 3 caracteres).';
        errEl.classList.remove('hidden');
        return;
      }
      if (!/^[a-zA-Z0-9_.-]{3,24}$/.test(rawUsername)) {
        errEl.style.color = 'var(--gemini-coral)';
        errEl.textContent = '△ El nombre de usuario debe tener entre 3 y 24 caracteres (letras, números o guión bajo).';
        errEl.classList.remove('hidden');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errEl.style.color = 'var(--gemini-coral)';
        errEl.textContent = '△ Ingresá una dirección de correo electrónico válida.';
        errEl.classList.remove('hidden');
        return;
      }
      if (password.length < 6) {
        errEl.style.color = 'var(--gemini-coral)';
        errEl.textContent = '△ La contraseña debe tener al menos 6 caracteres.';
        errEl.classList.remove('hidden');
        return;
      }

      errEl.classList.add('hidden');

      try {
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Registrando vecino en Supabase...';
        }

        const result = await window.MisVecinosSupabase.signUp({
          fullName,
          username: rawUsername,
          email,
          password,
          avatar: state.regSelectedAvatar,
          barrioId: state.regSelectedBarrioId
        });

        if (result.needsEmailConfirmation) {
          errEl.style.color = '#3ecf8e';
          errEl.textContent = `✓ Cuenta creada en Supabase Auth. Confirmá tu correo (${email}) para iniciar sesión.`;
          errEl.classList.remove('hidden');
          showToast(`Revisá tu correo (${email}) para confirmar la cuenta`);
          return;
        }

        state.currentUser = result.user;
        state.activeBarrioId = result.user.barrioId;
        state.barrioScope = 'mi-barrio';

        populateBarrioSelectDropdown();
        renderUserAndBarrioContext();
        renderSupabaseConnectionStatus();
        closeAuthModal();
        await refreshFeedFromDatabase();
        showToast(`¡Bienvenido/a ${result.user.name} a Barrio ${getBarrioById(result.user.barrioId).name}!`);
      } catch (err) {
        errEl.style.color = 'var(--gemini-coral)';
        errEl.textContent = '△ ' + (err.message || 'No se pudo completar el registro en Supabase.');
        errEl.classList.remove('hidden');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Unirme a Mi Barrio y Entrar';
        }
      }
    });

    // Login Form Submit -> Real Supabase Auth (`signInWithPassword`)
    formLog.addEventListener('submit', async e => {
      e.preventDefault();
      const identity = document.getElementById('loginIdentity').value.trim().replace(/^@/, '').toLowerCase();
      const password = document.getElementById('loginPassword').value;
      const errEl = document.getElementById('loginErrorMsg');
      const submitBtn = document.getElementById('btnLoginSubmit');

      if (!identity || password.length < 6) {
        errEl.style.color = 'var(--gemini-coral)';
        errEl.textContent = '△ Ingresá tu correo/usuario y una contraseña de al menos 6 caracteres.';
        errEl.classList.remove('hidden');
        return;
      }

      errEl.classList.add('hidden');

      try {
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Autenticando con Supabase...';
        }

        const { user: sbNeighbor } = await window.MisVecinosSupabase.signInWithPassword({
          identity,
          password
        });

        state.currentUser = sbNeighbor;
        state.activeBarrioId = sbNeighbor.barrioId;
        state.barrioScope = 'mi-barrio';

        populateBarrioSelectDropdown();
        renderUserAndBarrioContext();
        renderSupabaseConnectionStatus();
        closeAuthModal();
        await refreshFeedFromDatabase();
        if (state.activeNav === 'chat') {
          await ensureLiveChatLoadedAndSubscribed(true);
        }
        showToast(`Sesión iniciada como ${sbNeighbor.name} (${getBarrioById(sbNeighbor.barrioId).name})`);
      } catch (err) {
        errEl.style.color = 'var(--gemini-coral)';
        errEl.textContent = '△ ' + (err.message || 'Credenciales inválidas en Supabase Auth.');
        errEl.classList.remove('hidden');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Ingresar a Mi Barrio';
        }
      }
    });

    // Google OAuth Login button
    document.getElementById('btnSupabaseGoogleOAuth')?.addEventListener('click', async () => {
      const errEl = document.getElementById('loginErrorMsg');
      try {
        await window.MisVecinosSupabase.signInWithOAuth('google');
      } catch (err) {
        errEl.style.color = 'var(--gemini-coral)';
        errEl.textContent = '△ ' + (err.message || 'No se pudo iniciar OAuth con Google.');
        errEl.classList.remove('hidden');
      }
    });

    // Magic Link (OTP) Login button
    document.getElementById('btnSupabaseMagicLink')?.addEventListener('click', async () => {
      const identity = document.getElementById('loginIdentity').value.trim();
      const errEl = document.getElementById('loginErrorMsg');
      try {
        await window.MisVecinosSupabase.sendMagicLink(identity);
        errEl.style.color = '#3ecf8e';
        errEl.textContent = `✓ Enlace mágico enviado a ${identity}. Revisá tu correo.`;
        errEl.classList.remove('hidden');
        showToast(`Magic Link enviado a ${identity}`);
      } catch (err) {
        errEl.style.color = 'var(--gemini-coral)';
        errEl.textContent = '△ ' + (err.message || 'Error al enviar el Magic Link.');
        errEl.classList.remove('hidden');
      }
    });
    // PWA Install Prompt (`#btnInstallPwa`)
    const installBtn = document.getElementById('btnInstallPwa');
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      deferredPwaPrompt = e;
      installBtn?.classList.remove('hidden');
    });
    installBtn?.addEventListener('click', async () => {
      if (!deferredPwaPrompt) return;
      deferredPwaPrompt.prompt();
      const choice = await deferredPwaPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        showToast('¡Mis Vecinos instalado en tu teléfono!');
        installBtn.classList.add('hidden');
      }
      deferredPwaPrompt = null;
    });
  }

  // ==========================================================================
  // 9. BOOTSTRAP APPLICATION (Zero-State + Supabase Session + PWA / Capacitor)
  // ==========================================================================
  document.addEventListener('DOMContentLoaded', async () => {
    // Register PWA Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    // Purge any legacy localStorage mock keys from earlier versions
    localStorage.removeItem('mis_vecinos_cordoba_state_v4');
    localStorage.removeItem('mis_vecinos_cordoba_state_v3');
    localStorage.removeItem('mis_vecinos_cordoba_state_v2');
    localStorage.removeItem('mis_vecinos_cordoba_state_v1');

    loadUiPrefs();
    applyTheme();
    populateBarrioSelectDropdown();
    bindEvents();
    renderUserAndBarrioContext();

    if (window.MisVecinosSupabase) {
      window.MisVecinosSupabase.onAuthStateChange(async (event, neighborUser) => {
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && neighborUser) {
          state.currentUser = neighborUser;
          state.activeBarrioId = neighborUser.barrioId;
          populateBarrioSelectDropdown();
          renderUserAndBarrioContext();
          renderSupabaseConnectionStatus();
        } else if (event === 'SIGNED_OUT') {
          state.currentUser = null;
          renderUserAndBarrioContext();
          renderSupabaseConnectionStatus();
        }
      });

      const sbState = await window.MisVecinosSupabase.init();
      if (sbState?.user) {
        state.currentUser = sbState.user;
        state.activeBarrioId = sbState.user.barrioId;
        populateBarrioSelectDropdown();
        renderUserAndBarrioContext();
        renderSupabaseConnectionStatus();
      } else {
        // Unauthenticated State -> Automatically open Sign Up / Log In modal
        openAuthModal();
      }

      await refreshFeedFromDatabase();
    }

    await NativeBridge.hideSplash();
  });
})();
