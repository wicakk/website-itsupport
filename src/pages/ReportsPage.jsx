import { useState, useEffect } from 'react'
import {
  BarChart3,
  TrendingUp,
  Zap,
  Package,
  FileText,
  Download,
  Ticket,
  CheckCheck,
  Clock
} from 'lucide-react'

import { T } from '../theme'
import { Card, PageHeader, SectionHeader } from '../components/ui'
import { useAuth } from '../context/AppContext'

/* =========================
   REPORT LIST
========================= */

const REPORTS = [
  {
    key: 'tickets',
    title: 'Laporan Tiket Bulanan',
    desc: 'Ringkasan tiket per bulan termasuk kategori dan prioritas.',
    Icon: BarChart3,
    color: T.accent
  },
  {
    key: 'technicians',
    title: 'Kinerja Teknisi',
    desc: 'Analisis performa tim IT Support berdasarkan tiket diselesaikan.',
    Icon: TrendingUp,
    color: T.purple
  },
  {
    key: 'sla',
    title: 'SLA Performance Report',
    desc: 'Tingkat keberhasilan penyelesaian tiket sesuai SLA agreement.',
    Icon: Zap,
    color: T.warning
  },
  {
    key: 'assets',
    title: 'Inventaris Aset IT',
    desc: 'Laporan lengkap aset IT perusahaan beserta status dan warranty.',
    Icon: Package,
    color: T.success
  }
]

/* =========================
   COMPONENT
========================= */

const ReportsPage = () => {

  const { authFetch } = useAuth()

  const [loading,setLoading] = useState(null)
  const [stats,setStats] = useState(null)

  /* =========================
     LOAD QUICK STATS
  ========================= */

  useEffect(() => {

    const loadStats = async () => {

      try {

        const res = await authFetch('/api/reports/summary')

        if(!res.ok) throw new Error()

        const data = await res.json()

        setStats(data)

      } catch (err) {

        console.error('Stats load error:',err)

      }

    }

    loadStats()

  },[])

  /* =========================
     EXPORT REPORT
  ========================= */

  const handleExport = async (type,format) => {

    try {

      setLoading(`${type}-${format}`)

      const res = await authFetch(`/api/reports/${type}?format=${format}`)

      if(!res.ok){

        const text = await res.text()
        throw new Error(text)

      }

      const blob = await res.blob()

      const url = window.URL.createObjectURL(blob)

      const link = document.createElement('a')

      link.href = url

      const ext = format === 'excel' ? 'xlsx' : 'pdf'

      link.download = `${type}-report.${ext}`

      document.body.appendChild(link)

      link.click()

      link.remove()

      window.URL.revokeObjectURL(url)

    } catch(err) {

      console.error('Export error:',err)

      alert('Gagal export laporan')

    } finally {

      setLoading(null)

    }

  }

  /* =========================
     MONTH TITLE
  ========================= */

  const month = new Date().toLocaleDateString('id-ID',{
    month:'long',
    year:'numeric'
  })

  /* =========================
     QUICK STATS DATA
  ========================= */

  const STATS = [
    ['Total Tiket',stats?.total_tickets ?? '-',Ticket,T.accent],
    ['Resolved',stats?.resolved ?? '-',CheckCheck,T.success],
    ['Avg Resolution',stats ? `${stats.avg_resolution}h` : '-',Clock,T.warning],
    ['SLA Score',stats ? `${stats.sla_score}%` : '-',Zap,T.purple]
  ]

  /* =========================
     RENDER
  ========================= */

  return (

    <div style={{display:'flex',flexDirection:'column',gap:20}}>

      <PageHeader
        title="Reports"
        subtitle="Generate dan export laporan IT Support"
      />

      {/* ================= REPORT CARDS ================= */}

      <div style={{
        display:'grid',
        gridTemplateColumns:'1fr 1fr',
        gap:12
      }}>

        {REPORTS.map((report)=>{

          const Icon = report.Icon

          return(

            <Card key={report.key} hover style={{padding:20}}>

              <div
                style={{
                  width:40,
                  height:40,
                  borderRadius:11,
                  background:`${report.color}15`,
                  border:`1px solid ${report.color}25`,
                  display:'flex',
                  alignItems:'center',
                  justifyContent:'center',
                  marginBottom:14
                }}
              >
                <Icon size={18} color={report.color}/>
              </div>

              <h3 style={{
                color:T.text,
                fontWeight:700,
                fontSize:14
              }}>
                {report.title}
              </h3>

              <p style={{
                color:T.textMuted,
                fontSize:12,
                marginTop:6,
                lineHeight:1.55
              }}>
                {report.desc}
              </p>

              <div style={{
                display:'flex',
                gap:8,
                marginTop:16
              }}>

                {/* PDF */}

                <button
                  disabled={loading !== null}
                  onClick={()=>handleExport(report.key,'pdf')}
                  style={{
                    flex:1,
                    padding:'8px 10px',
                    background:`${T.danger}0E`,
                    border:`1px solid ${T.danger}22`,
                    color:T.danger,
                    borderRadius:8,
                    fontSize:11,
                    cursor:'pointer',
                    fontWeight:600,
                    display:'flex',
                    alignItems:'center',
                    justifyContent:'center',
                    gap:5,
                    opacity:loading ? 0.6 : 1
                  }}
                >
                  <FileText size={11}/>
                  {loading === `${report.key}-pdf`
                    ? 'Generating...'
                    : 'PDF'}
                </button>

                {/* EXCEL */}

                <button
                  disabled={loading !== null}
                  onClick={()=>handleExport(report.key,'excel')}
                  style={{
                    flex:1,
                    padding:'8px 10px',
                    background:`${T.success}0E`,
                    border:`1px solid ${T.success}22`,
                    color:T.success,
                    borderRadius:8,
                    fontSize:11,
                    cursor:'pointer',
                    fontWeight:600,
                    display:'flex',
                    alignItems:'center',
                    justifyContent:'center',
                    gap:5,
                    opacity:loading ? 0.6 : 1
                  }}
                >
                  <Download size={11}/>
                  {loading === `${report.key}-excel`
                    ? 'Generating...'
                    : 'Excel'}
                </button>

              </div>

            </Card>

          )

        })}

      </div>

      {/* ================= QUICK STATS ================= */}

      <Card style={{padding:20}}>

        <SectionHeader title={`Quick Stats — ${month}`} />

        <div style={{
          display:'grid',
          gridTemplateColumns:'repeat(4,1fr)',
          gap:12
        }}>

          {STATS.map(([label,value,Icon,color]) => (

            <div
              key={label}
              style={{
                background:`${color}08`,
                border:`1px solid ${color}18`,
                borderRadius:12,
                padding:'14px 12px',
                textAlign:'center'
              }}
            >

              <Icon
                size={16}
                color={color}
                style={{marginBottom:8}}
              />

              <div style={{
                color:color,
                fontSize:20,
                fontWeight:800
              }}>
                {value}
              </div>

              <div style={{
                color:T.textMuted,
                fontSize:10,
                marginTop:3
              }}>
                {label}
              </div>

            </div>

          ))}

        </div>

      </Card>

    </div>

  )

}

export default ReportsPage