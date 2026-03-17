import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Search, SlidersHorizontal, RefreshCw, Tag,
  ChevronLeft, ChevronRight, Paperclip, X as XIcon,
  FileText, ImageIcon, File,
} from 'lucide-react'
import { useAuth } from '../context/AppContext'
import { useTheme } from '../context/ThemeContext'
import { Badge, PageHeader, FilterTabs, SearchBar, PrimaryButton, EmptyState } from '../components/ui'
import { PRIORITY_CFG, STATUS_CFG } from '../theme'

// ─── Pagination ───────────────────────────────────────────────
const Pagination = ({ currentPage, lastPage, total, perPage, onPageChange, loading, theme }) => {
  if (total === 0) return null

  const getPages = () => {
    if (lastPage <= 1) return [1]
    const delta  = 1
    const left   = Math.max(2, currentPage - delta)
    const right  = Math.min(lastPage - 1, currentPage + delta)
    const middle = []
    for (let i = left; i <= right; i++) middle.push(i)
    const pages = [1]
    if (left > 2) pages.push('...')
    pages.push(...middle)
    if (right < lastPage - 1) pages.push('...')
    if (lastPage > 1) pages.push(lastPage)
    return pages
  }

  const from = Math.min((currentPage - 1) * perPage + 1, total)
  const to   = Math.min(currentPage * perPage, total)

  const btnBase = {
    minWidth: 32, height: 32, padding: '0 8px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: 6, fontSize: 12, fontWeight: 500,
    border: `1px solid ${theme.border}`, cursor: 'pointer', transition: 'all 0.15s',
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 10,
      padding: '12px 16px',
      borderTop: `1px solid ${theme.border}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <span style={{ fontSize: 12, color: theme.textMuted }}>
          Menampilkan{' '}
          <span style={{ color: theme.text, fontWeight: 500 }}>{from}–{to}</span>
          {' '}dari{' '}
          <span style={{ color: theme.text, fontWeight: 500 }}>{total}</span> tiket
        </span>
        {lastPage > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1 || loading}
              style={{
                ...btnBase,
                background: currentPage <= 1 || loading ? theme.surfaceAlt : theme.surface,
                color: currentPage <= 1 || loading ? theme.textDim : theme.textMuted,
                cursor: currentPage <= 1 || loading ? 'not-allowed' : 'pointer',
              }}
            >
              <ChevronLeft size={14} />
            </button>
            {getPages().map((p, i) =>
              p === '...'
                ? <span key={`d${i}`} style={{ padding: '0 4px', color: theme.textDim, fontSize: 12 }}>···</span>
                : <button
                    key={p}
                    onClick={() => onPageChange(p)}
                    disabled={loading}
                    style={{
                      ...btnBase,
                      background: p === currentPage ? theme.accent : theme.surface,
                      color:      p === currentPage ? '#fff'        : theme.textMuted,
                      borderColor:p === currentPage ? theme.accent  : theme.border,
                    }}
                  >{p}</button>
            )}
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= lastPage || loading}
              style={{
                ...btnBase,
                background: currentPage >= lastPage || loading ? theme.surfaceAlt : theme.surface,
                color: currentPage >= lastPage || loading ? theme.textDim : theme.textMuted,
                cursor: currentPage >= lastPage || loading ? 'not-allowed' : 'pointer',
              }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── NewTicketModal ───────────────────────────────────────────
const PRIORITIES   = ['Low', 'Medium', 'High', 'Critical']
const TICKET_CATS  = ['Network', 'Email', 'Printer', 'Software', 'Hardware', 'Server', 'Other']
const EMPTY_TICKET = { title: '', category: 'Network', priority: 'Medium', description: '' }
const MAX_FILES    = 5
const MAX_MB       = 10

const fileIcon = (file) => {
  if (file.type.startsWith('image/')) return <ImageIcon size={14} color="#3B8BFF" />
  if (file.type === 'application/pdf') return <FileText size={14} color="#EF4444" />
  return <File size={14} color="#6B7FA3" />
}

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const NewTicketModal = ({ onClose, onSubmit, theme }) => {
  const { authFetch }   = useAuth()
  const [form, setForm] = useState(EMPTY_TICKET)
  const [files, setFiles]       = useState([])
  const [saving, setSaving]     = useState(false)
  const [errors, setErrors]     = useState({})
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)

  const set = (k) => (e) => {
    setForm(f => ({ ...f, [k]: e.target.value }))
    setErrors(e2 => ({ ...e2, [k]: undefined }))
  }

  const addFiles = (incoming) => {
    const arr = Array.from(incoming)
    setFiles(prev => {
      const combined = [...prev]
      for (const f of arr) {
        if (combined.length >= MAX_FILES) break
        if (f.size > MAX_MB * 1024 * 1024) {
          setErrors(e => ({ ...e, files: `File "${f.name}" melebihi ${MAX_MB}MB` }))
          continue
        }
        if (!combined.find(x => x.name === f.name && x.size === f.size)) combined.push(f)
      }
      return combined
    })
    setErrors(e => ({ ...e, files: undefined }))
  }

  const removeFile = (idx) => setFiles(p => p.filter((_, i) => i !== idx))
  const onDrop = (e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files) }

  const validate = () => {
    const e = {}
    if (!form.title.trim())       e.title       = 'Wajib diisi'
    if (!form.description.trim()) e.description = 'Wajib diisi'
    return e
  }

  const handleSubmit = async () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setSaving(true)
    try {
      if (files.length > 0) {
        const fd = new FormData()
        fd.append('title', form.title); fd.append('category', form.category)
        fd.append('priority', form.priority); fd.append('description', form.description)
        files.forEach(f => fd.append('attachments[]', f))
        const res = await authFetch('/api/tickets', { method: 'POST', body: fd })
        if (!res.ok) throw new Error('Gagal membuat tiket')
      } else {
        const res = await authFetch('/api/tickets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (!res.ok) throw new Error('Gagal membuat tiket')
      }
      onSubmit()
    } catch (err) {
      setErrors({ _global: err.message })
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = {
    width: '100%', background: theme.surfaceAlt,
    border: `1px solid ${theme.border}`,
    borderRadius: 8, padding: '8px 12px',
    fontSize: 13, color: theme.text,
    outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s',
    fontFamily: 'inherit',
  }

  const labelStyle = {
    display: 'block', fontSize: 10, fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: '0.08em',
    color: theme.textMuted, marginBottom: 6,
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: theme.overlay,
        backdropFilter: 'blur(4px)', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '12px', overflowY: 'auto',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: theme.surface, border: `1px solid ${theme.border}`,
          borderRadius: 18, width: '100%', maxWidth: 520,
          display: 'flex', flexDirection: 'column', boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: `1px solid ${theme.border}`,
        }}>
          <p style={{ color: theme.text, fontWeight: 700, fontSize: 15, margin: 0 }}>Buat Tiket Baru</p>
          <button onClick={onClose} style={{ color: theme.textMuted, background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '20px', overflowY: 'auto', maxHeight: '65vh' }}>

          {/* Judul */}
          <div>
            <label style={labelStyle}>Judul <span style={{ color: theme.danger }}>*</span></label>
            <input
              style={{ ...inputStyle, borderColor: errors.title ? theme.danger : theme.border }}
              placeholder="Deskripsi singkat masalah..."
              value={form.title} onChange={set('title')}
            />
            {errors.title && <p style={{ color: theme.danger, fontSize: 11, marginTop: 4 }}>{errors.title}</p>}
          </div>

          {/* Kategori + Prioritas */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Kategori</label>
              <select style={inputStyle} value={form.category} onChange={set('category')}>
                {TICKET_CATS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Prioritas</label>
              <select style={inputStyle} value={form.priority} onChange={set('priority')}>
                {PRIORITIES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* Deskripsi */}
          <div>
            <label style={labelStyle}>Deskripsi <span style={{ color: theme.danger }}>*</span></label>
            <textarea
              style={{
                ...inputStyle,
                minHeight: 96, resize: 'vertical',
                borderColor: errors.description ? theme.danger : theme.border,
              }}
              placeholder="Jelaskan masalah secara detail..."
              value={form.description} onChange={set('description')}
            />
            {errors.description && <p style={{ color: theme.danger, fontSize: 11, marginTop: 4 }}>{errors.description}</p>}
          </div>

          {/* Upload */}
          <div>
            <label style={labelStyle}>
              Lampiran{' '}
              <span style={{ color: theme.textDim, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                (maks {MAX_FILES} file · {MAX_MB}MB)
              </span>
            </label>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => files.length < MAX_FILES && fileInputRef.current?.click()}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 8,
                border: `2px dashed ${dragOver ? theme.accent : files.length >= MAX_FILES ? theme.border : theme.border}`,
                borderRadius: 12, padding: '20px 16px',
                background: dragOver ? theme.accentSoft : 'transparent',
                cursor: files.length >= MAX_FILES ? 'not-allowed' : 'pointer',
                opacity: files.length >= MAX_FILES ? 0.5 : 1,
                transition: 'all 0.2s',
              }}
            >
              <Paperclip size={18} color={dragOver ? theme.accent : theme.textMuted} />
              <p style={{ fontSize: 12, color: theme.textMuted, textAlign: 'center', margin: 0 }}>
                {files.length >= MAX_FILES
                  ? `Batas ${MAX_FILES} file tercapai`
                  : <><span style={{ color: theme.accent, fontWeight: 600 }}>Klik untuk pilih</span> atau drag &amp; drop</>
                }
              </p>
              <p style={{ fontSize: 10, color: theme.textDim, margin: 0 }}>PNG, JPG, PDF, DOCX, XLSX, dll.</p>
            </div>
            <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }}
              onChange={e => { addFiles(e.target.files); e.target.value = '' }} />
            {errors.files && <p style={{ color: '#F59E0B', fontSize: 11, marginTop: 4 }}>{errors.files}</p>}
            {files.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
                {files.map((f, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: theme.surfaceAlt, border: `1px solid ${theme.border}`,
                    borderRadius: 8, padding: '8px 12px',
                  }}>
                    {fileIcon(f)}
                    <span style={{ flex: 1, fontSize: 12, color: theme.textSub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                    <span style={{ fontSize: 10, color: theme.textMuted, flexShrink: 0 }}>{formatBytes(f.size)}</span>
                    <button onClick={() => removeFile(i)} style={{ color: theme.textMuted, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                      <XIcon size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {errors._global && (
            <div style={{
              padding: '10px 12px', background: 'rgba(239,68,68,0.10)',
              border: '1px solid rgba(239,68,68,0.30)', borderRadius: 8,
              color: theme.danger, fontSize: 12,
            }}>
              {errors._global}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px', borderTop: `1px solid ${theme.border}`, gap: 8,
        }}>
          <span style={{ fontSize: 11, color: theme.textDim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {files.length > 0 ? `${files.length} file terlampir` : 'Belum ada lampiran'}
          </span>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button
              onClick={onClose} disabled={saving}
              style={{
                padding: '8px 16px', borderRadius: 8,
                border: `1px solid ${theme.border}`,
                background: 'transparent', color: theme.textMuted,
                fontSize: 13, cursor: 'pointer',
              }}
            >Batal</button>
            <button
              onClick={handleSubmit} disabled={saving}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 8,
                background: theme.accent, color: '#fff',
                border: 'none', fontSize: 13, fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? 'Menyimpan...' : 'Buat Tiket'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── TicketCard (mobile) ──────────────────────────────────────
const TicketCard = ({ t, onClick, theme }) => (
  <div
    onClick={onClick}
    style={{
      display: 'flex', flexDirection: 'column', gap: 8,
      padding: '14px 16px', borderTop: `1px solid ${theme.border}`,
      cursor: 'pointer', transition: 'background 0.15s',
    }}
    onMouseEnter={e => e.currentTarget.style.background = theme.surfaceHover}
    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
  >
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
          <span style={{ fontFamily: 'monospace', fontSize: 10, color: theme.textMuted }}>{t.ticket_number ?? `#${t.id}`}</span>
          <Badge label={t.priority} cfg={PRIORITY_CFG[t.priority]} dot pulse={t.priority === 'Critical'} />
        </div>
        <p style={{ color: theme.text, fontWeight: 500, fontSize: 13, margin: 0, lineHeight: 1.4 }}>{t.title}</p>
        <p style={{ color: theme.textMuted, fontSize: 11, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {t.requester?.name ?? t.user ?? '—'}
          {(t.requester?.department ?? t.dept) ? ` · ${t.requester?.department ?? t.dept}` : ''}
        </p>
      </div>
      <Badge label={t.status} cfg={STATUS_CFG[t.status]} />
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', fontSize: 11, color: theme.textMuted }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center',
        background: theme.surfaceAlt, border: `1px solid ${theme.border}`,
        borderRadius: 99, padding: '2px 8px', fontSize: 11,
      }}>{t.category ?? '—'}</span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.assignee?.name ?? 'Unassigned'}</span>
      {(t.sla_deadline ?? t.sla) && (
        <span style={{ fontFamily: 'monospace', marginLeft: 'auto' }}>{t.sla_deadline ?? t.sla}</span>
      )}
    </div>
  </div>
)

