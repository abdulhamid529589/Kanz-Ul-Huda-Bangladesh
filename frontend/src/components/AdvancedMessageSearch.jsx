import { useState, useEffect } from 'react'
import { Search, Filter, Calendar, User, Clock, X } from 'lucide-react'
import toast from 'react-hot-toast'

export const AdvancedMessageSearch = ({ conversationId, isOpen, onClose, onSelectMessage }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    from: '',
    startDate: '',
    endDate: '',
    hasMedia: false,
    hasReactions: false,
  })
  const [showFilters, setShowFilters] = useState(false)

  const handleSearch = async () => {
    if (!searchTerm && !Object.values(filters).some(Boolean)) {
      toast.error('Enter search term or apply filters')
      return
    }

    setLoading(true)
    try {
      const query = new URLSearchParams({
        conversationId,
        q: searchTerm,
        ...filters,
      })

      const response = await fetch(`/api/messages/search?${query}`)
      const data = await response.json()
      setResults(data.messages || [])

      if (data.messages?.length === 0) {
        toast.info('No messages found')
      }
    } catch (error) {
      console.error('Search error:', error)
      toast.error('Search failed')
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = () => {
    setFilters({
      from: '',
      startDate: '',
      endDate: '',
      hasMedia: false,
      hasReactions: false,
    })
    setSearchTerm('')
    setResults([])
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Search size={20} className="text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Search Messages</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-lg transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-slate-700 space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
            >
              Search
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Filter size={16} />
              Filters
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-300 mb-1">From Date</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">To Date</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.hasMedia}
                    onChange={(e) => setFilters({ ...filters, hasMedia: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-slate-300">Has Media</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.hasReactions}
                    onChange={(e) => setFilters({ ...filters, hasReactions: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-slate-300">Has Reactions</span>
                </label>
              </div>
              <button
                onClick={clearFilters}
                className="w-full px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-slate-400">Searching...</div>
            </div>
          ) : results.length > 0 ? (
            results.map((msg) => (
              <button
                key={msg._id}
                onClick={() => {
                  onSelectMessage(msg)
                  onClose()
                }}
                className="w-full text-left p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-200 break-words line-clamp-2 group-hover:text-blue-400 transition-colors">
                      {msg.content}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <User size={12} />
                        {msg.senderName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(msg.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  {msg.mediaUrls?.length > 0 && (
                    <span className="text-blue-400 text-xs bg-blue-600/20 px-2 py-1 rounded">
                      Has media
                    </span>
                  )}
                </div>
              </button>
            ))
          ) : (
            <div className="flex items-center justify-center py-8 text-slate-400">
              {searchTerm || Object.values(filters).some(Boolean)
                ? 'No messages found'
                : 'Enter search term or apply filters'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
