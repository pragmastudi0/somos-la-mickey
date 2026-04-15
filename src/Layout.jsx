import React, { useState, useEffect } from 'react';
import { createPageUrl } from '@/utils';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { useAuth } from '@/lib/AuthContext';

function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth <= 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return mobile;
}

export default function Layout({ children, currentPageName }) {
  const { user, role, isLoadingAuth } = useAuth();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isLoadingAuth && user && role !== 'admin') {
      const clientPages = ['PortalCliente'];
      if (!clientPages.includes(currentPageName)) {
        window.location.href = createPageUrl('PortalCliente');
      }
    }
  }, [isLoadingAuth, user, role, currentPageName]);

  if (isLoadingAuth) {
    return (
      <div style={{
        background: '#1A1A1A', minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 32, height: 32,
          border: '3px solid rgba(232,0,29,0.15)',
          borderTop: '3px solid #E8001D',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }} />
      </div>
    );
  }

  const isAdmin = role === 'admin';

  if (!isAdmin && currentPageName !== 'PortalCliente') {
    return null;
  }

  if (isAdmin) {
    return (
      <div style={{
        background: '#1A1A1A', minHeight: '100vh',
        display: 'flex', fontFamily: "'DM Sans', sans-serif",
      }}>
        <AdminSidebar currentPage={currentPageName} user={user} />
        <main style={{
          flex: 1,
          overflow: 'auto',
          minHeight: '100vh',
          // En mobile: deja espacio para header (54px) y bottom nav (60px)
          paddingTop: isMobile ? 54 : 0,
          paddingBottom: isMobile ? 60 : 0,
        }}>
          {children}
        </main>
      </div>
    );
  }

  return (
    <div style={{
      background: '#FFFFFF', minHeight: '100vh',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {children}
    </div>
  );
}
