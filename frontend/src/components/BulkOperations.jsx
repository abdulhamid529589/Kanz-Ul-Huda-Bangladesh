import { useState } from 'react'
import { Trash2, Check, X, Download, AlertTriangle, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useBulkOperations, exportToCSV } from '../hooks/useBulkOperations'
import { apiCall } from '../utils/api'

/**
 * Bulk Operations Modal Component
 * Handle batch operations on multiple items
 */
const BulkOperationsModal = ({ isOpen, items, onClose, apiToken, onSuccess }) => {
  const [operation, setOperation] = useState('activate')
  const { isProcessing, progress, results, processBulkOperation } = useBulkOperations()

  if (!isOpen || !items.length) return null

  const handleExecute = async () => {
    if (!window.confirm(`Confirm ${operation} for ${items.length} items?`)) {
      return
    }

    const operationConfig = {
      activate: { type: 'activate', endpoint: 'users' },
      deactivate: { type: 'deactivate', endpoint: 'users' },
      delete: { type: 'delete', endpoint: 'users' },
    }

    const result = await processBulkOperation(items, operationConfig[operation], apiCall, apiToken)

    if (result) {
      toast.success(
        `✓ ${result.success} succeeded${result.failed > 0 ? `, ${result.failed} failed` : ''}`,
      )
      if (result.failed > 0) {
        result.errors.slice(0, 3).forEach((err) => toast.error(err))
      }
      onSuccess && onSuccess()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Bulk Operations</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* Selected Count */}
        <p className="text-sm text-gray-600 mb-4">{items.length} items selected</p>

        {/* Operation Selection */}
        {!isProcessing && !results ? (
          <>
            <div className="space-y-3 mb-6">
              {[
                { value: 'activate', label: '✓ Activate', icon: Check, color: 'text-green-600' },
                { value: 'deactivate', label: '✗ Deactivate', icon: X, color: 'text-orange-600' },
                { value: 'delete', label: '🗑️ Delete', icon: Trash2, color: 'text-red-600' },
              ].map((op) => (
                <label
                  key={op.value}
                  className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="radio"
                    name="operation"
                    value={op.value}
                    checked={operation === op.value}
                    onChange={(e) => setOperation(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span className={`text-sm font-medium ${op.color}`}>{op.label}</span>
                </label>
              ))}
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleExecute}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
              >
                Execute
              </button>
            </div>
          </>
        ) : null}

        {/* Processing State */}
        {isProcessing && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="inline-block animate-spin">
                <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full" />
              </div>
              <p className="text-sm font-medium mt-2">Processing...</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 text-center">{Math.round(progress)}% complete</p>
          </div>
        )}

        {/* Results State */}
        {results && !isProcessing && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm text-green-900">{results.success} Succeeded</p>
                <p className="text-xs text-green-700">Operation completed successfully</p>
              </div>
            </div>

            {results.failed > 0 && (
              <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-200 max-h-32 overflow-y-auto">
                <AlertTriangle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm text-red-900">{results.failed} Failed</p>
                  <ul className="text-xs text-red-700 space-y-1 mt-1">
                    {results.errors.slice(0, 3).map((err, idx) => (
                      <li key={idx}>• {err}</li>
                    ))}
                  </ul>
                  {results.errors.length > 3 && (
                    <p className="text-xs text-red-600 mt-1">+{results.errors.length - 3} more</p>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Bulk Selection Toolbar
 */
const BulkSelectionToolbar = ({
  selectedCount,
  onSelectAll,
  onClearSelection,
  onBulkAction,
  loading,
}) => {
  if (selectedCount === 0) return null

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <CheckCircle size={20} className="text-blue-600" />
        <span className="font-medium text-sm sm:text-base">{selectedCount} selected</span>
      </div>

      <div className="flex gap-2 w-full sm:w-auto">
        <button
          onClick={onClearSelection}
          className="flex-1 sm:flex-none px-3 py-2 text-sm border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-100 font-medium"
        >
          Clear
        </button>
        <button
          onClick={onSelectAll}
          disabled={loading}
          className="flex-1 sm:flex-none px-3 py-2 text-sm border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-100 font-medium disabled:opacity-50"
        >
          Select All
        </button>
        <button
          onClick={onBulkAction}
          className="flex-1 sm:flex-none px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Bulk Action
        </button>
      </div>
    </div>
  )
}

/**
 * Export Data Helper
 */
const ExportButton = ({ data, filename = 'export' }) => {
  return (
    <button
      onClick={() => {
        if (data.length === 0) {
          toast.error('No data to export')
          return
        }
        exportToCSV(data, `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
      }}
      className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
    >
      <Download size={16} />
      <span>Export CSV</span>
    </button>
  )
}

export { BulkOperationsModal, BulkSelectionToolbar, ExportButton }
