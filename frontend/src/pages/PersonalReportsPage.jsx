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
      const [membersRes, submissionsRes] = await Promise.all([
        apiCall('/members?limit=1000', {}, token),
        apiCall('/submissions?limit=1000', {}, token),
      ])

      if (membersRes.ok) setMembers(membersRes.data.data || [])
      if (submissionsRes.ok) setSubmissions(submissionsRes.data.data || [])
    } catch (error) {
      console.error('Error fetching report data:', error)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchReportData()
  }, [fetchReportData])

  // Generate weekly report (only for current user's submissions on members they created)
  // Week: Saturday to Friday
  const generateWeeklyReport = useCallback(() => {
    const selectedDateObj = new Date(selectedDate)
    const dayOfWeek = selectedDateObj.getDay() // 0=Sunday, 1=Monday, ..., 6=Saturday

    // Calculate Saturday (start of week)
    const firstDay = new Date(selectedDateObj)
    const daysToSaturday = (dayOfWeek + 1) % 7 // Days to go back to Saturday
    firstDay.setDate(selectedDateObj.getDate() - daysToSaturday)

    // Calculate Friday (end of week)
    const lastDay = new Date(firstDay)
    lastDay.setDate(firstDay.getDate() + 6) // Friday is 6 days after Saturday

    // Get IDs of members created by current user
    const userCreatedMemberIds = new Set(
      members
        .filter((m) => m.createdBy?._id === user?._id || m.createdBy === user?._id)
        .map((m) => m._id),
    )

    // Filter submissions: only those created by current user AND on members they created
    const weekSubmissions = submissions.filter((sub) => {
      const subDate = new Date(sub.submissionDateTime || sub.createdAt)
      const isInDateRange = subDate >= firstDay && subDate <= lastDay
      const isCreatedByUser = sub.createdBy?._id === user?._id || sub.createdBy === user?._id
      const isMemberCreatedByUser = userCreatedMemberIds.has(sub.member?._id || sub.member)

      return isInDateRange && isCreatedByUser && isMemberCreatedByUser
    })

    const totalDurood = weekSubmissions.reduce((sum, sub) => sum + (sub.duroodCount || 0), 0)
    const uniqueMembers = new Set(weekSubmissions.map((sub) => sub.member?._id || sub.member)).size

    return {
      type: 'Weekly',
      period: `${firstDay.toLocaleDateString()} (Sat) - ${lastDay.toLocaleDateString()} (Fri)`,
      startDate: firstDay,
      endDate: lastDay,
      totalDurood,
      submissions: weekSubmissions.length,
      uniqueMembers,
      avgPerSubmission:
        weekSubmissions.length > 0 ? (totalDurood / weekSubmissions.length).toFixed(0) : 0,
      details: weekSubmissions,
    }
  }, [submissions, selectedDate, members, user])

  // Generate monthly report (only for current user's submissions on members they created)
  const generateMonthlyReport = useCallback(() => {
    const selectedDateObj = new Date(selectedDate)
    const year = selectedDateObj.getFullYear()
    const month = selectedDateObj.getMonth()

    // Get IDs of members created by current user
    const userCreatedMemberIds = new Set(
      members
        .filter((m) => m.createdBy?._id === user?._id || m.createdBy === user?._id)
        .map((m) => m._id),
    )

    // Filter submissions: only those created by current user AND on members they created
    const monthSubmissions = submissions.filter((sub) => {
      const subDate = new Date(sub.submissionDateTime || sub.createdAt)
      const isInDateRange = subDate.getFullYear() === year && subDate.getMonth() === month
      const isCreatedByUser = sub.createdBy?._id === user?._id || sub.createdBy === user?._id
      const isMemberCreatedByUser = userCreatedMemberIds.has(sub.member?._id || sub.member)

      return isInDateRange && isCreatedByUser && isMemberCreatedByUser
    })

    const totalDurood = monthSubmissions.reduce((sum, sub) => sum + (sub.duroodCount || 0), 0)
    const uniqueMembers = new Set(monthSubmissions.map((sub) => sub.member?._id || sub.member)).size

    const monthName = new Date(year, month, 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    })

    return {
      type: 'Monthly',
      period: monthName,
      startDate: new Date(year, month, 1),
      endDate: new Date(year, month + 1, 0),
      totalDurood,
      submissions: monthSubmissions.length,
      uniqueMembers,
      avgPerSubmission:
        monthSubmissions.length > 0 ? (totalDurood / monthSubmissions.length).toFixed(0) : 0,
      details: monthSubmissions,
    }
  }, [submissions, selectedDate, members, user])

  // Generate report based on type
  const handleGenerateReport = useCallback(() => {
    if (reportType === 'weekly') {
      setReportData(generateWeeklyReport())
    } else {
      setReportData(generateMonthlyReport())
    }
  }, [reportType, generateWeeklyReport, generateMonthlyReport])

  // Export to CSV
  const handleExportCSV = () => {
    if (!reportData) return

    const headers = ['Member Name', 'Durood Count', 'Week/Date', 'Notes']
    const rows = reportData.details.map((sub) => [
      sub.member?.fullName || 'Unknown',
      sub.duroodCount,
      new Date(sub.submissionDateTime || sub.createdAt).toLocaleDateString(),
      sub.notes || '',
    ])

    const csvContent = [
      [`${reportData.type} Report - ${reportData.period}`],
      [`Generated by: ${user?.fullName}`],
      [`Generated on: ${new Date().toLocaleString()}`],
      [],
      headers,
      ...rows,
      [],
      ['Summary'],
      ['Total Durood', reportData.totalDurood],
      ['Total Submissions', reportData.submissions],
      ['Unique Members', reportData.uniqueMembers],
      ['Average per Submission', reportData.avgPerSubmission],
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${reportData.type}-Report-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  // Export to JSON
  const handleExportJSON = () => {
    if (!reportData) return

    const exportData = {
      reportType: reportData.type,
      period: reportData.period,
      generatedBy: user?.fullName,
      generatedAt: new Date().toISOString(),
      summary: {
        totalDurood: reportData.totalDurood,
        submissions: reportData.submissions,
        uniqueMembers: reportData.uniqueMembers,
        avgPerSubmission: reportData.avgPerSubmission,
      },
      submissions: reportData.details.map((sub) => ({
        memberName: sub.member?.fullName || 'Unknown',
        duroodCount: sub.duroodCount,
        date: new Date(sub.submissionDateTime || sub.createdAt).toISOString(),
        notes: sub.notes || '',
      })),
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${reportData.type}-Report-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
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
                  <td>${sub.member?.fullName || 'Unknown'}</td>
                  <td>${sub.duroodCount}</td>
                  <td>${new Date(sub.submissionDateTime || sub.createdAt).toLocaleDateString()}</td>
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
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">My Reports</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
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
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            Generate Report
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Report Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Report Type
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              >
                <option value="weekly">Weekly Report</option>
                <option value="monthly">Monthly Report</option>
              </select>
            </div>

            {/* Date Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {reportType === 'weekly' ? 'Select Week (any day in week)' : 'Select Month'}
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Generate Button */}
            <div className="flex items-end">
              <button
                onClick={handleGenerateReport}
                className="w-full px-4 py-2 bg-primary-600 dark:bg-primary-700 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors font-medium"
              >
                Generate Report
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
                          {submission.member?.fullName || 'Unknown'}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400 font-semibold">
                          {submission.duroodCount}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-sm">
                          {new Date(
                            submission.submissionDateTime || submission.createdAt,
                          ).toLocaleDateString()}
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
