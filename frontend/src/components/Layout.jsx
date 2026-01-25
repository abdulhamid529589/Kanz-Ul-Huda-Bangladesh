import { useState, useEffect } from 'react'
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

  const commonNavigation = [
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
  ]

  const adminNavigation = [
    { id: 'admin-dashboard', path: '/admin-dashboard', name: 'Admin Dashboard', icon: BarChart3 },
    { id: 'admin-analytics', path: '/admin-analytics', name: 'Admin: Analytics', icon: TrendingUp },
    { id: 'admin-users', path: '/admin-users', name: 'Admin: Users', icon: Users },
    { id: 'admin-members', path: '/admin-members', name: 'Admin: Members', icon: Users },
    { id: 'admin-settings', path: '/admin-settings', name: 'Admin: Settings', icon: Settings },
  ]

  const navigation =
    user?.role === 'admin'
      ? [
          ...commonNavigation,
          { id: 'divider', path: null, name: '', icon: null },
          ...adminNavigation,
        ]
      : commonNavigation

  const handleNavigation = (path) => {
    navigate(path)
    setSidebarOpen(false)
  }

  const isActive = (path) => location.pathname === path

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col w-screen overflow-x-hidden">
      {/* Header - Mobile Optimized */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 sticky top-0 z-50 safe-area w-full">
        <div className="px-1.5 sm:px-2 md:px-3 lg:px-4 py-1 sm:py-1.5 md:py-2 lg:py-2.5 flex items-center justify-between gap-1 min-h-[48px] sm:min-h-[52px] md:min-h-[56px] lg:min-h-[60px]">
          {/* Left Section - Menu & Logo */}
          <div className="flex items-center gap-0.5 sm:gap-2 md:gap-3 min-w-0 flex-1">
            <motion.button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0 active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Toggle menu"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div animate={{ rotate: sidebarOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
                {sidebarOpen ? (
                  <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900 dark:text-white" />
                ) : (
                  <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900 dark:text-white" />
                )}
              </motion.div>
            </motion.button>
            <motion.h1
              className="text-xs sm:text-lg md:text-2xl lg:text-3xl font-bold text-primary-600 dark:text-primary-400 flex items-center gap-0.5 sm:gap-2 md:gap-3 truncate"
              whileHover={{ scale: 1.02 }}
            >
              <motion.span
                className="text-base sm:text-2xl md:text-3xl lg:text-4xl flex-shrink-0"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                🕌
              </motion.span>
              <span className="inline text-xs sm:text-sm md:text-lg lg:text-xl font-semibold truncate">
                Kanz ul Huda
              </span>
            </motion.h1>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center gap-0.5 sm:gap-2 md:gap-3 flex-shrink-0">
            {/* User Info - Hidden on mobile */}
            <div className="text-right hidden md:block mr-0 lg:mr-2">
              <p className="font-medium text-gray-800 dark:text-gray-200 text-xs truncate max-w-[80px] md:max-w-[100px] lg:max-w-none">
                {user?.fullName || 'User'}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">{user?.role}</p>
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Logout Button */}
            <motion.button
              onClick={logout}
              className="flex items-center justify-center gap-1 px-1.5 sm:px-3 md:px-4 lg:px-5 py-1.5 sm:py-2 md:py-2.5 lg:py-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 active:scale-95 transition-all text-xs sm:text-sm md:text-base lg:text-lg min-h-[44px] md:min-h-[48px] lg:min-h-[52px] min-w-[44px]"
              aria-label="Logout"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Logout"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 flex-shrink-0" />
              <span className="hidden md:inline">Logout</span>
            </motion.button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden w-full">
        {/* Sidebar - Modern Mobile Design - Centered on Mobile */}
        <AnimatePresence>
          {(sidebarOpen || isDesktop) && (
            <motion.aside
              initial={isDesktop ? { x: -380, opacity: 0 } : { scale: 0.8, opacity: 0 }}
              animate={isDesktop ? { x: 0, opacity: 1 } : { scale: 1, opacity: 1 }}
              exit={isDesktop ? { x: -380, opacity: 0 } : { scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 35 }}
              className={`${
                isDesktop
                  ? 'fixed lg:sticky top-[48px] sm:top-[52px] md:top-[56px] lg:top-0 left-0 w-screen sm:w-72 md:w-80 lg:w-80 h-[calc(100vh-48px)] sm:h-[calc(100vh-52px)] md:h-[calc(100vh-56px)] lg:h-auto'
                  : 'fixed inset-0 w-72 max-w-[calc(100vw-24px)] h-fit max-h-[calc(100vh-80px)] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl'
              } bg-gradient-to-b from-white via-white to-gray-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900 border-r dark:border-gray-700 z-40 lg:z-auto flex flex-col overflow-y-auto sm:overflow-hidden -webkit-overflow-scrolling-touch shadow-2xl lg:shadow-none`}
            >
              {/* Scrollable Navigation */}
              <nav className="space-y-0.5 px-2 sm:px-4 md:px-5 py-2 sm:py-5 pt-2 sm:pt-4 flex-1 overflow-y-auto -webkit-overflow-scrolling-touch scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scroll-smooth">
                {navigation.map((item, index) => {
                  if (item.id === 'divider') {
                    return (
                      <div
                        key={index}
                        className="my-1.5 sm:my-3 pt-1 border-t dark:border-gray-700"
                      >
                        <p className="px-3 py-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          📊 Admin Panel
                        </p>
                      </div>
                    )
                  }

                  return (
                    <motion.button
                      key={item.id}
                      onClick={() => handleNavigation(item.path)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-all min-h-[42px] active:scale-95 text-xs sm:text-sm md:text-base lg:text-lg font-medium ${
                        isActive(item.path)
                          ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30 dark:shadow-primary-500/20'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                      }`}
                      initial={{ opacity: 0, x: -30, y: 5 }}
                      animate={{ opacity: 1, x: 0, y: 0 }}
                      transition={{
                        delay: index * 0.06,
                        type: 'spring',
                        stiffness: 400,
                        damping: 30,
                      }}
                      whileHover={{ x: 6, transition: { duration: 0.2 } }}
                      whileTap={{ scale: 0.96 }}
                    >
                      <motion.div
                        animate={
                          isActive(item.path) ? { rotate: 20, scale: 1.3 } : { rotate: 0, scale: 1 }
                        }
                        transition={{ duration: 0.3, type: 'spring', stiffness: 400 }}
                        className="flex-shrink-0 w-5 h-5"
                      >
                        <item.icon className="w-5 h-5" />
                      </motion.div>
                      <span className="flex-1 text-left truncate">{item.name}</span>
                      {isActive(item.path) && (
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
              <div className="px-3 py-2 border-t dark:border-gray-700 flex-shrink-0 bg-gradient-to-t from-white via-white to-transparent dark:from-gray-800 dark:via-gray-800 dark:to-transparent mt-auto safe-area-bottom">
                <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400 text-center">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <p className="font-semibold">🕌 Kanz ul Huda</p>
                    <p className="mt-1.5 text-gray-500 dark:text-gray-500">v1.0.0</p>
                  </motion.div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Modern Backdrop Overlay - Full Screen */}
        <AnimatePresence>
          {sidebarOpen && !isDesktop && (
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-md z-30 lg:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
              initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
              animate={{ opacity: 1, backdropFilter: 'blur(12px)' }}
              exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
              transition={{ duration: 0.3 }}
            />
          )}
        </AnimatePresence>

        {/* Main Content - Mobile Optimized */}
        <motion.main
          className="flex-1 overflow-y-auto -webkit-overflow-scrolling-touch p-2 sm:p-4 md:p-5 lg:p-6 xl:p-8 w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          style={{ height: 'calc(100vh - 48px)', minWidth: 0 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="max-w-full sm:max-w-4xl md:max-w-6xl lg:max-w-7xl xl:max-w-8xl 2xl:max-w-9xl h-full mx-auto">
            {children}
          </div>
        </motion.main>
      </div>
    </div>
  )
}

export default Layout
