import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Users, X, Save, AlertTriangle } from 'lucide-react'
import { ROLE_CFG } from '../theme'
import {
  Card, Badge, Avatar, PageHeader, SearchBar, PrimaryButton, EmptyState,
} from '../components/ui'
import { useAuth } from '../context/AppContext'
import useSearch from '../hooks/useSearch'

// ─── Shared input style ───────────────────────────────────────
const inputCls = 'w-full px-3 py-2 rounded-lg border border-gray-700 bg-white/5 text-white text-sm outline-none focus:border-blue-500 transition placeholder-gray-500'
const labelCls = 'block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5'

// ─── AddUserModal ─────────────────────────────────────────────
function AddUserModal({ onClose, onSave, loading }) {
  const [form, setForm] = useState({
    name: '', email: '', department: '', role: 'user',
    is_active: true, password: '', password_confirmation: '',
  })

  const setField = (key) => (e) => {
    setForm(f => ({
      ...f,
      [key]: key === 'is_active' ? e.target.value === 'Active' : e.target.value,
    }))
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start sm:items-center justify-center z-50 p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md my-4 sm:my-0 shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-gray-800">
          <h3 className="text-sm font-bold text-white">Tambah User</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition p-1"><X size={15} /></button>
        </div>

        <div className="flex flex-col gap-3.5 p-4 sm:p-5 overflow-y-auto max-h-[65vh]">
          <div>
            <label className={labelCls}>Nama</label>
            <input className={inputCls} value={form.name} onChange={setField('name')} placeholder="Nama lengkap" />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input type="email" className={inputCls} value={form.email} onChange={setField('email')} placeholder="email@perusahaan.com" />
          </div>
          <div>
            <label className={labelCls}>Department</label>
            <input className={inputCls} value={form.department} onChange={setField('department')} placeholder="IT, Finance, dll." />
          </div>
          <div>
            <label className={labelCls}>Password</label>
            <input type="password" className={inputCls} value={form.password} onChange={setField('password')} />
          </div>
          <div>
            <label className={labelCls}>Konfirmasi Password</label>
            <input type="password" className={inputCls} value={form.password_confirmation} onChange={setField('password_confirmation')} />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className={labelCls}>Role</label>
              <select className={inputCls} value={form.role} onChange={setField('role')}>
                {Object.keys(ROLE_CFG).map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select className={inputCls} value={form.is_active ? 'Active' : 'Inactive'} onChange={setField('is_active')}>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 px-4 sm:px-5 py-3.5 border-t border-gray-800">
          <button onClick={onClose} disabled={loading}
            className="px-4 py-2.5 sm:py-2 rounded-lg border border-gray-700 text-gray-400 text-sm hover:bg-white/5 transition text-center disabled:opacity-50">
            Batal
          </button>
          <button onClick={() => onSave(form)} disabled={loading}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition">
            <Save size={12} /> {loading ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── EditModal ────────────────────────────────────────────────
function EditModal({ user, onClose, onSave, loading }) {
  const [form, setForm] = useState({
    name: user.name ?? '', email: user.email ?? '', department: user.department ?? '',
    role: user.role ?? 'user', is_active: user.is_active ?? true, password: '',
  })

  const setField = (key) => (e) => {
    setForm(f => ({
      ...f,
      [key]: key === 'is_active' ? e.target.value === 'Active' : e.target.value,
    }))
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start sm:items-center justify-center z-50 p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md my-4 sm:my-0 shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-gray-800">
          <h3 className="text-sm font-bold text-white">Edit User</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition p-1"><X size={15} /></button>
        </div>

        <div className="flex flex-col gap-3.5 p-4 sm:p-5 overflow-y-auto max-h-[65vh]">
          <div>
            <label className={labelCls}>Nama</label>
            <input className={inputCls} value={form.name} onChange={setField('name')} />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input type="email" className={inputCls} value={form.email} onChange={setField('email')} />
          </div>
          <div>
            <label className={labelCls}>Department</label>
            <input className={inputCls} value={form.department} onChange={setField('department')} />
          </div>
          <div>
            <label className={labelCls}>Password <span className="normal-case font-normal text-gray-600">(kosong = tidak diubah)</span></label>
            <input type="password" className={inputCls} value={form.password} onChange={setField('password')}
              placeholder="Biarkan kosong jika tidak ingin ganti" />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className={labelCls}>Role</label>
              <select className={inputCls} value={form.role} onChange={setField('role')}>
                {Object.keys(ROLE_CFG).map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select className={inputCls} value={form.is_active ? 'Active' : 'Inactive'} onChange={setField('is_active')}>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 px-4 sm:px-5 py-3.5 border-t border-gray-800">
          <button onClick={onClose} disabled={loading}
            className="px-4 py-2.5 sm:py-2 rounded-lg border border-gray-700 text-gray-400 text-sm hover:bg-white/5 transition text-center disabled:opacity-50">
            Batal
          </button>
          <button onClick={() => onSave(user.id, form)} disabled={loading}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition">
            <Save size={12} /> {loading ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── DeleteModal ──────────────────────────────────────────────
function DeleteModal({ user, onClose, onConfirm, loading }) {
  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-5"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm p-5 sm:p-6 text-center shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-3">
          <AlertTriangle size={22} className="text-red-500" />
        </div>
        <h3 className="text-sm font-bold text-white mb-2">Hapus User?</h3>
        <p className="text-xs text-gray-400 mb-5 leading-relaxed">
          <strong className="text-white">{user.name}</strong> akan dihapus permanen.
        </p>
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-center">
          <button onClick={onClose} disabled={loading}
            className="px-4 py-2.5 sm:py-2 rounded-lg border border-gray-700 text-gray-400 text-sm hover:bg-white/5 transition disabled:opacity-50">
            Batal
          </button>
          <button onClick={() => onConfirm(user.id)} disabled={loading}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition">
            <Trash2 size={12} /> {loading ? 'Menghapus...' : 'Ya, Hapus'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Toast ────────────────────────────────────────────────────
function Toast({ message, type = 'success' }) {
  return (
    <div className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 px-4 py-2.5 rounded-xl text-white text-sm font-medium shadow-2xl max-w-[calc(100vw-2rem)]
      ${type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
      {message}
    </div>
  )
}

// ─── UserCard (mobile) ────────────────────────────────────────
function UserCard({ u, onEdit, onDelete, loading }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3.5 border-t border-gray-800 hover:bg-white/[0.02] transition">
      <Avatar initials={(u.name || '').slice(0, 2).toUpperCase()} size={36} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{u.name}</p>
            <p className="text-xs text-gray-500 truncate">{u.email}</p>
          </div>
          <div className="flex gap-1 shrink-0">
            <button onClick={() => onEdit(u)} disabled={loading}
              className="w-7 h-7 flex items-center justify-center rounded border border-gray-700 text-blue-400 hover:bg-blue-500/10 transition">
              <Edit2 size={11} />
            </button>
            <button onClick={() => onDelete(u)} disabled={loading}
              className="w-7 h-7 flex items-center justify-center rounded border border-gray-700 text-red-400 hover:bg-red-500/10 transition">
              <Trash2 size={11} />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap mt-1.5">
          <Badge label={u.role} cfg={ROLE_CFG[u.role] ?? ROLE_CFG['User']} />
          <Badge
            label={u.is_active ? 'Active' : 'Inactive'}
            cfg={{
              bg: u.is_active ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              text: u.is_active ? '#10B981' : '#EF4444',
              border: u.is_active ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
            }}
            dot
          />
          {u.department && <span className="text-[11px] text-gray-500">{u.department}</span>}
          <span className="text-[11px] text-gray-500 ml-auto font-mono">{u.tickets ?? 0} tiket</span>
        </div>
      </div>
    </div>
  )
}

// ─── UsersPage ────────────────────────────────────────────────
function UsersPage() {
  const { authFetch } = useAuth()
  const [users,         setUsers]         = useState([])
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState(null)
  const [editUser,      setEditUser]      = useState(null)
  const [deleteUser,    setDeleteUser]    = useState(null)
  const [addUserModal,  setAddUserModal]  = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [toast,         setToast]         = useState(null)
  const [page,          setPage]          = useState(1)
  const perPage = 10

  const { query, setQuery, results } = useSearch(users, ['name', 'email', 'department', 'role'])
  const totalPages = Math.ceil(results.length / perPage)
  const paginated  = results.slice((page - 1) * perPage, page * perPage)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true); setError(null)
      try {
        const token = localStorage.getItem('token')
        if (!token) throw new Error('Belum login')
        const headers = { Accept: 'application/json', Authorization: `Bearer ${token}` }
        const [resUsers, resTickets] = await Promise.all([
          authFetch('/api/users', { headers }),
          authFetch('/api/tickets', { headers }),
        ])
        if (!resUsers.ok) throw new Error('Gagal memuat users')
        const dataUsers = await resUsers.json()
        const rawUsers  = dataUsers.data ?? []
        let ticketCount = {}
        if (resTickets.ok) {
          const dataTickets = await resTickets.json()
          const tickets = dataTickets.data ?? []
          tickets.forEach(t => {
            const aid = t.assigned_to ?? t.assignee_id ?? t.technician_id ?? t.user_id
            if (aid != null) ticketCount[aid] = (ticketCount[aid] ?? 0) + 1
          })
        }
        setUsers(rawUsers.map(u => ({ ...u, tickets: ticketCount[u.id] ?? 0 })))
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleAddUser = async (form) => {
    setActionLoading(true)
    if (form.password !== form.password_confirmation) {
      showToast('Password dan konfirmasi tidak cocok', 'error')
      setActionLoading(false); return
    }
    if (!Object.keys(ROLE_CFG).includes(form.role)) {
      showToast('Role tidak valid', 'error')
      setActionLoading(false); return
    }
    try {
      const token = localStorage.getItem('token')
      const res   = await authFetch('/api/users', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Gagal menambahkan user')
      setUsers(prev => [...prev, { ...data.data, tickets: 0 }])
      setAddUserModal(false)
      showToast('User berhasil ditambahkan ✓')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSave = async (id, form) => {
    setActionLoading(true)
    try {
      const token   = localStorage.getItem('token')
      const payload = { ...form }
      if (!payload.password) delete payload.password
      const res  = await authFetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Gagal menyimpan')
      setUsers(prev => prev.map(u => u.id === id ? { ...u, ...form, password: undefined } : u))
      setEditUser(null)
      showToast('User berhasil diperbarui ✓')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async (id) => {
    setActionLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res   = await authFetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Gagal menghapus')
      setUsers(prev => prev.filter(u => u.id !== id))
      setDeleteUser(null)
      showToast('User berhasil dihapus')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <PageHeader
        title="User Management"
        subtitle={loading ? 'Memuat...' : error ? 'Gagal memuat data' : `${users.length} pengguna terdaftar`}
        action={
          <PrimaryButton icon={Plus} onClick={() => setAddUserModal(true)}>
            <span className="hidden xs:inline">Tambah User</span>
            <span className="xs:hidden">Tambah</span>
          </PrimaryButton>
        }
      />

      <SearchBar value={query} onChange={setQuery} placeholder="Cari nama, email, department..." disabled={loading} />

      {error && (
        <div className="px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">{error}</div>
      )}

      {/* Table + Card container */}
      <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/70 z-10 text-gray-400 text-sm">
            Memuat data...
          </div>
        )}

        {/* ── Desktop table: md+ ── */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full border-collapse min-w-[600px]">
            <thead className="bg-gray-800">
              <tr>
                {['User', 'Role', 'Department', 'Tiket', 'Status', 'Aksi'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map(u => (
                <tr key={u.id} className="border-t border-gray-800 hover:bg-white/[0.02] transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar initials={(u.name || '').slice(0, 2).toUpperCase()} size={32} />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-white truncate">{u.name}</div>
                        <div className="text-xs text-gray-500 truncate">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Badge label={u.role} cfg={ROLE_CFG[u.role] ?? ROLE_CFG['User']} />
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{u.department ?? '—'}</td>
                  <td className="px-4 py-3 font-mono text-sm text-gray-300">{u.tickets ?? 0}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Badge
                      label={u.is_active ? 'Active' : 'Inactive'}
                      cfg={{
                        bg:     u.is_active ? 'rgba(16,185,129,0.1)'  : 'rgba(239,68,68,0.1)',
                        text:   u.is_active ? '#10B981'                : '#EF4444',
                        border: u.is_active ? 'rgba(16,185,129,0.2)'  : 'rgba(239,68,68,0.2)',
                      }}
                      dot
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => setEditUser(u)} disabled={loading} title="Edit user"
                        className="w-7 h-7 flex items-center justify-center rounded border border-gray-700 text-blue-400 hover:bg-blue-500/10 transition">
                        <Edit2 size={11} />
                      </button>
                      <button onClick={() => setDeleteUser(u)} disabled={loading} title="Hapus user"
                        className="w-7 h-7 flex items-center justify-center rounded border border-gray-700 text-red-400 hover:bg-red-500/10 transition">
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Mobile card list: below md ── */}
        <div className="md:hidden flex flex-col">
          {paginated.map(u => (
            <UserCard key={u.id} u={u} onEdit={setEditUser} onDelete={setDeleteUser} loading={loading} />
          ))}
        </div>

        {!loading && paginated.length === 0 && (
          <EmptyState icon={Users} message="Tidak ada user ditemukan" />
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:justify-end items-center gap-2">
          <div className="flex items-center gap-1 flex-wrap justify-center">
            <button
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="h-8 px-3 rounded-lg bg-gray-800 border border-gray-700 text-white text-xs disabled:opacity-50 hover:bg-gray-700 transition"
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pNum => (
              <button
                key={pNum}
                onClick={() => setPage(pNum)}
                className={`min-w-[32px] h-8 px-2 rounded-lg border text-xs font-semibold transition
                  ${page === pNum
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                  }`}
              >
                {pNum}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="h-8 px-3 rounded-lg bg-gray-800 border border-gray-700 text-white text-xs disabled:opacity-50 hover:bg-gray-700 transition"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {addUserModal && <AddUserModal onClose={() => !actionLoading && setAddUserModal(false)} onSave={handleAddUser} loading={actionLoading} />}
      {editUser     && <EditModal   user={editUser}   onClose={() => !actionLoading && setEditUser(null)}   onSave={handleSave}   loading={actionLoading} />}
      {deleteUser   && <DeleteModal user={deleteUser} onClose={() => !actionLoading && setDeleteUser(null)} onConfirm={handleDelete} loading={actionLoading} />}
      {toast        && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}

export default UsersPage