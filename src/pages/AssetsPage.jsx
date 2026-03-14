/**
 * AssetsPage.jsx — navigates to /assets/:id for detail
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import QRCode from 'qrcode'
import {
  Plus, Globe, User, Shield, MoreHorizontal, Laptop, Printer, Network,
  Server, Monitor, Package, CheckCircle2, Wrench, AlertTriangle, X,
  QrCode, TrendingDown, CalendarClock, Eye,
  BarChart3, RefreshCw, ClipboardList, Pencil, Trash2, Bell,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import { T, ASSET_STATUS_CFG } from '../theme'
import { Card, Badge, PageHeader, SearchBar, PrimaryButton, StatCard, EmptyState } from '../components/ui'
import { useAuth } from '../context/AppContext'
import useSearch from '../hooks/useSearch'

const CATEGORIES   = ['Laptop', 'Desktop', 'Printer', 'Network', 'Server', 'Phone', 'Monitor', 'Others']
const STATUSES     = ['Active', 'Maintenance', 'Inactive', 'Disposed']
const PM_INTERVALS = ['Mingguan', 'Bulanan', '3 Bulan', '6 Bulan', 'Tahunan']

const CAT_CFG = {
  Laptop:  { icon: <Laptop  size={20} />, color: '#3B8BFF' },
  Desktop: { icon: <Monitor size={20} />, color: '#10B981' },
  Printer: { icon: <Printer size={20} />, color: '#8B5CF6' },
  Network: { icon: <Network size={20} />, color: '#06B6D4' },
  Server:  { icon: <Server  size={20} />, color: '#F59E0B' },
  Phone:   { icon: <Package size={20} />, color: '#EC4899' },
  Monitor: { icon: <Monitor size={20} />, color: '#14B8A6' },
  Others:  { icon: <Package size={20} />, color: '#94A3B8' },
}

const s = {
  input: {
    background: 'rgba(255,255,255,0.05)',
    border: `1px solid ${T.border}`,
    borderRadius: 8, padding: '8px 12px',
    color: T.text, fontSize: 13, outline: 'none',
    width: '100%', boxSizing: 'border-box',
  },
  label: {
    color: T.textMuted, fontSize: 11, fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: '0.05em',
    marginBottom: 5, display: 'block',
  },
  pill: (color) => ({
    background: `${color}18`, border: `1px solid ${color}35`,
    color, padding: '2px 10px', borderRadius: 20,
    fontSize: 11, fontWeight: 600,
    display: 'inline-flex', alignItems: 'center', gap: 4,
  }),
  iconBtn: (color = T.textMuted, bg = 'rgba(255,255,255,0.04)') => ({
    width: 30, height: 30, borderRadius: 8,
    background: bg, border: `1px solid ${color}30`,
    color, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }),
  btn: (variant = 'primary') => {
    const v = {
      primary: { background: T.accent,         border: 'none',                           color: '#fff'      },
      ghost:   { background: 'transparent',     border: `1px solid ${T.border}`,          color: T.textMuted },
      warning: { background: `${T.warning}20`,  border: `1px solid ${T.warning}40`,       color: T.warning   },
      success: { background: `${T.success}18`,  border: `1px solid ${T.success}35`,       color: T.success   },
      danger:  { background: `${T.danger}18`,   border: `1px solid ${T.danger}35`,        color: T.danger    },
    }
    return { ...v[variant], padding: '8px 18px', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }
  },
}

const formatRp    = (n)  => Number(n).toLocaleString('id-ID', { maximumFractionDigits: 0 })
const isExpired   = (d)  => !!d && new Date(d) < new Date()
const isOverduePM = (pm) => pm.status !== 'Selesai' && pm.next_date && new Date(pm.next_date) < new Date()
const countOverdue = (a) => (a.pm_schedules ?? []).filter(isOverduePM).length

// ─── Modal shell ──────────────────────────────────────────────
const Modal = ({ onClose, children, maxWidth = 600 }) => (
  <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
    <div onClick={e => e.stopPropagation()} style={{ background: T.surface ?? '#13161f', border: `1px solid ${T.border}`, borderRadius: 18, padding: 26, width: '100%', maxWidth, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}>
      {children}
    </div>
  </div>
)

const ModalHeader = ({ title, subtitle, onClose }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22 }}>
    <div>
      <div style={{ color: T.text, fontWeight: 700, fontSize: 16 }}>{title}</div>
      {subtitle && <div style={{ color: T.textMuted, fontSize: 12, marginTop: 3 }}>{subtitle}</div>}
    </div>
    <button onClick={onClose} style={{ ...s.iconBtn(), width: 32, height: 32 }}><X size={14} /></button>
  </div>
)

const Field = ({ label, error, children, span }) => (
  <div style={span ? { gridColumn: '1 / -1' } : {}}>
    <label style={s.label}>{label}</label>
    {children}
    {error && <div style={{ color: T.danger, fontSize: 11, marginTop: 3 }}>{error}</div>}
  </div>
)

// ─── Confirm Delete Modal ─────────────────────────────────────
const ConfirmDeleteModal = ({ asset, onClose, onConfirm, deleting }) => (
  <Modal onClose={onClose} maxWidth={420}>
    <ModalHeader title="Hapus Aset" onClose={onClose} />
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: `${T.danger}10`, border: `1px solid ${T.danger}30`, borderRadius: 10, padding: '12px 16px' }}>
        <div style={{ color: T.danger, fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Konfirmasi Penghapusan</div>
        <div style={{ color: T.textMuted, fontSize: 12, lineHeight: 1.6 }}>
          Aset <strong style={{ color: T.text }}>{asset.name}</strong> ({asset.asset_number}) akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={s.btn('ghost')}>Batal</button>
        <button onClick={onConfirm} disabled={deleting} style={{ ...s.btn('danger'), opacity: deleting ? 0.7 : 1 }}>
          <Trash2 size={13} /> {deleting ? 'Menghapus...' : 'Hapus Aset'}
        </button>
      </div>
    </div>
  </Modal>
)

// ─── More Dropdown ────────────────────────────────────────────
const MoreDropdown = ({ asset, onEdit, onDelete }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const menuItem = (icon, label, color, onClick) => (
    <button
      onClick={() => { onClick(); setOpen(false) }}
      style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 12px', background: 'transparent', border: 'none', borderRadius: 7, color: color ?? T.textMuted, fontSize: 12, cursor: 'pointer', textAlign: 'left' }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {icon} {label}
    </button>
  )

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={e => { e.stopPropagation(); setOpen(o => !o) }} style={s.iconBtn()}>
        <MoreHorizontal size={13} />
      </button>
      {open && (
        <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: '110%', right: 0, zIndex: 999, background: T.surface ?? '#13161f', border: `1px solid ${T.border}`, borderRadius: 10, padding: 4, minWidth: 150, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
          {menuItem(<Pencil size={12} />, 'Edit Aset',   T.textMuted, () => onEdit(asset))}
          <div style={{ height: 1, background: T.border, margin: '4px 0' }} />
          {menuItem(<Trash2 size={12} />, 'Hapus Aset', T.danger,    () => onDelete(asset))}
        </div>
      )}
    </div>
  )
}

// ─── Add / Edit Asset Modal ───────────────────────────────────
const EMPTY_FORM = {
  name: '', category: 'Laptop', brand: '', model: '',
  serial_number: '', location: '', user: '',
  warranty_expiry: '', status: 'Active',
  purchase_date: '', purchase_price: '', notes: '',
}

const AssetFormModal = ({ onClose, onSaved, editAsset = null }) => {
  const { authFetch }       = useAuth()
  const isEdit              = !!editAsset
  const [form, setForm]     = useState(isEdit ? { ...EMPTY_FORM, ...editAsset } : EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: undefined })) }

  const validate = () => {
    const e = {}
    if (!form.name.trim())          e.name          = 'Wajib diisi'
    if (!form.serial_number.trim()) e.serial_number = 'Wajib diisi'
    if (!form.location.trim())      e.location      = 'Wajib diisi'
    return e
  }

  const handleSubmit = async () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setSaving(true)
    try {
      const res = await authFetch(isEdit ? `/api/assets/${editAsset.id}` : '/api/assets', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Gagal menyimpan')
      const data = await res.json()
      onSaved(data.data ?? data.asset ?? data)
      onClose()
    } catch (err) {
      setErrors({ _global: err.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal onClose={onClose} maxWidth={560}>
      <ModalHeader title={isEdit ? 'Edit Aset' : 'Tambah Aset Baru'} subtitle={isEdit ? `${editAsset.asset_number} · ${editAsset.serial_number}` : 'Isi detail aset yang akan didaftarkan'} onClose={onClose} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="Nama Aset" error={errors.name} span>
          <input style={{ ...s.input, ...(errors.name ? { borderColor: T.danger } : {}) }} placeholder="cth: Dell Latitude 5420" value={form.name} onChange={e => set('name', e.target.value)} />
        </Field>
        <Field label="Kategori">
          <select style={s.input} value={form.category} onChange={e => set('category', e.target.value)}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Status">
          <select style={s.input} value={form.status} onChange={e => set('status', e.target.value)}>
            {STATUSES.map(st => <option key={st}>{st}</option>)}
          </select>
        </Field>
        <Field label="Brand">
          <input style={s.input} placeholder="Dell" value={form.brand} onChange={e => set('brand', e.target.value)} />
        </Field>
        <Field label="Model">
          <input style={s.input} placeholder="Latitude 5420" value={form.model} onChange={e => set('model', e.target.value)} />
        </Field>
        <Field label="Serial Number" error={errors.serial_number}>
          <input style={{ ...s.input, ...(errors.serial_number ? { borderColor: T.danger } : {}) }} placeholder="SN-XXXXXXXX" value={form.serial_number} onChange={e => set('serial_number', e.target.value)} />
        </Field>
        <Field label="Lokasi" error={errors.location}>
          <input style={{ ...s.input, ...(errors.location ? { borderColor: T.danger } : {}) }} placeholder="Ruang IT Lt. 2" value={form.location} onChange={e => set('location', e.target.value)} />
        </Field>
        <Field label="Pengguna">
          <input style={s.input} placeholder="(opsional)" value={form.user} onChange={e => set('user', e.target.value)} />
        </Field>
        <Field label="Tgl Beli">
          <input type="date" style={s.input} value={form.purchase_date} onChange={e => set('purchase_date', e.target.value)} />
        </Field>
        <Field label="Harga Beli (Rp)">
          <input type="number" style={s.input} placeholder="15000000" value={form.purchase_price} onChange={e => set('purchase_price', e.target.value)} />
        </Field>
        <Field label="Garansi s/d" span>
          <input type="date" style={s.input} value={form.warranty_expiry} onChange={e => set('warranty_expiry', e.target.value)} />
        </Field>
        <Field label="Catatan" span>
          <input style={s.input} placeholder="(opsional)" value={form.notes} onChange={e => set('notes', e.target.value)} />
        </Field>
      </div>
      {errors._global && (
        <div style={{ marginTop: 12, padding: '8px 12px', background: `${T.danger}18`, border: `1px solid ${T.danger}40`, borderRadius: 8, color: T.danger, fontSize: 12 }}>
          {errors._global}
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
        <button onClick={onClose} style={s.btn('ghost')}>Batal</button>
        <button onClick={handleSubmit} disabled={saving} style={{ ...s.btn('primary'), opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Simpan Aset'}
        </button>
      </div>
    </Modal>
  )
}


// ─── Pagination ───────────────────────────────────────────────
const Pagination = ({ currentPage, lastPage, total, perPage, onPageChange }) => {
  if (total === 0) return null

  const getPages = () => {
    if (lastPage <= 1) return [1]
    const delta = 2
    const left  = Math.max(2, currentPage - delta)
    const right = Math.min(lastPage - 1, currentPage + delta)
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

  const base    = { height: 32, minWidth: 32, padding: '0 10px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, transition: 'all 0.15s' }
  const active  = { ...base, background: T.accent, border: 'none', color: '#fff', boxShadow: `0 0 12px ${T.accent}40` }
  const normal  = { ...base, background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`, color: T.textMuted }
  const disabledStyle = { ...base, background: 'transparent', border: `1px solid ${T.border}30`, color: T.border, cursor: 'not-allowed' }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 4px', flexWrap: 'wrap', gap: 8 }}>
      <span style={{ color: T.textMuted, fontSize: 12 }}>
        Menampilkan{' '}
        <span style={{ color: T.text, fontWeight: 600 }}>{from}–{to}</span>{' '}
        dari <span style={{ color: T.text, fontWeight: 600 }}>{total}</span> aset
      </span>

      {lastPage > 1 && (
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            style={currentPage <= 1 ? disabledStyle : normal}
          >
            <ChevronLeft size={13} /> Prev
          </button>

          {getPages().map((p, i) =>
            p === '...'
              ? <span key={`d${i}`} style={{ color: T.border, padding: '0 4px', fontSize: 12 }}>···</span>
              : <button key={p} onClick={() => onPageChange(p)} style={p === currentPage ? active : normal}>{p}</button>
          )}

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= lastPage}
            style={currentPage >= lastPage ? disabledStyle : normal}
          >
            Next <ChevronRight size={13} />
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Asset Card ───────────────────────────────────────────────
const AssetCard = ({ asset, onEdit, onDelete }) => {
  const navigate = useNavigate()
  const cfg      = CAT_CFG[asset.category] ?? { icon: <Package size={20} />, color: T.accent }
  const sCfg     = ASSET_STATUS_CFG[asset.status]
  const expired  = isExpired(asset.warranty_expiry)
  const overdue  = countOverdue(asset)

  return (
    <Card hover style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: `${cfg.color}12`, border: `1px solid ${cfg.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: cfg.color }}>
          {cfg.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ color: T.textDim, fontSize: 10, fontFamily: 'monospace' }}>{asset.asset_number}</span>
            <Badge label={asset.status} cfg={sCfg} />
            <span style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.border}`, color: T.textMuted, padding: '1px 8px', borderRadius: 20, fontSize: 10 }}>{asset.category}</span>
            {overdue > 0 && <span style={s.pill(T.danger)}><Bell size={9} /> PM Terlambat {overdue}</span>}
          </div>
          <div style={{ color: T.text, fontWeight: 600, fontSize: 14 }}>{asset.name}</div>
          <div style={{ color: T.textDim, fontSize: 11, marginTop: 2 }}>S/N: {asset.serial_number} · {asset.brand} {asset.model}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, textAlign: 'right' }}>
          {[[Globe, asset.location, false], [User, asset.user || 'Unassigned', false], [Shield, asset.warranty_expiry, expired]].map(([Ic, val, warn], i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 5, color: warn ? T.danger : T.textMuted, fontSize: 11 }}>
              <Ic size={10} /> {val || '—'}
            </div>
          ))}
        </div>

        {/* Action buttons — stop propagation to avoid any parent click */}
        <div style={{ display: 'flex', gap: 6, marginLeft: 8, flexShrink: 0 }}>
          {/* Eye — navigate to detail */}
          <button
            onClick={() => navigate(`/assets/${asset.id}`)}
            title="Lihat Detail"
            style={s.iconBtn(T.accent, `${T.accent}15`)}
          >
            <Eye size={13} />
          </button>

          {/* Dropdown: Edit + Hapus */}
          <MoreDropdown asset={asset} onEdit={onEdit} onDelete={onDelete} />
        </div>
      </div>
    </Card>
  )
}

