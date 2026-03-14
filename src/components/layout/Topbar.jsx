import { useEffect, useRef, useState } from 'react'
import { Bell, Home, ChevronRight, Ticket, AlertTriangle, Clock } from 'lucide-react'
import { Avatar } from '../ui'
import { useAuth } from '../../context/AppContext'
import { useLocation, useNavigate } from 'react-router-dom'
import { NAV_ITEMS } from '../../data/mockData'

// ─── Priority → icon + warna ─────────────────────────────────
const PRIO_CFG = {
  Critical: { Icon: AlertTriangle, cls: 'text-red-400',    bg: 'bg-red-400/15'    },
  High:     { Icon: AlertTriangle, cls: 'text-orange-400', bg: 'bg-orange-400/15' },
  Medium:   { Icon: Ticket,        cls: 'text-blue-400',   bg: 'bg-blue-400/15'   },
  Low:      { Icon: Ticket,        cls: 'text-gray-400',   bg: 'bg-gray-400/15'   },
}

const POLL_MS  = 15_000
const MAX_SHOW = 20   // maks notif yang disimpan

// ─── Format waktu relatif ─────────────────────────────────────
const relTime = (iso) => {
  if (!iso) return ''
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (diff < 60)    return `${diff} detik`
  if (diff < 3600)  return `${Math.floor(diff / 60)} menit`
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam`
  return `${Math.floor(diff / 86400)} hari`
}

const Topbar = () => {
  const { user, authFetch } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [notifs,      setNotifs]      = useState([])   // array tiket baru
  const [unread,      setUnread]      = useState(0)
  const [open,        setOpen]        = useState(false)
  const [marking,     setMarking]     = useState(false)

  // Refs — aman dipakai di interval tanpa trigger re-render
  const authFetchRef  = useRef(authFetch)
  const latestIdRef   = useRef(null)    // id tiket terbaru yang sudah kita tahu
  const timerRef      = useRef(null)
  const readIdsRef    = useRef(new Set()) // id tiket yang sudah dibaca user

  useEffect(() => { authFetchRef.current = authFetch }, [authFetch])

  const currentNav = NAV_ITEMS.find(n => location.pathname.startsWith(`/${n.id}`))
  const pageLabel  = currentNav?.label ?? 'Dashboard'

  // ── Fetch tiket terbaru ───────────────────────────────────────
  const fetchLatest = async () => {
    try {
      // Ambil 20 tiket terbaru, urutkan by created_at desc
      const res = await authFetchRef.current('/api/tickets?per_page=20&page=1')
      if (!res.ok) return
      const data = await res.json()
      const rows = (data.data ?? data)

      if (!Array.isArray(rows) || rows.length === 0) return

      const newestId = rows[0].id

      // Pertama kali fetch — simpan semua, tandai sudah "lama" (tidak unread)
      if (latestIdRef.current === null) {
        latestIdRef.current = newestId
        // Isi notif awal tapi semua dianggap sudah dibaca
        rows.forEach(t => readIdsRef.current.add(t.id))
        setNotifs(rows.slice(0, MAX_SHOW).map(t => ({ ...t, _notif_read: true })))
        return
      }

      // Polling berikutnya — cari tiket yang id-nya lebih baru dari latestId
      const fresh = rows.filter(t => t.id > latestIdRef.current)
      if (fresh.length === 0) return

      latestIdRef.current = newestId

      // Tambahkan tiket baru ke atas, tandai sebagai unread
      setNotifs(prev => {
        const existIds = new Set(prev.map(n => n.id))
        const toAdd    = fresh.filter(t => !existIds.has(t.id)).map(t => ({ ...t, _notif_read: false }))
        if (toAdd.length === 0) return prev
        return [...toAdd, ...prev].slice(0, MAX_SHOW)
      })

      setUnread(prev => prev + fresh.length)

    } catch (e) {
      console.warn('Notif poll error:', e.message)
    }
  }

  // ── Mount: fetch sekali + interval ───────────────────────────
  useEffect(() => {
    fetchLatest()
    timerRef.current = setInterval(fetchLatest, POLL_MS)

    const onVisibility = () => {
      if (document.hidden) {
        clearInterval(timerRef.current)
      } else {
        fetchLatest()
        timerRef.current = setInterval(fetchLatest, POLL_MS)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      clearInterval(timerRef.current)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, []) // hanya mount

  // ── Tandai semua dibaca ───────────────────────────────────────
  const handleMarkAllRead = () => {
    if (marking) return
    setMarking(true)
    setNotifs(prev => prev.map(n => ({ ...n, _notif_read: true })))
    setUnread(0)
    setTimeout(() => setMarking(false), 300)
  }

  // ── Klik notif → baca + navigate ─────────────────────────────
  const handleClick = (n) => {
    if (!n._notif_read) {
      setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, _notif_read: true } : x))
      setUnread(prev => Math.max(0, prev - 1))
    }
    navigate(`/tickets/${n.id}`)
    setOpen(false)
  }

  // ── Tutup dropdown klik di luar ───────────────────────────────
  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [open])

  return (
    <>
      <style>{`
        @keyframes notifPulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes notifPing  { 0%{transform:scale(1)} 50%{transform:scale(1.35)} 100%{transform:scale(1)} }
      `}</style>

      <header className="h-14 border-b border-gray-800 bg-gray-900 flex items-center justify-between px-5 shrink-0 relative z-50">

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-gray-500 text-xs">
          <Home size={11} />
          <ChevronRight size={10} />
          <span className="text-gray-400">{pageLabel}</span>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2.5">

          {/* Bell */}
          <div className="relative">
            <button
              onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
              className="w-[34px] h-[34px] flex items-center justify-center rounded-[9px] bg-white/[0.04] border border-gray-700 text-gray-400 hover:bg-white/[0.08] hover:text-gray-200 transition relative"
            >
              <Bell size={14} />
              {unread > 0 && (
                <span
                  key={unread}
                  className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center border-2 border-gray-900"
                  style={{ animation: 'notifPing 1.5s ease-out 1' }}
                >
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </button>

            {/* Dropdown */}
            {open && (
              <div
                onClick={e => e.stopPropagation()}
                className="absolute right-0 top-[calc(100%+10px)] w-80 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl z-[100] overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-100 text-sm font-bold">Tiket Terbaru</span>
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"
                        style={{ animation: 'notifPulse 2s infinite' }} />
                      Live
                    </span>
                  </div>
                  {unread > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      disabled={marking}
                      className="text-blue-400 text-xs hover:text-blue-300 disabled:opacity-50 transition bg-transparent border-none cursor-pointer"
                    >
                      Tandai dibaca
                    </button>
                  )}
                </div>

                {/* List */}
                <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-800">
                  {notifs.length === 0 ? (
                    <div className="py-8 text-center text-gray-500 text-xs">
                      Belum ada tiket
                    </div>
                  ) : notifs.map(n => {
                    const cfg = PRIO_CFG[n.priority] ?? PRIO_CFG.Medium
                    const isNew = !n._notif_read
                    return (
                      <button
                        key={n.id}
                        onClick={() => handleClick(n)}
                        className={`w-full text-left flex gap-2.5 items-start px-4 py-3 hover:bg-white/[0.04] transition cursor-pointer
                          ${isNew ? 'bg-blue-500/[0.05]' : ''}`}
                      >
                        {/* Icon */}
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg}`}>
                          <cfg.Icon size={12} className={cfg.cls} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                            <span className="font-mono text-[10px] text-gray-500">
                              {n.ticket_number ?? `#${n.id}`}
                            </span>
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full
                              ${n.priority === 'Critical' ? 'bg-red-500/15 text-red-400'
                              : n.priority === 'High'     ? 'bg-orange-500/15 text-orange-400'
                              : n.priority === 'Medium'   ? 'bg-blue-500/15 text-blue-400'
                              :                             'bg-gray-500/15 text-gray-400'}`}>
                              {n.priority}
                            </span>
                            <span className="text-[10px] text-gray-600 ml-auto flex items-center gap-0.5">
                              <Clock size={8} /> {relTime(n.created_at)}
                            </span>
                          </div>
                          <p className={`text-[11px] leading-snug truncate ${isNew ? 'text-gray-200 font-medium' : 'text-gray-500'}`}>
                            {n.title}
                          </p>
                          <p className="text-gray-600 text-[10px] mt-0.5">
                            {n.requester?.name ?? '—'} · {n.category ?? '—'}
                          </p>
                        </div>

                        {/* Unread dot */}
                        {isNew && (
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Footer */}
                <button
                  onClick={() => { navigate('/tickets'); setOpen(false) }}
                  className="w-full py-2.5 text-xs text-gray-500 hover:text-gray-300 hover:bg-white/[0.03] transition border-t border-gray-800 text-center"
                >
                  Lihat semua tiket →
                </button>
              </div>
            )}
          </div>

          {user && <Avatar initials={user.initials} size={34} color={user.color} />}
        </div>
      </header>
    </>
  )
}

export default Topbar