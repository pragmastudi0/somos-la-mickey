import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me()
      .then(u => { setUser(u); setLoading(false); })
      .catch(() => {
        base44.auth.redirectToLogin();
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!loading && user && user.role !== 'admin') {
      const clientPages = ['PortalCliente'];
      if (!clientPages.includes(currentPageName)) {
        window.location.href = createPageUrl('PortalCliente');
      }
    }
  }, [loading, user, currentPageName]);

  if (loading) {
    return (
      <div style={{
        background: '#07070f', minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 32, height: 32,
          border: '3px solid rgba(200,240,74,0.15)',
          borderTop: '3px solid #c8f04a',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }} />
      </div>
    );
  }

  const isAdmin = user?.role === 'admin';

  if (!isAdmin && currentPageName !== 'PortalCliente') {
    return null;
  }

  if (isAdmin) {
    return (
      <div style={{
        background: '#07070f', minHeight: '100vh',
        display: 'flex', fontFamily: "'DM Sans', sans-serif",
      }}>
        <AdminSidebar currentPage={currentPageName} user={user} />
        <main style={{ flex: 1, overflow: 'auto', minHeight: '100vh' }}>
          {children}
        </main>
      </div>
    );
  }

  return (
    <div style={{
      background: '#07070f', minHeight: '100vh',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {children}
    </div>
  );
}