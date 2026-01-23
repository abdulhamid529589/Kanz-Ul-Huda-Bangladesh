import { useState, useEffect, useCallback } from 'react'
import {
  CheckCircle,
  Clock,
  Calendar,
  TrendingUp,
  BarChart3,
  Bell,
  UserCheck,
  Phone,
  Mail,
  MapPin,
  X,
} from 'lucide-react'
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
  const [selectedContactMember, setSelectedContactMember] = useState(null)

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
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="spinner w-12 h-12"
        ></motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Pending Registration Requests Notification (Main Admin Only) */}
      {isMainAdmin && pendingRegistrationRequests.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 border border-blue-200 dark:border-blue-700/50 rounded-xl p-4 flex items-center justify-between gap-4 shadow-md hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            </motion.div>
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
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href="#admin-settings"
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white text-sm font-medium rounded-lg transition-all shadow-md flex-shrink-0"
          >
            Review
          </motion.a>
        </motion.div>
      )}

      {/* Current Week Summary */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 text-white overflow-hidden relative"
        >
          {/* Animated background elements */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -ml-20 -mb-20"></div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div>
                <motion.h2
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-base sm:text-lg font-medium opacity-90"
                >
                  Current Week
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-xl sm:text-3xl font-bold text-white"
                >
                  {stats.currentWeek.display}
                </motion.p>
              </div>
              <motion.div
                animate={{ rotate: 360, y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="text-4xl sm:text-5xl opacity-30 hidden sm:block"
              >
                📿
              </motion.div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-4 sm:mt-6">
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
                  className="bg-black text-gray-900 bg-opacity-20 backdrop-blur-xl rounded-xl p-3 sm:p-4 border border-white/20 shadow-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.3)' }}
                >
                  <motion.p className="text-xs sm:text-sm font-medium text-white/80 mb-1">
                    {item.label}
                  </motion.p>
                  <motion.p
                    className="text-2xl sm:text-3xl font-bold text-white"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.1 + 0.2 }}
                  >
                    {item.value}
                  </motion.p>
                </motion.div>
              ))}
            </div>

            <div className="mt-6">
              <div className="flex justify-between text-sm mb-2 font-medium text-white/90">
                <span>Progress</span>
                <span className="font-bold">{stats.currentWeek.progressPercentage}%</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden border border-white/30 shadow-inner">
                <motion.div
                  className="bg-gradient-to-r from-white to-white/80 rounded-full h-3 shadow-lg"
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.currentWeek.progressPercentage}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                ></motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Quick Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[
            { label: 'This Month', value: formatNumber(stats.monthTotal), icon: '📅', delay: 0 },
            { label: 'This Year', value: formatNumber(stats.yearTotal), icon: '📈', delay: 0.1 },
            { label: 'All Time', value: formatNumber(stats.allTimeTotal), icon: '⭐', delay: 0.2 },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: stat.delay }}
              whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(34, 197, 94, 0.2)' }}
              className="card bg-gray-900/50 dark:bg-gray-800/50 border border-gray-700/50 hover:shadow-xl transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-1 font-medium">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-white dark:text-white">{stat.value}</p>
                </div>
                <motion.div
                  animate={{ scale: [1, 1.1, 1], rotate: [0, 10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: stat.delay }}
                  className="text-3xl opacity-30"
                >
                  {stat.icon}
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Recent Activity & Pending Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isMainAdmin && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="card bg-gray-900/50 dark:bg-gray-800/50 border border-gray-700/50 hover:shadow-xl transition-all"
          >
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                <motion.div
                  animate={{ rotate: [0, 10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <UserCheck className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                </motion.div>
                Pending Registration Requests
                <span className="ml-auto inline-flex items-center justify-center w-6 h-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-bold rounded-full">
                  {pendingRegistrationRequests.length}
                </span>
              </h3>
            </div>
            <div className="max-h-96 overflow-y-auto scrollbar-custom">
              {pendingRegistrationRequests.length === 0 ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center py-8 text-gray-500 dark:text-gray-400"
                >
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 text-primary-500 dark:text-primary-400" />
                  <p className="font-medium">No pending requests!</p>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  {pendingRegistrationRequests.map((request, index) => (
                    <motion.div
                      key={request._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ x: 4 }}
                      className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-blue-50/50 dark:from-blue-900/20 dark:to-blue-800/10 rounded-lg border border-blue-200 dark:border-blue-700/50 hover:shadow-md transition-all"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-800 dark:text-white">{request.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{request.email}</p>
                      </div>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-yellow-100 to-yellow-50 dark:from-yellow-900/40 dark:to-yellow-800/30 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-700/50">
                        Pending
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Pending Members */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="card bg-gray-900/50 dark:bg-gray-800/50 border border-gray-700/50 hover:shadow-xl transition-all"
        >
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Clock className="w-5 h-5 text-orange-500 dark:text-orange-400" />
              </motion.div>
              Pending Members
              <span className="ml-auto inline-flex items-center justify-center w-6 h-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold rounded-full">
                {pendingMembers.length}
              </span>
            </h3>
          </div>
          <div className="max-h-96 overflow-y-auto scrollbar-custom">
            {pendingMembers.length === 0 ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-8 text-gray-500 dark:text-gray-400"
              >
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-primary-500 dark:text-primary-400" />
                <p className="font-medium">All members submitted!</p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {pendingMembers.slice(0, 10).map((member, index) => (
                  <motion.div
                    key={member._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ x: 4 }}
                    className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-orange-50/50 dark:from-orange-900/20 dark:to-orange-800/10 rounded-lg border border-orange-200 dark:border-orange-700/50 hover:shadow-md transition-all"
                  >
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white">{member.fullName}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {member.phoneNumber}
                      </p>
                    </div>
                    <motion.button
                      onClick={() => setSelectedContactMember(member)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-3 py-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded text-sm font-medium transition-all shadow-md hover:shadow-lg"
                    >
                      Contact
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Submissions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="col-span-1 lg:col-span-2 card bg-gray-900/50 dark:bg-gray-800/50 border border-gray-700/50 hover:shadow-xl transition-all"
        >
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <CheckCircle className="w-5 h-5 text-primary-500 dark:text-primary-400" />
              </motion.div>
              Recent Submissions ({recentSubmissions.length})
            </h3>
          </div>
          <div className="max-h-96 overflow-y-auto scrollbar-custom">
            {recentSubmissions.length === 0 ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center text-gray-500 dark:text-gray-400 py-8"
              >
                <p className="font-medium">No submissions yet</p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {recentSubmissions.map((submission, index) => (
                  <motion.div
                    key={submission._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ x: 4 }}
                    className="flex items-center justify-between p-3 bg-gradient-to-r from-primary-50 to-primary-50/50 dark:from-primary-900/20 dark:to-primary-800/10 rounded-lg border border-primary-200 dark:border-primary-700/50 hover:shadow-md transition-all"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 dark:text-white">
                        {submission.member?.fullName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatTimeAgo(submission.submissionDateTime)}
                      </p>
                    </div>
                    <motion.div
                      className="text-right"
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.05 + 0.1 }}
                    >
                      <p className="font-bold text-lg bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
                        {formatNumber(submission.duroodCount)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Durood</p>
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Contact Information Modal */}
        {selectedContactMember && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedContactMember(null)}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Contact Information
                </h2>
                <button
                  onClick={() => setSelectedContactMember(null)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Member Name */}
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-1">Name</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedContactMember.fullName}
                  </p>
                </div>

                {/* Phone Number */}
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Phone</p>
                    <a
                      href={`tel:${selectedContactMember.phoneNumber}`}
                      className="text-lg font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {selectedContactMember.phoneNumber}
                    </a>
                  </div>
                </div>

                {/* Email */}
                {selectedContactMember.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Email</p>
                      <a
                        href={`mailto:${selectedContactMember.email}`}
                        className="text-lg font-semibold text-green-600 dark:text-green-400 hover:underline break-all"
                      >
                        {selectedContactMember.email}
                      </a>
                    </div>
                  </div>
                )}

                {/* Location */}
                {(selectedContactMember.city || selectedContactMember.country) && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                        Location
                      </p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {selectedContactMember.city ? `${selectedContactMember.city}, ` : ''}
                        {selectedContactMember.country}
                      </p>
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                  <a
                    href={`tel:${selectedContactMember.phoneNumber}`}
                    className="block w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-center transition-colors"
                  >
                    Call
                  </a>
                  {selectedContactMember.email && (
                    <a
                      href={`mailto:${selectedContactMember.email}`}
                      className="block w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-center transition-colors"
                    >
                      Send Email
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