// ─── Main Page ────────────────────────────────────────────────
const AssetsPage = () => {
  const { authFetch } = useAuth()
  const [assets,      setAssets]      = useState([])
  const [loading,     setLoading]     = useState(true)
  const [showAdd,     setShowAdd]     = useState(false)
  const [editAsset,   setEditAsset]   = useState(null)
  const [deleteAsset, setDeleteAsset] = useState(null)
  const [deleting,    setDeleting]    = useState(false)

  const fetchAssets = useCallback(async () => {
    try {
      const res  = await authFetch('/api/assets')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setAssets(data.data ?? data)
    } catch { console.error('Gagal memuat assets') }
    finally  { setLoading(false) }
  }, [authFetch])

  useEffect(() => { fetchAssets() }, [fetchAssets])

  const handleDelete = async () => {
    if (!deleteAsset) return
    setDeleting(true)
    try {
      const res = await authFetch(`/api/assets/${deleteAsset.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setAssets(p => p.filter(a => a.id !== deleteAsset.id))
      setDeleteAsset(null)
    } catch { console.error('Gagal menghapus aset') }
    finally  { setDeleting(false) }
  }

  const handleSaved = (saved) => {
    setAssets(p => {
      const exists = p.find(a => a.id === saved.id)
      return exists ? p.map(a => a.id === saved.id ? saved : a) : [saved, ...p]
    })
  }

  const PER_PAGE = 5
  const [currentPage, setCurrentPage] = useState(1)

  const { query, setQuery, results } = useSearch(assets, ['name', 'asset_number', 'serial_number', 'brand'])
  const totalOverdue = assets.reduce((acc, a) => acc + countOverdue(a), 0)

  // Reset page when search changes
  useEffect(() => { setCurrentPage(1) }, [query])

  const lastPage   = Math.max(1, Math.ceil(results.length / PER_PAGE))
  const paginated  = results.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE)

  if (loading) return <div style={{ color: T.textMuted }}>Memuat data aset...</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {(showAdd || editAsset) && (
        <AssetFormModal editAsset={editAsset} onClose={() => { setShowAdd(false); setEditAsset(null) }} onSaved={handleSaved} />
      )}
      {deleteAsset && (
        <ConfirmDeleteModal asset={deleteAsset} onClose={() => setDeleteAsset(null)} onConfirm={handleDelete} deleting={deleting} />
      )}

      <PageHeader
        title="Asset Management"
        subtitle={`${assets.length} aset terdaftar`}
        action={<PrimaryButton icon={Plus} onClick={() => setShowAdd(true)}>Tambah Aset</PrimaryButton>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
        <StatCard label="Total Aset"      value={assets.length}                                             icon={Package}       iconColor={T.accent}  />
        <StatCard label="Active"          value={assets.filter(a => a.status === 'Active').length}         icon={CheckCircle2}  iconColor={T.success} />
        <StatCard label="Maintenance"     value={assets.filter(a => a.status === 'Maintenance').length}    icon={Wrench}        iconColor={T.warning} />
        <StatCard label="Garansi Expired" value={assets.filter(a => isExpired(a.warranty_expiry)).length}  icon={AlertTriangle} iconColor={T.danger}  />
        <StatCard label="PM Terlambat"    value={totalOverdue}                                               icon={CalendarClock} iconColor={T.danger}  />
      </div>

      <SearchBar value={query} onChange={setQuery} placeholder="Cari nama, serial number, brand..." />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {paginated.map(a => (
          <AssetCard
            key={a.id}
            asset={a}
            onEdit={asset => setEditAsset(asset)}
            onDelete={asset => setDeleteAsset(asset)}
          />
        ))}
        {results.length === 0 && <EmptyState icon={Package} message="Tidak ada aset ditemukan" />}
        <Pagination
          currentPage={currentPage}
          lastPage={lastPage}
          total={results.length}
          perPage={PER_PAGE}
          onPageChange={(page) => {
            setCurrentPage(page)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        />
      </div>
    </div>
  )
}

export default AssetsPage