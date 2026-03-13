import {
  LayoutDashboard,
  Ticket,
  Package,
  BookOpen,
  Activity,
  BarChart3,
  Users,
  Settings,
  Shield,
  Maximize2,
  LogOut
} from "lucide-react"

import { Avatar } from "../ui"
import { useApp, useAuth } from "../../context/AppContext"
import { NAV_PERMISSIONS } from "../../config/navPermissions"
import { useNavigate, useLocation } from "react-router-dom"

const ICONS = { LayoutDashboard, Ticket, Package, BookOpen, Activity, BarChart3, Users, Settings }

const NavItem = ({ item, active, collapsed, onClick }) => {
  const Icon = ICONS[item.iconName] ?? LayoutDashboard

  return (
    <button
      onClick={() => onClick(item.id)}
      title={collapsed ? item.label : ""}
      className={`relative w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all
      ${
        active
          ? "bg-indigo-500/10 text-indigo-500 font-semibold"
          : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
      }
      ${collapsed ? "justify-center" : "justify-start"}`}
    >
      {active && !collapsed && (
        <div className="absolute left-0 top-[22%] bottom-[22%] w-[3px] bg-indigo-500 rounded-r" />
      )}

      <Icon size={16} />

      {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
    </button>
  )
}

const Sidebar = ({ navItems }) => {
  const { sidebarCollapsed, setSidebarCollapsed } = useApp()
  const { user, logout } = useAuth()

  const navigate = useNavigate()
  const location = useLocation()

  const goToPage = (id) => {
    navigate(`/${id}`)
  }

  return (
    <aside
      className={`${
        sidebarCollapsed ? "w-16" : "w-56"
      } bg-[#0f172a] border-r border-gray-800 flex flex-col transition-all duration-300`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-800 min-h-[60px]">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow">
          <Shield size={15} color="#fff" />
        </div>

        {!sidebarCollapsed && (
          <div>
            <div className="text-sm font-bold text-white whitespace-nowrap">
              IT Support
            </div>
            <div className="text-[10px] text-gray-400 whitespace-nowrap">
              Management System
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 flex flex-col gap-1 overflow-y-auto">
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

      {/* Footer */}
      <div className="p-2 border-t border-gray-800">

        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-400 border border-gray-800 rounded-lg bg-white/5 hover:bg-white/10 transition"
        >
          <Maximize2 size={14} />
          {!sidebarCollapsed && "Collapse"}
        </button>

        {!sidebarCollapsed && user && (
          <div className="flex items-center gap-2 px-3 py-3">
            <Avatar initials={user.initials} size={28} color={user.color} />

            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white truncate">
                {user.name}
              </div>
              <div className="text-[10px] text-gray-400">{user.role}</div>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-red-500 transition"
        >
          <LogOut size={14} />
          {!sidebarCollapsed && "Keluar"}
        </button>
      </div>
    </aside>
  )
}

export default Sidebar