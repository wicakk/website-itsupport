// src/pages/ReportsPage.jsx
import { useState, useEffect, useCallback } from 'react'
import {
  BarChart3, TrendingUp, Zap, Package,
  FileText, Download, Ticket, CheckCheck,
  Clock, Loader2, Filter, X, User, Calendar,
} from 'lucide-react'
import { PageHeader } from '../components/ui'
import { useAuth } from '../context/AppContext'
import { useTheme } from '../context/ThemeContext'

const REPORTS = [
  { key:'tickets',     title:'Laporan Tiket',      desc:'Ringkasan tiket berdasarkan periode dan filter.', icon:BarChart3,  color:'#3B82F6' },
  { key:'technicians', title:'Kinerja Teknisi',     desc:'Performa tim IT berdasarkan tiket diselesaikan.', icon:TrendingUp, color:'#8B5CF6' },
  { key:'sla',         title:'SLA Performance',     desc:'Tingkat keberhasilan penyelesaian tiket sesuai SLA.', icon:Zap,   color:'#F59E0B' },
  { key:'assets',      title:'Inventaris Aset IT',  desc:'Laporan lengkap aset IT beserta status dan warranty.', icon:Package, color:'#10B981' },
]

const PREVIEW_COLS = {
  tickets: [
    { key:'ticket_number', label:'No. Tiket',  render:(v,r)=>v??`#${r.id}` },
    { key:'title',         label:'Judul' },
    { key:'category',      label:'Kategori' },
    { key:'priority',      label:'Prioritas' },
    { key:'status',        label:'Status' },
    { key:'requester',     label:'Reporter',  render:(v)=>v?.name??'—' },
    { key:'assignee',      label:'Assigned',  render:(v)=>v?.name??'Unassigned' },
    { key:'created_at',    label:'Dibuat',    render:(v)=>v?new Date(v).toLocaleDateString('id-ID'):'—' },
    { key:'sla_breached',  label:'SLA',       render:(v)=>v?'⚠️ Breach':'✓ OK' },
  ],
  technicians: [
    { key:'name',           label:'Teknisi' },
    { key:'role',           label:'Role' },
    { key:'total_assigned', label:'Ditugaskan' },
    { key:'resolved_count', label:'Resolved' },
    { key:'sla_met',        label:'SLA Terpenuhi' },
    { key:'sla_score',      label:'SLA %', render:(v)=>v!=null?`${v}%`:'—' },
    { key:'avg_hours',      label:'Avg Waktu (jam)' },
  ],
  sla: [
    { key:'priority', label:'Prioritas' },
    { key:'target',   label:'Target SLA' },
    { key:'total',    label:'Total Tiket' },
    { key:'on_time',  label:'Tepat Waktu' },
    { key:'breached', label:'Terlambat' },
    { key:'achieved', label:'Tercapai %', render:(v)=>v!=null?`${v}%`:'—' },
  ],
  assets: [
    { key:'asset_number',    label:'No. Aset' },
    { key:'name',            label:'Nama' },
    { key:'category',        label:'Kategori' },
    { key:'status',          label:'Status' },
    { key:'location',        label:'Lokasi' },
    { key:'warranty_expiry', label:'Garansi s/d' },
  ],
}

const ReportsPage = () => {
  const { authFetch } = useAuth()
  const { T: theme }  = useTheme()

  const [loadingKey,     setLoadingKey]     = useState(null)
  const [stats,          setStats]          = useState(null)
  const [preview,        setPreview]        = useState(null)
  const [previewLoading, setPreviewLoading] = useState(null)
  const [users,          setUsers]          = useState([])
  const [showFilter,     setShowFilter]     = useState(false)
  const [filters,        setFilters]        = useState({ from:'', to:'', user_id:'', status:'' })

  const month = new Date().toLocaleDateString('id-ID',{ month:'long', year:'numeric' })

  // Load data dengan token langsung (lebih reliable)
  const loadData = useCallback(async () => {
    const token = localStorage.getItem('token')
    const h = { Accept:'application/json', Authorization:`Bearer ${token}` }
    try {
      const [sumRes, usrRes] = await Promise.all([
        fetch('/api/reports/summary', { headers: h }),
        fetch('/api/users?per_page=100', { headers: h }),
      ])
      if (sumRes.ok) setStats(await sumRes.json())
      if (usrRes.ok) {
        const j = await usrRes.json()
        setUsers(j.data ?? j ?? [])
      }
    } catch(e) { console.warn('load error:', e) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const buildParams = (extra={}) => {
    const p = new URLSearchParams()
    if (filters.from)    p.set('from',    filters.from)
    if (filters.to)      p.set('to',      filters.to)
    if (filters.user_id) p.set('user_id', filters.user_id)
    if (filters.status)  p.set('status',  filters.status)
    Object.entries(extra).forEach(([k,v])=>v&&p.set(k,v))
    return p.toString() ? '?'+p.toString() : ''
  }

  const handleExport = async (key, format) => {
    const id = `${key}-${format}`
    try {
      setLoadingKey(id)
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/reports/${key}${buildParams({ format })}`, {
        headers: { Accept:'application/json', Authorization:`Bearer ${token}` }
      })
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      const from = filters.from ? `_${filters.from}` : ''
      const to   = filters.to   ? `_sd_${filters.to}` : ''
      const usr  = filters.user_id ? `_${users.find(u=>String(u.id)===filters.user_id)?.name?.replace(/\s+/g,'_')??'user'}` : ''
      a.download = `${key}-report${from}${to}${usr}.${format==='excel'?'xlsx':'pdf'}`
      document.body.appendChild(a); a.click(); a.remove()
      URL.revokeObjectURL(url)
    } catch { alert('Gagal export laporan') }
    finally { setLoadingKey(null) }
  }

  const handlePreview = async (key) => {
    if (preview?.key === key) { setPreview(null); return }
    setPreviewLoading(key)
    try {
      const token = localStorage.getItem('token')
      const url = key==='sla'||key==='technicians'
        ? `/api/reports/${key}${buildParams()}`
        : `/api/reports/${key}${buildParams({ format:'json' })}`
      const res  = await fetch(url, { headers:{ Accept:'application/json', Authorization:`Bearer ${token}` } })
      if (!res.ok) throw new Error()
      const data = await res.json()
      let rows = []
      if (Array.isArray(data))           rows = data
      else if (Array.isArray(data.data)) rows = data.data
      else if (Array.isArray(data.rows)) rows = data.rows
      setPreview({ key, rows })
    } catch { setPreview({ key, rows:[] }) }
    finally { setPreviewLoading(null) }
  }

  const resetFilters = () => setFilters({ from:'', to:'', user_id:'', status:'' })
  const activeCount  = Object.values(filters).filter(v=>v).length

  // Style helpers — menggunakan theme untuk dark/light mode
  const inp = {
    padding:'8px 12px', borderRadius:8,
    border:`1px solid ${theme.border}`,
    background:theme.surfaceAlt,
    color:theme.text,
    fontSize:12, outline:'none', fontFamily:'inherit',
    width:'100%', boxSizing:'border-box',
  }
  const lbl = {
    fontSize:10, fontWeight:700, textTransform:'uppercase',
    letterSpacing:'0.07em', color:theme.textMuted,
    marginBottom:5, display:'block',
  }

  const STATS = [
    { label:'Total Tiket',    value:stats?.total_tickets??'—', color:'#3B82F6' },
    { label:'Resolved',       value:stats?.resolved??'—',      color:'#10B981' },
    { label:'Avg Resolution', value:stats?`${stats.avg_resolution}h`:'—', color:'#F59E0B' },
    { label:'SLA Score',      value:stats?`${stats.sla_score}%`:'—', color:'#8B5CF6' },
  ]

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* ── Header + Filter Toggle ─────────────────────────── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
        <PageHeader title="Reports" subtitle="Generate dan export laporan IT Support"/>
        <button onClick={()=>setShowFilter(f=>!f)}
          style={{
            display:'flex', alignItems:'center', gap:6,
            padding:'8px 14px', borderRadius:10,
            border:`1px solid ${showFilter?theme.accent:theme.border}`,
            background:showFilter?`${theme.accent}18`:'transparent',
            color:showFilter?theme.accent:theme.textMuted,
            fontSize:12, fontWeight:600, cursor:'pointer',
          }}>
          <Filter size={13}/>
          Filter
          {activeCount > 0 && (
            <span style={{ width:18, height:18, borderRadius:'50%', background:theme.accent, color:'#fff', fontSize:10, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Filter Panel ────────────────────────────────────── */}
      {showFilter && (
        <div style={{ background:theme.surface, border:`1px solid ${theme.border}`, borderRadius:12, padding:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
            <Filter size={13} color={theme.accent}/>
            <span style={{ fontSize:13, fontWeight:700, color:theme.text }}>Filter Laporan</span>
            {activeCount > 0 && (
              <button onClick={resetFilters}
                style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:4, fontSize:11, color:theme.textMuted, background:'none', border:'none', cursor:'pointer' }}>
                <X size={11}/>Reset Filter
              </button>
            )}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:12 }}>
            {/* Dari Tanggal */}
            <div>
              <label style={lbl}>Dari Tanggal</label>
              <input type="date" value={filters.from}
                onChange={e=>setFilters(f=>({...f,from:e.target.value}))} style={inp}/>
            </div>
            {/* Sampai Tanggal */}
            <div>
              <label style={lbl}>Sampai Tanggal</label>
              <input type="date" value={filters.to}
                onChange={e=>setFilters(f=>({...f,to:e.target.value}))} style={inp}/>
            </div>
            {/* User / Teknisi */}
            <div>
              <label style={lbl}>User / Teknisi</label>
              <select value={filters.user_id}
                onChange={e=>setFilters(f=>({...f,user_id:e.target.value}))} style={inp}>
                <option value="">— Semua User —</option>
                {users.length === 0
                  ? <option disabled>Memuat...</option>
                  : users.map(u=>(
                      <option key={u.id} value={String(u.id)}>
                        {u.name} ({u.role ?? u.role_display ?? '—'})
                      </option>
                    ))
                }
              </select>
            </div>
            {/* Status */}
            <div>
              <label style={lbl}>Status Tiket</label>
              <select value={filters.status}
                onChange={e=>setFilters(f=>({...f,status:e.target.value}))} style={inp}>
                <option value="">— Semua Status —</option>
                {['Open','Assigned','In Progress','Waiting User','Resolved','Closed'].map(s=>(
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          {/* Active filter badges */}
          {activeCount > 0 && (
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:10 }}>
              {filters.from    && <span style={{ fontSize:10, padding:'2px 8px', borderRadius:20, background:`${theme.accent}20`, color:theme.accent, border:`1px solid ${theme.accent}44` }}>Dari: {filters.from}</span>}
              {filters.to      && <span style={{ fontSize:10, padding:'2px 8px', borderRadius:20, background:`${theme.accent}20`, color:theme.accent, border:`1px solid ${theme.accent}44` }}>Sampai: {filters.to}</span>}
              {filters.user_id && <span style={{ fontSize:10, padding:'2px 8px', borderRadius:20, background:'#8B5CF620', color:'#8B5CF6', border:'1px solid #8B5CF644' }}>
                User: {users.find(u=>String(u.id)===filters.user_id)?.name ?? filters.user_id}
              </span>}
              {filters.status  && <span style={{ fontSize:10, padding:'2px 8px', borderRadius:20, background:'#10B98120', color:'#10B981', border:'1px solid #10B98144' }}>Status: {filters.status}</span>}
            </div>
          )}
        </div>
      )}

      {/* ── Report Cards ─────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:14 }}>
        {REPORTS.map(({ key, title, desc, icon:Icon, color }) => {
          const isOpen     = preview?.key === key
          const isPrevLoad = previewLoading === key

          return (
            <div key={key} style={{ background:theme.surface, border:`1px solid ${theme.border}`, borderRadius:14, padding:'16px 18px', display:'flex', flexDirection:'column', gap:14 }}>
              {/* Card Header */}
              <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                <div style={{ width:40, height:40, borderRadius:12, background:`${color}18`, border:`1px solid ${color}33`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Icon size={18} color={color}/>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:theme.text }}>{title}</div>
                  <div style={{ fontSize:11, color:theme.textMuted, marginTop:2, lineHeight:1.4 }}>{desc}</div>
                </div>
              </div>

              {/* Filter aktif indicator */}
              {activeCount > 0 && (
                <div style={{ fontSize:10, color:theme.accent, background:`${theme.accent}10`, border:`1px solid ${theme.accent}25`, borderRadius:6, padding:'4px 8px', display:'flex', alignItems:'center', gap:5 }}>
                  <Filter size={9}/>Preview & download menggunakan filter yang aktif
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={()=>handlePreview(key)} disabled={!!loadingKey||isPrevLoad}
                  style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'8px', borderRadius:8, border:`1px solid ${isOpen?color:theme.border}`, background:isOpen?`${color}18`:'transparent', color:isOpen?color:theme.textMuted, fontSize:12, fontWeight:600, cursor:'pointer', transition:'all 0.15s' }}>
                  {isPrevLoad
                    ? <><Loader2 size={12} style={{ animation:'spin 1s linear infinite' }}/> Memuat...</>
                    : <><FileText size={12}/>{isOpen?'Tutup':'Preview'}</>
                  }
                </button>
                <button onClick={()=>handleExport(key,'pdf')} disabled={!!loadingKey}
                  style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'8px', borderRadius:8, border:'1px solid rgba(239,68,68,0.3)', background:'rgba(239,68,68,0.08)', color:'#EF4444', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                  {loadingKey===`${key}-pdf`
                    ? <><Loader2 size={12} style={{ animation:'spin 1s linear infinite' }}/> PDF...</>
                    : <><FileText size={12}/>PDF</>
                  }
                </button>
                <button onClick={()=>handleExport(key,'excel')} disabled={!!loadingKey}
                  style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'8px', borderRadius:8, border:'1px solid rgba(16,185,129,0.3)', background:'rgba(16,185,129,0.08)', color:'#10B981', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                  {loadingKey===`${key}-excel`
                    ? <><Loader2 size={12} style={{ animation:'spin 1s linear infinite' }}/> Excel...</>
                    : <><Download size={12}/>Excel</>
                  }
                </button>
              </div>

              {/* Preview Table */}
              {isOpen && (
                <div style={{ overflowX:'auto', borderRadius:10, border:`1px solid ${theme.border}`, maxHeight:300, overflowY:'auto' }}>
                  {preview.rows.length === 0
                    ? <div style={{ textAlign:'center', padding:32, color:theme.textMuted, fontSize:12 }}>Tidak ada data untuk filter yang dipilih.</div>
                    : (
                      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11, minWidth:500 }}>
                        <thead>
                          <tr style={{ background:theme.surfaceAlt }}>
                            {PREVIEW_COLS[key]?.map(col=>(
                              <th key={col.key} style={{ padding:'8px 12px', textAlign:'left', fontSize:10, fontWeight:700, color:theme.textMuted, textTransform:'uppercase', letterSpacing:'0.06em', whiteSpace:'nowrap', borderBottom:`1px solid ${theme.border}`, position:'sticky', top:0, background:theme.surfaceAlt }}>
                                {col.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {preview.rows.map((row,i)=>(
                            <tr key={i} style={{ borderTop:`1px solid ${theme.border}`, background:i%2===1?theme.surfaceAlt+'80':'transparent' }}>
                              {PREVIEW_COLS[key]?.map(col=>{
                                const raw = row[col.key]
                                const val = col.render ? col.render(raw,row) : (raw??'—')
                                return <td key={col.key} style={{ padding:'7px 12px', color:theme.text, whiteSpace:'nowrap' }}>{val}</td>
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )
                  }
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Quick Stats ─────────────────────────────────────── */}
      <div style={{ background:theme.surface, border:`1px solid ${theme.border}`, borderRadius:14, padding:'16px 18px' }}>
        <div style={{ fontSize:13, fontWeight:700, color:theme.text, marginBottom:14 }}>
          Quick Stats — {month}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:12 }}>
          {STATS.map(({ label, value, color })=>(
            <div key={label} style={{ background:`${color}10`, border:`1px solid ${color}25`, borderRadius:12, padding:'14px 16px', textAlign:'center' }}>
              <div style={{ fontSize:24, fontWeight:800, color, lineHeight:1 }}>{value}</div>
              <div style={{ fontSize:10, color:theme.textMuted, textTransform:'uppercase', letterSpacing:'0.06em', marginTop:6 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

export default ReportsPage
