// components/layout/Sidebar.jsx
import {
  LayoutDashboard, Ticket, Package, BookOpen,
  Activity, BarChart3, Users, Settings,
  Shield, Maximize2, LogOut
} from 'lucide-react'
import { Avatar } from '../ui'
import { useApp, useAuth } from '../../context/AppContext'
import { useTheme } from '../../context/ThemeContext'
import { NAV_PERMISSIONS } from '../../config/navPermissions'
import { useNavigate, useLocation } from 'react-router-dom'

const ICONS = { LayoutDashboard, Ticket, Package, BookOpen, Activity, BarChart3, Users, Settings }

/* ─── NavItem ─────────────────────────────────────────────── */
const NavItem = ({ item, active, collapsed, onClick }) => {
  const { T, isDark } = useTheme()
  const Icon = ICONS[item.iconName] ?? LayoutDashboard

  return (
    <button
      onClick={() => onClick(item.id)}
      title={collapsed ? item.label : ''}
      style={{
        position: 'relative',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        borderRadius: 8,
        fontSize: 12,
        fontWeight: active ? 600 : 400,
        cursor: 'pointer',
        border: 'none',
        justifyContent: collapsed ? 'center' : 'flex-start',
        background: active
          ? isDark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.08)'
          : 'transparent',
        color: active ? T.accent : T.textMuted,
        transition: 'background 0.2s, color 0.2s',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
          e.currentTarget.style.color = T.textSub
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = T.textMuted
        }
      }}
    >
      {/* Indikator aktif */}
      {active && !collapsed && (
        <div style={{
          position: 'absolute', left: 0,
          top: '22%', bottom: '22%',
          width: 3, background: T.accent, borderRadius: '0 3px 3px 0',
        }} />
      )}

      <Icon size={16} />
      {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
    </button>
  )
}

/* ─── Sidebar ─────────────────────────────────────────────── */
const Sidebar = ({ navItems }) => {
  const { sidebarCollapsed, setSidebarCollapsed } = useApp()
  const { user, logout } = useAuth()
  const { T, isDark } = useTheme()

  const navigate  = useNavigate()
  const location  = useLocation()

  const goToPage = (id) => navigate(`/${id}`)

  return (
    <aside style={{
      width: sidebarCollapsed ? 64 : 224,
      background: T.surface,
      borderRight: `1px solid ${T.border}`,
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.3s ease, background 0.3s ease, border-color 0.3s ease',
      flexShrink: 0,
      overflow: 'hidden',
    }}>

      {/* ── Logo ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '0 16px', minHeight: 60,
        borderBottom: `1px solid ${T.border}`,
        transition: 'border-color 0.3s ease',
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9, flexShrink: 0,
          background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
        }}>
          <Shield size={15} color='#fff' />
        </div>

        {!sidebarCollapsed && (
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, whiteSpace: 'nowrap' }}>
              IT Support
            </div>
            <div style={{ fontSize: 10, color: T.textMuted, whiteSpace: 'nowrap' }}>
              Management System
            </div>
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav style={{
        flex: 1, padding: '12px 8px',
        display: 'flex', flexDirection: 'column', gap: 2,
        overflowY: 'auto',
        scrollbarWidth: 'thin',
        scrollbarColor: `${T.scrollbar} transparent`,
      }}>
        {navItems
          .filter((item) => {
            if (!user) return false
            const allowedRoles = NAV_PERMISSIONS[item.id]
            if (!allowedRoles) return true
            return allowedRoles.includes(user.role)
          })
          .map((item) => (
            <NavItem
              key={item.id}
              item={item}
              active={location.pathname === `/${item.id}`}
              collapsed={sidebarCollapsed}
              onClick={goToPage}
            />
          ))}
      </nav>

      {/* ── Footer ── */}
      <div style={{
        padding: 8,
        borderTop: `1px solid ${T.border}`,
        transition: 'border-color 0.3s ease',
      }}>

        {/* Collapse button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          style={{
            width: '100%',
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px', fontSize: 11,
            color: T.textMuted,
            background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
            border: `1px solid ${T.border}`,
            borderRadius: 8, cursor: 'pointer',
            transition: 'background 0.2s, color 0.2s',
            justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'
            e.currentTarget.style.color = T.text
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'
            e.currentTarget.style.color = T.textMuted
          }}
        >
          <Maximize2 size={14} />
          {!sidebarCollapsed && 'Collapse'}
        </button>

        {/* User info */}
        {!sidebarCollapsed && user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px' }}>
            <Avatar initials={user.initials} size={28} color={user.color} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.name}
              </div>
              <div style={{ fontSize: 10, color: T.textMuted }}>{user.role}</div>
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={logout}
          style={{
            width: '100%',
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px', fontSize: 11,
            color: T.textMuted, background: 'none', border: 'none',
            borderRadius: 8, cursor: 'pointer',
            transition: 'color 0.2s',
            justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = T.danger }}
          onMouseLeave={(e) => { e.currentTarget.style.color = T.textMuted }}
        >
          <LogOut size={14} />
          {!sidebarCollapsed && 'Keluar'}
        </button>
      </div>
    </aside>
  )
}

export default Sidebar