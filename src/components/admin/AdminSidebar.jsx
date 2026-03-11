import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  LayoutDashboard, Users, ShoppingBag, Wallet, Tag, LogOut, Sparkles
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

const navItems = [
  { name: 'Dashboard', page: 'Dashboard', icon: LayoutDashboard },
  { name: 'Socios', page: 'Clientes', icon: Users },
  { name: 'Compras', page: 'Compras', icon: ShoppingBag },
  { name: 'Reintegros', page: 'Reintegros', icon: Wallet },
  { name: 'Promociones', page: 'Promociones', icon: Tag },
];

export default function AdminSidebar({ currentPage, user }) {
  return (
    <nav style={{
      width: 220,
      minWidth: 220,
      background: '#0a0a15',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 12px',
      position: 'sticky',
      top: 0,
      height: '100vh',
    }}>
      <div style={{ padding: '6px 12px', marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
          <Sparkles size={16} style={{ color: '#c8f04a' }} />
          <span style={{
            color: '#c8f04a',
            fontFamily: 'Syne, sans-serif',
            fontWeight: 700, fontSize: 15,
            letterSpacing: '-0.01em',
          }}>
            La Mickey
          </span>
        </div>
        <div style={{ color: '#3a3a50', fontSize: 11, paddingLeft: 23 }}>Pragma Socios</div>
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
                color: isActive ? '#07070f' : '#6a6a80',
                background: isActive ? '#c8f04a' : 'transparent',
                fontWeight: isActive ? 600 : 400,
                fontSize: 14,
                transition: 'all 0.12s ease',
              }}
            >
              <Icon size={15} />
              {item.name}
            </Link>
          );
        })}
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12 }}>
        <div style={{
          color: '#3a3a50', fontSize: 11,
          padding: '0 13px', marginBottom: 8,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {user?.full_name || user?.email}
        </div>
        <button
          onClick={() => base44.auth.logout()}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 13px', borderRadius: 9,
            color: '#6a6a80', background: 'transparent',
            border: 'none', cursor: 'pointer',
            fontSize: 14, width: '100%',
            transition: 'color 0.12s',
          }}
        >
          <LogOut size={15} />
          Cerrar sesión
        </button>
      </div>
    </nav>
  );
}