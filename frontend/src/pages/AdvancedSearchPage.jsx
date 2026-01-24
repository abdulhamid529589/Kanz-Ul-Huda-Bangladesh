import { useState, useEffect, useCallback } from 'react'
import { Search, Filter, Clock, Save, X, Download } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { apiCall } from '../utils/api'
import toast from 'react-hot-toast'

/**
 * Advanced Search Page
 * Search across members, submissions, and duroods with advanced filtering
 */
const AdvancedSearchPage = () => {
  const { token } = useAuth()
  const [searchType, setSearchType] = useState('members') // members, submissions, duroods
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [savedSearches, setSavedSearches] = useState([])
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [searchName, setSearchName] = useState('')

  // Filters
  const [filters, setFilters] = useState({
    status: '',
    dateFrom: '',
    dateTo: '',
    category: '',
    minDuroods: '',
    maxDuroods: '',
  })

  const [showFilters, setShowFilters] = useState(false)

  // Load saved searches
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('savedSearches') || '[]')
    setSavedSearches(saved)
  }, [])

  // Perform search
  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      toast.error('Please enter a search query')
      return
    }

    setLoading(true)
    try {
      let endpoint = ''
      let params = new URLSearchParams()

      params.append('search', query)

      if (filters.status) params.append('status', filters.status)
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
      if (filters.dateTo) params.append('dateTo', filters.dateTo)
      if (filters.category) params.append('category', filters.category)
      if (filters.minDuroods) params.append('minDuroods', filters.minDuroods)
      if (filters.maxDuroods) params.append('maxDuroods', filters.maxDuroods)

      if (searchType === 'members') {
        endpoint = `/members?${params.toString()}`
      } else if (searchType === 'submissions') {
        endpoint = `/submissions?${params.toString()}`
      } else if (searchType === 'duroods') {
        endpoint = `/submissions?${params.toString()}`
      }

      const res = await apiCall(endpoint, {}, token)

      if (res.ok) {
        const data = res.data.data || []
        setResults(Array.isArray(data) ? data : [])
        toast.success(`Found ${(Array.isArray(data) ? data : []).length} results`)
      } else {
        toast.error('Search failed')
      }
    } catch (error) {
      console.error('Search error:', error)
      toast.error('Error performing search')
    } finally {
      setLoading(false)
    }
  }, [query, filters, searchType, token])

  // Save current search
  const handleSaveSearch = () => {
    if (!searchName.trim()) {
      toast.error('Please enter a search name')
      return
    }

    const newSearch = {
      id: Date.now(),
      name: searchName,
      type: searchType,
      query,
      filters: { ...filters },
      timestamp: new Date().toLocaleString(),
    }

    const updated = [...savedSearches, newSearch]
    setSavedSearches(updated)
    localStorage.setItem('savedSearches', JSON.stringify(updated))

    setSearchName('')
    setShowSaveModal(false)
    toast.success('Search saved!')
  }

  // Load saved search
  const loadSavedSearch = (saved) => {
    setSearchType(saved.type)
    setQuery(saved.query)
    setFilters(saved.filters)
  }

  // Delete saved search
  const deleteSavedSearch = (id) => {
    const updated = savedSearches.filter((s) => s.id !== id)
    setSavedSearches(updated)
    localStorage.setItem('savedSearches', JSON.stringify(updated))
    toast.success('Saved search deleted')
  }

  // Export results
  const handleExport = () => {
    if (results.length === 0) {
      toast.error('No results to export')
      return
    }

    const csv = [
      Object.keys(results[0]).join(','),
      ...results.map((item) =>
        Object.values(item)
          .map((v) => `"${v}"`)
          .join(','),
      ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `search-results-${Date.now()}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success('Results exported!')
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            Advanced Search
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Search across members, submissions, and duroods with advanced filters
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Search Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Search Type Selection */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Search Type
              </h2>
              <div className="flex gap-3 flex-wrap">
                {[
                  { id: 'members', label: 'Members' },
                  { id: 'submissions', label: 'Submissions' },
                  { id: 'duroods', label: 'Duroods' },
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSearchType(type.id)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      searchType === type.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
              <div className="flex gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder={`Search ${searchType}...`}
                    className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  <Search size={20} />
                  {loading ? 'Searching...' : 'Search'}
                </button>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-3 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                  <Filter size={20} />
                </button>
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                  Filters
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Status
                    </label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="">All Statuses</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Category
                    </label>
                    <select
                      value={filters.category}
                      onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="">All Categories</option>
                      <option value="Regular">Regular</option>
                      <option value="Special">Special</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      From Date
                    </label>
                    <input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      To Date
                    </label>
                    <input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Min Duroods
                    </label>
                    <input
                      type="number"
                      value={filters.minDuroods}
                      onChange={(e) => setFilters({ ...filters, minDuroods: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Max Duroods
                    </label>
                    <input
                      type="number"
                      value={filters.maxDuroods}
                      onChange={(e) => setFilters({ ...filters, maxDuroods: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    Apply Filters
                  </button>
                  <button
                    onClick={() => {
                      setFilters({
                        status: '',
                        dateFrom: '',
                        dateTo: '',
                        category: '',
                        minDuroods: '',
                        maxDuroods: '',
                      })
                    }}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}

            {/* Results */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Results ({results.length})
                </h3>
                {results.length > 0 && (
                  <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <Download size={18} />
                    Export CSV
                  </button>
                )}
              </div>

              {results.length === 0 ? (
                <div className="p-6 text-center text-slate-500 dark:text-slate-400">
                  {query ? 'No results found' : 'Start by entering a search query'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-100 dark:bg-slate-700">
                      <tr>
                        {Object.keys(results[0] || {})
                          .slice(0, 5)
                          .map((key) => (
                            <th
                              key={key}
                              className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white"
                            >
                              {key}
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {results.slice(0, 20).map((item, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                          {Object.values(item)
                            .slice(0, 5)
                            .map((val, i) => (
                              <td
                                key={i}
                                className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300"
                              >
                                {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                              </td>
                            ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {results.length > 20 && (
                    <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
                      Showing 20 of {results.length} results
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Saved Searches */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6 sticky top-20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock size={20} />
                  Saved Searches
                </h3>
              </div>

              <button
                onClick={() => setShowSaveModal(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors mb-4"
              >
                <Save size={18} />
                Save Search
              </button>

              <div className="space-y-2">
                {savedSearches.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No saved searches yet
                  </p>
                ) : (
                  savedSearches.map((saved) => (
                    <div key={saved.id} className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
                      <button
                        onClick={() => loadSavedSearch(saved)}
                        className="w-full text-left mb-2"
                      >
                        <p className="font-medium text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                          {saved.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {saved.timestamp}
                        </p>
                      </button>
                      <button
                        onClick={() => deleteSavedSearch(saved.id)}
                        className="w-full text-left text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors flex items-center gap-1"
                      >
                        <X size={14} />
                        Delete
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Save Search Modal */}
        {showSaveModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Save This Search
              </h3>
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="Search name..."
                className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleSaveSearch}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowSaveModal(false)
                    setSearchName('')
                  }}
                  className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdvancedSearchPage
