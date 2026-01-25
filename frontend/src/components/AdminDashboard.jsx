import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  UserCheck,
  TrendingUp,
  RefreshCw,
  Activity,
  Award,
  Target,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { apiCall } from '../utils/api'
import toast from 'react-hot-toast'

/**
 * Admin Dashboard Component
 * Clean, modern admin interface with statistics and navigation
 */
const AdminDashboard = () => {
  const { token, logout } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    pendingApprovals: 0,
    totalMembers: 0,
    activeMembers: 0,
    totalDuroods: 0,
    weeklyDuroods: 0,
    totalSubmissions: 0,
    weeklySubmissions: 0,
  })

  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const fetchStats = useCallback(
    async (showToast = true) => {
      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        setIsRefreshing(true)
        let newStats = { ...stats }

        // Fetch users stats
        try {
          const usersRes = await apiCall('/admin/users/stats/overview', {}, token)
          if (usersRes.ok && usersRes.data) {
            const userData = usersRes.data.stats || usersRes.data.data?.stats || usersRes.data
            newStats.totalUsers = userData.total || userData.totalUsers || 0
            newStats.activeUsers = userData.active || userData.activeUsers || 0
            newStats.inactiveUsers = userData.inactive || userData.inactiveUsers || 0
            newStats.pendingApprovals = userData.pending || 0
          }
        } catch (err) {
          console.error('Error fetching users stats:', err.message)
        }

        // Fetch members stats
        try {
          const membersRes = await apiCall('/admin/members/stats/overview', {}, token)
          if (membersRes.ok && membersRes.data) {
            const memberData =
              membersRes.data.stats || membersRes.data.data?.stats || membersRes.data
            newStats.totalMembers = memberData.total || memberData.totalMembers || 0
            newStats.activeMembers = memberData.active || memberData.activeMembers || 0
          }
        } catch (err) {
          console.error('Error fetching members stats:', err.message)
        }

        // Fetch submissions
        try {
          const submissionsRes = await apiCall('/submissions?limit=1000', {}, token)
          if (submissionsRes.ok && submissionsRes.data) {
            let submissions = submissionsRes.data.data || submissionsRes.data || []
            if (!Array.isArray(submissions)) {
              submissions = submissions.submissions || []
            }

            newStats.totalSubmissions = submissions.length
            const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            newStats.weeklySubmissions = submissions.filter(
              (s) => new Date(s.submissionDateTime || s.createdAt) >= oneWeekAgo,
            ).length
            newStats.totalDuroods = submissions.reduce((sum, s) => sum + (s.duroodCount || 0), 0)
            newStats.weeklyDuroods = submissions
              .filter((s) => new Date(s.submissionDateTime || s.createdAt) >= oneWeekAgo)
              .reduce((sum, s) => sum + (s.duroodCount || 0), 0)
          }
        } catch (err) {
          console.error('Error fetching submissions:', err)
        }

        setStats(newStats)
        setLastUpdated(new Date())

        if (showToast) {
          toast.success('✓ Dashboard refreshed')
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
        toast.error('Failed to refresh dashboard')
      } finally {
        setIsRefreshing(false)
        setIsLoading(false)
      }
    },
    [token, stats],
  )

  useEffect(() => {
    if (token) {
      fetchStats(false)
      // Auto-refresh every 5 minutes
      const interval = setInterval(() => fetchStats(false), 5 * 60 * 1000)

      // Safety timeout: If loading after 10 seconds, force it to stop
      const loadingTimeout = setTimeout(() => {
        setIsLoading(false)
        setIsRefreshing(false)
      }, 10000)

      return () => {
        clearInterval(interval)
        clearTimeout(loadingTimeout)
      }
    } else {
      // No token available, stop loading
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [token, fetchStats])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-linear-to-br from-slate-900 to-slate-950">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <RefreshCw size={48} className="text-blue-400" />
          </div>
          <p className="text-slate-300">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const statCards = [
    {
      icon: Users,
      label: 'Total Users',
      value: stats.totalUsers,
      color: 'blue',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
    },
    {
      icon: UserCheck,
      label: 'Active Users',
      value: stats.activeUsers,
      color: 'green',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
    },
    {
      icon: Target,
      label: 'Active Members',
      value: stats.activeMembers,
      color: 'purple',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
    },
    {
      icon: TrendingUp,
      label: 'Weekly Duroods',
      value: stats.weeklyDuroods.toLocaleString(),
      color: 'pink',
      bgColor: 'bg-pink-500/10',
      borderColor: 'border-pink-500/20',
    },
    {
      icon: Activity,
      label: 'Total Submissions',
      value: stats.totalSubmissions,
      color: 'orange',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/20',
    },
    {
      icon: Award,
      label: 'Total Duroods',
      value: stats.totalDuroods.toLocaleString(),
      color: 'yellow',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20',
    },
  ]

  const colorMap = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    purple: 'text-purple-400',
    pink: 'text-pink-400',
    orange: 'text-orange-400',
    yellow: 'text-yellow-400',
  }

  const navigationItems = []

  return (
    <div className="flex h-screen bg-slate-950">
      {/* Sidebar - Hidden on Mobile */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col hidden md:flex`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
          {sidebarOpen && <h1 className="text-xl font-bold text-blue-400">Admin</h1>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden md:flex p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-2 py-4 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-left"
              >
                <Icon size={20} />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            )
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-slate-800 p-4 space-y-2">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar - Mobile Optimized */}
        <div className="h-12 sm:h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-3 sm:px-6 md:px-8">
          <h2 className="text-lg sm:text-2xl font-bold text-white">Dashboard</h2>
          <div className="flex items-center gap-2 sm:gap-4">
            {lastUpdated && (
              <span className="text-xs sm:text-sm text-slate-400 hidden sm:inline">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={() => fetchStats(true)}
              disabled={isRefreshing}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 min-h-[36px]"
            >
              <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 md:p-8">
          <div className="space-y-6 sm:space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-4 sm:gap-5 md:gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {statCards.map((card, idx) => {
                const Icon = card.icon
                return (
                  <div
                    key={idx}
                    className={`${card.bgColor} ${card.borderColor} border rounded-xl p-3 sm:p-4 md:p-6 backdrop-blur-sm hover:shadow-lg transition-shadow`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-slate-400 text-xs sm:text-sm font-medium">
                          {card.label}
                        </p>
                        <p
                          className={`${colorMap[card.color]} text-xl sm:text-2xl md:text-3xl font-bold mt-1 sm:mt-2`}
                        >
                          {card.value}
                        </p>
                      </div>
                      <Icon className={`${colorMap[card.color]} opacity-20`} size={24} />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Quick Info */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">
                System Overview
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 md:gap-5 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Users:</span>
                  <span className="text-white font-medium">{stats.totalUsers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Pending Approvals:</span>
                  <span className="text-yellow-400 font-medium">{stats.pendingApprovals}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Members:</span>
                  <span className="text-white font-medium">{stats.totalMembers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Inactive Users:</span>
                  <span className="text-red-400 font-medium">{stats.inactiveUsers}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
