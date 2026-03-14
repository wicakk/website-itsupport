import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import QRCode from 'qrcode'
import {
  ArrowLeft, RefreshCw, Package, Laptop, Printer, Network,
  Server, Monitor, Globe, User, Shield, QrCode, TrendingDown,
  CalendarClock, Download, Printer as PrintIcon, Calendar, Clock,
  Bell, CheckCheck, AlertCircle, BarChart3, ClipboardList, Plus,
  Pencil, Trash2, X, AlertTriangle,
} from 'lucide-react'
import { ASSET_STATUS_CFG } from '../theme'
import { Badge } from '../components/ui'
import { useAuth } from '../context/AppContext'

// ─── Constants ────────────────────────────────────────────────
const CATEGORIES   = ['Laptop', 'Desktop', 'Printer', 'Network', 'Server', 'Phone', 'Monitor', 'Others']
const STATUSES     = ['Active', 'Maintenance', 'Inactive', 'Disposed']
const PM_INTERVALS = ['Mingguan', 'Bulanan', '3 Bulan', '6 Bulan', 'Tahunan']

const CAT_CFG = {
  Laptop:  { icon: <Laptop  size={22} />, color: 'text-blue-400',   bg: 'bg-blue-400/10',   border: 'border-blue-400/20'   },
  Desktop: { icon: <Monitor size={22} />, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
  Printer: { icon: <Printer size={22} />, color: 'text-violet-400',  bg: 'bg-violet-400/10',  border: 'border-violet-400/20'  },
  Network: { icon: <Network size={22} />, color: 'text-cyan-400',    bg: 'bg-cyan-400/10',    border: 'border-cyan-400/20'    },
  Server:  { icon: <Server  size={22} />, color: 'text-amber-400',   bg: 'bg-amber-400/10',   border: 'border-amber-400/20'   },
  Phone:   { icon: <Package size={22} />, color: 'text-pink-400',    bg: 'bg-pink-400/10',    border: 'border-pink-400/20'    },
  Monitor: { icon: <Monitor size={22} />, color: 'text-teal-400',    bg: 'bg-teal-400/10',    border: 'border-teal-400/20'    },
  Others:  { icon: <Package size={22} />, color: 'text-slate-400',   bg: 'bg-slate-400/10',   border: 'border-slate-400/20'   },
}

// ─── Helpers ──────────────────────────────────────────────────
const formatRp    = (n)  => Number(n).toLocaleString('id-ID', { maximumFractionDigits: 0 })
const isExpired   = (d)  => !!d && new Date(d) < new Date()
const isOverduePM = (pm) => pm.status !== 'Selesai' && pm.next_date && new Date(pm.next_date) < new Date()

function calcSYD(cost, salvage, life) {
  const depreciable = cost - salvage
  const sumYears    = (life * (life + 1)) / 2
  let bookValue     = cost
  return Array.from({ length: life }, (_, i) => {
    const year   = i + 1
    const factor = (life - year + 1) / sumYears
    const dep    = depreciable * factor
    bookValue   -= dep
    return { year, factor: `${life - year + 1}/${sumYears}`, depreciation: dep, accumulated: cost - bookValue, bookValue: Math.max(bookValue, salvage) }
  })
}

const inputCls = (err) =>
  `w-full bg-white/5 border rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-blue-500 transition ${
    err ? 'border-red-500' : 'border-gray-700'
  }`

// ─── Field ────────────────────────────────────────────────────
const Field = ({ label, error, children, span }) => (
  <div className={span ? 'col-span-2' : ''}>
    <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-1.5">
      {label}
    </label>
    {children}
    {error && <p className="text-red-400 text-[11px] mt-1">{error}</p>}
  </div>
)

// ─── Modal ────────────────────────────────────────────────────
const Modal = ({ onClose, children, maxWidth = 'max-w-xl' }) => (
  <div
    onClick={onClose}
    className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center z-[1000] p-5"
  >
    <div
      onClick={e => e.stopPropagation()}
      className={`bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full ${maxWidth} max-h-[92vh] overflow-y-auto shadow-2xl`}
    >
      {children}
    </div>
  </div>
)

const ModalHeader = ({ title, subtitle, onClose }) => (
  <div className="flex items-start justify-between mb-5">
    <div>
      <p className="text-gray-100 font-bold text-base">{title}</p>
      {subtitle && <p className="text-gray-400 text-xs mt-0.5">{subtitle}</p>}
    </div>
    <button
      onClick={onClose}
      className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-gray-700 text-gray-400 hover:bg-white/10 transition"
    >
      <X size={14} />
    </button>
  </div>
)

// ─── Edit Asset Modal ─────────────────────────────────────────
const EMPTY_FORM = {
  name: '', category: 'Laptop', brand: '', model: '',
  serial_number: '', location: '', user: '',
  warranty_expiry: '', status: 'Active',
  purchase_date: '', purchase_price: '', notes: '',
}

const AssetFormModal = ({ onClose, onSaved, editAsset }) => {
  const { authFetch }       = useAuth()
  const [form, setForm]     = useState({ ...EMPTY_FORM, ...editAsset })
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
      const res = await authFetch(`/api/assets/${editAsset.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
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
    <Modal onClose={onClose} maxWidth="max-w-lg">
      <ModalHeader title="Edit Aset" subtitle={`${editAsset.asset_number} · ${editAsset.serial_number}`} onClose={onClose} />
      <div className="grid grid-cols-2 gap-3.5">
        <Field label="Nama Aset" error={errors.name} span>
          <input className={inputCls(errors.name)} placeholder="cth: Dell Latitude 5420" value={form.name} onChange={e => set('name', e.target.value)} />
        </Field>
        <Field label="Kategori">
          <select className={inputCls()} value={form.category} onChange={e => set('category', e.target.value)}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Status">
          <select className={inputCls()} value={form.status} onChange={e => set('status', e.target.value)}>
            {STATUSES.map(st => <option key={st}>{st}</option>)}
          </select>
        </Field>
        <Field label="Brand">
          <input className={inputCls()} placeholder="Dell" value={form.brand} onChange={e => set('brand', e.target.value)} />
        </Field>
        <Field label="Model">
          <input className={inputCls()} placeholder="Latitude 5420" value={form.model} onChange={e => set('model', e.target.value)} />
        </Field>
        <Field label="Serial Number" error={errors.serial_number}>
          <input className={inputCls(errors.serial_number)} value={form.serial_number} onChange={e => set('serial_number', e.target.value)} />
        </Field>
        <Field label="Lokasi" error={errors.location}>
          <input className={inputCls(errors.location)} placeholder="Ruang IT Lt. 2" value={form.location} onChange={e => set('location', e.target.value)} />
        </Field>
        <Field label="Pengguna">
          <input className={inputCls()} placeholder="(opsional)" value={form.user} onChange={e => set('user', e.target.value)} />
        </Field>
        <Field label="Tgl Beli">
          <input type="date" className={inputCls()} value={form.purchase_date} onChange={e => set('purchase_date', e.target.value)} />
        </Field>
        <Field label="Harga Beli (Rp)">
          <input type="number" className={inputCls()} value={form.purchase_price} onChange={e => set('purchase_price', e.target.value)} />
        </Field>
        <Field label="Garansi s/d" span>
          <input type="date" className={inputCls()} value={form.warranty_expiry} onChange={e => set('warranty_expiry', e.target.value)} />
        </Field>
        <Field label="Catatan" span>
          <input className={inputCls()} placeholder="(opsional)" value={form.notes} onChange={e => set('notes', e.target.value)} />
        </Field>
      </div>
      {errors._global && (
        <div className="mt-3 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">
          {errors._global}
        </div>
      )}
      <div className="flex gap-2 justify-end mt-5">
        <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-700 text-gray-400 text-sm hover:bg-white/5 transition">
          Batal
        </button>
        <button onClick={handleSubmit} disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition">
          {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </div>
    </Modal>
  )
}

// ─── Tab Bar ──────────────────────────────────────────────────
const TABS = [
  { id: 'info', label: 'Info Aset',   icon: <Package size={13} /> },
  { id: 'qr',   label: 'QR Code',    icon: <QrCode size={13} /> },
  { id: 'dep',  label: 'Depresiasi', icon: <TrendingDown size={13} /> },
  { id: 'pm',   label: 'Jadwal PM',  icon: <CalendarClock size={13} /> },
]

const TabBar = ({ active, onChange }) => (
  <div className="flex gap-1 mb-5 border-b border-gray-700">
    {TABS.map(({ id, label, icon }) => (
      <button
        key={id}
        onClick={() => onChange(id)}
        className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-t-lg border-b-2 transition cursor-pointer
          ${active === id
            ? 'bg-blue-500/10 text-blue-400 border-blue-500 font-bold'
            : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-white/5'
          }`}
      >
        {icon} {label}
      </button>
    ))}
  </div>
)