// ─── TicketsPage ──────────────────────────────────────────────
const TicketsPage = () => {
  const { authFetch } = useAuth()
  const navigate      = useNavigate()
  const { T: theme }  = useTheme()   // ← T dari ThemeContext

  const [tickets,     setTickets]     = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [showNew,     setShowNew]     = useState(false)
  const [query,       setQuery]       = useState('')
  const [activeTab,   setActiveTab]   = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  const [lastPage,    setLastPage]    = useState(1)
  const [total,       setTotal]       = useState(0)

  const PER_PAGE    = 20
  const STATUS_TABS = ['All', 'Open', 'Assigned', 'In Progress', 'Waiting User', 'Resolved', 'Closed']

  const fetchTickets = useCallback(async (page = 1) => {
    setLoading(true); setError(null)
    try {
      const params = new URLSearchParams({ page, per_page: PER_PAGE })
      if (query)               params.set('search', query)
      if (activeTab !== 'All') params.set('status', activeTab)
      const res  = await authFetch(`/api/tickets?${params}`)
      if (!res.ok) throw new Error('Gagal memuat tiket.')
      const data       = await res.json()
      const rows       = data.data ?? data
      const _total     = data.total    ?? rows.length
      const _lastPage  = (data.last_page ?? Math.ceil(_total / PER_PAGE)) || 1
      const _curPage   = data.current_page ?? page
      setTickets(rows); setTotal(_total); setLastPage(_lastPage); setCurrentPage(_curPage)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [query, activeTab, authFetch])

  useEffect(() => { setCurrentPage(1); fetchTickets(1) }, [query, activeTab]) // eslint-disable-line

  const handlePageChange = (page) => {
    if (page === currentPage) return
    setCurrentPage(page)
    fetchTickets(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (error) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12 }}>
      <Tag size={40} color={theme.danger} />
      <p style={{ color: theme.danger, fontSize: 13, textAlign: 'center' }}>{error}</p>
      <button
        onClick={() => fetchTickets(currentPage)}
        style={{ padding: '8px 20px', background: theme.accent, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}
      >Coba Lagi</button>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <PageHeader
        title="Tickets"
        subtitle={loading ? 'Memuat...' : `${total} total tiket`}
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => fetchTickets(currentPage)} disabled={loading}
              style={{
                padding: 8, background: theme.surface, border: `1px solid ${theme.border}`,
                borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center',
                color: theme.textMuted,
              }}
            >
              <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            </button>
            <PrimaryButton icon={Plus} onClick={() => setShowNew(true)}>Buat Tiket</PrimaryButton>
          </div>
        }
      />

      {/* Search + Filter */}
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <SearchBar
            value={query}
            onChange={e => setQuery(e.target?.value ?? e)}
            placeholder="Cari tiket atau ID..."
            icon={Search}
          />
        </div>
        <button style={{
          padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 13, background: theme.surface, border: `1px solid ${theme.border}`,
          borderRadius: 8, color: theme.textMuted, cursor: 'pointer', flexShrink: 0,
          transition: 'background 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = theme.surfaceHover}
          onMouseLeave={e => e.currentTarget.style.background = theme.surface}
        >
          <SlidersHorizontal size={16} />
          <span>Filter</span>
        </button>
      </div>

      {/* Filter tabs */}
      <FilterTabs tabs={STATUS_TABS} active={activeTab} onChange={t => setActiveTab(t)} />

      {/* Table + Cards */}
      <div style={{
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        borderRadius: 14, overflow: 'hidden',
      }}>

        {/* ── Desktop table ── */}
        <div style={{ overflowX: 'auto' }} className="hidden md:block">
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700, fontSize: 13 }}>
            <thead>
              <tr style={{ background: theme.surfaceAlt }}>
                {['ID', 'Judul & Reporter', 'Kategori', 'Prioritas', 'Status', 'Assigned', 'SLA', ''].map(h => (
                  <th key={h} style={{
                    padding: '10px 16px', textAlign: 'left',
                    fontSize: 11, fontWeight: 700, color: theme.textMuted,
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    whiteSpace: 'nowrap', borderBottom: `1px solid ${theme.border}`,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array(8).fill(0).map((_, i) => (
                    <tr key={i} style={{ borderTop: `1px solid ${theme.border}` }}>
                      {Array(8).fill(0).map((_, j) => (
                        <td key={j} style={{ padding: '12px 16px' }}>
                          <div style={{ height: 14, background: theme.surfaceAlt, borderRadius: 6, animation: 'pulse 1.5s ease-in-out infinite' }} />
                        </td>
                      ))}
                    </tr>
                  ))
                : tickets.map(t => (
                    <tr
                      key={t.id}
                      style={{ borderTop: `1px solid ${theme.border}`, cursor: 'pointer', transition: 'background 0.15s' }}
                      onClick={() => navigate(`/tickets/${t.id}`)}
                      onMouseEnter={e => e.currentTarget.style.background = theme.surfaceHover}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 11, color: theme.textMuted, whiteSpace: 'nowrap' }}>
                        {t.ticket_number ?? `#${t.id}`}
                      </td>
                      <td style={{ padding: '12px 16px', maxWidth: 240 }}>
                        <div style={{ color: theme.text, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                        <div style={{ color: theme.textMuted, fontSize: 11, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {t.requester?.name ?? t.user ?? '—'} · {t.requester?.department ?? t.dept ?? '—'}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center',
                          background: theme.surfaceAlt, border: `1px solid ${theme.border}`,
                          borderRadius: 99, padding: '2px 10px', fontSize: 11, color: theme.textSub,
                        }}>{t.category ?? '—'}</span>
                      </td>
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                        <Badge label={t.priority} cfg={PRIORITY_CFG[t.priority]} dot pulse={t.priority === 'Critical'} />
                      </td>
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                        <Badge label={t.status} cfg={STATUS_CFG[t.status]} />
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: theme.textMuted, whiteSpace: 'nowrap' }}>
                        {t.assignee?.name ?? 'Unassigned'}
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 11, color: theme.textMuted, whiteSpace: 'nowrap' }}>
                        {t.sla_deadline ?? t.sla ?? '—'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <button
                          onClick={e => { e.stopPropagation(); navigate(`/tickets/${t.id}`) }}
                          style={{
                            padding: '4px 10px', fontSize: 12, fontWeight: 600,
                            color: theme.accent, border: `1px solid ${theme.borderAccent}`,
                            borderRadius: 6, background: theme.accentSoft, cursor: 'pointer',
                            transition: 'background 0.15s', whiteSpace: 'nowrap',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = theme.accentGlow}
                          onMouseLeave={e => e.currentTarget.style.background = theme.accentSoft}
                        >Detail</button>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>

        {/* ── Mobile cards ── */}
        <div className="flex flex-col md:hidden" style={{ minHeight: 200 }}>
          {loading
            ? Array(5).fill(0).map((_, i) => (
                <div key={i} style={{ padding: '14px 16px', borderTop: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ height: 14, background: theme.surfaceAlt, borderRadius: 6, width: '75%', animation: 'pulse 1.5s ease-in-out infinite' }} />
                  <div style={{ height: 11, background: theme.surfaceAlt, borderRadius: 6, width: '50%', animation: 'pulse 1.5s ease-in-out infinite' }} />
                </div>
              ))
            : tickets.map(t => (
                <TicketCard key={t.id} t={t} onClick={() => navigate(`/tickets/${t.id}`)} theme={theme} />
              ))
          }
        </div>

        {!loading && tickets.length === 0 && <EmptyState icon={Tag} message="Tidak ada tiket ditemukan" />}

        <Pagination
          currentPage={currentPage}
          lastPage={lastPage}
          total={total}
          perPage={PER_PAGE}
          onPageChange={handlePageChange}
          loading={loading}
          theme={theme}
        />
      </div>

      {/* pulse keyframes */}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>

      {showNew && (
        <NewTicketModal
          theme={theme}
          onClose={() => setShowNew(false)}
          onSubmit={() => { setShowNew(false); fetchTickets(1) }}
        />
      )}
    </div>
  )
}

export default TicketsPage