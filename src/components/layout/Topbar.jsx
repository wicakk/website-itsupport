
import { useEffect, useRef, useCallback } from 'react'
import { Bell, Home, ChevronRight, Ticket, AlertTriangle, CheckCircle2, Sun, Moon } from 'lucide-react'
import { Avatar } from '../ui'
import { useApp, useNav, useAuth } from '../../context/AppContext'
import { useTheme } from '../../context/ThemeContext'
import { NAV_ITEMS } from '../../data/mockData'

const NOTIF_CFG = {
  ticket:   { Icon: Ticket,        colorKey: 'accent'   },
  critical: { Icon: AlertTriangle, colorKey: 'danger'   },
  resolved: { Icon: CheckCircle2,  colorKey: 'success'  },
}

const POLL_INTERVAL = 15_000

/* ─── Hook: Realtime Polling ─────────────────────────────── */
const useNotifPolling = () => {
  const { setNotifs, setUnreadCount } = useApp()
  const { authFetch } = useAuth()
  const timerRef  = useRef(null)
  const latestRef = useRef(null)

  const fetchNotifs = useCallback(async () => {
    try {
      const url = latestRef.current
        ? `/api/notifications?after=${latestRef.current}`
        : '/api/notifications'

      const res = await authFetch(url)
      if (!res.ok) return

      const data = await res.json()
      const incoming = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : [])
      if (incoming.length === 0) return

      latestRef.current = incoming[0].id

      setNotifs((prev) => {
        const existingIds = new Set(prev.map((n) => n.id))
        const fresh = incoming.filter((n) => !existingIds.has(n.id))
        if (fresh.length === 0) return prev
        return [...fresh, ...prev].slice(0, 50)
      })

      setUnreadCount((prev) => prev + incoming.filter((n) => !n.read).length)
    } catch (err) {
      console.warn('Notif poll failed:', err.message)
    }
  }, [authFetch, setNotifs, setUnreadCount])

  useEffect(() => {
    fetchNotifs()
    timerRef.current = setInterval(fetchNotifs, POLL_INTERVAL)

    const handleVisibility = () => {
      if (document.hidden) {
        clearInterval(timerRef.current)
      } else {
        fetchNotifs()
        timerRef.current = setInterval(fetchNotifs, POLL_INTERVAL)
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      clearInterval(timerRef.current)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [fetchNotifs])
}

/* ─── Topbar ─────────────────────────────────────────────── */
const Topbar = () => {
  const { notifs, markAllRead, unreadCount, notifOpen, setNotifOpen } = useApp()
  const { page } = useNav()
  const { user } = useAuth()
  const { T, isDark, toggle } = useTheme()

  const pageLabel = NAV_ITEMS.find((n) => n.id === page)?.label ?? '—'

  useNotifPolling()

  // Tutup dropdown kalau klik di luar
  useEffect(() => {
    if (!notifOpen) return
    const close = () => setNotifOpen(false)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [notifOpen, setNotifOpen])

  // Helper: warna notif dari token tema
  const notifColor = (colorKey) => T[colorKey] ?? T.accent

  // Shared button style
  const iconBtnStyle = {
    width: 34, height: 34, borderRadius: 9,
    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
    border: `1px solid ${T.border}`,
    color: T.textMuted, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    position: 'relative', transition: 'all .2s',
  }

  return (
    <header style={{
      height: 56,
      borderBottom: `1px solid ${T.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 20px',
      background: T.surface,
      flexShrink: 0, position: 'relative', zIndex: 50,
      transition: 'background 0.3s ease, border-color 0.3s ease',
    }}>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: T.textDim, fontSize: 11 }}>
        <Home size={11} />
        <ChevronRight size={10} />
        <span style={{ color: T.textSub }}>{pageLabel}</span>
      </div>

      {/* Right section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

        {/* ── Toggle Dark / Light ── */}
        <button
          onClick={(e) => { e.stopPropagation(); toggle() }}
          title={isDark ? 'Aktifkan Light Mode' : 'Aktifkan Dark Mode'}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'
            e.currentTarget.style.color = T.text
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'
            e.currentTarget.style.color = T.textMuted
          }}
          style={iconBtnStyle}
        >
          {/* Ikon berganti dengan animasi flip */}
          <span style={{
            display: 'flex',
            transition: 'transform 0.4s ease',
            transform: isDark ? 'rotate(0deg)' : 'rotate(180deg)',
          }}>
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </span>
        </button>

        {/* ── Bell ── */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={(e) => { e.stopPropagation(); setNotifOpen(!notifOpen) }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
              e.currentTarget.style.color = T.text
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'
              e.currentTarget.style.color = T.textMuted
            }}
            style={iconBtnStyle}
          >
            <Bell size={14} />

            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: -3, right: -3,
                width: 16, height: 16, borderRadius: '50%',
                background: T.danger, color: '#fff',
                fontSize: 9, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `2px solid ${T.surface}`,
                animation: 'notifPing 1.5s ease-out 1',
              }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown Notifikasi */}
          {notifOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'absolute', right: 0, top: 'calc(100% + 10px)',
                width: 320,
                background: T.surface,
                border: `1px solid ${T.border}`,
                borderRadius: 16,
                boxShadow: isDark
                  ? '0 20px 52px rgba(0,0,0,0.55)'
                  : '0 20px 52px rgba(0,0,0,0.12)',
                zIndex: 100, overflow: 'hidden',
                transition: 'background 0.3s ease',
              }}
            >
              {/* Header dropdown */}
              <div style={{
                padding: '14px 16px', borderBottom: `1px solid ${T.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: T.text, fontSize: 13, fontWeight: 700 }}>Notifikasi</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: T.success }}>
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: T.success, display: 'inline-block',
                      animation: 'pulse 2s infinite',
                    }} />
                    Live
                  </span>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    style={{ color: T.accent, fontSize: 11, background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Tandai dibaca
                  </button>
                )}
              </div>

              {/* List notifikasi */}
              <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                {notifs.length === 0 ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center', color: T.textDim, fontSize: 12 }}>
                    Belum ada notifikasi
                  </div>
                ) : (
                  notifs.map((n) => {
                    const cfg = NOTIF_CFG[n.type] ?? NOTIF_CFG.ticket
                    const color = notifColor(cfg.colorKey)
                    return (
                      <div
                        key={n.id}
                        style={{
                          padding: '12px 16px',
                          borderBottom: `1px solid ${T.border}`,
                          background: !n.read ? `${color}08` : 'transparent',
                          display: 'flex', gap: 10, alignItems: 'flex-start',
                          transition: 'background 0.2s',
                        }}
                      >
                        <div style={{
                          width: 28, height: 28, borderRadius: 8,
                          background: `${color}15`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <cfg.Icon size={12} color={color} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ color: n.read ? T.textMuted : T.text, fontSize: 11, lineHeight: 1.5 }}>
                            {n.text}
                          </p>
                          <p style={{ color: T.textDim, fontSize: 10, marginTop: 3 }}>
                            {n.time} yang lalu
                          </p>
                        </div>
                        {!n.read && (
                          <div style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: color, marginTop: 3, flexShrink: 0,
                          }} />
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {user && <Avatar initials={user.initials} size={34} color={user.color} />}
      </div>

      {/* CSS animasi */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes notifPing {
          0%   { transform: scale(1); }
          50%  { transform: scale(1.4); }
          100% { transform: scale(1); }
        }
      `}</style>
    </header>
  )
}

export default Topbar