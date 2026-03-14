/**
 * AssetsPage.jsx — Tailwind version
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Globe, User, Shield, MoreHorizontal, Laptop, Printer, Network,
  Server, Monitor, Package, CheckCircle2, Wrench, AlertTriangle, X,
  TrendingDown, CalendarClock, Eye, Pencil, Trash2, Bell,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import { ASSET_STATUS_CFG } from '../theme'
import { Card, Badge, PageHeader, SearchBar, PrimaryButton, StatCard, EmptyState } from '../components/ui'
import { useAuth } from '../context/AppContext'
import useSearch from '../hooks/useSearch'

// ─── Constants ────────────────────────────────────────────────
const CATEGORIES   = ['Laptop', 'Desktop', 'Printer', 'Network', 'Server', 'Phone', 'Monitor', 'Others']
const STATUSES     = ['Active', 'Maintenance', 'Inactive', 'Disposed']

const CAT_CFG = {
  Laptop:  { icon: <Laptop  size={20} />, color: 'text-blue-400',   bg: 'bg-blue-400/10',   border: 'border-blue-400/20'   },
  Desktop: { icon: <Monitor size={20} />, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
  Printer: { icon: <Printer size={20} />, color: 'text-violet-400',  bg: 'bg-violet-400/10',  border: 'border-violet-400/20'  },
  Network: { icon: <Network size={20} />, color: 'text-cyan-400',    bg: 'bg-cyan-400/10',    border: 'border-cyan-400/20'    },
  Server:  { icon: <Server  size={20} />, color: 'text-amber-400',   bg: 'bg-amber-400/10',   border: 'border-amber-400/20'   },
  Phone:   { icon: <Package size={20} />, color: 'text-pink-400',    bg: 'bg-pink-400/10',    border: 'border-pink-400/20'    },
  Monitor: { icon: <Monitor size={20} />, color: 'text-teal-400',    bg: 'bg-teal-400/10',    border: 'border-teal-400/20'    },
  Others:  { icon: <Package size={20} />, color: 'text-slate-400',   bg: 'bg-slate-400/10',   border: 'border-slate-400/20'   },
}

// ─── Helpers ──────────────────────────────────────────────────
const isExpired    = (d)  => !!d && new Date(d) < new Date()
const isOverduePM  = (pm) => pm.status !== 'Selesai' && pm.next_date && new Date(pm.next_date) < new Date()
const countOverdue = (a)  => (a.pm_schedules ?? []).filter(isOverduePM).length

// ─── Modal shell ──────────────────────────────────────────────
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
      <div className="text-gray-100 font-bold text-base">{title}</div>
      {subtitle && <div className="text-gray-400 text-xs mt-0.5">{subtitle}</div>}
    </div>
    <button
      onClick={onClose}
      className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-gray-700 text-gray-400 hover:bg-white/10 transition"
    >
      <X size={14} />
    </button>
  </div>
)

const Field = ({ label, error, children, span }) => (
  <div className={span ? 'col-span-2' : ''}>
    <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-1.5">
      {label}
    </label>
    {children}
    {error && <p className="text-red-400 text-[11px] mt-1">{error}</p>}
  </div>
)

const inputCls = (err) =>
  `w-full bg-white/5 border rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-blue-500 transition ${
    err ? 'border-red-500' : 'border-gray-700'
  }`

// ─── Confirm Delete Modal ─────────────────────────────────────
const ConfirmDeleteModal = ({ asset, onClose, onConfirm, deleting }) => (
  <Modal onClose={onClose} maxWidth="max-w-sm">
    <ModalHeader title="Hapus Aset" onClose={onClose} />
    <div className="flex flex-col gap-4">
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
        <p className="text-red-400 font-semibold text-sm mb-1">Konfirmasi Penghapusan</p>
        <p className="text-gray-400 text-xs leading-relaxed">
          Aset <strong className="text-gray-200">{asset.name}</strong> ({asset.asset_number}) akan
          dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.
        </p>
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-700 text-gray-400 text-sm hover:bg-white/5 transition">
          Batal
        </button>
        <button
          onClick={onConfirm}
          disabled={deleting}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 text-sm font-semibold hover:bg-red-500/30 disabled:opacity-50 transition"
        >
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

  return (
    <div ref={ref} className="relative">
      <button
        onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
        className="w-[30px] h-[30px] flex items-center justify-center rounded-lg bg-white/5 border border-gray-700/50 text-gray-400 hover:bg-white/10 transition"
      >
        <MoreHorizontal size={13} />
      </button>

      {open && (
        <div
          onClick={e => e.stopPropagation()}
          className="absolute top-[110%] right-0 z-[999] bg-gray-900 border border-gray-700 rounded-xl p-1 min-w-[150px] shadow-2xl"
        >
          <button
            onClick={() => { onEdit(asset); setOpen(false) }}
            className="flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:bg-white/6 hover:text-gray-200 transition text-left"
          >
            <Pencil size={12} /> Edit Aset
          </button>
          <div className="h-px bg-gray-700 my-1" />
          <button
            onClick={() => { onDelete(asset); setOpen(false) }}
            className="flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition text-left"
          >
            <Trash2 size={12} /> Hapus Aset
          </button>
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
  const { authFetch }   = useAuth()
  const isEdit          = !!editAsset
  const [form, setForm] = useState(isEdit ? { ...EMPTY_FORM, ...editAsset } : EMPTY_FORM)
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
    <Modal onClose={onClose} maxWidth="max-w-lg">
      <ModalHeader
        title={isEdit ? 'Edit Aset' : 'Tambah Aset Baru'}
        subtitle={isEdit ? `${editAsset.asset_number} · ${editAsset.serial_number}` : 'Isi detail aset yang akan didaftarkan'}
        onClose={onClose}
      />
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
          <input className={inputCls(errors.serial_number)} placeholder="SN-XXXXXXXX" value={form.serial_number} onChange={e => set('serial_number', e.target.value)} />
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
          <input type="number" className={inputCls()} placeholder="15000000" value={form.purchase_price} onChange={e => set('purchase_price', e.target.value)} />
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
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
        >
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

  const btnBase = 'min-w-[32px] h-8 px-2 flex items-center justify-center gap-1 rounded-lg text-xs font-semibold transition border'
  const btnActive   = `${btnBase} bg-blue-600 border-blue-500 text-white shadow shadow-blue-900/40`
  const btnNormal   = `${btnBase} bg-white/4 border-gray-700 text-gray-400 hover:bg-white/8 hover:text-gray-200`
  const btnDisabled = `${btnBase} bg-transparent border-gray-800 text-gray-700 cursor-not-allowed`

  return (
    <div className="flex items-center justify-between pt-3 flex-wrap gap-2">
      <span className="text-xs text-gray-500">
        Menampilkan{' '}
        <span className="text-gray-200 font-semibold">{from}–{to}</span>{' '}
        dari <span className="text-gray-200 font-semibold">{total}</span> aset
      </span>

      {lastPage > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className={currentPage <= 1 ? btnDisabled : btnNormal}
          >
            <ChevronLeft size={13} />
            <span className="hidden sm:inline">Prev</span>
          </button>

          {getPages().map((p, i) =>
            p === '...'
              ? <span key={`d${i}`} className="px-1 text-gray-600 text-xs select-none">···</span>
              : <button key={p} onClick={() => onPageChange(p)} className={p === currentPage ? btnActive : btnNormal}>{p}</button>
          )}

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= lastPage}
            className={currentPage >= lastPage ? btnDisabled : btnNormal}
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight size={13} />
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Asset Card ───────────────────────────────────────────────
const AssetCard = ({ asset, onEdit, onDelete }) => {
  const navigate = useNavigate()
  const cfg      = CAT_CFG[asset.category] ?? { icon: <Package size={20} />, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' }
  const sCfg     = ASSET_STATUS_CFG[asset.status]
  const expired  = isExpired(asset.warranty_expiry)
  const overdue  = countOverdue(asset)

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3.5 hover:border-gray-600 hover:bg-gray-800/50 transition">
      <div className="flex items-center gap-3.5">

        {/* Category icon */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${cfg.bg} ${cfg.border} ${cfg.color}`}>
          {cfg.icon}
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-mono text-[10px] text-gray-500">{asset.asset_number}</span>
            <Badge label={asset.status} cfg={sCfg} />
            <span className="bg-white/5 border border-gray-700 text-gray-400 text-[10px] px-2 py-0.5 rounded-full">
              {asset.category}
            </span>
            {overdue > 0 && (
              <span className="inline-flex items-center gap-1 bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                <Bell size={9} /> PM Terlambat {overdue}
              </span>
            )}
          </div>
          <p className="text-gray-100 font-semibold text-sm truncate">{asset.name}</p>
          <p className="text-gray-500 text-[11px] mt-0.5">
            S/N: {asset.serial_number} · {asset.brand} {asset.model}
          </p>
        </div>

        {/* Meta: location / user / warranty */}
        <div className="hidden md:flex flex-col gap-1.5 text-right shrink-0">
          {[
            [Globe,  asset.location,              false],
            [User,   asset.user || 'Unassigned',  false],
            [Shield, asset.warranty_expiry || '—', expired],
          ].map(([Ic, val, warn], i) => (
            <div key={i} className={`flex items-center justify-end gap-1.5 text-[11px] ${warn ? 'text-red-400' : 'text-gray-500'}`}>
              <Ic size={10} /> {val}
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 ml-2 shrink-0">
          {/* Eye — detail */}
          <button
            onClick={() => navigate(`/assets/${asset.id}`)}
            title="Lihat Detail"
            className="w-[30px] h-[30px] flex items-center justify-center rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 hover:bg-blue-500/25 transition"
          >
            <Eye size={13} />
          </button>

          {/* More dropdown: Edit + Hapus */}
          <MoreDropdown asset={asset} onEdit={onEdit} onDelete={onDelete} />
        </div>

      </div>
    </div>
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
  const [currentPage, setCurrentPage] = useState(1)

  const PER_PAGE = 5

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

  const { query, setQuery, results } = useSearch(assets, ['name', 'asset_number', 'serial_number', 'brand'])
  const totalOverdue = assets.reduce((acc, a) => acc + countOverdue(a), 0)

  useEffect(() => { setCurrentPage(1) }, [query])

  const lastPage  = Math.max(1, Math.ceil(results.length / PER_PAGE))
  const paginated = results.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE)

  if (loading) return (
    <div className="flex flex-col gap-4 animate-pulse">
      {Array(5).fill(0).map((_, i) => (
        <div key={i} className="h-16 bg-gray-800 rounded-xl" />
      ))}
    </div>
  )

  return (
    <div className="flex flex-col gap-5">

      {/* Modals */}
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

      {/* Header */}
      <PageHeader
        title="Asset Management"
        subtitle={`${assets.length} aset terdaftar`}
        action={<PrimaryButton icon={Plus} onClick={() => setShowAdd(true)}>Tambah Aset</PrimaryButton>}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label="Total Aset"      value={assets.length}                                            icon={Package}       iconColor="#3B8BFF" />
        <StatCard label="Active"          value={assets.filter(a => a.status === 'Active').length}        icon={CheckCircle2}  iconColor="#10B981" />
        <StatCard label="Maintenance"     value={assets.filter(a => a.status === 'Maintenance').length}   icon={Wrench}        iconColor="#F59E0B" />
        <StatCard label="Garansi Expired" value={assets.filter(a => isExpired(a.warranty_expiry)).length} icon={AlertTriangle} iconColor="#EF4444" />
        <StatCard label="PM Terlambat"    value={totalOverdue}                                              icon={CalendarClock} iconColor="#EF4444" />
      </div>

      {/* Search */}
      <SearchBar value={query} onChange={setQuery} placeholder="Cari nama, serial number, brand..." />

      {/* List */}
      <div className="flex flex-col gap-2.5">
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