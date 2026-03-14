import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ticket, AlertCircle, CheckCircle2, AlertTriangle, RefreshCw, ArrowRight } from 'lucide-react'
import { PRIORITY_CFG, STATUS_CFG } from '../theme'
import { StatCard, ProgressBar, Avatar, Badge, BarChart, DonutChart } from '../components/ui'
import { useAuth } from '../context/AppContext'

// ─── Skeleton ─────────────────────────────────────────────────
const Sk = ({ h = 'h-4', w = 'w-full', r = 'rounded-lg' }) => (
  <div className={`${h} ${w} ${r} bg-gray-700/50 animate-pulse`} />
)

// ─── SectionHeader ────────────────────────────────────────────
const SectionHeader = ({ title, onAction, actionLabel = 'Lihat Semua' }) => (
  <div className="flex items-center justify-between mb-4">
    <p className="text-gray-200 font-bold text-sm">{title}</p>
    {onAction && (
      <button
        onClick={onAction}
        className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition"
      >
        {actionLabel} <ArrowRight size={11} />
      </button>
    )}
  </div>
)

const DashboardPage = () => {
  const navigate      = useNavigate()
  const { authFetch, user } = useAuth()
  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const [stats,         setStats]         = useState(null)
  const [monthlyData,   setMonthlyData]   = useState([])
  const [categoryDist,  setCategoryDist]  = useState([])
  const [slaData,       setSlaData]       = useState([])
  const [recentTickets, setRecentTickets] = useState([])
  const [technicians,   setTechnicians]   = useState([])
  const [overallSla,    setOverallSla]    = useState(null)
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState(null)

  const fetchDashboard = async () => {
    setLoading(true); setError(null)
    try {
      const [dashRes, chartRes] = await Promise.all([
        authFetch('/api/dashboard'),
        authFetch('/api/dashboard/chart'),
      ])
      if (!dashRes.ok || !chartRes.ok) throw new Error('Gagal memuat data.')
      const dash  = await dashRes.json()
      const chart = await chartRes.json()

      setStats({
        total:    dash.stats?.total_tickets    ?? 0,
        open:     dash.stats?.open_tickets     ?? 0,
        resolved: dash.stats?.resolved_tickets ?? 0,
        overdue:  dash.stats?.overdue_tickets  ?? 0,
      })
      setMonthlyData(chart.monthly ?? [])
      setCategoryDist(chart.category_distribution ?? [])

      const slaLabels = { Critical: 'Critical (4h)', High: 'High (8h)', Medium: 'Medium (24h)', Low: 'Low (72h)' }
      setSlaData(
        Object.entries(dash.sla ?? {}).map(([key, value]) => ({ label: slaLabels[key] ?? key, value }))
      )
      setRecentTickets(dash.recent_tickets ?? [])
      setOverallSla(dash.overall_sla ?? null)
      setTechnicians(
        (dash.tech_performance ?? []).map(t => ({
          ...t,
          resolved: t.resolved_count,
          avg:      t.avg_resolution_hours ? `${t.avg_resolution_hours}h` : '—',
        }))
      )
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDashboard() }, [])

  // ── Error ──
  if (error) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
      <AlertCircle size={32} className="text-red-500" />
      <p className="text-red-400 text-sm">{error}</p>
      <button onClick={fetchDashboard}
        className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition">
        Coba Lagi
      </button>
    </div>
  )

  const overallSlaDisplay = overallSla != null
    ? `${overallSla}%`
    : slaData.length > 0
      ? `${Math.round(slaData.reduce((a, s) => a + s.value, 0) / slaData.length)}%`
      : '—'

  return (
    <div className="flex flex-col gap-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-100 font-extrabold text-xl">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            Selamat datang, <span className="text-blue-400 font-medium">{user?.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-gray-800 border border-gray-700 rounded-xl px-3.5 py-1.5 text-gray-400 text-xs hidden sm:block">
            {today}
          </div>
          <button
            onClick={fetchDashboard}
            disabled={loading}
            className="w-9 h-9 flex items-center justify-center bg-gray-800 border border-gray-700 rounded-xl text-gray-400 hover:bg-gray-700 transition disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {loading
          ? Array(4).fill(0).map((_, i) => (
              <div key={i} className="bg-gray-900 border border-gray-700 rounded-2xl p-5">
                <Sk h="h-14" />
              </div>
            ))
          : [
              { label: 'Total Tiket', value: stats?.total    ?? 0, icon: Ticket,        color: '#3B8BFF', path: '/tickets' },
              { label: 'Tiket Open',  value: stats?.open     ?? 0, icon: AlertCircle,   color: '#F97316', path: '/tickets?status=Open' },
              { label: 'Resolved',    value: stats?.resolved ?? 0, icon: CheckCircle2,  color: '#10B981', path: '/tickets?status=Resolved' },
              { label: 'Overdue',     value: stats?.overdue  ?? 0, icon: AlertTriangle, color: '#EF4444', path: '/tickets?overdue=1' },
            ].map(({ label, value, icon, color, path }) => (
              <button
                key={label}
                onClick={() => navigate(path)}
                className="text-left focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded-2xl"
              >
                <StatCard label={label} value={String(value)} icon={icon} iconColor={color} />
              </button>
            ))
        }
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        {/* Bar chart */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-700 rounded-2xl p-5">
          <SectionHeader title="Tiket per Bulan" />
          {loading ? <Sk h="h-36" r="rounded-xl" /> : (
            <>
              <div className="flex gap-4 mb-3">
                {[['Open', 'bg-blue-500'], ['Resolved', 'bg-emerald-500']].map(([l, c]) => (
                  <div key={l} className="flex items-center gap-1.5 text-xs text-gray-400">
                    <div className={`w-2 h-2 rounded-sm ${c}`} /> {l}
                  </div>
                ))}
              </div>
              <BarChart data={monthlyData} />
            </>
          )}
        </div>

        {/* Donut chart */}
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5">
          <SectionHeader title="Kategori Tiket" onAction={() => navigate('/tickets')} />
          {loading ? <Sk h="h-36" r="rounded-xl" /> : <DonutChart data={categoryDist} />}
        </div>
      </div>

      {/* ── SLA + Recent Tickets ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">

        {/* SLA */}
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5">
          <SectionHeader title="SLA Performance" />
          {loading
            ? <div className="flex flex-col gap-3.5">{Array(4).fill(0).map((_, i) => <Sk key={i} h="h-8" />)}</div>
            : (
              <>
                <div className="flex flex-col gap-4">
                  {(slaData.length > 0 ? slaData
                    : [['Critical (4h)', 0], ['High (8h)', 0], ['Medium (24h)', 0], ['Low (72h)', 0]].map(([l, v]) => ({ label: l, value: v }))
                  ).map(s => (
                    <div key={s.label}>
                      <p className="text-gray-500 text-xs mb-1.5">{s.label}</p>
                      <ProgressBar value={s.value} />
                    </div>
                  ))}
                </div>

                {/* Overall SLA score */}
                <div className="mt-5 bg-emerald-500/[0.07] border border-emerald-500/20 rounded-xl py-3 text-center">
                  <p className="text-emerald-400 text-3xl font-extrabold">{overallSlaDisplay}</p>
                  <p className="text-gray-500 text-xs mt-1">Overall SLA Score</p>
                </div>
              </>
            )
          }
        </div>

        {/* Recent Tickets */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-700 rounded-2xl p-5">
          <SectionHeader title="Tiket Terbaru" onAction={() => navigate('/tickets')} />
          {loading
            ? <div className="flex flex-col gap-2">{Array(5).fill(0).map((_, i) => <Sk key={i} h="h-11" />)}</div>
            : recentTickets.length === 0
              ? <p className="text-gray-600 text-sm text-center py-5">Belum ada tiket.</p>
              : (
                <div className="flex flex-col divide-y divide-gray-800">
                  {recentTickets.slice(0, 6).map(t => (
                    <button
                      key={t.id}
                      onClick={() => navigate(`/tickets/${t.id}`)}
                      className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-white/[0.03] transition text-left w-full group"
                    >
                      <Avatar
                        initials={t.requester?.initials ?? t.initials ?? '??'}
                        size={30}
                        color={t.requester?.color}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="font-mono text-[10px] text-gray-500">
                            {t.ticket_number ?? `#${t.id}`}
                          </span>
                          <Badge label={t.status} cfg={STATUS_CFG[t.status]} />
                        </div>
                        <p className="text-gray-200 text-xs font-medium truncate group-hover:text-blue-400 transition">
                          {t.title}
                        </p>
                      </div>
                      <Badge label={t.priority} cfg={PRIORITY_CFG[t.priority]} dot />
                    </button>
                  ))}
                </div>
              )
          }
        </div>
      </div>

      {/* ── Technicians ── */}
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5">
        <SectionHeader title="Kinerja Teknisi" onAction={() => navigate('/users')} />
        {loading
          ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array(3).fill(0).map((_, i) => <Sk key={i} h="h-28" r="rounded-xl" />)}
            </div>
          : technicians.length === 0
            ? <p className="text-gray-600 text-sm text-center py-5">Belum ada data teknisi.</p>
            : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {technicians.map((t, i) => {
                  const accent = t.color ?? '#3B8BFF'
                  return (
                    <button
                      key={i}
                      onClick={() => navigate('/users')}
                      className="text-left rounded-xl border p-4 hover:brightness-110 transition focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      style={{ backgroundColor: `${accent}08`, borderColor: `${accent}20` }}
                    >
                      {/* Avatar + name */}
                      <div className="flex items-center gap-2.5 mb-3.5">
                        <Avatar initials={t.initials} size={36} color={accent} />
                        <div>
                          <p className="text-gray-200 font-semibold text-sm leading-tight">{t.name}</p>
                          <p className="text-gray-500 text-[10px]">{t.role ?? 'IT Support'}</p>
                        </div>
                      </div>

                      {/* Stats grid */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        {[
                          [t.resolved ?? 0,                    'Resolved', accent],
                          [t.avg_time ?? t.avg ?? '—',         'Avg Time', '#F59E0B'],
                          [`${t.sla_score ?? t.sla ?? 0}%`,    'SLA',      '#10B981'],
                        ].map(([v, l, c]) => (
                          <div key={l} className="bg-white/[0.04] rounded-lg py-2 px-1">
                            <p className="font-extrabold text-sm" style={{ color: c }}>{v}</p>
                            <p className="text-gray-600 text-[9px] mt-0.5 uppercase tracking-wider">{l}</p>
                          </div>
                        ))}
                      </div>
                    </button>
                  )
                })}
              </div>
            )
        }
      </div>

    </div>
  )
}

export default DashboardPage