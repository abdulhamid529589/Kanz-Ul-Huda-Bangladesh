import { useState, useEffect, useMemo } from 'react'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  Download,
  RefreshCw,
  Filter,
  Search,
  Eye,
  EyeOff,
  Users,
  Activity,
  Award,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { apiCall } from '../utils/api'
import toast from 'react-hot-toast'

/**
 * Admin Analytics Page
 * Dashboard for users, collectors, and members analytics
 */
const AdminAnalyticsPage = () => {
  const { token } = useAuth()
  const [analyticsData, setAnalyticsData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('status')
  const [visibleCharts, setVisibleCharts] = useState({
    userDistribution: true,
    memberStatus: true,
    roleDistribution: true,
    timeline: true,
    usersList: true,
  })

  // Data states
  const [usersList, setUsersList] = useState([])
  const [userGrowth, setUserGrowth] = useState([])
  const [memberData, setMemberData] = useState(null)
  const [comparisonStats, setComparisonStats] = useState(null)

  useEffect(() => {
    fetchAnalytics()
  }, [token])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      // Fetch user stats
      const userStatsRes = await apiCall('/admin/users/stats/overview', {}, token)
      const usersRes = await apiCall('/users?limit=1000', {}, token)
      const membersRes = await apiCall('/admin/members/stats/overview', {}, token)

      let currentUserStats = null
      let users = []
      let members = null

      if (userStatsRes.ok && userStatsRes.data) {
        currentUserStats = userStatsRes.data.stats || userStatsRes.data.data?.stats || {}
      }

      if (usersRes.ok && Array.isArray(usersRes.data.data)) {
        users = usersRes.data.data
      }

      if (membersRes.ok && membersRes.data) {
        members = membersRes.data.stats || membersRes.data.data?.stats || {}
      }

      setUsersList(users)

      // Generate growth data
      const growthData = generateUserGrowth(users)
      setUserGrowth(growthData)

      // Compile stats
      const stats = {
        totalUsers: currentUserStats?.total || users.length || 0,
        admins: currentUserStats?.admins || 0,
        collectors: currentUserStats?.collectors || 0,
        activeUsers: currentUserStats?.active || 0,
        inactiveUsers: currentUserStats?.inactive || 0,
        pendingApprovals: currentUserStats?.pending || 0,
        totalMembers: members?.total || members?.totalMembers || 0,
        activeMembers: members?.active || members?.activeMembers || 0,
        inactiveMembers: members?.inactive || members?.inactiveMembers || 0,
      }

      setAnalyticsData(stats)
      setMemberData(members)
      setComparisonStats({})
    } catch (error) {
      console.error('Analytics error:', error)
      toast.error('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAnalytics()
    setRefreshing(false)
    toast.success('Analytics refreshed!')
  }

  const generateUserGrowth = (users) => {
    const growthByDate = {}

    users.forEach((user) => {
      const date = new Date(user.createdAt)
      const key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

      if (!growthByDate[key]) {
        growthByDate[key] = { date: key, total: 0, admins: 0, collectors: 0 }
      }
      growthByDate[key].total += 1
      if (user.role === 'admin') {
        growthByDate[key].admins += 1
      } else {
        growthByDate[key].collectors += 1
      }
    })

    return Object.values(growthByDate).slice(-10)
  }

  const filteredUsers = useMemo(() => {
    let filtered = [...usersList]

    if (searchTerm) {
      filtered = filtered.filter(
        (u) =>
          u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.username?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (sortBy === 'role') {
      filtered.sort((a, b) => (a.role || '').localeCompare(b.role || ''))
    } else if (sortBy === 'status') {
      filtered.sort((a, b) => (a.status || '').localeCompare(b.status || ''))
    } else if (sortBy === 'name') {
      filtered.sort((a, b) => (a.email || '').localeCompare(b.email || ''))
    }

    return filtered.slice(0, 20)
  }, [searchTerm, sortBy, usersList])

  const handleExport = (format = 'csv') => {
    if (!analyticsData) {
      toast.error('No data to export')
      return
    }

    if (format === 'csv') {
      exportAsCSV()
    } else if (format === 'json') {
      exportAsJSON()
    }
  }

  const exportAsCSV = () => {
    const csv = [
      ['Analytics Report', new Date().toLocaleString()],
      [],
      ['User & Member Analytics'],
      ['Metric', 'Value'],
      ['Total Users', analyticsData.totalUsers],
      ['Admins', analyticsData.admins],
      ['Collectors', analyticsData.collectors],
      ['Active Users', analyticsData.activeUsers],
      ['Inactive Users', analyticsData.inactiveUsers],
      ['Pending Approvals', analyticsData.pendingApprovals],
      ['Total Members', analyticsData.totalMembers],
      ['Active Members', analyticsData.activeMembers],
      ['Inactive Members', analyticsData.inactiveMembers],
      [],
      ['User List'],
      ['Email', 'Role', 'Status'],
      ...usersList.slice(0, 50).map((u) => [u.email, u.role, u.status]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `users-members-analytics-${Date.now()}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success('Analytics exported as CSV!')
  }

  const exportAsJSON = () => {
    const data = {
      exportDate: new Date().toISOString(),
      userStats: analyticsData,
      memberStats: memberData,
      userList: usersList.slice(0, 50),
      userGrowth,
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `users-members-analytics-${Date.now()}.json`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success('Analytics exported as JSON!')
  }

  const toggleChart = (chartName) => {
    setVisibleCharts((prev) => ({
      ...prev,
      [chartName]: !prev[chartName],
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <div className="animate-spin mb-4 flex justify-center">
            <Users size={48} className="text-blue-500" />
          </div>
          <p className="text-slate-600 dark:text-slate-400 font-medium">Loading analytics...</p>
        </div>
      </div>
    )
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  // Metric cards
  const metricCards = [
    {
      label: 'Total Users',
      value: analyticsData?.totalUsers || 0,
      icon: Users,
      color: 'blue',
    },
    {
      label: 'Admins',
      value: analyticsData?.admins || 0,
      icon: Award,
      color: 'green',
    },
    {
      label: 'Collectors',
      value: analyticsData?.collectors || 0,
      icon: Activity,
      color: 'purple',
    },
    {
      label: 'Total Members',
      value: analyticsData?.totalMembers || 0,
      icon: Users,
      color: 'orange',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-6 sm:py-8 px-3 sm:px-4 md:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2 sm:gap-3">
                <Users size={28} className="text-blue-500 sm:w-9 sm:h-9" />
                Users & Members Analytics
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-400 mt-1 sm:mt-2">
                Comprehensive user, collector, and member management insights
              </p>
            </div>
          </div>

          {/* Control Bar */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-3 sm:p-4 md:p-5 flex flex-col gap-3 sm:gap-4 sm:flex-wrap sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2 sm:gap-3 md:gap-4 flex-wrap">
              <div className="flex items-center gap-2 border-l border-slate-300 dark:border-slate-600 pl-2 sm:pl-3 md:pl-4">
                <Filter size={18} className="text-slate-600 dark:text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-2 sm:px-3 py-2 sm:py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="status">Sort by Status</option>
                  <option value="role">Sort by Role</option>
                  <option value="name">Sort by Email</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                Refresh
              </button>
              <div className="relative group">
                <button className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors">
                  <Download size={16} />
                  Export
                </button>
                <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  <button
                    onClick={() => handleExport('csv')}
                    className="block w-full text-left px-4 py-2 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 text-sm"
                  >
                    Export CSV
                  </button>
                  <button
                    onClick={() => handleExport('json')}
                    className="block w-full text-left px-4 py-2 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 text-sm border-t border-slate-200 dark:border-slate-700"
                  >
                    Export JSON
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 md:gap-6 mb-8">
          {metricCards.map((metric, idx) => {
            const Icon = metric.icon
            return (
              <div
                key={idx}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow p-4 sm:p-5 md:p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
                    {metric.label}
                  </p>
                  <div
                    className={`p-2 rounded-lg ${
                      metric.color === 'blue'
                        ? 'bg-blue-100 dark:bg-blue-900'
                        : metric.color === 'green'
                          ? 'bg-green-100 dark:bg-green-900'
                          : metric.color === 'purple'
                            ? 'bg-purple-100 dark:bg-purple-900'
                            : 'bg-orange-100 dark:bg-orange-900'
                    }`}
                  >
                    <Icon
                      size={20}
                      className={
                        metric.color === 'blue'
                          ? 'text-blue-600 dark:text-blue-400'
                          : metric.color === 'green'
                            ? 'text-green-600 dark:text-green-400'
                            : metric.color === 'purple'
                              ? 'text-purple-600 dark:text-purple-400'
                              : 'text-orange-600 dark:text-orange-400'
                      }
                    />
                  </div>
                </div>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {metric.value.toLocaleString()}
                </p>
              </div>
            )
          })}
        </div>

        {/* User Status Summary */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-5 md:p-6">
            <p className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-2">
              Active Users
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {analyticsData?.activeUsers || 0}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {analyticsData?.totalUsers > 0
                ? Math.round((analyticsData?.activeUsers / analyticsData?.totalUsers) * 100)
                : 0}
              % of total
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-5 md:p-6">
            <p className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-2">
              Inactive Users
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {analyticsData?.inactiveUsers || 0}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {analyticsData?.totalUsers > 0
                ? Math.round((analyticsData?.inactiveUsers / analyticsData?.totalUsers) * 100)
                : 0}
              % of total
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-5 md:p-6">
            <p className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-2">
              Pending Approvals
            </p>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {analyticsData?.pendingApprovals || 0}
            </p>
            <p className="text-xs text-slate-500 mt-1">Awaiting action</p>
          </div>
        </div>

        {/* Charts Visibility Toggle */}
        <div className="mb-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
          <p className="text-sm font-medium text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <Eye size={16} />
            Chart Visibility
          </p>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-5 md:gap-4">
            {[
              { key: 'userDistribution', label: 'User Distribution' },
              { key: 'memberStatus', label: 'Member Status' },
              { key: 'roleDistribution', label: 'Role Distribution' },
              { key: 'timeline', label: 'Timeline' },
              { key: 'usersList', label: 'Users List' },
            ].map((chart) => (
              <button
                key={chart.key}
                onClick={() => toggleChart(chart.key)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  visibleCharts[chart.key]
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white'
                }`}
              >
                {visibleCharts[chart.key] ? (
                  <Eye size={14} className="inline mr-1" />
                ) : (
                  <EyeOff size={14} className="inline mr-1" />
                )}
                {chart.label}
              </button>
            ))}
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 gap-4 sm:gap-5 md:gap-6 lg:grid-cols-2 lg:gap-6 mb-8">
          {/* User Distribution Pie */}
          {visibleCharts.userDistribution && (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-5 md:p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                User Role Distribution
              </h2>
              {analyticsData && (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Admins', value: analyticsData.admins || 1 },
                        { name: 'Collectors', value: analyticsData.collectors || 1 },
                      ]}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      <Cell fill="#3b82f6" />
                      <Cell fill="#10b981" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          )}

          {/* Member Status Pie */}
          {visibleCharts.memberStatus && (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-5 md:p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Member Status Distribution
              </h2>
              {analyticsData && (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Active', value: analyticsData.activeMembers || 1 },
                        { name: 'Inactive', value: analyticsData.inactiveMembers || 1 },
                      ]}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#ef4444" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          )}

          {/* User Growth Timeline */}
          {visibleCharts.timeline && userGrowth.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-5 md:p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                User Growth Timeline
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #475569',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="admins" fill="#3b82f6" />
                  <Bar dataKey="collectors" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Role Distribution Bar */}
          {visibleCharts.roleDistribution && (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-5 md:p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                User Roles Breakdown
              </h2>
              {analyticsData && (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      {
                        name: 'Users',
                        admins: analyticsData.admins || 0,
                        collectors: analyticsData.collectors || 0,
                      },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="admins" fill="#3b82f6" name="Admins" />
                    <Bar dataKey="collectors" fill="#10b981" name="Collectors" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          )}
        </div>

        {/* Users List Table */}
        {visibleCharts.usersList && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-5 md:p-6">
            <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
                Users List
              </h2>
              <div className="relative w-full sm:w-64">
                <Search size={18} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 sm:pr-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 border border-slate-200 dark:border-slate-600"
                  >
                    <div className="mb-2">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Email
                      </p>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 break-all">
                        {user.email}
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          Role
                        </p>
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-0.5 ${
                            user.role === 'admin'
                              ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300'
                              : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300'
                          }`}
                        >
                          {user.role || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          Status
                        </p>
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-0.5 ${
                            user.status === 'active'
                              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300'
                              : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300'
                          }`}
                        >
                          {user.status || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          Created
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                          {user.createdAt
                            ? new Date(user.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-500">
                  No users found matching your search
                </div>
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100 dark:bg-slate-700/50">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-white">
                      Email
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-white">
                      Role
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-white">
                      Status
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-white">
                      Created At
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        <td className="px-4 sm:px-6 py-4 text-sm text-slate-700 dark:text-slate-300 font-medium">
                          {user.email}
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-sm">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              user.role === 'admin'
                                ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300'
                                : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300'
                            }`}
                          >
                            {user.role || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-sm">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              user.status === 'active'
                                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300'
                                : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300'
                            }`}
                          >
                            {user.status || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-slate-500">
                        No users found matching your search
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminAnalyticsPage
