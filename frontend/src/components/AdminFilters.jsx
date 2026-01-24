import { useState } from 'react'
import { Filter, X, RefreshCw } from 'lucide-react'

/**
 * Advanced Admin Filters Component
 * Quick filtering options for common admin tasks
 */
const AdminFilters = ({ onFilterChange, loading }) => {
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    status: '',
    role: '',
    durood: '',
    joinDate: '',
    activity: '',
  })

  const [hasActiveFilters, setHasActiveFilters] = useState(false)

  const handleFilterChange = (field, value) => {
    const newFilters = { ...filters, [field]: value }
    setFilters(newFilters)

    // Check if any filter is active
    const active = Object.values(newFilters).some((v) => v !== '')
    setHasActiveFilters(active)

    onFilterChange(newFilters)
  }

  const handleReset = () => {
    const emptyFilters = {
      status: '',
      role: '',
      durood: '',
      joinDate: '',
      activity: '',
    }
    setFilters(emptyFilters)
    setHasActiveFilters(false)
    onFilterChange(emptyFilters)
  }

  const filterOptions = {
    status: [
      { value: '', label: 'All Status' },
      { value: 'active', label: '🟢 Active' },
      { value: 'inactive', label: '🔴 Inactive' },
      { value: 'pending', label: '🟡 Pending' },
      { value: 'blocked', label: '⛔ Blocked' },
    ],

    role: [
      { value: '', label: 'All Roles' },
      { value: 'admin', label: '👑 Admin' },
      { value: 'collector', label: '📋 Collector' },
      { value: 'user', label: '👤 User' },
      { value: 'member', label: '🙏 Member' },
    ],

    durood: [
      { value: '', label: 'All' },
      { value: '0', label: 'No Duroods' },
      { value: '1-10', label: '1-10 Duroods' },
      { value: '11-50', label: '11-50 Duroods' },
      { value: '51-100', label: '51-100 Duroods' },
      { value: '100+', label: '100+ Duroods' },
    ],

    joinDate: [
      { value: '', label: 'Any Time' },
      { value: 'today', label: 'Today' },
      { value: 'week', label: 'This Week' },
      { value: 'month', label: 'This Month' },
      { value: '6months', label: 'Last 6 Months' },
      { value: 'year', label: 'This Year' },
    ],

    activity: [
      { value: '', label: 'Any Activity' },
      { value: 'active-7d', label: 'Active Last 7 Days' },
      { value: 'active-30d', label: 'Active Last 30 Days' },
      { value: 'inactive-7d', label: 'Inactive 7+ Days' },
      { value: 'inactive-30d', label: 'Inactive 30+ Days' },
      { value: 'never', label: 'Never Active' },
    ],
  }

  const FilterField = ({ label, field, options }) => (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <select
        value={filters[field]}
        onChange={(e) => handleFilterChange(field, e.target.value)}
        disabled={loading}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Filter Toggle Button */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            hasActiveFilters
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Filter size={16} />
          <span>{showFilters ? 'Hide' : 'Show'} Filters</span>
          {hasActiveFilters && (
            <span className="ml-1 bg-white text-blue-600 px-2 py-0.5 rounded-full text-xs font-bold">
              Active
            </span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            <RefreshCw size={14} />
            Reset
          </button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FilterField label="Status" field="status" options={filterOptions.status} />
            <FilterField label="Role" field="role" options={filterOptions.role} />
            <FilterField label="Duroods" field="durood" options={filterOptions.durood} />
            <FilterField label="Join Date" field="joinDate" options={filterOptions.joinDate} />
            <FilterField label="Activity" field="activity" options={filterOptions.activity} />
          </div>

          {/* Quick Presets */}
          <div className="mt-6 pt-6 border-t">
            <p className="text-sm font-medium text-gray-700 mb-3">Quick Filters</p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: '🔴 Inactive Users', filters: { status: 'inactive' } },
                { label: '⏰ Recently Joined', filters: { joinDate: 'week' } },
                { label: '🟡 Pending Approval', filters: { status: 'pending' } },
                { label: '🙏 No Duroods', filters: { durood: '0' } },
              ].map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setFilters(preset.filters)
                    setHasActiveFilters(true)
                    onFilterChange(preset.filters)
                  }}
                  className="px-3 py-1 text-xs font-medium bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminFilters
