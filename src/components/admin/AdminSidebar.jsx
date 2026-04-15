import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  LayoutDashboard, Users, ShoppingBag, Wallet, Tag, LogOut, Settings, Menu, X
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const navItems = [
  { name: 'Dashboard',   page: 'Dashboard',   icon: LayoutDashboard },
  { name: 'Socios',      page: 'Clientes',    icon: Users },
  { name: 'Compras',     page: 'Compras',     icon: ShoppingBag },
  { name: 'Reintegros',  page: 'Reintegros',  icon: Wallet },
  { name: 'Promociones', page: 'Promociones', icon: Tag },
  { name: 'Ajustes',     page: 'Ajustes',     icon: Settings },
];

// Bottom nav muestra solo los 4 más usados + menú
const bottomNavItems = [
  { name: 'Dashboard',  page: 'Dashboard',  icon: LayoutDashboard },
  { name: 'Socios',     page: 'Clientes',   icon: Users },
  { name: 'Compras',    page: 'Compras',    icon: ShoppingBag },
  { name: 'Reintegros', page: 'Reintegros', icon: Wallet },
];

function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth <= 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return mobile;
}

export default function AdminSidebar({ currentPage, user }) {
  const { logout } = useAuth();
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Cerrar drawer al cambiar de página
  useEffect(() => { setDrawerOpen(false); }, [currentPage]);

  if (isMobile) {
    return (
      <>
        {/* Header mobile fijo */}
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
          height: 54,
          background: '#161616',
          borderBottom: '1px solid #1F1F1F',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px',
        }}>
          <div>
            <div style={{
              fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 15,
              color: '#E8001D', letterSpacing: '-0.01em', lineHeight: 1,
            }}>
              Somos la Mickey
            </div>
            <div style={{
              color: '#888888', fontSize: 9, marginTop: 1,
              fontFamily: "'DM Sans', sans-serif",
              letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>
              App Socios
            </div>
          </div>
          <button
            onClick={() => setDrawerOpen(true)}
            style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid #2a2a2a',
              borderRadius: 8, padding: '7px', cursor: 'pointer', color: '#FFFFFF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Menu size={18} />
          </button>
        </div>

        {/* Bottom nav */}
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
          height: 60,
          background: '#161616',
          borderTop: '1px solid #1F1F1F',
          display: 'flex', alignItems: 'stretch',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}>
          {bottomNavItems.map(item => {
            const Icon = item.icon;
            const isActive = currentPage === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                style={{
                  flex: 1,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 3,
                  textDecoration: 'none',
                  color: isActive ? '#E8001D' : '#555555',
                  borderTop: isActive ? '2px solid #E8001D' : '2px solid transparent',
                  transition: 'color 0.15s',
                }}
              >
                <Icon size={18} />
                <span style={{
                  fontSize: 9, fontWeight: isActive ? 700 : 400,
                  fontFamily: "'DM Sans', sans-serif",
                  letterSpacing: '0.02em',
                }}>
                  {item.name}
                </span>
              </Link>
            );
          })}
          {/* Más */}
          <button
            onClick={() => setDrawerOpen(true)}
            style={{
              flex: 1,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 3,
              background: 'none', border: 'none', cursor: 'pointer',
              color: ['Promociones','Ajustes'].includes(currentPage) ? '#E8001D' : '#555555',
              borderTop: ['Promociones','Ajustes'].includes(currentPage)
                ? '2px solid #E8001D' : '2px solid transparent',
            }}
          >
            <Menu size={18} />
            <span style={{
              fontSize: 9, fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.02em',
            }}>
              Más
            </span>
          </button>
        </div>

        {/* Drawer lateral */}
        {drawerOpen && (
          <>
            {/* Overlay */}
            <div
              onClick={() => setDrawerOpen(false)}
              style={{
                position: 'fixed', inset: 0, zIndex: 300,
                background: 'rgba(0,0,0,0.65)',
                backdropFilter: 'blur(2px)',
              }}
            />
            {/* Panel */}
            <div style={{
              position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 310,
              width: 260,
              background: '#161616',
              borderLeft: '1px solid #1F1F1F',
              display: 'flex', flexDirection: 'column',
              padding: '20px 12px',
              animation: 'slideInRight 0.22s ease',
            }}>
              {/* Header del drawer */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 8px', marginBottom: 24,
              }}>
                <div>
                  <div style={{
                    fontFamily: "'Nunito', sans-serif", fontWeight: 900,
                    fontSize: 15, color: '#E8001D',
                  }}>Somos la Mickey</div>
                  <div style={{ color: '#888888', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    App Socios
                  </div>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  style={{
                    background: 'rgba(255,255,255,0.05)', border: '1px solid #2a2a2a',
                    borderRadius: 8, padding: '6px', cursor: 'pointer', color: '#888888',
                    display: 'flex',
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Links */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {navItems.map(item => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.page;
                  return (
                    <Link
                      key={item.page}
                      to={createPageUrl(item.page)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '11px 13px', borderRadius: 9,
                        textDecoration: 'none',
                        color: isActive ? '#F9D100' : '#888888',
                        background: isActive ? 'rgba(249,209,0,0.08)' : 'transparent',
                        borderLeft: isActive ? '3px solid #F9D100' : '3px solid transparent',
                        fontWeight: isActive ? 600 : 400,
                        fontSize: 14,
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      <Icon size={15} />
                      {item.name}
                    </Link>
                  );
                })}
              </div>

              {/* User + logout */}
              <div style={{ borderTop: '1px solid #1F1F1F', paddingTop: 12 }}>
                <div style={{
                  color: '#555555', fontSize: 11,
                  padding: '0 13px', marginBottom: 8,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  {user?.full_name || user?.email}
                </div>
                <button
                  onClick={() => logout()}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 13px', borderRadius: 9,
                    color: '#888888', background: 'transparent',
                    border: 'none', cursor: 'pointer',
                    fontSize: 14, width: '100%',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  <LogOut size={15} />
                  Cerrar sesión
                </button>
              </div>
            </div>

            <style>{`
              @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to   { transform: translateX(0);    opacity: 1; }
              }
            `}</style>
          </>
        )}
      </>
    );
  }

  // ── Desktop sidebar ──────────────────────────────────────────
  return (
    <nav style={{
      width: 220, minWidth: 220,
      background: '#161616',
      borderRight: '1px solid #1F1F1F',
      display: 'flex', flexDirection: 'column',
      padding: '24px 12px',
      position: 'sticky', top: 0, height: '100vh',
    }}>
      <div style={{ padding: '6px 12px', marginBottom: 32 }}>
        <div style={{
          fontFamily: "'Nunito', sans-serif",
          fontWeight: 900, fontSize: 16,
          color: '#E8001D', letterSpacing: '-0.01em', lineHeight: 1.1,
        }}>
          Somos la Mickey
        </div>
        <div style={{
          color: '#888888', fontSize: 10, marginTop: 2,
          fontFamily: "'DM Sans', sans-serif",
          letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
          App Socios
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentPage === item.page;
          return (
            <Link
              key={item.page}
              to={createPageUrl(item.page)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 13px', borderRadius: 9,
                textDecoration: 'none',
                color: isActive ? '#F9D100' : '#888888',
                background: isActive ? 'rgba(249,209,0,0.08)' : 'transparent',
                borderLeft: isActive ? '3px solid #F9D100' : '3px solid transparent',
                fontWeight: isActive ? 600 : 400,
                fontSize: 14,
                fontFamily: "'DM Sans', sans-serif",
                transition: 'all 0.12s ease',
              }}
            >
              <Icon size={15} />
              {item.name}
            </Link>
          );
        })}
      </div>

      <div style={{ borderTop: '1px solid #1F1F1F', paddingTop: 12 }}>
        <div style={{
          color: '#555555', fontSize: 11,
          padding: '0 13px', marginBottom: 8,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {user?.full_name || user?.email}
        </div>
        <button
          onClick={() => logout()}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 13px', borderRadius: 9,
            color: '#888888', background: 'transparent',
            border: 'none', cursor: 'pointer',
            fontSize: 14, width: '100%',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <LogOut size={15} />
          Cerrar sesión
        </button>
      </div>
    </nav>
  );
}
