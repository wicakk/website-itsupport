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
          cpu: Math.min(100, Math.max(0, s.cpu_usage + Math.floor(Math.random()*11-5))), // ±5%
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
    <Card style={{ padding: 18 }}>

      {/* HEADER */}
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:38, height:38, borderRadius:10, background:`${cfg.color}12`, border:`1px solid ${cfg.color}25`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Server size={16} color={cfg.color} />
          </div>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ color:T.text, fontWeight:700, fontSize:13, fontFamily:'monospace' }}>{server.name}</span>
              <Badge label={status} cfg={{ bg:cfg.bg, text:cfg.color, border:cfg.border }} dot />
            </div>
            <div style={{ color:T.textDim, fontSize:10, marginTop:2 }}>
              {server.ip_address} · {server.os} · Uptime: {server.uptime}
            </div>
          </div>
        </div>

        <button onClick={() => onRefresh(server)} style={{ width:28, height:28, borderRadius:8, background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`, color:T.textMuted, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <RefreshCw size={12} />
        </button>
      </div>

      {/* METRICS */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>
        {[
          ['CPU Usage', cpu, Cpu],
          ['RAM Usage', ram, Database],
          ['Disk Usage', disk, HardDrive]
        ].map(([label, val, Ic], i) => (
          <div key={i}>
            <div style={{ display:'flex', alignItems:'center', gap:5, color:T.textMuted, fontSize:11, marginBottom:8 }}>
              <Ic size={11} /> {label}
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
    // Mock refresh metrics single server
    setServers(prev => prev.map(s => s.id === server.id ? { ...s, cpu_usage:s.cpu_usage, ram_usage:s.ram_usage, disk_usage:s.disk_usage } : s))
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

      {/* HEADER */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <PageHeader title="Monitoring" subtitle="Real-time server status" />
        <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:20, padding:'5px 14px' }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:T.success, animation:'itsPulse 1.4s ease-in-out infinite' }} />
          <span style={{ color:T.success, fontSize:11, fontWeight:600 }}>Live</span>
        </div>
      </div>

      {/* STATUS CARDS */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
        {[
          [onlineCount, 'Online', CheckCircle2, T.success],
          [warningCount, 'Warning', AlertTriangle, T.warning],
          [downCount, 'Down', XCircle, T.danger]
        ].map(([v,l,Ic,c],i)=>(
          <Card key={i} style={{ padding:16, textAlign:'center' }}>
            <Ic size={22} color={c} style={{ marginBottom:8 }} />
            <div style={{ color:c, fontSize:26, fontWeight:800 }}>{v}</div>
            <div style={{ color:T.textMuted, fontSize:12, marginTop:3 }}>{l}</div>
          </Card>
        ))}
      </div>

      {/* SERVER LIST */}
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {servers.map(s => (
          <ServerCard key={s.id} server={s} metrics={metrics} onRefresh={handleRefresh} />
        ))}
      </div>

      {/* Keyframes untuk pulse */}
      <style>{`@keyframes itsPulse {0% {transform:scale(1)}50% {transform:scale(1.3)}100% {transform:scale(1)}}`}</style>
    </div>
  )
}

export default MonitoringPage