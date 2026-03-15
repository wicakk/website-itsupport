import { useState, useEffect } from 'react'
import { Server, CheckCircle2, AlertTriangle, XCircle, RefreshCw, Cpu, Database, HardDrive } from 'lucide-react'
import { SERVER_STATUS_CFG } from '../theme'
import { Card, Badge, PageHeader, ProgressBar } from '../components/ui'

// ─── Mock data ────────────────────────────────────────────────
const MOCK_SERVERS = [
  { id:1, name:'WEB-SERVER-01',  ip_address:'192.168.1.10', cpu_usage:45, ram_usage:67, disk_usage:55, status:'Online',  uptime:'99.9%', os:'Ubuntu 22.04'        },
  { id:2, name:'DB-SERVER-01',   ip_address:'192.168.1.11', cpu_usage:78, ram_usage:82, disk_usage:73, status:'Warning', uptime:'99.7%', os:'CentOS 8'            },
  { id:3, name:'FILE-SERVER-01', ip_address:'192.168.1.12', cpu_usage:23, ram_usage:45, disk_usage:91, status:'Warning', uptime:'98.2%', os:'Windows Server 2022' },
  { id:4, name:'MAIL-SERVER-01', ip_address:'192.168.1.13', cpu_usage:56, ram_usage:61, disk_usage:40, status:'Online',  uptime:'99.9%', os:'Ubuntu 20.04'        },
  { id:5, name:'BACKUP-SERVER',  ip_address:'192.168.1.14', cpu_usage:12, ram_usage:34, disk_usage:88, status:'Warning', uptime:'97.5%', os:'Debian 11'           },
]

// ─── Hook: live metrics ───────────────────────────────────────
const useServerMonitor = (servers) => {
  const [metrics, setMetrics] = useState({})

  useEffect(() => {
    if (!servers?.length) return
    const interval = setInterval(() => {
      const updated = {}
      servers.forEach(s => {
        updated[s.name] = {
          cpu:  Math.min(100, Math.max(0, s.cpu_usage  + Math.floor(Math.random() * 11 - 5))),
          ram:  Math.min(100, Math.max(0, s.ram_usage  + Math.floor(Math.random() * 11 - 5))),
          disk: Math.min(100, Math.max(0, s.disk_usage + Math.floor(Math.random() * 11 - 5))),
        }
      })
      setMetrics(updated)
    }, 5000)
    return () => clearInterval(interval)
  }, [servers])

  return metrics
}

// ─── ServerCard ───────────────────────────────────────────────
const ServerCard = ({ server, metrics, onRefresh }) => {
  const metric = metrics?.[server.name] ?? {}
  const cpu    = metric.cpu  ?? server.cpu_usage  ?? 0
  const ram    = metric.ram  ?? server.ram_usage  ?? 0
  const disk   = metric.disk ?? server.disk_usage ?? 0
  const status = server.status ?? 'Unknown'
  const cfg    = SERVER_STATUS_CFG[status] ?? SERVER_STATUS_CFG['Unknown']

  // Map cfg color string to Tailwind — fall back to inline style for dynamic colors
  return (
    <div
      className="bg-gray-900 rounded-xl border p-4 sm:p-5 shadow-md hover:shadow-lg transition-shadow"
      style={{ borderColor: cfg.border }}
    >
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
          {/* Icon */}
          <div
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg border flex items-center justify-center shrink-0"
            style={{ background: `${cfg.color}12`, borderColor: `${cfg.color}25` }}
          >
            <Server size={17} color={cfg.color} />
          </div>

          {/* Name + meta */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="font-mono font-bold text-sm text-gray-100 truncate">{server.name}</span>
              <Badge label={status} cfg={{ bg: cfg.bg, text: cfg.color, border: cfg.border }} dot />
            </div>
            {/* IP + OS on one line sm+, stacked on xs */}
            <div className="text-[11px] text-gray-500 leading-snug">
              <span className="block sm:inline">{server.ip_address}</span>
              <span className="hidden sm:inline"> · </span>
              <span className="block sm:inline">{server.os}</span>
              <span className="hidden sm:inline"> · </span>
              <span className="block sm:inline">Uptime: {server.uptime}</span>
            </div>
          </div>
        </div>

        {/* Refresh button */}
        <button
          onClick={() => onRefresh(server)}
          className="w-8 h-8 rounded-lg border border-gray-700 flex items-center justify-center bg-white/5 text-gray-400 hover:bg-white/10 transition shrink-0"
        >
          <RefreshCw size={13} />
        </button>
      </div>

      {/* ── Metrics: 1 col on mobile, 3 col on sm+ ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5">
        {[
          ['CPU Usage',  cpu,  Cpu],
          ['RAM Usage',  ram,  Database],
          ['Disk Usage', disk, HardDrive],
        ].map(([label, val, Ic], i) => (
          <div key={i}>
            <div className="flex items-center justify-between sm:justify-start gap-1 text-xs text-gray-500 mb-1.5">
              <span className="flex items-center gap-1"><Ic size={11} /> {label}</span>
              {/* Show percentage inline on mobile since bars are stacked */}
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
  const [servers, setServers] = useState(MOCK_SERVERS)
  const metrics = useServerMonitor(servers)

  const onlineCount  = servers.filter(s => s.status === 'Online').length
  const warningCount = servers.filter(s => s.status === 'Warning').length
  const downCount    = servers.filter(s => s.status === 'Down').length

  const handleRefresh = (server) => {
    setServers(prev => prev.map(s => s.id === server.id ? { ...s } : s))
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3">
        <PageHeader title="Monitoring" subtitle="Real-time server status" />
        <div className="flex items-center gap-2 px-3 sm:px-4 py-1 rounded-full border border-green-500/50 bg-green-500/10 shrink-0">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-semibold text-green-400">Live</span>
        </div>
      </div>

      {/* ── Status summary cards: 3 col always (content is short) ── */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        {[
          [onlineCount,  'Online',  CheckCircle2, 'text-emerald-400', 'border-emerald-500/20', 'bg-emerald-500/5'],
          [warningCount, 'Warning', AlertTriangle, 'text-amber-400',  'border-amber-500/20',   'bg-amber-500/5'  ],
          [downCount,    'Down',    XCircle,       'text-red-400',    'border-red-500/20',      'bg-red-500/5'    ],
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
          <ServerCard key={s.id} server={s} metrics={metrics} onRefresh={handleRefresh} />
        ))}
      </div>

    </div>
  )
}

export default MonitoringPage