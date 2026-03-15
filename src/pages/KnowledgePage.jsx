import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Wifi, Mail, Printer, Layers, Cpu, BookOpen,
  User, CalendarDays, Eye, Star, Edit2, Trash2, Tag,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import { PageHeader, SearchBar, FilterTabs, PrimaryButton, EmptyState } from '../components/ui'
import { useAuth } from '../context/AppContext'
import useSearch from '../hooks/useSearch'
import useFilter from '../hooks/useFilter'

// ─── Constants ────────────────────────────────────────────────
const CAT_COLOR = {
  Network:  { text: 'text-cyan-400',    bg: 'bg-cyan-400/10',    border: 'border-cyan-400/25'   },
  Email:    { text: 'text-violet-400',  bg: 'bg-violet-400/10',  border: 'border-violet-400/25' },
  Printer:  { text: 'text-amber-400',   bg: 'bg-amber-400/10',   border: 'border-amber-400/25'  },
  Software: { text: 'text-blue-400',    bg: 'bg-blue-400/10',    border: 'border-blue-400/25'   },
  Hardware: { text: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/25'},
}
const CAT_ICON = {
  Network:  <Wifi size={11} />,
  Email:    <Mail size={11} />,
  Printer:  <Printer size={11} />,
  Software: <Layers size={11} />,
  Hardware: <Cpu size={11} />,
}
const CATEGORIES = ['Network', 'Email', 'Printer', 'Software', 'Hardware']

const getCat    = (c) => CAT_COLOR[c] ?? { text: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/25' }
const getAuthor = (a) => typeof a.author === 'object' ? a.author?.name : a.author
const getTags   = (a) => Array.isArray(a.tags) ? a.tags : []

// ─── StarRating ───────────────────────────────────────────────
const StarRating = ({ value = 0, onChange, readonly = false, size = 13 }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <button
        key={i}
        type="button"
        disabled={readonly}
        onClick={() => onChange?.(i)}
        className={`transition ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
      >
        <Star
          size={size}
          className={i <= Math.round(value) ? 'text-amber-400' : 'text-gray-600'}
          fill={i <= Math.round(value) ? 'currentColor' : 'none'}
        />
      </button>
    ))}
    <span className="text-gray-500 text-[11px] ml-1">{Number(value).toFixed(1)}</span>
  </div>
)

// ─── inputCls ─────────────────────────────────────────────────
const inputCls = 'w-full bg-white/5 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-blue-500 transition'

// ─── EditModal ────────────────────────────────────────────────
const EditModal = ({ article, onClose, onSave, loading }) => {
  const isNew = !article
  const [form, setForm] = useState({
    title:    article?.title    ?? '',
    category: article?.category ?? 'Network',
    content:  article?.content  ?? '',
    tags:     Array.isArray(article?.tags) ? article.tags.join(', ') : (article?.tags ?? ''),
  })

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start sm:items-center justify-center z-[1000] p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg my-4 sm:my-0 flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 border-b border-gray-800">
          <p className="text-gray-100 font-bold text-base">{isNew ? 'Tambah Artikel' : 'Edit Artikel'}</p>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition text-lg leading-none">✕</button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-3.5 sm:gap-4 px-4 sm:px-5 py-4 overflow-y-auto max-h-[65vh]">
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
            <textarea
              className={`${inputCls} min-h-[130px] sm:min-h-[140px] resize-y`}
              value={form.content}
              onChange={set('content')}
              placeholder="Isi artikel..."
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-1.5">
              Tags <span className="normal-case font-normal">(pisah dengan koma)</span>
            </label>
            <input className={inputCls} value={form.tags} onChange={set('tags')} placeholder="vpn, network, setup" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 px-4 sm:px-5 py-3.5 border-t border-gray-800">
          <button onClick={onClose} disabled={loading}
            className="px-4 py-2.5 sm:py-2 rounded-lg border border-gray-700 text-gray-400 text-sm hover:bg-white/5 transition text-center">
            Batal
          </button>
          <button
            disabled={loading || !form.title.trim()}
            onClick={() => onSave(article?.id ?? null, {
              ...form,
              tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
            })}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── DeleteModal ──────────────────────────────────────────────
const DeleteModal = ({ article, onClose, onConfirm, loading }) => (
  <div
    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-4 sm:p-5"
    onClick={onClose}
  >
    <div
      className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm p-5 sm:p-6 text-center shadow-2xl"
      onClick={e => e.stopPropagation()}
    >
      <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-4">
        <Trash2 size={20} className="text-red-400" />
      </div>
      <p className="text-gray-100 font-bold text-base mb-2">Hapus Artikel?</p>
      <p className="text-gray-400 text-sm mb-5 leading-relaxed">
        <strong className="text-gray-200">{article.title}</strong> akan dihapus secara permanen.
      </p>
      <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-center">
        <button onClick={onClose} disabled={loading}
          className="px-4 py-2.5 sm:py-2 rounded-lg border border-gray-700 text-gray-400 text-sm hover:bg-white/5 transition">
          Batal
        </button>
        <button onClick={() => onConfirm(article.id)} disabled={loading}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition">
          <Trash2 size={12} /> {loading ? 'Menghapus...' : 'Ya, Hapus'}
        </button>
      </div>
    </div>
  </div>
)

// ─── Toast ────────────────────────────────────────────────────
const Toast = ({ message, type = 'success' }) => (
  <div className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[2000] px-4 py-2.5 rounded-xl text-white text-sm font-medium shadow-2xl max-w-[calc(100vw-2rem)]
    ${type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
    {message}
  </div>
)

// ─── Pagination ───────────────────────────────────────────────
const Pagination = ({ currentPage, lastPage, total, perPage, onPageChange }) => {
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
  const base = 'min-w-[32px] h-8 px-2 flex items-center justify-center gap-1 rounded-lg text-xs font-semibold transition border'

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-3 gap-3">
      <span className="text-xs text-gray-500 text-center sm:text-left">
        Menampilkan <span className="text-gray-200 font-semibold">{from}–{to}</span> dari{' '}
        <span className="text-gray-200 font-semibold">{total}</span> artikel
      </span>
      {lastPage > 1 && (
        <div className="flex items-center justify-center gap-1 flex-wrap">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className={`${base} ${currentPage <= 1 ? 'bg-transparent border-gray-800 text-gray-700 cursor-not-allowed' : 'bg-white/4 border-gray-700 text-gray-400 hover:bg-white/8'}`}
          >
            <ChevronLeft size={13} /><span className="hidden sm:inline">Prev</span>
          </button>
          {getPages().map((p, i) =>
            p === '...'
              ? <span key={`d${i}`} className="px-1 text-gray-600 text-xs">···</span>
              : <button key={p} onClick={() => onPageChange(p)}
                  className={`${base} ${p === currentPage ? 'bg-blue-600 border-blue-500 text-white shadow shadow-blue-900/40' : 'bg-white/4 border-gray-700 text-gray-400 hover:bg-white/8'}`}>
                  {p}
                </button>
          )}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= lastPage}
            className={`${base} ${currentPage >= lastPage ? 'bg-transparent border-gray-800 text-gray-700 cursor-not-allowed' : 'bg-white/4 border-gray-700 text-gray-400 hover:bg-white/8'}`}
          >
            <span className="hidden sm:inline">Next</span><ChevronRight size={13} />
          </button>
        </div>
      )}
    </div>
  )
}

// ─── ArticleCard ──────────────────────────────────────────────
const ArticleCard = ({ article, onEdit, onDelete, onRate }) => {
  const navigate = useNavigate()
  const cat      = getCat(article.category)
  const author   = getAuthor(article)
  const tags     = getTags(article)

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl px-3.5 sm:px-4 py-3 sm:py-3.5 hover:border-gray-600 hover:bg-gray-800/50 transition">

      {/* Top row: category + actions */}
      <div className="flex items-start justify-between gap-2 mb-2">
        {/* Category + Tags — wrap naturally */}
        <div className="flex gap-1.5 flex-wrap flex-1 min-w-0">
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${cat.text} ${cat.bg} ${cat.border}`}>
            {CAT_ICON[article.category]} {article.category ?? 'General'}
          </span>
          {/* Tags: only first 2 on mobile, all on sm+ */}
          {tags.slice(0, 999).map((t, i) => (
            <span
              key={i}
              className={`inline-flex items-center gap-1 text-[10px] text-gray-500 bg-white/4 border border-gray-700 px-2 py-0.5 rounded-full whitespace-nowrap
                ${i >= 2 ? 'hidden sm:inline-flex' : ''}`}
            >
              <Tag size={8} /> {t}
            </span>
          ))}
        </div>

        {/* Action buttons — always visible, icon-only on mobile */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button
            onClick={() => navigate(`/knowledge/${article.id}`)}
            title="Baca artikel"
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 text-[11px] font-semibold hover:bg-blue-500/25 transition"
          >
            <BookOpen size={11} />
            <span className="hidden sm:inline">Baca</span>
          </button>
          <button
            onClick={() => onEdit(article)}
            title="Edit artikel"
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-700 text-gray-400 hover:bg-blue-500/10 hover:text-blue-400 hover:border-blue-500/30 transition"
          >
            <Edit2 size={11} />
          </button>
          <button
            onClick={() => onDelete(article)}
            title="Hapus artikel"
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-700 text-gray-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      {/* Title */}
      <button
        onClick={() => navigate(`/knowledge/${article.id}`)}
        className="text-left text-gray-100 font-semibold text-sm leading-snug hover:text-blue-400 transition mb-2 w-full"
      >
        {article.title}
      </button>

      {/* Bottom: meta + rating */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {/* Meta */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {[[User, author ?? 'Unknown'], [CalendarDays, article.date ?? '—'], [Eye, `${article.views ?? 0} views`]].map(([Ic, v], i) => (
            <span key={i} className="flex items-center gap-1 text-gray-500 text-[11px]">
              <Ic size={10} /> {v}
            </span>
          ))}
        </div>

        {/* Star rating */}
        <StarRating
          value={article.rating ?? 0}
          onChange={(val) => onRate(article.id, val)}
          size={12}
        />
      </div>
    </div>
  )
}

// ─── KnowledgePage ────────────────────────────────────────────
const KnowledgePage = () => {
  const { authFetch } = useAuth()

  const [articles,      setArticles]      = useState([])
  const [loading,       setLoading]       = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [editArticle,   setEditArticle]   = useState(null)
  const [deleteArticle, setDeleteArticle] = useState(null)
  const [toast,         setToast]         = useState(null)
  const [currentPage,   setCurrentPage]   = useState(1)
  const PER_PAGE = 5

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchArticles = async () => {
    try {
      const res = await authFetch('/api/knowledge')
      if (!res.ok) throw new Error('Gagal memuat artikel')
      const data = await res.json()
      setArticles(Array.isArray(data.data) ? data.data : data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { fetchArticles() }, [])

  const handleSave = async (id, form) => {
    setActionLoading(true)
    try {
      const isNew = id == null
      const res = await authFetch(
        isNew ? '/api/knowledge' : `/api/knowledge/${id}`,
        { method: isNew ? 'POST' : 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }
      )
      if (!res.ok) throw new Error('Gagal menyimpan artikel')
      const saved = await res.json()
      if (isNew) {
        setArticles(p => [saved.data ?? saved, ...p])
      } else {
        setArticles(p => p.map(a => a.id === id ? { ...a, ...form } : a))
      }
      setEditArticle(null)
      showToast(isNew ? 'Artikel berhasil ditambahkan ✓' : 'Artikel berhasil diperbarui ✓')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async (id) => {
    setActionLoading(true)
    try {
      const res = await authFetch(`/api/knowledge/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Gagal menghapus artikel')
      setArticles(p => p.filter(a => a.id !== id))
      setDeleteArticle(null)
      showToast('Artikel berhasil dihapus')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRate = async (id, rating) => {
    setArticles(p => p.map(a => a.id === id ? { ...a, rating } : a))
    try {
      await authFetch(`/api/knowledge/${id}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating }),
      })
    } catch {
      showToast('Gagal menyimpan rating', 'error')
    }
  }

  const { query, setQuery, results: searched } = useSearch(articles, ['title', 'category'])
  const { active, setActive, filtered }        = useFilter(searched, 'category')
  const cats = ['All', ...new Set(articles.map(a => a.category ?? 'General'))]

  useEffect(() => { setCurrentPage(1) }, [query, active])
  const lastPage  = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const paginated = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE)

  if (loading) return (
    <div className="flex flex-col gap-3 animate-pulse">
      {Array(5).fill(0).map((_, i) => <div key={i} className="h-20 bg-gray-800 rounded-xl" />)}
    </div>
  )

  return (
    <div className="flex flex-col gap-4 sm:gap-5">

      <PageHeader
        title="Knowledge Base"
        subtitle={`${articles.length} artikel tersedia`}
        action={
          <PrimaryButton icon={Plus} onClick={() => setEditArticle(false)}>
            <span className="hidden xs:inline">Tambah Artikel</span>
            <span className="xs:hidden">Tambah</span>
          </PrimaryButton>
        }
      />

      <SearchBar value={query} onChange={setQuery} placeholder="Cari artikel..." />

      <FilterTabs tabs={cats} active={active} onChange={setActive} />

      <div className="flex flex-col gap-2 sm:gap-2.5">
        {paginated.map(a => (
          <ArticleCard
            key={a.id}
            article={a}
            onEdit={setEditArticle}
            onDelete={setDeleteArticle}
            onRate={handleRate}
          />
        ))}
        {filtered.length === 0 && <EmptyState icon={BookOpen} message="Tidak ada artikel ditemukan" />}

        <Pagination
          currentPage={currentPage}
          lastPage={lastPage}
          total={filtered.length}
          perPage={PER_PAGE}
          onPageChange={(p) => { setCurrentPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
        />
      </div>

      {editArticle !== null && (
        <EditModal
          article={editArticle || null}
          onClose={() => !actionLoading && setEditArticle(null)}
          onSave={handleSave}
          loading={actionLoading}
        />
      )}

      {deleteArticle && (
        <DeleteModal
          article={deleteArticle}
          onClose={() => !actionLoading && setDeleteArticle(null)}
          onConfirm={handleDelete}
          loading={actionLoading}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}

export default KnowledgePage