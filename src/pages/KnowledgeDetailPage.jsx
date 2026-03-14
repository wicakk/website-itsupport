import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, RefreshCw, Wifi, Mail, Printer, Layers, Cpu,
  User, CalendarDays, Eye, Star, Edit2, Trash2, Tag,
  AlertTriangle, X, Save,
} from 'lucide-react'
import { useAuth } from '../context/AppContext'

// ─── Constants ────────────────────────────────────────────────
const CAT_COLOR = {
  Network:  { text: 'text-cyan-400',    bg: 'bg-cyan-400/10',    border: 'border-cyan-400/25'    },
  Email:    { text: 'text-violet-400',  bg: 'bg-violet-400/10',  border: 'border-violet-400/25'  },
  Printer:  { text: 'text-amber-400',   bg: 'bg-amber-400/10',   border: 'border-amber-400/25'   },
  Software: { text: 'text-blue-400',    bg: 'bg-blue-400/10',    border: 'border-blue-400/25'    },
  Hardware: { text: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/25' },
}
const CAT_ICON = {
  Network:  <Wifi size={12} />,
  Email:    <Mail size={12} />,
  Printer:  <Printer size={12} />,
  Software: <Layers size={12} />,
  Hardware: <Cpu size={12} />,
}
const CATEGORIES = ['Network', 'Email', 'Printer', 'Software', 'Hardware']

const getCat    = (c) => CAT_COLOR[c] ?? { text: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/25' }
const getAuthor = (a) => typeof a?.author === 'object' ? a?.author?.name : a?.author

// ─── Helpers ─────────────────────────────────────────────────
const inputCls = 'w-full bg-white/5 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-blue-500 transition'

// ─── StarRating ───────────────────────────────────────────────
const StarRating = ({ value = 0, onChange, readonly = false, size = 16 }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((i) => (
      <button key={i} type="button" disabled={readonly}
        onClick={() => onChange?.(i)}
        className={`transition ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-125'}`}>
        <Star
          size={size}
          className={i <= Math.round(value) ? 'text-amber-400' : 'text-gray-600'}
          fill={i <= Math.round(value) ? 'currentColor' : 'none'}
        />
      </button>
    ))}
    <span className="text-gray-400 text-sm ml-1 font-semibold">{Number(value).toFixed(1)}</span>
  </div>
)

// ─── EditModal ────────────────────────────────────────────────
const EditModal = ({ article, onClose, onSave, loading }) => {
  const [form, setForm] = useState({
    title:    article?.title    ?? '',
    category: article?.category ?? 'Network',
    content:  article?.content  ?? '',
    tags:     Array.isArray(article?.tags) ? article.tags.join(', ') : (article?.tags ?? ''),
  })
  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-5"
      onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <p className="text-gray-100 font-bold text-base">Edit Artikel</p>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition"><X size={16} /></button>
        </div>
        <div className="flex flex-col gap-4 px-5 py-4 overflow-y-auto">
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-1.5">Judul</label>
            <input className={inputCls} value={form.title} onChange={set('title')} placeholder="Judul artikel..." />
          </div>
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-1.5">Kategori</label>
            <select className={inputCls} value={form.category} onChange={set('category')}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-1.5">Konten</label>
            <textarea className={`${inputCls} min-h-[160px] resize-y`} value={form.content}
              onChange={set('content')} placeholder="Isi artikel..." />
          </div>
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-1.5">
              Tags <span className="normal-case font-normal">(pisah dengan koma)</span>
            </label>
            <input className={inputCls} value={form.tags} onChange={set('tags')} placeholder="vpn, network, setup" />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3.5 border-t border-gray-800">
          <button onClick={onClose} disabled={loading}
            className="px-4 py-2 rounded-lg border border-gray-700 text-gray-400 text-sm hover:bg-white/5 transition">Batal</button>
          <button
            disabled={loading || !form.title.trim()}
            onClick={() => onSave(article?.id ?? null, {
              ...form,
              tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
            })}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition">
            <Save size={13} /> {loading ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── DeleteModal ──────────────────────────────────────────────
const DeleteModal = ({ article, onClose, onConfirm, loading }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-5"
    onClick={onClose}>
    <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm p-6 text-center shadow-2xl"
      onClick={e => e.stopPropagation()}>
      <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-4">
        <Trash2 size={20} className="text-red-400" />
      </div>
      <p className="text-gray-100 font-bold text-base mb-2">Hapus Artikel?</p>
      <p className="text-gray-400 text-sm mb-5">
        <strong className="text-gray-200">{article.title}</strong> akan dihapus secara permanen.
      </p>
      <div className="flex gap-2 justify-center">
        <button onClick={onClose} disabled={loading}
          className="px-4 py-2 rounded-lg border border-gray-700 text-gray-400 text-sm hover:bg-white/5 transition">Batal</button>
        <button onClick={() => onConfirm(article.id)} disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition">
          <Trash2 size={12} /> {loading ? 'Menghapus...' : 'Ya, Hapus'}
        </button>
      </div>
    </div>
  </div>
)

// ─── Toast ────────────────────────────────────────────────────
const Toast = ({ message, type = 'success' }) => (
  <div className={`fixed bottom-6 right-6 z-[2000] px-4 py-2.5 rounded-xl text-white text-sm font-medium shadow-2xl
    ${type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
    {message}
  </div>
)

// ─── KnowledgeDetailPage ──────────────────────────────────────
const KnowledgeDetailPage = () => {
  const { id }        = useParams()
  const navigate      = useNavigate()
  const { authFetch } = useAuth()

  const [article,       setArticle]       = useState(null)
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [showEdit,      setShowEdit]      = useState(false)
  const [showDelete,    setShowDelete]    = useState(false)
  const [toast,         setToast]         = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchArticle = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await authFetch(`/api/knowledge/${id}`)
      if (!res.ok) throw new Error('Artikel tidak ditemukan.')
      const data = await res.json()
      setArticle(data.data ?? data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [id, authFetch])

  useEffect(() => { fetchArticle() }, [fetchArticle])

  const handleSave = async (_, form) => {
    setActionLoading(true)
    try {
      const res = await authFetch(`/api/knowledge/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Gagal menyimpan')
      setArticle(a => ({ ...a, ...form }))
      setShowEdit(false)
      showToast('Artikel berhasil diperbarui ✓')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async (articleId) => {
    setActionLoading(true)
    try {
      const res = await authFetch(`/api/knowledge/${articleId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Gagal menghapus')
      navigate('/knowledge')
    } catch (err) {
      showToast(err.message, 'error')
      setActionLoading(false)
    }
  }

  const handleRate = async (val) => {
    // Optimistic update
    setArticle(a => ({ ...a, rating: val }))
    try {
      await authFetch(`/api/knowledge/${id}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: val }),
      })
    } catch {
      showToast('Gagal menyimpan rating', 'error')
    }
  }

  // ── Loading ──
  if (loading) return (
    <div className="flex flex-col gap-5 animate-pulse">
      <div className="h-8 w-48 bg-gray-800 rounded-lg" />
      <div className="h-32 bg-gray-800 rounded-2xl" />
      <div className="h-64 bg-gray-800 rounded-2xl" />
    </div>
  )

  // ── Error ──
  if (error) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
      <AlertTriangle size={40} className="text-red-500" />
      <p className="text-red-400 text-sm">{error}</p>
      <button onClick={() => navigate('/knowledge')}
        className="px-4 py-2 rounded-lg border border-gray-700 text-gray-400 text-sm hover:bg-white/5 transition">
        ← Kembali ke Knowledge Base
      </button>
    </div>
  )

  const a    = article
  const cat  = getCat(a.category)
  const tags = Array.isArray(a.tags) ? a.tags : []

  return (
    <div className="flex flex-col gap-5">

      {/* Modals */}
      {showEdit && (
        <EditModal article={a} onClose={() => !actionLoading && setShowEdit(false)}
          onSave={handleSave} loading={actionLoading} />
      )}
      {showDelete && (
        <DeleteModal article={a} onClose={() => !actionLoading && setShowDelete(false)}
          onConfirm={handleDelete} loading={actionLoading} />
      )}
      {toast && <Toast message={toast.message} type={toast.type} />}

      {/* Breadcrumb */}
      <div className="flex items-center gap-2.5">
        <button onClick={() => navigate('/knowledge')}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200 transition bg-transparent border-none cursor-pointer">
          <ArrowLeft size={15} /> Knowledge Base
        </button>
        <span className="text-gray-700">/</span>
        <span className="text-gray-400 text-sm truncate max-w-[200px]">{a.title}</span>

        <div className="ml-auto flex items-center gap-2">
          <button onClick={fetchArticle}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-gray-700 text-gray-400 hover:bg-white/10 transition">
            <RefreshCw size={13} />
          </button>
          <button onClick={() => setShowEdit(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-400 text-sm hover:bg-white/5 transition">
            <Edit2 size={13} /> Edit
          </button>
          <button onClick={() => setShowDelete(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-800/60 text-red-400 text-sm hover:bg-red-500/10 transition">
            <Trash2 size={13} /> Hapus
          </button>
        </div>
      </div>

      {/* Hero card */}
      <div className="bg-gray-900 border border-gray-700 rounded-2xl px-6 py-5">
        {/* Category badge */}
        <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full border mb-3 ${cat.text} ${cat.bg} ${cat.border}`}>
          {CAT_ICON[a.category]} {a.category ?? 'General'}
        </span>

        <h1 className="text-gray-100 font-bold text-xl leading-snug mb-3">{a.title}</h1>

        {/* Meta */}
        <div className="flex items-center gap-4 flex-wrap mb-4">
          {[[User, getAuthor(a) ?? 'Unknown'], [CalendarDays, a.date ?? '—'], [Eye, `${a.views ?? 0} views`]].map(([Ic, v], i) => (
            <span key={i} className="flex items-center gap-1.5 text-gray-500 text-xs">
              <Ic size={11} /> {v}
            </span>
          ))}
        </div>

        {/* Star rating — interactive */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Rating:</span>
          <StarRating value={a.rating ?? 0} onChange={handleRate} size={16} />
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex gap-2 flex-wrap mt-4 pt-4 border-t border-gray-800">
            <Tag size={11} className="text-gray-600 mt-0.5" />
            {tags.map((t, i) => (
              <span key={i} className="text-[10px] text-gray-500 bg-white/4 border border-gray-700 px-2.5 py-0.5 rounded-full">
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Content card */}
      <div className="bg-gray-900 border border-gray-700 rounded-2xl px-6 py-5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-4">Konten</p>
        {a.content ? (
          <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{a.content}</p>
        ) : (
          <p className="text-gray-600 text-sm italic">Konten artikel tidak tersedia.</p>
        )}
      </div>

    </div>
  )
}

export default KnowledgeDetailPage