import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { createPageUrl } from '@/utils';
import { toast } from '@/components/ui/use-toast';

function inputStyle() {
  return {
    width: '100%',
    background: '#0a0a0a',
    border: '1px solid #2a2a2a',
    borderRadius: 8,
    padding: '11px 12px',
    color: '#FFFFFF',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
  };
}

export default function AuthPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoadingAuth, login, signup, role } = useAuth();
  const [mode, setMode] = useState('login');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  if (isLoadingAuth) return null;
  if (isAuthenticated) {
    return <Navigate to={role === 'admin' ? createPageUrl('Dashboard') : createPageUrl('PortalCliente')} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (mode === 'signup') {
        const result = await signup(email.trim(), password, nombre.trim());
        if (result.user && !result.session) {
          toast({
            title: 'Cuenta creada',
            description:
              'Revisá tu correo para confirmar el email y luego iniciá sesión. Si la confirmación está desactivada en Supabase, iniciá sesión con tu contraseña.',
          });
          setMode('login');
          setPassword('');
          return;
        }
        toast({
          title: 'Cuenta lista',
          description: 'Ya podés usar la app.',
        });
        navigate(result.role === 'admin' ? createPageUrl('Dashboard') : createPageUrl('PortalCliente'), { replace: true });
      } else {
        const result = await login(email.trim(), password);
        toast({
          title: 'Sesión iniciada',
          description: 'Bienvenido/a.',
        });
        navigate(result.role === 'admin' ? createPageUrl('Dashboard') : createPageUrl('PortalCliente'), { replace: true });
      }
    } catch (submitError) {
      setError(submitError.message || 'No se pudo autenticar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#111111', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 400, background: '#161616', border: '1px solid #1F1F1F', borderRadius: 16, padding: 24 }}>
        <h1 style={{ margin: 0, color: '#FFFFFF', fontSize: 24, fontWeight: 900 }}>Somos la Mickey</h1>
        <p style={{ marginTop: 6, color: '#888888', fontSize: 13 }}>
          {mode === 'signup' ? 'Crear cuenta de socio' : 'Ingresar a tu cuenta'}
        </p>

        <form onSubmit={handleSubmit} style={{ marginTop: 18, display: 'grid', gap: 12 }}>
          {mode === 'signup' && (
            <input
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              placeholder="Nombre completo"
              style={inputStyle()}
            />
          )}
          <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" style={inputStyle()} />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Contraseña"
            style={inputStyle()}
          />
          {error && <div style={{ color: '#E8001D', fontSize: 12 }}>{error}</div>}
          <button
            type="submit"
            disabled={saving || !email || !password || (mode === 'signup' && !nombre)}
            style={{
              border: 'none',
              borderRadius: 999,
              background: '#E8001D',
              color: '#FFFFFF',
              fontWeight: 700,
              padding: '11px 14px',
              opacity: saving ? 0.6 : 1,
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Procesando...' : mode === 'signup' ? 'Crear cuenta' : 'Ingresar'}
          </button>
        </form>

        <button
          onClick={() => {
            setMode((value) => (value === 'login' ? 'signup' : 'login'));
            setError('');
          }}
          style={{
            marginTop: 12,
            background: 'none',
            border: 'none',
            color: '#F9D100',
            padding: 0,
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          {mode === 'signup' ? 'Ya tengo cuenta' : 'No tengo cuenta, quiero registrarme'}
        </button>
      </div>
    </div>
  );
}