// ─── Info Tab ─────────────────────────────────────────────────
const InfoTab = ({ asset }) => {
  const expired = isExpired(asset.warranty_expiry)
  const fields = [
    ['Kategori',      asset.category],
    ['Status',        asset.status],
    ['Brand / Model', [asset.brand, asset.model].filter(Boolean).join(' ')],
    ['Lokasi',        asset.location],
    ['Pengguna',      asset.user || '—'],
    ['Garansi s/d',   asset.warranty_expiry
      ? <span className={expired ? 'text-red-400' : 'text-emerald-400'}>{asset.warranty_expiry}{expired ? ' (Expired)' : ''}</span>
      : '—'],
    ['Harga Beli',    asset.purchase_price ? `Rp ${formatRp(asset.purchase_price)}` : '—'],
    ['Tgl Beli',      asset.purchase_date || '—'],
  ]
  return (
    <div className="grid grid-cols-2 gap-3">
      {fields.map(([k, v]) => (
        <div key={k} className="bg-white/[0.03] rounded-xl px-3.5 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-1">{k}</p>
          <p className="text-gray-200 text-sm font-semibold">{v || '—'}</p>
        </div>
      ))}
      {asset.notes && (
        <div className="col-span-2 bg-white/[0.03] rounded-xl px-3.5 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-1">Catatan</p>
          <p className="text-gray-400 text-sm">{asset.notes}</p>
        </div>
      )}
    </div>
  )
}

