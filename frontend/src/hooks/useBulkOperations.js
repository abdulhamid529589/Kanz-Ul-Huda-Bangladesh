import { useState, useCallback } from 'react'
import { CheckCircle, AlertCircle, Trash2, Download } from 'lucide-react'
import toast from 'react-hot-toast'

/**
 * Bulk Operations Manager for Admin Productivity
 * Handles batch user/member operations efficiently
 */

export const useBulkOperations = () => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState(null)

  const processBulkOperation = useCallback(async (items, operation, apiCall, token) => {
    if (!items || items.length === 0) {
      toast.error('No items selected')
      return null
    }

    setIsProcessing(true)
    setProgress(0)
    const results = { success: 0, failed: 0, errors: [] }

    try {
      for (let i = 0; i < items.length; i++) {
        const item = items[i]

        try {
          let res
          switch (operation.type) {
            case 'delete':
              res = await apiCall(
                `/admin/${operation.endpoint}/${item.id}`,
                { method: 'DELETE' },
                token,
              )
              break

            case 'activate':
              res = await apiCall(
                `/admin/${operation.endpoint}/${item.id}/status`,
                { method: 'PUT', body: JSON.stringify({ status: 'active' }) },
                token,
              )
              break

            case 'deactivate':
              res = await apiCall(
                `/admin/${operation.endpoint}/${item.id}/status`,
                { method: 'PUT', body: JSON.stringify({ status: 'inactive' }) },
                token,
              )
              break

            case 'role':
              res = await apiCall(
                `/admin/${operation.endpoint}/${item.id}`,
                { method: 'PUT', body: JSON.stringify({ role: operation.value }) },
                token,
              )
              break

            default:
              res = { ok: false }
          }

          if (res.ok) {
            results.success++
          } else {
            results.failed++
            results.errors.push(
              `${item.email || item.name}: ${res.data?.message || 'Unknown error'}`,
            )
          }
        } catch (error) {
          results.failed++
          results.errors.push(`${item.email || item.name}: ${error.message}`)
        }

        setProgress(((i + 1) / items.length) * 100)
      }

      setResults(results)
      return results
    } finally {
      setIsProcessing(false)
    }
  }, [])

  return {
    isProcessing,
    progress,
    results,
    processBulkOperation,
  }
}

/**
 * Export to CSV for reporting
 */
export const exportToCSV = (data, filename = 'export.csv') => {
  if (!data || data.length === 0) {
    toast.error('No data to export')
    return
  }

  try {
    // Get headers from first object
    const headers = Object.keys(data[0])

    // Create CSV content
    let csv = headers.join(',') + '\n'

    data.forEach((row) => {
      const values = headers.map((header) => {
        const value = row[header]
        // Escape quotes and wrap in quotes if contains comma
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value || ''
      })
      csv += values.join(',') + '\n'
    })

    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)

    toast.success('✓ Export successful')
  } catch (error) {
    toast.error('Failed to export data')
    console.error('Export error:', error)
  }
}

/**
 * Quick Stats Calculator
 */
export const calculateStats = (data, field) => {
  if (!data || data.length === 0) return null

  const values = data.map((item) => item[field]).filter((v) => v !== null && v !== undefined)

  return {
    total: values.length,
    count: values.filter((v) => v).length,
    percentage: ((values.filter((v) => v).length / values.length) * 100).toFixed(1),
  }
}

/**
 * Smart Filters for quick searching
 */
export const smartFilters = {
  status: [
    { value: '', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'pending', label: 'Pending' },
  ],

  roles: [
    { value: '', label: 'All Roles' },
    { value: 'admin', label: 'Admin' },
    { value: 'collector', label: 'Collector' },
    { value: 'user', label: 'User' },
  ],

  durood: [
    { value: '', label: 'All' },
    { value: '0', label: '0 Durood' },
    { value: '1-10', label: '1-10 Durood' },
    { value: '11-50', label: '11-50 Durood' },
    { value: '51-100', label: '51-100 Durood' },
    { value: '100+', label: '100+ Durood' },
  ],
}

export default useBulkOperations
