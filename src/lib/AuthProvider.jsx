import React, { useState, useEffect, useCallback } from 'react';
import { AuthContext } from '@/lib/auth-context';
import { supabase } from '@/lib/supabaseClient';
import { api } from '@/api/client';
import { useApp } from '@/context/AppContext';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const AuthProvider = ({ children }) => {
  const { applicationId, isConfigured, configurationError } = useApp();
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [role, setRole] = useState(null);

  const ensureAppConfigured = useCallback(() => {
    if (isConfigured && applicationId) return true;
    setAuthError({
      type: 'config',
      message: configurationError || 'Falta configurar VITE_APPLICATION_ID para ejecutar esta app.',
    });
    setRole(null);
    return false;
  }, [applicationId, configurationError, isConfigured]);

  const loadRole = useCallback(async (userId) => {
    if (!ensureAppConfigured()) return null;

    const fetchOnce = async () =>
      supabase
        .from('somoslamickey_profiles')
        .select('role')
        .eq('id', userId)
        .eq('application_id', applicationId)
        .maybeSingle();

    let { data, error } = await fetchOnce();
    if (error) {
      await sleep(250);
      ({ data, error } = await fetchOnce());
    }

    if (error) {
      console.error('loadRole', error);
      setAuthError({
        type: 'role',
        message: 'No se pudo leer tu rol. Verificá la conexión o reintentá.',
      });
      setRole(null);
      return null;
    }

    // Tras el alta, el trigger puede tardar un instante en crear la fila.
    if (!data?.role) {
      for (let i = 0; i < 3; i += 1) {
        await sleep(200);
        ({ data, error } = await fetchOnce());
        if (error) break;
        if (data?.role) break;
      }
    }

    if (!data?.role) {
      setAuthError({
        type: 'role',
        message:
          'No encontramos un perfil de socio para esta aplicación con tu cuenta. Si el email no está registrado, creá una cuenta primero.',
      });
      setRole(null);
      return null;
    }

    const next = data.role;
    setRole(next);
    setAuthError((prev) => (prev?.type === 'role' ? null : prev));
    return next;
  }, [applicationId, ensureAppConfigured]);

  const initializeAuth = useCallback(async () => {
    try {
      setIsLoadingAuth(true);
      setAuthError(null);
      if (!ensureAppConfigured()) {
        setIsAuthenticated(false);
        return;
      }
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      const currentUser = data.session?.user ?? null;
      setUser(currentUser);
      setIsAuthenticated(Boolean(currentUser));
      if (currentUser && data.session?.access_token) {
        try {
          await api.auth.syncCliente(data.session.access_token, applicationId);
        } catch (syncErr) {
          console.error('syncCliente', syncErr);
          setAuthError({
            type: 'sync',
            message: syncErr.message || 'Error al sincronizar tu cuenta.',
          });
        }
        const resolved = await loadRole(currentUser.id);
        if (resolved == null) {
          await supabase.auth.signOut({ scope: 'local' });
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        setRole(null);
      }
    } catch (error) {
      setAuthError({ type: 'unknown', message: error.message || 'Error checking session' });
      setIsAuthenticated(false);
      setRole(null);
    } finally {
      setIsLoadingAuth(false);
    }
  }, [ensureAppConfigured, loadRole, applicationId]);

  useEffect(() => {
    void initializeAuth();
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setIsAuthenticated(Boolean(session?.user));
      if (event === 'SIGNED_OUT') {
        setRole(null);
      }
      // INITIAL_SESSION restaura sesión persistida sin emitir SIGNED_IN; sin esto role queda null y la app carga para siempre.
      const shouldSyncRole =
        (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') &&
        session?.access_token &&
        session?.user;
      if (shouldSyncRole) {
        void (async () => {
          try {
            await api.auth.syncCliente(session.access_token, applicationId);
          } catch (syncErr) {
            console.error('syncCliente', syncErr);
            setAuthError({
              type: 'sync',
              message: syncErr.message || 'Error al sincronizar tu cuenta.',
            });
          }
          const r = await loadRole(session.user.id);
          if (r == null) {
            await supabase.auth.signOut({ scope: 'local' });
          }
        })();
      }
    });
    return () => listener.subscription.unsubscribe();
  }, [loadRole, initializeAuth, applicationId]);

  const login = async (email, password) => {
    setAuthError(null);
    if (!ensureAppConfigured()) {
      throw new Error(configurationError || 'Falta configurar VITE_APPLICATION_ID para ejecutar esta app.');
    }

    const normalizedEmail = email.trim().toLowerCase();

    await supabase.auth.signOut({ scope: 'local' });

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });
    if (error) throw error;

    const session = data.session;
    const signedInUser = data.user;
    if (!session?.access_token || !signedInUser) {
      await supabase.auth.signOut({ scope: 'local' });
      throw new Error(
        'No se pudo iniciar sesión. Si recién creaste la cuenta, puede que tengas que confirmar el email primero.',
      );
    }

    const sessionEmail = (signedInUser.email || '').toLowerCase();
    if (sessionEmail && sessionEmail !== normalizedEmail) {
      await supabase.auth.signOut({ scope: 'local' });
      throw new Error('Las credenciales no coinciden con esta cuenta.');
    }

    try {
      await api.auth.syncCliente(session.access_token, applicationId);
    } catch (syncErr) {
      console.error('syncCliente', syncErr);
      setAuthError({
        type: 'sync',
        message: syncErr.message || 'Error al sincronizar tu cuenta.',
      });
    }

    const resolvedRole = await loadRole(signedInUser.id);
    if (resolvedRole == null) {
      await supabase.auth.signOut({ scope: 'local' });
      throw new Error('No se pudo cargar tu perfil. Reintentá o contactá al administrador.');
    }

    return { ...data, role: resolvedRole };
  };

  const signup = async (email, password, nombre = '', fechaNacimiento = '', telefono = '') => {
    setAuthError(null);
    if (!ensureAppConfigured()) {
      throw new Error(configurationError || 'Falta configurar VITE_APPLICATION_ID para ejecutar esta app.');
    }
    const meta = { nombre };
    if (fechaNacimiento && String(fechaNacimiento).trim() !== '') {
      meta.fecha_nacimiento = String(fechaNacimiento).trim();
    }
    if (telefono && String(telefono).trim() !== '') {
      meta.telefono = String(telefono).trim();
    }
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: meta,
      },
    });
    if (error) throw error;
    let resolvedRole = null;
    if (data.user && data.session?.access_token) {
      try {
        await api.auth.syncCliente(data.session.access_token, applicationId);
      } catch (syncErr) {
        console.error('syncCliente', syncErr);
        setAuthError({
          type: 'sync',
          message: syncErr.message || 'Error al sincronizar tu cuenta.',
        });
      }
      resolvedRole = await loadRole(data.user.id);
      if (resolvedRole == null) {
        await supabase.auth.signOut({ scope: 'local' });
        throw new Error('No se pudo cargar tu perfil. Reintentá o contactá al administrador.');
      }
    }
    return { ...data, role: resolvedRole };
  };

  const logout = async () => {
    setUser(null);
    setIsAuthenticated(false);
    setRole(null);
    setAuthError(null);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        isLoadingAuth,
        authError,
        login,
        signup,
        logout,
        refreshAuth: initializeAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
