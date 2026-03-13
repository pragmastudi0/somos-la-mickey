import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  LayoutDashboard, Users, ShoppingBag, Wallet, Tag, LogOut, Settings
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

const navItems = [
  { name: 'Dashboard',   page: 'Dashboard',   icon: LayoutDashboard },
  { name: 'Socios',      page: 'Clientes',    icon: Users },
  { name: 'Compras',     page: 'Compras',     icon: ShoppingBag },
  { name: 'Reintegros',  page: 'Reintegros',  icon: Wallet },
  { name: 'Promociones', page: 'Promociones', icon: Tag },
  { name: 'Ajustes',     page: 'Ajustes',     icon: Settings },
];

export default function AdminSidebar({ currentPage, user }) {
  return (
    <nav style={{
      width: 220, minWidth: 220,
      background: '#161616',
      borderRight: '1px solid #1F1F1F',
      display: 'flex', flexDirection: 'column',
      padding: '24px 12px',
      position: 'sticky', top: 0, height: '100vh',
    }}>
      {/* Logo */}
      <div style={{ padding: '6px 12px', marginBottom: 32 }}>
        <div style={{
          fontFamily: "'Nunito', sans-serif",
          fontWeight: 900, fontSize: 16,
          color: '#E8001D',
          letterSpacing: '-0.01em',
          lineHeight: 1.1,
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

      {/* Nav items */}
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
          onClick={() => base44.auth.logout()}
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