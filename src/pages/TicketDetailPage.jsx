import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, RefreshCw, Clock, User, Layers,
  AlertCircle, MessageSquare, Send, CheckCircle2,
  UserCheck, RotateCcw, XCircle, Paperclip,
  UserPlus, ChevronDown, Check, Search
} from 'lucide-react'
import { useAuth } from '../context/AppContext'
import { Badge } from '../components/ui'
import { PRIORITY_CFG, STATUS_CFG } from '../theme'

// ─── Helpers ──────────────────────────────────────────────────
const fmt = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

const InfoRow = ({ label, children }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">{label}</span>
    <span className="text-sm text-gray-200">{children}</span>
  </div>
)

const COLOR = {
  green:  'border-green-800 text-green-400 hover:bg-green-900/40',
  blue:   'border-blue-800  text-blue-400  hover:bg-blue-900/40',
  red:    'border-red-800   text-red-400   hover:bg-red-900/40',
  yellow: 'border-yellow-700 text-yellow-400 hover:bg-yellow-900/40',
}

const ActionButton = ({ icon: Icon, label, color, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex items-center gap-2 w-full px-3 py-2.5 sm:py-2 rounded-lg border text-xs font-medium transition
      ${disabled ? 'border-gray-800 text-gray-600 cursor-not-allowed' : COLOR[color]}`}
  >
    <Icon className="w-3.5 h-3.5 shrink-0" />
    {label}
  </button>
)

// ─── AssignDropdown ───────────────────────────────────────────
const AssignDropdown = ({ agents, current, onAssign, assigning }) => {
  const [open,   setOpen]   = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = agents.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    (a.email ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const handlePick = (agent) => { onAssign(agent.id); setOpen(false); setSearch('') }
  const handleUnassign = () => { onAssign(null); setOpen(false); setSearch('') }

  return (
    <div ref={ref} className="relative w-full">
      <button
        onClick={() => setOpen(o => !o)}
        disabled={assigning}
        className={`flex items-center gap-2 w-full px-3 py-2.5 sm:py-2 rounded-lg border text-xs font-medium transition
          ${assigning ? 'border-gray-800 text-gray-600 cursor-not-allowed' : COLOR.yellow}`}
      >
        <UserPlus className="w-3.5 h-3.5 shrink-0" />
        <span className="flex-1 text-left truncate">
          {assigning ? 'Menyimpan...' : current ? `Reassign (${current})` : 'Assign Tiket'}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 bottom-full mb-1.5 z-50 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-800">
            <Search className="w-3.5 h-3.5 text-gray-500 shrink-0" />
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari agent..."
              className="flex-1 bg-transparent text-xs text-gray-200 placeholder-gray-500 outline-none"
            />
          </div>

          <div className="max-h-48 overflow-y-auto">
            {current && (
              <button
                onClick={handleUnassign}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 text-xs text-red-400 hover:bg-red-900/20 transition text-left border-b border-gray-800"
              >
                <XCircle className="w-3.5 h-3.5 shrink-0" />
                Hapus assignment
              </button>
            )}

            {filtered.length === 0 ? (
              <p className="text-xs text-gray-500 px-3 py-4 text-center">Agent tidak ditemukan.</p>
            ) : (
              filtered.map(agent => {
                const isCurrent = current === agent.name
                return (
                  <button
                    key={agent.id}
                    onClick={() => handlePick(agent)}
                    className={`flex items-center gap-2.5 w-full px-3 py-2.5 text-left transition
                      ${isCurrent ? 'bg-yellow-900/20 text-yellow-300' : 'text-gray-300 hover:bg-gray-800'}`}
                  >
                    <div className="w-6 h-6 rounded-full bg-blue-700 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                      {agent.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-medium truncate">{agent.name}</span>
                      {agent.email && (
                        <span className="text-[10px] text-gray-500 truncate">{agent.email}</span>
                      )}
                    </div>
                    {isCurrent && <Check className="w-3.5 h-3.5 ml-auto shrink-0 text-yellow-400" />}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── TicketDetailPage ─────────────────────────────────────────
const TicketDetailPage = () => {
  const { id }        = useParams()
  const navigate      = useNavigate()
  const { authFetch, user: currentUser } = useAuth()

  const [ticket,     setTicket]     = useState(null)
  const [comments,   setComments]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [comment,    setComment]    = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [agents,     setAgents]     = useState([])
  const [assigning,  setAssigning]  = useState(false)

  const fetchTicket = async () => {
    setLoading(true); setError(null)
    try {
      const res = await authFetch(`/api/tickets/${id}`)
      if (!res.ok) throw new Error('Tiket tidak ditemukan.')
      const data = await res.json()
      setTicket(data)
      setComments(data.comments ?? [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchAgents = async () => {
    try {
      const res = await authFetch('/api/users')
      if (!res.ok) return
      const data = await res.json()
      const list = Array.isArray(data) ? data : (data.data ?? data.users ?? [])
      // Tampilkan hanya user role it_support
      const filtered = list.filter(u =>
        (u.role ?? u.role_name ?? '').toLowerCase() === 'it_support'
      )
      setAgents(filtered.length > 0 ? filtered : list)
    } catch { /* non-fatal */ }
  }

  useEffect(() => { fetchTicket(); fetchAgents() }, [id])

  const handleComment = async () => {
    if (!comment.trim()) return
    setSubmitting(true)
    try {
      const res = await authFetch(`/api/tickets/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: comment })
      })
      if (!res.ok) throw new Error('Gagal mengirim komentar.')
      const data = await res.json()
      setComments(prev => [...prev, data])
      setComment('')
    } catch (e) {
      alert(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusChange = async (status) => {
    try {
      const res = await authFetch(`/api/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (!res.ok) throw new Error('Gagal mengubah status.')
      await fetchTicket()
    } catch (e) {
      alert(e.message)
    }
  }

  const handleAssign = async (agentId) => {
    setAssigning(true)
    try {
      if (agentId === null) {
        // Unassign: pakai PATCH update biasa
        const res = await authFetch(`/api/tickets/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assigned_to: null })
        })
        if (!res.ok) throw new Error('Gagal menghapus assignment.')
      } else {
        // Assign: pakai endpoint khusus POST /assign
        const res = await authFetch(`/api/tickets/${id}/assign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assigned_to: agentId })
        })
        if (!res.ok) throw new Error('Gagal mengassign tiket.')
      }
      await fetchTicket()
    } catch (e) {
      alert(e.message)
    } finally {
      setAssigning(false)
    }
  }

  // ── Loading skeleton ──
  if (loading) return (
    <div className="flex flex-col gap-4 sm:gap-6 animate-pulse">
      <div className="h-8 w-48 bg-gray-800 rounded" />
      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="h-40 bg-gray-800 rounded-xl" />
          <div className="h-64 bg-gray-800 rounded-xl" />
        </div>
        <div className="h-48 lg:h-80 bg-gray-800 rounded-xl" />
      </div>
    </div>
  )

  // ── Error ──
  if (error) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-3 px-4">
      <AlertCircle className="w-10 h-10 text-red-500" />
      <p className="text-red-400 text-sm text-center">{error}</p>
      <button onClick={() => navigate('/tickets')}
        className="px-4 py-2 bg-gray-800 border border-gray-700 text-gray-300 rounded hover:bg-gray-700 transition text-sm">
        ← Kembali ke Tickets
      </button>
    </div>
  )

  const t = ticket

  return (
    <div className="flex flex-col gap-4 sm:gap-5">

      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        <button
          onClick={() => navigate('/tickets')}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200 transition shrink-0"
        >
          <ArrowLeft className="w-4 h-4" /> Tickets
        </button>
        <span className="text-gray-600">/</span>
        <span className="text-sm text-gray-200 font-mono truncate max-w-[140px] sm:max-w-none">
          {t.ticket_number ?? `#${t.id}`}
        </span>
        <button
          onClick={fetchTicket}
          className="ml-auto p-1.5 bg-gray-800 border border-gray-700 rounded hover:bg-gray-700 transition"
        >
          <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
        </button>
      </div>

      {/* ── Main grid: stacked on mobile, 3-col on lg ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 sm:gap-4">

        {/* ── LEFT: Detail + Comments ── */}
        <div className="lg:col-span-2 flex flex-col gap-3.5 sm:gap-4">

          {/* Title card */}
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 sm:p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-base sm:text-lg font-semibold text-gray-100 leading-snug">{t.title}</h1>
              <div className="shrink-0">
                <Badge label={t.status} cfg={STATUS_CFG[t.status]} />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-gray-400">
              <span className="font-mono bg-gray-800 border border-gray-700 rounded px-2 py-0.5 whitespace-nowrap">
                {t.ticket_number ?? `#${t.id}`}
              </span>
              <span className="inline-flex items-center gap-1 bg-gray-800 border border-gray-700 rounded-full px-2 py-0.5 whitespace-nowrap">
                {t.category ?? '—'}
              </span>
              <Badge label={t.priority} cfg={PRIORITY_CFG[t.priority]} dot pulse={t.priority === 'Critical'} />
              <span className="flex items-center gap-1 text-gray-500 text-[11px] sm:ml-auto">
                <Clock className="w-3 h-3" />
                {fmt(t.created_at)}
              </span>
            </div>

            {t.description && (
              <p className="text-sm text-gray-300 leading-relaxed border-t border-gray-800 pt-3 mt-1 whitespace-pre-wrap break-words">
                {t.description}
              </p>
            )}

            {t.attachments?.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-800">
                {t.attachments.map((a, i) => (
                  <a key={i} href={a.url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 bg-gray-800 border border-gray-700 rounded px-2 py-1 transition">
                    <Paperclip className="w-3 h-3" />
                    {a.name ?? `Lampiran ${i + 1}`}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Comments */}
          <div className="bg-gray-900 border border-gray-700 rounded-xl flex flex-col">
            <div className="flex items-center gap-2 px-4 sm:px-5 py-3 border-b border-gray-800">
              <MessageSquare className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-semibold text-gray-200">
                Komentar
                {comments.length > 0 && (
                  <span className="ml-2 text-xs text-gray-500 font-normal">({comments.length})</span>
                )}
              </span>
            </div>

            <div className="flex flex-col divide-y divide-gray-800">
              {comments.length === 0 ? (
                <p className="text-xs text-gray-500 px-5 py-6 text-center">Belum ada komentar.</p>
              ) : (
                comments.map((c, i) => {
                  const displayName = c.user?.name ?? c.user_name ?? c.author
                    ?? (c.user_id ? `User #${c.user_id}` : 'Unknown')
                  const initials = displayName.charAt(0).toUpperCase()
                  const bodyText = c.body ?? c.content ?? c.message ?? ''
                  const avatarColors = [
                    'bg-blue-700', 'bg-violet-700', 'bg-emerald-700',
                    'bg-orange-700', 'bg-pink-700', 'bg-teal-700'
                  ]
                  const avatarColor = avatarColors[(c.user_id ?? c.id ?? i) % avatarColors.length]

                  return (
                    <div key={c.id ?? i} className="px-4 sm:px-5 py-3.5 sm:py-4 flex gap-2.5 sm:gap-3">
                      <div className={`w-7 h-7 rounded-full ${avatarColor} flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5`}>
                        {initials}
                      </div>
                      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-gray-300">{displayName}</span>
                          <span className="text-[10px] text-gray-500">{fmt(c.created_at)}</span>
                          {c.is_internal === 1 && (
                            <span className="text-[10px] bg-yellow-900/40 border border-yellow-700/50 text-yellow-400 rounded px-1.5 py-0.5">Internal</span>
                          )}
                        </div>
                        {bodyText ? (
                          <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap break-words">
                            {bodyText}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-500 italic">— (komentar kosong)</p>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Comment input */}
            <div className="px-4 sm:px-5 py-4 border-t border-gray-800 flex gap-2.5 sm:gap-3">
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleComment() }}
                placeholder="Tulis komentar... (Ctrl+Enter)"
                rows={3}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 resize-none focus:outline-none focus:border-blue-600 transition"
              />
              <button
                onClick={handleComment}
                disabled={submitting || !comment.trim()}
                className="self-end flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">{submitting ? 'Kirim...' : 'Kirim'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Info sidebar ── */}
        <div className="flex flex-col gap-3.5 sm:gap-4">

          {/* Info card */}
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 sm:p-5 flex flex-col gap-3.5 sm:gap-4">
            <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Detail Tiket</span>

            <div className="grid grid-cols-2 sm:grid-cols-1 gap-3 sm:gap-4">
              <InfoRow label="Reporter">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                  <span className="truncate">{t.requester?.name ?? t.user ?? '—'}</span>
                </span>
              </InfoRow>

              <InfoRow label="Departemen">
                <span className="truncate">{t.requester?.department ?? t.dept ?? '—'}</span>
              </InfoRow>

              <InfoRow label="Assigned To">
                <span className="flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                  {t.assignee?.name
                    ? <span className="truncate text-yellow-300 font-medium">{t.assignee.name}</span>
                    : <span className="text-gray-500 italic text-xs">Belum di-assign</span>
                  }
                </span>
              </InfoRow>

              <InfoRow label="Kategori">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                  {t.category ?? '—'}
                </span>
              </InfoRow>

              <InfoRow label="Prioritas">
                <Badge label={t.priority} cfg={PRIORITY_CFG[t.priority]} dot pulse={t.priority === 'Critical'} />
              </InfoRow>

              <InfoRow label="Status">
                <Badge label={t.status} cfg={STATUS_CFG[t.status]} />
              </InfoRow>
            </div>

            <div className="border-t border-gray-800 pt-3.5 sm:pt-4 grid grid-cols-2 sm:grid-cols-1 gap-3 sm:gap-4">
              <InfoRow label="Dibuat">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                  <span className="text-xs sm:text-sm">{fmt(t.created_at)}</span>
                </span>
              </InfoRow>

              <InfoRow label="Diperbarui">
                <span className="text-xs sm:text-sm">{fmt(t.updated_at)}</span>
              </InfoRow>

              <InfoRow label="SLA Deadline">
                <span className={`font-mono text-xs ${t.sla_deadline && new Date(t.sla_deadline) < new Date() ? 'text-red-400' : 'text-gray-200'}`}>
                  {fmt(t.sla_deadline ?? t.sla)}
                </span>
              </InfoRow>
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Aksi Cepat</span>

            {/* ── Assign ke Saya ── */}
            {currentUser && t.assignee?.id !== currentUser.id && (
              <button
                onClick={() => handleAssign(currentUser.id)}
                disabled={assigning}
                className={`flex items-center gap-2 w-full px-3 py-2.5 sm:py-2 rounded-lg border text-xs font-medium transition
                  ${assigning ? 'border-gray-800 text-gray-600 cursor-not-allowed' : 'border-blue-700 text-blue-300 hover:bg-blue-900/30'}`}
              >
                <UserCheck className="w-3.5 h-3.5 shrink-0" />
                Assign ke Saya
              </button>
            )}

            {/* ── Assign ke agent lain ── */}
            <AssignDropdown
              agents={agents}
              current={t.assignee?.name ?? null}
              onAssign={handleAssign}
              assigning={assigning}
            />

            <ActionButton
              icon={CheckCircle2}
              label="Tandai Resolved"
              color="green"
              onClick={() => handleStatusChange('Resolved')}
              disabled={t.status === 'Resolved' || t.status === 'Closed'}
            />
            <ActionButton
              icon={RotateCcw}
              label="Re-open Tiket"
              color="blue"
              onClick={() => handleStatusChange('Open')}
              disabled={t.status === 'Open'}
            />
            <ActionButton
              icon={XCircle}
              label="Tutup Tiket"
              color="red"
              onClick={() => handleStatusChange('Closed')}
              disabled={t.status === 'Closed'}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default TicketDetailPage