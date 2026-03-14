import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Users, X, Save, AlertTriangle } from 'lucide-react'

import { T, ROLE_CFG } from '../theme'
import {
  Card,
  Badge,
  Avatar,
  PageHeader,
  SearchBar,
  PrimaryButton,
  EmptyState,
} from '../components/ui'

import useSearch from '../hooks/useSearch'

/* ─── Modal Edit ─────────────────────────────────────────── */
function EditModal({ user, onClose, onSave, loading }) {
  const [form, setForm] = useState({
    name: user.name ?? '',
    email: user.email ?? '',
    department: user.department ?? '',
    role: user.role ?? 'User',
    is_active: user.is_active ?? true, // pakai boolean
  })

  const setField = (key) => (e) => {
    // khusus untuk is_active mapping dari select string ke boolean
    if (key === 'is_active') {
      setForm((f) => ({ ...f, [key]: e.target.value === 'Active' }))
    } else {
      setForm((f) => ({ ...f, [key]: e.target.value }))
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-slate-900 rounded-xl w-[440px] max-w-[90vw] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-4 border-b border-slate-700">
          <h3 className="text-sm font-bold text-white">Edit User</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Nama</label>
            <input
              className="w-full px-2 py-2 rounded border border-slate-700 bg-slate-800 text-white text-sm outline-none"
              value={form.name}
              onChange={setField('name')}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Email</label>
            <input
              type="email"
              className="w-full px-2 py-2 rounded border border-slate-700 bg-slate-800 text-white text-sm outline-none"
              value={form.email}
              onChange={setField('email')}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Department</label>
            <input
              className="w-full px-2 py-2 rounded border border-slate-700 bg-slate-800 text-white text-sm outline-none"
              value={form.department}
              onChange={setField('department')}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Role</label>
              <select
                className="w-full px-2 py-2 rounded border border-slate-700 bg-slate-800 text-white text-sm"
                value={form.role}
                onChange={setField('role')}
              >
                {Object.keys(ROLE_CFG).map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Status</label>
              <select
                className="w-full px-2 py-2 rounded border border-slate-700 bg-slate-800 text-white text-sm"
                value={form.is_active ? 'Active' : 'Inactive'}
                onChange={setField('is_active')}
              >
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-slate-700">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-3 py-1 rounded border border-slate-700 text-white text-sm hover:bg-slate-700 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={() => onSave(user.id, form)}
            disabled={loading}
            className={`px-3 py-1 rounded bg-indigo-600 text-white text-sm font-semibold flex items-center gap-1 ${
              loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-indigo-500'
            }`}
          >
            <Save size={12} />
            {loading ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Modal Hapus ───────────────────────────────────────── */
function DeleteModal({ user, onClose, onConfirm, loading }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-900 rounded-xl w-[380px] max-w-[90vw] shadow-2xl p-6 text-center" onClick={(e) => e.stopPropagation()}>
        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-3">
          <AlertTriangle size={22} className="text-red-600" />
        </div>
        <h3 className="text-sm font-bold text-white mb-2">Hapus User?</h3>
        <p className="text-xs text-slate-400 mb-5">
          <strong className="text-white">{user.name}</strong> akan dihapus permanen.
        </p>
        <div className="flex justify-center gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded border border-slate-700 text-white text-xs hover:bg-slate-700 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={() => onConfirm(user.id)}
            disabled={loading}
            className={`px-4 py-2 rounded bg-red-600 text-white text-xs font-semibold flex items-center gap-1 ${
              loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-red-500'
            }`}
          >
            <Trash2 size={12} />
            {loading ? 'Menghapus...' : 'Ya, Hapus'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Toast ─────────────────────────────────────────────── */
function Toast({ message, type = 'success' }) {
  return (
    <div
      className={`fixed bottom-6 right-6 px-4 py-2 rounded shadow-lg text-white text-sm font-medium z-50 ${
        type === 'success' ? 'bg-green-500' : 'bg-red-500'
      }`}
    >
      {message}
    </div>
  )
}

/* ─── Halaman Utama ─────────────────────────────────────── */
function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [editUser, setEditUser] = useState(null)
  const [deleteUser, setDeleteUser] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [toast, setToast] = useState(null)

  const { query, setQuery, results } = useSearch(users, ['name','email','department','role'])

  /* Pagination */
  const [page, setPage] = useState(1)
  const perPage = 10
  const totalPages = Math.ceil(results.length / perPage)
  const paginated = results.slice((page-1)*perPage, page*perPage)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)
      try {
        const token = localStorage.getItem('token')
        if(!token) throw new Error('Belum login')

        const headers = { Accept:'application/json', Authorization:`Bearer ${token}` }

        const [resUsers, resTickets] = await Promise.all([
          fetch('http://localhost:8000/api/users', {headers}),
          fetch('http://localhost:8000/api/tickets', {headers})
        ])
        if(!resUsers.ok) throw new Error('Gagal fetch users')
        const dataUsers = await resUsers.json()
        const rawUsers = dataUsers.data ?? []

        let ticketCount = {}
        if(resTickets.ok){
          const dataTickets = await resTickets.json()
          const tickets = dataTickets.data ?? []
          tickets.forEach(t=>{
            const assigneeId = t.assigned_to ?? t.assignee_id ?? t.technician_id ?? t.user_id
            if(assigneeId != null) ticketCount[assigneeId] = (ticketCount[assigneeId] ?? 0) +1
          })
        }

        setUsers(rawUsers.map(u=>({...u, tickets: ticketCount[u.id]??0})))
      } catch(err){
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  },[])

  const handleSave = async (id, form) => {
    setActionLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`http://localhost:8000/api/users/${id}`,{
        method:'PUT',
        headers:{Accept:'application/json','Content-Type':'application/json',Authorization:`Bearer ${token}`},
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if(!res.ok) throw new Error(data.message || 'Gagal menyimpan')
      setUsers(prev=>prev.map(u=>u.id===id?{...u,...form}:u))
      setEditUser(null)
      showToast('User berhasil diperbarui ✓')
    }catch(err){
      showToast(err.message,'error')
    }finally{
      setActionLoading(false)
    }
  }

  const handleDelete = async (id) => {
    setActionLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`http://localhost:8000/api/users/${id}`,{
        method:'DELETE',
        headers:{Accept:'application/json', Authorization:`Bearer ${token}`}
      })
      if(!res.ok) throw new Error('Gagal menghapus')
      setUsers(prev=>prev.filter(u=>u.id!==id))
      setDeleteUser(null)
      showToast('User berhasil dihapus')
    }catch(err){
      showToast(err.message,'error')
    }finally{
      setActionLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="User Management"
        subtitle={loading?'Memuat...':error?'Gagal memuat data':`${users.length} pengguna terdaftar`}
        action={<PrimaryButton icon={Plus}>Tambah User</PrimaryButton>}
      />
      <SearchBar value={query} onChange={setQuery} placeholder="Cari nama, email, department..." disabled={loading} />
      {error && <div className="p-3 rounded bg-red-100 text-red-600 text-xs">{error}</div>}

      <Card className="overflow-hidden relative">
        {loading && <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">Memuat data...</div>}

        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-700">
              {['User','Role','Department','Tiket','Status','Aksi'].map(h=>(
                <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map(u=>(
              <tr key={u.id} className="border-b border-slate-700 hover:bg-slate-800 transition">
                <td className="px-4 py-3 flex items-center gap-2">
                  <Avatar initials={(u.name||'').slice(0,2).toUpperCase()} size={32}/>
                  <div>
                    <div className="text-sm font-medium text-white">{u.name}</div>
                    <div className="text-xs text-slate-400">{u.email}</div>
                  </div>
                </td>
                <td className="px-4 py-3"><Badge label={u.role} cfg={ROLE_CFG[u.role]??ROLE_CFG['User']}/></td>
                <td className="px-4 py-3 text-slate-400 text-xs">{u.department??'-'}</td>
                <td className="px-4 py-3 font-mono">{u.tickets??0}</td>
                <td className="px-4 py-3">
                  <Badge
                    label={u.is_active ? 'Active' : 'Inactive'}
                    cfg={{
                      bg: u.is_active ? 'rgba(16,185,129,0.10)' : `${T.danger}15`,
                      text: u.is_active ? T.success : T.danger,
                      border: u.is_active ? 'rgba(16,185,129,0.22)' : `${T.danger}30`,
                    }}
                    dot
                  />
                </td>
                <td className="px-4 py-3 flex gap-1">
                  <button onClick={()=>setEditUser(u)} disabled={loading} title="Edit user" className="w-7 h-7 flex items-center justify-center rounded border border-slate-700 text-indigo-500 hover:bg-indigo-500/10"><Edit2 size={11}/></button>
                  <button onClick={()=>setDeleteUser(u)} disabled={loading} title="Hapus user" className="w-7 h-7 flex items-center justify-center rounded border border-slate-700 text-red-500 hover:bg-red-500/10"><Trash2 size={11}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && paginated.length===0 && <EmptyState icon={Users} message="Tidak ada user ditemukan"/>}
      </Card>

      {/* Pagination */}
      {totalPages>1 && (
        <div className="flex justify-end items-center gap-2 mt-2">
          <button onClick={()=>setPage(p=>Math.max(p-1,1))} disabled={page===1} className="px-3 py-1 rounded bg-slate-700 text-white disabled:opacity-50">Previous</button>
          {Array.from({length:totalPages},(_,i)=>i+1).map(pNum=>(
            <button key={pNum} onClick={()=>setPage(pNum)} className={`px-3 py-1 rounded ${page===pNum?'bg-indigo-600 text-white':'bg-slate-700 text-white hover:bg-slate-600'}`}>{pNum}</button>
          ))}
          <button onClick={()=>setPage(p=>Math.min(p+1,totalPages))} disabled={page===totalPages} className="px-3 py-1 rounded bg-slate-700 text-white disabled:opacity-50">Next</button>
        </div>
      )}

      {editUser && <EditModal user={editUser} onClose={()=>!actionLoading&&setEditUser(null)} onSave={handleSave} loading={actionLoading}/>}
      {deleteUser && <DeleteModal user={deleteUser} onClose={()=>!actionLoading&&setDeleteUser(null)} onConfirm={handleDelete} loading={actionLoading}/>}
      {toast && <Toast message={toast.message} type={toast.type}/>}
    </div>
  )
}

export default UsersPage