import { useState, useEffect, useCallback } from 'react'
import { CheckCircle, Clock, Calendar, TrendingUp, BarChart3, Bell, UserCheck } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { apiCall, formatNumber, formatTimeAgo } from '../utils/api'

const Dashboard = () => {
  const { token, isMainAdmin } = useAuth()
  const [stats, setStats] = useState(null)
  const [recentSubmissions, setRecentSubmissions] = useState([])
  const [pendingMembers, setPendingMembers] = useState([])
  const [pendingRegistrationRequests, setPendingRegistrationRequests] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = useCallback(async () => {
    if (!token) return

    setLoading(true)
    try {
      const apiCalls = [
        apiCall('/stats/dashboard', {}, token),
        apiCall('/submissions/recent?limit=10', {}, token),
        apiCall('/submissions/pending', {}, token),
      ]

      // Add registration requests API call only for main admin
      if (isMainAdmin) {
        apiCalls.push(apiCall('/registration-requests?status=pending&limit=5', {}, token))
      }

      const responses = await Promise.all(apiCalls)

      if (responses[0].ok) setStats(responses[0].data.data)
      if (responses[1].ok) setRecentSubmissions(responses[1].data.data)
      if (responses[2].ok) setPendingMembers(responses[2].data.data.pendingMembers)
      if (isMainAdmin && responses[3]?.ok) {
        setPendingRegistrationRequests(responses[3].data.data.requests || [])
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [token, isMainAdmin])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner w-12 h-12"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Pending Registration Requests Notification (Main Admin Only) */}
      {isMainAdmin && pendingRegistrationRequests.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-200">
                {pendingRegistrationRequests.length} Pending Registration Request
                {pendingRegistrationRequests.length !== 1 ? 's' : ''}
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-300">
                New registration requests are waiting for your approval
              </p>
            </div>
          </div>
          <a
            href="#admin-settings"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex-shrink-0"
          >
            Review
          </a>
        </div>
      )}

      {/* Current Week Summary */}
      {stats && (
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 text-white">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-medium opacity-90">Current Week</h2>
              <p className="text-xl sm:text-2xl font-bold">{stats.currentWeek.display}</p>
            </div>
            <div className="text-4xl sm:text-5xl opacity-20 hidden sm:block">📿</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-4 sm:mt-6 text-black">
            {[
              { label: 'Total Durood', value: formatNumber(stats.currentWeek.total), icon: '📊' },
              {
                label: 'Submitted',
                value: `${stats.currentWeek.submissionsCount} / ${stats.totalActiveMembers}`,
                icon: '✅',
              },
              { label: 'Pending', value: stats.currentWeek.pendingCount, icon: '⏳' },
            ].map((item, index) => (
              <motion.div
                key={index}
                className="bg-white text-black bg-opacity-20 rounded-lg p-3 sm:p-4 backdrop-blur-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.3)' }}
              >
                <p className="text-xs sm:text-sm font-medium text-black mb-1">{item.label}</p>
                <motion.p
                  className="text-2xl sm:text-3xl font-bold text-black"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                >
                  {item.value}
                </motion.p>
              </motion.div>
            ))}
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1 font-medium text-white">
              <span>Progress</span>
              <span>{stats.currentWeek.progressPercentage}%</span>
            </div>
            <div className="w-full bg-white bg-opacity-30 rounded-full h-3">
              <div
                className="bg-white rounded-full h-3 transition-all duration-500"
                style={{ width: `${stats.currentWeek.progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="card bg-white dark:bg-gray-800 border-0 dark:border dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">This Month</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {formatNumber(stats.monthTotal)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="card bg-white dark:bg-gray-800 border-0 dark:border dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">This Year</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {formatNumber(stats.yearTotal)}
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          <div className="card bg-white dark:bg-gray-800 border-0 dark:border dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">All Time</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {formatNumber(stats.allTimeTotal)}
                </p>
              </div>
              <div className="p-3 bg-secondary-100 dark:bg-secondary-900 rounded-full">
                <BarChart3 className="w-6 h-6 text-secondary-600 dark:text-secondary-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Registration Requests (Main Admin Only) */}
        {isMainAdmin && (
          <div className="card bg-white dark:bg-gray-800 border-0 dark:border dark:border-gray-700">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
                <UserCheck className="w-5 h-5 mr-2 text-blue-500 dark:text-blue-400" />
                Pending Registration Requests ({pendingRegistrationRequests.length})
              </h3>
            </div>
            <div className="max-h-96 overflow-y-auto scrollbar-custom">
              {pendingRegistrationRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 text-primary-500 dark:text-primary-400" />
                  <p>No pending registration requests!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingRegistrationRequests.map((request) => (
                    <div
                      key={request._id}
                      className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-30 rounded-lg border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-800 dark:text-white">{request.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{request.email}</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
                          Pending
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pending Members */}
        <div className="card bg-white dark:bg-gray-800 border-0 dark:border dark:border-gray-700">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
              <Clock className="w-5 h-5 mr-2 text-orange-500 dark:text-orange-400" />
              Pending Members ({pendingMembers.length})
            </h3>
          </div>
          <div className="max-h-96 overflow-y-auto scrollbar-custom">
            {pendingMembers.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-primary-500 dark:text-primary-400" />
                <p>All members have submitted!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingMembers.slice(0, 10).map((member) => (
                  <div
                    key={member._id}
                    className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900 dark:bg-opacity-30 rounded-lg border border-orange-200 dark:border-orange-700 hover:bg-orange-100 dark:hover:bg-orange-800 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white">{member.fullName}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {member.phoneNumber}
                      </p>
                    </div>
                    <button className="px-3 py-1 bg-orange-500 dark:bg-orange-600 text-white rounded text-sm hover:bg-orange-600 dark:hover:bg-orange-700 transition-colors">
                      Contact
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Submissions */}
        <div className="card bg-white dark:bg-gray-800 border-0 dark:border dark:border-gray-700">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-primary-500 dark:text-primary-400" />
              Recent Submissions
            </h3>
          </div>
          <div className="max-h-96 overflow-y-auto scrollbar-custom">
            {recentSubmissions.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                No submissions yet
              </p>
            ) : (
              <div className="space-y-3">
                {recentSubmissions.map((submission) => (
                  <div
                    key={submission._id}
                    className="flex items-center justify-between p-3 bg-primary-50 dark:bg-primary-900 dark:bg-opacity-30 rounded-lg border border-primary-200 dark:border-primary-700 hover:bg-primary-100 dark:hover:bg-primary-800 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 dark:text-white">
                        {submission.member?.fullName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatTimeAgo(submission.submissionDateTime)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary-600 dark:text-primary-400">
                        {formatNumber(submission.duroodCount)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Durood</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
