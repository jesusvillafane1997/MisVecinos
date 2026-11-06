// ============================================================================
// MIS VECINOS (Córdoba, Argentina) — Dynamic Supabase Database & Auth Layer
// 100% Live Database Operations (Zero Mock Data)
// Tables: barrios, profiles, posts, post_likes, post_comments, chat_messages
// ============================================================================

(function () {
  'use strict';

  const CONFIG_STORAGE_KEY = 'mis_vecinos_supabase_config_v2';
  const SESSION_STORAGE_KEY = 'mis_vecinos_supabase_session_v2';

  // Live Supabase Project for "Mis Vecinos" (sa-east-1)
  const DEFAULT_SUPABASE_URL = 'https://udewxnhyjuibmloppabi.supabase.co';
  const DEFAULT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkZXd4bmh5anVpYm1sb3BwYWJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM4MDc1NjIsImV4cCI6MjEwOTM4MzU2Mn0.n5nGbjA3eaA_-hs0rSrc_51FwMNvuk6pP4JgyE2kCtU';

  let config = {
    supabaseUrl: DEFAULT_SUPABASE_URL,
    supabaseAnonKey: DEFAULT_SUPABASE_KEY
  };

  let sdkClient = null;
  let activeSession = null;
  let activeChatChannel = null;
  let authStateListeners = [];
  const profileCache = new Map();

  function isConfigured() {
    return Boolean(
      config.supabaseUrl &&
      config.supabaseAnonKey &&
      /^https?:\/\/.+/i.test(config.supabaseUrl) &&
      !config.supabaseUrl.includes('your-project-id')
    );
  }

  function getConfig() {
    return {
      supabaseUrl: config.supabaseUrl,
      supabaseAnonKey: config.supabaseAnonKey,
      configured: isConfigured()
    };
  }

  function getAccessToken() {
    return activeSession?.access_token || config.supabaseAnonKey;
  }

  function instantiateSdkClient() {
    sdkClient = null;
    if (!isConfigured()) return null;
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      try {
        sdkClient = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        });
        sdkClient.auth.onAuthStateChange((event, session) => {
          activeSession = session;
          if (session?.user) {
            hydrateNeighborFromSupabaseUser(session.user, session.access_token).then(neighbor => {
              notifyListeners(event, neighbor, session);
            });
          } else if (event === 'SIGNED_OUT') {
            notifyListeners('SIGNED_OUT', null, null);
          }
        });
      } catch (err) {
        console.warn('Could not initialize @supabase/supabase-js client, using REST fallback:', err);
      }
    }
    return sdkClient;
  }

  function notifyListeners(event, neighborUser, session) {
    authStateListeners.forEach(fn => {
      try {
        fn(event, neighborUser, session);
      } catch (err) {
        console.warn('Auth listener error:', err);
      }
    });
  }

  function onAuthStateChange(callback) {
    if (typeof callback === 'function') {
      authStateListeners.push(callback);
    }
  }

  // ==========================================================================
  // 1. INITIALIZATION & SESSION RESTORATION
  // ==========================================================================
  async function init() {
    try {
      const localRaw = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (localRaw) {
        const parsed = JSON.parse(localRaw);
        if (parsed.supabaseUrl && parsed.supabaseAnonKey) {
          config.supabaseUrl = String(parsed.supabaseUrl).trim().replace(/\/+$/, '');
          config.supabaseAnonKey = String(parsed.supabaseAnonKey).trim();
        }
      }
    } catch {
      // Ignore storage read error
    }

    if (window.location.protocol.startsWith('http')) {
      try {
        const res = await fetch('/api/supabase-config');
        if (res.ok) {
          const serverCfg = await res.json();
          if (serverCfg.configured && serverCfg.supabaseUrl && serverCfg.supabaseAnonKey) {
            config.supabaseUrl = serverCfg.supabaseUrl.trim().replace(/\/+$/, '');
            config.supabaseAnonKey = serverCfg.supabaseAnonKey.trim();
            localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
          }
        }
      } catch {
        // Ignore if static server
      }
    }

    instantiateSdkClient();

    if (!isConfigured()) {
      return { configured: false, user: null };
    }

    try {
      if (sdkClient) {
        const { data, error } = await sdkClient.auth.getSession();
        if (!error && data?.session?.user) {
          activeSession = data.session;
          const neighbor = await hydrateNeighborFromSupabaseUser(
            data.session.user,
            data.session.access_token
          );
          return { configured: true, user: neighbor, session: data.session };
        }
      } else {
        if (window.location.hash && window.location.hash.includes('access_token=')) {
          const params = new URLSearchParams(window.location.hash.slice(1));
          const accessToken = params.get('access_token');
          if (accessToken) {
            const userObj = await fetchGoTrueUser(accessToken);
            if (userObj) {
              activeSession = { access_token: accessToken, user: userObj };
              localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(activeSession));
              window.history.replaceState({}, document.title, window.location.pathname);
              const neighbor = await hydrateNeighborFromSupabaseUser(userObj, accessToken);
              return { configured: true, user: neighbor, session: activeSession };
            }
          }
        }

        const savedSessionRaw = localStorage.getItem(SESSION_STORAGE_KEY);
        if (savedSessionRaw) {
          const savedSession = JSON.parse(savedSessionRaw);
          if (savedSession?.access_token) {
            const userObj = await fetchGoTrueUser(savedSession.access_token);
            if (userObj) {
              activeSession = { ...savedSession, user: userObj };
              const neighbor = await hydrateNeighborFromSupabaseUser(userObj, savedSession.access_token);
              return { configured: true, user: neighbor, session: activeSession };
            } else {
              localStorage.removeItem(SESSION_STORAGE_KEY);
            }
          }
        }
      }
    } catch (err) {
      console.warn('Session check warning:', err);
    }

    return { configured: true, user: null };
  }

  async function saveConfig(supabaseUrl, supabaseAnonKey) {
    const cleanUrl = String(supabaseUrl || '').trim().replace(/\/+$/, '');
    const cleanKey = String(supabaseAnonKey || '').trim();

    if (!/^https?:\/\/.+/i.test(cleanUrl)) {
      throw new Error('La URL de Supabase debe tener el formato https://tu-proyecto.supabase.co');
    }
    if (cleanKey.length < 20) {
      throw new Error('La clave pública (anon key) de Supabase parece inválida o incompleta.');
    }

    const resp = await fetch(`${cleanUrl}/auth/v1/settings`, {
      headers: {
        apikey: cleanKey,
        Authorization: `Bearer ${cleanKey}`
      }
    });
    if (!resp.ok && resp.status === 401) {
      throw new Error('Supabase rechazó la Anon Key (401 Unauthorized). Verificá tu clave pública.');
    }

    config.supabaseUrl = cleanUrl;
    config.supabaseAnonKey = cleanKey;
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));

    if (window.location.protocol.startsWith('http')) {
      fetch('/api/supabase-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      }).catch(() => {});
    }

    instantiateSdkClient();
    return getConfig();
  }

  async function fetchGoTrueUser(accessToken) {
    const resp = await fetch(`${config.supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: config.supabaseAnonKey,
        Authorization: `Bearer ${accessToken}`
      }
    });
    if (!resp.ok) return null;
    return resp.json();
  }

  // ==========================================================================
  // 2. PROFILES & AUTHENTICATION (`public.profiles` + `auth.users`)
  // ==========================================================================
  async function hydrateNeighborFromSupabaseUser(sbUser, accessToken) {
    if (!sbUser) return null;
    const meta = sbUser.user_metadata || {};
    let profileRow = null;

    try {
      if (sdkClient) {
        const { data } = await sdkClient
          .from('profiles')
          .select('*')
          .eq('id', sbUser.id)
          .maybeSingle();
        if (data) profileRow = data;
      } else {
        const token = accessToken || getAccessToken();
        const resp = await fetch(
          `${config.supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(sbUser.id)}&select=*`,
          {
            headers: {
              apikey: config.supabaseAnonKey,
              Authorization: `Bearer ${token}`
            }
          }
        );
        if (resp.ok) {
          const rows = await resp.json();
          if (Array.isArray(rows) && rows.length > 0) profileRow = rows[0];
        }
      }
    } catch {
      // Fallback to metadata if needed
    }

    const emailPrefix = (sbUser.email || 'vecino').split('@')[0].replace(/[^a-zA-Z0-9_.-]/g, '_');
    const defaultAvatar = (window.AVATAR_PRESETS && window.AVATAR_PRESETS[0]?.url) || '';

    const neighbor = {
      id: sbUser.id,
      name: profileRow?.full_name || meta.full_name || meta.name || emailPrefix,
      username: (profileRow?.username || meta.username || emailPrefix).toLowerCase(),
      email: (sbUser.email || profileRow?.email || '').toLowerCase(),
      avatar: profileRow?.avatar_url || meta.avatar_url || meta.picture || defaultAvatar,
      barrioId: profileRow?.barrio_id || meta.barrio_id || 'nueva-cordoba',
      isSupabaseAuth: true
    };

    profileCache.set(neighbor.id, neighbor);
    return neighbor;
  }

  async function fetchProfileById(userId) {
    if (!userId) return null;
    if (profileCache.has(userId)) return profileCache.get(userId);

    try {
      let row = null;
      if (sdkClient) {
        const { data } = await sdkClient
          .from('profiles')
          .select('id, username, full_name, avatar_url, barrio_id')
          .eq('id', userId)
          .maybeSingle();
        row = data;
      } else {
        const resp = await fetch(
          `${config.supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=id,username,full_name,avatar_url,barrio_id`,
          {
            headers: {
              apikey: config.supabaseAnonKey,
              Authorization: `Bearer ${getAccessToken()}`
            }
          }
        );
        if (resp.ok) {
          const rows = await resp.json();
          row = rows?.[0] || null;
        }
      }
      if (row) {
        const defaultAvatar = (window.AVATAR_PRESETS && window.AVATAR_PRESETS[0]?.url) || '';
        const formatted = {
          id: row.id,
          name: row.full_name || row.username || 'Vecino',
          username: row.username || 'vecino',
          avatar: row.avatar_url || defaultAvatar,
          barrioId: row.barrio_id || 'nueva-cordoba'
        };
        profileCache.set(userId, formatted);
        return formatted;
      }
    } catch {
      // Ignore profile fetch error
    }
    return null;
  }

  async function upsertProfileTable(profilePayload, accessToken) {
    const token = accessToken || getAccessToken();
    if (sdkClient) {
      const { error } = await sdkClient.from('profiles').upsert(profilePayload, { onConflict: 'id' });
      if (error) throw new Error(translateSupabaseError(error.message));
    } else {
      const resp = await fetch(`${config.supabaseUrl}/rest/v1/profiles`, {
        method: 'POST',
        headers: {
          apikey: config.supabaseAnonKey,
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates'
        },
        body: JSON.stringify(profilePayload)
      });
      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(translateSupabaseError(errData.message || 'No se pudo guardar el perfil en public.profiles'));
      }
    }
  }

  async function resolveUsernameToEmail(identity) {
    const clean = String(identity || '').trim().replace(/^@/, '').toLowerCase();
    if (clean.includes('@')) return clean;

    if (sdkClient) {
      const { data } = await sdkClient
        .from('profiles')
        .select('email')
        .ilike('username', clean)
        .maybeSingle();
      if (data?.email) return data.email;
    } else {
      const resp = await fetch(
        `${config.supabaseUrl}/rest/v1/profiles?username=ilike.${encodeURIComponent(clean)}&select=email&limit=1`,
        {
          headers: {
            apikey: config.supabaseAnonKey,
            Authorization: `Bearer ${config.supabaseAnonKey}`
          }
        }
      );
      if (resp.ok) {
        const rows = await resp.json();
        if (Array.isArray(rows) && rows[0]?.email) {
          return rows[0].email;
        }
      }
    }

    throw new Error(
      `No existe ningún vecino registrado con el usuario @${clean}. Creá tu cuenta primero.`
    );
  }

  async function signUp({ fullName, username, email, password, avatar, barrioId }) {
    if (!isConfigured()) {
      throw new Error('Supabase no está configurado.');
    }

    const cleanUsername = username.trim().replace(/^@/, '').toLowerCase();
    const cleanEmail = email.trim().toLowerCase();
    const cleanBarrio = barrioId || 'nueva-cordoba';
    const metadata = {
      full_name: fullName.trim(),
      username: cleanUsername,
      avatar_url: avatar || '',
      barrio_id: cleanBarrio
    };

    let sbUser = null;
    let session = null;

    if (sdkClient) {
      const { data, error } = await sdkClient.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: metadata,
          emailRedirectTo: window.location.origin
        }
      });
      if (error) throw new Error(translateSupabaseError(error.message));
      sbUser = data?.user;
      session = data?.session;
    } else {
      const resp = await fetch(`${config.supabaseUrl}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          apikey: config.supabaseAnonKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: cleanEmail,
          password,
          data: metadata
        })
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(translateSupabaseError(data.msg || data.error_description || data.message || 'Error al registrar usuario'));
      }
      sbUser = data.user || (data.id ? data : null);
      session = data.access_token ? data : null;
      if (session) {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      }
    }

    if (sbUser && session?.access_token) {
      activeSession = session;
      await upsertProfileTable(
        {
          id: sbUser.id,
          email: cleanEmail,
          username: cleanUsername,
          full_name: fullName.trim(),
          avatar_url: avatar || '',
          barrio_id: cleanBarrio
        },
        session.access_token
      );
    }

    const neighbor = sbUser
      ? await hydrateNeighborFromSupabaseUser(sbUser, session?.access_token)
      : null;

    return {
      user: neighbor,
      session,
      needsEmailConfirmation: Boolean(sbUser && !session)
    };
  }

  async function signInWithPassword({ identity, password }) {
    if (!isConfigured()) {
      throw new Error('Supabase no está configurado.');
    }

    const email = await resolveUsernameToEmail(identity);
    let sbUser = null;
    let session = null;

    if (sdkClient) {
      const { data, error } = await sdkClient.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw new Error(translateSupabaseError(error.message));
      sbUser = data.user;
      session = data.session;
    } else {
      const resp = await fetch(`${config.supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          apikey: config.supabaseAnonKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(translateSupabaseError(data.error_description || data.msg || data.message || 'Credenciales inválidas'));
      }
      sbUser = data.user;
      session = data;
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    }

    activeSession = session;
    const neighbor = await hydrateNeighborFromSupabaseUser(sbUser, session?.access_token);
    return { user: neighbor, session };
  }

  async function signInWithOAuth(provider = 'google') {
    if (!isConfigured()) {
      throw new Error('Configurá primero tu conexión a Supabase.');
    }
    if (sdkClient) {
      const { error } = await sdkClient.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin }
      });
      if (error) throw new Error(translateSupabaseError(error.message));
    } else {
      const redirectUrl = encodeURIComponent(window.location.origin);
      window.location.href = `${config.supabaseUrl}/auth/v1/authorize?provider=${encodeURIComponent(provider)}&redirect_to=${redirectUrl}`;
    }
  }

  async function sendMagicLink(email) {
    if (!isConfigured()) {
      throw new Error('Configurá primero tu conexión a Supabase.');
    }
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      throw new Error('Ingresá un correo electrónico válido para recibir el Magic Link.');
    }

    if (sdkClient) {
      const { error } = await sdkClient.auth.signInWithOtp({
        email: cleanEmail,
        options: { emailRedirectTo: window.location.origin }
      });
      if (error) throw new Error(translateSupabaseError(error.message));
    } else {
      const resp = await fetch(`${config.supabaseUrl}/auth/v1/otp`, {
        method: 'POST',
        headers: {
          apikey: config.supabaseAnonKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: cleanEmail, create_user: true })
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(translateSupabaseError(data.msg || data.error_description || 'No se pudo enviar el Magic Link'));
      }
    }
    return true;
  }

  async function signOut() {
    try {
      unsubscribeChat();
      if (sdkClient) {
        await sdkClient.auth.signOut();
      } else if (activeSession?.access_token && isConfigured()) {
        await fetch(`${config.supabaseUrl}/auth/v1/logout`, {
          method: 'POST',
          headers: {
            apikey: config.supabaseAnonKey,
            Authorization: `Bearer ${activeSession.access_token}`
          }
        });
      }
    } catch {
      // Ignore logout network error
    } finally {
      activeSession = null;
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }

  async function updateProfileBarrio(userId, barrioId) {
    if (!isConfigured() || !userId || !barrioId) return;
    if (sdkClient) {
      await sdkClient.auth.updateUser({ data: { barrio_id: barrioId } });
      const { error } = await sdkClient
        .from('profiles')
        .update({ barrio_id: barrioId, updated_at: new Date().toISOString() })
        .eq('id', userId);
      if (error) throw new Error(translateSupabaseError(error.message));
    } else {
      await fetch(`${config.supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`, {
        method: 'PATCH',
        headers: {
          apikey: config.supabaseAnonKey,
          Authorization: `Bearer ${getAccessToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ barrio_id: barrioId, updated_at: new Date().toISOString() })
      });
    }
  }

  // ==========================================================================
  // 3. FEED POSTS, LIKES & COMMENTS CRUD (`posts`, `post_likes`, `post_comments`)
  // ==========================================================================
  function formatPostRow(row, currentUserId) {
    const defaultAvatar = (window.AVATAR_PRESETS && window.AVATAR_PRESETS[0]?.url) || '';
    const authorObj = row.author || {};
    const likesArr = Array.isArray(row.post_likes) ? row.post_likes : [];
    const commentsArr = Array.isArray(row.post_comments) ? row.post_comments : [];

    // Sort comments oldest-first
    commentsArr.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    const barrioMeta = (window.CORDOBA_BARRIOS || []).find(b => b.id === row.barrio_id);

    return {
      id: row.id,
      userId: row.user_id,
      author: {
        id: authorObj.id || row.user_id,
        name: authorObj.full_name || authorObj.username || 'Vecino de Córdoba',
        username: authorObj.username || 'vecino',
        avatar: authorObj.avatar_url || defaultAvatar
      },
      barrioId: row.barrio_id,
      barrioName: barrioMeta ? barrioMeta.name : row.barrio_id,
      category: row.tag || 'Novedades',
      createdAt: row.created_at,
      content: row.content,
      image: row.image_url || null,
      likes: likesArr.length,
      likedByMe: Boolean(currentUserId && likesArr.some(l => l.user_id === currentUserId)),
      comments: commentsArr.map(c => ({
        id: c.id,
        userId: c.user_id,
        authorName: c.author?.full_name || c.author?.username || 'Vecino',
        authorUsername: c.author?.username || 'vecino',
        authorAvatar: c.author?.avatar_url || defaultAvatar,
        text: c.content,
        createdAt: c.created_at
      }))
    };
  }

  async function fetchPosts({ barrioIds = null, currentUserId = null } = {}) {
    if (!isConfigured()) return [];

    const selectQuery =
      'id,user_id,barrio_id,content,tag,image_url,created_at,' +
      'author:profiles!posts_user_id_fkey(id,username,full_name,avatar_url,barrio_id),' +
      'post_likes(id,user_id),' +
      'post_comments(id,user_id,content,created_at,author:profiles!post_comments_user_id_fkey(id,username,full_name,avatar_url))';

    if (sdkClient) {
      let query = sdkClient
        .from('posts')
        .select(selectQuery)
        .order('created_at', { ascending: false });

      if (Array.isArray(barrioIds) && barrioIds.length === 1) {
        query = query.eq('barrio_id', barrioIds[0]);
      } else if (Array.isArray(barrioIds) && barrioIds.length > 1) {
        query = query.in('barrio_id', barrioIds);
      }

      const { data, error } = await query;
      if (error) throw new Error(translateSupabaseError(error.message));
      return (data || []).map(row => formatPostRow(row, currentUserId));
    } else {
      let url = `${config.supabaseUrl}/rest/v1/posts?select=${encodeURIComponent(selectQuery)}&order=created_at.desc`;
      if (Array.isArray(barrioIds) && barrioIds.length === 1) {
        url += `&barrio_id=eq.${encodeURIComponent(barrioIds[0])}`;
      } else if (Array.isArray(barrioIds) && barrioIds.length > 1) {
        url += `&barrio_id=in.(${barrioIds.map(id => encodeURIComponent(id)).join(',')})`;
      }
      const resp = await fetch(url, {
        headers: {
          apikey: config.supabaseAnonKey,
          Authorization: `Bearer ${getAccessToken()}`
        }
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(translateSupabaseError(err.message || 'Error al consultar publicaciones'));
      }
      const rows = await resp.json();
      return (rows || []).map(row => formatPostRow(row, currentUserId));
    }
  }

  async function createPost({ userId, barrioId, content, tag, imageUrl }) {
    if (!userId) throw new Error('Debés iniciar sesión para publicar en el muro.');

    const payload = {
      user_id: userId,
      barrio_id: barrioId,
      content: content.trim(),
      tag: tag || 'Novedades',
      image_url: imageUrl || null
    };

    const selectQuery =
      'id,user_id,barrio_id,content,tag,image_url,created_at,' +
      'author:profiles!posts_user_id_fkey(id,username,full_name,avatar_url,barrio_id),' +
      'post_likes(id,user_id),' +
      'post_comments(id,user_id,content,created_at,author:profiles!post_comments_user_id_fkey(id,username,full_name,avatar_url))';

    if (sdkClient) {
      const { data, error } = await sdkClient
        .from('posts')
        .insert(payload)
        .select(selectQuery)
        .single();
      if (error) throw new Error(translateSupabaseError(error.message));
      return formatPostRow(data, userId);
    } else {
      const resp = await fetch(
        `${config.supabaseUrl}/rest/v1/posts?select=${encodeURIComponent(selectQuery)}`,
        {
          method: 'POST',
          headers: {
            apikey: config.supabaseAnonKey,
            Authorization: `Bearer ${getAccessToken()}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation'
          },
          body: JSON.stringify(payload)
        }
      );
      const data = await resp.json().catch(() => []);
      if (!resp.ok) {
        throw new Error(translateSupabaseError(data.message || 'No se pudo crear la publicación'));
      }
      const row = Array.isArray(data) ? data[0] : data;
      return formatPostRow(row, userId);
    }
  }

  async function deletePost({ postId, userId }) {
    if (!userId) throw new Error('Sesión requerida.');
    if (sdkClient) {
      const { error } = await sdkClient
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', userId);
      if (error) throw new Error(translateSupabaseError(error.message));
    } else {
      const resp = await fetch(
        `${config.supabaseUrl}/rest/v1/posts?id=eq.${encodeURIComponent(postId)}&user_id=eq.${encodeURIComponent(userId)}`,
        {
          method: 'DELETE',
          headers: {
            apikey: config.supabaseAnonKey,
            Authorization: `Bearer ${getAccessToken()}`
          }
        }
      );
      if (!resp.ok) throw new Error('No se pudo eliminar la publicación.');
    }
    return true;
  }

  async function togglePostLike({ postId, userId }) {
    if (!userId) throw new Error('Iniciá sesión para apoyar publicaciones del barrio.');

    let liked = false;

    if (sdkClient) {
      const { data: existing } = await sdkClient
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .maybeSingle();

      if (existing?.id) {
        const { error } = await sdkClient
          .from('post_likes')
          .delete()
          .eq('id', existing.id);
        if (error) throw new Error(translateSupabaseError(error.message));
        liked = false;
      } else {
        const { error } = await sdkClient
          .from('post_likes')
          .insert({ post_id: postId, user_id: userId });
        if (error) throw new Error(translateSupabaseError(error.message));
        liked = true;
      }

      const { count, error: countErr } = await sdkClient
        .from('post_likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

      if (countErr) throw new Error(translateSupabaseError(countErr.message));
      return { liked, likesCount: count ?? 0 };
    } else {
      const checkResp = await fetch(
        `${config.supabaseUrl}/rest/v1/post_likes?post_id=eq.${encodeURIComponent(postId)}&user_id=eq.${encodeURIComponent(userId)}&select=id`,
        {
          headers: {
            apikey: config.supabaseAnonKey,
            Authorization: `Bearer ${getAccessToken()}`
          }
        }
      );
      const existingRows = await checkResp.json().catch(() => []);

      if (Array.isArray(existingRows) && existingRows.length > 0) {
        await fetch(
          `${config.supabaseUrl}/rest/v1/post_likes?post_id=eq.${encodeURIComponent(postId)}&user_id=eq.${encodeURIComponent(userId)}`,
          {
            method: 'DELETE',
            headers: {
              apikey: config.supabaseAnonKey,
              Authorization: `Bearer ${getAccessToken()}`
            }
          }
        );
        liked = false;
      } else {
        await fetch(`${config.supabaseUrl}/rest/v1/post_likes`, {
          method: 'POST',
          headers: {
            apikey: config.supabaseAnonKey,
            Authorization: `Bearer ${getAccessToken()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ post_id: postId, user_id: userId })
        });
        liked = true;
      }

      const countResp = await fetch(
        `${config.supabaseUrl}/rest/v1/post_likes?post_id=eq.${encodeURIComponent(postId)}&select=id`,
        {
          headers: {
            apikey: config.supabaseAnonKey,
            Authorization: `Bearer ${getAccessToken()}`
          }
        }
      );
      const allLikes = await countResp.json().catch(() => []);
      return { liked, likesCount: Array.isArray(allLikes) ? allLikes.length : 0 };
    }
  }

  async function createComment({ postId, userId, content }) {
    if (!userId) throw new Error('Iniciá sesión para comentar.');

    const payload = {
      post_id: postId,
      user_id: userId,
      content: content.trim()
    };

    const selectQuery =
      'id,post_id,user_id,content,created_at,author:profiles!post_comments_user_id_fkey(id,username,full_name,avatar_url)';

    const defaultAvatar = (window.AVATAR_PRESETS && window.AVATAR_PRESETS[0]?.url) || '';

    if (sdkClient) {
      const { data, error } = await sdkClient
        .from('post_comments')
        .insert(payload)
        .select(selectQuery)
        .single();
      if (error) throw new Error(translateSupabaseError(error.message));
      return {
        id: data.id,
        userId: data.user_id,
        authorName: data.author?.full_name || data.author?.username || 'Vecino',
        authorUsername: data.author?.username || 'vecino',
        authorAvatar: data.author?.avatar_url || defaultAvatar,
        text: data.content,
        createdAt: data.created_at
      };
    } else {
      const resp = await fetch(
        `${config.supabaseUrl}/rest/v1/post_comments?select=${encodeURIComponent(selectQuery)}`,
        {
          method: 'POST',
          headers: {
            apikey: config.supabaseAnonKey,
            Authorization: `Bearer ${getAccessToken()}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation'
          },
          body: JSON.stringify(payload)
        }
      );
      const rows = await resp.json().catch(() => []);
      if (!resp.ok) {
        throw new Error(translateSupabaseError(rows.message || 'No se pudo publicar el comentario'));
      }
      const data = Array.isArray(rows) ? rows[0] : rows;
      return {
        id: data.id,
        userId: data.user_id,
        authorName: data.author?.full_name || data.author?.username || 'Vecino',
        authorUsername: data.author?.username || 'vecino',
        authorAvatar: data.author?.avatar_url || defaultAvatar,
        text: data.content,
        createdAt: data.created_at
      };
    }
  }

  // ==========================================================================
  // 4. BARRIO LIVE CHAT & REAL-TIME SUBSCRIPTION (`chat_messages`)
  // ==========================================================================
  function formatChatMessageRow(row, currentUserId) {
    const defaultAvatar = (window.AVATAR_PRESETS && window.AVATAR_PRESETS[0]?.url) || '';
    const author = row.author || {};
    return {
      id: row.id,
      barrioId: row.barrio_id,
      userId: row.user_id,
      senderName: author.full_name || author.username || 'Vecino',
      senderUsername: author.username || 'vecino',
      senderAvatar: author.avatar_url || defaultAvatar,
      text: row.message,
      timestamp: row.created_at,
      isOwn: Boolean(currentUserId && row.user_id === currentUserId)
    };
  }

  async function fetchChatMessages(barrioId, currentUserId) {
    if (!isConfigured() || !barrioId) return [];

    const selectQuery =
      'id,barrio_id,user_id,message,created_at,author:profiles!chat_messages_user_id_fkey(id,username,full_name,avatar_url)';

    if (sdkClient) {
      const { data, error } = await sdkClient
        .from('chat_messages')
        .select(selectQuery)
        .eq('barrio_id', barrioId)
        .order('created_at', { ascending: true })
        .limit(100);
      if (error) throw new Error(translateSupabaseError(error.message));
      return (data || []).map(row => formatChatMessageRow(row, currentUserId));
    } else {
      const resp = await fetch(
        `${config.supabaseUrl}/rest/v1/chat_messages?barrio_id=eq.${encodeURIComponent(barrioId)}&select=${encodeURIComponent(selectQuery)}&order=created_at.asc&limit=100`,
        {
          headers: {
            apikey: config.supabaseAnonKey,
            Authorization: `Bearer ${getAccessToken()}`
          }
        }
      );
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(translateSupabaseError(err.message || 'Error al cargar mensajes del canal'));
      }
      const rows = await resp.json();
      return (rows || []).map(row => formatChatMessageRow(row, currentUserId));
    }
  }

  async function sendChatMessage({ barrioId, userId, message }) {
    if (!userId) throw new Error('Iniciá sesión para enviar mensajes en el canal del barrio.');

    const payload = {
      barrio_id: barrioId,
      user_id: userId,
      message: message.trim()
    };

    const selectQuery =
      'id,barrio_id,user_id,message,created_at,author:profiles!chat_messages_user_id_fkey(id,username,full_name,avatar_url)';

    if (sdkClient) {
      const { data, error } = await sdkClient
        .from('chat_messages')
        .insert(payload)
        .select(selectQuery)
        .single();
      if (error) throw new Error(translateSupabaseError(error.message));
      return formatChatMessageRow(data, userId);
    } else {
      const resp = await fetch(
        `${config.supabaseUrl}/rest/v1/chat_messages?select=${encodeURIComponent(selectQuery)}`,
        {
          method: 'POST',
          headers: {
            apikey: config.supabaseAnonKey,
            Authorization: `Bearer ${getAccessToken()}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation'
          },
          body: JSON.stringify(payload)
        }
      );
      const rows = await resp.json().catch(() => []);
      if (!resp.ok) {
        throw new Error(translateSupabaseError(rows.message || 'Error al enviar mensaje'));
      }
      const data = Array.isArray(rows) ? rows[0] : rows;
      return formatChatMessageRow(data, userId);
    }
  }

  function unsubscribeChat() {
    if (activeChatChannel && sdkClient) {
      try {
        sdkClient.removeChannel(activeChatChannel);
      } catch {
        // Ignore cleanup error
      }
      activeChatChannel = null;
    }
  }

  function subscribeToBarrioChat(barrioId, getCurrentUserId, onNewMessage) {
    unsubscribeChat();
    if (!sdkClient || !barrioId) return null;

    activeChatChannel = sdkClient
      .channel(`barrio-chat-${barrioId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `barrio_id=eq.${barrioId}`
        },
        async payload => {
          const newRow = payload.new;
          if (!newRow) return;
          const profile = await fetchProfileById(newRow.user_id);
          const currentUserId = typeof getCurrentUserId === 'function' ? getCurrentUserId() : null;
          const hydrated = formatChatMessageRow(
            {
              ...newRow,
              author: profile
                ? {
                    id: profile.id,
                    full_name: profile.name,
                    username: profile.username,
                    avatar_url: profile.avatar
                  }
                : null
            },
            currentUserId
          );
          onNewMessage(hydrated);
        }
      )
      .subscribe();

    return activeChatChannel;
  }

  function translateSupabaseError(msg) {
    const raw = String(msg || '');
    const lower = raw.toLowerCase();
    if (lower.includes('invalid login credentials')) {
      return 'Correo o contraseña incorrectos.';
    }
    if (lower.includes('email not confirmed')) {
      return 'Tu correo aún no fue confirmado. Revisá tu bandeja de entrada o desactivá "Confirm email" en tu panel de Supabase Auth.';
    }
    if (lower.includes('user already registered')) {
      return 'Este correo ya está registrado. Pasá a la pestaña "Iniciar Sesión".';
    }
    if (lower.includes('profiles_username_key') || lower.includes('duplicate key value')) {
      return 'Ese @usuario o correo ya está en uso por otro vecino. Elegí otro.';
    }
    if (lower.includes('row-level security')) {
      return 'Operación denegada por políticas de seguridad (RLS). Verificá que tu sesión esté activa.';
    }
    return raw;
  }

  window.MisVecinosSupabase = {
    init,
    isConfigured,
    getConfig,
    saveConfig,
    signUp,
    signInWithPassword,
    signInWithOAuth,
    sendMagicLink,
    signOut,
    updateProfileBarrio,
    fetchPosts,
    createPost,
    deletePost,
    togglePostLike,
    createComment,
    fetchChatMessages,
    sendChatMessage,
    subscribeToBarrioChat,
    unsubscribeChat,
    onAuthStateChange,
    hasActiveSession: () => Boolean(activeSession?.user)
  };
})();
