import { useState, useEffect } from 'react'
import {
  Plus, Wifi, Mail, Printer, Layers, Cpu, BookOpen,
  User, CalendarDays, Eye, Star, X, Save, AlertTriangle,
  Edit2, Trash2, Tag, FileText,
} from 'lucide-react'
import { T } from '../theme'
import {
  Card, PageHeader, SearchBar, FilterTabs,
  PrimaryButton, EmptyState,
} from '../components/ui'
import { useAuth } from '../context/AppContext'
import useSearch from '../hooks/useSearch'
import useFilter from '../hooks/useFilter'

/* ─── Konstanta ──────────────────────────────────────────── */
const CAT_COLOR = {
  Network:  '#06B6D4',
  Email:    '#8B5CF6',
  Printer:  '#F59E0B',
  Software: '#3B8BFF',
  Hardware: '#10B981',
}
const CAT_ICON = {
  Network:  <Wifi size={11} />,
  Email:    <Mail size={11} />,
  Printer:  <Printer size={11} />,
  Software: <Layers size={11} />,
  Hardware: <Cpu size={11} />,
}
const CATEGORIES = ['Network', 'Email', 'Printer', 'Software', 'Hardware']

/* ─── Shared Styles ──────────────────────────────────────── */
const overlayStyle = {
  position: 'fixed', inset: 0,
  background: 'rgba(0,0,0,0.55)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1000,
}
const modalBase = {
  background: T.surface ?? '#1e2433',
  borderRadius: 12,
  boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
  maxWidth: '90vw',
  overflow: 'hidden',
}
const inputStyle = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: 6,
  border: `1px solid ${T.border}`,
  fontSize: 13,
  color: T.text,
  background: T.bg ?? '#131929',
  outline: 'none',
  boxSizing: 'border-box',
  colorScheme: 'dark',
}
const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 600,
  color: T.textDim, textTransform: 'uppercase',
  letterSpacing: '0.06em', marginBottom: 4,
}
const iconBtn = (color) => ({
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: 28, height: 28, borderRadius: 6,
  border: `1px solid ${T.border}`,
  background: 'none', cursor: 'pointer', color,
  transition: 'background 0.15s',
})

