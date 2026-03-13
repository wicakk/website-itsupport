import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, SlidersHorizontal, RefreshCw, Tag, CheckCircle2, RotateCcw, UserCheck } from 'lucide-react'
import { useAuth } from '../context/AppContext'
import { Badge, Avatar, PageHeader, FilterTabs, SearchBar, PrimaryButton, GhostButton, Modal, EmptyState } from '../components/ui'
import { PRIORITY_CFG, STATUS_CFG, T } from '../theme'

// ─── TicketsPage ──────────────────────────────────────────────
const TicketsPage = () => {
  const { authFetch } = useAuth()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [showNew, setShowNew] = useState(false)
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)

  const STATUS_TABS = ['All', 'Open', 'Assigned', 'In Progress', 'Waiting User', 'Resolved', 'Closed']

  const fetchTickets = useCallback(async (page = 1) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page, per_page: 20 })
      if (query) params.set('search', query)
      if (activeTab !== 'All') params.set('status', activeTab)

      const res = await authFetch(`/api/tickets?${params}`)
      if (!res.ok) throw new Error('Gagal memuat tiket.')
      const data = await res.json()

      setTickets(data.data ?? data)
      setCurrentPage(data.current_page ?? 1)
      setLastPage(data.last_page ?? 1)
      setTotal(data.total ?? (data.data ?? data).length)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [query, activeTab, authFetch])

  useEffect(() => { fetchTickets(1) }, [query, activeTab])

  if (error) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
      <Tag className="w-10 h-10 text-red-500" />
      <p className="text-red-500 text-sm">{error}</p>
      <button onClick={() => fetchTickets(1)}
        className="px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
        Coba Lagi
      </button>
    </div>
  )

  return (
    <div className="flex flex-col gap-6">

      <PageHeader
        title="Tickets"
        subtitle={loading ? 'Memuat...' : `${total} total tiket`}
        action={
          <div className="flex gap-2">
            <button onClick={() => fetchTickets(currentPage)} disabled={loading}
              className="p-2 bg-gray-800 border border-gray-700 rounded hover:bg-gray-700 transition flex items-center">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <PrimaryButton icon={Plus} onClick={() => setShowNew(true)}>Buat Tiket</PrimaryButton>
          </div>
        }
      />

      <div className="flex gap-2">
        <SearchBar value={query} onChange={e => { setQuery(e.target.value ?? e); setCurrentPage(1) }} placeholder="Cari tiket atau ID..." icon={Search} />
        <button className="px-3 py-2 flex items-center gap-1 text-sm bg-gray-800 border border-gray-700 rounded hover:bg-gray-700 transition">
          <SlidersHorizontal className="w-4 h-4" /> Filter
        </button>
      </div>

      <FilterTabs tabs={STATUS_TABS} active={activeTab} onChange={t => { setActiveTab(t); setCurrentPage(1) }} />

      <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-700">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-800">
            <tr>
              {['ID', 'Judul & Reporter', 'Kategori', 'Prioritas', 'Status', 'Assigned', 'SLA', ''].map(h => (
                <th key={h} className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array(8).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse bg-gray-800">
                    {Array(8).fill(0).map((_, j) => <td key={j} className="px-4 py-3 bg-gray-700 rounded-md mb-2">&nbsp;</td>)}
                  </tr>
                ))
              : tickets.map(t => (
                  <tr key={t.id} className="hover:bg-blue-900/20 cursor-pointer transition" onClick={() => setSelectedTicket(t)}>
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">{t.ticket_number ?? `#${t.id}`}</td>
                    <td className="px-4 py-3">
                      <div className="text-gray-100 font-medium">{t.title}</div>
                      <div className="text-gray-400 text-xs mt-0.5">{t.requester?.name ?? t.user ?? '—'} · {t.requester?.department ?? t.dept ?? '—'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 bg-gray-800 border border-gray-700 rounded-full px-2 py-0.5 text-xs text-gray-300">
                        {t.category ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge label={t.priority} cfg={PRIORITY_CFG[t.priority]} dot pulse={t.priority === 'Critical'} />
                    </td>
                    <td className="px-4 py-3">
                      <Badge label={t.status} cfg={STATUS_CFG[t.status]} />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{t.assignee?.name ?? 'Unassigned'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">{t.sla_deadline ?? t.sla ?? '—'}</td>
                    <td className="px-4 py-3">
                      <button onClick={e => { e.stopPropagation(); setSelectedTicket(t) }}
                        className="px-2 py-1 text-xs font-semibold text-blue-500 border border-blue-700 rounded hover:bg-blue-800 transition">
                        Detail
                      </button>
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>
        {!loading && tickets.length === 0 && <EmptyState icon={Tag} message="Tidak ada tiket ditemukan" />}

        {!loading && lastPage > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-700">
            <span className="text-xs text-gray-400">Halaman {currentPage} dari {lastPage}</span>
            <div className="flex gap-2">
              <button onClick={() => { fetchTickets(currentPage - 1); setCurrentPage(p => p - 1) }} disabled={currentPage <= 1}
                className={`px-3 py-1 rounded border border-gray-700 text-xs ${currentPage <= 1 ? 'text-gray-500 cursor-not-allowed' : 'text-gray-300 hover:bg-gray-700'}`}>
                ← Prev
              </button>
              <button onClick={() => { fetchTickets(currentPage + 1); setCurrentPage(p => p + 1) }} disabled={currentPage >= lastPage}
                className={`px-3 py-1 rounded border border-gray-700 text-xs ${currentPage >= lastPage ? 'text-gray-500 cursor-not-allowed' : 'text-gray-300 hover:bg-gray-700'}`}>
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedTicket && <TicketDetailModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} authFetch={authFetch} />}
      {showNew && <NewTicketModal onClose={() => setShowNew(false)} onSubmit={() => {}} submitting={submitting} />}
    </div>
  )
}

export default TicketsPage