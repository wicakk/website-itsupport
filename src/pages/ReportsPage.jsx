import { useState, useEffect } from 'react'
import {
  BarChart3, TrendingUp, Zap, Package,
  FileText, Download, Ticket, CheckCheck,
  Clock, Loader2,
} from 'lucide-react'
import { PageHeader } from '../components/ui'
import { useAuth } from '../context/AppContext'

// ─── Report definitions ───────────────────────────────────────
const REPORTS = [
  {
    key:   'tickets',
    title: 'Laporan Tiket Bulanan',
    desc:  'Ringkasan tiket per bulan termasuk kategori dan prioritas.',
    icon:  BarChart3,
    color: { text: 'text-blue-400',   bg: 'bg-blue-400/10',   border: 'border-blue-400/20'   },
  },
  {
    key:   'technicians',
    title: 'Kinerja Teknisi',
    desc:  'Analisis performa tim IT Support berdasarkan tiket diselesaikan.',
    icon:  TrendingUp,
    color: { text: 'text-violet-400', bg: 'bg-violet-400/10', border: 'border-violet-400/20' },
  },
  {
    key:   'sla',
    title: 'SLA Performance Report',
    desc:  'Tingkat keberhasilan penyelesaian tiket sesuai SLA agreement.',
    icon:  Zap,
    color: { text: 'text-amber-400',  bg: 'bg-amber-400/10',  border: 'border-amber-400/20'  },
  },
  {
    key:   'assets',
    title: 'Inventaris Aset IT',
    desc:  'Laporan lengkap aset IT perusahaan beserta status dan warranty.',
    icon:  Package,
    color: { text: 'text-emerald-400',bg: 'bg-emerald-400/10',border: 'border-emerald-400/20'},
  },
]

// ─── Preview column definitions per report type ───────────────
// Tiket: field actual dari response API (tiket individual)
const PREVIEW_COLS = {
  tickets: [
    { key: 'ticket_number', label: 'No. Tiket',  render: (v, row) => v ?? `#${row.id}` },
    { key: 'title',         label: 'Judul'       },
    { key: 'category',      label: 'Kategori'    },
    { key: 'priority',      label: 'Prioritas'   },
    { key: 'status',        label: 'Status'      },
    { key: 'requester',     label: 'Reporter',   render: (v) => v?.name ?? '—' },
    { key: 'assignee',      label: 'Assigned',   render: (v) => v?.name ?? 'Unassigned' },
    { key: 'created_at',    label: 'Dibuat',     render: (v) => v ? new Date(v).toLocaleDateString('id-ID') : '—' },
    { key: 'sla_breached',  label: 'SLA Breach', render: (v) => v ? '⚠️ Ya' : '✓ Tidak' },
  ],
  technicians: [
    { key: 'name',           label: 'Teknisi'        },
    { key: 'role',           label: 'Role'           },
    { key: 'total_assigned', label: 'Ditugaskan'     },
    { key: 'resolved_count', label: 'Resolved'       },
    { key: 'sla_met',        label: 'SLA Terpenuhi'  },
    { key: 'sla_score',      label: 'SLA %',         render: (v) => v != null ? `${v}%` : '—' },
    { key: 'avg_hours',      label: 'Avg Waktu (jam)'},
  ],
  sla: [
    { key: 'priority',  label: 'Prioritas'   },
    { key: 'target',    label: 'Target SLA'  },
    { key: 'total',     label: 'Total Tiket' },
    { key: 'on_time',   label: 'Tepat Waktu' },
    { key: 'breached',  label: 'Terlambat'   },
    { key: 'achieved',  label: 'Tercapai',   render: (v) => v != null ? `${v}%` : '—' },
  ],
  assets: [
    { key: 'asset_number',   label: 'No. Aset'    },
    { key: 'name',           label: 'Nama'         },
    { key: 'category',       label: 'Kategori'     },
    { key: 'status',         label: 'Status'       },
    { key: 'location',       label: 'Lokasi'       },
    { key: 'warranty_expiry',label: 'Garansi s/d'  },
  ],
}

