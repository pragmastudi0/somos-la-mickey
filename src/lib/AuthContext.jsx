import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { api } from '@/api/client';

const AuthContext = createContext(null);

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [role, setRole] = useState(null);

  const loadRole = useCallback(async (userId) => {
    const fetchOnce = async () =>
      supabase.from('somoslamickey_profiles').select('role').eq('id', userId).maybeSingle();

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

    const next = data?.role || 'cliente';
    setRole(next);
    setAuthError((prev) => (prev?.type === 'role' ? null : prev));
    return next;
  }, []);

  const initializeAuth = useCallback(async () => {
    try {
      setIsLoadingAuth(true);
      setAuthError(null);
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      const currentUser = data.session?.user ?? null;
      setUser(currentUser);
      setIsAuthenticated(Boolean(currentUser));
      if (currentUser && data.session?.access_token) {
        try {
          await api.auth.syncCliente(data.session.access_token);
        } catch (syncErr) {
          console.error('syncCliente', syncErr);
          setAuthError({
            type: 'sync',
            message: syncErr.message || 'Error al sincronizar tu cuenta.',
          });
        }
        await loadRole(currentUser.id);
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
  }, [loadRole]);

  useEffect(() => {
    void initializeAuth();
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setIsAuthenticated(Boolean(session?.user));
      if (event === 'SIGNED_OUT') {
        setRole(null);
      }
      if (event === 'SIGNED_IN' && session?.access_token && session?.user) {
        void (async () => {
          try {
            await api.auth.syncCliente(session.access_token);
          } catch (syncErr) {
            console.error('syncCliente', syncErr);
            setAuthError({
              type: 'sync',
              message: syncErr.message || 'Error al sincronizar tu cuenta.',
            });
          }
          await loadRole(session.user.id);
        })();
      }
    });
    return () => listener.subscription.unsubscribe();
  }, [loadRole, initializeAuth]);

  const login = async (email, password) => {
    setAuthError(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    let resolvedRole = null;
    if (data.user && data.session?.access_token) {
      try {
        await api.auth.syncCliente(data.session.access_token);
      } catch (syncErr) {
        console.error('syncCliente', syncErr);
        setAuthError({
          type: 'sync',
          message: syncErr.message || 'Error al sincronizar tu cuenta.',
        });
      }
      resolvedRole = await loadRole(data.user.id);
      if (resolvedRole == null) {
        throw new Error('No se pudo cargar tu perfil. Reintentá.');
      }
    }
    return { ...data, role: resolvedRole };
  };

  const signup = async (email, password, nombre = '', fechaNacimiento = '') => {
    setAuthError(null);
    const meta = { nombre };
    if (fechaNacimiento && String(fechaNacimiento).trim() !== '') {
      meta.fecha_nacimiento = String(fechaNacimiento).trim();
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: meta,
      },
    });
    if (error) throw error;
    let resolvedRole = null;
    if (data.user && data.session?.access_token) {
      try {
        await api.auth.syncCliente(data.session.access_token);
      } catch (syncErr) {
        console.error('syncCliente', syncErr);
        setAuthError({
          type: 'sync',
          message: syncErr.message || 'Error al sincronizar tu cuenta.',
        });
      }
      resolvedRole = await loadRole(data.user.id);
      if (resolvedRole == null) {
        throw new Error('No se pudo cargar tu perfil. Reintentá.');
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
