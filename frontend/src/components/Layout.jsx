import { useState, useEffect } from 'react'
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
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { MdDashboard } from 'react-icons/md'
import { useAuth } from '../context/AuthContext'
import { useIsDesktop } from '../hooks/useMediaQuery'
import ThemeToggle from './ThemeToggle'

const Layout = ({ children, currentPage, setCurrentPage }) => {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isDesktop = useIsDesktop()

  // Close sidebar on desktop by default
  useEffect(() => {
    if (isDesktop) {
      setSidebarOpen(false)
    }
  }, [isDesktop])

  const commonNavigation = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
    { id: 'members', name: 'Members', icon: Users },
    { id: 'submissions', name: 'Submissions', icon: Send },
    { id: 'reports', name: 'Reports', icon: FileText },
    { id: 'personal-reports', name: 'My Reports', icon: FileText },
    { id: 'leaderboard', name: 'Leaderboard', icon: Trophy },
    { id: 'profiles', name: 'Member Profiles', icon: UserCircle },
    { id: 'messaging', name: 'Messages', icon: Send },
    { id: 'settings', name: 'Settings', icon: Settings },
  ]

  const adminNavigation = [
    { id: 'admin-dashboard', name: 'Admin Dashboard', icon: BarChart3 },
    { id: 'admin-users', name: 'Admin: Users', icon: Users },
    { id: 'admin-members', name: 'Admin: Members', icon: Users },
    { id: 'admin-settings', name: 'Admin: Settings', icon: Settings },
  ]

  const navigation =
    user?.role === 'admin'
      ? [...commonNavigation, { id: 'divider', name: '', icon: null }, ...adminNavigation]
      : commonNavigation

  const handleNavigation = (pageId) => {
    setCurrentPage(pageId)
    setSidebarOpen(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 sticky top-0 z-30">
        <div className="px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <motion.button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
              aria-label="Toggle menu"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div animate={{ rotate: sidebarOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
                {sidebarOpen ? (
                  <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                ) : (
                  <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                )}
              </motion.div>
            </motion.button>
            <motion.h1
              className="text-base sm:text-xl font-bold text-primary-600 dark:text-primary-400 flex items-center gap-1 sm:gap-2 truncate"
              whileHover={{ scale: 1.02 }}
            >
              <motion.span
                className="text-xl sm:text-2xl flex-shrink-0"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                🕌
              </motion.span>
              <span className="hidden sm:inline">Kanz ul Huda</span>
            </motion.h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <ThemeToggle />
            <div className="text-right hidden sm:block">
              <p className="font-medium text-gray-800 dark:text-gray-200 text-sm sm:text-base truncate max-w-[120px] sm:max-w-none">
                {user?.fullName}
              </p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 capitalize">
                {user?.role}
              </p>
            </div>
            <motion.button
              onClick={logout}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors text-sm sm:text-base"
              aria-label="Logout"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">Logout</span>
            </motion.button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <AnimatePresence>
          {(sidebarOpen || isDesktop) && (
            <motion.aside
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed lg:sticky top-16 left-0 w-64 bg-white dark:bg-gray-800 border-r dark:border-gray-700 min-h-[calc(100vh-4rem)] p-3 sm:p-4 z-20 lg:translate-x-0"
            >
              <nav className="space-y-2">
                {navigation.map((item, index) => {
                  if (item.id === 'divider') {
                    return (
                      <div key={index} className="my-4 pt-2 border-t dark:border-gray-700">
                        <p className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                          Admin Panel
                        </p>
                      </div>
                    )
                  }

                  return (
                    <motion.button
                      key={item.id}
                      onClick={() => handleNavigation(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        currentPage === item.id
                          ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-medium shadow-sm'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <motion.div
                        animate={currentPage === item.id ? { scale: 1.2 } : { scale: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <item.icon className="w-5 h-5" />
                      </motion.div>
                      {item.name}
                    </motion.button>
                  )
                })}
              </nav>

              {/* Sidebar Footer */}
              <div className="mt-8 pt-8 border-t dark:border-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  <p>Kanz ul Huda</p>
                  <p className="mt-1">v1.0.0</p>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Overlay for mobile */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-50 z-10 lg:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
          )}
        </AnimatePresence>

        {/* Main Content */}
        <motion.main
          className="flex-1 p-3 sm:p-4 md:p-6 w-full lg:ml-0 min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.main>
      </div>
    </div>
  )
}

export default Layout
