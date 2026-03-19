// src/pages/ProjectsPage.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, FolderKanban, Users, Calendar, MoreHorizontal,
         Edit2, Trash2, X, Save, Circle } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { usePermission } from '../context/PermissionContext'
import { useAuth } from '../context/AppContext'
import { PageHeader, PrimaryButton, EmptyState, Avatar } from '../components/ui'
import useProjects from '../hooks/useProjects'

const PROJECT_COLORS = [
  '#6366f1','#8B5CF6','#EC4899','#EF4444',
  '#F59E0B','#10B981','#06B6D4','#3B82F6',
]

const STATUS_CFG = {
  active:    { label: 'Aktif',      color: '#10B981', bg: 'rgba(16,185,129,0.10)'  },
  on_hold:   { label: 'On Hold',    color: '#F59E0B', bg: 'rgba(245,158,11,0.10)'  },
  completed: { label: 'Selesai',    color: '#6366f1', bg: 'rgba(99,102,241,0.10)'  },
  cancelled: { label: 'Dibatalkan', color: '#EF4444', bg: 'rgba(239,68,68,0.10)'   },
}

// ─── Modal Shell ──────────────────────────────────────────────
const ModalShell = ({ onClose, children, maxWidth = 480, theme }) => (
  <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: theme.overlay, backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
    <div onClick={e => e.stopPropagation()} style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 16, width: '100%', maxWidth, boxShadow: '0 25px 60px rgba(0,0,0,0.35)', overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
      {children}
    </div>
  </div>
)

const makeLbl = (theme) => ({ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: theme.textMuted, marginBottom: 6 })
const makeInp = (theme) => ({ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.surfaceAlt, color: theme.text, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' })

// ─── Project Form Modal ───────────────────────────────────────
function ProjectFormModal({ project, users, onClose, onSave, loading, theme }) {
  const isEdit = !!project
  const [form, setForm] = useState({
    name: project?.name ?? '',
    description: project?.description ?? '',
    color: project?.color ?? '#6366f1',
    status: project?.status ?? 'active',
    start_date: project?.start_date ?? '',
    due_date: project?.due_date ?? '',
    member_ids: project?.members?.map(m => m.id) ?? [],
  })
  const [err, setErr] = useState({})

  const set = (k) => (e) => { setForm(f => ({ ...f, [k]: e.target.value })); setErr(p => ({ ...p, [k]: null })) }
  const toggleMember = (id) => setForm(f => ({ ...f, member_ids: f.member_ids.includes(id) ? f.member_ids.filter(x => x !== id) : [...f.member_ids, id] }))

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Nama project wajib diisi'
    return e
  }

  const handleSave = () => {
    const e = validate()
    if (Object.keys(e).length) { setErr(e); return }
    onSave(form)
  }

  const lbl = makeLbl(theme)
  const inp = makeInp(theme)

  return (
    <ModalShell onClose={onClose} theme={theme} maxWidth={520}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: `1px solid ${theme.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: form.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FolderKanban size={14} color="#fff" />
          </div>
          <h3 style={{ color: theme.text, fontSize: 14, fontWeight: 700, margin: 0 }}>{isEdit ? 'Edit Project' : 'Buat Project Baru'}</h3>
        </div>
        <button onClick={onClose} style={{ color: theme.textMuted, background: 'none', border: 'none', cursor: 'pointer' }}><X size={16} /></button>
      </div>

      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
        {/* Nama */}
        <div>
          <label style={lbl}>Nama Project *</label>
          <input value={form.name} onChange={set('name')} placeholder="Nama project..." style={{ ...inp, borderColor: err.name ? theme.danger : theme.border }} />
          {err.name && <p style={{ color: theme.danger, fontSize: 11, marginTop: 4 }}>{err.name}</p>}
        </div>

        {/* Deskripsi */}
        <div>
          <label style={lbl}>Deskripsi</label>
          <textarea value={form.description} onChange={set('description')} rows={3}
            placeholder="Deskripsi singkat project..."
            style={{ ...inp, resize: 'none' }} />
        </div>

        {/* Warna */}
        <div>
          <label style={lbl}>Warna</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {PROJECT_COLORS.map(c => (
              <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: form.color === c ? `3px solid ${theme.text}` : '3px solid transparent', cursor: 'pointer', transition: 'all 0.15s' }} />
            ))}
          </div>
        </div>

        {/* Status + Tanggal */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={lbl}>Status</label>
            <select value={form.status} onChange={set('status')} style={inp}>
              {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Deadline</label>
            <input type="date" value={form.due_date} onChange={set('due_date')} style={inp} />
          </div>
        </div>

        {/* Members */}
        {users.length > 0 && (
          <div>
            <label style={lbl}>Member ({form.member_ids.length} dipilih)</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 160, overflowY: 'auto' }}>
              {users.map(u => {
                const selected = form.member_ids.includes(u.id)
                return (
                  <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 8, border: `1px solid ${selected ? theme.accent + '55' : theme.border}`, background: selected ? `${theme.accent}0d` : 'transparent', cursor: 'pointer', transition: 'all 0.15s' }}>
                    <input type="checkbox" checked={selected} onChange={() => toggleMember(u.id)} style={{ accentColor: theme.accent }} />
                    <Avatar initials={(u.name ?? '').slice(0, 2).toUpperCase()} size={24} color={u.color} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: theme.text }}>{u.name}</div>
                      <div style={{ fontSize: 10, color: theme.textMuted }}>{u.role}</div>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 20px', borderTop: `1px solid ${theme.border}`, flexShrink: 0 }}>
        <button onClick={onClose} disabled={loading} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${theme.border}`, background: 'transparent', color: theme.textMuted, fontSize: 13, cursor: 'pointer' }}>Batal</button>
        <button onClick={handleSave} disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: form.color, color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
          <Save size={13} />{loading ? 'Menyimpan...' : isEdit ? 'Simpan' : 'Buat Project'}
        </button>
      </div>
    </ModalShell>
  )
}

