import React, { useEffect } from 'react';
import { createPageUrl } from '@/utils';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { useAuth } from '@/lib/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';

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
          // Mobile: chrome + safe areas (header/bottom nav en AdminSidebar)
          paddingTop: isMobile ? 'calc(54px + env(safe-area-inset-top, 0px))' : 0,
          paddingBottom: isMobile ? 'calc(60px + env(safe-area-inset-bottom, 0px))' : 0,
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
