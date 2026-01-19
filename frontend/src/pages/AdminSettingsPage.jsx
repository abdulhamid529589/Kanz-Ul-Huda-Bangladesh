import { useState, useEffect, useCallback } from 'react'
import { Save, RotateCcw, Filter, Lock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { apiCall } from '../utils/api'
import { showError, showSuccess } from '../utils/toast'

const AdminSettingsPage = () => {
  const { token, user, isMainAdmin } = useAuth()
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

  // Check if a setting key is restricted to main admin only
  const isRestrictedSetting = (key) => {
    return key && key.includes('registration') && key.includes('code')
  }

  const canEditSetting = (key) => {
    if (isRestrictedSetting(key) && !isMainAdmin) {
      return false
    }
    return true
  }

  const handleSettingChange = (key, value) => {
    if (!canEditSetting(key)) {
      showError('Only main admin can edit registration code settings')
      return
    }
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

  const filteredSettings = (
    categoryFilter ? settings.filter((s) => s.category === categoryFilter) : settings
  ).filter((s) => {
    // Hide registration code settings from non-main admins
    const isRegistrationCodeSetting = isRestrictedSetting(s.key)
    if (isRegistrationCodeSetting && !isMainAdmin) {
      return false
    }
    return true
  })

  const renderSettingInput = (setting) => {
    const value =
      editedSettings[setting.key] !== undefined ? editedSettings[setting.key] : setting.value
    const isRestricted = isRestrictedSetting(setting.key)
    const isDisabled = isRestricted && !isMainAdmin

    switch (setting.dataType) {
      case 'boolean':
        const boolValue = typeof value === 'string' ? value === 'true' : Boolean(value)
        return (
          <select
            value={String(boolValue)}
            onChange={(e) => handleSettingChange(setting.key, e.target.value === 'true')}
            disabled={isDisabled}
            className={`w-full px-3 py-2 text-xs sm:text-sm border-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all ${
              isDisabled
                ? 'opacity-60 cursor-not-allowed pointer-events-none border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20'
                : 'border-gray-300 dark:border-gray-600'
            }`}
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
            disabled={isDisabled}
            className={`w-full px-3 py-2 text-xs sm:text-sm border-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all ${
              isDisabled
                ? 'opacity-60 cursor-not-allowed pointer-events-none border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20'
                : 'border-gray-300 dark:border-gray-600'
            }`}
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
            disabled={isDisabled}
            placeholder="Comma-separated values"
            className={`w-full px-3 py-2 text-xs sm:text-sm border-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all ${
              isDisabled
                ? 'opacity-60 cursor-not-allowed pointer-events-none border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20'
                : 'border-gray-300 dark:border-gray-600'
            }`}
          />
        )

      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleSettingChange(setting.key, e.target.value)}
            disabled={isDisabled}
            className={`w-full px-3 py-2 text-xs sm:text-sm border-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all ${
              isDisabled
                ? 'opacity-60 cursor-not-allowed pointer-events-none border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20'
                : 'border-gray-300 dark:border-gray-600'
            }`}
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
    <div className="space-y-6 px-3 sm:px-4 md:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          System Settings
        </h1>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={handleResetToDefaults}
            className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-orange-600 dark:bg-orange-700 text-white rounded-lg hover:bg-orange-700 dark:hover:bg-orange-600 transition-colors text-xs sm:text-sm font-medium"
          >
            <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Reset to Defaults</span>
            <span className="sm:hidden">Reset</span>
          </button>
          <button
            onClick={handleSaveChanges}
            disabled={!isDirty}
            className={`flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg transition-colors text-xs sm:text-sm font-medium ${
              isDirty
                ? 'bg-primary-600 dark:bg-primary-700 text-white hover:bg-primary-700 dark:hover:bg-primary-600'
                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Save Changes</span>
            <span className="sm:hidden">Save</span>
          </button>
        </div>
      </div>

      {/* Security Notice */}
      {!isMainAdmin && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-start gap-3">
          <Lock className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-900 dark:text-amber-200 text-sm">
              Restricted Settings
            </h3>
            <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">
              Registration code settings can only be edited by the main administrator. Some settings
              on this page may be locked for security reasons.
            </p>
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-4 px-3 sm:px-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 sm:px-4 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {filteredSettings.map((setting) => {
          const isRestricted = isRestrictedSetting(setting.key)
          const isDisabled = isRestricted && !isMainAdmin

          return (
            <div
              key={setting._id}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 space-y-3 relative ${
                isDisabled ? 'opacity-75' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white break-words">
                      {setting.key}
                    </h3>
                    {isRestricted && (
                      <Lock
                        className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0"
                        title="Main Admin Only"
                      />
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 break-words">
                    {setting.description}
                  </p>
                  {isDisabled && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Only main admin can edit this setting
                    </p>
                  )}
                </div>
                <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded whitespace-nowrap">
                  {setting.category}
                </span>
              </div>

              <div className="pt-2 border-t dark:border-gray-700">
                <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                  Value
                </label>
                <div className="mt-2">{renderSettingInput(setting)}</div>
              </div>

              {editedSettings[setting.key] !== undefined && !isDisabled && (
                <div className="text-xs text-blue-600 dark:text-blue-400">Modified</div>
              )}
            </div>
          )
        })}
      </div>

      {filteredSettings.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 sm:p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
            No settings found in this category
          </p>
        </div>
      )}

      {isDirty && (
        <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 left-4 sm:left-auto bg-yellow-100 dark:bg-yellow-900 border border-yellow-400 dark:border-yellow-600 text-yellow-800 dark:text-yellow-200 px-3 sm:px-4 py-2 sm:py-3 rounded-lg shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 max-w-sm sm:max-w-none">
          <span className="text-xs sm:text-sm">You have unsaved changes</span>
          <button
            onClick={handleSaveChanges}
            className="px-3 sm:px-4 py-1 bg-yellow-600 dark:bg-yellow-700 text-white rounded hover:bg-yellow-700 dark:hover:bg-yellow-600 transition-colors text-xs sm:text-sm font-medium w-full sm:w-auto"
          >
            Save Now
          </button>
        </div>
      )}
    </div>
  )
}

export default AdminSettingsPage
