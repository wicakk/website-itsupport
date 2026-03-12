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
const EditModal = ({ user, onClose, onSave, loading }) => {
  const [form, setForm] = useState({
    name: user.name ?? '',
    email: user.email ?? '',
    department: user.department ?? '',
    role: user.role ?? 'User',
    status: user.status ?? 'Active',
  })

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

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
    display: 'block',
    fontSize: 11,
    fontWeight: 600,
    color: T.textDim,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 4,
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: T.surface ?? '#1e2433',
          borderRadius: 12,
          width: 440,
          maxWidth: '90vw',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: `1px solid ${T.border}`,
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>
            Edit User
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: T.textDim,
              padding: 4,
              display: 'flex',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Nama</label>
            <input style={inputStyle} value={form.name} onChange={set('name')} />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input style={inputStyle} type="email" value={form.email} onChange={set('email')} />
          </div>
          <div>
            <label style={labelStyle}>Department</label>
            <input style={inputStyle} value={form.department} onChange={set('department')} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Role</label>
              <select style={inputStyle} value={form.role} onChange={set('role')}>
                {Object.keys(ROLE_CFG).map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select style={inputStyle} value={form.status} onChange={set('status')}>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            padding: '12px 20px',
            borderTop: `1px solid ${T.border}`,
          }}
        >
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '7px 14px',
              borderRadius: 6,
              border: `1px solid ${T.border}`,
              background: 'transparent',
              fontSize: 12,
              cursor: 'pointer',
              color: T.text,
            }}
          >
            Batal
          </button>
          <button
            onClick={() => onSave(user.id, form)}
            disabled={loading}
            style={{
              padding: '7px 14px',
              borderRadius: 6,
              border: 'none',
              background: T.primary,
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              opacity: loading ? 0.7 : 1,
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

/* ─── Modal Konfirmasi Hapus ─────────────────────────────── */
const DeleteModal = ({ user, onClose, onConfirm, loading }) => (
  <div
    style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.45)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}
    onClick={onClose}
  >
    <div
      style={{
        background: T.surface ?? '#1e2433',
        borderRadius: 12,
        width: 380,
        maxWidth: '90vw',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        padding: 24,
        textAlign: 'center',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: `${T.danger}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 14px',
        }}
      >
        <AlertTriangle size={22} color={T.danger} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 8 }}>
        Hapus User?
      </div>
      <div style={{ fontSize: 13, color: T.textDim, marginBottom: 20 }}>
        <strong style={{ color: T.text }}>{user.name}</strong> akan dihapus secara
        permanen dan tidak bisa dikembalikan.
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        <button
          onClick={onClose}
          disabled={loading}
          style={{
            padding: '8px 18px',
            borderRadius: 6,
            border: `1px solid ${T.border}`,
            background: 'transparent',
            fontSize: 12,
            cursor: 'pointer',
            color: T.text,
          }}
        >
          Batal
        </button>
        <button
          onClick={() => onConfirm(user.id)}
          disabled={loading}
          style={{
            padding: '8px 18px',
            borderRadius: 6,
            border: 'none',
            background: T.danger,
            color: '#fff',
            fontSize: 12,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            opacity: loading ? 0.7 : 1,
          }}
        >
          <Trash2 size={12} />
          {loading ? 'Menghapus...' : 'Ya, Hapus'}
        </button>
      </div>
    </div>
  </div>
)

/* ─── Toast Notifikasi ───────────────────────────────────── */
const Toast = ({ message, type = 'success' }) => (
  <div
    style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      padding: '10px 16px',
      borderRadius: 8,
      background: type === 'success' ? T.success : T.danger,
      color: '#fff',
      fontSize: 13,
      fontWeight: 500,
      boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
      zIndex: 2000,
      animation: 'fadeIn 0.2s ease',
    }}
  >
    {message}
  </div>
)

/* ─── Halaman Utama ──────────────────────────────────────── */
const UsersPage = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Modal state
  const [editUser, setEditUser] = useState(null)      // user yang sedang diedit
  const [deleteUser, setDeleteUser] = useState(null)  // user yang akan dihapus
  const [actionLoading, setActionLoading] = useState(false)
  const [toast, setToast] = useState(null)

  const { query, setQuery, results } = useSearch(users, [
    'name',
    'email',
    'department',
    'role',
  ])

  /* Tampilkan toast sementara */
  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  /* Load data: users + tickets parallel, hitung tiket per user */
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)
      try {
        const token = localStorage.getItem('token')
        if (!token) throw new Error('Belum login. Silakan login dulu.')

        const headers = {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        }

        // Fetch users & tickets secara parallel
        const [resUsers, resTickets] = await Promise.all([
          fetch('http://localhost:8000/api/users', { headers }),
          fetch('http://localhost:8000/api/tickets', { headers }),
        ])

        if (!resUsers.ok) {
          const text = await resUsers.text()
          throw new Error(`HTTP ${resUsers.status} - ${text.substring(0, 100)}`)
        }

        const dataUsers = await resUsers.json()
        const rawUsers = dataUsers.data ?? []

        // Hitung tiket per user dari /api/tickets
        // Field assignee: assigned_to / assignee_id / technician_id — sesuaikan jika perlu
        let ticketCount = {}
        if (resTickets.ok) {
          const dataTickets = await resTickets.json()
          const tickets = dataTickets.data ?? dataTickets ?? []
          tickets.forEach((t) => {
            const assigneeId =
              t.assigned_to ?? t.assignee_id ?? t.technician_id ?? t.user_id
            if (assigneeId != null) {
              ticketCount[assigneeId] = (ticketCount[assigneeId] ?? 0) + 1
            }
          })
        }

        // Inject jumlah tiket ke masing-masing user
        const usersWithTickets = rawUsers.map((u) => ({
          ...u,
          tickets: ticketCount[u.id] ?? 0,
        }))

        setUsers(usersWithTickets)
      } catch (err) {
        console.error('Error load data', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  /* ── Simpan Edit ── */
  const handleSave = async (id, form) => {
    setActionLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`http://localhost:8000/api/users/${id}`, {
        method: 'PUT',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Gagal menyimpan: ${text.substring(0, 100)}`)
      }

      // Update data lokal tanpa reload
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, ...form } : u))
      )
      setEditUser(null)
      showToast('User berhasil diperbarui ✓')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  /* ── Hapus User ── */
  const handleDelete = async (id) => {
    setActionLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`http://localhost:8000/api/users/${id}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Gagal menghapus: ${text.substring(0, 100)}`)
      }

      // Hapus dari state lokal
      setUsers((prev) => prev.filter((u) => u.id !== id))
      setDeleteUser(null)
      showToast('User berhasil dihapus')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="User Management"
        subtitle={
          loading
            ? 'Memuat...'
            : error
            ? 'Gagal memuat data'
            : `${users.length} pengguna terdaftar`
        }
        action={<PrimaryButton icon={Plus}>Tambah User</PrimaryButton>}
      />

      <SearchBar
        value={query}
        onChange={setQuery}
        placeholder="Cari nama, email, department..."
        disabled={loading}
      />

      {error && (
        <div
          style={{
            padding: 12,
            borderRadius: 8,
            background: `${T.danger}10`,
            color: T.danger,
            marginBottom: 10,
            fontSize: 12,
          }}
        >
          {error}
        </div>
      )}

      <Card style={{ overflow: 'hidden', position: 'relative' }}>
        {loading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255,255,255,0.6)',
              zIndex: 10,
            }}
          >
            Memuat data...
          </div>
        )}

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.border}` }}>
              {['User', 'Role', 'Department', 'Tiket', 'Status', 'Aksi'].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: 10,
                    fontWeight: 700,
                    color: T.textDim,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {results.map((u) => (
              <tr
                key={u.id}
                style={{
                  borderBottom: `1px solid ${T.border}`,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = `${T.border}40`)}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '13px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar initials={(u.name || '').slice(0, 2).toUpperCase()} size={32} />
                    <div>
                      <div style={{ color: T.text, fontSize: 13, fontWeight: 500 }}>
                        {u.name}
                      </div>
                      <div style={{ color: T.textDim, fontSize: 11 }}>{u.email}</div>
                    </div>
                  </div>
                </td>

                <td style={{ padding: '13px 16px' }}>
                  <Badge label={u.role} cfg={ROLE_CFG[u.role] ?? ROLE_CFG['User']} />
                </td>

                <td style={{ padding: '13px 16px', color: T.textMuted, fontSize: 12 }}>
                  {u.department ?? '-'}
                </td>

                <td style={{ padding: '13px 16px', fontFamily: 'monospace' }}>
                  {u.tickets ?? 0}
                </td>

                <td style={{ padding: '13px 16px' }}>
                  <Badge
                    label={u.status ?? 'Active'}
                    cfg={{
                      bg: (u.status === 'Inactive')
                        ? `${T.danger}15`
                        : 'rgba(16,185,129,0.10)',
                      text: (u.status === 'Inactive') ? T.danger : T.success,
                      border: (u.status === 'Inactive')
                        ? `${T.danger}30`
                        : 'rgba(16,185,129,0.22)',
                    }}
                    dot
                  />
                </td>

                <td style={{ padding: '13px 16px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {/* Tombol Edit */}
                    <button
                      onClick={() => setEditUser(u)}
                      disabled={loading}
                      title="Edit user"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        border: `1px solid ${T.border}`,
                        background: 'none',
                        cursor: 'pointer',
                        color: T.primary,
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = `${T.primary}15`)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = 'none')
                      }
                    >
                      <Edit2 size={11} />
                    </button>

                    {/* Tombol Hapus */}
                    <button
                      onClick={() => setDeleteUser(u)}
                      disabled={loading}
                      title="Hapus user"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        border: `1px solid ${T.border}`,
                        background: 'none',
                        cursor: 'pointer',
                        color: T.danger,
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = `${T.danger}15`)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = 'none')
                      }
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && results.length === 0 && (
          <EmptyState icon={Users} message="Tidak ada user ditemukan" />
        )}
      </Card>

      {/* Modal Edit */}
      {editUser && (
        <EditModal
          user={editUser}
          onClose={() => !actionLoading && setEditUser(null)}
          onSave={handleSave}
          loading={actionLoading}
        />
      )}

      {/* Modal Hapus */}
      {deleteUser && (
        <DeleteModal
          user={deleteUser}
          onClose={() => !actionLoading && setDeleteUser(null)}
          onConfirm={handleDelete}
          loading={actionLoading}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}

export default UsersPage