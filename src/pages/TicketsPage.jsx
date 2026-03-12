import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, SlidersHorizontal, Wifi, Cpu, Layers, Mail, Printer, Server, Shield, Tag, User, Building2, Wrench, Clock, CalendarDays, Send, Paperclip, RefreshCw, AlertCircle, UserCheck, ChevronDown, Check, CheckCircle2, RotateCcw } from 'lucide-react'
import { T, PRIORITY_CFG, STATUS_CFG, inputStyle } from '../theme'
import { Card, Badge, Avatar, PageHeader, FilterTabs, SearchBar, PrimaryButton, GhostButton, Modal, EmptyState } from '../components/ui'
import { useAuth } from '../context/AppContext'

const CAT_ICON = {
  Network: <Wifi size={11} />, Hardware: <Cpu size={11} />, Software: <Layers size={11} />,
  Email: <Mail size={11} />, Printer: <Printer size={11} />, Server: <Server size={11} />,
  Security: <Shield size={11} />, Others: <Tag size={11} />,
}

const TICKET_STATUSES = ['Open', 'Assigned', 'In Progress', 'Waiting User', 'Resolved', 'Closed']

// ─── Skeleton row ─────────────────────────────────────────────
const SkeletonRow = () => (
  <tr style={{ borderBottom: `1px solid ${T.border}` }}>
    {Array(8).fill(0).map((_, i) => (
      <td key={i} style={{ padding: '13px 16px' }}>
        <div style={{ height: 14, borderRadius: 6, background: T.border, opacity: 0.4, animation: 'pulse 1.5s ease-in-out infinite' }} />
      </td>
    ))}
  </tr>
)

// ─── Toast ────────────────────────────────────────────────────
const Toast = ({ msg, type }) => (
  <div style={{
    position: 'sticky', top: 0, zIndex: 10, marginBottom: 12,
    padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500,
    background: type === 'error' ? `${T.danger}20` : `${T.success}20`,
    border: `1px solid ${type === 'error' ? T.danger : T.success}40`,
    color: type === 'error' ? T.danger : T.success,
    display: 'flex', alignItems: 'center', gap: 6,
  }}>
    {type === 'error' ? <AlertCircle size={12} /> : <Check size={12} />}
    {msg}
  </div>
)

