import { useState, useEffect, useCallback } from 'react'
import {
  Trash2,
  Edit,
  Plus,
  Search,
  Filter,
  Crown,
  CheckCircle,
  AlertCircle,
  Download,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { apiCall, formatNumber } from '../utils/api'
import { showError, showSuccess } from '../utils/toast'
import AdminFilters from '../components/AdminFilters'
import { BulkOperationsModal } from '../components/BulkOperations'
import { useAdminShortcuts } from '../components/AdminShortcuts'
import { useBulkOperations } from '../hooks/useBulkOperations'

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
  const [selectedUsers, setSelectedUsers] = useState(new Set())
  const [showBulkModal, setShowBulkModal] = useState(false)
  const { exportToCSV } = useBulkOperations()
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    password: '',
    phone: '',
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

  // Admin shortcuts handler
  useAdminShortcuts({
    onBulk: () => {
      if (selectedUsers.size > 0) setShowBulkModal(true)
    },
    onExport: () => {
      exportToCSV(users, 'users_export')
    },
    onRefresh: fetchUsers,
    onNew: () => setShowModal(true),
    onSearch: () => {
      const searchInput = document.querySelector('input[placeholder="Search users..."]')
      searchInput?.focus()
    },
  })

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleCreateUser = async () => {
    // Validate all required fields
    if (!formData.username || !formData.email || !formData.fullName || !formData.password) {
      showError('Please fill in all required fields')
      return
    }

    // Validate phone number format if provided
    if (formData.phone && !/^[\d\s\-\+\(\)]*$/.test(formData.phone)) {
      showError('Please enter a valid phone number')
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
      phone: '',
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
      {/* Bulk Selection Toolbar */}
      {selectedUsers.size > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 p-4 rounded flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-sm font-medium text-blue-900 dark:text-blue-200">
            {selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''} selected
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedUsers(new Set())}
              className="px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              Clear
            </button>
            <button
              onClick={() => setShowBulkModal(true)}
              className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Bulk Actions
            </button>
            <button
              onClick={() => {
                const selectedData = Array.from(selectedUsers).map((id) =>
                  users.find((u) => u._id === id),
                )
                exportToCSV(selectedData, 'selected_users_export')
              }}
              className="px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      )}

      {/* Bulk Operations Modal */}
      {showBulkModal && (
        <BulkOperationsModal
          isOpen={showBulkModal}
          items={Array.from(selectedUsers).map((id) => ({
            _id: id,
            username: users.find((u) => u._id === id)?.username,
          }))}
          onClose={() => {
            setShowBulkModal(false)
          }}
          apiToken={token}
          onSuccess={async () => {
            setSelectedUsers(new Set())
            setShowBulkModal(false)
            fetchUsers()
            showSuccess('Operation completed successfully')
          }}
        />
      )}

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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-2 sm:p-3 md:p-4 space-y-2 sm:space-y-3">
        <div className="grid grid-cols-1 gap-2 sm:gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3">
          <div className="relative col-span-1 sm:col-span-2 lg:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value)
              setPage(1)
            }}
            className="px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
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
            className="px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Users Cards View - All Devices */}
      <div className="space-y-4">
        {users.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center text-gray-500 dark:text-gray-400">
            No users found
          </div>
        ) : (
          users.map((user) => (
            <div
              key={user._id}
              className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 md:gap-5 lg:grid-cols-2 lg:gap-6 relative"
            >
              {/* Checkbox */}
              <div className="absolute -left-6 top-4 w-3 h-3 flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={selectedUsers.has(user._id)}
                  onChange={(e) => {
                    const newSet = new Set(selectedUsers)
                    if (e.target.checked) {
                      newSet.add(user._id)
                    } else {
                      newSet.delete(user._id)
                    }
                    setSelectedUsers(newSet)
                  }}
                  className="w-2 h-2 appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded cursor-pointer checked:bg-primary-600 checked:border-primary-600"
                />
              </div>

              {/* Card 1: Username, Full Name, Email */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
                  User Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">
                      Username
                    </p>
                    <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white break-all">
                      {user.username}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">
                      Full Name
                    </p>
                    <p className="text-sm sm:text-base text-gray-900 dark:text-white break-all">
                      {user.fullName}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">
                      Email
                    </p>
                    <p className="text-sm sm:text-base text-gray-900 dark:text-white break-all">
                      {user.email}
                    </p>
                  </div>

                  {user.phone && (
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">
                        Phone Number
                      </p>
                      <p className="text-sm sm:text-base text-gray-900 dark:text-white break-all">
                        {user.phone}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Card 2: Email Verification, Role, Status, Last Login, Actions */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
                  User Details & Actions
                </h3>
                <div className="space-y-4">
                  {/* Email Verification */}
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2">
                      Email Verification
                    </p>
                    {user.emailVerified ? (
                      <div className="flex items-center gap-1 px-3 py-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs sm:text-sm font-medium w-fit">
                        <CheckCircle className="w-4 h-4" />
                        <span>Verified</span>
                      </div>
                    ) : user.createdByAdmin ? (
                      <div className="flex items-center gap-1 px-3 py-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full text-xs sm:text-sm font-medium w-fit">
                        <AlertCircle className="w-4 h-4" />
                        <span>Pending</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 px-3 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs sm:text-sm font-medium w-fit">
                        <CheckCircle className="w-4 h-4" />
                        <span>Verified</span>
                      </div>
                    )}
                  </div>

                  {/* Role, Status, Last Login */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2">
                        Role
                      </p>
                      {user.isMainAdmin ? (
                        <div className="flex items-center gap-1 px-2 py-2 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-lg text-xs sm:text-sm font-medium">
                          <Crown className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </span>
                        </div>
                      ) : (
                        <select
                          value={user.role}
                          onChange={(e) => handleChangeRole(user._id, e.target.value)}
                          disabled={!isMainAdmin}
                          className={`w-full px-2 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                            !isMainAdmin ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          title={!isMainAdmin ? 'Only main admin can change roles' : ''}
                        >
                          <option value="collector">Collector</option>
                          <option value="admin">Admin</option>
                        </select>
                      )}
                    </div>

                    <div>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2">
                        Status
                      </p>
                      <span
                        className={`block px-2 py-2 rounded-lg text-xs sm:text-sm font-medium text-center ${
                          user.status === 'active'
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                            : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                        }`}
                      >
                        {user.status}
                      </span>
                    </div>

                    <div>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2">
                        Last Login
                      </p>
                      <p className="text-xs sm:text-sm text-gray-900 dark:text-gray-200 text-center px-2 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        {user.lastLogin
                          ? new Date(user.lastLogin).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })
                          : 'Never'}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
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
                      className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg transition-colors ${
                        !isMainAdmin
                          ? 'opacity-50 cursor-not-allowed text-gray-400 dark:text-gray-600 bg-gray-100 dark:bg-gray-700'
                          : user.status === 'active'
                            ? 'text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900'
                            : 'text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900'
                      }`}
                    >
                      <Edit className="w-4 h-4" />
                      <span className="hidden sm:inline">
                        {user.status === 'active' ? 'Deactivate' : 'Activate'}
                      </span>
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user._id)}
                      disabled={!isMainAdmin}
                      title={!isMainAdmin ? 'Only main admin can delete users' : 'Delete'}
                      className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg transition-colors ${
                        !isMainAdmin
                          ? 'opacity-50 cursor-not-allowed text-gray-400 dark:text-gray-600 bg-gray-100 dark:bg-gray-700'
                          : 'text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900'
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 sm:gap-2 flex-wrap">
          {totalPages <= 5 ? (
            // Show all pages if 5 or fewer
            Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-base rounded-lg transition-colors ${
                  page === p
                    ? 'bg-primary-600 dark:bg-primary-700 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600'
                }`}
              >
                {p}
              </button>
            ))
          ) : (
            // Show smart pagination for more pages
            <>
              {/* First page */}
              <button
                onClick={() => setPage(1)}
                className={`px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-base rounded-lg transition-colors ${
                  page === 1
                    ? 'bg-primary-600 dark:bg-primary-700 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600'
                }`}
              >
                1
              </button>

              {/* Previous pages */}
              {page > 3 && (
                <span className="text-gray-500 dark:text-gray-400 text-xs sm:text-base">...</span>
              )}
              {page > 2 && (
                <button
                  onClick={() => setPage(page - 1)}
                  className="px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-base rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600"
                >
                  {page - 1}
                </button>
              )}

              {/* Current page */}
              {page > 1 && page < totalPages && (
                <button className="px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-base rounded-lg bg-primary-600 dark:bg-primary-700 text-white">
                  {page}
                </button>
              )}

              {/* Next pages */}
              {page < totalPages - 1 && (
                <button
                  onClick={() => setPage(page + 1)}
                  className="px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-base rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600"
                >
                  {page + 1}
                </button>
              )}

              {/* Last page indicator */}
              {page < totalPages - 2 && (
                <span className="text-gray-500 dark:text-gray-400 text-xs sm:text-base">...</span>
              )}

              {/* Last page */}
              <button
                onClick={() => setPage(totalPages)}
                className={`px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-base rounded-lg transition-colors ${
                  page === totalPages
                    ? 'bg-primary-600 dark:bg-primary-700 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600'
                }`}
              >
                {totalPages}
              </button>
            </>
          )}
        </div>
      )}

      {/* Create User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Add New User
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="3-20 characters"
                  className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="At least 2 characters"
                  className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {formData.fullName && formData.fullName.trim().length < 2 && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    Full name must be at least 2 characters
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="user@example.com"
                  className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    Please enter a valid email address
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                  Mobile Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1-234-567-8900 or (123) 456-7890"
                  className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Format: +1-234-567-8900 or (123) 456-7890
                </p>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Minimum 8 characters"
                  className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="collector">Collector</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 sm:gap-3 mt-6">
              <button
                onClick={handleCloseModal}
                className="flex-1 px-3 sm:px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateUser}
                className="flex-1 px-3 sm:px-4 py-2 text-sm bg-primary-600 dark:bg-primary-700 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
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
