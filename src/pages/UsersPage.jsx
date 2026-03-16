import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Users, X, Save, AlertTriangle } from 'lucide-react'
import { ROLE_CFG } from '../theme'
import { Badge, Avatar, PageHeader, SearchBar, PrimaryButton, EmptyState } from '../components/ui'
import { useTheme } from '../context/ThemeContext'
import useSearch from '../hooks/useSearch'

const ROLE_OPTIONS = [
  { label: 'Super Admin', value: 'super_admin' },
  { label: 'Manager IT',  value: 'manager_it'  },
  { label: 'IT Support',  value: 'it_support'  },
  { label: 'User',        value: 'user'        },
]

const makeInput = (theme, hasErr) => ({
  width: '100%', padding: '8px 10px', borderRadius: 8,
  border: `1px solid ${hasErr ? theme.danger : theme.border}`,
  background: theme.surfaceAlt, color: theme.text,
  fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
})
const makeLbl = (theme) => ({
  display: 'block', fontSize: 10, fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: '0.07em',
  color: theme.textMuted, marginBottom: 5,
})

// ─── Modal shell ──────────────────────────────────────────────
const ModalShell = ({ onClose, children, maxWidth = 440, theme }) => (
  <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: theme.overlay, backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 12 }}>
    <div onClick={e => e.stopPropagation()} style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 14, width: '100%', maxWidth, boxShadow: '0 25px 60px rgba(0,0,0,0.35)', overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
      {children}
    </div>
  </div>
)

// ─── AddModal ─────────────────────────────────────────────────
function AddModal({ onClose, onSave, loading, theme }) {
  const [form, setForm] = useState({ name: '', email: '', department: '', password: '', password_confirmation: '', role: 'user', is_active: true })
  const [errors, setErrors] = useState({})

  const setField = (key) => (e) => {
    setForm(f => ({ ...f, [key]: key === 'is_active' ? e.target.value === 'Active' : e.target.value }))
    setErrors(p => ({ ...p, [key]: null }))
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim())    errs.name = 'Nama wajib diisi'
    if (!form.email.trim())   errs.email = 'Email wajib diisi'
    if (!form.password)       errs.password = 'Password wajib diisi'
    if (form.password.length < 8) errs.password = 'Password minimal 8 karakter'
    if (form.password !== form.password_confirmation) errs.password_confirmation = 'Konfirmasi password tidak cocok'
    return errs
  }

  const handleSubmit = () => { const errs = validate(); if (Object.keys(errs).length) { setErrors(errs); return } onSave(form) }

  const inp = (key) => makeInput(theme, errors[key])
  const lbl = makeLbl(theme)

  return (
    <ModalShell onClose={onClose} theme={theme}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: `1px solid ${theme.border}`, flexShrink: 0 }}>
        <h3 style={{ color: theme.text, fontSize: 14, fontWeight: 700, margin: 0 }}>Tambah User</h3>
        <button onClick={onClose} style={{ color: theme.textMuted, background: 'none', border: 'none', cursor: 'pointer' }}><X size={16} /></button>
      </div>
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
        {[['Nama', 'name', 'text', 'Nama lengkap'], ['Email', 'email', 'email', 'email@contoh.com'], ['Department', 'department', 'text', 'Nama department'], ['Password', 'password', 'password', 'Min. 8 karakter'], ['Konfirmasi Password', 'password_confirmation', 'password', 'Ulangi password']].map(([label, key, type, ph]) => (
          <div key={key}>
            <label style={lbl}>{label}</label>
            <input type={type} style={inp(key)} value={form[key]} onChange={setField(key)} placeholder={ph} />
            {errors[key] && <p style={{ color: theme.danger, fontSize: 11, marginTop: 4 }}>{errors[key]}</p>}
          </div>
        ))}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={lbl}>Role</label>
            <select style={inp()} value={form.role} onChange={setField('role')}>
              {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Status</label>
            <select style={inp()} value={form.is_active ? 'Active' : 'Inactive'} onChange={setField('is_active')}>
              <option>Active</option><option>Inactive</option>
            </select>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 20px', borderTop: `1px solid ${theme.border}`, flexShrink: 0 }}>
        <button onClick={onClose} disabled={loading} style={{ padding: '7px 14px', borderRadius: 8, border: `1px solid ${theme.border}`, background: 'transparent', color: theme.textMuted, fontSize: 13, cursor: 'pointer' }}>Batal</button>
        <button onClick={handleSubmit} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: theme.accent, color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
          <Save size={12} /> {loading ? 'Menyimpan...' : 'Simpan'}
        </button>
      </div>
    </ModalShell>
  )
}

