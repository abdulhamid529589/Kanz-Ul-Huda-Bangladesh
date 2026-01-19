import { useState, useEffect, useCallback } from 'react'
import { Trash2, Edit, Plus, Search, Filter, Crown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { apiCall, formatNumber } from '../utils/api'
import { showError, showSuccess } from '../utils/toast'

const AdminUserManagementPage = () => {
  const { token, isMainAdmin, user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    password: '',
    role: 'collector',
  })

  const fetchUsers = useCallback(async () => {
    if (!token) {
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('page', page)
      params.append('limit', 20)
      if (search) params.append('search', search)
      if (roleFilter) params.append('role', roleFilter)
      if (statusFilter) params.append('status', statusFilter)

      const res = await apiCall(`/admin/users?${params.toString()}`, {}, token)

      if (res.ok) {
        const usersData = res.data.data.users || []
        const pagesData = res.data.data.pagination?.pages || 1
        setUsers(usersData)
        setTotalPages(pagesData)
      } else {
        showError(`Failed to load users: ${res.data?.message || 'Unknown error'}`)
      }
    } catch (error) {
      showError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [token, page, search, roleFilter, statusFilter])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleCreateUser = async () => {
    // Validate all required fields
    if (!formData.username || !formData.email || !formData.fullName || !formData.password) {
      showError('Please fill in all required fields')
      return
    }

    // Validate username format (alphanumeric and underscores only)
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(formData.username)) {
      showError('Username must be 3-20 characters, alphanumeric and underscores only')
      return
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      showError('Please enter a valid email address')
      return
    }

    // Validate password length
    if (formData.password.length < 8) {
      showError('Password must be at least 8 characters')
      return
    }

    // Validate full name (at least 2 characters)
    if (formData.fullName.trim().length < 2) {
      showError('Full name must be at least 2 characters')
      return
    }

    try {
      const res = await apiCall(
        '/admin/users',
        {
          method: 'POST',
          body: JSON.stringify(formData),
        },
        token,
      )

      if (res.ok) {
        showSuccess('User created successfully')
        setShowModal(false)
        setFormData({
          username: '',
          email: '',
          fullName: '',
          password: '',
          role: 'collector',
        })
        fetchUsers()
      } else {
        const errorMessage = res.data?.message || res.data?.data?.message || 'Failed to create user'
        showError(errorMessage)
      }
    } catch (error) {
      showError(error.message || 'Failed to create user')
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    // Reset form data when closing modal
    setFormData({
      username: '',
      email: '',
      fullName: '',
      password: '',
      role: 'collector',
    })
    setEditingUser(null)
  }

  const handleChangeRole = async (userId, newRole) => {
    if (!isMainAdmin) {
      showError('Only the main admin can change user roles')
      return
    }

    try {
      const res = await apiCall(
        `/admin/users/${userId}`,
        {
          method: 'PUT',
          body: JSON.stringify({ role: newRole }),
        },
        token,
      )

      if (res.ok) {
        showSuccess(`User role changed to ${newRole}`)
        fetchUsers()
      } else {
        showError(res.data?.message || 'Failed to change user role')
      }
    } catch (error) {
      showError(error.message || 'Failed to change user role')
    }
  }

  const handleToggleStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'

    try {
      const res = await apiCall(
        `/admin/users/${userId}`,
        {
          method: 'PUT',
          body: JSON.stringify({ status: newStatus }),
        },
        token,
      )

      if (res.ok) {
        showSuccess(`User ${newStatus === 'active' ? 'activated' : 'deactivated'}`)
        fetchUsers()
      } else {
        showError(res.data?.message || 'Failed to update user')
      }
    } catch (error) {
      showError(error.message || 'Failed to update user')
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      const res = await apiCall(
        `/admin/users/${userId}`,
        {
          method: 'DELETE',
        },
        token,
      )

      if (res.ok) {
        showSuccess('User deleted successfully')
        fetchUsers()
      } else {
        showError(res.data?.message || 'Failed to delete user')
      }
    } catch (error) {
      showError(error.message || 'Failed to delete user')
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 px-3 sm:px-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          User Management
        </h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-primary-600 dark:bg-primary-700 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors text-xs sm:text-sm font-medium w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline">Add New User</span>
          <span className="sm:hidden">Add User</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-4 space-y-3 sm:space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by username, email, or name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="w-full pl-10 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value)
              setPage(1)
            }}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="collector">Collector</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
              <tr>
                <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  Username
                </th>
                <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  Full Name
                </th>
                <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  Email
                </th>
                <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  Role
                </th>
                <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  Status
                </th>
                <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  Last Login
                </th>
                <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {users.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 font-medium text-gray-900 dark:text-white text-sm">
                      {user.username}
                    </td>
                    <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-gray-600 dark:text-gray-300 text-sm">
                      {user.fullName}
                    </td>
                    <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-gray-600 dark:text-gray-300 text-xs sm:text-sm">
                      {user.email}
                    </td>
                    <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4">
                      <div className="flex items-center gap-2">
                        {user.isMainAdmin ? (
                          <div className="flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm font-medium">
                            <Crown className="w-4 h-4" />
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </div>
                        ) : (
                          <select
                            value={user.role}
                            onChange={(e) => handleChangeRole(user._id, e.target.value)}
                            disabled={!isMainAdmin}
                            className={`px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm ${
                              !isMainAdmin ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            title={!isMainAdmin ? 'Only main admin can change roles' : ''}
                          >
                            <option value="collector">Collector</option>
                            <option value="admin">Admin</option>
                          </select>
                        )}
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4">
                      <span
                        className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                          user.status === 'active'
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                            : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-gray-600 dark:text-gray-300 text-xs sm:text-sm whitespace-nowrap">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleStatus(user._id, user.status)}
                          disabled={!isMainAdmin}
                          title={
                            !isMainAdmin
                              ? 'Only main admin can edit users'
                              : user.status === 'active'
                                ? 'Deactivate'
                                : 'Activate'
                          }
                          className={`p-2 rounded-lg transition-colors ${
                            !isMainAdmin
                              ? 'opacity-50 cursor-not-allowed text-gray-400 dark:text-gray-600'
                              : user.status === 'active'
                                ? 'text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900'
                                : 'text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900'
                          }`}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user._id)}
                          disabled={!isMainAdmin}
                          title={!isMainAdmin ? 'Only main admin can delete users' : 'Delete'}
                          className={`p-2 rounded-lg transition-colors ${
                            !isMainAdmin
                              ? 'opacity-50 cursor-not-allowed text-gray-400 dark:text-gray-600'
                              : 'text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900'
                          }`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                page === p
                  ? 'bg-primary-600 dark:bg-primary-700 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Create User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Add New User</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="3-20 characters, alphanumeric and underscores"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {formData.username && !/^[a-zA-Z0-9_]{3,20}$/.test(formData.username) && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {formData.username.length < 3
                      ? 'Minimum 3 characters'
                      : formData.username.length > 20
                        ? 'Maximum 20 characters'
                        : 'Only alphanumeric and underscores allowed'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="At least 2 characters"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {formData.fullName && formData.fullName.trim().length < 2 && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    Full name must be at least 2 characters
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="user@example.com"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    Please enter a valid email address
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Minimum 8 characters"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {formData.password && (
                  <div className="mt-1 space-y-1">
                    <div
                      className={`text-xs ${formData.password.length >= 8 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                    >
                      {formData.password.length >= 8 ? '✓' : '✗'} {formData.password.length} / 8
                      characters
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="collector">Collector</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCloseModal}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateUser}
                className="flex-1 px-4 py-2 bg-primary-600 dark:bg-primary-700 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
              >
                Create User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminUserManagementPage
