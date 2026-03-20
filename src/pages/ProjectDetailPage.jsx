// src/pages/ProjectDetailPage.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Calendar, Edit2, Trash2, X, Save,
         FolderKanban, CheckSquare, Clock, User, Loader,
         Paperclip, Download, AlertTriangle, Upload, History,
         MessageSquare, Send, ChevronRight } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const PRIORITY_CFG = {
  low:    { label:'Low',    color:'#94A3B8', bg:'rgba(148,163,184,0.12)' },
  medium: { label:'Medium', color:'#6366f1', bg:'rgba(99,102,241,0.12)'  },
  high:   { label:'High',   color:'#F59E0B', bg:'rgba(245,158,11,0.12)'  },
  urgent: { label:'Urgent', color:'#EF4444', bg:'rgba(239,68,68,0.12)'   },
}

const getHeaders = () => ({ Accept:'application/json', 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('token')}` })
const getAuthHeader = () => ({ Accept:'application/json', Authorization:`Bearer ${localStorage.getItem('token')}` })

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('id-ID',{ day:'numeric', month:'short', year:'numeric' }) : null
const fmtDatetime = (d) => {
  if (!d) return null
  const dt = new Date(d)
  const hasTime = d.includes('T') || d.includes(' ')
  return dt.toLocaleDateString('id-ID',{ day:'numeric', month:'short', year:'numeric' })
    + (hasTime ? ' ' + dt.toLocaleTimeString('id-ID',{ hour:'2-digit', minute:'2-digit' }) : '')
}
const fmtDateTime = (d) => d ? new Date(d).toLocaleDateString('id-ID',{ day:'numeric', month:'short', year:'numeric' }) + ' ' + new Date(d).toLocaleTimeString('id-ID',{ hour:'2-digit', minute:'2-digit' }) : null
const isOverdue = (d) => d && new Date(d) < new Date()

const lbl = t => ({ display:'block', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:t.textMuted, marginBottom:6 })
const inp = (t,e) => ({ width:'100%', padding:'9px 12px', borderRadius:8, border:`1px solid ${e?t.danger:t.border}`, background:t.surfaceAlt, color:t.text, fontSize:13, outline:'none', fontFamily:'inherit', boxSizing:'border-box' })

function Toast({ message, type='success' }) {
  return <div style={{ position:'fixed', bottom:24, right:24, zIndex:50, padding:'10px 16px', borderRadius:12, color:'#fff', fontSize:13, fontWeight:500, boxShadow:'0 10px 30px rgba(0,0,0,0.3)', background:type==='success'?'#059669':'#DC2626' }}>{message}</div>
}

// ─── Task Form Modal ──────────────────────────────────────────
function TaskFormModal({ task, columns, members, defaultColumnId, onClose, onSave, loading, theme }) {
  const isEdit = !!task
  const [form, setForm] = useState({
    title:       task?.title       ?? '',
    description: task?.description ?? '',
    category:    task?.category    ?? '',
    column_id:   String(task?.column_id??defaultColumnId??columns[0]?.id??''),
    priority:    task?.priority    ?? 'medium',
    assigned_to: String(task?.assignee?.id??task?.assigned_to??''),
    due_date:    task?.due_date ? task.due_date.split('T')[0] : '',
    due_time:    task?.due_time ?? (task?.due_date?.includes('T') ? task.due_date.split('T')[1]?.slice(0,5) : ''),
  })
  const [err, setErr] = useState({})
  const set = k => e => { setForm(f=>({...f,[k]:e.target.value})); setErr(p=>({...p,[k]:null})) }

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:theme.overlay, backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50, padding:16 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:theme.surface, border:`1px solid ${theme.border}`, borderRadius:16, width:'100%', maxWidth:500, boxShadow:'0 25px 60px rgba(0,0,0,0.35)', overflow:'hidden', maxHeight:'90vh', display:'flex', flexDirection:'column' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 20px', borderBottom:`1px solid ${theme.border}`, flexShrink:0 }}>
          <h3 style={{ color:theme.text, fontSize:14, fontWeight:700, margin:0 }}>{isEdit?'Edit Task':'Tambah Task'}</h3>
          <button onClick={onClose} style={{ color:theme.textMuted, background:'none', border:'none', cursor:'pointer' }}><X size={16}/></button>
        </div>
        <div style={{ padding:20, display:'flex', flexDirection:'column', gap:14, overflowY:'auto' }}>
          <div>
            <label style={lbl(theme)}>Judul Task *</label>
            <input value={form.title} onChange={set('title')} placeholder="Judul task..." style={inp(theme,err.title)}/>
            {err.title && <p style={{ color:theme.danger, fontSize:11, marginTop:4 }}>{err.title}</p>}
          </div>
          <div>
            <label style={lbl(theme)}>Deskripsi</label>
            <textarea value={form.description} onChange={set('description')} rows={4} placeholder="Deskripsi task..." style={{ ...inp(theme), resize:'vertical' }}/>
          </div>
          <div>
            <label style={lbl(theme)}>Kategori</label>
            <input value={form.category} onChange={set('category')} placeholder="Contoh: Frontend, Backend, Testing, Design..." style={inp(theme)}/>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={lbl(theme)}>Kolom</label>
              <select value={form.column_id} onChange={set('column_id')} style={inp(theme)}>
                {columns.map(c=><option key={c.id} value={String(c.id)}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl(theme)}>Prioritas</label>
              <select value={form.priority} onChange={set('priority')} style={inp(theme)}>
                {Object.entries(PRIORITY_CFG).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={lbl(theme)}>Assignee</label>
            <select value={form.assigned_to} onChange={set('assigned_to')} style={inp(theme)}>
              <option value="">— Tidak ada —</option>
              {members.map(m=><option key={m.id} value={String(m.id)}>{m.name}</option>)}
            </select>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={lbl(theme)}>Due Date (Tanggal)</label>
              <input type="date" value={form.due_date} onChange={set('due_date')} style={inp(theme)}/>
            </div>
            <div>
              <label style={lbl(theme)}>Due Time (Jam)</label>
              <input type="time" value={form.due_time} onChange={set('due_time')} style={inp(theme)}/>
            </div>
          </div>
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:8, padding:'12px 20px', borderTop:`1px solid ${theme.border}`, flexShrink:0 }}>
          <button onClick={onClose} style={{ padding:'8px 16px', borderRadius:8, border:`1px solid ${theme.border}`, background:'transparent', color:theme.textMuted, fontSize:13, cursor:'pointer' }}>Batal</button>
          <button onClick={()=>{ if(!form.title.trim()){ setErr({title:'Wajib diisi'}); return } onSave({
              ...form,
              column_id:   Number(form.column_id),
              assigned_to: form.assigned_to ? Number(form.assigned_to) : null,
              due_date:    form.due_date
                ? (form.due_time ? `${form.due_date} ${form.due_time}:00` : form.due_date)
                : null,
            }) }} disabled={loading}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:8, background:theme.accent, color:'#fff', border:'none', fontSize:13, fontWeight:600, cursor:loading?'not-allowed':'pointer', opacity:loading?0.7:1 }}>
            <Save size={13}/>{loading?'Menyimpan...':isEdit?'Simpan':'Tambah Task'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Task Card ────────────────────────────────────────────────
function TaskCard({ task, onEdit, onDelete, onUpload, onOpenTracking, theme, onDragStart, onDragEnd }) {
  const pri      = PRIORITY_CFG[task.priority] ?? PRIORITY_CFG.medium
  const overdue  = isOverdue(task.due_date)
  const fileInput = useRef()

  return (
    <div draggable onDragStart={e=>onDragStart(e,task)} onDragEnd={onDragEnd}
      style={{ background:theme.surface, border:`1px solid ${theme.border}`, borderRadius:10, padding:'10px 12px', cursor:'grab', transition:'all 0.15s' }}
      onMouseEnter={e=>{ e.currentTarget.style.borderColor=theme.accent+'55'; e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)' }}
      onMouseLeave={e=>{ e.currentTarget.style.borderColor=theme.border; e.currentTarget.style.boxShadow='none' }}
    >
      {/* Priority + actions */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
        <span style={{ fontSize:10, fontWeight:600, padding:'2px 7px', borderRadius:20, background:pri.bg, color:pri.color }}>{pri.label}</span>
        <div style={{ display:'flex', gap:3 }}>
          <button onClick={()=>fileInput.current?.click()} title="Upload file" style={{ width:22, height:22, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:4, border:'none', background:'transparent', color:theme.textMuted, cursor:'pointer' }}><Paperclip size={11}/></button>
          <button onClick={()=>onOpenTracking(task)} title="Lihat tracking" style={{ width:22, height:22, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:4, border:'none', background:'transparent', color:theme.textMuted, cursor:'pointer' }}><History size={11}/></button>
          <button onClick={()=>onEdit(task)} style={{ width:22, height:22, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:4, border:'none', background:'transparent', color:theme.textMuted, cursor:'pointer' }}><Edit2 size={11}/></button>
          <button onClick={()=>onDelete(task)} style={{ width:22, height:22, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:4, border:'none', background:'transparent', color:theme.textMuted, cursor:'pointer' }}><Trash2 size={11}/></button>
          <input ref={fileInput} type="file" style={{ display:'none' }} onChange={e=>{ if(e.target.files[0]) onUpload(task, e.target.files[0]); e.target.value='' }}/>
        </div>
      </div>

      {/* Title */}
      <div style={{ fontSize:12, fontWeight:600, color:theme.text, marginBottom:4, lineHeight:1.4 }}>{task.title}</div>

      {/* Kategori */}
      {task.category && (
        <div style={{ display:'inline-flex', alignItems:'center', marginBottom:4 }}>
          <span style={{ fontSize:10, padding:'1px 7px', borderRadius:20, background:theme.surfaceAlt, color:theme.textMuted, border:`1px solid ${theme.border}` }}>{task.category}</span>
        </div>
      )}

      {/* Deskripsi */}
      {task.description && (
        <p style={{ fontSize:11, color:theme.textMuted, marginBottom:6, lineHeight:1.4, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
          {task.description}
        </p>
      )}

      {/* Attachments */}
      {(task.attachments??[]).length > 0 && (
        <div style={{ marginBottom:6 }}>
          {task.attachments.map(att=>(
            <a key={att.id} href={att.url} target="_blank" rel="noreferrer"
              style={{ display:'flex', alignItems:'center', gap:4, fontSize:10, color:theme.accent, textDecoration:'none', padding:'2px 0' }}>
              <Paperclip size={9}/>{att.filename} <span style={{ color:theme.textMuted }}>({att.size_formatted})</span>
            </a>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginTop:6 }}>
        {/* Assignee */}
        <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
          {task.assignee ? (
            <>
              <div style={{ width:22, height:22, borderRadius:'50%', background:task.assignee.color??'#6366f1', display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:700, color:'#fff' }}>
                {(task.assignee.name??'').slice(0,2).toUpperCase()}
              </div>
              <div style={{ fontSize:9, color:theme.textMuted }}>{task.assignee.name}</div>
            </>
          ) : (
            <div style={{ width:22, height:22, borderRadius:'50%', background:theme.surfaceAlt, border:`1.5px dashed ${theme.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <User size={10} color={theme.textMuted}/>
            </div>
          )}
        </div>

        {/* Tanggal + jam */}
        <div style={{ textAlign:'right' }}>
          {task.due_date && (
            <div style={{ display:'flex', alignItems:'center', gap:3, fontSize:10, color:overdue?theme.danger:theme.textMuted, justifyContent:'flex-end' }}>
              <Clock size={9}/>{fmtDatetime(task.due_date)}
            </div>
          )}
          {task.created_at && (
            <div style={{ fontSize:9, color:theme.textMuted, marginTop:1 }}>{fmtDateTime(task.created_at)}</div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Kanban Column ────────────────────────────────────────────
function KanbanColumn({ column, onAddTask, onEditTask, onDeleteTask, onUploadTask, onOpenTracking, theme, onDragStart, onDragEnd, onDragOver, onDrop, isDragOver }) {
  return (
    <div onDragOver={e=>{ e.preventDefault(); onDragOver(column.id) }} onDrop={e=>onDrop(e,column.id)}
      style={{ minWidth:260, width:260, flexShrink:0, display:'flex', flexDirection:'column' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:10, height:10, borderRadius:'50%', background:column.color }}/>
          <span style={{ fontSize:12, fontWeight:700, color:theme.text }}>{column.name}</span>
          <span style={{ fontSize:10, color:theme.textMuted, background:theme.surfaceAlt, border:`1px solid ${theme.border}`, padding:'1px 7px', borderRadius:20 }}>{(column.tasks??[]).length}</span>
        </div>
        <button onClick={()=>onAddTask(column.id)}
          style={{ width:24, height:24, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:6, border:`1px solid ${theme.border}`, background:'transparent', color:theme.textMuted, cursor:'pointer' }}
          onMouseEnter={e=>{ e.currentTarget.style.background=theme.accent; e.currentTarget.style.color='#fff'; e.currentTarget.style.borderColor=theme.accent }}
          onMouseLeave={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.color=theme.textMuted; e.currentTarget.style.borderColor=theme.border }}>
          <Plus size={13}/>
        </button>
      </div>
      <div style={{ flex:1, minHeight:80, padding:8, borderRadius:12, background:isDragOver?(theme.accent+'0d'):theme.surfaceAlt, border:`1.5px dashed ${isDragOver?theme.accent:'transparent'}`, display:'flex', flexDirection:'column', gap:8, transition:'all 0.2s' }}>
        {(column.tasks??[]).map(task=>(
          <TaskCard key={task.id} task={task} theme={theme}
            onEdit={onEditTask} onDelete={onDeleteTask} onUpload={onUploadTask} onOpenTracking={onOpenTracking}
            onDragStart={onDragStart} onDragEnd={onDragEnd}/>
        ))}
        {(column.tasks??[]).length===0 && !isDragOver && (
          <div style={{ textAlign:'center', padding:'20px 10px', color:theme.textMuted, fontSize:11 }}>Belum ada task</div>
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

  const [project, setProject]         = useState(null)
  const [loading, setLoading]         = useState(true)
  const [taskModal, setTaskModal]     = useState({ open:false, task:null, columnId:null })
  const [actionLoading, setAL]        = useState(false)
  const [toast, setToast]             = useState(null)
  const [dragOverCol, setDragOverCol] = useState(null)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [trackingPanel, setTrackingPanel] = useState(null) // task object
  const [trackingData, setTrackingData]   = useState(null)
  const [trackingLoading, setTL]          = useState(false)
  const [commentText, setCommentText]     = useState('')
  const [commentSaving, setCS]            = useState(false)
  const dragTask   = useRef(null)
  const projFileRef = useRef(null)

  const showToast = (msg, type='success') => { setToast({ msg, type }); setTimeout(()=>setToast(null), 3000) }

  const loadProject = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/projects/${id}`, { headers:getHeaders() })
      const json = await res.json()
      if (json.success) setProject(json.data)
      else throw new Error(json.message)
    } catch(e) { showToast(e.message,'error') }
    finally { setLoading(false) }
  }, [id])

  useEffect(()=>{ loadProject() },[loadProject])

  // ── Task CRUD ─────────────────────────────────────────────────
  const handleSaveTask = async (form) => {
    setAL(true)
    try {
      if (taskModal.task) {
        const res  = await fetch(`/api/projects/${id}/tasks/${taskModal.task.id}`, { method:'PUT', headers:getHeaders(), body:JSON.stringify(form) })
        const json = await res.json()
        if (!json.success) throw new Error(json.message)
        const updated = json.data
        const oldCol  = taskModal.task.column_id
        const newCol  = updated.column_id
        setProject(prev=>({
          ...prev,
          columns: prev.columns.map(col=>{
            if (Number(oldCol)!==Number(newCol)) {
              if (col.id===oldCol) return { ...col, tasks:(col.tasks??[]).filter(t=>t.id!==updated.id) }
              if (col.id===newCol) return { ...col, tasks:[...(col.tasks??[]),updated] }
            } else {
              return { ...col, tasks:(col.tasks??[]).map(t=>t.id===updated.id?updated:t) }
            }
            return col
          }),
        }))
        showToast('Task diupdate ✓')
      } else {
        const res  = await fetch(`/api/projects/${id}/tasks`, { method:'POST', headers:getHeaders(), body:JSON.stringify(form) })
        const json = await res.json()
        if (!json.success) throw new Error(json.message||Object.values(json.errors??{}).flat()[0])
        setProject(prev=>({
          ...prev,
          columns: prev.columns.map(col=>col.id===json.data.column_id?{ ...col, tasks:[...(col.tasks??[]),json.data] }:col),
        }))
        showToast('Task ditambahkan ✓')
      }
      setTaskModal({ open:false, task:null, columnId:null })
    } catch(e){ showToast(e.message,'error') }
    finally { setAL(false) }
  }

  const handleDeleteTask = async (task) => {
    if (!window.confirm(`Hapus task "${task.title}"?`)) return
    try {
      const res = await fetch(`/api/projects/${id}/tasks/${task.id}`,{ method:'DELETE', headers:getHeaders() })
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
      setProject(prev=>({ ...prev, columns:prev.columns.map(col=>({ ...col, tasks:(col.tasks??[]).filter(t=>t.id!==task.id) })) }))
      showToast('Task dihapus')
    } catch(e){ showToast(e.message,'error') }
  }

  // ── Upload file ───────────────────────────────────────────────
  const handleUpload = async (task, file) => {
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch(`/api/projects/${id}/tasks/${task.id}/attachments`, {
        method:'POST',
        headers:{ Accept:'application/json', Authorization:`Bearer ${localStorage.getItem('token')}` },
        body: formData,
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
      // Tambah attachment ke task
      setProject(prev=>({
        ...prev,
        columns: prev.columns.map(col=>({
          ...col,
          tasks:(col.tasks??[]).map(t=>t.id===task.id?{ ...t, attachments:[...(t.attachments??[]),json.data] }:t),
        })),
      }))
      showToast(`File "${file.name}" berhasil diupload ✓`)
    } catch(e){ showToast(e.message,'error') }
  }

  // ── Upload file project ──────────────────────────────────────
  const handleUploadProjectFile = async (file) => {
    setUploadingFile(true)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch(`/api/projects/${id}/attachments`, {
        method: 'POST',
        headers: { Accept:'application/json', Authorization:`Bearer ${localStorage.getItem('token')}` },
        body: fd,
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
      setProject(prev=>({ ...prev, attachments:[...(prev.attachments??[]), json.data] }))
      showToast(`File "${file.name}" berhasil diupload ✓`)
    } catch(e){ showToast(e.message,'error') }
    finally { setUploadingFile(false) }
  }

  const handleDeleteProjectFile = async (att) => {
    if (!window.confirm(`Hapus file "${att.filename}"?`)) return
    try {
      const res = await fetch(`/api/projects/${id}/attachments/${att.id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
      setProject(prev=>({ ...prev, attachments:(prev.attachments??[]).filter(a=>a.id!==att.id) }))
      showToast('File dihapus')
    } catch(e){ showToast(e.message,'error') }
  }

  // ── Tracking Panel ───────────────────────────────────────────
  const openTracking = async (task) => {
    setTrackingPanel(task)
    setTrackingData(null)
    setTL(true)
    try {
      const res  = await fetch(`/api/projects/${id}/tasks/${task.id}/tracking`, { headers: getHeaders() })
      const json = await res.json()
      if (json.success) setTrackingData(json)
    } catch(e) { showToast(e.message, 'error') }
    finally { setTL(false) }
  }

  const handleAddComment = async () => {
    if (!commentText.trim() || !trackingPanel) return
    setCS(true)
    try {
      const res  = await fetch(`/api/projects/${id}/tasks/${trackingPanel.id}/comments`, {
        method: 'POST', headers: getHeaders(), body: JSON.stringify({ body: commentText.trim() })
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
      setTrackingData(prev => ({
        ...prev,
        comments:  [json.data, ...(prev?.comments ?? [])],
        histories: [{ id: Date.now(), type:'comment_added', description:'Menambahkan komentar', created_at: new Date().toISOString(), user: json.data.user }, ...(prev?.histories ?? [])],
      }))
      setCommentText('')
    } catch(e) { showToast(e.message, 'error') }
    finally { setCS(false) }
  }

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Hapus komentar ini?')) return
    try {
      await fetch(`/api/projects/${id}/tasks/${trackingPanel.id}/comments/${commentId}`, { method: 'DELETE', headers: getHeaders() })
      setTrackingData(prev => ({ ...prev, comments: (prev?.comments ?? []).filter(c => c.id !== commentId) }))
    } catch(e) { showToast(e.message, 'error') }
  }

    // ── Drag & Drop ───────────────────────────────────────────────
  const handleDragStart = (e,task) => { dragTask.current=task; e.dataTransfer.effectAllowed='move' }
  const handleDragEnd   = () => setDragOverCol(null)

  const handleDrop = async (e, targetColId) => {
    e.preventDefault()
    const task = dragTask.current
    if (!task || task.column_id===targetColId) { setDragOverCol(null); return }

    const updated = project.columns.map(col=>{
      if (col.id===task.column_id) return { ...col, tasks:col.tasks.filter(t=>t.id!==task.id) }
      if (col.id===targetColId)    return { ...col, tasks:[...(col.tasks??[]),{ ...task, column_id:targetColId }] }
      return col
    })
    setProject(prev=>({ ...prev, columns:updated }))
    setDragOverCol(null)

    const tasks = updated.flatMap(col=>(col.tasks??[]).map((t,idx)=>({ id:t.id, column_id:col.id, position:idx })))
    try {
      await fetch(`/api/projects/${id}/tasks/reorder`,{ method:'PUT', headers:getHeaders(), body:JSON.stringify({ tasks }) })
      showToast('Task dipindahkan ✓')
    } catch { loadProject() }
  }

  // ── Stats (reactive dari project.columns state) ──────────────
  const allTasks    = (project?.columns??[]).flatMap(c=>c.tasks??[])
  const prodCol     = (project?.columns??[]).find(c=>c.name==='Prod')
  const doneTasks   = (prodCol?.tasks??[]).length
  const progress    = allTasks.length>0 ? Math.round((doneTasks/allTasks.length)*100) : 0
  const isLate      = project?.due_date && !['completed','cancelled'].includes(project?.status) && new Date(project.due_date)<new Date()
  const hasPendingTasks = allTasks.some(t=>{
    const col = (project?.columns??[]).find(c=>c.id===t.column_id)
    return !col || col.name!=='Prod'
  })

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:300, gap:10, color:theme.textMuted, fontSize:13 }}>
      <Loader size={18} style={{ animation:'spin 1s linear infinite' }}/> Memuat project...
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (!project) return (
    <div style={{ textAlign:'center', padding:60, color:theme.textMuted }}>
      <p>Project tidak ditemukan.</p>
      <button onClick={()=>navigate('/projects')} style={{ marginTop:12, padding:'8px 16px', borderRadius:8, background:theme.accent, color:'#fff', border:'none', cursor:'pointer', fontSize:13 }}>Kembali</button>
    </div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20, height:'100%' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={()=>navigate('/projects')} style={{ width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:8, border:`1px solid ${theme.border}`, background:'transparent', color:theme.textMuted, cursor:'pointer' }}>
            <ArrowLeft size={15}/>
          </button>
          <div style={{ width:36, height:36, borderRadius:10, background:(project.color??'#6366f1')+'20', border:`1.5px solid ${(project.color??'#6366f1')}44`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <FolderKanban size={18} color={project.color??'#6366f1'}/>
          </div>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
              <h1 style={{ fontSize:18, fontWeight:800, color:theme.text, margin:0 }}>{project.name}</h1>
              {project.category && <span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, background:theme.surfaceAlt, color:theme.textMuted, border:`1px solid ${theme.border}` }}>{project.category}</span>}
              {isLate && hasPendingTasks && (
                <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20, background:'rgba(239,68,68,0.12)', color:'#EF4444', display:'flex', alignItems:'center', gap:4 }}>
                  <AlertTriangle size={11}/>Terlambat
                </span>
              )}
            </div>
            {project.description && <p style={{ fontSize:12, color:theme.textMuted, margin:'4px 0 0', maxWidth:500 }}>{project.description}</p>}
            <div style={{ fontSize:10, color:theme.textMuted, marginTop:4 }}>
              Dibuat: {fmtDateTime(project.created_at)}
              {project.due_date && ` · Deadline: ${fmtDate(project.due_date)}`}
            </div>
          </div>
        </div>

        <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
          {/* Progress */}
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:80, height:6, borderRadius:3, background:theme.border, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${progress}%`, background:project.color??'#6366f1', borderRadius:3, transition:'width 0.5s' }}/>
            </div>
            <span style={{ fontSize:11, color:theme.textMuted }}>{progress}% selesai</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:theme.textMuted }}>
            <CheckSquare size={14}/>{doneTasks}/{allTasks.length} task
          </div>

          {/* Members dengan avatar + nama */}
          <div>
            <div style={{ display:'flex' }}>
              {(project.members??[]).slice(0,5).map((m,i)=>(
                <div key={m.id} title={m.name} style={{ width:28, height:28, borderRadius:'50%', background:m.color??'#6366f1', border:`2px solid ${theme.surface}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#fff', marginLeft:i>0?-8:0 }}>
                  {(m.name??'').slice(0,2).toUpperCase()}
                </div>
              ))}
            </div>
            {(project.members??[]).length > 0 && (
              <div style={{ fontSize:9, color:theme.textMuted, marginTop:2 }}>
                {(project.members??[]).map(m=>m.name?.split(' ')[0]).join(', ')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* File Lampiran Project */}
      <div style={{ background:theme.surface, border:`1px solid ${theme.border}`, borderRadius:12, padding:'14px 16px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Paperclip size={14} color={theme.textMuted}/>
            <span style={{ fontSize:12, fontWeight:700, color:theme.text }}>File Lampiran Project</span>
            <span style={{ fontSize:10, color:theme.textMuted, background:theme.surfaceAlt, border:`1px solid ${theme.border}`, padding:'1px 7px', borderRadius:20 }}>
              {(project.attachments??[]).length}
            </span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <button
              onClick={()=>projFileRef.current?.click()}
              disabled={uploadingFile}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:8, background:theme.surfaceAlt, color:theme.text, border:`1px solid ${theme.border}`, fontSize:11, fontWeight:600, cursor:uploadingFile?'not-allowed':'pointer', opacity:uploadingFile?0.7:1 }}
            >
              {uploadingFile
                ? <><span style={{ width:11, height:11, border:'2px solid rgba(0,0,0,0.2)', borderTop:'2px solid currentColor', borderRadius:'50%', display:'inline-block', animation:'spin 0.7s linear infinite' }}/>Uploading...</>
                : <><Upload size={12}/>Tambah File</>
              }
            </button>
            <input ref={projFileRef} type="file" multiple style={{ display:'none' }}
              onChange={e=>{ Array.from(e.target.files).forEach(f=>handleUploadProjectFile(f)); e.target.value='' }}
            />
          </div>
        </div>

        {(project.attachments??[]).length === 0 ? (
          <div
            onClick={()=>projFileRef.current?.click()}
            onDragOver={e=>e.preventDefault()}
            onDrop={e=>{ e.preventDefault(); Array.from(e.dataTransfer.files).forEach(f=>handleUploadProjectFile(f)) }}
            style={{ border:`2px dashed ${theme.border}`, borderRadius:8, padding:'20px', textAlign:'center', cursor:'pointer', color:theme.textMuted, fontSize:12 }}
            onMouseEnter={e=>e.currentTarget.style.borderColor=theme.accent}
            onMouseLeave={e=>e.currentTarget.style.borderColor=theme.border}
          >
            <Paperclip size={18} style={{ margin:'0 auto 6px' }}/>
            <div>Belum ada file — klik atau drag & drop untuk upload</div>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:8 }}>
            {(project.attachments??[]).map(att=>{
              const isImage = att.mime_type?.startsWith('image/')
              const ext = att.filename.split('.').pop().toLowerCase()
              const extColors = { pdf:'#EF4444', doc:'#3B82F6', docx:'#3B82F6', xls:'#10B981', xlsx:'#10B981', zip:'#F59E0B', rar:'#F59E0B' }
              const extColor = extColors[ext] ?? theme.accent
              return (
                <div key={att.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:8, background:theme.surfaceAlt, border:`1px solid ${theme.border}`, transition:'all 0.15s' }}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=theme.accent+'55'}
                  onMouseLeave={e=>e.currentTarget.style.borderColor=theme.border}
                >
                  {/* Icon/preview */}
                  <div style={{ width:36, height:36, borderRadius:8, background:extColor+'15', border:`1px solid ${extColor}33`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:10, fontWeight:800, color:extColor, textTransform:'uppercase' }}>
                    {isImage ? '🖼' : ext.slice(0,4)}
                  </div>
                  {/* Info */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:11, fontWeight:600, color:theme.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{att.filename}</div>
                    <div style={{ fontSize:10, color:theme.textMuted }}>{att.size_formatted} · {att.uploader?.name}</div>
                  </div>
                  {/* Actions */}
                  <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                    <a href={att.url} download={att.filename} target="_blank" rel="noreferrer" title="Download"
                      style={{ width:26, height:26, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:6, background:'transparent', border:`1px solid ${theme.border}`, color:theme.accent, textDecoration:'none', cursor:'pointer' }}
                      onMouseEnter={e=>{ e.currentTarget.style.background=theme.accent; e.currentTarget.style.color='#fff' }}
                      onMouseLeave={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.color=theme.accent }}
                    >
                      <Download size={12}/>
                    </a>
                    <button onClick={()=>handleDeleteProjectFile(att)} title="Hapus file"
                      style={{ width:26, height:26, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:6, background:'transparent', border:`1px solid ${theme.border}`, color:theme.textMuted, cursor:'pointer' }}
                      onMouseEnter={e=>{ e.currentTarget.style.background='rgba(239,68,68,0.1)'; e.currentTarget.style.color=theme.danger }}
                      onMouseLeave={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.color=theme.textMuted }}
                    >
                      <Trash2 size={12}/>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Kanban Board */}
      <div style={{ flex:1, overflowX:'auto', paddingBottom:16 }}>
        {(project.columns??[]).length===0 ? (
          <div style={{ textAlign:'center', padding:60, color:theme.textMuted, fontSize:13 }}>
            <button onClick={loadProject} style={{ padding:'8px 16px', borderRadius:8, background:theme.accent, color:'#fff', border:'none', cursor:'pointer', fontSize:13 }}>Refresh Kolom</button>
          </div>
        ) : (
          <div style={{ display:'flex', gap:16, minWidth:'max-content', alignItems:'flex-start' }}>
            {project.columns.map(col=>(
              <KanbanColumn key={col.id} column={col} theme={theme} isDragOver={dragOverCol===col.id}
                onAddTask={colId=>setTaskModal({ open:true, task:null, columnId:colId })}
                onEditTask={task=>setTaskModal({ open:true, task, columnId:task.column_id })}
                onDeleteTask={handleDeleteTask}
                onUploadTask={handleUpload}
                onOpenTracking={openTracking}
                onDragStart={handleDragStart} onDragEnd={handleDragEnd}
                onDragOver={setDragOverCol} onDrop={handleDrop}
              />
            ))}
          </div>
        )}
      </div>

      {/* Task Modal */}
      {taskModal.open && (
        <TaskFormModal task={taskModal.task} columns={project.columns??[]} members={project.members??[]}
          defaultColumnId={taskModal.columnId}
          onClose={()=>!actionLoading&&setTaskModal({ open:false, task:null, columnId:null })}
          onSave={handleSaveTask} loading={actionLoading} theme={theme}/>
      )}

      {toast && <Toast message={toast.msg} type={toast.type}/>}

      {/* ── Tracking Panel (slide dari kanan) ──────────────────── */}
      {trackingPanel && (
        <>
          {/* Backdrop */}
          <div onClick={()=>setTrackingPanel(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.3)', zIndex:40 }}/>
          {/* Panel */}
          <div style={{ position:'fixed', top:0, right:0, bottom:0, width:420, background:theme.surface, borderLeft:`1px solid ${theme.border}`, zIndex:41, display:'flex', flexDirection:'column', boxShadow:'-8px 0 32px rgba(0,0,0,0.15)', animation:'slideIn 0.25s ease-out' }}>
            <style>{`@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>

            {/* Panel Header */}
            <div style={{ padding:'16px 20px', borderBottom:`1px solid ${theme.border}`, flexShrink:0 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <History size={16} color={theme.accent}/>
                  <span style={{ fontSize:14, fontWeight:700, color:theme.text }}>Task Tracking</span>
                </div>
                <button onClick={()=>setTrackingPanel(null)} style={{ background:'none', border:'none', cursor:'pointer', color:theme.textMuted }}><X size={16}/></button>
              </div>
              <div style={{ fontSize:13, fontWeight:600, color:theme.text }}>{trackingPanel.title}</div>
              {trackingData?.task?.column && (
                <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:4 }}>
                  <span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, background:theme.surfaceAlt, color:theme.textMuted, border:`1px solid ${theme.border}` }}>
                    {trackingData.task.column.name}
                  </span>
                  {trackingData?.task?.assignee && (
                    <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                      <div style={{ width:20, height:20, borderRadius:'50%', background:trackingData.task.assignee.color??'#6366f1', display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:700, color:'#fff' }}>
                        {(trackingData.task.assignee.name??'').slice(0,2).toUpperCase()}
                      </div>
                      <span style={{ fontSize:11, color:theme.textMuted }}>{trackingData.task.assignee.name}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Panel Body */}
            <div style={{ flex:1, overflowY:'auto', padding:'16px 20px', display:'flex', flexDirection:'column', gap:20 }}>
              {trackingLoading ? (
                <div style={{ textAlign:'center', padding:40, color:theme.textMuted, fontSize:13 }}>
                  <Loader size={20} style={{ animation:'spin 1s linear infinite', display:'block', margin:'0 auto 8px' }}/>
                  Memuat data...
                </div>
              ) : (
                <>
                  {/* Komentar */}
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:12 }}>
                      <MessageSquare size={13} color={theme.accent}/>
                      <span style={{ fontSize:12, fontWeight:700, color:theme.text }}>Komentar ({(trackingData?.comments??[]).length})</span>
                    </div>
                    {/* Input komentar baru */}
                    <div style={{ display:'flex', gap:8, marginBottom:12 }}>
                      <textarea value={commentText} onChange={e=>setCommentText(e.target.value)}
                        placeholder="Tulis komentar..."
                        onKeyDown={e=>{ if(e.key==='Enter' && e.ctrlKey) handleAddComment() }}
                        style={{ flex:1, padding:'8px 10px', borderRadius:8, border:`1px solid ${theme.border}`, background:theme.surfaceAlt, color:theme.text, fontSize:12, outline:'none', resize:'none', minHeight:60, fontFamily:'inherit' }}/>
                      <button onClick={handleAddComment} disabled={commentSaving || !commentText.trim()}
                        style={{ width:36, height:36, borderRadius:8, background:theme.accent, color:'#fff', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, alignSelf:'flex-end', opacity: !commentText.trim() ? 0.5 : 1 }}>
                        <Send size={14}/>
                      </button>
                    </div>
                    {/* List komentar */}
                    {(trackingData?.comments??[]).length === 0 ? (
                      <div style={{ textAlign:'center', padding:'12px', color:theme.textMuted, fontSize:12 }}>Belum ada komentar</div>
                    ) : (
                      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                        {(trackingData?.comments??[]).map(cm => (
                          <div key={cm.id} style={{ background:theme.surfaceAlt, borderRadius:10, padding:'10px 12px', border:`1px solid ${theme.border}` }}>
                            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                                <div style={{ width:22, height:22, borderRadius:'50%', background:cm.user?.color??'#6366f1', display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:700, color:'#fff' }}>
                                  {(cm.user?.name??'').slice(0,2).toUpperCase()}
                                </div>
                                <span style={{ fontSize:11, fontWeight:600, color:theme.text }}>{cm.user?.name}</span>
                              </div>
                              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                                <span style={{ fontSize:10, color:theme.textMuted }}>{new Date(cm.created_at).toLocaleString('id-ID',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</span>
                                <button onClick={()=>handleDeleteComment(cm.id)} style={{ background:'none', border:'none', cursor:'pointer', color:theme.textMuted, padding:0 }}><Trash2 size={11}/></button>
                              </div>
                            </div>
                            <p style={{ fontSize:12, color:theme.text, margin:0, lineHeight:1.5, whiteSpace:'pre-wrap' }}>{cm.body}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* File Attachments */}
                  {(trackingData?.attachments??[]).length > 0 && (
                    <div>
                      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:10 }}>
                        <Paperclip size={13} color={theme.accent}/>
                        <span style={{ fontSize:12, fontWeight:700, color:theme.text }}>File ({(trackingData?.attachments??[]).length})</span>
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                        {(trackingData?.attachments??[]).map(att => {
                          const ext = att.filename.split('.').pop().toLowerCase()
                          const extColor = { pdf:'#EF4444', doc:'#3B82F6', docx:'#3B82F6', xls:'#10B981', xlsx:'#10B981' }[ext] ?? theme.accent
                          return (
                            <a key={att.id} href={att.url} target="_blank" rel="noreferrer"
                              download={att.filename}
                            style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:8, background:theme.surfaceAlt, border:`1px solid ${theme.border}`, textDecoration:'none', transition:'border-color 0.15s' }}
                              onMouseEnter={e=>e.currentTarget.style.borderColor=theme.accent+'55'}
                              onMouseLeave={e=>e.currentTarget.style.borderColor=theme.border}
                            >
                              <div style={{ width:28, height:28, borderRadius:6, background:extColor+'18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:800, color:extColor, textTransform:'uppercase', flexShrink:0 }}>{ext.slice(0,4)}</div>
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ fontSize:11, fontWeight:600, color:theme.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{att.filename}</div>
                                <div style={{ fontSize:10, color:theme.textMuted }}>{att.size_formatted} · {att.uploader?.name}</div>
                              </div>
                              <Download size={13} color={theme.accent}/>
                            </a>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Timeline History */}
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:12 }}>
                      <History size={13} color={theme.accent}/>
                      <span style={{ fontSize:12, fontWeight:700, color:theme.text }}>Riwayat Aktivitas ({(trackingData?.histories??[]).length})</span>
                    </div>
                    {(trackingData?.histories??[]).length === 0 ? (
                      <div style={{ textAlign:'center', padding:'12px', color:theme.textMuted, fontSize:12 }}>Belum ada riwayat</div>
                    ) : (
                      <div style={{ position:'relative' }}>
                        {/* Garis timeline */}
                        <div style={{ position:'absolute', left:10, top:0, bottom:0, width:2, background:theme.border }}/>
                        <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
                          {(trackingData?.histories??[]).map((h, i) => {
                            const typeIcon = {
                              created:          { icon:'🆕', color:'#10B981' },
                              column_changed:   { icon:'➡️', color:'#6366f1' },
                              assignee_changed: { icon:'👤', color:'#F59E0B' },
                              priority_changed: { icon:'🔺', color:'#EF4444' },
                              comment_added:    { icon:'💬', color:'#06B6D4' },
                              attachment_added: { icon:'📎', color:'#8B5CF6' },
                            }[h.type] ?? { icon:'•', color:'#94A3B8' }
                            return (
                              <div key={h.id} style={{ display:'flex', gap:12, paddingLeft:24, paddingBottom:i < (trackingData?.histories??[]).length-1 ? 16 : 0, position:'relative' }}>
                                {/* Dot */}
                                <div style={{ position:'absolute', left:5, top:2, width:12, height:12, borderRadius:'50%', background:typeIcon.color, border:`2px solid ${theme.surface}`, flexShrink:0 }}/>
                                <div style={{ flex:1 }}>
                                  <div style={{ fontSize:12, color:theme.text, lineHeight:1.4 }}>{h.description}</div>
                                  <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:3 }}>
                                    {h.user && (
                                      <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                                        <div style={{ width:16, height:16, borderRadius:'50%', background:h.user.color??'#6366f1', display:'flex', alignItems:'center', justifyContent:'center', fontSize:7, fontWeight:700, color:'#fff' }}>
                                          {(h.user.name??'').slice(0,2).toUpperCase()}
                                        </div>
                                        <span style={{ fontSize:10, color:theme.textMuted }}>{h.user.name}</span>
                                      </div>
                                    )}
                                    <span style={{ fontSize:10, color:theme.textMuted }}>
                                      {new Date(h.created_at).toLocaleString('id-ID',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
