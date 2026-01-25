import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LogOut,
  Menu,
  X,
  BarChart3,
  Users,
  Send,
  FileText,
  Trophy,
  UserCircle,
  Settings,
  Search,
  TrendingUp,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { MdDashboard } from 'react-icons/md'
import { useAuth } from '../context/AuthContext'
import { useIsDesktop } from '../hooks/useMediaQuery'
import ThemeToggle from './ThemeToggle'

const Layout = ({ children }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isDesktop = useIsDesktop()

  // Close sidebar on desktop by default
  useEffect(() => {
    if (isDesktop) {
      setSidebarOpen(false)
    }
  }, [isDesktop])

  const commonNavigation = useMemo(
    () => [
      { id: 'dashboard', path: '/dashboard', name: 'Dashboard', icon: BarChart3 },
      { id: 'members', path: '/members', name: 'Members', icon: Users },
      { id: 'submissions', path: '/submissions', name: 'Submissions', icon: Send },
      { id: 'reports', path: '/reports', name: 'Reports', icon: FileText },
      { id: 'personal-reports', path: '/personal-reports', name: 'My Reports', icon: FileText },
      { id: 'leaderboard', path: '/leaderboard', name: 'Leaderboard', icon: Trophy },
      { id: 'profiles', path: '/profiles', name: 'Member Profiles', icon: UserCircle },
      { id: 'advanced-search', path: '/advanced-search', name: 'Advanced Search', icon: Search },
      { id: 'messaging', path: '/messaging', name: 'Messages', icon: Send },
      { id: 'settings', path: '/settings', name: 'Settings', icon: Settings },
    ],
    [],
  )

  const adminNavigation = useMemo(
    () => [
      { id: 'admin-dashboard', path: '/admin-dashboard', name: 'Admin Dashboard', icon: BarChart3 },
      {
        id: 'admin-analytics',
        path: '/admin-analytics',
        name: 'Admin: Analytics',
        icon: TrendingUp,
      },
      { id: 'admin-users', path: '/admin-users', name: 'Admin: Users', icon: Users },
      { id: 'admin-members', path: '/admin-members', name: 'Admin: Members', icon: Users },
      { id: 'admin-settings', path: '/admin-settings', name: 'Admin: Settings', icon: Settings },
    ],
    [],
  )

  const navigation = useMemo(() => {
    if (user?.role === 'admin') {
      return [
        ...commonNavigation,
        { id: 'divider', path: null, name: '', icon: null },
        ...adminNavigation,
      ]
    }
    return commonNavigation
  }, [user?.role, commonNavigation, adminNavigation])

  const handleNavigation = useCallback(
    (path) => {
      navigate(path)
      setSidebarOpen(false)
    },
    [navigate],
  )

  const isActive = useCallback((path) => location.pathname === path, [location.pathname])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col w-screen overflow-x-hidden">
      {/* Header - Mobile Optimized */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 sticky top-0 z-50 safe-area w-full">
        <div className="px-3 py-2 sm:px-4 sm:py-2.5 md:px-5 md:py-3 lg:px-6 lg:py-3.5 flex items-center justify-between gap-2 min-h-[48px] sm:min-h-[52px] md:min-h-[56px] lg:min-h-[60px]">
          {/* Left Section - Menu & Logo */}
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 flex-1">
            <motion.button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0 active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center touch-target"
              aria-label="Toggle menu"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                animate={{ rotate: sidebarOpen ? 90 : 0 }}
                transition={{ duration: 0.15 }}
              >
                {sidebarOpen ? (
                  <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900 dark:text-white" />
                ) : (
                  <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900 dark:text-white" />
                )}
              </motion.div>
            </motion.button>
            <motion.h1
              className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold text-primary-600 dark:text-primary-400 flex items-center gap-2 sm:gap-3 md:gap-4 truncate"
              whileHover={{ scale: 1.02 }}
            >
              <motion.span
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl flex-shrink-0"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                🕌
              </motion.span>
              <span className="inline text-sm sm:text-lg md:text-2xl lg:text-3xl font-semibold truncate">
                Kanz ul Huda Bangladesh
              </span>
            </motion.h1>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-shrink-0">
            {/* User Info - Hidden on mobile */}
            <div className="text-right hidden md:block mr-2 lg:mr-4">
              <p className="font-medium text-gray-800 dark:text-gray-200 text-xs sm:text-sm md:text-base truncate max-w-[100px] lg:max-w-none">
                {user?.fullName || 'User'}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">{user?.role}</p>
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Logout Button */}
            <motion.button
              onClick={logout}
              className="flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 md:px-5 md:py-3 lg:px-6 lg:py-3.5 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 active:scale-95 transition-all text-xs sm:text-sm md:text-base lg:text-lg min-h-[44px] min-w-[44px] touch-target"
              aria-label="Logout"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Logout"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 flex-shrink-0" />
              <span className="hidden sm:inline">Logout</span>
            </motion.button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden w-full">
        {/* Sidebar - Modern Mobile Design - Centered on Mobile */}
        <AnimatePresence mode="wait">
          {(sidebarOpen || isDesktop) && (
            <motion.aside
              initial={isDesktop ? { x: -380, opacity: 0 } : { scale: 0.95, opacity: 0 }}
              animate={isDesktop ? { x: 0, opacity: 1 } : { scale: 1, opacity: 1 }}
              exit={isDesktop ? { x: -380, opacity: 0 } : { scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 40, duration: 0.2 }}
              className={`${
                isDesktop
                  ? 'fixed lg:sticky top-[48px] sm:top-[52px] md:top-[56px] lg:top-0 left-0 w-screen sm:w-72 md:w-80 lg:w-96 h-[calc(100vh-48px)] sm:h-[calc(100vh-52px)] md:h-[calc(100vh-56px)] lg:h-auto'
                  : 'fixed inset-0 w-full max-w-sm h-fit max-h-[calc(100vh-60px)] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl mx-3'
              } bg-gradient-to-b from-white via-white to-gray-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900 border-r dark:border-gray-700 z-40 lg:z-auto flex flex-col overflow-y-auto sm:overflow-hidden -webkit-overflow-scrolling-touch shadow-2xl lg:shadow-none`}
            >
              {/* Scrollable Navigation */}
              <nav className="space-y-1 px-3 sm:px-5 md:px-6 py-3 sm:py-6 md:py-8 pt-3 sm:pt-6 md:pt-8 flex-1 overflow-y-auto -webkit-overflow-scrolling-touch scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scroll-smooth">
                {navigation.map((item, index) => {
                  if (item.id === 'divider') {
                    return (
                      <div
                        key={index}
                        className="my-3 sm:my-4 md:my-6 pt-2 sm:pt-3 md:pt-4 border-t dark:border-gray-700"
                      >
                        <p className="px-4 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          📊 Admin Panel
                        </p>
                      </div>
                    )
                  }

                  const active = isActive(item.path)

                  return (
                    <motion.button
                      key={item.id}
                      onClick={() => handleNavigation(item.path)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all min-h-[48px] touch-target active:scale-95 text-sm sm:text-base md:text-lg font-medium ${
                        active
                          ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30 dark:shadow-primary-500/20'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                      }`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: Math.min(index * 0.03, 0.15),
                        duration: 0.15,
                      }}
                      whileHover={active ? undefined : { x: 4, transition: { duration: 0.15 } }}
                      whileTap={{ scale: 0.96 }}
                    >
                      <motion.div
                        animate={active ? { rotate: 20, scale: 1.2 } : { rotate: 0, scale: 1 }}
                        transition={{ duration: 0.15 }}
                        className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6"
                      >
                        <item.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                      </motion.div>
                      <span className="flex-1 text-left truncate">{item.name}</span>
                      {active && (
                        <motion.div
                          layoutId="active-pill"
                          className="w-2 h-2 rounded-full bg-white"
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                    </motion.button>
                  )
                })}
              </nav>

              {/* Sidebar Footer - Sticky at Bottom */}
              <div className="px-4 py-3 sm:py-4 md:py-5 border-t dark:border-gray-700 flex-shrink-0 bg-gradient-to-t from-white via-white to-transparent dark:from-gray-800 dark:via-gray-800 dark:to-transparent mt-auto safe-area-bottom">
                <div className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 text-center">
                  <p className="font-semibold">🕌 Kanz ul Huda</p>
                  <p className="mt-2 text-gray-500 dark:text-gray-500">v1.0.0</p>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Modern Backdrop Overlay - Full Screen */}
        <AnimatePresence mode="wait">
          {sidebarOpen && !isDesktop && (
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-md z-30 lg:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            />
          )}
        </AnimatePresence>

        {/* Main Content - Mobile Optimized */}
        <motion.main
          className="flex-1 overflow-y-auto -webkit-overflow-scrolling-touch p-3 sm:p-5 md:p-6 lg:p-8 xl:p-10 w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          style={{ height: 'calc(100vh - 48px)', minWidth: 0 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="max-w-full sm:max-w-2xl md:max-w-4xl lg:max-w-6xl xl:max-w-7xl 2xl:max-w-8xl h-full mx-auto">
            {children}
          </div>
        </motion.main>
      </div>
    </div>
  )
}

export default Layout