// ─── Project Card ─────────────────────────────────────────────
function ProjectCard({ project, onEdit, onDelete, canManage, theme, onClick }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const status = STATUS_CFG[project.status] ?? STATUS_CFG.active

  const progress = project.task_stats?.total > 0
    ? Math.round(((project.task_stats?.completed ?? 0) / project.task_stats.total) * 100)
    : 0

  return (
    <div
      onClick={onClick}
      style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 14, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; e.currentTarget.style.borderColor = project.color + '66' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = theme.border }}
    >
      {/* Color bar atas */}
      <div style={{ height: 4, background: project.color }} />

      <div style={{ padding: '16px 16px 14px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: project.color + '20', border: `1.5px solid ${project.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FolderKanban size={17} color={project.color} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: theme.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project.name}</div>
              <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: status.bg, color: status.color }}>{status.label}</span>
            </div>
          </div>
          {canManage && (
            <div style={{ position: 'relative' }}>
              <button onClick={e => { e.stopPropagation(); setMenuOpen(o => !o) }}
                style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, border: `1px solid ${theme.border}`, background: 'transparent', color: theme.textMuted, cursor: 'pointer' }}>
                <MoreHorizontal size={14} />
              </button>
              {menuOpen && (
                <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', right: 0, top: 32, background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 20, minWidth: 140, overflow: 'hidden' }}>
                  <button onClick={() => { setMenuOpen(false); onEdit(project) }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', background: 'none', border: 'none', fontSize: 12, color: theme.text, cursor: 'pointer', textAlign: 'left' }}>
                    <Edit2 size={13} color={theme.accent} /> Edit
                  </button>
                  <button onClick={() => { setMenuOpen(false); onDelete(project) }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', background: 'none', border: 'none', fontSize: 12, color: theme.danger, cursor: 'pointer', textAlign: 'left' }}>
                    <Trash2 size={13} /> Hapus
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Deskripsi */}
        {project.description && (
          <p style={{ fontSize: 12, color: theme.textMuted, marginBottom: 12, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {project.description}
          </p>
        )}

        {/* Progress bar */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 10, color: theme.textMuted }}>Progress</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: theme.text }}>{progress}%</span>
          </div>
          <div style={{ height: 4, borderRadius: 2, background: theme.border, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: project.color, borderRadius: 2, transition: 'width 0.5s' }} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Members avatars */}
          <div style={{ display: 'flex' }}>
            {(project.members ?? []).slice(0, 4).map((m, i) => (
              <div key={m.id} style={{ width: 24, height: 24, borderRadius: '50%', background: m.color ?? '#6366f1', border: `2px solid ${theme.surface}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff', marginLeft: i > 0 ? -6 : 0 }}>
                {(m.name ?? '').slice(0, 2).toUpperCase()}
              </div>
            ))}
            {(project.members?.length ?? 0) > 4 && (
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: theme.surfaceAlt, border: `2px solid ${theme.surface}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: theme.textMuted, marginLeft: -6 }}>
                +{project.members.length - 4}
              </div>
            )}
          </div>
          {/* Due date */}
          {project.due_date && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: theme.textMuted }}>
              <Calendar size={11} />
              {new Date(project.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Toast ────────────────────────────────────────────────────
function Toast({ message, type = 'success' }) {
  return <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 50, padding: '10px 16px', borderRadius: 12, color: '#fff', fontSize: 13, fontWeight: 500, boxShadow: '0 10px 30px rgba(0,0,0,0.3)', background: type === 'success' ? '#059669' : '#DC2626' }}>{message}</div>
}

// ─── ProjectsPage ─────────────────────────────────────────────
export default function ProjectsPage() {
  const { T: theme } = useTheme()
  const { isManagerIT } = usePermission()
  const { user } = useAuth()
  const navigate = useNavigate()

  const { projects, loading, error, fetchProjects, createProject, updateProject, deleteProject, syncMembers } = useProjects()
  const [users, setUsers]           = useState([])
  const [formModal, setFormModal]   = useState({ open: false, project: null })
  const [deleteModal, setDeleteModal] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [toast, setToast]           = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }

  useEffect(() => {
    fetchProjects()
    // Load users untuk form member
    fetch('/api/users', { headers: { Accept: 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(r => r.json()).then(j => setUsers(j.data ?? []))
  }, [fetchProjects])

  const handleSave = async (form) => {
    setActionLoading(true)
    try {
      if (formModal.project) {
        // Update data project
        await updateProject(formModal.project.id, form)
        // Sync members secara terpisah (endpoint berbeda)
        await syncMembers(formModal.project.id, form.member_ids ?? [])
        showToast('Project berhasil diupdate ✓')
      } else {
        await createProject(form)
        showToast('Project berhasil dibuat ✓')
      }
      setFormModal({ open: false, project: null })
    } catch (e) { showToast(e.message, 'error') }
    finally { setActionLoading(false) }
  }

  const handleDelete = async () => {
    setActionLoading(true)
    try {
      await deleteProject(deleteModal.id)
      setDeleteModal(null)
      showToast('Project dihapus')
    } catch (e) { showToast(e.message, 'error') }
    finally { setActionLoading(false) }
  }

  const filtered = filterStatus === 'all' ? projects : projects.filter(p => p.status === filterStatus)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="Project Management"
        subtitle={loading ? 'Memuat...' : `${projects.length} project`}
        action={isManagerIT && (
          <PrimaryButton icon={Plus} onClick={() => setFormModal({ open: true, project: null })}>
            Buat Project
          </PrimaryButton>
        )}
      />

      {/* Filter status */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {[['all', 'Semua'], ...Object.entries(STATUS_CFG).map(([k, v]) => [k, v.label])].map(([k, label]) => {
          const active = filterStatus === k
          const cfg    = STATUS_CFG[k]
          return (
            <button key={k} onClick={() => setFilterStatus(k)}
              style={{ padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: active ? 600 : 400, border: `1px solid ${active && cfg ? cfg.color + '55' : theme.border}`, background: active && cfg ? cfg.bg : 'transparent', color: active && cfg ? cfg.color : theme.textMuted, cursor: 'pointer', transition: 'all 0.15s' }}>
              {label}
              <span style={{ marginLeft: 4, opacity: 0.7 }}>
                ({k === 'all' ? projects.length : projects.filter(p => p.status === k).length})
              </span>
            </button>
          )
        })}
      </div>

      {error && <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: theme.danger, fontSize: 12 }}>{error}</div>}

      {/* Grid project cards */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ height: 200, borderRadius: 14, background: theme.surfaceAlt, animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: 12 }}>
          <FolderKanban size={40} color={theme.textMuted} />
          <div style={{ fontSize: 14, fontWeight: 600, color: theme.text }}>Belum ada project</div>
          <div style={{ fontSize: 12, color: theme.textMuted }}>
            {isManagerIT ? 'Klik "Buat Project" untuk memulai.' : 'Anda belum ditambahkan ke project manapun.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {filtered.map(p => (
            <ProjectCard
              key={p.id}
              project={p}
              canManage={isManagerIT}
              theme={theme}
              onClick={() => navigate(`/projects/${p.id}`)}
              onEdit={async (proj) => {
                // Fetch detail project untuk dapat members yang lengkap
                try {
                  const res = await fetch(`/api/projects/${proj.id}`, {
                    headers: { Accept: 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` }
                  })
                  const json = await res.json()
                  setFormModal({ open: true, project: json.success ? json.data : proj })
                } catch {
                  setFormModal({ open: true, project: proj })
                }
              }}
              onDelete={setDeleteModal}
            />
          ))}
        </div>
      )}

      {/* Form Modal */}
      {formModal.open && (
        <ProjectFormModal
          project={formModal.project}
          users={users}
          onClose={() => !actionLoading && setFormModal({ open: false, project: null })}
          onSave={handleSave}
          loading={actionLoading}
          theme={theme}
        />
      )}

      {/* Delete Confirm */}
      {deleteModal && (
        <div onClick={() => setDeleteModal(null)} style={{ position: 'fixed', inset: 0, background: theme.overlay, backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 14, padding: 24, width: 360, textAlign: 'center', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <Trash2 size={22} color={theme.danger} />
            </div>
            <h3 style={{ color: theme.text, fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Hapus Project?</h3>
            <p style={{ color: theme.textMuted, fontSize: 12, marginBottom: 20 }}>
              <strong style={{ color: theme.text }}>{deleteModal.name}</strong> dan semua task-nya akan dihapus permanen.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
              <button onClick={() => setDeleteModal(null)} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${theme.border}`, background: 'transparent', color: theme.textMuted, fontSize: 12, cursor: 'pointer' }}>Batal</button>
              <button onClick={handleDelete} disabled={actionLoading} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: '#DC2626', color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                <Trash2 size={12} />{actionLoading ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.msg} type={toast.type} />}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </div>
  )
}
