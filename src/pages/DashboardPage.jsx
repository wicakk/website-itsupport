import { useEffect, useState } from 'react'
import { Ticket, AlertCircle, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react'
import { T, PRIORITY_CFG, STATUS_CFG } from '../theme'
import { Card, StatCard, SectionHeader, ProgressBar, Avatar, Badge, BarChart, DonutChart } from '../components/ui'
import { useNav, useAuth } from '../context/AppContext'

// ─── Skeleton loader ─────────────────────────────────────────
const Skeleton = ({ w = '100%', h = 16, r = 8 }) => (
  <div style={{ width: w, height: h, borderRadius: r, background: `${T.border}`, opacity: 0.5,
    animation: 'pulse 1.5s ease-in-out infinite' }} />
)

const DashboardPage = () => {
  const { navigate }  = useNav()
  const { authFetch, user } = useAuth()
  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  // ─── State ───────────────────────────────────────────────────
  const [stats,         setStats]         = useState(null)
  const [monthlyData,   setMonthlyData]   = useState([])
  const [categoryDist,  setCategoryDist]  = useState([])
  const [slaData,       setSlaData]       = useState([])
  const [recentTickets, setRecentTickets] = useState([])
  const [technicians,   setTechnicians]   = useState([])
  const [overallSla,    setOverallSla]    = useState(null)
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState(null)

  // ─── Fetch semua data dashboard ──────────────────────────────
  const fetchDashboard = async () => {
    setLoading(true)
    setError(null)
    try {
      const [dashRes, chartRes] = await Promise.all([
        authFetch('/api/dashboard'),
        authFetch('/api/dashboard/chart'),
      ])

      if (!dashRes.ok || !chartRes.ok) throw new Error('Gagal memuat data.')

      const dash  = await dashRes.json()
      const chart = await chartRes.json()

      // ── Stats: ada di dash.stats.* ──────────────────────────
      setStats({
        total:    dash.stats?.total_tickets    ?? 0,
        open:     dash.stats?.open_tickets     ?? 0,
        resolved: dash.stats?.resolved_tickets ?? 0,
        overdue:  dash.stats?.overdue_tickets  ?? 0,
      })

      // ── Chart monthly: array dari /api/dashboard/chart ──────
      setMonthlyData(chart.monthly ?? [])

      // ── Category: key-nya category_distribution ─────────────
      setCategoryDist(chart.category_distribution ?? [])

      // ── SLA: object { Critical:92, High:87, ... } → array ───
      const slaLabels = { Critical: 'Critical (4h)', High: 'High (8h)', Medium: 'Medium (24h)', Low: 'Low (72h)' }
      const slaObj    = dash.sla ?? {}
      setSlaData(
        Object.entries(slaObj).map(([key, value]) => ({
          label: slaLabels[key] ?? key,
          value: value,
        }))
      )

      // ── Recent tickets ───────────────────────────────────────
      setRecentTickets(dash.recent_tickets ?? [])

      setOverallSla(dash.overall_sla ?? null)

      // ── Technicians: key-nya tech_performance ────────────────
      setTechnicians(
        (dash.tech_performance ?? []).map(t => ({
          ...t,
          resolved: t.resolved_count,
          avg:      t.avg_resolution_hours ? `${t.avg_resolution_hours}h` : '—',
          sla:      null, // tidak ada di response, bisa dikosongkan
        }))
      )

    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDashboard() }, [])

  // ─── Error state ─────────────────────────────────────────────
  if (error) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12 }}>
      <AlertCircle size={32} color={T.danger} />
      <p style={{ color: T.danger, fontSize: 14 }}>{error}</p>
      <button onClick={fetchDashboard}
        style={{ padding: '8px 20px', background: T.accent, border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 13 }}>
        Coba Lagi
      </button>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:.5} 50%{opacity:.25} }`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ color: T.text, fontWeight: 800, fontSize: 22 }}>Dashboard</h1>
          <p style={{ color: T.textMuted, fontSize: 13, marginTop: 4 }}>
            Selamat datang, <span style={{ color: T.accent }}>{user?.name}</span>
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 10, padding: '6px 14px', color: T.textMuted, fontSize: 11 }}>{today}</div>
          <button onClick={fetchDashboard} disabled={loading}
            style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 10, padding: '6px 10px', color: T.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        {loading ? Array(4).fill(0).map((_, i) => (
          <Card key={i} style={{ padding: 20 }}><Skeleton h={60} /></Card>
        )) : <>
          <StatCard label="Total Tiket" value={String(stats?.total ?? 0)} icon={Ticket}        iconColor={T.accent}  />
          <StatCard label="Tiket Open"  value={String(stats?.open  ?? 0)} icon={AlertCircle}   iconColor="#F97316"   positive={false} />
          <StatCard label="Resolved"    value={String(stats?.resolved ?? 0)} icon={CheckCircle2} iconColor={T.success} positive />
          <StatCard label="Overdue"     value={String(stats?.overdue ?? 0)} icon={AlertTriangle} iconColor={T.danger}  />
        </>}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
        <Card style={{ padding: 20, gridColumn: 'span 2' }}>
          <SectionHeader title="Tiket per Bulan" />
          {loading ? <Skeleton h={140} r={10} /> : <>
            <div style={{ display: 'flex', gap: 14, marginBottom: 10 }}>
              {[['Open', T.accent], ['Resolved', T.success]].map(([l, c]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: T.textMuted }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />{l}
                </div>
              ))}
            </div>
            <BarChart data={monthlyData} />
          </>}
        </Card>
        <Card style={{ padding: 20 }}>
          <SectionHeader title="Kategori Tiket" />
          {loading ? <Skeleton h={140} r={10} /> : <DonutChart data={categoryDist} />}
        </Card>
      </div>

      {/* SLA + Recent */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 14 }}>
        <Card style={{ padding: 20 }}>
          <SectionHeader title="SLA Performance" />
          {loading ? <div style={{ display:'flex', flexDirection:'column', gap:14 }}>{Array(4).fill(0).map((_,i)=><Skeleton key={i} h={32} />)}</div> : <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {slaData.length > 0
                ? slaData.map(s => (
                    <div key={s.label}>
                      <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 6 }}>{s.label}</div>
                      <ProgressBar value={s.value} />
                    </div>
                  ))
                : [['Critical (4h)', 0], ['High (8h)', 0], ['Medium (24h)', 0], ['Low (72h)', 0]].map(([l, v]) => (
                    <div key={l}><div style={{ fontSize: 11, color: T.textMuted, marginBottom: 6 }}>{l}</div><ProgressBar value={v} /></div>
                  ))
              }
            </div>
            <div style={{ marginTop: 20, background: `${T.success}0D`, border: `1px solid ${T.success}22`, borderRadius: 12, padding: '12px 16px', textAlign: 'center' }}>
              <div style={{ color: T.success, fontSize: 28, fontWeight: 800 }}>
                {overallSla != null ? `${overallSla}%` : slaData.length > 0
                  ? Math.round(slaData.reduce((a, s) => a + s.value, 0) / slaData.length) + '%'
                  : '—'}
              </div>
              <div style={{ color: T.textMuted, fontSize: 11, marginTop: 2 }}>Overall SLA Score</div>
            </div>
          </>}
        </Card>

        <Card style={{ padding: 20 }}>
          <SectionHeader title="Tiket Terbaru" action={() => navigate('tickets')} />
          {loading
            ? <div style={{ display:'flex', flexDirection:'column', gap:8 }}>{Array(5).fill(0).map((_,i)=><Skeleton key={i} h={44} />)}</div>
            : recentTickets.length === 0
              ? <p style={{ color: T.textDim, fontSize: 12, textAlign: 'center', padding: '20px 0' }}>Belum ada tiket.</p>
              : <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {recentTickets.slice(0, 6).map(t => (
                    <div key={t.id}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', transition: 'background .2s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <Avatar initials={t.requester?.initials ?? t.initials ?? '??'} size={30} color={t.requester?.color} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <span style={{ color: T.textDim, fontSize: 10, fontFamily: 'monospace' }}>{t.ticket_number ?? `#${t.id}`}</span>
                          <Badge label={t.status} cfg={STATUS_CFG[t.status]} />
                        </div>
                        <p style={{ color: T.text, fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</p>
                      </div>
                      <Badge label={t.priority} cfg={PRIORITY_CFG[t.priority]} dot />
                    </div>
                  ))}
                </div>
          }
        </Card>
      </div>

      {/* Technicians */}
      <Card style={{ padding: 20 }}>
        <SectionHeader title="Kinerja Teknisi" />
        {loading
          ? <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>{Array(3).fill(0).map((_,i)=><Skeleton key={i} h={100} />)}</div>
          : technicians.length === 0
            ? <p style={{ color: T.textDim, fontSize: 12, textAlign: 'center', padding: '20px 0' }}>Belum ada data teknisi.</p>
            : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                {technicians.map((t, i) => (
                  <div key={i} style={{ background: `${t.color ?? T.accent}08`, border: `1px solid ${t.color ?? T.accent}20`, borderRadius: 12, padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                      <Avatar initials={t.initials} size={36} color={t.color ?? T.accent} />
                      <div>
                        <div style={{ color: T.text, fontWeight: 600, fontSize: 13 }}>{t.name}</div>
                        <div style={{ color: T.textMuted, fontSize: 10 }}>{t.role ?? 'IT Support'}</div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, textAlign: 'center' }}>
                      {[
                        [t.resolved ?? 0,              'Resolved', t.color ?? T.accent],
                        [t.avg_time  ?? t.avg ?? '—',  'Avg Time', T.warning],
                        [`${t.sla_score ?? t.sla ?? 0}%`, 'SLA',   T.success],
                      ].map(([v, l, c]) => (
                        <div key={l} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '8px 4px' }}>
                          <div style={{ color: c, fontSize: 15, fontWeight: 800 }}>{v}</div>
                          <div style={{ color: T.textDim, fontSize: 9, marginTop: 2 }}>{l}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
        }
      </Card>
    </div>
  )
}

export default DashboardPage
