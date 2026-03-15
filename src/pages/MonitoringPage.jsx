import { useState, useEffect, useCallback, useRef } from 'react'
import { Server, CheckCircle2, AlertTriangle, XCircle, RefreshCw, Cpu, Database, HardDrive, Activity } from 'lucide-react'
import { SERVER_STATUS_CFG } from '../theme'
import { Card, Badge, PageHeader, ProgressBar } from '../components/ui'

// ─── Config server (ganti IP sesuai jaringan Anda) ───────────
const SERVERS_CONFIG = [
  { id:1, name:'WEB-SERVER-01',  ip_address:'192.168.1.10', port:9090, os:'Ubuntu 22.04',        cpu_base:45, ram_base:67, disk_base:55 },
  { id:2, name:'DB-SERVER-01',   ip_address:'192.168.1.11', port:9090, os:'CentOS 8',            cpu_base:78, ram_base:82, disk_base:73 },
  { id:3, name:'FILE-SERVER-01', ip_address:'192.168.1.12', port:9090, os:'Windows Server 2022', cpu_base:23, ram_base:45, disk_base:91 },
  { id:4, name:'MAIL-SERVER-01', ip_address:'192.168.1.13', port:9090, os:'Ubuntu 20.04',        cpu_base:56, ram_base:61, disk_base:40 },
  { id:5, name:'BACKUP-SERVER',  ip_address:'192.168.1.14', port:9090, os:'Debian 11',           cpu_base:12, ram_base:34, disk_base:88 },
]

// ─── Simulasi data saat agent tidak bisa diakses ─────────────
const simulateMetrics = (server, prev) => {
  const jitter = (base, prevVal) => {
    const val = prevVal ?? base
    return Math.min(100, Math.max(0, val + Math.floor(Math.random() * 11 - 5)))
  }
  return {
    cpu:       jitter(server.cpu_base, prev?.cpu),
    ram:       jitter(server.ram_base, prev?.ram),
    disk:      jitter(server.disk_base, prev?.disk),
    uptime:    prev?.uptime ?? '—',
    simulated: true,
    error:     null,
  }
}

// ─── Hitung status dari nilai metrics ────────────────────────
const calcStatus = (cpu, ram, disk) => {
  if (cpu > 90 || ram > 90 || disk > 95) return 'Down'
  if (cpu > 70 || ram > 75 || disk > 85) return 'Warning'
  return 'Online'
}

// ─── Fetch dari agent, fallback ke simulasi ──────────────────
const fetchOrSimulate = async (server, prevMetric) => {
  try {
    const res = await fetch(
      `http://${server.ip_address}:${server.port}/metrics`,
      { signal: AbortSignal.timeout(3000) }
    )
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return {
      cpu:       Math.round(data.cpu?.percent     ?? data.cpu  ?? 0),
      ram:       Math.round(data.memory?.percent  ?? data.ram  ?? 0),
      disk:      Math.round(data.storage?.percent ?? data.disk ?? 0),
      uptime:    data.uptime ?? '—',
      simulated: false,
      error:     null,
    }
  } catch {
    // Agent tidak bisa diakses → pakai simulasi, tidak error
    return simulateMetrics(server, prevMetric)
  }
}

// ─── Hook utama ───────────────────────────────────────────────
const useServerMonitor = (servers, intervalMs = 5000) => {
  const [metrics, setMetrics] = useState(() =>
    Object.fromEntries(servers.map(s => [s.name, {
      cpu: s.cpu_base, ram: s.ram_base, disk: s.disk_base,
      uptime: '—', status: calcStatus(s.cpu_base, s.ram_base, s.disk_base),
      simulated: true, lastUpdate: null, error: null,
    }]))
  )
  const metricsRef = useRef(metrics)
  metricsRef.current = metrics

  const fetchAll = useCallback(async () => {
    const results = await Promise.allSettled(
      servers.map(s => fetchOrSimulate(s, metricsRef.current[s.name]))
    )
    setMetrics(prev => {
      const next = { ...prev }
      results.forEach((result, i) => {
        const s = servers[i]
        if (result.status === 'fulfilled') {
          const m = result.value
          next[s.name] = {
            ...m,
            status: calcStatus(m.cpu, m.ram, m.disk),
            lastUpdate: new Date(),
          }
        }
      })
      return next
    })
  }, [servers])

  useEffect(() => {
    fetchAll()
    const timer = setInterval(fetchAll, intervalMs)
    return () => clearInterval(timer)
  }, [fetchAll, intervalMs])

  return { metrics, refetch: fetchAll }
}

