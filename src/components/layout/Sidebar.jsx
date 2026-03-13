import { LayoutDashboard, Ticket, Package, BookOpen, Activity, BarChart3, Users, Settings, Shield, Maximize2, LogOut } from 'lucide-react'
import { T } from '../../theme'
import { Avatar } from '../ui'
import { useApp, useNav, useAuth } from "../../context/AppContext";
import { NAV_PERMISSIONS } from '../../config/navPermissions'

const ICONS = { LayoutDashboard, Ticket, Package, BookOpen, Activity, BarChart3, Users, Settings }

const NavItem = ({ item, active, collapsed, onClick }) => {
  const Icon = ICONS[item.iconName] ?? LayoutDashboard
  return (
    <button onClick={() => onClick(item.id)} title={collapsed ? item.label : ''}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = T.text } }}
      onMouseLeave={e => { e.currentTarget.style.background = active ? `${T.accent}18` : 'transparent'; e.currentTarget.style.color = active ? T.accent : T.textMuted }}
      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, cursor: 'pointer', transition: 'all .15s', border: 'none', background: active ? `${T.accent}18` : 'transparent', color: active ? T.accent : T.textMuted, justifyContent: collapsed ? 'center' : 'flex-start', position: 'relative', fontFamily: "'Sora',sans-serif" }}>
      {active && !collapsed && <div style={{ position: 'absolute', left: 0, top: '22%', bottom: '22%', width: 3, borderRadius: '0 3px 3px 0', background: T.accent }} />}
      <Icon size={15} />
      {!collapsed && <span style={{ fontSize: 12, fontWeight: active ? 600 : 400, whiteSpace: 'nowrap' }}>{item.label}</span>}
    </button>
  )
}

const Sidebar = ({ navItems }) => {
  const { sidebarCollapsed, setSidebarCollapsed } = useApp()
  const { page, navigate } = useNav()
  const { user, logout }   = useAuth()

  return (
    <aside style={{ width: sidebarCollapsed ? 64 : 220, flexShrink: 0, background: T.surface, borderRight: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', transition: 'width .25s ease', overflow: 'hidden' }}>
      {/* Logo */}
      <div style={{ padding: sidebarCollapsed ? '18px 14px' : '18px 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 10, minHeight: 60 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: `linear-gradient(135deg,${T.accent},${T.accentDark})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 2px 10px ${T.accentGlow}` }}>
          <Shield size={15} color="#fff" />
        </div>
        {!sidebarCollapsed && (
          <div style={{ overflow: 'hidden' }}>
            <div style={{ color: T.text, fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap' }}>IT Support</div>
            <div style={{ color: T.textDim, fontSize: 9, marginTop: 1, whiteSpace: 'nowrap' }}>Management System</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* {navItems.map(item => <NavItem key={item.id} item={item} active={page === item.id} collapsed={sidebarCollapsed} onClick={navigate} />)} */}
        {navItems
    .filter(item => {
      if (!user) return false

      const allowedRoles = NAV_PERMISSIONS[item.id]

      if (!allowedRoles) return true // jika tidak ada rule → tampilkan

      return allowedRoles.includes(user.role)
    })
    .map(item => (
      <NavItem
        key={item.id}
        item={item}
        active={page === item.id}
        collapsed={sidebarCollapsed}
        onClick={navigate}
      />
    ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: 8, borderTop: `1px solid ${T.border}` }}>
        <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 9, background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}`, cursor: 'pointer', color: T.textMuted, justifyContent: sidebarCollapsed ? 'center' : 'flex-start', marginBottom: 6, transition: 'all .2s', fontSize: 11, fontFamily: "'Sora',sans-serif" }}>
          <Maximize2 size={12} />{!sidebarCollapsed && 'Collapse'}
        </button>

        {!sidebarCollapsed && user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px' }}>
            <Avatar initials={user.initials} size={28} color={user.color} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: T.text, fontSize: 11, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
              <div style={{ color: T.textDim, fontSize: 9, marginTop: 1 }}>{user.role}</div>
            </div>
          </div>
        )}

        <button onClick={logout}
          onMouseEnter={e => (e.currentTarget.style.color = T.danger)}
          onMouseLeave={e => (e.currentTarget.style.color = T.textDim)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, background: 'none', border: 'none', color: T.textDim, cursor: 'pointer', justifyContent: sidebarCollapsed ? 'center' : 'flex-start', fontSize: 11, fontFamily: "'Sora',sans-serif", transition: 'color .2s' }}>
          <LogOut size={13} />{!sidebarCollapsed && 'Keluar'}
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
