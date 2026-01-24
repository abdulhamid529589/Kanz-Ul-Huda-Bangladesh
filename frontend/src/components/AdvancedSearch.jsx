import { useState, useEffect } from 'react'
import { Search, X, Filter, Save, Trash2, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

export const AdvancedSearch = ({
  onSearch,
  onFilter,
  searchType = 'all', // 'members', 'submissions', 'reports', 'all'
  showFilters = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    status: 'all',
    collector: '',
    duroodMin: '',
    duroodMax: '',
    country: '',
  })
  const [savedSearches, setSavedSearches] = useState([])
  const [searchName, setSearchName] = useState('')
  const [searchHistory, setSearchHistory] = useState([])

  // Load saved searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`saved_searches_${searchType}`)
    if (saved) {
      try {
        setSavedSearches(JSON.parse(saved))
      } catch (e) {
        console.error('Error loading saved searches:', e)
      }
    }

    const history = localStorage.getItem(`search_history_${searchType}`)
    if (history) {
      try {
        setSearchHistory(JSON.parse(history))
      } catch (e) {
        console.error('Error loading search history:', e)
      }
    }
  }, [searchType])

  const handleSearch = (query) => {
    setSearchQuery(query)
    onSearch?.(query)

    // Add to search history
    if (query.trim()) {
      const newHistory = [
        { query, timestamp: new Date().toLocaleString() },
        ...searchHistory.filter((h) => h.query !== query),
      ].slice(0, 10)
      setSearchHistory(newHistory)
      localStorage.setItem(`search_history_${searchType}`, JSON.stringify(newHistory))
    }
  }

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
    onFilter?.(newFilters)
  }

  const saveSearch = () => {
    if (!searchName.trim()) {
      toast.error('Please enter a search name')
      return
    }

    const newSearch = {
      id: Date.now(),
      name: searchName,
      query: searchQuery,
      filters,
      created: new Date().toLocaleString(),
    }

    const updated = [newSearch, ...savedSearches.filter((s) => s.name !== searchName)]
    setSavedSearches(updated)
    localStorage.setItem(`saved_searches_${searchType}`, JSON.stringify(updated))
    setSearchName('')
    toast.success('Search saved!')
  }

  const loadSearch = (search) => {
    setSearchQuery(search.query)
    setFilters(search.filters)
    onSearch?.(search.query)
    onFilter?.(search.filters)
    toast.success(`Loaded search: ${search.name}`)
  }

  const deleteSearch = (id) => {
    const updated = savedSearches.filter((s) => s.id !== id)
    setSavedSearches(updated)
    localStorage.setItem(`saved_searches_${searchType}`, JSON.stringify(updated))
    toast.success('Search deleted')
  }

  const clearAll = () => {
    setSearchQuery('')
    setFilters({
      dateFrom: '',
      dateTo: '',
      status: 'all',
      collector: '',
      duroodMin: '',
      duroodMax: '',
      country: '',
    })
    onSearch?.('')
    onFilter?.({})
  }

  return (
    <div className="w-full space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 text-slate-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="🔍 Search members, submissions, reports..."
            className="w-full pl-10 pr-10 py-2.5 bg-slate-800/70 border border-slate-700/50 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition"
          />
          {searchQuery && (
            <button
              onClick={() => handleSearch('')}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-200 transition"
            >
              <X size={18} />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`px-4 py-2.5 rounded-lg transition flex items-center gap-2 font-medium text-sm ${
            showAdvanced
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/50'
          }`}
        >
          <Filter size={18} />
          Filters
        </button>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && showFilters && (
        <div className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-lg space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Date Range */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase">
                Date From
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange({ ...filters, dateFrom: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase">
                Date To
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange({ ...filters, dateTo: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            {/* Durood Range */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase">
                Durood Min
              </label>
              <input
                type="number"
                value={filters.duroodMin}
                onChange={(e) => handleFilterChange({ ...filters, duroodMin: e.target.value })}
                placeholder="Min"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase">
                Durood Max
              </label>
              <input
                type="number"
                value={filters.duroodMax}
                onChange={(e) => handleFilterChange({ ...filters, duroodMax: e.target.value })}
                placeholder="Max"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Country Filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase">
                Country
              </label>
              <input
                type="text"
                value={filters.country}
                onChange={(e) => handleFilterChange({ ...filters, country: e.target.value })}
                placeholder="Country"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex gap-2 pt-2 border-t border-slate-700">
            <button
              onClick={clearAll}
              className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-sm transition"
            >
              Clear All
            </button>
            <button
              onClick={() => setShowAdvanced(false)}
              className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Save Search Section */}
      {searchQuery || Object.values(filters).some((v) => v && v !== 'all') ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            placeholder="Save this search as..."
            className="flex-1 px-3 py-2 bg-slate-800/70 border border-slate-700/50 rounded text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <button
            onClick={saveSearch}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded flex items-center gap-2 text-sm transition"
          >
            <Save size={16} />
            Save
          </button>
        </div>
      ) : null}

      {/* Saved Searches */}
      {savedSearches.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-slate-400 uppercase">Saved Searches</h3>
          <div className="flex flex-wrap gap-2">
            {savedSearches.map((search) => (
              <div
                key={search.id}
                className="group flex items-center gap-2 px-3 py-2 bg-slate-800/70 border border-slate-700/50 rounded hover:border-blue-500/50 transition"
              >
                <button
                  onClick={() => loadSearch(search)}
                  className="text-sm text-blue-400 hover:text-blue-300 transition"
                >
                  {search.name}
                </button>
                <button
                  onClick={() => deleteSearch(search.id)}
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search History */}
      {searchHistory.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-slate-400 uppercase flex items-center gap-2">
            <Clock size={14} />
            Recent Searches
          </h3>
          <div className="flex flex-wrap gap-2">
            {searchHistory.slice(0, 5).map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSearch(item.query)}
                className="px-3 py-1 bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-slate-100 rounded text-xs transition"
                title={item.timestamp}
              >
                {item.query.length > 20 ? item.query.substring(0, 20) + '...' : item.query}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default AdvancedSearch