// ─── EditModal ────────────────────────────────────────────────
function EditModal({ user, onClose, onSave, loading, theme }) {
  const [form, setForm] = useState({ name: user.name ?? '', email: user.email ?? '', department: user.department ?? '', role: user.role ?? 'User', is_active: user.is_active ?? true })
  const setField = (key) => (e) => setForm(f => ({ ...f, [key]: key === 'is_active' ? e.target.value === 'Active' : e.target.value }))
  const inp = makeInput(theme, false); const lbl = makeLbl(theme)

  return (
    <ModalShell onClose={onClose} theme={theme}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: `1px solid ${theme.border}`, flexShrink: 0 }}>
        <h3 style={{ color: theme.text, fontSize: 14, fontWeight: 700, margin: 0 }}>Edit User</h3>
        <button onClick={onClose} style={{ color: theme.textMuted, background: 'none', border: 'none', cursor: 'pointer' }}><X size={16} /></button>
      </div>
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {[['Nama', 'name', 'text'], ['Email', 'email', 'email'], ['Department', 'department', 'text']].map(([label, key, type]) => (
          <div key={key}>
            <label style={lbl}>{label}</label>
            <input type={type} style={inp} value={form[key]} onChange={setField(key)} />
          </div>
        ))}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={lbl}>Role</label>
            <select style={inp} value={form.role} onChange={setField('role')}>
              {Object.keys(ROLE_CFG).map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Status</label>
            <select style={inp} value={form.is_active ? 'Active' : 'Inactive'} onChange={setField('is_active')}>
              <option>Active</option><option>Inactive</option>
            </select>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 20px', borderTop: `1px solid ${theme.border}`, flexShrink: 0 }}>
        <button onClick={onClose} disabled={loading} style={{ padding: '7px 14px', borderRadius: 8, border: `1px solid ${theme.border}`, background: 'transparent', color: theme.textMuted, fontSize: 13, cursor: 'pointer' }}>Batal</button>
        <button onClick={() => onSave(user.id, form)} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: theme.accent, color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
          <Save size={12} /> {loading ? 'Menyimpan...' : 'Simpan'}
        </button>
      </div>
    </ModalShell>
  )
}

