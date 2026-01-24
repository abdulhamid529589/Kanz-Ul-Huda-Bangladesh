import { useState } from 'react'
import { Menu, X, Home, Users, FileText, MessageSquare, Settings, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export const MobileNav = () => {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()
  const { logout, user } = useAuth()

  const navigationItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Users, label: 'Members', path: '/members' },
    { icon: FileText, label: 'Reports', path: '/reports' },
    { icon: MessageSquare, label: 'Messaging', path: '/messaging' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ]

  const handleNavigation = (path) => {
    navigate(path)
    setIsOpen(false)
  }

  const handleLogout = () => {
    logout()
    setIsOpen(false)
    navigate('/login')
  }

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-40">
        <div className="flex justify-around">
          {navigationItems.slice(0, 4).map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              className="flex-1 flex flex-col items-center justify-center py-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              title={item.label}
            >
              <item.icon size={24} />
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          ))}

          {/* More Menu */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex-1 flex flex-col items-center justify-center py-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors relative"
            title="More"
          >
            <Menu size={24} />
            <span className="text-xs mt-1">More</span>

            {/* Dropdown Menu */}
            {isOpen && (
              <div className="absolute bottom-full right-0 w-48 bg-white rounded-lg shadow-lg border border-gray-200 mb-2">
                <button
                  onClick={() => handleNavigation('/settings')}
                  className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 border-b"
                >
                  <Settings size={18} />
                  <span>Settings</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50"
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </button>
        </div>
      </nav>

      {/* Desktop Navigation (kept for reference) */}
      <nav className="hidden md:flex bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-6">
            {navigationItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>
    </>
  )
}

export default MobileNav
