import { useState, useEffect, useCallback } from 'react'
import { Save, RotateCcw, Filter } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { apiCall } from '../utils/api'
import { showError, showSuccess } from '../utils/toast'

const AdminSettingsPage = () => {
  const { token } = useAuth()
  const [settings, setSettings] = useState([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [editedSettings, setEditedSettings] = useState({})
  const [isDirty, setIsDirty] = useState(false)

  const categories = ['general', 'durood', 'member', 'submission', 'week', 'notification']

  const fetchSettings = useCallback(async () => {
    if (!token) return

    setLoading(true)
    try {
      const res = await apiCall('/admin/settings', {}, token)

      if (res.ok) {
        // Convert grouped settings to flat array
        const groupedSettings = res.data.data.settings || {}
        const settingsList = []

        Object.values(groupedSettings).forEach((category) => {
          if (Array.isArray(category)) {
            settingsList.push(...category)
          }
        })

        setSettings(settingsList)
        setEditedSettings({})
        setIsDirty(false)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      showError('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const handleSettingChange = (key, value) => {
    setEditedSettings({
      ...editedSettings,
      [key]: value,
    })
    setIsDirty(true)
  }

  const handleSaveChanges = async () => {
    try {
      const updates = Object.entries(editedSettings).map(([key, value]) => ({
        key,
        value,
      }))

      const res = await apiCall('/admin/settings/batch', { settings: updates }, token, 'PUT')

      if (res.ok) {
        showSuccess('Settings saved successfully')
        setEditedSettings({})
        setIsDirty(false)
        fetchSettings()
      }
    } catch (error) {
      showError(error.message || 'Failed to save settings')
    }
  }

  const handleResetToDefaults = async () => {
    if (!confirm('Are you sure? This will reset all settings to defaults.')) return

    try {
      const res = await apiCall('/admin/settings/reset/defaults', {}, token, 'POST')

      if (res.ok) {
        showSuccess('Settings reset to defaults')
        setEditedSettings({})
        setIsDirty(false)
        fetchSettings()
      }
    } catch (error) {
      showError(error.message || 'Failed to reset settings')
    }
  }

  const filteredSettings = categoryFilter
    ? settings.filter((s) => s.category === categoryFilter)
    : settings

  const renderSettingInput = (setting) => {
    const value =
      editedSettings[setting.key] !== undefined ? editedSettings[setting.key] : setting.value

    switch (setting.dataType) {
      case 'boolean':
        const boolValue = typeof value === 'string' ? value === 'true' : Boolean(value)
        return (
          <select
            value={String(boolValue)}
            onChange={(e) => handleSettingChange(setting.key, e.target.value === 'true')}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="true">Enabled</option>
            <option value="false">Disabled</option>
          </select>
        )

      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => {
              const num = e.target.value ? parseInt(e.target.value) : ''
              handleSettingChange(setting.key, num)
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        )

      case 'array':
        return (
          <input
            type="text"
            value={Array.isArray(value) ? value.join(', ') : value}
            onChange={(e) =>
              handleSettingChange(
                setting.key,
                e.target.value.split(',').map((s) => s.trim()),
              )
            }
            placeholder="Comma-separated values"
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        )

      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleSettingChange(setting.key, e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner w-12 h-12"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">System Settings</h1>
        <div className="flex gap-3">
          <button
            onClick={handleResetToDefaults}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 dark:bg-orange-700 text-white rounded-lg hover:bg-orange-700 dark:hover:bg-orange-600 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            Reset to Defaults
          </button>
          <button
            onClick={handleSaveChanges}
            disabled={!isDirty}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isDirty
                ? 'bg-primary-600 dark:bg-primary-700 text-white hover:bg-primary-700 dark:hover:bg-primary-600'
                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
          >
            <Save className="w-5 h-5" />
            Save Changes
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredSettings.map((setting) => (
          <div
            key={setting._id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {setting.key}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {setting.description}
                </p>
              </div>
              <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                {setting.category}
              </span>
            </div>

            <div className="pt-2 border-t dark:border-gray-700">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Value</label>
              <div className="mt-2">{renderSettingInput(setting)}</div>
            </div>

            {editedSettings[setting.key] !== undefined && (
              <div className="text-xs text-blue-600 dark:text-blue-400">Modified</div>
            )}
          </div>
        ))}
      </div>

      {filteredSettings.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">No settings found in this category</p>
        </div>
      )}

      {isDirty && (
        <div className="fixed bottom-6 right-6 bg-yellow-100 dark:bg-yellow-900 border border-yellow-400 dark:border-yellow-600 text-yellow-800 dark:text-yellow-200 px-4 py-3 rounded-lg shadow-lg flex items-center justify-between gap-4">
          <span>You have unsaved changes</span>
          <button
            onClick={handleSaveChanges}
            className="px-4 py-1 bg-yellow-600 dark:bg-yellow-700 text-white rounded hover:bg-yellow-700 dark:hover:bg-yellow-600 transition-colors"
          >
            Save Now
          </button>
        </div>
      )}
    </div>
  )
}

export default AdminSettingsPage