// ─── ReportsPage ──────────────────────────────────────────────
const ReportsPage = () => {
  const { authFetch } = useAuth()

  const [loadingKey, setLoadingKey] = useState(null)   // e.g. "tickets-pdf"
  const [stats,      setStats]      = useState(null)
  const [preview,    setPreview]    = useState(null)   // { key, rows }
  const [previewLoading, setPreviewLoading] = useState(null)

  const month = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })

  // ── Load quick stats ──
  useEffect(() => {
    const load = async () => {
      try {
        const res  = await authFetch('/api/reports/summary')
        if (!res.ok) throw new Error()
        setStats(await res.json())
      } catch { /* silent */ }
    }
    load()
  }, [])

  // ── Export ──
  const handleExport = async (key, format) => {
    const id = `${key}-${format}`
    try {
      setLoadingKey(id)
      const res = await authFetch(`/api/reports/${key}?format=${format}`)
      if (!res.ok) throw new Error(await res.text())
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `${key}-report.${format === 'excel' ? 'xlsx' : 'pdf'}`
      document.body.appendChild(a); a.click(); a.remove()
      URL.revokeObjectURL(url)
    } catch {
      alert('Gagal export laporan')
    } finally {
      setLoadingKey(null)
    }
  }

  // ── Preview data ──
  // tickets   → /api/reports/tickets?format=json   (paginated, rows ada di data.data)
  // sla       → /api/reports/sla                   (array langsung)
  // technicians → /api/reports/technicians         (array langsung)
  // assets    → /api/reports/assets?format=json    (rows ada di data.data)
  const handlePreview = async (key) => {
    if (preview?.key === key) { setPreview(null); return }
    setPreviewLoading(key)
    try {
      const url = key === 'sla' || key === 'technicians'
        ? `/api/reports/${key}`
        : `/api/reports/${key}?format=json`
      const res = await authFetch(url)
      if (!res.ok) throw new Error()
      const data = await res.json()
      // tickets/assets: paginated → data.data; sla/technicians: array langsung
      let rows = []
      if (Array.isArray(data))        rows = data
      else if (Array.isArray(data.data)) rows = data.data
      else if (Array.isArray(data.rows)) rows = data.rows
      setPreview({ key, rows })
    } catch {
      setPreview({ key, rows: [] })
    } finally {
      setPreviewLoading(null)
    }
  }

  const STATS = [
    { label: 'Total Tiket',    value: stats?.total_tickets ?? '—',               icon: Ticket,     color: 'text-blue-400',    bg: 'bg-blue-400/10',    border: 'border-blue-400/20'    },
    { label: 'Resolved',       value: stats?.resolved ?? '—',                    icon: CheckCheck, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
    { label: 'Avg Resolution', value: stats ? `${stats.avg_resolution}h` : '—',  icon: Clock,      color: 'text-amber-400',   bg: 'bg-amber-400/10',   border: 'border-amber-400/20'   },
    { label: 'SLA Score',      value: stats ? `${stats.sla_score}%` : '—',       icon: Zap,        color: 'text-violet-400',  bg: 'bg-violet-400/10',  border: 'border-violet-400/20'  },
  ]

  return (
    <div className="flex flex-col gap-5">

      <PageHeader title="Reports" subtitle="Generate dan export laporan IT Support" />

      {/* ── Report Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {REPORTS.map(({ key, title, desc, icon: Icon, color }) => {
          const isOpenPreview = preview?.key === key
          const isPrevLoading = previewLoading === key

          return (
            <div key={key} className="bg-gray-900 border border-gray-700 rounded-2xl p-5 flex flex-col gap-4 hover:border-gray-600 transition">

              {/* Icon + title */}
              <div className="flex items-start gap-3.5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${color.bg} ${color.border}`}>
                  <Icon size={18} className={color.text} />
                </div>
                <div>
                  <p className="text-gray-100 font-bold text-sm">{title}</p>
                  <p className="text-gray-500 text-xs mt-1 leading-relaxed">{desc}</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                {/* Preview */}
                <button
                  onClick={() => handlePreview(key)}
                  disabled={loadingKey !== null || isPrevLoading}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-semibold transition disabled:opacity-50
                    ${isOpenPreview
                      ? 'bg-gray-700 border-gray-600 text-gray-200'
                      : 'bg-white/5 border-gray-700 text-gray-400 hover:bg-white/10 hover:text-gray-200'}`}
                >
                  {isPrevLoading
                    ? <><Loader2 size={11} className="animate-spin" /> Memuat...</>
                    : <><FileText size={11} /> {isOpenPreview ? 'Tutup Preview' : 'Preview'}</>
                  }
                </button>

                {/* PDF */}
                <button
                  disabled={loadingKey !== null}
                  onClick={() => handleExport(key, 'pdf')}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border bg-red-500/10 border-red-500/30 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition disabled:opacity-50"
                >
                  {loadingKey === `${key}-pdf`
                    ? <><Loader2 size={11} className="animate-spin" /> PDF...</>
                    : <><FileText size={11} /> PDF</>
                  }
                </button>

                {/* Excel */}
                <button
                  disabled={loadingKey !== null}
                  onClick={() => handleExport(key, 'excel')}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border bg-emerald-500/10 border-emerald-500/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition disabled:opacity-50"
                >
                  {loadingKey === `${key}-excel`
                    ? <><Loader2 size={11} className="animate-spin" /> Excel...</>
                    : <><Download size={11} /> Excel</>
                  }
                </button>
              </div>

              {/* Preview table — inline below card */}
              {isOpenPreview && (
                <div className="overflow-x-auto rounded-xl border border-gray-700 -mx-1">
                  {preview.rows.length === 0 ? (
                    <p className="text-gray-500 text-xs text-center py-6">Tidak ada data tersedia.</p>
                  ) : (
                    <table className="w-full text-xs">
                      <thead className="bg-gray-800 sticky top-0">
                        <tr>
                          {PREVIEW_COLS[key]?.map(col => (
                            <th key={col.key}
                              className="px-3 py-2.5 text-left text-gray-400 font-semibold uppercase tracking-wider whitespace-nowrap">
                              {col.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.rows.map((row, i) => (
                          <tr key={i} className={`border-t border-gray-800 ${i % 2 === 1 ? 'bg-white/[0.02]' : ''}`}>
                            {PREVIEW_COLS[key]?.map(col => {
                              const raw = row[col.key]
                              const val = col.render ? col.render(raw, row) : (raw ?? '—')
                              return (
                                <td key={col.key} className="px-3 py-2 text-gray-300 whitespace-nowrap">
                                  {val}
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Quick Stats ── */}
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-200 font-bold text-sm">Quick Stats — {month}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {STATS.map(({ label, value, icon: Icon, color, bg, border }) => (
            <div key={label}
              className={`${bg} ${border} border rounded-xl py-4 px-3 text-center flex flex-col items-center gap-2`}>
              <Icon size={16} className={color} />
              <p className={`font-extrabold text-xl ${color}`}>{value}</p>
              <p className="text-gray-500 text-[10px] uppercase tracking-wider">{label}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

export default ReportsPage