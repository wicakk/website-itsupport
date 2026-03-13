import { useState, useEffect } from 'react'
import { Server, CheckCircle2, AlertTriangle, XCircle, RefreshCw, Cpu, Database, HardDrive } from 'lucide-react'
import { T, SERVER_STATUS_CFG } from '../theme'
import { Card, Badge, PageHeader, ProgressBar } from '../components/ui'

// Mock data server
const MOCK_SERVERS = [
  { id:1, name:'WEB-SERVER-01',  ip_address:'192.168.1.10', cpu_usage:45, ram_usage:67, disk_usage:55, status:'Online',  uptime:'99.9%', os:'Ubuntu 22.04'        },
  { id:2, name:'DB-SERVER-01',   ip_address:'192.168.1.11', cpu_usage:78, ram_usage:82, disk_usage:73, status:'Warning', uptime:'99.7%', os:'CentOS 8'            },
  { id:3, name:'FILE-SERVER-01', ip_address:'192.168.1.12', cpu_usage:23, ram_usage:45, disk_usage:91, status:'Warning', uptime:'98.2%', os:'Windows Server 2022' },
  { id:4, name:'MAIL-SERVER-01', ip_address:'192.168.1.13', cpu_usage:56, ram_usage:61, disk_usage:40, status:'Online',  uptime:'99.9%', os:'Ubuntu 20.04'        },
  { id:5, name:'BACKUP-SERVER',  ip_address:'192.168.1.14', cpu_usage:12, ram_usage:34, disk_usage:88, status:'Warning', uptime:'97.5%', os:'Debian 11'           },
]

// Hook untuk generate metrics secara periodik (mock)
const useServerMonitor = (servers) => {
  const [metrics, setMetrics] = useState({})

  useEffect(() => {
    if (!servers || servers.length === 0) return

    const interval = setInterval(() => {
      const updated = {}
      servers.forEach(s => {
        updated[s.name] = {
          cpu: Math.min(100, Math.max(0, s.cpu_usage + Math.floor(Math.random()*11-5))),
          ram: Math.min(100, Math.max(0, s.ram_usage + Math.floor(Math.random()*11-5))),
          disk: Math.min(100, Math.max(0, s.disk_usage + Math.floor(Math.random()*11-5)))
        }
      })
      setMetrics(updated)
    }, 5000)

    return () => clearInterval(interval)
  }, [servers])

  return metrics
}

// Card per server
const ServerCard = ({ server, metrics, onRefresh }) => {
  const metric = metrics?.[server.name] ?? {}

  const cpu  = metric.cpu  ?? server.cpu_usage ?? 0
  const ram  = metric.ram  ?? server.ram_usage ?? 0
  const disk = metric.disk ?? server.disk_usage ?? 0

  const status = server.status ?? 'Unknown'
  const cfg = SERVER_STATUS_CFG[status] ?? SERVER_STATUS_CFG['Unknown']

  return (
    <Card className=" rounded-xl shadow-md hover:shadow-lg transition-shadow" style={{padding:'20px', borderColor:cfg.border}}>
      {/* HEADER */}
      <div className="flex justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg border flex items-center justify-center" style={{background:`${cfg.color}12`, borderColor:`${cfg.color}25`}}>
            <Server size={18} color={cfg.color} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm" style={{color:T.text}}>{server.name}</span>
              <Badge label={status} cfg={{ bg:cfg.bg, text:cfg.color, border:cfg.border }} dot />
            </div>
            <div className="text-xs mt-0.5" style={{color:T.textDim}}>
              {server.ip_address} · {server.os} · Uptime: {server.uptime}
            </div>
          </div>
        </div>
        <button
          onClick={() => onRefresh(server)}
          className="w-8 h-8 rounded-lg border flex items-center justify-center bg-white/5 text-gray-400 hover:bg-white/10 transition-colors"
          style={{borderColor:T.border}}
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* METRICS */}
      <div className="grid grid-cols-3 gap-5" >
        {[
          ['CPU Usage', cpu, Cpu],
          ['RAM Usage', ram, Database],
          ['Disk Usage', disk, HardDrive]
        ].map(([label, val, Ic], i) => (
          <div key={i}>
            <div className="flex items-center gap-1 text-xs mb-2" style={{color:T.textMuted}}>
              <Ic size={12} /> {label}
            </div>
            <ProgressBar value={val} />
          </div>
        ))}
      </div>
    </Card>
  )
}

// Halaman Monitoring
const MonitoringPage = () => {
  const [servers, setServers] = useState(MOCK_SERVERS)
  const metrics = useServerMonitor(servers)

  const onlineCount  = servers.filter(s => s.status === 'Online').length
  const warningCount = servers.filter(s => s.status === 'Warning').length
  const downCount    = servers.filter(s => s.status === 'Down').length

  const handleRefresh = (server) => {
    setServers(prev => prev.map(s => s.id === server.id ? { ...s, cpu_usage:s.cpu_usage, ram_usage:s.ram_usage, disk_usage:s.disk_usage } : s))
  }

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex justify-between items-start">
        <PageHeader title="Monitoring" subtitle="Real-time server status" />
        <div className="flex items-center gap-2 px-4 py-1 rounded-full border border-green-400 bg-green-100/20">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-xs font-semibold text-green-500" >Live</span>
        </div>
      </div>

      {/* STATUS CARDS */}
      <div className=" grid grid-cols-3 gap-4">
        {[
          [onlineCount, 'Online', CheckCircle2, T.success],
          [warningCount, 'Warning', AlertTriangle, T.warning],
          [downCount, 'Down', XCircle, T.danger]
        ].map(([v,l,Ic,c],i)=>(
          <Card key={i} className="text-center rounded-xl shadow-md hover:shadow-lg transition-shadow" style={{padding:'20px'}}>
            <Ic size={24} color={c} className="mb-2" />
            <div className="font-extrabold text-2xl" style={{color:c}}>{v}</div>
            <div className="text-sm text-gray-400 mt-1">{l}</div>
          </Card>
        ))}
      </div>

      {/* SERVER LIST */}
      <div className="flex flex-col gap-4">
        {servers.map(s => (
          <ServerCard key={s.id} server={s} metrics={metrics} onRefresh={handleRefresh} />
        ))}
      </div>
    </div>
  )
}

export default MonitoringPage