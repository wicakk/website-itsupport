import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, SlidersHorizontal, RefreshCw, Tag, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/AppContext'
import { Badge, PageHeader, FilterTabs, SearchBar, PrimaryButton, EmptyState } from '../components/ui'
import { PRIORITY_CFG, STATUS_CFG } from '../theme'

const Pagination = ({ currentPage, lastPage, total, perPage, onPageChange, loading }) => {
  if (total === 0) return null

  const getPages = () => {
    if (lastPage <= 1) return [1]
    const delta = 2
    const left  = Math.max(2, currentPage - delta)
    const right = Math.min(lastPage - 1, currentPage + delta)
    const middle = []
    for (let i = left; i <= right; i++) middle.push(i)
    const pages = [1]
    if (left > 2) pages.push('...')
    pages.push(...middle)
    if (right < lastPage - 1) pages.push('...')
    if (lastPage > 1) pages.push(lastPage)
    return pages
  }

  const from = Math.min((currentPage - 1) * perPage + 1, total)
  const to   = Math.min(currentPage * perPage, total)
  const btnBase     = 'min-w-[32px] h-8 px-2 flex items-center justify-center rounded text-xs font-medium transition-all border'
  const btnActive   = 'bg-blue-600 border-blue-500 text-white shadow shadow-blue-900/40'
  const btnNormal   = 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-600'
  const btnDisabled = 'bg-gray-900 border-gray-800 text-gray-600 cursor-not-allowed'

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-700 flex-wrap gap-2">
      <span className="text-xs text-gray-400">
        Menampilkan <span className="text-gray-200 font-medium">{from}–{to}</span> dari{' '}
        <span className="text-gray-200 font-medium">{total}</span> tiket
      </span>
      {lastPage > 1 && (
        <div className="flex items-center gap-1">
          <button onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1 || loading}
            className={`${btnBase} gap-1 ${currentPage <= 1 || loading ? btnDisabled : btnNormal}`}>
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Prev</span>
          </button>
          {getPages().map((p, i) =>
            p === '...'
              ? <span key={`d${i}`} className="px-1 text-gray-600 text-xs select-none">···</span>
              : <button key={p} onClick={() => onPageChange(p)} disabled={loading}
                  className={`${btnBase} ${p === currentPage ? btnActive : loading ? btnDisabled : btnNormal}`}>
                  {p}
                </button>
          )}
          <button onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= lastPage || loading}
            className={`${btnBase} gap-1 ${currentPage >= lastPage || loading ? btnDisabled : btnNormal}`}>
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}

const TicketsPage = () => {
  const { authFetch } = useAuth()
  const navigate = useNavigate()
  const [tickets, setTickets]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)
  const [showNew, setShowNew]         = useState(false)
  const [submitting, setSubmitting]   = useState(false)
  const [query, setQuery]             = useState('')
  const [activeTab, setActiveTab]     = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  const [lastPage, setLastPage]       = useState(1)
  const [total, setTotal]             = useState(0)

  const PER_PAGE    = 20
  const STATUS_TABS = ['All', 'Open', 'Assigned', 'In Progress', 'Waiting User', 'Resolved', 'Closed']

  const fetchTickets = useCallback(async (page = 1) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page, per_page: PER_PAGE })
      if (query)               params.set('search', query)
      if (activeTab !== 'All') params.set('status', activeTab)
      const res  = await authFetch(`/api/tickets?${params}`)
      if (!res.ok) throw new Error('Gagal memuat tiket.')
      const data = await res.json()
      const rows      = data.data ?? data
      const _total    = data.total    ?? rows.length
      const _lastPage = (data.last_page ?? Math.ceil(_total / PER_PAGE)) || 1
      const _curPage  = data.current_page ?? page
      setTickets(rows)
      setTotal(_total)
      setLastPage(_lastPage)
      setCurrentPage(_curPage)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [query, activeTab, authFetch])

  useEffect(() => {
    setCurrentPage(1)
    fetchTickets(1)
  }, [query, activeTab]) // eslint-disable-line

  const handlePageChange = (page) => {
    if (page === currentPage) return
    setCurrentPage(page)
    fetchTickets(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (error) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
      <Tag className="w-10 h-10 text-red-500" />
      <p className="text-red-500 text-sm">{error}</p>
      <button onClick={() => fetchTickets(currentPage)}
        className="px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm">
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
        <SearchBar value={query} onChange={e => setQuery(e.target?.value ?? e)}
          placeholder="Cari tiket atau ID..." icon={Search} />
        <button className="px-3 py-2 flex items-center gap-1 text-sm bg-gray-800 border border-gray-700 rounded hover:bg-gray-700 transition">
          <SlidersHorizontal className="w-4 h-4" /> Filter
        </button>
      </div>
      <FilterTabs tabs={STATUS_TABS} active={activeTab} onChange={t => setActiveTab(t)} />
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
                  <tr key={i} className="animate-pulse border-t border-gray-800">
                    {Array(8).fill(0).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-700 rounded" /></td>
                    ))}
                  </tr>
                ))
              : tickets.map(t => (
                  <tr key={t.id}
                    className="border-t border-gray-800 hover:bg-blue-900/20 cursor-pointer transition"
                    onClick={() => navigate(`/tickets/${t.id}`)}>
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">{t.ticket_number ?? `#${t.id}`}</td>
                    <td className="px-4 py-3">
                      <div className="text-gray-100 font-medium">{t.title}</div>
                      <div className="text-gray-400 text-xs mt-0.5">
                        {t.requester?.name ?? t.user ?? '—'} · {t.requester?.department ?? t.dept ?? '—'}
                      </div>
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
                      <button onClick={e => { e.stopPropagation(); navigate(`/tickets/${t.id}`) }}
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
        <Pagination
          currentPage={currentPage}
          lastPage={lastPage}
          total={total}
          perPage={PER_PAGE}
          onPageChange={handlePageChange}
          loading={loading}
        />
      </div>
      {showNew && (
        <NewTicketModal
          onClose={() => setShowNew(false)}
          onSubmit={() => { setShowNew(false); fetchTickets(1) }}
          submitting={submitting}
        />
      )}
    </div>
  )
}

export default TicketsPage