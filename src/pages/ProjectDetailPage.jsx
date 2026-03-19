// src/pages/ProjectDetailPage.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Calendar, Edit2, Trash2, X, Save,
         FolderKanban, CheckSquare, Clock, User, Loader } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const PRIORITY_CFG = {
  low:    { label: 'Low',    color: '#94A3B8', bg: 'rgba(148,163,184,0.12)' },
  medium: { label: 'Medium', color: '#6366f1', bg: 'rgba(99,102,241,0.12)'  },
  high:   { label: 'High',   color: '#F59E0B', bg: 'rgba(245,158,11,0.12)'  },
  urgent: { label: 'Urgent', color: '#EF4444', bg: 'rgba(239,68,68,0.12)'   },
}

const getHeaders = () => ({
  Accept: 'application/json',
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
})

const makeLbl = (theme) => ({ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: theme.textMuted, marginBottom: 6 })
const makeInp = (theme, err) => ({ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${err ? theme.danger : theme.border}`, background: theme.surfaceAlt, color: theme.text, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' })

// ─── Toast ────────────────────────────────────────────────────
function Toast({ message, type = 'success' }) {
  return <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 50, padding: '10px 16px', borderRadius: 12, color: '#fff', fontSize: 13, fontWeight: 500, boxShadow: '0 10px 30px rgba(0,0,0,0.3)', background: type === 'success' ? '#059669' : '#DC2626' }}>{message}</div>
}

// ─── Task Form Modal ──────────────────────────────────────────
function TaskFormModal({ task, columns, members, defaultColumnId, onClose, onSave, loading, theme }) {
  const isEdit = !!task
  const [form, setForm] = useState({
    title:       task?.title ?? '',
    description: task?.description ?? '',
    column_id:   String(task?.column_id ?? defaultColumnId ?? columns[0]?.id ?? ''),
    priority:    task?.priority ?? 'medium',
    assigned_to: String(task?.assignee?.id ?? task?.assigned_to ?? ''),
    due_date:    task?.due_date ?? '',
  })
  const [err, setErr] = useState({})
  const set = k => e => { setForm(f => ({ ...f, [k]: e.target.value })); setErr(p => ({ ...p, [k]: null })) }
  const lbl = makeLbl(theme)

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: theme.overlay, backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 16, width: '100%', maxWidth: 480, boxShadow: '0 25px 60px rgba(0,0,0,0.35)', overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: `1px solid ${theme.border}`, flexShrink: 0 }}>
          <h3 style={{ color: theme.text, fontSize: 14, fontWeight: 700, margin: 0 }}>{isEdit ? 'Edit Task' : 'Tambah Task'}</h3>
          <button onClick={onClose} style={{ color: theme.textMuted, background: 'none', border: 'none', cursor: 'pointer' }}><X size={16} /></button>
        </div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
          <div>
            <label style={lbl}>Judul Task *</label>
            <input value={form.title} onChange={set('title')} placeholder="Judul task..." style={makeInp(theme, err.title)} />
            {err.title && <p style={{ color: theme.danger, fontSize: 11, marginTop: 4 }}>{err.title}</p>}
          </div>
          <div>
            <label style={lbl}>Deskripsi</label>
            <textarea value={form.description} onChange={set('description')} rows={3} placeholder="Deskripsi task..." style={{ ...makeInp(theme), resize: 'none' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Kolom</label>
              <select value={form.column_id} onChange={set('column_id')} style={makeInp(theme)}>
                {columns.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Prioritas</label>
              <select value={form.priority} onChange={set('priority')} style={makeInp(theme)}>
                {Object.entries(PRIORITY_CFG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Assignee</label>
              <select value={form.assigned_to} onChange={set('assigned_to')} style={makeInp(theme)}>
                <option value="">— Tidak ada —</option>
                {members.map(m => <option key={m.id} value={String(m.id)}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Due Date</label>
              <input type="date" value={form.due_date} onChange={set('due_date')} style={makeInp(theme)} />
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 20px', borderTop: `1px solid ${theme.border}`, flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${theme.border}`, background: 'transparent', color: theme.textMuted, fontSize: 13, cursor: 'pointer' }}>Batal</button>
          <button onClick={() => {
            if (!form.title.trim()) { setErr({ title: 'Wajib diisi' }); return }
            onSave({ ...form, column_id: Number(form.column_id), assigned_to: form.assigned_to ? Number(form.assigned_to) : null })
          }} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: theme.accent, color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            <Save size={13} />{loading ? 'Menyimpan...' : isEdit ? 'Simpan' : 'Tambah Task'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Task Card ────────────────────────────────────────────────
function TaskCard({ task, onEdit, onDelete, theme, onDragStart, onDragEnd }) {
  const pri = PRIORITY_CFG[task.priority] ?? PRIORITY_CFG.medium
  const isOverdue = task.due_date && new Date(task.due_date) < new Date()
  return (
    <div draggable onDragStart={e => onDragStart(e, task)} onDragEnd={onDragEnd}
      style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 10, padding: '10px 12px', cursor: 'grab', transition: 'all 0.15s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = theme.accent + '55'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.boxShadow = 'none' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: pri.bg, color: pri.color }}>{pri.label}</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => onEdit(task)} style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, border: 'none', background: 'transparent', color: theme.textMuted, cursor: 'pointer' }}><Edit2 size={11} /></button>
          <button onClick={() => onDelete(task)} style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, border: 'none', background: 'transparent', color: theme.textMuted, cursor: 'pointer' }}><Trash2 size={11} /></button>
        </div>
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: theme.text, marginBottom: 8, lineHeight: 1.4 }}>{task.title}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {task.assignee ? (
          <div title={task.assignee.name} style={{ width: 22, height: 22, borderRadius: '50%', background: task.assignee.color ?? '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: '#fff' }}>
            {(task.assignee.name ?? '').slice(0, 2).toUpperCase()}
          </div>
        ) : (
          <div style={{ width: 22, height: 22, borderRadius: '50%', background: theme.surfaceAlt, border: `1.5px dashed ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={10} color={theme.textMuted} />
          </div>
        )}
        {task.due_date && (
          <span style={{ fontSize: 10, color: isOverdue ? theme.danger : theme.textMuted, display: 'flex', alignItems: 'center', gap: 3 }}>
            <Clock size={10} />
            {new Date(task.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Kanban Column ────────────────────────────────────────────
function KanbanColumn({ column, onAddTask, onEditTask, onDeleteTask, theme, onDragStart, onDragEnd, onDragOver, onDrop, isDragOver }) {
  return (
    <div onDragOver={e => { e.preventDefault(); onDragOver(column.id) }} onDrop={e => onDrop(e, column.id)}
      style={{ minWidth: 260, width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, padding: '0 2px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: column.color }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: theme.text }}>{column.name}</span>
          <span style={{ fontSize: 10, color: theme.textMuted, background: theme.surfaceAlt, border: `1px solid ${theme.border}`, padding: '1px 7px', borderRadius: 20 }}>{(column.tasks ?? []).length}</span>
        </div>
        <button onClick={() => onAddTask(column.id)}
          style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, border: `1px solid ${theme.border}`, background: 'transparent', color: theme.textMuted, cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.background = theme.accent; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = theme.accent }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = theme.textMuted; e.currentTarget.style.borderColor = theme.border }}>
          <Plus size={13} />
        </button>
      </div>
      <div style={{ flex: 1, minHeight: 80, padding: 8, borderRadius: 12, background: isDragOver ? (theme.accent + '0d') : theme.surfaceAlt, border: `1.5px dashed ${isDragOver ? theme.accent : 'transparent'}`, display: 'flex', flexDirection: 'column', gap: 8, transition: 'all 0.2s' }}>
        {(column.tasks ?? []).map(task => (
          <TaskCard key={task.id} task={task} theme={theme} onEdit={onEditTask} onDelete={onDeleteTask} onDragStart={onDragStart} onDragEnd={onDragEnd} />
        ))}
        {(column.tasks ?? []).length === 0 && !isDragOver && (
          <div style={{ textAlign: 'center', padding: '20px 10px', color: theme.textMuted, fontSize: 11 }}>Belum ada task</div>
        )}
      </div>
    </div>
  )
}

// ─── ProjectDetailPage ────────────────────────────────────────
export default function ProjectDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { T: theme } = useTheme()

  // State lokal — tidak bergantung useProjects global
  const [project, setProject]       = useState(null)
  const [loading, setLoading]       = useState(true)
  const [taskModal, setTaskModal]   = useState({ open: false, task: null, columnId: null })
  const [actionLoading, setActionLoading] = useState(false)
  const [toast, setToast]           = useState(null)
  const [dragOverCol, setDragOverCol] = useState(null)
  const dragTask = useRef(null)

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }

  // ── Fetch project detail ──────────────────────────────────────
  const loadProject = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/projects/${id}`, { headers: getHeaders() })
      const json = await res.json()
      if (json.success) setProject(json.data)
      else throw new Error(json.message)
    } catch (e) {
      showToast(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { loadProject() }, [loadProject])

  // ── Task CRUD ─────────────────────────────────────────────────
  const handleSaveTask = async (form) => {
    setActionLoading(true)
    try {
      if (taskModal.task) {
        const res  = await fetch(`/api/projects/${id}/tasks/${taskModal.task.id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(form) })
        const json = await res.json()
        if (!json.success) throw new Error(json.message)
        const updatedTask   = json.data
        const oldColumnId   = taskModal.task.column_id
        const newColumnId   = updatedTask.column_id
        const columnChanged = Number(oldColumnId) !== Number(newColumnId)

        setProject(prev => ({
          ...prev,
          columns: prev.columns.map(col => {
            if (columnChanged) {
              if (col.id === oldColumnId)
                return { ...col, tasks: (col.tasks ?? []).filter(t => t.id !== updatedTask.id) }
              if (col.id === newColumnId)
                return { ...col, tasks: [...(col.tasks ?? []), updatedTask] }
              return col
            }
            return { ...col, tasks: (col.tasks ?? []).map(t => t.id === updatedTask.id ? updatedTask : t) }
          }),
        }))
        showToast('Task diupdate ✓')
      } else {
        const res  = await fetch(`/api/projects/${id}/tasks`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(form) })
        const json = await res.json()
        if (!json.success) throw new Error(json.message || Object.values(json.errors ?? {}).flat()[0])
        // Tambah task ke kolom yang sesuai
        setProject(prev => ({
          ...prev,
          columns: prev.columns.map(col =>
            col.id === json.data.column_id
              ? { ...col, tasks: [...(col.tasks ?? []), json.data] }
              : col
          ),
        }))
        showToast('Task ditambahkan ✓')
      }
      setTaskModal({ open: false, task: null, columnId: null })
    } catch (e) { showToast(e.message, 'error') }
    finally { setActionLoading(false) }
  }

  const handleDeleteTask = async (task) => {
    if (!window.confirm(`Hapus task "${task.title}"?`)) return
    try {
      const res = await fetch(`/api/projects/${id}/tasks/${task.id}`, { method: 'DELETE', headers: getHeaders() })
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
      setProject(prev => ({
        ...prev,
        columns: prev.columns.map(col => ({ ...col, tasks: (col.tasks ?? []).filter(t => t.id !== task.id) })),
      }))
      showToast('Task dihapus')
    } catch (e) { showToast(e.message, 'error') }
  }

  // ── Drag & Drop ───────────────────────────────────────────────
  const handleDragStart = (e, task) => { dragTask.current = task; e.dataTransfer.effectAllowed = 'move' }
  const handleDragEnd   = () => setDragOverCol(null)

  const handleDrop = async (e, targetColId) => {
    e.preventDefault()
    const task = dragTask.current
    if (!task || task.column_id === targetColId) { setDragOverCol(null); return }

    const updatedCols = project.columns.map(col => {
      if (col.id === task.column_id) return { ...col, tasks: col.tasks.filter(t => t.id !== task.id) }
      if (col.id === targetColId)    return { ...col, tasks: [...(col.tasks ?? []), { ...task, column_id: targetColId }] }
      return col
    })

    setProject(prev => ({ ...prev, columns: updatedCols }))
    setDragOverCol(null)

    // Sync ke API
    const tasks = updatedCols.flatMap(col => (col.tasks ?? []).map((t, idx) => ({ id: t.id, column_id: col.id, position: idx })))
    try {
      await fetch(`/api/projects/${id}/tasks/reorder`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify({ tasks }) })
      showToast('Task dipindahkan ✓')
    } catch { loadProject() }
  }

  // ── Stats ──────────────────────────────────────────────────────
  const allTasks  = (project?.columns ?? []).flatMap(c => c.tasks ?? [])
  const doneCol   = project?.columns?.find(c => c.name === 'Done')
  const doneTasks = doneCol ? (doneCol.tasks ?? []).length : 0
  const progress  = allTasks.length > 0 ? Math.round((doneTasks / allTasks.length) * 100) : 0

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 10, color: theme.textMuted, fontSize: 13 }}>
        <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
        Memuat project...
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!project) return (
    <div style={{ textAlign: 'center', padding: 60, color: theme.textMuted }}>
      <p>Project tidak ditemukan.</p>
      <button onClick={() => navigate('/projects')} style={{ marginTop: 12, padding: '8px 16px', borderRadius: 8, background: theme.accent, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13 }}>Kembali</button>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, height: '100%' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/projects')}
            style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: `1px solid ${theme.border}`, background: 'transparent', color: theme.textMuted, cursor: 'pointer' }}>
            <ArrowLeft size={15} />
          </button>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: (project.color ?? '#6366f1') + '20', border: `1.5px solid ${(project.color ?? '#6366f1')}44`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FolderKanban size={18} color={project.color ?? '#6366f1'} />
          </div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: theme.text, margin: 0 }}>{project.name}</h1>
            {project.description && <p style={{ fontSize: 12, color: theme.textMuted, margin: 0 }}>{project.description}</p>}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 80, height: 6, borderRadius: 3, background: theme.border, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: project.color ?? '#6366f1', borderRadius: 3, transition: 'width 0.5s' }} />
            </div>
            <span style={{ fontSize: 11, color: theme.textMuted }}>{progress}% selesai</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: theme.textMuted }}>
            <CheckSquare size={14} />{doneTasks}/{allTasks.length} task
          </div>
          <div style={{ display: 'flex' }}>
            {(project.members ?? []).slice(0, 5).map((m, i) => (
              <div key={m.id} title={m.name} style={{ width: 28, height: 28, borderRadius: '50%', background: m.color ?? '#6366f1', border: `2px solid ${theme.surface}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', marginLeft: i > 0 ? -8 : 0 }}>
                {(m.name ?? '').slice(0, 2).toUpperCase()}
              </div>
            ))}
          </div>
          {project.due_date && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: theme.textMuted }}>
              <Calendar size={13} />
              {new Date(project.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          )}
        </div>
      </div>

      {/* Kanban Board */}
      <div style={{ flex: 1, overflowX: 'auto', paddingBottom: 16 }}>
        {(project.columns ?? []).length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: theme.textMuted, fontSize: 13 }}>
            <p style={{ marginBottom: 8 }}>Kolom Kanban tidak ditemukan.</p>
            <p style={{ fontSize: 11, fontFamily: 'monospace', background: 'rgba(0,0,0,0.05)', padding: '8px 12px', borderRadius: 8, display: 'inline-block' }}>
              project.columns = {JSON.stringify(project.columns)}<br/>
              project id = {project.id}
            </p>
            <br/><br/>
            <button onClick={loadProject} style={{ padding: '8px 16px', borderRadius: 8, background: theme.accent, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13 }}>
              Refresh Kolom
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 16, minWidth: 'max-content', alignItems: 'flex-start' }}>
            {project.columns.map(col => (
              <KanbanColumn
                key={col.id}
                column={col}
                theme={theme}
                isDragOver={dragOverCol === col.id}
                onAddTask={colId => setTaskModal({ open: true, task: null, columnId: colId })}
                onEditTask={task => setTaskModal({ open: true, task, columnId: task.column_id })}
                onDeleteTask={handleDeleteTask}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={setDragOverCol}
                onDrop={handleDrop}
              />
            ))}
          </div>
        )}
      </div>

      {/* Task Modal */}
      {taskModal.open && (
        <TaskFormModal
          task={taskModal.task}
          columns={project.columns ?? []}
          members={project.members ?? []}
          defaultColumnId={taskModal.columnId}
          onClose={() => !actionLoading && setTaskModal({ open: false, task: null, columnId: null })}
          onSave={handleSaveTask}
          loading={actionLoading}
          theme={theme}
        />
      )}

      {toast && <Toast message={toast.msg} type={toast.type} />}
    </div>
  )
}
