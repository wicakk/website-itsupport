import { useState, useEffect, useCallback, useRef } from 'react'
import { Server, CheckCircle2, AlertTriangle, XCircle, RefreshCw, Cpu, Database, HardDrive, Activity, Plus, X, Trash2 } from 'lucide-react'
import { SERVER_STATUS_CFG } from '../theme'
import { Badge, PageHeader, ProgressBar } from '../components/ui'
import { useAuth } from '../context/AppContext'
import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

const REVERB_KEY    = import.meta.env.VITE_REVERB_APP_KEY
const REVERB_HOST   = import.meta.env.VITE_REVERB_HOST   ?? 'localhost'
const REVERB_PORT   = import.meta.env.VITE_REVERB_PORT   ?? 8080
const REVERB_SCHEME = import.meta.env.VITE_REVERB_SCHEME ?? 'http'
const API_URL       = import.meta.env.VITE_API_URL        ?? 'http://localhost:8000'

const calcStatus = (cpu, ram, disk) => {
  if (cpu > 90 || ram > 90 || disk > 95) return 'Down'
  if (cpu > 70 || ram > 75 || disk > 85) return 'Warning'
  return 'Online'
}

// ─── Modal Konfirmasi Delete ──────────────────────────────────
const DeleteConfirmModal = ({ server, onClose, onConfirm, loading }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
    <div className="w-full max-w-sm bg-gray-900 rounded-2xl border border-gray-700 shadow-2xl">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <Trash2 size={15} className="text-red-400" />
          </div>
          <span className="font-bold text-gray-100 text-sm">Hapus Server</span>
        </div>
        <button onClick={onClose} className="w-7 h-7 rounded-lg border border-gray-700 flex items-center justify-center text-gray-400 hover:bg-white/10 transition">
          <X size={13} />
        </button>
      </div>
      <div className="px-6 py-5">
        <p className="text-sm text-gray-300 leading-relaxed">
          Apakah kamu yakin ingin menghapus server{' '}
          <span className="font-mono font-bold text-red-400">{server.name}</span>?
        </p>
        <p className="text-xs text-gray-500 mt-2">{server.ip_address} · {server.os}</p>
        <div className="mt-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          Tindakan ini tidak dapat dibatalkan.
        </div>
      </div>
      <div className="flex gap-2 px-6 pb-5">
        <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-gray-700 text-gray-400 text-sm hover:bg-white/5 transition">
          Batal
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-semibold transition flex items-center justify-center gap-2"
        >
          {loading ? <RefreshCw size={13} className="animate-spin" /> : <Trash2 size={13} />}
          {loading ? 'Menghapus...' : 'Ya, Hapus'}
        </button>
      </div>
    </div>
  </div>
)

// ─── Modal Tambah Server ──────────────────────────────────────
const EMPTY_FORM = { name: '', ip_address: '', port: '9090', os: '' }

