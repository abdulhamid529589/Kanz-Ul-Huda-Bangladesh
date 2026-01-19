import { useState, useEffect, useCallback } from 'react'
import { Download, Calendar, TrendingUp, Users } from 'lucide-react'
import { motion } from 'framer-motion'
import html2pdf from 'html2pdf.js'
import { useAuth } from '../context/AuthContext'
import { apiCall, formatNumber, formatTimeAgo } from '../utils/api'

const PersonalReportsPage = () => {
  const { token, user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [reportType, setReportType] = useState('weekly') // weekly or monthly
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [reportData, setReportData] = useState(null)
  const [members, setMembers] = useState([])
  const [submissions, setSubmissions] = useState([])

  // Fetch data for reports
  const fetchReportData = useCallback(async () => {
    if (!token) return

    setLoading(true)
    try {
      // Fetch the report based on type
      const endpoint =
        reportType === 'weekly'
          ? `/personal-reports/weekly?startDate=${selectedDate}`
          : `/personal-reports/monthly?month=${new Date(selectedDate).getMonth() + 1}&year=${new Date(selectedDate).getFullYear()}`

      const reportRes = await apiCall(endpoint, {}, token)

      if (reportRes.ok && reportRes.data.data.report) {
        setReportData(reportRes.data.data.report)
      } else {
        setReportData(null)
      }
    } catch (error) {
      console.error('Error fetching report data:', error)
      setReportData(null)
    } finally {
      setLoading(false)
    }
  }, [token, reportType, selectedDate])

  useEffect(() => {
    fetchReportData()
  }, [fetchReportData])

  // Export to CSV via API
  const handleExportCSV = async () => {
    if (!reportData) return

    try {
      const params = new URLSearchParams({
        format: 'csv',
        reportType: reportData.type.toLowerCase(),
      })

      if (reportData.type === 'Weekly') {
        params.append('startDate', selectedDate)
      } else {
        const date = new Date(selectedDate)
        params.append('month', date.getMonth() + 1)
        params.append('year', date.getFullYear())
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/personal-reports/export?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (!response.ok) {
        console.error('Failed to export CSV')
        return
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `personal-report-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting CSV:', error)
    }
  }

  // Export to JSON via API
  const handleExportJSON = async () => {
    if (!reportData) return

    try {
      const params = new URLSearchParams({
        format: 'json',
        reportType: reportData.type.toLowerCase(),
      })

      if (reportData.type === 'Weekly') {
        params.append('startDate', selectedDate)
      } else {
        const date = new Date(selectedDate)
        params.append('month', date.getMonth() + 1)
        params.append('year', date.getFullYear())
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/personal-reports/export?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (!response.ok) {
        console.error('Failed to export JSON')
        return
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `personal-report-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting JSON:', error)
    }
  }

  // Export to PDF
  const handleExportPDF = () => {
    if (!reportData) return

    const htmlContent = `
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${reportData.type} Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
            h1 { text-align: center; color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
            h2 { color: #374151; margin-top: 20px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
            .header-info { background-color: #f0f9ff; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
            .header-info p { margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background-color: #f3f4f6; padding: 10px; text-align: left; border: 1px solid #d1d5db; font-weight: bold; }
            td { padding: 8px; border: 1px solid #d1d5db; }
            tr:nth-child(even) { background-color: #f9fafb; }
            .summary { margin-top: 20px; padding: 15px; background-color: #eff6ff; border-left: 4px solid #3b82f6; }
            .summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 10px; }
            .summary-item { padding: 10px; background-color: white; border-radius: 5px; }
            .summary-item strong { display: block; color: #3b82f6; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body>
          <h1>${reportData.type} Report - ${reportData.period}</h1>
          <div class="header-info">
            <p><strong>Generated by:</strong> ${user?.fullName}</p>
            <p><strong>Generated on:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Period:</strong> ${new Date(reportData.startDate).toLocaleDateString()} - ${new Date(reportData.endDate).toLocaleDateString()}</p>
          </div>
          <h2>Submissions Details</h2>
          <table>
            <thead>
              <tr>
                <th>Member Name</th>
                <th>Durood Count</th>
                <th>Date</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.details
                .map(
                  (sub) => `
                <tr>
                  <td>${sub.memberName || 'Unknown'}</td>
                  <td>${sub.duroodCount}</td>
                  <td>${new Date(sub.date).toLocaleDateString()}</td>
                  <td>${sub.notes || ''}</td>
                </tr>
              `,
                )
                .join('')}
            </tbody>
          </table>
          <div class="summary">
            <h2>Summary</h2>
            <div class="summary-grid">
              <div class="summary-item">
                <strong>Total Durood:</strong>
                ${formatNumber(reportData.totalDurood)}
              </div>
              <div class="summary-item">
                <strong>Total Submissions:</strong>
                ${reportData.submissions}
              </div>
              <div class="summary-item">
                <strong>Unique Members:</strong>
                ${reportData.uniqueMembers}
              </div>
              <div class="summary-item">
                <strong>Avg per Submission:</strong>
                ${reportData.avgPerSubmission}
              </div>
            </div>
          </div>
          <div class="footer">
            <p>This report was generated by Kanz ul Huda - Durood Collection System</p>
          </div>
        </body>
      </html>
    `

    const opt = {
      margin: 10,
      filename: `${reportData.type}-Report-${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
    }

    html2pdf().set(opt).from(htmlContent).save()
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
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">My Reports</h1>
        <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mt-1">
          Generate and export your personal weekly and monthly Durood reports
        </p>
      </motion.div>

      {/* Report Generator */}
      <motion.div
        className="card dark:bg-gray-800 dark:border-gray-700"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="space-y-4">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 dark:text-primary-400" />
            Generate Report
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {/* Report Type Selection */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                Report Type
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              >
                <option value="weekly">Weekly Report</option>
                <option value="monthly">Monthly Report</option>
              </select>
            </div>

            {/* Date Selection */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                {reportType === 'weekly' ? 'Select Week' : 'Select Month'}
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Generate Button */}
            <div className="flex items-end">
              <button
                onClick={fetchReportData}
                className="w-full px-3 sm:px-4 py-2 text-xs sm:text-sm bg-primary-600 dark:bg-primary-700 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors font-medium"
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Generate Report'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Report Results */}
      {reportData && (
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <motion.div
              className="card dark:bg-gray-800 dark:border-gray-700"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Period</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-white">
                    {reportData.period}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
            </motion.div>

            <motion.div
              className="card dark:bg-gray-800 dark:border-gray-700"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Total Durood</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-white">
                    {formatNumber(reportData.totalDurood)}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </motion.div>

            <motion.div
              className="card dark:bg-gray-800 dark:border-gray-700"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Submissions</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-white">
                    {reportData.submissions}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
            </motion.div>

            <motion.div
              className="card dark:bg-gray-800 dark:border-gray-700"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.45 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Members</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-white">
                    {reportData.uniqueMembers}
                  </p>
                </div>
                <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
            </motion.div>
          </div>

          {/* Export Options */}
          <motion.div
            className="card dark:bg-gray-800 dark:border-gray-700"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Download className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              Export Options
            </h3>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors font-medium flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export as CSV
              </button>
              <button
                onClick={handleExportJSON}
                className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export as JSON
              </button>
              <button
                onClick={handleExportPDF}
                className="px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors font-medium flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export as PDF
              </button>
            </div>
          </motion.div>

          {/* Detailed Submissions Table */}
          <motion.div
            className="card dark:bg-gray-800 dark:border-gray-700"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
          >
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Submission Details
            </h3>

            {reportData.details.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <p>No submissions found for this period</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Member Name
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Durood Count
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Submission Date
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-gray-700">
                    {reportData.details.map((submission, index) => (
                      <tr
                        key={index}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                          {submission.memberName || 'Unknown'}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400 font-semibold">
                          {submission.duroodCount}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-sm">
                          {new Date(submission.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-sm max-w-xs truncate">
                          {submission.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>

          {/* Summary Statistics */}
          <motion.div
            className="card dark:bg-gray-800 dark:border-gray-700"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Summary Statistics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">Total Durood</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {formatNumber(reportData.totalDurood)}
                </p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">Total Submissions</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {reportData.submissions}
                </p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">Unique Members</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {reportData.uniqueMembers}
                </p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">Avg per Submission</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {reportData.avgPerSubmission}
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

export default PersonalReportsPage
