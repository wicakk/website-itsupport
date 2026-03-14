/**
 * AssetsPage.jsx — with Edit, Delete, and MoreHorizontal dropdown
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import QRCode from 'qrcode'
import {
  Plus, Globe, User, Shield, MoreHorizontal, Laptop, Printer, Network,
  Server, Monitor, Package, CheckCircle2, Wrench, AlertTriangle, X,
  QrCode, TrendingDown, CalendarClock, Download, Printer as PrintIcon,
  Calendar, Clock, Bell, CheckCheck, AlertCircle, Eye,
  BarChart3, RefreshCw, ClipboardList, Pencil, Trash2,
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
    borderRadius: 8,
    padding: '8px 12px',
    color: T.text,
    fontSize: 13,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  label: {
    color: T.textMuted,
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: 5,
    display: 'block',
  },
  sectionHeading: {
    color: T.text,
    fontWeight: 700,
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    paddingBottom: 10,
    borderBottom: `1px solid ${T.border}`,
    marginBottom: 14,
  },
  pill: (color) => ({
    background: `${color}18`,
    border: `1px solid ${color}35`,
    color,
    padding: '2px 10px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
  }),
  iconBtn: (color = T.textMuted, bg = 'rgba(255,255,255,0.04)') => ({
    width: 30, height: 30, borderRadius: 8,
    background: bg, border: `1px solid ${color}30`,
    color, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }),
  btn: (variant = 'primary') => {
    const variants = {
      primary: { background: T.accent,   border: 'none',                          color: '#fff'      },
      ghost:   { background: 'transparent', border: `1px solid ${T.border}`,      color: T.textMuted },
      warning: { background: `${T.warning}20`, border: `1px solid ${T.warning}40`, color: T.warning  },
      success: { background: `${T.success}18`, border: `1px solid ${T.success}35`, color: T.success  },
      danger:  { background: `${T.danger}18`,  border: `1px solid ${T.danger}35`,  color: T.danger   },
    }
    return {
      ...variants[variant],
      padding: '8px 18px', borderRadius: 8,
      fontWeight: 600, fontSize: 13, cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 7,
    }
  },
}

function calcSYD(cost, salvage, life) {
  const depreciable = cost - salvage
  const sumYears    = (life * (life + 1)) / 2
  let bookValue     = cost
  return Array.from({ length: life }, (_, i) => {
    const year  = i + 1
    const factor = (life - year + 1) / sumYears
    const dep   = depreciable * factor
    bookValue  -= dep
    return { year, factor: `${life - year + 1}/${sumYears}`, depreciation: dep, accumulated: cost - bookValue, bookValue: Math.max(bookValue, salvage) }
  })
}

const formatRp    = (n)    => Number(n).toLocaleString('id-ID', { maximumFractionDigits: 0 })
const isExpired   = (d)    => !!d && new Date(d) < new Date()
const isOverduePM = (pm)   => pm.status !== 'Selesai' && pm.next_date && new Date(pm.next_date) < new Date()
const countOverdue = (a)   => (a.pm_schedules ?? []).filter(isOverduePM).length

// ─── Modal shell ──────────────────────────────────────────────
const Modal = ({ onClose, children, maxWidth = 600 }) => (
  <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
    <div onClick={(e) => e.stopPropagation()} style={{ background: T.surface ?? '#13161f', border: `1px solid ${T.border}`, borderRadius: 18, padding: 26, width: '100%', maxWidth, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}>
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
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        width: '100%', padding: '7px 12px',
        background: 'transparent', border: 'none',
        borderRadius: 7, color: color ?? T.textMuted,
        fontSize: 12, cursor: 'pointer', textAlign: 'left',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {icon} {label}
    </button>
  )

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o) }}
        style={s.iconBtn()}
      >
        <MoreHorizontal size={13} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '110%', right: 0, zIndex: 999,
          background: T.surface ?? '#13161f',
          border: `1px solid ${T.border}`,
          borderRadius: 10, padding: 4, minWidth: 150,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}
          onClick={e => e.stopPropagation()}
        >
          {menuItem(<Pencil size={12} />, 'Edit Aset',    T.textMuted, () => onEdit(asset))}
          <div style={{ height: 1, background: T.border, margin: '4px 0' }} />
          {menuItem(<Trash2 size={12} />, 'Hapus Aset',  T.danger,    () => onDelete(asset))}
        </div>
      )}
    </div>
  )
}

// ─── QR Canvas ────────────────────────────────────────────────
const QRCanvas = ({ value, size = 200 }) => {
  const canvasRef = useRef(null)
  useEffect(() => {
    if (!canvasRef.current) return
    QRCode.toCanvas(canvasRef.current, value, { width: size, margin: 2, color: { dark: '#0f172a', light: '#ffffff' } })
  }, [value, size])
  return <canvas ref={canvasRef} style={{ borderRadius: 8 }} />
}

// ─── Tab Bar ──────────────────────────────────────────────────
const TABS = [
  { id: 'info', label: 'Info Aset',   icon: <Package size={13} /> },
  { id: 'qr',   label: 'QR Code',    icon: <QrCode size={13} /> },
  { id: 'dep',  label: 'Depresiasi', icon: <TrendingDown size={13} /> },
  { id: 'pm',   label: 'Jadwal PM',  icon: <CalendarClock size={13} /> },
]

const TabBar = ({ active, onChange }) => (
  <div style={{ display: 'flex', gap: 4, marginBottom: 22, borderBottom: `1px solid ${T.border}` }}>
    {TABS.map(({ id, label, icon }) => {
      const isActive = active === id
      return (
        <button key={id} onClick={() => onChange(id)} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 14px', borderRadius: '8px 8px 0 0', border: 'none',
          background: isActive ? `${T.accent}18` : 'transparent',
          color: isActive ? T.accent : T.textMuted,
          fontWeight: isActive ? 700 : 400,
          fontSize: 12, cursor: 'pointer',
          borderBottom: isActive ? `2px solid ${T.accent}` : '2px solid transparent',
        }}>
          {icon} {label}
        </button>
      )
    })}
  </div>
)

// ─── Info Tab ─────────────────────────────────────────────────
const InfoTab = ({ asset }) => {
  const fields = [
    ['Kategori',    asset.category],
    ['Status',      asset.status],
    ['Brand / Model', [asset.brand, asset.model].filter(Boolean).join(' ')],
    ['Lokasi',      asset.location],
    ['Pengguna',    asset.user || '—'],
    ['Garansi s/d', asset.warranty_expiry],
    ['Harga Beli',  asset.purchase_price ? `Rp ${formatRp(asset.purchase_price)}` : '—'],
    ['Tgl Beli',    asset.purchase_date || '—'],
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      {fields.map(([k, v]) => (
        <div key={k} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '10px 14px' }}>
          <div style={{ ...s.label, marginBottom: 4 }}>{k}</div>
          <div style={{ color: T.text, fontSize: 13, fontWeight: 600 }}>{v || '—'}</div>
        </div>
      ))}
      {asset.notes && (
        <div style={{ gridColumn: '1/-1', background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '10px 14px' }}>
          <div style={{ ...s.label, marginBottom: 4 }}>Catatan</div>
          <div style={{ color: T.textMuted, fontSize: 13 }}>{asset.notes}</div>
        </div>
      )}
    </div>
  )
}

// ─── QR Tab ───────────────────────────────────────────────────
const QRTab = ({ asset }) => {
  const qrValue = JSON.stringify({ id: asset.asset_number, name: asset.name, serial: asset.serial_number, loc: asset.location })

  const handlePrint = () => {
    const win = window.open('', '_blank')
    win.document.write(`<html><head><title>QR - ${asset.name}</title><style>body{font-family:monospace;text-align:center;padding:40px;}h2{margin:8px 0;font-size:16px;}p{color:#64748b;font-size:12px;margin:4px 0;}</style></head><body><h2>${asset.name}</h2><p>${asset.asset_number} · ${asset.serial_number ?? ''}</p><canvas id="qrc"></canvas><p>${asset.location ?? ''}</p><script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script><script>new QRCode(document.getElementById('qrc'),{text:'${qrValue.replace(/'/g, "\\'")}',width:200,height:200,colorDark:'#000',colorLight:'#fff'});setTimeout(()=>window.print(),600);</script></body></html>`)
    win.document.close()
  }

  const handleDownload = () => {
    const canvas = document.querySelector('#qr-preview canvas')
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `QR-${asset.asset_number}.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
      <div id="qr-preview" style={{ background: '#fff', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
        <QRCanvas value={qrValue} size={200} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#0f172a', fontWeight: 800, fontSize: 14, fontFamily: 'monospace' }}>{asset.asset_number}</div>
          <div style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>{asset.name}</div>
          <div style={{ color: '#94a3b8', fontSize: 10 }}>{asset.serial_number} · {asset.location}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={handlePrint} style={s.btn('primary')}><PrintIcon size={14} /> Print QR</button>
        <button onClick={handleDownload} style={s.btn('ghost')}><Download size={14} /> Download PNG</button>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 16px', width: '100%', fontSize: 11, color: T.textMuted, fontFamily: 'monospace', wordBreak: 'break-all' }}>
        <div style={{ color: T.textDim, marginBottom: 4 }}>Data encoded:</div>
        {qrValue}
      </div>
    </div>
  )
}

// ─── Dep Tab ──────────────────────────────────────────────────
const DepTab = ({ asset }) => {
  const [form, setForm] = useState({ cost: asset.purchase_price ?? '', salvage: '', life: '' })
  const [rows, setRows] = useState([])
  const handleCalc = () => {
    const { cost, salvage, life } = form
    if (!cost || !salvage || !life) return
    setRows(calcSYD(+cost, +salvage, +life))
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={s.sectionHeading}><TrendingDown size={14} color={T.warning} /> Sum of Years Digits (SYD)</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        {[['Harga Perolehan (Rp)', 'cost', 'contoh: 15000000'], ['Nilai Sisa (Rp)', 'salvage', 'contoh: 1500000'], ['Masa Manfaat (Thn)', 'life', 'contoh: 5']].map(([label, key, ph]) => (
          <div key={key}>
            <label style={s.label}>{label}</label>
            <input style={s.input} type="number" placeholder={ph} value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} />
          </div>
        ))}
      </div>
      <button onClick={handleCalc} style={{ ...s.btn('warning'), alignSelf: 'flex-start' }}><BarChart3 size={14} /> Hitung Depresiasi</button>
      {rows.length > 0 && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {[['Total Depresiasi', `Rp ${formatRp(+form.cost - +form.salvage)}`, T.danger], ['Nilai Sisa', `Rp ${formatRp(+form.salvage)}`, T.success], ['Depresiasi Thn 1', `Rp ${formatRp(rows[0]?.depreciation)}`, T.accent]].map(([k, v, c]) => (
              <div key={k} style={{ background: `${c}12`, border: `1px solid ${c}25`, borderRadius: 10, padding: '10px 14px' }}>
                <div style={{ ...s.label, color: `${c}aa` }}>{k}</div>
                <div style={{ color: c, fontWeight: 700, fontSize: 14 }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr style={{ borderBottom: `1px solid ${T.border}` }}>{['Tahun', 'Faktor', 'Depresiasi (Rp)', 'Akumulasi (Rp)', 'Nilai Buku (Rp)'].map((h) => <th key={h} style={{ padding: '8px 10px', color: T.textMuted, textAlign: 'right', fontWeight: 600 }}>{h}</th>)}</tr></thead>
              <tbody>{rows.map((r, i) => <tr key={i} style={{ borderBottom: `1px solid ${T.border}30`, background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}><td style={{ padding: '8px 10px', color: T.accent, fontWeight: 700, textAlign: 'right' }}>{r.year}</td><td style={{ padding: '8px 10px', color: T.textMuted, textAlign: 'right', fontFamily: 'monospace' }}>{r.factor}</td><td style={{ padding: '8px 10px', color: T.danger, textAlign: 'right' }}>{formatRp(r.depreciation)}</td><td style={{ padding: '8px 10px', color: T.textDim, textAlign: 'right' }}>{formatRp(r.accumulated)}</td><td style={{ padding: '8px 10px', color: T.text, fontWeight: 600, textAlign: 'right' }}>{formatRp(r.bookValue)}</td></tr>)}</tbody>
            </table>
          </div>
        </>
      )}
      {rows.length === 0 && <div style={{ textAlign: 'center', color: T.textMuted, fontSize: 12, padding: '30px 0', border: `1px dashed ${T.border}`, borderRadius: 10 }}>Isi harga perolehan, nilai sisa, dan masa manfaat lalu klik Hitung</div>}
    </div>
  )
}

// ─── PM Tab ───────────────────────────────────────────────────
const PMTab = ({ asset, onPMSaved }) => {
  const { authFetch } = useAuth()
  const [pmList, setPmList] = useState(asset.pm_schedules ?? [])
  const [form, setForm]     = useState({ title: '', interval: 'Bulanan', next_date: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const handleAdd = async () => {
    if (!form.title || !form.next_date) { setError('Judul dan tanggal wajib diisi'); return }
    setSaving(true); setError('')
    try {
      const res  = await authFetch(`/api/assets/${asset.id}/pm`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      setPmList((p) => [...p, data.data ?? data])
      setForm({ title: '', interval: 'Bulanan', next_date: '', notes: '' })
      onPMSaved?.()
    } catch { setError('Gagal menyimpan jadwal') }
    finally  { setSaving(false) }
  }

  const handleComplete = async (pmId) => {
    try {
      await authFetch(`/api/assets/${asset.id}/pm/${pmId}/complete`, { method: 'PATCH' })
      setPmList((p) => p.map((x) => x.id === pmId ? { ...x, status: 'Selesai', last_done: new Date().toISOString().slice(0, 10) } : x))
    } catch (e) { console.error(e) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={s.sectionHeading}><CalendarClock size={14} color={T.accent} /> Tambah Jadwal Maintenance</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={s.label}>Judul Maintenance</label>
          <input style={s.input} placeholder="cth: Cleaning & Thermal Paste" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
        </div>
        <div>
          <label style={s.label}>Interval</label>
          <select style={s.input} value={form.interval} onChange={(e) => setForm((f) => ({ ...f, interval: e.target.value }))}>
            {PM_INTERVALS.map((i) => <option key={i}>{i}</option>)}
          </select>
        </div>
        <div>
          <label style={s.label}>Tanggal Pertama</label>
          <input type="date" style={s.input} value={form.next_date} onChange={(e) => setForm((f) => ({ ...f, next_date: e.target.value }))} />
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={s.label}>Catatan (opsional)</label>
          <input style={s.input} placeholder="Instruksi khusus..." value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
        </div>
      </div>
      {error && <div style={{ color: T.danger, fontSize: 12, display: 'flex', gap: 6, alignItems: 'center' }}><AlertCircle size={12} /> {error}</div>}
      <button onClick={handleAdd} disabled={saving} style={{ ...s.btn('primary'), alignSelf: 'flex-start', opacity: saving ? 0.7 : 1 }}>
        <Plus size={14} /> {saving ? 'Menyimpan...' : 'Tambah Jadwal'}
      </button>
      <div style={{ ...s.sectionHeading, marginTop: 8 }}><ClipboardList size={14} color={T.textMuted} /> Jadwal Terdaftar ({pmList.length})</div>
      {pmList.length === 0
        ? <div style={{ textAlign: 'center', color: T.textMuted, fontSize: 12, padding: '24px 0', border: `1px dashed ${T.border}`, borderRadius: 10 }}>Belum ada jadwal PM untuk aset ini</div>
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pmList.map((pm) => {
              const overdue = isOverduePM(pm)
              const done    = pm.status === 'Selesai'
              const color   = done ? T.success : overdue ? T.danger : T.warning
              const statusLabel = done ? 'Selesai' : overdue ? 'Terlambat' : 'Terjadwal'
              return (
                <div key={pm.id ?? pm.title} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${overdue && !done ? `${T.danger}40` : T.border}`, borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: `${color}18`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {done ? <CheckCheck size={16} /> : overdue ? <AlertCircle size={16} /> : <Bell size={16} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: T.text, fontWeight: 600, fontSize: 13 }}>{pm.title}</div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
                      <span style={{ color: T.textMuted, fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}><RefreshCw size={10} /> {pm.interval}</span>
                      <span style={{ color: T.textMuted, fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={10} /> {pm.next_date}</span>
                      {pm.last_done && <span style={{ color: T.textMuted, fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={10} /> Terakhir: {pm.last_done}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={s.pill(color)}>{statusLabel}</span>
                    {!done && <button onClick={() => handleComplete(pm.id)} style={s.btn('success')}><CheckCheck size={11} /> Selesai</button>}
                  </div>
                </div>
              )
            })}
          </div>
      }
    </div>
  )
}

// ─── Detail Modal ─────────────────────────────────────────────
const DetailModal = ({ asset, onClose, onPMSaved }) => {
  const [tab, setTab] = useState('info')
  return (
    <Modal onClose={onClose} maxWidth={680}>
      <ModalHeader title={asset.name} subtitle={`${asset.asset_number} · ${asset.serial_number}`} onClose={onClose} />
      <TabBar active={tab} onChange={setTab} />
      {tab === 'info' && <InfoTab  asset={asset} />}
      {tab === 'qr'   && <QRTab   asset={asset} />}
      {tab === 'dep'  && <DepTab  asset={asset} />}
      {tab === 'pm'   && <PMTab   asset={asset} onPMSaved={onPMSaved} />}
    </Modal>
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

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })) }

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
        method:  isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
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
          <input style={{ ...s.input, ...(errors.name ? { borderColor: T.danger } : {}) }} placeholder="cth: Dell Latitude 5420" value={form.name} onChange={(e) => set('name', e.target.value)} />
        </Field>
        <Field label="Kategori">
          <select style={s.input} value={form.category} onChange={(e) => set('category', e.target.value)}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Status">
          <select style={s.input} value={form.status} onChange={(e) => set('status', e.target.value)}>
            {STATUSES.map((st) => <option key={st}>{st}</option>)}
          </select>
        </Field>
        <Field label="Brand">
          <input style={s.input} placeholder="Dell" value={form.brand} onChange={(e) => set('brand', e.target.value)} />
        </Field>
        <Field label="Model">
          <input style={s.input} placeholder="Latitude 5420" value={form.model} onChange={(e) => set('model', e.target.value)} />
        </Field>
        <Field label="Serial Number" error={errors.serial_number}>
          <input style={{ ...s.input, ...(errors.serial_number ? { borderColor: T.danger } : {}) }} placeholder="SN-XXXXXXXX" value={form.serial_number} onChange={(e) => set('serial_number', e.target.value)} />
        </Field>
        <Field label="Lokasi" error={errors.location}>
          <input style={{ ...s.input, ...(errors.location ? { borderColor: T.danger } : {}) }} placeholder="Ruang IT Lt. 2" value={form.location} onChange={(e) => set('location', e.target.value)} />
        </Field>
        <Field label="Pengguna">
          <input style={s.input} placeholder="(opsional)" value={form.user} onChange={(e) => set('user', e.target.value)} />
        </Field>
        <Field label="Tgl Beli">
          <input type="date" style={s.input} value={form.purchase_date} onChange={(e) => set('purchase_date', e.target.value)} />
        </Field>
        <Field label="Harga Beli (Rp)">
          <input type="number" style={s.input} placeholder="15000000" value={form.purchase_price} onChange={(e) => set('purchase_price', e.target.value)} />
        </Field>
        <Field label="Garansi s/d" span>
          <input type="date" style={s.input} value={form.warranty_expiry} onChange={(e) => set('warranty_expiry', e.target.value)} />
        </Field>
        <Field label="Catatan" span>
          <input style={s.input} placeholder="(opsional)" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
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

// ─── Asset Card ───────────────────────────────────────────────
const AssetCard = ({ asset, onDetail, onEdit, onDelete }) => {
  const cfg     = CAT_CFG[asset.category] ?? { icon: <Package size={20} />, color: T.accent }
  const sCfg    = ASSET_STATUS_CFG[asset.status]
  const expired = isExpired(asset.warranty_expiry)
  const overdue = countOverdue(asset)
  

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
        <div style={{ display: 'flex', gap: 6, marginLeft: 8, position: 'relative', zIndex: 10 }}>
          <button onClick={() => onDetail(asset)} title="Detail / QR / PM" style={s.iconBtn(T.accent, `${T.accent}15`)}>
            <Eye size={13} />
          </button>
          <MoreDropdown asset={asset} onEdit={onEdit} onDelete={onDelete} />

        </div>
      </div>
    </Card>
  )
}

// ─── Main Page ────────────────────────────────────────────────
const AssetsPage = () => {
  const { authFetch } = useAuth()
  const [assets,       setAssets]       = useState([])
  const [loading,      setLoading]      = useState(true)
  const [showAdd,      setShowAdd]      = useState(false)
  const [editAsset,    setEditAsset]    = useState(null)
  const [deleteAsset,  setDeleteAsset]  = useState(null)
  const [deleting,     setDeleting]     = useState(false)
  const [detailAsset,  setDetailAsset]  = useState(null)

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
      setAssets((p) => p.filter((a) => a.id !== deleteAsset.id))
      setDeleteAsset(null)
    } catch { console.error('Gagal menghapus aset') }
    finally  { setDeleting(false) }
  }

  const handleSaved = (saved) => {
    setAssets((p) => {
      const exists = p.find((a) => a.id === saved.id)
      return exists ? p.map((a) => a.id === saved.id ? saved : a) : [saved, ...p]
    })
  }

  const { query, setQuery, results } = useSearch(assets, ['name', 'asset_number', 'serial_number', 'brand'])
  const totalOverdue = assets.reduce((acc, a) => acc + countOverdue(a), 0)

  if (loading) return <div style={{ color: T.textMuted }}>Memuat data aset...</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {(showAdd || editAsset) && (
        <AssetFormModal
          editAsset={editAsset}
          onClose={() => { setShowAdd(false); setEditAsset(null) }}
          onSaved={handleSaved}
        />
      )}
      {deleteAsset && (
        <ConfirmDeleteModal
          asset={deleteAsset}
          onClose={() => setDeleteAsset(null)}
          onConfirm={handleDelete}
          deleting={deleting}
        />
      )}
      {detailAsset && (
        <DetailModal
          asset={detailAsset}
          onClose={() => setDetailAsset(null)}
          onPMSaved={fetchAssets}
        />
      )}

      <PageHeader
        title="Asset Management"
        subtitle={`${assets.length} aset terdaftar`}
        action={<PrimaryButton icon={Plus} onClick={() => setShowAdd(true)}>Tambah Aset</PrimaryButton>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
        <StatCard label="Total Aset"      value={assets.length}                                               icon={Package}       iconColor={T.accent}  />
        <StatCard label="Active"          value={assets.filter((a) => a.status === 'Active').length}          icon={CheckCircle2}  iconColor={T.success} />
        <StatCard label="Maintenance"     value={assets.filter((a) => a.status === 'Maintenance').length}     icon={Wrench}        iconColor={T.warning} />
        <StatCard label="Garansi Expired" value={assets.filter((a) => isExpired(a.warranty_expiry)).length}   icon={AlertTriangle} iconColor={T.danger}  />
        <StatCard label="PM Terlambat"    value={totalOverdue}                                                 icon={CalendarClock} iconColor={T.danger}  />
      </div>

      <SearchBar value={query} onChange={setQuery} placeholder="Cari nama, serial number, brand..." />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {results.map((a) => (
          <AssetCard
            key={a.id}
            asset={a}
            onDetail={setDetailAsset}
            onEdit={(asset) => setEditAsset(asset)}
            onDelete={(asset) => setDeleteAsset(asset)}
          />
        ))}
        {results.length === 0 && <EmptyState icon={Package} message="Tidak ada aset ditemukan" />}
      </div>
    </div>
  )
}

export default AssetsPage