/* ─── Modal: View Artikel ────────────────────────────────── */
const ViewModal = ({ article, onClose, onEdit, onDelete }) => {
  const category = article.category ?? 'General'
  const color = CAT_COLOR[category] ?? T.accent
  const author = typeof article.author === 'object' ? article.author?.name : article.author
  const tags = Array.isArray(article.tags) ? article.tags : []

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div
        style={{ ...modalBase, width: 620, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          padding: '18px 20px 14px', borderBottom: `1px solid ${T.border}`, gap: 12,
        }}>
          <div style={{ flex: 1 }}>
            {/* Category badge */}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: `${color}15`, border: `1px solid ${color}30`,
              color, padding: '2px 9px', borderRadius: 20, fontSize: 10,
              fontWeight: 600, marginBottom: 8,
            }}>
              {CAT_ICON[category]}
              {category}
            </span>
            <h2 style={{ color: T.text, fontSize: 17, fontWeight: 700, lineHeight: 1.4, margin: 0 }}>
              {article.title}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textDim, padding: 4, display: 'flex' }}>
            <X size={16} />
          </button>
        </div>

        {/* Meta */}
        <div style={{ padding: '10px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {[
            [User, author ?? 'Unknown'],
            [CalendarDays, article.date ?? '-'],
            [Eye, `${article.views ?? 0} views`],
          ].map(([Ic, v], i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, color: T.textDim, fontSize: 11 }}>
              <Ic size={10} /> {v}
            </span>
          ))}
          {/* Rating */}
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            {[1,2,3,4,5].map(i => (
              <Star key={i} size={11}
                fill={i <= Math.round(article.rating ?? 0) ? T.warning : 'none'}
                color={T.warning}
              />
            ))}
            <span style={{ color: T.textMuted, fontSize: 11, marginLeft: 3 }}>{article.rating ?? 0}</span>
          </span>
        </div>

        {/* Konten */}
        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
          {article.content ? (
            <p style={{ color: T.text, fontSize: 13, lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>
              {article.content}
            </p>
          ) : (
            <p style={{ color: T.textDim, fontSize: 13, fontStyle: 'italic' }}>
              Konten artikel tidak tersedia.
            </p>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 16 }}>
              <Tag size={11} color={T.textDim} style={{ marginTop: 2 }} />
              {tags.map((t, i) => (
                <span key={i} style={{
                  background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`,
                  color: T.textDim, padding: '2px 7px', borderRadius: 20, fontSize: 10,
                }}>#{t}</span>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end', gap: 8,
          padding: '12px 20px', borderTop: `1px solid ${T.border}`,
        }}>
          <button onClick={onDelete} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 6, border: 'none',
            background: `${T.danger}20`, color: T.danger,
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>
            <Trash2 size={12} /> Hapus
          </button>
          <button onClick={onEdit} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 6, border: 'none',
            background: T.primary, color: '#fff',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>
            <Edit2 size={12} /> Edit
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Modal: Edit / Tambah Artikel ──────────────────────── */
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
    <div style={overlayStyle} onClick={onClose}>
      <div
        style={{ ...modalBase, width: 560, display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: `1px solid ${T.border}`,
        }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>
            {isNew ? 'Tambah Artikel' : 'Edit Artikel'}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textDim, padding: 4, display: 'flex' }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
          <div>
            <label style={labelStyle}>Judul</label>
            <input style={inputStyle} value={form.title} onChange={set('title')} placeholder="Judul artikel..." />
          </div>

          <div>
            <label style={labelStyle}>Kategori</label>
            <select style={inputStyle} value={form.category} onChange={set('category')}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Konten</label>
            <textarea
              style={{ ...inputStyle, minHeight: 140, resize: 'vertical', fontFamily: 'inherit' }}
              value={form.content}
              onChange={set('content')}
              placeholder="Isi artikel..."
            />
          </div>

          <div>
            <label style={labelStyle}>Tags <span style={{ fontWeight: 400, textTransform: 'none' }}>(pisah dengan koma)</span></label>
            <input style={inputStyle} value={form.tags} onChange={set('tags')} placeholder="vpn, network, setup" />
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end', gap: 8,
          padding: '12px 20px', borderTop: `1px solid ${T.border}`,
        }}>
          <button onClick={onClose} disabled={loading} style={{
            padding: '7px 14px', borderRadius: 6, border: `1px solid ${T.border}`,
            background: 'transparent', fontSize: 12, cursor: 'pointer', color: T.text,
          }}>
            Batal
          </button>
          <button
            onClick={() => onSave(article?.id ?? null, {
              ...form,
              tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
            })}
            disabled={loading || !form.title.trim()}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 6, border: 'none',
              background: T.primary, color: '#fff',
              fontSize: 12, fontWeight: 600,
              cursor: (loading || !form.title.trim()) ? 'not-allowed' : 'pointer',
              opacity: (loading || !form.title.trim()) ? 0.6 : 1,
            }}
          >
            <Save size={12} />
            {loading ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Modal: Konfirmasi Hapus ────────────────────────────── */
const DeleteModal = ({ article, onClose, onConfirm, loading }) => (
  <div style={overlayStyle} onClick={onClose}>
    <div
      style={{ ...modalBase, width: 380, padding: 24, textAlign: 'center' }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        background: `${T.danger}15`, display: 'flex',
        alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
      }}>
        <AlertTriangle size={22} color={T.danger} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 8 }}>Hapus Artikel?</div>
      <div style={{ fontSize: 13, color: T.textDim, marginBottom: 20 }}>
        <strong style={{ color: T.text }}>{article.title}</strong> akan dihapus secara permanen.
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        <button onClick={onClose} disabled={loading} style={{
          padding: '8px 18px', borderRadius: 6, border: `1px solid ${T.border}`,
          background: 'transparent', fontSize: 12, cursor: 'pointer', color: T.text,
        }}>
          Batal
        </button>
        <button onClick={() => onConfirm(article.id)} disabled={loading} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 18px', borderRadius: 6, border: 'none',
          background: T.danger, color: '#fff', fontSize: 12, fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
        }}>
          <Trash2 size={12} />
          {loading ? 'Menghapus...' : 'Ya, Hapus'}
        </button>
      </div>
    </div>
  </div>
)

/* ─── Toast ──────────────────────────────────────────────── */
const Toast = ({ message, type = 'success' }) => (
  <div style={{
    position: 'fixed', bottom: 24, right: 24,
    padding: '10px 16px', borderRadius: 8,
    background: type === 'success' ? T.success : T.danger,
    color: '#fff', fontSize: 13, fontWeight: 500,
    boxShadow: '0 4px 20px rgba(0,0,0,0.25)', zIndex: 2000,
  }}>
    {message}
  </div>
)

/* ─── Article Card ───────────────────────────────────────── */
const ArticleCard = ({ article, onView, onEdit, onDelete }) => {
  const category = article.category ?? 'General'
  const color = CAT_COLOR[category] ?? T.accent
  const author = typeof article.author === 'object' ? article.author?.name : article.author
  const tags = Array.isArray(article.tags) ? article.tags : []

  return (
    <Card hover style={{ padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1 }}>

          {/* CATEGORY + TAGS */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: `${color}15`, border: `1px solid ${color}30`,
              color, padding: '2px 9px', borderRadius: 20, fontSize: 10, fontWeight: 600,
            }}>
              {CAT_ICON[category]}
              {category}
            </span>
            {tags.map((t, i) => (
              <span key={`${article.id}-tag-${i}`} style={{
                background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`,
                color: T.textDim, padding: '2px 7px', borderRadius: 20, fontSize: 10,
              }}>
                #{t}
              </span>
            ))}
          </div>

          {/* TITLE */}
          <h3 style={{ color: T.text, fontWeight: 600, fontSize: 14, lineHeight: 1.45, margin: 0 }}>
            {article.title}
          </h3>

          {/* META */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
            {[
              [User, author ?? 'Unknown'],
              [CalendarDays, article.date ?? '-'],
              [Eye, `${article.views ?? 0} views`],
            ].map(([Ic, v], i) => (
              <span key={`meta-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 4, color: T.textDim, fontSize: 11 }}>
                <Ic size={10} /> {v}
              </span>
            ))}
          </div>

        </div>

        {/* RIGHT SIDE */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>

          {/* RATING */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            {[1,2,3,4,5].map(i => (
              <Star key={`star-${i}`} size={11}
                fill={i <= Math.round(article.rating ?? 0) ? T.warning : 'none'}
                color={T.warning}
              />
            ))}
            <span style={{ color: T.textMuted, fontSize: 11, marginLeft: 4 }}>{article.rating ?? 0}</span>
          </div>

          {/* ACTION BUTTONS */}
          <div style={{ display: 'flex', gap: 6 }}>
            {/* Baca / View */}
            <button
              onClick={() => onView(article)}
              title="Lihat artikel"
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: T.accentSoft, border: `1px solid ${T.borderAccent}`,
                color: T.accent, padding: '5px 10px', borderRadius: 8,
                fontSize: 11, cursor: 'pointer', fontWeight: 600,
              }}
            >
              <BookOpen size={11} /> Baca
            </button>

            {/* Edit */}
            <button
              onClick={() => onEdit(article)}
              title="Edit artikel"
              style={iconBtn(T.primary)}
              onMouseEnter={(e) => (e.currentTarget.style.background = `${T.primary}15`)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
            >
              <Edit2 size={11} />
            </button>

            {/* Hapus */}
            <button
              onClick={() => onDelete(article)}
              title="Hapus artikel"
              style={iconBtn(T.danger)}
              onMouseEnter={(e) => (e.currentTarget.style.background = `${T.danger}15`)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
            >
              <Trash2 size={11} />
            </button>
          </div>

        </div>
      </div>
    </Card>
  )
}

/* ─── Halaman Utama ──────────────────────────────────────── */
const KnowledgePage = () => {
  const { authFetch } = useAuth()

  const [articles, setArticles]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Modal state
  const [viewArticle, setViewArticle]     = useState(null)
  const [editArticle, setEditArticle]     = useState(null) // null = tutup, false = baru, obj = edit
  const [deleteArticle, setDeleteArticle] = useState(null)
  const [toast, setToast]                 = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  /* ── Fetch Artikel ── */
  const fetchArticles = async () => {
    try {
      const res = await authFetch('/api/knowledge')
      if (!res.ok) throw new Error('Gagal memuat artikel')
      const data = await res.json()
      setArticles(Array.isArray(data.data) ? data.data : data)
    } catch (err) {
      console.error('Fetch Knowledge Error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchArticles() }, [])

  /* ── Simpan (create / update) ── */
  const handleSave = async (id, form) => {
    setActionLoading(true)
    try {
      const isNew = id == null
      const res = await authFetch(
        isNew ? '/api/knowledge' : `/api/knowledge/${id}`,
        {
          method: isNew ? 'POST' : 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        }
      )
      if (!res.ok) throw new Error('Gagal menyimpan artikel')

      const saved = await res.json()
      const savedArticle = saved.data ?? saved

      if (isNew) {
        setArticles((prev) => [savedArticle, ...prev])
      } else {
        setArticles((prev) =>
          prev.map((a) => (a.id === id ? { ...a, ...form } : a))
        )
      }
      setEditArticle(null)
      showToast(isNew ? 'Artikel berhasil ditambahkan ✓' : 'Artikel berhasil diperbarui ✓')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  /* ── Hapus ── */
  const handleDelete = async (id) => {
    setActionLoading(true)
    try {
      const res = await authFetch(`/api/knowledge/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Gagal menghapus artikel')
      setArticles((prev) => prev.filter((a) => a.id !== id))
      setDeleteArticle(null)
      setViewArticle(null)
      showToast('Artikel berhasil dihapus')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  /* ── Search & Filter ── */
  const { query, setQuery, results: searched } =
    useSearch(articles, ['title', 'category'])

  const { active, setActive, filtered } =
    useFilter(searched, 'category')

  const cats = ['All', ...new Set(articles.map((a) => a.category ?? 'General'))]

  if (loading) {
    return <div style={{ color: T.textMuted }}>Memuat artikel...</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      <PageHeader
        title="Knowledge Base"
        subtitle={`${articles.length} artikel tersedia`}
        action={
          <PrimaryButton icon={Plus} onClick={() => setEditArticle(false)}>
            Tambah Artikel
          </PrimaryButton>
        }
      />

      <SearchBar value={query} onChange={setQuery} placeholder="Cari artikel..." />

      <FilterTabs tabs={cats} active={active} onChange={setActive} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map((a) => (
          <ArticleCard
            key={`article-${a.id}`}
            article={a}
            onView={setViewArticle}
            onEdit={setEditArticle}
            onDelete={setDeleteArticle}
          />
        ))}

        {filtered.length === 0 && (
          <EmptyState icon={BookOpen} message="Tidak ada artikel ditemukan" />
        )}
      </div>

      {/* Modal View */}
      {viewArticle && (
        <ViewModal
          article={viewArticle}
          onClose={() => setViewArticle(null)}
          onEdit={() => { setViewArticle(null); setEditArticle(viewArticle) }}
          onDelete={() => { setViewArticle(null); setDeleteArticle(viewArticle) }}
        />
      )}

      {/* Modal Edit / Tambah */}
      {editArticle !== null && (
        <EditModal
          article={editArticle || null}
          onClose={() => !actionLoading && setEditArticle(null)}
          onSave={handleSave}
          loading={actionLoading}
        />
      )}

      {/* Modal Hapus */}
      {deleteArticle && (
        <DeleteModal
          article={deleteArticle}
          onClose={() => !actionLoading && setDeleteArticle(null)}
          onConfirm={handleDelete}
          loading={actionLoading}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} />}

    </div>
  )
}

export default KnowledgePage