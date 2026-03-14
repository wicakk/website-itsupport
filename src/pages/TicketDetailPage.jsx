import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, RefreshCw, Tag, Clock, User, Layers,
  AlertCircle, MessageSquare, Send, CheckCircle2,
  UserCheck, RotateCcw, XCircle, Paperclip
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

// ─── TicketDetailPage ─────────────────────────────────────────
const TicketDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { authFetch } = useAuth()

  const [ticket, setTicket] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchTicket = async () => {
    setLoading(true)
    setError(null)
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

  useEffect(() => { fetchTicket() }, [id])

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

  // ── Loading skeleton ──
  if (loading) return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="h-8 w-48 bg-gray-800 rounded" />
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 flex flex-col gap-4">
          <div className="h-40 bg-gray-800 rounded-xl" />
          <div className="h-64 bg-gray-800 rounded-xl" />
        </div>
        <div className="h-80 bg-gray-800 rounded-xl" />
      </div>
    </div>
  )

  // ── Error ──
  if (error) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
      <AlertCircle className="w-10 h-10 text-red-500" />
      <p className="text-red-400 text-sm">{error}</p>
      <button onClick={() => navigate('/tickets')}
        className="px-4 py-2 bg-gray-800 border border-gray-700 text-gray-300 rounded hover:bg-gray-700 transition text-sm">
        ← Kembali ke Tickets
      </button>
    </div>
  )

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

  const t = ticket

  return (
    <div className="flex flex-col gap-6">

      {/* ── Breadcrumb / Back ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/tickets')}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Tickets
        </button>
        <span className="text-gray-600">/</span>
        <span className="text-sm text-gray-200 font-mono">
          {t.ticket_number ?? `#${t.id}`}
        </span>
        <button
          onClick={fetchTicket}
          className="ml-auto p-1.5 bg-gray-800 border border-gray-700 rounded hover:bg-gray-700 transition"
        >
          <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
        </button>
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── LEFT: Detail + Comments ── */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Title card */}
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-lg font-semibold text-gray-100 leading-snug">{t.title}</h1>
              <Badge label={t.status} cfg={STATUS_CFG[t.status]} />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
              <span className="font-mono bg-gray-800 border border-gray-700 rounded px-2 py-0.5">
                {t.ticket_number ?? `#${t.id}`}
              </span>
              <span className="inline-flex items-center gap-1 bg-gray-800 border border-gray-700 rounded-full px-2 py-0.5">
                {t.category ?? '—'}
              </span>
              <Badge label={t.priority} cfg={PRIORITY_CFG[t.priority]} dot pulse={t.priority === 'Critical'} />
              <span className="ml-auto flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {fmt(t.created_at)}
              </span>
            </div>

            {t.description && (
              <p className="text-sm text-gray-300 leading-relaxed border-t border-gray-800 pt-3 mt-1 whitespace-pre-wrap">
                {t.description}
              </p>
            )}

            {/* Attachments */}
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
            <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-800">
              <MessageSquare className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-semibold text-gray-200">
                Komentar
                {comments.length > 0 && (
                  <span className="ml-2 text-xs text-gray-500 font-normal">({comments.length})</span>
                )}
              </span>
            </div>

            {/* Comment list */}
            <div className="flex flex-col divide-y divide-gray-800">
              {comments.length === 0 ? (
                <p className="text-xs text-gray-500 px-5 py-6 text-center">Belum ada komentar.</p>
              ) : (
                comments.map((c, i) => {
                  // Support: c.user.name (eager loaded) | c.user_name | c.author | fallback "User #id"
                  const displayName = c.user?.name ?? c.user_name ?? c.author
                    ?? (c.user_id ? `User #${c.user_id}` : 'Unknown')
                  const initials = displayName.charAt(0).toUpperCase()
                  const bodyText = c.body ?? c.content ?? c.message ?? ''

                  // Warna avatar berdasarkan user_id agar konsisten
                  const avatarColors = [
                    'bg-blue-700','bg-violet-700','bg-emerald-700',
                    'bg-orange-700','bg-pink-700','bg-teal-700'
                  ]
                  const colorIdx = (c.user_id ?? c.id ?? i) % avatarColors.length
                  const avatarColor = avatarColors[colorIdx]

                  return (
                    <div key={c.id ?? i} className="px-5 py-4 flex gap-3">
                      {/* Avatar */}
                      <div className={`w-7 h-7 rounded-full ${avatarColor} flex items-center justify-center text-xs font-bold text-white shrink-0`}>
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
            <div className="px-5 py-4 border-t border-gray-800 flex gap-3">
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleComment() }}
                placeholder="Tulis komentar... (Ctrl+Enter untuk kirim)"
                rows={3}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 resize-none focus:outline-none focus:border-blue-600 transition"
              />
              <button
                onClick={handleComment}
                disabled={submitting || !comment.trim()}
                className="self-end flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition"
              >
                <Send className="w-3.5 h-3.5" />
                {submitting ? 'Kirim...' : 'Kirim'}
              </button>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Info sidebar ── */}
        <div className="flex flex-col gap-4">

          {/* Info card */}
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 flex flex-col gap-4">
            <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Detail Tiket</span>

            <InfoRow label="Reporter">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-gray-500" />
                {t.requester?.name ?? t.user ?? '—'}
              </span>
            </InfoRow>

            <InfoRow label="Departemen">
              {t.requester?.department ?? t.dept ?? '—'}
            </InfoRow>

            <InfoRow label="Assigned To">
              <span className="flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-gray-500" />
                {t.assignee?.name ?? 'Unassigned'}
              </span>
            </InfoRow>

            <InfoRow label="Kategori">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-gray-500" />
                {t.category ?? '—'}
              </span>
            </InfoRow>

            <InfoRow label="Prioritas">
              <Badge label={t.priority} cfg={PRIORITY_CFG[t.priority]} dot pulse={t.priority === 'Critical'} />
            </InfoRow>

            <InfoRow label="Status">
              <Badge label={t.status} cfg={STATUS_CFG[t.status]} />
            </InfoRow>

            <div className="border-t border-gray-800 pt-4 flex flex-col gap-4">
              <InfoRow label="Dibuat">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-gray-500" />
                  {fmt(t.created_at)}
                </span>
              </InfoRow>

              <InfoRow label="Diperbarui">
                {fmt(t.updated_at)}
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

// ── ActionButton ──────────────────────────────────────────────
const COLOR = {
  green: 'border-green-800 text-green-400 hover:bg-green-900/40',
  blue:  'border-blue-800 text-blue-400 hover:bg-blue-900/40',
  red:   'border-red-800 text-red-400 hover:bg-red-900/40',
}

const ActionButton = ({ icon: Icon, label, color, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition
      ${disabled ? 'border-gray-800 text-gray-600 cursor-not-allowed' : COLOR[color]}`}
  >
    <Icon className="w-3.5 h-3.5" />
    {label}
  </button>
)

export default TicketDetailPage