// ─── QR Tab ───────────────────────────────────────────────────
const QRCanvas = ({ value, size = 200 }) => {
  const canvasRef = useRef(null)
  useEffect(() => {
    if (!canvasRef.current) return
    QRCode.toCanvas(canvasRef.current, value, { width: size, margin: 2, color: { dark: '#0f172a', light: '#ffffff' } })
  }, [value, size])
  return <canvas ref={canvasRef} className="rounded-lg" />
}

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
    <div className="flex flex-col items-center gap-5">
      <div id="qr-preview" className="bg-white rounded-2xl p-6 flex flex-col items-center gap-3 shadow-2xl">
        <QRCanvas value={qrValue} size={200} />
        <div className="text-center">
          <p className="text-slate-900 font-extrabold text-sm font-mono">{asset.asset_number}</p>
          <p className="text-slate-500 text-[11px] mt-0.5">{asset.name}</p>
          <p className="text-slate-400 text-[10px]">{asset.serial_number} · {asset.location}</p>
        </div>
      </div>

      <div className="flex gap-2.5">
        <button onClick={handlePrint}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition">
          <PrintIcon size={14} /> Print QR
        </button>
        <button onClick={handleDownload}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-700 text-gray-400 text-sm hover:bg-white/5 transition">
          <Download size={14} /> Download PNG
        </button>
      </div>

      <div className="bg-white/[0.03] border border-gray-700 rounded-xl p-3.5 w-full text-[11px] text-gray-500 font-mono break-all">
        <p className="text-gray-600 mb-1">Data encoded:</p>
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
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-sm font-bold text-gray-200 pb-2.5 border-b border-gray-700">
        <TrendingDown size={14} className="text-amber-400" /> Sum of Years Digits (SYD)
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {[['Harga Perolehan (Rp)', 'cost', 'contoh: 15000000'],
          ['Nilai Sisa (Rp)',      'salvage', 'contoh: 1500000'],
          ['Masa Manfaat (Thn)',   'life',    'contoh: 5']].map(([label, key, ph]) => (
          <div key={key}>
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-1.5">{label}</label>
            <input type="number" className={inputCls()} placeholder={ph} value={form[key]}
              onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
          </div>
        ))}
      </div>

      <button onClick={handleCalc}
        className="self-start flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 text-sm font-semibold hover:bg-amber-500/30 transition">
        <BarChart3 size={14} /> Hitung Depresiasi
      </button>

      {rows.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-2.5">
            {[['Total Depresiasi', `Rp ${formatRp(+form.cost - +form.salvage)}`, 'text-red-400',  'bg-red-400/10   border-red-400/20'],
              ['Nilai Sisa',       `Rp ${formatRp(+form.salvage)}`,              'text-emerald-400', 'bg-emerald-400/10 border-emerald-400/20'],
              ['Depresiasi Thn 1', `Rp ${formatRp(rows[0]?.depreciation)}`,      'text-blue-400', 'bg-blue-400/10  border-blue-400/20'],
            ].map(([k, v, textCls, bgCls]) => (
              <div key={k} className={`rounded-xl px-3.5 py-2.5 border ${bgCls}`}>
                <p className={`text-[10px] font-semibold uppercase tracking-widest mb-1 opacity-70 ${textCls}`}>{k}</p>
                <p className={`font-bold text-sm ${textCls}`}>{v}</p>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-700">
            <table className="w-full text-xs">
              <thead className="bg-gray-800">
                <tr>
                  {['Tahun', 'Faktor', 'Depresiasi (Rp)', 'Akumulasi (Rp)', 'Nilai Buku (Rp)'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-right text-gray-400 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className={`border-t border-gray-800 ${i % 2 === 1 ? 'bg-white/[0.02]' : ''}`}>
                    <td className="px-3 py-2 text-right text-blue-400 font-bold">{r.year}</td>
                    <td className="px-3 py-2 text-right text-gray-500 font-mono">{r.factor}</td>
                    <td className="px-3 py-2 text-right text-red-400">{formatRp(r.depreciation)}</td>
                    <td className="px-3 py-2 text-right text-gray-400">{formatRp(r.accumulated)}</td>
                    <td className="px-3 py-2 text-right text-gray-200 font-semibold">{formatRp(r.bookValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {rows.length === 0 && (
        <div className="text-center text-gray-500 text-xs py-8 border border-dashed border-gray-700 rounded-xl">
          Isi harga perolehan, nilai sisa, dan masa manfaat lalu klik Hitung
        </div>
      )}
    </div>
  )
}

// ─── PM Tab ───────────────────────────────────────────────────
const PMTab = ({ asset, onRefresh }) => {
  const { authFetch } = useAuth()
  const [pmList, setPmList] = useState(asset.pm_schedules ?? [])
  const [form, setForm]     = useState({ title: '', interval: 'Bulanan', next_date: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  useEffect(() => { setPmList(asset.pm_schedules ?? []) }, [asset.pm_schedules])

  const handleAdd = async () => {
    if (!form.title || !form.next_date) { setError('Judul dan tanggal wajib diisi'); return }
    setSaving(true); setError('')
    try {
      const res  = await authFetch(`/api/assets/${asset.id}/pm`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      setPmList(p => [...p, data.data ?? data])
      setForm({ title: '', interval: 'Bulanan', next_date: '', notes: '' })
      onRefresh?.()
    } catch { setError('Gagal menyimpan jadwal') }
    finally  { setSaving(false) }
  }

  const handleComplete = async (pmId) => {
    try {
      await authFetch(`/api/assets/${asset.id}/pm/${pmId}/complete`, { method: 'PATCH' })
      setPmList(p => p.map(x => x.id === pmId ? { ...x, status: 'Selesai', last_done: new Date().toISOString().slice(0, 10) } : x))
    } catch (e) { console.error(e) }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Add form */}
      <div className="flex items-center gap-2 text-sm font-bold text-gray-200 pb-2.5 border-b border-gray-700">
        <CalendarClock size={14} className="text-blue-400" /> Tambah Jadwal Maintenance
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="col-span-2">
          <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-1.5">Judul Maintenance</label>
          <input className={inputCls()} placeholder="cth: Cleaning & Thermal Paste" value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        </div>
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-1.5">Interval</label>
          <select className={inputCls()} value={form.interval} onChange={e => setForm(f => ({ ...f, interval: e.target.value }))}>
            {PM_INTERVALS.map(i => <option key={i}>{i}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-1.5">Tanggal Pertama</label>
          <input type="date" className={inputCls()} value={form.next_date}
            onChange={e => setForm(f => ({ ...f, next_date: e.target.value }))} />
        </div>
        <div className="col-span-2">
          <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-1.5">Catatan (opsional)</label>
          <input className={inputCls()} placeholder="Instruksi khusus..." value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-red-400 text-xs">
          <AlertCircle size={12} /> {error}
        </div>
      )}

      <button onClick={handleAdd} disabled={saving}
        className="self-start flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition">
        <Plus size={14} /> {saving ? 'Menyimpan...' : 'Tambah Jadwal'}
      </button>

      {/* List */}
      <div className="flex items-center gap-2 text-sm font-bold text-gray-200 pb-2.5 border-b border-gray-700 mt-2">
        <ClipboardList size={14} className="text-gray-500" /> Jadwal Terdaftar
        <span className="text-gray-500 font-normal text-xs">({pmList.length})</span>
      </div>

      {pmList.length === 0 ? (
        <div className="text-center text-gray-500 text-xs py-6 border border-dashed border-gray-700 rounded-xl">
          Belum ada jadwal PM untuk aset ini
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {pmList.map((pm) => {
            const overdue = isOverduePM(pm)
            const done    = pm.status === 'Selesai'

            const colorMap = {
              icon:   done ? 'text-emerald-400' : overdue ? 'text-red-400' : 'text-amber-400',
              bg:     done ? 'bg-emerald-400/10' : overdue ? 'bg-red-400/10' : 'bg-amber-400/10',
              badge:  done ? 'bg-emerald-400/10 border-emerald-400/30 text-emerald-400'
                           : overdue ? 'bg-red-400/10 border-red-400/30 text-red-400'
                           : 'bg-amber-400/10 border-amber-400/30 text-amber-400',
              border: overdue && !done ? 'border-red-500/30' : 'border-gray-700',
            }
            const statusLabel = done ? 'Selesai' : overdue ? 'Terlambat' : 'Terjadwal'

            return (
              <div key={pm.id ?? pm.title}
                className={`flex items-center gap-3 bg-white/[0.03] border ${colorMap.border} rounded-xl px-3.5 py-3`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${colorMap.bg} ${colorMap.icon}`}>
                  {done ? <CheckCheck size={16} /> : overdue ? <AlertCircle size={16} /> : <Bell size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-200 font-semibold text-sm">{pm.title}</p>
                  <div className="flex gap-3 mt-1 flex-wrap">
                    <span className="flex items-center gap-1 text-gray-500 text-[11px]"><RefreshCw size={9} /> {pm.interval}</span>
                    <span className="flex items-center gap-1 text-gray-500 text-[11px]"><Calendar size={9} /> {pm.next_date}</span>
                    {pm.last_done && <span className="flex items-center gap-1 text-gray-500 text-[11px]"><Clock size={9} /> Terakhir: {pm.last_done}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${colorMap.badge}`}>
                    {statusLabel}
                  </span>
                  {!done && (
                    <button onClick={() => handleComplete(pm.id)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/25 transition">
                      <CheckCheck size={11} /> Selesai
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── AssetDetailPage ──────────────────────────────────────────
const AssetDetailPage = () => {
  const { id }        = useParams()
  const navigate      = useNavigate()
  const { authFetch } = useAuth()

  const [asset,    setAsset]    = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const [tab,      setTab]      = useState('info')
  const [showEdit, setShowEdit] = useState(false)

  const fetchAsset = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await authFetch(`/api/assets/${id}`)
      if (!res.ok) throw new Error('Aset tidak ditemukan.')
      const data = await res.json()
      setAsset(data.data ?? data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [id, authFetch])

  useEffect(() => { fetchAsset() }, [fetchAsset])

  // ── Loading ──
  if (loading) return (
    <div className="flex flex-col gap-5 animate-pulse">
      <div className="h-8 w-48 bg-gray-800 rounded-lg" />
      <div className="h-28 bg-gray-800 rounded-2xl" />
      <div className="h-96 bg-gray-800 rounded-2xl" />
    </div>
  )

  // ── Error ──
  if (error) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
      <AlertTriangle size={40} className="text-red-500" />
      <p className="text-red-400 text-sm">{error}</p>
      <button onClick={() => navigate('/assets')}
        className="px-4 py-2 rounded-lg border border-gray-700 text-gray-400 text-sm hover:bg-white/5 transition">
        ← Kembali ke Assets
      </button>
    </div>
  )

  const a       = asset
  const cfg     = CAT_CFG[a.category] ?? { icon: <Package size={22} />, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' }
  const sCfg    = ASSET_STATUS_CFG[a.status]
  const expired = isExpired(a.warranty_expiry)
  const overdue = (a.pm_schedules ?? []).filter(isOverduePM).length

  return (
    <div className="flex flex-col gap-5">

      {/* Edit Modal */}
      {showEdit && (
        <AssetFormModal
          editAsset={a}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => { setAsset(updated); setShowEdit(false) }}
        />
      )}

      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2.5">
        <button onClick={() => navigate('/assets')}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200 transition bg-transparent border-none cursor-pointer">
          <ArrowLeft size={15} /> Assets
        </button>
        <span className="text-gray-700">/</span>
        <span className="text-gray-200 text-sm font-mono">{a.asset_number}</span>

        <div className="ml-auto flex items-center gap-2">
          <button onClick={fetchAsset}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-gray-700 text-gray-400 hover:bg-white/10 transition">
            <RefreshCw size={13} />
          </button>
          <button onClick={() => setShowEdit(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-400 text-sm hover:bg-white/5 transition">
            <Pencil size={13} /> Edit
          </button>
        </div>
      </div>

      {/* ── Hero card ── */}
      <div className="bg-gray-900 border border-gray-700 rounded-2xl px-5 py-4">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Category icon */}
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border ${cfg.bg} ${cfg.border} ${cfg.color}`}>
            {cfg.icon}
          </div>

          {/* Title */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="font-mono text-[11px] text-gray-500 bg-white/5 border border-gray-700 rounded-md px-2 py-0.5">
                {a.asset_number}
              </span>
              <Badge label={a.status} cfg={sCfg} />
              <span className="bg-white/5 border border-gray-700 text-gray-400 text-[11px] px-2.5 py-0.5 rounded-full">
                {a.category}
              </span>
              {overdue > 0 && (
                <span className="inline-flex items-center gap-1 bg-red-400/10 border border-red-400/20 text-red-400 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                  <Bell size={9} /> PM Terlambat {overdue}
                </span>
              )}
              {expired && (
                <span className="inline-flex items-center gap-1 bg-red-400/10 border border-red-400/20 text-red-400 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                  <AlertTriangle size={9} /> Garansi Expired
                </span>
              )}
            </div>
            <h1 className="text-gray-100 font-bold text-xl">{a.name}</h1>
            <p className="text-gray-500 text-xs mt-1">S/N: {a.serial_number} · {a.brand} {a.model}</p>
          </div>

          {/* Meta */}
          <div className="hidden md:flex flex-col gap-1.5 text-right shrink-0">
            {[[Globe, a.location], [User, a.user || 'Unassigned'], [Shield, a.warranty_expiry || '—']].map(([Ic, val], i) => (
              <div key={i} className="flex items-center justify-end gap-1.5 text-gray-500 text-xs">
                <Ic size={11} /> {val}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="bg-gray-900 border border-gray-700 rounded-2xl px-5 py-5">
        <TabBar active={tab} onChange={setTab} />
        {tab === 'info' && <InfoTab asset={a} />}
        {tab === 'qr'   && <QRTab   asset={a} />}
        {tab === 'dep'  && <DepTab  asset={a} />}
        {tab === 'pm'   && <PMTab   asset={a} onRefresh={fetchAsset} />}
      </div>
    </div>
  )
}

export default AssetDetailPage