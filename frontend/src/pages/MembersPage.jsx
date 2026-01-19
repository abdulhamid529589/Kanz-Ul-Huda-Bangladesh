import { useState, useEffect, useCallback } from 'react'
import { Search, Plus, Eye, Edit, Trash2, X, Phone, MapPin, User } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { apiCall } from '../utils/api'
import { showError, showSuccess, confirmAction } from '../utils/toast'
import { useIsMobile } from '../hooks/useMediaQuery'

const MembersPage = () => {
  const { token, user } = useAuth()
  const isMobile = useIsMobile()
  const [members, setMembers] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCountry, setFilterCountry] = useState('')
  const [filterCreatedBy, setFilterCreatedBy] = useState('')
  const [modal, setModal] = useState({ type: null, member: null })
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    city: '',
    country: '',
    status: 'active',
  })
  const [formErrors, setFormErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [deleteError, setDeleteError] = useState('')

  const fetchMembers = useCallback(async () => {
    if (!token) return

    setLoading(true)
    const params = new URLSearchParams()
    if (searchTerm) params.append('search', searchTerm)
    if (filterStatus && filterStatus !== 'all') params.append('status', filterStatus)
    if (filterCountry) params.append('country', filterCountry)
    if (filterCreatedBy) params.append('createdBy', filterCreatedBy)

    const { ok, data } = await apiCall(`/members?${params.toString()}`, {}, token)
    if (ok) {
      setMembers(data.data)
    }
    setLoading(false)
  }, [searchTerm, filterStatus, filterCountry, filterCreatedBy, token])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchMembers()
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [fetchMembers])

  // Fetch users for "Created By" filter
  useEffect(() => {
    const fetchUsers = async () => {
      if (!token) return
      const { ok, data } = await apiCall('/users', {}, token)
      if (ok) {
        setUsers(data.data || [])
      }
    }
    fetchUsers()
  }, [token])

  const validateForm = () => {
    const errors = {}
    if (!formData.fullName.trim()) errors.fullName = 'Name is required'
    if (!formData.phoneNumber.trim()) errors.phoneNumber = 'Phone number is required'
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format'
    }
    if (!formData.country) errors.country = 'Country is required'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleAddMember = () => {
    setFormData({
      fullName: '',
      phoneNumber: '',
      email: '',
      city: '',
      country: '',
      facebookUrl: '',
      status: 'active',
    })
    setFormErrors({})
    setModal({ type: 'add', member: null })
  }

  const handleViewMember = (member) => {
    setFormData(member)
    setModal({ type: 'view', member })
  }

  const handleEditMember = (member) => {
    setFormData(member)
    setFormErrors({})
    setModal({ type: 'edit', member })
  }

  const handleDeleteMember = async (member) => {
    // Check if current user created this member
    const creatorId = member.createdBy?._id || member.createdBy
    const currentUserId = user?._id

    if (creatorId !== currentUserId) {
      showError('You can only delete members that you created.')
      return
    }

    const confirmed = await confirmAction('Are you sure you want to delete this member?')
    if (!confirmed) return

    setDeletingId(member._id)
    setDeleteError('')

    const { ok, data } = await apiCall(`/members/${member._id}`, { method: 'DELETE' }, token)

    if (ok) {
      setMembers(members.filter((m) => m._id !== member._id))
      setDeletingId(null)
      showSuccess('Member deleted successfully!')
    } else {
      showError(data?.message || 'Failed to delete member. Please try again.')
      setDeletingId(null)
    }
  }
  // Check if current user created this member
  const canDeleteMember = (member) => {
    const creatorId = member.createdBy?._id || member.createdBy
    const currentUserId = user?._id
    return creatorId === currentUserId
  }
  const handleSubmitForm = async () => {
    if (!validateForm()) return

    setSubmitting(true)
    const endpoint = modal.type === 'add' ? '/members' : `/members/${modal.member._id}`
    const method = modal.type === 'add' ? 'POST' : 'PUT'

    const { ok } = await apiCall(endpoint, { method, body: JSON.stringify(formData) }, token)
    setSubmitting(false)

    if (ok) {
      setModal({ type: null, member: null })
      fetchMembers()
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const closeModal = () => {
    setModal({ type: null, member: null })
    setFormErrors({})
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
            Members Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mt-1">
            Total: {members.length} members
          </p>
        </div>
        <button
          onClick={handleAddMember}
          className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base">Add Member</span>
        </button>
      </div>

      {/* Error Message */}
      {deleteError && (
        <div className="p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-800 dark:text-red-200 rounded-lg flex items-start gap-3">
          <span className="text-lg">⚠️</span>
          <div>
            <p className="font-medium">Delete Failed</p>
            <p className="text-sm mt-1">{deleteError}</p>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="card dark:bg-gray-800 px-3 sm:px-4 md:px-6">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-9 sm:pl-10 text-xs sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 w-full"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field flex-1 min-w-[110px] text-xs sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              value={filterCountry}
              onChange={(e) => setFilterCountry(e.target.value)}
              className="input-field flex-1 min-w-[120px] text-xs sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">All Countries</option>
              <option value="Bangladesh">Bangladesh</option>
              <option value="UAE">UAE</option>
              <option value="UK">UK</option>
              <option value="USA">USA</option>
              <option value="Pakistan">Pakistan</option>
            </select>
            <select
              value={filterCreatedBy}
              onChange={(e) => setFilterCreatedBy(e.target.value)}
              className="input-field flex-1 min-w-[130px] text-xs sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">All Creators</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.fullName || u.username}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="card dark:bg-gray-800">
        {loading ? (
          <div className="text-center py-12">
            <div className="spinner w-12 h-12 mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-4">Loading members...</p>
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">No members found</p>
            {searchTerm && (
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                Try a different search term
              </p>
            )}
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {members.map((member) => (
                <div
                  key={member._id}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-base mb-1">
                        {member.fullName}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <Phone className="w-4 h-4" />
                        <span>{member.phoneNumber}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <MapPin className="w-4 h-4" />
                        <span>
                          {member.city ? `${member.city}, ` : ''}
                          {member.country}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`badge ${member.status === 'active' ? 'badge-success' : 'badge-danger'}`}
                    >
                      {member.status}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Created By:</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {member.createdBy?.fullName || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Lifetime Durood:</span>
                      <span className="text-gray-900 dark:text-white font-bold">
                        {member.totalLifetimeDurood?.toLocaleString() || 0}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleViewMember(member)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    <button
                      onClick={() => handleEditMember(member)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-800 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteMember(member)}
                      disabled={deletingId === member._id || !canDeleteMember(member)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Phone
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Location
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Created By
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Lifetime Durood
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-700">
                  {members.map((member) => (
                    <tr key={member._id} className="table-row dark:hover:bg-gray-700">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {member.fullName}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {member.phoneNumber}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {member.city ? `${member.city}, ` : ''}
                        {member.country}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        <div className="text-sm">{member.createdBy?.fullName || 'Unknown'}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          @{member.createdBy?.username || 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={member.status === 'active' ? 'badge-success' : 'badge-danger'}
                        >
                          {member.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {member.totalLifetimeDurood?.toLocaleString() || 0}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewMember(member)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors p-1"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditMember(member)}
                            className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 transition-colors p-1"
                            title="Edit Member"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMember(member)}
                            disabled={deletingId === member._id || !canDeleteMember(member)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors p-1 disabled:opacity-30 disabled:cursor-not-allowed"
                            title={
                              canDeleteMember(member)
                                ? 'Delete Member'
                                : 'You can only delete members you created'
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {modal.type && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full max-h-[90vh] my-auto overflow-y-auto">
            <div className="flex justify-between items-center p-4 sm:p-6 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">
                {modal.type === 'view'
                  ? 'View Member'
                  : modal.type === 'edit'
                    ? 'Edit Member'
                    : 'Add Member'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  disabled={modal.type === 'view'}
                  className={`input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${
                    formErrors.fullName ? 'border-red-500' : ''
                  }`}
                  placeholder="Enter full name"
                />
                {formErrors.fullName && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.fullName}</p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  disabled={modal.type === 'view'}
                  className={`input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${
                    formErrors.phoneNumber ? 'border-red-500' : ''
                  }`}
                  placeholder="e.g., +1-234-567-8900 or (123) 456-7890"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Format: +1-234-567-8900 or (123) 456-7890
                </p>
                {formErrors.phoneNumber && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.phoneNumber}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={modal.type === 'view'}
                  className={`input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${
                    formErrors.email ? 'border-red-500' : ''
                  }`}
                  placeholder="Enter email"
                />
                {formErrors.email && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
                )}
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  disabled={modal.type === 'view'}
                  className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                  placeholder="Enter city"
                />
              </div>

              {/* Country */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Country *
                </label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  disabled={modal.type === 'view'}
                  className={`input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    formErrors.country ? 'border-red-500' : ''
                  }`}
                >
                  <option value="">Select country</option>
                  <option value="Bangladesh">Bangladesh</option>
                  <option value="UAE">UAE</option>
                  <option value="UK">UK</option>
                  <option value="USA">USA</option>
                  <option value="Pakistan">Pakistan</option>
                  <option value="India">India</option>
                  <option value="Canada">Canada</option>
                  <option value="Australia">Australia</option>
                </select>
                {formErrors.country && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.country}</p>
                )}
              </div>

              {/* Facebook URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Facebook URL (Optional)
                </label>
                <input
                  type="url"
                  name="facebookUrl"
                  value={formData.facebookUrl}
                  onChange={handleInputChange}
                  disabled={modal.type === 'view'}
                  className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                  placeholder="https://facebook.com/yourprofile"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Format: https://facebook.com/username or https://facebook.com/profile.php?id=...
                </p>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  disabled={modal.type === 'view'}
                  className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Created By (View Only) */}
              {modal.type === 'view' && formData.createdBy && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Created By
                  </label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border dark:border-gray-600">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formData.createdBy.fullName}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      @{formData.createdBy.username}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex gap-2 sm:gap-3 p-4 sm:p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-700 sticky bottom-0">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors font-medium"
              >
                {modal.type === 'view' ? 'Close' : 'Cancel'}
              </button>
              {modal.type !== 'view' && (
                <button
                  onClick={handleSubmitForm}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Saving...' : modal.type === 'edit' ? 'Update' : 'Add'} Member
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MembersPage
