import { useEffect, useRef, useCallback } from 'react'
import { Bell, Home, ChevronRight, Ticket, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { T } from '../../theme'
import { Avatar } from '../ui'
import { useApp, useNav, useAuth } from '../../context/AppContext'
import { NAV_ITEMS } from '../../data/mockData'

const NOTIF_CFG = {
  ticket:   { Icon: Ticket,        color: T.accent  },
  critical: { Icon: AlertTriangle, color: T.danger  },
  resolved: { Icon: CheckCircle2,  color: T.success },
}

/* ─── Interval polling (ms) ─────────────────────────────── */
const POLL_INTERVAL = 15_000 // 15 detik

/* ─── Hook: Realtime Polling ─────────────────────────────── */
const useNotifPolling = () => {
  const { setNotifs, setUnreadCount } = useApp()
  const { authFetch } = useAuth()
  const timerRef  = useRef(null)
  const latestRef = useRef(null) // id notif terbaru yang sudah kita punya

  const fetchNotifs = useCallback(async () => {
    try {
      // Kirim param `after` agar server hanya balas notif baru
      const url = latestRef.current
        ? `/api/notifications?after=${latestRef.current}`
        : '/api/notifications'

      const res = await authFetch(url)
      if (!res.ok) return

      const data = await res.json()
      const incoming = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : [])

      if (incoming.length === 0) return

      // Simpan id terbaru untuk request berikutnya
      latestRef.current = incoming[0].id

      // Merge ke state: notif baru di atas, buang duplikat
      setNotifs((prev) => {
        const existingIds = new Set(prev.map((n) => n.id))
        const fresh = incoming.filter((n) => !existingIds.has(n.id))
        if (fresh.length === 0) return prev
        const merged = [...fresh, ...prev].slice(0, 50) // max 50 notif
        return merged
      })

      // Update unread count
      setUnreadCount((prev) => prev + incoming.filter((n) => !n.read).length)

    } catch (err) {
      // Gagal fetch notif — diam saja, coba lagi di interval berikutnya
      console.warn('Notif poll failed:', err.message)
    }
  }, [authFetch, setNotifs, setUnreadCount])

  useEffect(() => {
    // Fetch langsung saat mount
    fetchNotifs()

    // Mulai polling
    timerRef.current = setInterval(fetchNotifs, POLL_INTERVAL)

    // Pause polling saat tab tidak aktif (hemat request)
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
  const pageLabel = NAV_ITEMS.find((n) => n.id === page)?.label ?? '—'

  // Aktifkan polling
  useNotifPolling()

  // Tutup dropdown kalau klik di luar
  useEffect(() => {
    if (!notifOpen) return
    const close = () => setNotifOpen(false)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [notifOpen, setNotifOpen])

  return (
    <header style={{
      height: 56, borderBottom: `1px solid ${T.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 20px', background: T.surface,
      flexShrink: 0, position: 'relative', zIndex: 50,
    }}>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: T.textDim, fontSize: 11 }}>
        <Home size={11} /><ChevronRight size={10} />
        <span style={{ color: T.textSub }}>{pageLabel}</span>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

        {/* Bell */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={(e) => { e.stopPropagation(); setNotifOpen(!notifOpen) }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = T.text }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = T.textMuted }}
            style={{
              width: 34, height: 34, borderRadius: 9,
              background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`,
              color: T.textMuted, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', transition: 'all .2s',
            }}
          >
            <Bell size={14} />

            {/* Badge unread */}
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: -3, right: -3,
                width: 16, height: 16, borderRadius: '50%',
                background: T.danger, color: '#fff',
                fontSize: 9, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `2px solid ${T.surface}`,
                /* animasi ping saat ada notif baru */
                animation: unreadCount > 0 ? 'notifPing 1.5s ease-out 1' : 'none',
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
                width: 320, background: T.surface,
                border: `1px solid ${T.border}`, borderRadius: 16,
                boxShadow: '0 20px 52px rgba(0,0,0,0.55)',
                zIndex: 100, overflow: 'hidden',
              }}
            >
              {/* Header dropdown */}
              <div style={{
                padding: '14px 16px', borderBottom: `1px solid ${T.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: T.text, fontSize: 13, fontWeight: 700 }}>Notifikasi</span>
                  {/* Indikator polling aktif */}
                  <span style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    fontSize: 10, color: T.success,
                  }}>
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
                    return (
                      <div
                        key={n.id}
                        style={{
                          padding: '12px 16px', borderBottom: `1px solid ${T.border}`,
                          background: !n.read ? `${cfg.color}06` : 'transparent',
                          display: 'flex', gap: 10, alignItems: 'flex-start',
                          transition: 'background 0.2s',
                        }}
                      >
                        <div style={{
                          width: 28, height: 28, borderRadius: 8,
                          background: `${cfg.color}15`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <cfg.Icon size={12} color={cfg.color} />
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
                            background: cfg.color, marginTop: 3, flexShrink: 0,
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