'use client'

import { useState, useMemo } from 'react'
import { useCacheEvents } from '@/hooks/use-cache-metrics'
import { Search, Filter, Download, Clock } from 'lucide-react'

export default function CacheLogsPage() {
  const { events: allEvents, loading } = useCacheEvents(undefined, 500)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedSource, setSelectedSource] = useState<string>('all')
  const [selectedLayer, setSelectedLayer] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'recent' | 'oldest'>('recent')
  const [currentPage, setCurrentPage] = useState(1)

  const itemsPerPage = 50

  // Filter and search events
  const filteredEvents = useMemo(() => {
    let filtered = allEvents

    if (selectedType !== 'all') {
      filtered = filtered.filter(e => e.type === selectedType)
    }
    if (selectedSource !== 'all') {
      filtered = filtered.filter(e => e.source === selectedSource)
    }
    if (selectedLayer !== 'all') {
      filtered = filtered.filter(e => e.layer === selectedLayer)
    }

    // Sort
    if (sortBy === 'oldest') {
      filtered = filtered.reverse()
    }

    return filtered
  }, [allEvents, selectedType, selectedSource, selectedLayer, sortBy])

  // Paginate
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage)
  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleExport = () => {
    const csv = [
      ['Timestamp', 'Type', 'Source', 'Layer', 'Response Time (ms)'].join(','),
      ...filteredEvents.map(e =>
        [
          new Date(e.timestamp).toISOString(),
          e.type,
          e.source,
          e.layer,
          e.responseTime.toFixed(2),
        ].join(',')
      ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cache-logs-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="flex-1">
      <div className="space-y-6 p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Cache Logs</h1>
            <p className="text-muted-foreground mt-1">
              Detailed cache event history for troubleshooting and analysis
            </p>
          </div>
          <button
            onClick={handleExport}
            disabled={filteredEvents.length === 0}
            className="px-4 py-2 rounded-md border border-border text-sm font-medium hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 w-fit"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="bg-background border border-border rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">
                Type
              </label>
              <select
                value={selectedType}
                onChange={e => {
                  setSelectedType(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm"
              >
                <option value="all">All Types</option>
                <option value="hit">Hit</option>
                <option value="miss">Miss</option>
                <option value="invalidation">Invalidation</option>
                <option value="error">Error</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-2">
                Source
              </label>
              <select
                value={selectedSource}
                onChange={e => {
                  setSelectedSource(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm"
              >
                <option value="all">All Sources</option>
                <option value="categories">Categories</option>
                <option value="flash-sales">Flash Sales</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-2">
                Cache Layer
              </label>
              <select
                value={selectedLayer}
                onChange={e => {
                  setSelectedLayer(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm"
              >
                <option value="all">All Layers</option>
                <option value="sessionStorage">SessionStorage</option>
                <option value="localStorage">LocalStorage</option>
                <option value="server">Server</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-2">
                Sort
              </label>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as 'recent' | 'oldest')}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm"
              >
                <option value="recent">Most Recent</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-2">
                Results
              </label>
              <div className="px-3 py-2 border border-border rounded-md bg-muted text-foreground text-sm">
                {filteredEvents.length.toLocaleString()} events
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="bg-background border border-border rounded-lg p-6">
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-12 bg-muted rounded" />
              ))}
            </div>
          </div>
        ) : paginatedEvents.length > 0 ? (
          <>
            <div className="bg-background border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Timestamp
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Source
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Cache Layer
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Response Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paginatedEvents.map((event, i) => (
                      <tr key={i} className="hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3 text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                              event.type === 'hit'
                                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100'
                                : event.type === 'miss'
                                  ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100'
                                  : event.type === 'invalidation'
                                    ? 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-100'
                                    : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100'
                            }`}
                          >
                            {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-foreground font-medium">
                          {event.source === 'categories' ? 'Categories' : 'Flash Sales'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{event.layer}</td>
                        <td className="px-4 py-3 font-mono text-foreground">
                          {event.responseTime.toFixed(2)}ms
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages} ({filteredEvents.length} total)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 rounded-md border border-border text-sm font-medium hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 rounded-md border border-border text-sm font-medium hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-background border border-border rounded-lg p-8 text-center">
            <p className="text-muted-foreground">No cache events found matching your filters</p>
          </div>
        )}
      </div>
    </main>
  )
}
