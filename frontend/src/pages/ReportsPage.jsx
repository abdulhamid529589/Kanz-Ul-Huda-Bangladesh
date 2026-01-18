import { useState, useEffect, useCallback } from 'react'
import { BarChart3, Download, Calendar, TrendingUp, Users } from 'lucide-react'
import html2pdf from 'html2pdf.js'
import { useAuth } from '../context/AuthContext'
import { apiCall, formatNumber } from '../utils/api'
import { showError, showSuccess } from '../utils/toast'

const ReportsPage = () => {
  const { token } = useAuth()
  const [stats, setStats] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [reportType, setReportType] = useState('overview')
  const [timeRange, setTimeRange] = useState('month')

  const fetchData = useCallback(async () => {
    if (!token) return

    setLoading(true)
    try {
      const [statsRes, submissionsRes, membersRes] = await Promise.all([
        apiCall('/stats/dashboard', {}, token),
        apiCall('/submissions?limit=500', {}, token),
        apiCall('/members?limit=1000', {}, token),
      ])

      if (statsRes.ok) setStats(statsRes.data.data)
      if (submissionsRes.ok) setSubmissions(submissionsRes.data.data || [])
      if (membersRes.ok) setMembers(membersRes.data.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Export to CSV
  const handleExportCSV = () => {
    if (submissions.length === 0) {
      showError('No data to export')
      return
    }

    const headers = [
      'Member Name',
      'Phone',
      'Country',
      'Durood Count',
      'Week Start',
      'Week End',
      'Notes',
    ]
    const rows = submissions.map((sub) => [
      sub.member?.fullName || '',
      sub.member?.phoneNumber || '',
      sub.member?.country || '',
      sub.duroodCount,
      new Date(sub.weekStartDate).toLocaleDateString(),
      new Date(sub.weekEndDate).toLocaleDateString(),
      sub.notes || '',
    ])

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `submissions-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Export to JSON
  const handleExportJSON = () => {
    if (submissions.length === 0) {
      showError('No data to export')
      return
    }

    const data = {
      exportDate: new Date().toISOString(),
      totalSubmissions: submissions.length,
      submissions: submissions.map((sub) => ({
        member: sub.member?.fullName,
        phone: sub.member?.phoneNumber,
        duroodCount: sub.duroodCount,
        week: {
          start: sub.weekStartDate,
          end: sub.weekEndDate,
        },
        notes: sub.notes,
      })),
    }

    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `submissions-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Export to PDF
  const handleExportPDF = () => {
    if (submissions.length === 0) {
      showError('No data to export')
      return
    }

    const htmlContent = `
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Submissions Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
            h1 { text-align: center; color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
            h2 { color: #374151; margin-top: 20px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background-color: #f3f4f6; padding: 10px; text-align: left; border: 1px solid #d1d5db; font-weight: bold; }
            td { padding: 8px; border: 1px solid #d1d5db; }
            tr:nth-child(even) { background-color: #f9fafb; }
            .summary { margin-top: 20px; padding: 15px; background-color: #eff6ff; border-left: 4px solid #3b82f6; }
            .summary p { margin: 5px 0; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body>
          <h1>Submissions Report</h1>
          <p><strong>Generated on:</strong> ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>
                <th>Member Name</th>
                <th>Phone</th>
                <th>Country</th>
                <th>Durood Count</th>
                <th>Week Start</th>
                <th>Week End</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${submissions
                .map(
                  (sub) => `
                <tr>
                  <td>${sub.member?.fullName || ''}</td>
                  <td>${sub.member?.phoneNumber || ''}</td>
                  <td>${sub.member?.country || ''}</td>
                  <td>${sub.duroodCount}</td>
                  <td>${new Date(sub.weekStartDate).toLocaleDateString()}</td>
                  <td>${new Date(sub.weekEndDate).toLocaleDateString()}</td>
                  <td>${sub.notes || ''}</td>
                </tr>
              `,
                )
                .join('')}
            </tbody>
          </table>
          <div class="summary">
            <h2>Summary</h2>
            <p><strong>Total Submissions:</strong> ${submissions.length}</p>
            <p><strong>Total Durood Count:</strong> ${formatNumber(submissions.reduce((sum, sub) => sum + sub.duroodCount, 0))}</p>
            <p><strong>Average per Submission:</strong> ${formatNumber(Math.round(submissions.reduce((sum, sub) => sum + sub.duroodCount, 0) / submissions.length))}</p>
          </div>
          <div class="footer">
            <p>This report was generated by Kanz ul Huda - Durood Collection System</p>
          </div>
        </body>
      </html>
    `

    const opt = {
      margin: 10,
      filename: `submissions-${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'landscape', unit: 'mm', format: 'a4' },
    }

    html2pdf().set(opt).from(htmlContent).save()
  }

  // Calculate member stats
  const memberStats = members
    .map((member) => {
      const memberSubs = submissions.filter((sub) => sub.member?._id === member._id)
      const totalDurood = memberSubs.reduce((sum, sub) => sum + sub.duroodCount, 0)
      return {
        name: member.fullName,
        duroodCount: totalDurood,
        submissions: memberSubs.length,
        lastSubmission: memberSubs.length > 0 ? memberSubs[0].submissionDateTime : null,
      }
    })
    .sort((a, b) => b.duroodCount - a.duroodCount)

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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-800 transition-colors"
            title="Export as CSV"
          >
            <Download className="w-5 h-5" />
            CSV
          </button>
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
            title="Export as JSON"
          >
            <Download className="w-5 h-5" />
            JSON
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-800 transition-colors"
            title="Export as PDF"
          >
            <Download className="w-5 h-5" />
            PDF
          </button>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setReportType('overview')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              reportType === 'overview'
                ? 'bg-primary-600 dark:bg-primary-700 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setReportType('members')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              reportType === 'members'
                ? 'bg-primary-600 dark:bg-primary-700 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Members Ranking
          </button>
          <button
            onClick={() => setReportType('detailed')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              reportType === 'detailed'
                ? 'bg-primary-600 dark:bg-primary-700 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Detailed Data
          </button>
        </div>
      </div>

      {/* Overview Report */}
      {reportType === 'overview' && stats && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Total Members</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {formatNumber(stats.totalActiveMembers)}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Total Submissions</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {formatNumber(submissions.length)}
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <BarChart3 className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">All Time Total</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {formatNumber(stats.allTimeTotal)}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                  <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">
                    Average per Member
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {formatNumber(
                      stats.totalActiveMembers > 0
                        ? Math.round(stats.allTimeTotal / stats.totalActiveMembers)
                        : 0,
                    )}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                  <Calendar className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Time Period Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                This Month
              </h3>
              <p className="text-4xl font-bold text-gray-900 dark:text-white">
                {formatNumber(stats.monthTotal)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {
                  submissions.filter(
                    (sub) =>
                      new Date(sub.weekStartDate) >=
                      new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                  ).length
                }{' '}
                submissions
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                This Year
              </h3>
              <p className="text-4xl font-bold text-gray-900 dark:text-white">
                {formatNumber(stats.yearTotal)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {
                  submissions.filter(
                    (sub) => new Date(sub.weekStartDate).getFullYear() === new Date().getFullYear(),
                  ).length
                }{' '}
                submissions
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Current Week
              </h3>
              <p className="text-4xl font-bold text-gray-900 dark:text-white">
                {formatNumber(stats.currentWeek.total)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {stats.currentWeek.submissionsCount} / {stats.totalActiveMembers} members submitted
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Members Ranking */}
      {reportType === 'members' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-300 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Top Members by Durood Count
            </h2>
          </div>

          {memberStats.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No data available
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Member Name
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Total Durood
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Submissions
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Average
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {memberStats.map((member, index) => (
                    <tr
                      key={index}
                      className="border-t border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="flex w-8 h-8 bg-primary-600 dark:bg-primary-700 text-white rounded-full items-center justify-center font-bold">
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                        {member.name}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full font-semibold">
                          {formatNumber(member.duroodCount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                        {member.submissions}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                        {member.submissions > 0
                          ? formatNumber(Math.round(member.duroodCount / member.submissions))
                          : 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Detailed Data */}
      {reportType === 'detailed' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-300 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              All Submissions Detail
            </h2>
          </div>

          {submissions.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No submissions available
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Member
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Durood Count
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Week
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Submitted By
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((submission) => (
                    <tr
                      key={submission._id}
                      className="border-t border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {submission.member?.fullName}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {submission.member?.country}
                        </p>
                      </td>
                      <td className="px-6 py-4 font-bold text-primary-600 dark:text-primary-400">
                        {formatNumber(submission.duroodCount)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {new Date(submission.weekStartDate).toLocaleDateString()} -{' '}
                        {new Date(submission.weekEndDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {submission.submittedBy?.fullName || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {new Date(submission.submissionDateTime).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ReportsPage
