import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { api } from '@/api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    initializeAuth();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsAuthenticated(Boolean(session?.user));
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const loadRole = async (userId) => {
    try {
      const { data, error } = await supabase.from('somoslamickey_profiles').select('role').eq('id', userId).maybeSingle();
      if (error) throw error;
      const next = data?.role || 'cliente';
      setRole(next);
      return next;
    } catch (error) {
      setRole('cliente');
      return 'cliente';
    }
  };

  const initializeAuth = async () => {
    try {
      setIsLoadingAuth(true);
      setAuthError(null);
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      const currentUser = data.session?.user ?? null;
      setUser(currentUser);
      setIsAuthenticated(Boolean(currentUser));
      if (currentUser && data.session?.access_token) {
        await api.auth.syncCliente(data.session.access_token);
        await loadRole(currentUser.id); // sets role state
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
  };

  const login = async (email, password) => {
    setAuthError(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    let resolvedRole = null;
    if (data.user && data.session?.access_token) {
      await api.auth.syncCliente(data.session.access_token);
      resolvedRole = await loadRole(data.user.id);
    }
    return { ...data, role: resolvedRole };
  };

  const signup = async (email, password, nombre = '') => {
    setAuthError(null);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nombre },
      },
    });
    if (error) throw error;
    // Con confirmación por email, session es null: el trigger en Supabase crea perfil/cliente igual.
    let resolvedRole = null;
    if (data.user && data.session?.access_token) {
      await api.auth.syncCliente(data.session.access_token);
      resolvedRole = await loadRole(data.user.id);
    }
    return { ...data, role: resolvedRole };
  };

  const logout = async () => {
    setUser(null);
    setIsAuthenticated(false);
    setRole(null);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      role,
      isAuthenticated, 
      isLoadingAuth,
      authError,
      login,
      signup,
      logout,
      refreshAuth: initializeAuth,
    }}>
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