// ─── ServerCard ───────────────────────────────────────────────
const ServerCard = ({ server, metric, onRefresh }) => {
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
      {/* ── Header ── */}
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
          <button
            onClick={() => onRefresh(server)}
            className="w-8 h-8 rounded-lg border border-gray-700 flex items-center justify-center bg-white/5 text-gray-400 hover:bg-white/10 transition"
          >
            <RefreshCw size={13} />
          </button>
          <span className="text-[10px] text-gray-600">
            {lastUpdate ? lastUpdate.toLocaleTimeString('id-ID') : '—'}
          </span>
        </div>
      </div>

      {/* ── Metrics ── */}
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
  const [servers] = useState(SERVERS_CONFIG)
  const { metrics, refetch } = useServerMonitor(servers, 5000)

  const onlineCount  = Object.values(metrics).filter(m => m.status === 'Online').length
  const warningCount = Object.values(metrics).filter(m => m.status === 'Warning').length
  const downCount    = Object.values(metrics).filter(m => m.status === 'Down').length
  const simCount     = Object.values(metrics).filter(m => m.simulated).length

  return (
    <div className="flex flex-col gap-4 sm:gap-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3">
        <PageHeader title="Monitoring" subtitle="Real-time server status" />
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 sm:px-4 py-1 rounded-full border border-green-500/50 bg-green-500/10 shrink-0">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-semibold text-green-400">Live</span>
          </div>
          <button
            onClick={refetch}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-gray-700 bg-white/5 text-gray-400 hover:bg-white/10 text-xs transition"
          >
            <RefreshCw size={11} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Banner info simulasi ── */}
      {simCount > 0 && (
        <div className="flex items-start gap-2 px-4 py-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs">
          <Activity size={13} className="mt-0.5 shrink-0" />
          <span>
            <strong>{simCount} server</strong> belum terjangkau — menampilkan data simulasi.
            Pasang <code className="bg-amber-500/20 px-1 rounded font-mono">monitor_agent.py</code> di server target dan pastikan port <strong>9090</strong> terbuka. Badge <span className="border border-amber-500/30 bg-amber-500/10 px-1 rounded">simulasi</span> akan hilang otomatis saat agent terdeteksi.
          </span>
        </div>
      )}

      {/* ── Summary ── */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        {[
          [onlineCount,  'Online',  CheckCircle2,  'text-emerald-400', 'border-emerald-500/20', 'bg-emerald-500/5'],
          [warningCount, 'Warning', AlertTriangle, 'text-amber-400',   'border-amber-500/20',   'bg-amber-500/5'  ],
          [downCount,    'Down',    XCircle,       'text-red-400',     'border-red-500/20',      'bg-red-500/5'    ],
        ].map(([v, l, Ic, textCls, borderCls, bgCls], i) => (
          <div
            key={i}
            className={`flex flex-col items-center justify-center rounded-xl border p-3 sm:p-5 shadow-md ${bgCls} ${borderCls}`}
          >
            <Ic size={20} className={`mb-1.5 sm:mb-2 ${textCls}`} />
            <div className={`font-extrabold text-xl sm:text-2xl ${textCls}`}>{v}</div>
            <div className="text-xs text-gray-400 mt-0.5 sm:mt-1">{l}</div>
          </div>
        ))}
      </div>

      {/* ── Server list ── */}
      <div className="flex flex-col gap-3 sm:gap-4">
        {servers.map(s => (
          <ServerCard
            key={s.id}
            server={s}
            metric={metrics[s.name]}
            onRefresh={refetch}
          />
        ))}
      </div>

    </div>
  )
}

export default MonitoringPage