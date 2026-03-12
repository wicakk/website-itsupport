import { createContext, useContext, useState, useCallback } from 'react'
import { MOCK_TICKETS, INITIAL_NOTIFS } from '../data/mockData'

const AppContext = createContext(null)

// ─── Helper: fetch dengan Authorization header ───────────────
const apiFetch = (url, token, options = {}) =>
  fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept':       'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  })

export const AppProvider = ({ children }) => {
  // ─── Restore session dari localStorage ──────────────────────
  const [user,  setUser]  = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })
  const [token, setToken] = useState(() => localStorage.getItem('token') ?? null)

  const [currentPage,      setCurrentPage]      = useState('dashboard')
  const [tickets,          setTickets]          = useState(MOCK_TICKETS)
  const [notifs,           setNotifs]           = useState(INITIAL_NOTIFS)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [notifOpen,        setNotifOpen]        = useState(false)

  // ─── AUTH ────────────────────────────────────────────────────
  const login = useCallback((userData, authToken) => {
    localStorage.setItem('token', authToken)
    localStorage.setItem('user',  JSON.stringify(userData))
    setToken(authToken)
    setUser(userData)
    setCurrentPage('dashboard')
  }, [])

  const logout = useCallback(async () => {
    if (token) {
      await apiFetch('/api/logout', token, { method: 'POST' }).catch(() => {})
    }
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
    setCurrentPage('dashboard')
  }, [token])

  // ─── TICKETS ─────────────────────────────────────────────────
  const addTicket = useCallback((form) => {
    setTickets(prev => [{
      id:       `TKT-${String(prev.length + 42).padStart(4, '0')}`,
      ...form,
      status:   'Open',
      user:     user?.name ?? 'You',
      assigned: null,
      created:  new Date().toISOString().slice(0, 10),
      sla:      new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      initials: user?.initials ?? 'YO',
    }, ...prev])
  }, [user])

  // ─── NOTIFS ──────────────────────────────────────────────────
  const markAllRead = useCallback(() => setNotifs(p => p.map(n => ({ ...n, read: true }))), [])
  const unreadCount = notifs.filter(n => !n.read).length

  const authFetch = useCallback(
    (url, options = {}) => apiFetch(url, token, options),
    [token]
  )

  return (
    <AppContext.Provider value={{
      user, token, login, logout, authFetch,
      currentPage, setCurrentPage,
      tickets, addTicket,
      notifs, markAllRead, unreadCount,
      sidebarCollapsed, setSidebarCollapsed,
      notifOpen, setNotifOpen,
    }}>
      {children}
    </AppContext.Provider>
  )
}

// ─── Hooks ───────────────────────────────────────────────────
export const useApp     = () => useContext(AppContext)
export const useAuth    = () => { const { user, token, login, logout, authFetch } = useApp(); return { user, token, login, logout, authFetch } }
export const useNav     = () => { const { currentPage, setCurrentPage } = useApp(); return { page: currentPage, navigate: setCurrentPage } }
export const useTickets = () => { const { tickets, addTicket } = useApp(); return { tickets, addTicket } }