// ─── StatusDropdown ───────────────────────────────────────────
const StatusDropdown = ({ current, onChange, loading }) => {
  const [open, setOpen] = useState(false)
  const cfg = STATUS_CFG[current] ?? {}

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} disabled={loading} style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
        background: cfg.bg ?? 'rgba(255,255,255,0.05)',
        border: `1px solid ${cfg.border ?? T.border}`,
        borderRadius: 8, color: cfg.color ?? T.textMuted,
        cursor: loading ? 'not-allowed' : 'pointer',
        fontSize: 12, fontWeight: 600, opacity: loading ? 0.6 : 1,
      }}>
        {loading && <RefreshCw size={11} style={{ animation: 'spin 1s linear infinite' }} />}
        {current} <ChevronDown size={11} />
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
          <div style={{
            position: 'absolute', top: '110%', left: 0, zIndex: 20,
            background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: 10, padding: 4, minWidth: 160,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}>
            {TICKET_STATUSES.map(s => {
              const sc = STATUS_CFG[s] ?? {}
              const isActive = s === current
              return (
                <button key={s} onClick={() => { onChange(s); setOpen(false) }} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  width: '100%', padding: '7px 10px',
                  background: isActive ? 'rgba(255,255,255,0.06)' : 'transparent',
                  border: 'none', borderRadius: 7,
                  color: sc.color ?? T.textMuted,
                  fontSize: 12, fontWeight: isActive ? 600 : 400,
                  cursor: 'pointer', textAlign: 'left',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = isActive ? 'rgba(255,255,255,0.06)' : 'transparent'}
                >
                  {isActive ? <Check size={10} /> : <span style={{ width: 10 }} />}
                  {s}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// ─── AssignDropdown ───────────────────────────────────────────
const AssignDropdown = ({ current, techList, onChange, loading }) => {
  const [open, setOpen] = useState(false)
  const label = current?.name ?? 'Unassigned'

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} disabled={loading} style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
        background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`,
        borderRadius: 8, color: T.textMuted,
        cursor: loading ? 'not-allowed' : 'pointer',
        fontSize: 12, fontWeight: 500, opacity: loading ? 0.6 : 1,
      }}>
        {loading
          ? <RefreshCw size={11} style={{ animation: 'spin 1s linear infinite' }} />
          : <UserCheck size={11} />
        }
        {label} <ChevronDown size={11} />
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
          <div style={{
            position: 'absolute', top: '110%', left: 0, zIndex: 20,
            background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: 10, padding: 4, minWidth: 190,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}>
            {techList.length === 0 && (
              <div style={{ padding: '8px 12px', color: T.textDim, fontSize: 12 }}>Tidak ada teknisi</div>
            )}
            {techList.map(tech => {
              const isActive = tech.id === current?.id
              return (
                <button key={tech.id} onClick={() => { onChange(tech); setOpen(false) }} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  width: '100%', padding: '7px 10px',
                  background: isActive ? 'rgba(255,255,255,0.06)' : 'transparent',
                  border: 'none', borderRadius: 7,
                  color: isActive ? T.accent : T.textMuted,
                  fontSize: 12, fontWeight: isActive ? 600 : 400,
                  cursor: 'pointer', textAlign: 'left',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = isActive ? 'rgba(255,255,255,0.06)' : 'transparent'}
                >
                  {isActive ? <Check size={10} /> : <span style={{ width: 10 }} />}
                  <span style={{ flex: 1 }}>{tech.name}</span>
                  {tech.department && <span style={{ color: T.textDim, fontSize: 10 }}>{tech.department}</span>}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// ─── ResolveModal ─────────────────────────────────────────────
const ResolveModal = ({ onClose, onSubmit, submitting }) => {
  const [notes, setNotes] = useState('')
  const valid = notes.trim().length >= 10

  return (
    <Modal title="Selesaikan Tiket" subtitle="Isi catatan resolusi sebelum menutup tiket" onClose={onClose} width={460}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
            Catatan Resolusi <span style={{ color: T.danger }}>*</span>
          </label>
          <textarea
            value={notes} onChange={e => setNotes(e.target.value)}
            rows={4} placeholder="Jelaskan solusi yang diberikan... (min. 10 karakter)"
            style={{ ...inputStyle, resize: 'none' }}
            onFocus={e => (e.target.style.borderColor = T.accent)}
            onBlur={e => (e.target.style.borderColor = T.border)}
          />
          <div style={{ color: T.textDim, fontSize: 11, marginTop: 4 }}>{notes.trim().length} / min 10 karakter</div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <GhostButton onClick={onClose}>Batal</GhostButton>
          <button onClick={() => valid && onSubmit(notes)} disabled={submitting || !valid} style={{
            padding: '8px 18px', borderRadius: 8, border: 'none',
            background: valid ? T.success : 'rgba(255,255,255,0.08)',
            color: valid ? '#fff' : T.textDim,
            fontSize: 13, fontWeight: 600,
            cursor: valid ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', gap: 6,
            opacity: submitting ? 0.7 : 1,
          }}>
            <CheckCircle2 size={14} /> {submitting ? 'Menyimpan...' : 'Selesaikan'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ─── TicketDetailModal ────────────────────────────────────────
const TicketDetailModal = ({ ticket: initialTicket, onClose, authFetch, onUpdated }) => {
  const [ticket,         setTicket]         = useState(initialTicket)
  const [comment,        setComment]        = useState('')
  const [comments,       setComments]       = useState([])
  const [sending,        setSending]        = useState(false)
  const [loadingC,       setLoadingC]       = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [updatingAssign, setUpdatingAssign] = useState(false)
  const [techList,       setTechList]       = useState([])
  const [toast,          setToast]          = useState(null)
  const [showResolve,    setShowResolve]    = useState(false)
  const [resolveSaving,  setResolveSaving]  = useState(false)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2500)
  }

  const applyUpdate = (updated) => {
    setTicket(updated)
    onUpdated?.(updated)
  }

  // Fetch komentar
  useEffect(() => {
    const fetch_ = async () => {
      setLoadingC(true)
      try {
        const res  = await authFetch(`/api/tickets/${ticket.id}/comments`)
        const data = await res.json()
        setComments(Array.isArray(data) ? data : data.data ?? [])
      } catch { setComments([]) }
      finally  { setLoadingC(false) }
    }
    fetch_()
  }, [ticket.id])

  // Fetch daftar teknisi IT
  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res  = await authFetch('/api/users')
        const data = await res.json()
        const all      = data.data ?? data ?? []
        const IT_ROLES = ['super_admin', 'manager_it', 'it_support']
        setTechList(all.filter(u => IT_ROLES.includes(u.role)))
      } catch { setTechList([]) }
    }
    fetch_()
  }, [])

  // ── Update status — petakan ke endpoint yang tepat ────────────
  const handleStatusChange = async (newStatus) => {
    if (newStatus === ticket.status) return

    // Resolved → butuh catatan resolusi
    if (newStatus === 'Resolved') { setShowResolve(true); return }

    setUpdatingStatus(true)
    try {
      let res
      if (newStatus === 'Closed') {
        // POST /close
        res = await authFetch(`/api/tickets/${ticket.id}/close`, { method: 'POST' })
      } else if (newStatus === 'Open') {
        // POST /reopen
        res = await authFetch(`/api/tickets/${ticket.id}/reopen`, { method: 'POST' })
      } else {
        // In Progress / Waiting User → PUT update biasa
        res = await authFetch(`/api/tickets/${ticket.id}`, {
          method: 'PUT',
          body:   JSON.stringify({ status: newStatus }),
        })
      }
      if (!res.ok) throw new Error()
      const data = await res.json()
      applyUpdate(data.ticket ?? data.data ?? { ...ticket, status: newStatus })
      showToast(`Status diubah ke "${newStatus}"`)
    } catch {
      showToast('Gagal mengubah status', 'error')
    } finally {
      setUpdatingStatus(false)
    }
  }

  // ── Resolve dengan catatan ────────────────────────────────────
  const handleResolve = async (notes) => {
    setResolveSaving(true)
    try {
      const res = await authFetch(`/api/tickets/${ticket.id}/resolve`, {
        method: 'POST',
        body:   JSON.stringify({ resolution_notes: notes }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      applyUpdate(data.ticket ?? data.data ?? { ...ticket, status: 'Resolved' })
      showToast('Tiket berhasil diselesaikan')
      setShowResolve(false)
    } catch {
      showToast('Gagal menyelesaikan tiket', 'error')
    } finally {
      setResolveSaving(false)
    }
  }

  // ── Assign — POST /assign dengan field assigned_to ────────────
  const handleAssign = async (tech) => {
    setUpdatingAssign(true)
    try {
      const res = await authFetch(`/api/tickets/${ticket.id}/assign`, {
        method: 'POST',
        body:   JSON.stringify({ assigned_to: tech.id }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      applyUpdate(data.ticket ?? data.data ?? { ...ticket, assignee: tech, status: 'Assigned' })
      showToast(`Assigned ke ${tech.name}`)
    } catch {
      showToast('Gagal mengubah assignment', 'error')
    } finally {
      setUpdatingAssign(false)
    }
  }

  // ── Kirim komentar ────────────────────────────────────────────
  const send = async () => {
    if (!comment.trim()) return
    setSending(true)
    try {
      const res  = await authFetch(`/api/tickets/${ticket.id}/comments`, {
        method: 'POST',
        body:   JSON.stringify({ body: comment }),
      })
      const data = await res.json()
      setComments(p => [...p, data.comment ?? data])
      setComment('')
    } catch { /* silent */ }
    finally   { setSending(false) }
  }

  const requester = ticket.requester ?? {}
  const assignee  = ticket.assignee  ?? null
  const isClosed  = ['Resolved', 'Closed'].includes(ticket.status)

  return (
    <>
      <Modal title={ticket.ticket_number ?? `#${ticket.id}`} subtitle={ticket.title} onClose={onClose} width={680}>
        <style>{`@keyframes pulse{0%,100%{opacity:.4}50%{opacity:.2}}`}</style>
        {toast && <Toast msg={toast.msg} type={toast.type} />}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Badges + IT controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              <Badge label={ticket.priority} cfg={PRIORITY_CFG[ticket.priority]} dot pulse={ticket.priority === 'Critical'} />
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.border}`, color: T.textMuted, padding: '2px 9px', borderRadius: 20, fontSize: 11 }}>
                {CAT_ICON[ticket.category]}{ticket.category}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <StatusDropdown current={ticket.status} onChange={handleStatusChange} loading={updatingStatus} />
              {!isClosed && (
                <AssignDropdown current={assignee} techList={techList} onChange={handleAssign} loading={updatingAssign} />
              )}
              {ticket.status === 'Closed' && (
                <button onClick={() => handleStatusChange('Open')} disabled={updatingStatus} style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
                  background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`,
                  borderRadius: 8, color: T.textMuted, cursor: 'pointer', fontSize: 12,
                }}>
                  <RotateCcw size={11} /> Reopen
                </button>
              )}
            </div>
          </div>

          {/* Meta info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {[
              ['Reporter',   requester.name      ?? ticket.user     ?? '—', <User size={11} />],
              ['Department', requester.department ?? ticket.dept     ?? '—', <Building2 size={11} />],
              ['Assigned',   assignee?.name       ?? 'Unassigned',           <Wrench size={11} />],
              ['SLA',        ticket.sla_deadline  ?? ticket.sla      ?? '—', <Clock size={11} />],
              ['Created',    ticket.created_at    ? ticket.created_at.slice(0,10) : '—', <CalendarDays size={11} />],
            ].map(([k, v, ic]) => (
              <div key={k} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: T.textMuted, fontSize: 10, marginBottom: 4 }}>{ic}{k}</div>
                <div style={{ color: T.text, fontSize: 12, fontWeight: 500 }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Description */}
          {ticket.description && (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Deskripsi</div>
              <p style={{ color: T.textSub, fontSize: 12, lineHeight: 1.7 }}>{ticket.description}</p>
            </div>
          )}

          {/* Resolution notes */}
          {ticket.resolution_notes && (
            <div style={{ background: `${T.success}0d`, border: `1px solid ${T.success}30`, borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: T.success, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                <CheckCircle2 size={11} /> Catatan Resolusi
              </div>
              <p style={{ color: T.textSub, fontSize: 12, lineHeight: 1.7 }}>{ticket.resolution_notes}</p>
            </div>
          )}

          {/* Comments */}
          <div>
            <div style={{ color: T.textMuted, fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Activity</div>
            {loadingC
              ? <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {Array(2).fill(0).map((_, i) => <div key={i} style={{ height: 56, borderRadius: 12, background: T.border, opacity: 0.3, animation: 'pulse 1.5s ease-in-out infinite' }} />)}
                </div>
              : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {comments.length === 0
                    ? <p style={{ color: T.textDim, fontSize: 12, textAlign: 'center', padding: '12px 0' }}>Belum ada komentar.</p>
                    : comments.map((c, i) => (
                        <div key={i} style={{ background: c.is_internal ? 'rgba(245,158,11,0.05)' : 'rgba(255,255,255,0.03)', border: `1px solid ${c.is_internal ? 'rgba(245,158,11,0.15)' : T.border}`, borderRadius: 12, padding: 12, display: 'flex', gap: 10 }}>
                          <Avatar initials={c.user?.initials ?? c.initials ?? '?'} size={28} color={c.is_internal ? T.warning : T.accent} />
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                              <span style={{ color: T.text, fontSize: 12, fontWeight: 600 }}>{c.user?.name ?? c.author ?? 'User'}</span>
                              {c.is_internal && <span style={{ background: 'rgba(245,158,11,0.12)', color: T.warning, fontSize: 9, padding: '1px 6px', borderRadius: 10, fontWeight: 600 }}>INTERNAL</span>}
                              <span style={{ color: T.textDim, fontSize: 10, marginLeft: 'auto' }}>{c.created_at ? c.created_at.slice(0,16).replace('T',' ') : c.time}</span>
                            </div>
                            <p style={{ color: T.textSub, fontSize: 12, lineHeight: 1.6 }}>{c.body ?? c.text}</p>
                          </div>
                        </div>
                      ))
                  }
                </div>
            }
          </div>

          {/* Comment input */}
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={comment} onChange={e => setComment(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !sending && send()}
              placeholder="Tulis komentar..." disabled={sending}
              style={{ ...inputStyle, flex: 1 }}
              onFocus={e => (e.target.style.borderColor = T.accent)}
              onBlur={e  => (e.target.style.borderColor = T.border)} />
            <button onClick={send} disabled={sending} style={{
              padding: '10px 16px', background: T.accent, borderRadius: 10, border: 'none',
              color: '#fff', cursor: sending ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 13, fontWeight: 600, opacity: sending ? 0.7 : 1,
            }}>
              <Send size={13} />{sending ? 'Mengirim...' : 'Kirim'}
            </button>
          </div>
        </div>
      </Modal>

      {showResolve && (
        <ResolveModal
          onClose={() => setShowResolve(false)}
          onSubmit={handleResolve}
          submitting={resolveSaving}
        />
      )}
    </>
  )
}

// ─── NewTicketModal ───────────────────────────────────────────
const NewTicketModal = ({ onClose, onSubmit, submitting }) => {
  const [form, setForm] = useState({ title: '', category: 'Network', priority: 'Medium', department: '', description: '' })
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <Modal title="Buat Tiket Baru" subtitle="Laporkan masalah IT Anda" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Judul Masalah</label>
          <input value={form.title} onChange={set('title')} style={{ ...inputStyle }} placeholder="Judul masalah..."
            onFocus={e => (e.target.style.borderColor = T.accent)} onBlur={e => (e.target.style.borderColor = T.border)} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[['Kategori', 'category', ['Hardware','Software','Network','Email','Printer','Server','Security','Others']], ['Prioritas', 'priority', ['Low','Medium','High','Critical']]].map(([l, k, opts]) => (
            <div key={k}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{l}</label>
              <select value={form[k]} onChange={set(k)} style={{ ...inputStyle, cursor: 'pointer' }}
                onFocus={e => (e.target.style.borderColor = T.accent)} onBlur={e => (e.target.style.borderColor = T.border)}>
                {opts.map(o => <option key={o} value={o} style={{ background: T.surface }}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Department</label>
          <input value={form.department} onChange={set('department')} style={inputStyle} placeholder="Department..."
            onFocus={e => (e.target.style.borderColor = T.accent)} onBlur={e => (e.target.style.borderColor = T.border)} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Deskripsi</label>
          <textarea value={form.description} onChange={set('description')} style={{ ...inputStyle, height: 88, resize: 'none' }} placeholder="Jelaskan masalah secara detail..."
            onFocus={e => (e.target.style.borderColor = T.accent)} onBlur={e => (e.target.style.borderColor = T.border)} />
        </div>
        <div style={{ border: `2px dashed ${T.border}`, borderRadius: 12, padding: '18px 16px', textAlign: 'center', cursor: 'pointer' }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = T.borderAccent)}
          onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}>
          <Paperclip size={16} style={{ color: T.textDim, marginBottom: 5 }} />
          <p style={{ color: T.textMuted, fontSize: 12 }}>Upload Screenshot / File Error</p>
          <p style={{ color: T.textDim, fontSize: 10, marginTop: 2 }}>PNG, JPG, PDF · maks. 10MB</p>
        </div>
        <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
          <GhostButton onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>Batal</GhostButton>
          <PrimaryButton onClick={() => onSubmit(form)} disabled={submitting} style={{ flex: 2, justifyContent: 'center' }}>
            {submitting ? 'Menyimpan...' : 'Buat Tiket'}
          </PrimaryButton>
        </div>
      </div>
    </Modal>
  )
}

// ─── TicketsPage ──────────────────────────────────────────────
const TicketsPage = () => {
  const { authFetch } = useAuth()

  const [tickets,     setTickets]     = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [submitting,  setSubmitting]  = useState(false)
  const [sel,         setSel]         = useState(null)
  const [showN,       setShowN]       = useState(false)
  const [query,       setQuery]       = useState('')
  const [activeTab,   setActiveTab]   = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  const [lastPage,    setLastPage]    = useState(1)
  const [total,       setTotal]       = useState(0)

  const STATUS_TABS = ['All', 'Open', 'Assigned', 'In Progress', 'Waiting User', 'Resolved', 'Closed']

  const fetchTickets = useCallback(async (page = 1) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page, per_page: 20 })
      if (query)               params.set('search', query)
      if (activeTab !== 'All') params.set('status', activeTab)

      const res  = await authFetch(`/api/tickets?${params}`)
      if (!res.ok) throw new Error('Gagal memuat tiket.')
      const data = await res.json()

      setTickets(data.data ?? data)
      setCurrentPage(data.current_page ?? 1)
      setLastPage(data.last_page    ?? 1)
      setTotal(data.total           ?? (data.data ?? data).length)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [query, activeTab, authFetch])

  useEffect(() => { fetchTickets(1) }, [query, activeTab])

  const handleSubmit = async (form) => {
    if (!form.title.trim()) return
    setSubmitting(true)
    try {
      const res = await authFetch('/api/tickets', { method: 'POST', body: JSON.stringify(form) })
      if (!res.ok) throw new Error()
      await fetchTickets(1)
      setShowN(false)
    } catch { /* silent */ }
    finally   { setSubmitting(false) }
  }

  const handleTicketUpdated = (updated) => {
    setTickets(prev => prev.map(t => t.id === updated.id ? updated : t))
    if (sel?.id === updated.id) setSel(updated)
  }

  const ticketId       = t => t.ticket_number ?? `#${t.id}`
  const ticketUser     = t => t.requester?.name      ?? t.user     ?? '—'
  const ticketDept     = t => t.requester?.department ?? t.dept     ?? '—'
  const ticketSla      = t => t.sla_deadline          ?? t.sla      ?? '—'
  const ticketAssigned = t => t.assignee?.name        ?? t.assigned ?? '—'

  if (error) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12 }}>
      <AlertCircle size={32} color={T.danger} />
      <p style={{ color: T.danger, fontSize: 14 }}>{error}</p>
      <button onClick={() => fetchTickets(1)} style={{ padding: '8px 20px', background: T.accent, border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 13 }}>
        Coba Lagi
      </button>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <style>{`
        @keyframes pulse{0%,100%{opacity:.4}50%{opacity:.2}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      `}</style>

      <PageHeader
        title="Tickets"
        subtitle={loading ? 'Memuat...' : `${total} total tiket`}
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => fetchTickets(currentPage)} disabled={loading}
              style={{ padding: '9px 12px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`, borderRadius: 10, color: T.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            </button>
            <PrimaryButton icon={Plus} onClick={() => setShowN(true)}>Buat Tiket</PrimaryButton>
          </div>
        }
      />

      <div style={{ display: 'flex', gap: 10 }}>
        <SearchBar value={query} onChange={e => { setQuery(e.target.value ?? e); setCurrentPage(1) }} placeholder="Cari tiket atau ID..." icon={Search} />
        <button style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`, borderRadius: 10, color: T.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, flexShrink: 0 }}>
          <SlidersHorizontal size={13} /> Filter
        </button>
      </div>

      <FilterTabs tabs={STATUS_TABS} active={activeTab} onChange={t => { setActiveTab(t); setCurrentPage(1) }} />

      <Card style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.border}` }}>
              {['ID', 'Judul & Reporter', 'Kategori', 'Prioritas', 'Status', 'Assigned', 'SLA', ''].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: T.textDim, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array(8).fill(0).map((_, i) => <SkeletonRow key={i} />)
              : tickets.map(t => (
                  <tr key={t.id} onClick={() => setSel(t)}
                    style={{ borderBottom: `1px solid ${T.border}`, cursor: 'pointer', transition: 'background .15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59,139,255,0.04)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '13px 16px', fontFamily: 'monospace', fontSize: 11, color: T.textMuted }}>{ticketId(t)}</td>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ color: T.text, fontSize: 13, fontWeight: 500 }}>{t.title}</div>
                      <div style={{ color: T.textDim, fontSize: 10, marginTop: 2 }}>{ticketUser(t)} · {ticketDept(t)}</div>
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.border}`, color: T.textMuted, padding: '3px 9px', borderRadius: 20, fontSize: 11 }}>
                        {CAT_ICON[t.category]}{t.category}
                      </span>
                    </td>
                    <td style={{ padding: '13px 16px' }}><Badge label={t.priority} cfg={PRIORITY_CFG[t.priority]} dot pulse={t.priority === 'Critical'} /></td>
                    <td style={{ padding: '13px 16px' }}><Badge label={t.status} cfg={STATUS_CFG[t.status]} /></td>
                    <td style={{ padding: '13px 16px', fontSize: 12, color: t.assignee ? T.textMuted : T.textDim }}>{ticketAssigned(t)}</td>
                    <td style={{ padding: '13px 16px', fontFamily: 'monospace', fontSize: 11, color: T.textDim }}>{ticketSla(t)}</td>
                    <td style={{ padding: '13px 16px' }}>
                      <button onClick={e => { e.stopPropagation(); setSel(t) }}
                        style={{ background: T.accentSoft, border: `1px solid ${T.borderAccent}`, color: T.accent, padding: '4px 10px', borderRadius: 8, fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                        Detail
                      </button>
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>
        {!loading && tickets.length === 0 && <EmptyState icon={Tag} message="Tidak ada tiket ditemukan" />}

        {!loading && lastPage > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: `1px solid ${T.border}` }}>
            <span style={{ color: T.textDim, fontSize: 12 }}>Halaman {currentPage} dari {lastPage}</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => { fetchTickets(currentPage - 1); setCurrentPage(p => p - 1) }} disabled={currentPage <= 1}
                style={{ padding: '5px 12px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`, borderRadius: 8, color: currentPage <= 1 ? T.textDim : T.textMuted, cursor: currentPage <= 1 ? 'not-allowed' : 'pointer', fontSize: 12 }}>
                ← Prev
              </button>
              <button onClick={() => { fetchTickets(currentPage + 1); setCurrentPage(p => p + 1) }} disabled={currentPage >= lastPage}
                style={{ padding: '5px 12px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`, borderRadius: 8, color: currentPage >= lastPage ? T.textDim : T.textMuted, cursor: currentPage >= lastPage ? 'not-allowed' : 'pointer', fontSize: 12 }}>
                Next →
              </button>
            </div>
          </div>
        )}
      </Card>

      {sel   && <TicketDetailModal ticket={sel} onClose={() => setSel(null)} authFetch={authFetch} onUpdated={handleTicketUpdated} />}
      {showN && <NewTicketModal onClose={() => setShowN(false)} onSubmit={handleSubmit} submitting={submitting} />}
    </div>
  )
}

export default TicketsPage