// ─── DeleteModal ──────────────────────────────────────────────
function DeleteModal({ user, onClose, onConfirm, loading, theme }) {
  return (
    <ModalShell onClose={onClose} maxWidth={380} theme={theme}>
      <div style={{ padding: '24px 20px', textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
          <AlertTriangle size={22} color={theme.danger} />
        </div>
        <h3 style={{ color: theme.text, fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Hapus User?</h3>
        <p style={{ color: theme.textMuted, fontSize: 12, marginBottom: 20 }}>
          <strong style={{ color: theme.text }}>{user.name}</strong> akan dihapus permanen.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
          <button onClick={onClose} disabled={loading} style={{ padding: '7px 16px', borderRadius: 8, border: `1px solid ${theme.border}`, background: 'transparent', color: theme.textMuted, fontSize: 12, cursor: 'pointer' }}>Batal</button>
          <button onClick={() => onConfirm(user.id)} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 8, background: '#DC2626', color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            <Trash2 size={12} /> {loading ? 'Menghapus...' : 'Ya, Hapus'}
          </button>
        </div>
      </div>
    </ModalShell>
  )
}

// ─── Toast ────────────────────────────────────────────────────
function Toast({ message, type = 'success' }) {
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 50, padding: '10px 16px', borderRadius: 12, color: '#fff', fontSize: 13, fontWeight: 500, boxShadow: '0 10px 30px rgba(0,0,0,0.3)', background: type === 'success' ? '#059669' : '#DC2626' }}>
      {message}
    </div>
  )
}

// ─── UsersPage ────────────────────────────────────────────────
function UsersPage() {
  const { T: theme } = useTheme()

  const [users,         setUsers]         = useState([])
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState(null)
  const [addOpen,       setAddOpen]       = useState(false)
  const [editUser,      setEditUser]      = useState(null)
  const [deleteUser,    setDeleteUser]    = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [toast,         setToast]         = useState(null)
  const [page,          setPage]          = useState(1)
  const perPage = 10

  const { query, setQuery, results } = useSearch(users, ['name', 'email', 'department', 'role'])
  const totalPages = Math.ceil(results.length / perPage)
  const paginated  = results.slice((page - 1) * perPage, page * perPage)

  const showToast = (message, type = 'success') => { setToast({ message, type }); setTimeout(() => setToast(null), 3000) }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true); setError(null)
      try {
        const token = localStorage.getItem('token')
        if (!token) throw new Error('Belum login')
        const headers = { Accept: 'application/json', Authorization: `Bearer ${token}` }
        const [resUsers, resTickets] = await Promise.all([
          fetch('http://localhost:8000/api/users',   { headers }),
          fetch('http://localhost:8000/api/tickets', { headers }),
        ])
        if (!resUsers.ok) throw new Error('Gagal fetch users')
        const rawUsers = (await resUsers.json()).data ?? []
        let ticketCount = {}
        if (resTickets.ok) {
          const tickets = ((await resTickets.json()).data ?? [])
          tickets.forEach(t => { const id = t.assigned_to ?? t.assignee_id ?? t.technician_id ?? t.user_id; if (id != null) ticketCount[id] = (ticketCount[id] ?? 0) + 1 })
        }
        setUsers(rawUsers.map(u => ({ ...u, tickets: ticketCount[u.id] ?? 0 })))
      } catch (err) { setError(err.message) }
      finally { setLoading(false) }
    }
    loadData()
  }, [])

  const handleCreate = async (form) => {
    setActionLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('http://localhost:8000/api/users', { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.errors ? Object.values(data.errors).flat()[0] : data.message || 'Gagal menambahkan user')
      setUsers(p => [...p, { ...(data.user ?? data.data ?? data), tickets: 0 }])
      setAddOpen(false); showToast('User berhasil ditambahkan ✓')
    } catch (err) { showToast(err.message, 'error') }
    finally { setActionLoading(false) }
  }

  const handleSave = async (id, form) => {
    setActionLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`http://localhost:8000/api/users/${id}`, { method: 'PUT', headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(form) })
      const data = await res.json(); if (!res.ok) throw new Error(data.message || 'Gagal menyimpan')
      setUsers(p => p.map(u => u.id === id ? { ...u, ...form } : u)); setEditUser(null); showToast('User berhasil diperbarui ✓')
    } catch (err) { showToast(err.message, 'error') }
    finally { setActionLoading(false) }
  }

  const handleDelete = async (id) => {
    setActionLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`http://localhost:8000/api/users/${id}`, { method: 'DELETE', headers: { Accept: 'application/json', Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error('Gagal menghapus')
      setUsers(p => p.filter(u => u.id !== id)); setDeleteUser(null); showToast('User berhasil dihapus')
    } catch (err) { showToast(err.message, 'error') }
    finally { setActionLoading(false) }
  }

  const btnPage = {
    padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
    border: `1px solid ${theme.border}`, cursor: 'pointer', transition: 'all 0.15s',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="User Management"
        subtitle={loading ? 'Memuat...' : error ? 'Gagal memuat data' : `${users.length} pengguna terdaftar`}
        action={<PrimaryButton icon={Plus} onClick={() => setAddOpen(true)}>Tambah User</PrimaryButton>}
      />
      <SearchBar value={query} onChange={setQuery} placeholder="Cari nama, email, department..." disabled={loading} />
      {error && <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: theme.danger, fontSize: 12 }}>{error}</div>}

      {/* Table */}
      <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 14, overflow: 'hidden', position: 'relative' }}>
        {loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${theme.surface}CC`, zIndex: 10, fontSize: 13, color: theme.textMuted }}>Memuat data...</div>
        )}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
            <thead>
              <tr style={{ background: theme.surfaceAlt }}>
                {['User', 'Role', 'Department', 'Tiket', 'Status', 'Aksi'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: `1px solid ${theme.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map(u => (
                <tr key={u.id} style={{ borderTop: `1px solid ${theme.border}`, transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = theme.surfaceHover}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar initials={(u.name || '').slice(0, 2).toUpperCase()} size={32} />
                      <div>
                        <div style={{ color: theme.text, fontSize: 13, fontWeight: 500 }}>{u.name}</div>
                        <div style={{ color: theme.textMuted, fontSize: 11 }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <Badge label={u.role} cfg={ROLE_CFG[u.role] ?? ROLE_CFG['User']} />
                  </td>
                  <td style={{ padding: '12px 16px', color: theme.textMuted, fontSize: 12 }}>{u.department ?? '—'}</td>
                  <td style={{ padding: '12px 16px', color: theme.text, fontFamily: 'monospace', fontSize: 13 }}>{u.tickets ?? 0}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <Badge
                      label={u.is_active ? 'Active' : 'Inactive'}
                      cfg={{
                        bg:     u.is_active ? 'rgba(16,185,129,0.10)' : 'rgba(239,68,68,0.10)',
                        text:   u.is_active ? theme.success            : theme.danger,
                        border: u.is_active ? 'rgba(16,185,129,0.22)' : 'rgba(239,68,68,0.22)',
                      }}
                      dot
                    />
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => setEditUser(u)} disabled={loading} title="Edit user" style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, border: `1px solid ${theme.border}`, background: 'transparent', color: theme.accent, cursor: 'pointer' }}>
                        <Edit2 size={11} />
                      </button>
                      <button onClick={() => setDeleteUser(u)} disabled={loading} title="Hapus user" style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, border: `1px solid ${theme.border}`, background: 'transparent', color: theme.danger, cursor: 'pointer' }}>
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && paginated.length === 0 && <EmptyState icon={Users} message="Tidak ada user ditemukan" />}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6 }}>
          <button onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1}
            style={{ ...btnPage, background: theme.surface, color: page === 1 ? theme.textDim : theme.textMuted, cursor: page === 1 ? 'not-allowed' : 'pointer' }}>
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(pNum => (
            <button key={pNum} onClick={() => setPage(pNum)} style={{ ...btnPage, background: page === pNum ? theme.accent : theme.surface, color: page === pNum ? '#fff' : theme.textMuted, borderColor: page === pNum ? theme.accent : theme.border }}>
              {pNum}
            </button>
          ))}
          <button onClick={() => setPage(p => Math.min(p + 1, totalPages))} disabled={page === totalPages}
            style={{ ...btnPage, background: theme.surface, color: page === totalPages ? theme.textDim : theme.textMuted, cursor: page === totalPages ? 'not-allowed' : 'pointer' }}>
            Next
          </button>
        </div>
      )}

      {addOpen    && <AddModal    onClose={() => !actionLoading && setAddOpen(false)}   onSave={handleCreate} loading={actionLoading} theme={theme} />}
      {editUser   && <EditModal   user={editUser}   onClose={() => !actionLoading && setEditUser(null)}   onSave={handleSave}   loading={actionLoading} theme={theme} />}
      {deleteUser && <DeleteModal user={deleteUser} onClose={() => !actionLoading && setDeleteUser(null)} onConfirm={handleDelete} loading={actionLoading} theme={theme} />}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}

export default UsersPage