const AddServerModal = ({ onClose, onAdd, authFetch }) => {
  const [form, setForm]       = useState(EMPTY_FORM)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async () => {
    if (!form.name.trim())       return setError('Nama server wajib diisi.')
    if (!form.ip_address.trim()) return setError('IP Address wajib diisi.')
    if (!form.port.trim())       return setError('Port wajib diisi.')
    if (!form.os.trim())         return setError('OS wajib diisi.')
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/
    if (!ipRegex.test(form.ip_address)) return setError('Format IP Address tidak valid.')
    if (isNaN(form.port) || form.port < 1 || form.port > 65535) return setError('Port harus angka antara 1–65535.')

    setLoading(true)
    try {
      const res = await authFetch(`${API_URL}/api/monitoring`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body:    JSON.stringify({
          name:       form.name.trim(),
          ip_address: form.ip_address.trim(),
          port:       Number(form.port),
          os:         form.os.trim(),
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message ?? 'Gagal menyimpan server.')
      }
      const data = await res.json()
      onAdd(data.server)
      onClose()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-gray-900 rounded-2xl border border-gray-700 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Plus size={15} className="text-blue-400" />
            </div>
            <span className="font-bold text-gray-100 text-sm">Tambah Server Baru</span>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg border border-gray-700 flex items-center justify-center text-gray-400 hover:bg-white/10 transition">
            <X size={13} />
          </button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          {[
            { label: 'Nama Server',    name: 'name',       placeholder: 'contoh: APP-SERVER-01', type: 'text'   },
            { label: 'IP Address',     name: 'ip_address', placeholder: 'contoh: 192.168.1.20',  type: 'text'   },
            { label: 'Port Agent',     name: 'port',       placeholder: 'default: 9090',          type: 'number' },
            { label: 'Sistem Operasi', name: 'os',         placeholder: 'contoh: Ubuntu 22.04',  type: 'text'   },
          ].map(field => (
            <div key={field.name}>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">{field.label}</label>
              <input
                type={field.type}
                name={field.name}
                value={form[field.name]}
                onChange={handleChange}
                placeholder={field.placeholder}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          ))}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              <XCircle size={12} /> {error}
            </div>
          )}
        </div>
        <div className="flex gap-2 px-6 pb-5">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-gray-700 text-gray-400 text-sm hover:bg-white/5 transition">
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold transition flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw size={13} className="animate-spin" /> : <Plus size={13} />}
            {loading ? 'Menyimpan...' : 'Simpan Server'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Hook realtime ────────────────────────────────────────────
const useServerMonitor = (servers, authFetch) => {
  const [metrics, setMetrics] = useState({})
  const echoRef = useRef(null)

  useEffect(() => {
    if (!REVERB_KEY) return
    window.Pusher = Pusher
    echoRef.current = new Echo({
      broadcaster:       'reverb',
      key:               REVERB_KEY,
      wsHost:            REVERB_HOST,
      wsPort:            Number(REVERB_PORT),
      wssPort:           Number(REVERB_PORT),
      forceTLS:          REVERB_SCHEME === 'https',
      enabledTransports: ['ws', 'wss'],
    })
    return () => { echoRef.current?.disconnect(); echoRef.current = null }
  }, [])

  useEffect(() => {
    setMetrics(prev => {
      const next = { ...prev }
      servers.forEach(s => {
        if (!next[s.name]) {
          next[s.name] = {
            cpu: s.cpu_base ?? 0, ram: s.ram_base ?? 0, disk: s.disk_base ?? 0,
            uptime: '—', status: calcStatus(s.cpu_base ?? 0, s.ram_base ?? 0, s.disk_base ?? 0),
            simulated: true, lastUpdate: null,
          }
        }
      })
      return next
    })
  }, [servers])

  const refetch = useCallback(() => {
    authFetch(`${API_URL}/api/monitoring`)
      .then(r => r.json())
      .then(data => {
        const map = {}
        data.servers.forEach(s => {
          map[s.name] = {
            cpu:        s.cpu_usage  ?? 0,
            ram:        s.ram_usage  ?? 0,
            disk:       s.disk_usage ?? 0,
            uptime:     s.uptime     ?? '—',
            status:     s.status,
            simulated:  false,
            lastUpdate: new Date(s.updated_at),
          }
        })
        setMetrics(prev => ({ ...prev, ...map }))
      })
      .catch(() => {})
  }, [authFetch])

  useEffect(() => { refetch() }, [refetch])

  useEffect(() => {
    if (!echoRef.current) return
    const channel = echoRef.current.channel('monitoring')
    channel.listen('.metrics.updated', (data) => {
      setMetrics(prev => ({
        ...prev,
        [data.name]: {
          cpu:        data.cpu_usage  ?? 0,
          ram:        data.ram_usage  ?? 0,
          disk:       data.disk_usage ?? 0,
          uptime:     data.uptime     ?? '—',
          status:     data.status,
          simulated:  false,
          lastUpdate: new Date(data.updated_at),
        }
      }))
    })
    return () => echoRef.current?.leaveChannel('monitoring')
  }, [])

  return { metrics, refetch, echo: echoRef.current }
}

// ─── ServerCard ───────────────────────────────────────────────
const ServerCard = ({ server, metric, onRefresh, onDelete }) => {
  const cpu        = metric?.cpu       ?? 0
  const ram        = metric?.ram       ?? 0
  const disk       = metric?.disk      ?? 0
  const status     = metric?.status    ?? 'Online'
  const uptime     = metric?.uptime    ?? '—'
  const simulated  = metric?.simulated ?? true
  const lastUpdate = metric?.lastUpdate

  const cfg = SERVER_STATUS_CFG[status] ?? SERVER_STATUS_CFG['Unknown'] ?? {
    color: '#888', border: '#444', bg: 'transparent'
  }

  return (
    <div
      className="bg-gray-900 rounded-xl border p-4 sm:p-5 shadow-md hover:shadow-lg transition-shadow"
      style={{ borderColor: cfg.border }}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
          <div
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg border flex items-center justify-center shrink-0"
            style={{ background: `${cfg.color}12`, borderColor: `${cfg.color}25` }}
          >
            <Server size={17} color={cfg.color} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="font-mono font-bold text-sm text-gray-100 truncate">{server.name}</span>
              <Badge label={status} cfg={{ bg: cfg.bg, text: cfg.color, border: cfg.border }} dot />
              {simulated && (
                <span className="flex items-center gap-1 text-[10px] text-amber-400 border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 rounded-full">
                  <Activity size={9} /> simulasi
                </span>
              )}
            </div>
            <div className="text-[11px] text-gray-500 leading-snug">
              <span className="block sm:inline">{server.ip_address}:{server.port}</span>
              <span className="hidden sm:inline"> · </span>
              <span className="block sm:inline">{server.os}</span>
              <span className="hidden sm:inline"> · </span>
              <span className="block sm:inline">Uptime: {uptime}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <div className="flex items-center gap-1">
            <button
              onClick={() => onRefresh()}
              className="w-8 h-8 rounded-lg border border-gray-700 flex items-center justify-center bg-white/5 text-gray-400 hover:bg-white/10 transition"
              title="Refresh"
            >
              <RefreshCw size={13} />
            </button>
            <button
              onClick={() => onDelete(server)}
              className="w-8 h-8 rounded-lg border border-red-500/30 flex items-center justify-center bg-red-500/5 text-red-400 hover:bg-red-500/20 transition"
              title="Hapus server"
            >
              <Trash2 size={13} />
            </button>
          </div>
          <span className="text-[10px] text-gray-600">
            {lastUpdate ? lastUpdate.toLocaleTimeString('id-ID') : '—'}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5">
        {[
          ['CPU Usage',  cpu,  Cpu],
          ['RAM Usage',  ram,  Database],
          ['Disk Usage', disk, HardDrive],
        ].map(([label, val, Ic], i) => (
          <div key={i}>
            <div className="flex items-center justify-between sm:justify-start gap-1 text-xs text-gray-500 mb-1.5">
              <span className="flex items-center gap-1"><Ic size={11} /> {label}</span>
              <span className="text-gray-400 font-semibold text-[11px] sm:hidden">{val}%</span>
            </div>
            <ProgressBar value={val} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── MonitoringPage ───────────────────────────────────────────
const MonitoringPage = () => {
  const { authFetch }                       = useAuth()
  const [servers, setServers]               = useState([])
  const [loadingServers, setLoadingServers] = useState(true)
  const [showModal, setShowModal]           = useState(false)
  const [deleteTarget, setDeleteTarget]     = useState(null)
  const [deleteLoading, setDeleteLoading]   = useState(false)
  const { metrics, refetch, echo }          = useServerMonitor(servers, authFetch)

  useEffect(() => {
    authFetch(`${API_URL}/api/monitoring`)
      .then(r => r.json())
      .then(data => {
        setServers(data.servers.map(s => ({
          id:         s.id,
          name:       s.name,
          ip_address: s.ip_address,
          port:       s.port,
          os:         s.os ?? '—',
          cpu_base:   s.cpu_usage  ?? 0,
          ram_base:   s.ram_usage  ?? 0,
          disk_base:  s.disk_usage ?? 0,
        })))
      })
      .catch(() => {})
      .finally(() => setLoadingServers(false))
  }, [authFetch])

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      const res = await authFetch(`${API_URL}/api/monitoring/${deleteTarget.id}`, {
        method:  'DELETE',
        headers: { 'Accept': 'application/json' },
      })
      if (!res.ok) throw new Error('Gagal menghapus server.')
      setServers(prev => prev.filter(s => s.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (e) {
      alert(e.message)
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleAddServer = (newServer) => {
    setServers(prev => [...prev, {
      id:         newServer.id,
      name:       newServer.name,
      ip_address: newServer.ip_address,
      port:       newServer.port,
      os:         newServer.os ?? '—',
      cpu_base:   0,
      ram_base:   0,
      disk_base:  0,
    }])
    refetch()
  }

  const onlineCount  = Object.values(metrics).filter(m => m.status === 'Online').length
  const warningCount = Object.values(metrics).filter(m => m.status === 'Warning').length
  const downCount    = Object.values(metrics).filter(m => m.status === 'Down').length
  const simCount     = Object.values(metrics).filter(m => m.simulated).length

  return (
    <div className="flex flex-col gap-4 sm:gap-6">

      <div className="flex items-start justify-between gap-3">
        <PageHeader title="Monitoring" subtitle="Real-time server status" />
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <div className="flex items-center gap-2 px-3 sm:px-4 py-1 rounded-full border border-green-500/50 bg-green-500/10 shrink-0">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-semibold text-green-400">{echo ? 'Live' : 'Polling'}</span>
          </div>
          <button onClick={refetch} className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-gray-700 bg-white/5 text-gray-400 hover:bg-white/10 text-xs transition">
            <RefreshCw size={11} /> Refresh
          </button>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-blue-500/50 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-xs font-semibold transition">
            <Plus size={11} /> Tambah Server
          </button>
        </div>
      </div>

      {simCount > 0 && (
        <div className="flex items-start gap-2 px-4 py-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs">
          <Activity size={13} className="mt-0.5 shrink-0" />
          <span>
            <strong>{simCount} server</strong> belum terjangkau — menampilkan data simulasi.
            Pasang <code className="bg-amber-500/20 px-1 rounded font-mono">monitor_agent.py</code> di server target dan pastikan port <strong>9090</strong> terbuka.
          </span>
        </div>
      )}

      {!echo && (
        <div className="flex items-start gap-2 px-4 py-2.5 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs">
          <Activity size={13} className="mt-0.5 shrink-0" />
          <span>
            WebSocket belum terhubung. Tambahkan <code className="bg-blue-500/20 px-1 rounded font-mono">VITE_REVERB_APP_KEY</code> di file <code className="bg-blue-500/20 px-1 rounded font-mono">.env</code> lalu restart Vite.
          </span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        {[
          [onlineCount,  'Online',  CheckCircle2,  'text-emerald-400', 'border-emerald-500/20', 'bg-emerald-500/5'],
          [warningCount, 'Warning', AlertTriangle, 'text-amber-400',   'border-amber-500/20',   'bg-amber-500/5'  ],
          [downCount,    'Down',    XCircle,       'text-red-400',     'border-red-500/20',      'bg-red-500/5'    ],
        ].map(([v, l, Ic, textCls, borderCls, bgCls], i) => (
          <div key={i} className={`flex flex-col items-center justify-center rounded-xl border p-3 sm:p-5 shadow-md ${bgCls} ${borderCls}`}>
            <Ic size={20} className={`mb-1.5 sm:mb-2 ${textCls}`} />
            <div className={`font-extrabold text-xl sm:text-2xl ${textCls}`}>{v}</div>
            <div className="text-xs text-gray-400 mt-0.5 sm:mt-1">{l}</div>
          </div>
        ))}
      </div>

      {loadingServers && (
        <div className="flex items-center justify-center py-12 text-gray-500 text-sm gap-2">
          <RefreshCw size={14} className="animate-spin" />
          Memuat daftar server...
        </div>
      )}

      {!loadingServers && servers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500 text-sm gap-3">
          <div className="w-14 h-14 rounded-2xl border border-gray-700 bg-gray-800 flex items-center justify-center">
            <Server size={24} className="text-gray-600" />
          </div>
          <span>Belum ada server yang dimonitor.</span>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-blue-500/50 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-xs font-semibold transition">
            <Plus size={12} /> Tambah Server Pertama
          </button>
        </div>
      )}

      {!loadingServers && servers.length > 0 && (
        <div className="flex flex-col gap-3 sm:gap-4">
          {servers.map(s => (
            <ServerCard
              key={s.id}
              server={s}
              metric={metrics[s.name]}
              onRefresh={refetch}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      {showModal && (
        <AddServerModal
          onClose={() => setShowModal(false)}
          onAdd={handleAddServer}
          authFetch={authFetch}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          server={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
          loading={deleteLoading}
        />
      )}

    </div>
  )
}

export default MonitoringPage