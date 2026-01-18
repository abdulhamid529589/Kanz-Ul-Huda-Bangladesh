import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit2, Trash2, Search, Filter, Calendar } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { apiCall, formatNumber, formatTimeAgo } from '../utils/api'
import { showError, showSuccess, confirmAction } from '../utils/toast'

const SubmissionsPage = () => {
  const { token } = useAuth()
  const [submissions, setSubmissions] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterMember, setFilterMember] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  // Form state
  const [formData, setFormData] = useState({
    memberId: '',
    duroodCount: '',
    notes: '',
  })

  // Fetch submissions and members
  const fetchData = useCallback(async () => {
    if (!token) return

    setLoading(true)
    try {
      const [submissionsRes, membersRes] = await Promise.all([
        apiCall('/submissions?limit=100', {}, token),
        apiCall('/members?limit=1000', {}, token),
      ])

      if (submissionsRes.ok) setSubmissions(submissionsRes.data.data || [])
      if (membersRes.ok) setMembers(membersRes.data.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.memberId || !formData.duroodCount) {
      showError('Please fill all required fields')
      return
    }

    const payload = {
      memberId: formData.memberId,
      duroodCount: parseInt(formData.duroodCount),
      notes: formData.notes,
    }

    try {
      let response
      if (editingId) {
        response = await apiCall(
          `/submissions/${editingId}`,
          { method: 'PUT', body: JSON.stringify(payload) },
          token,
        )
      } else {
        response = await apiCall(
          '/submissions',
          { method: 'POST', body: JSON.stringify(payload) },
          token,
        )
      }

      if (response.ok) {
        setFormData({ memberId: '', duroodCount: '', notes: '' })
        setEditingId(null)
        setShowForm(false)
        fetchData()
        showSuccess(editingId ? 'Submission updated successfully!' : 'Submission created successfully!')
      } else {
        showError(response.data.message || 'Error saving submission')
      }
    } catch (error) {
      console.error('Error saving submission:', error)
      showError('Error saving submission. Please try again.')
    }
  }

  // Handle edit
  const handleEdit = (submission) => {
    setFormData({
      memberId: submission.member._id,
      duroodCount: submission.duroodCount,
      notes: submission.notes,
    })
    setEditingId(submission._id)
    setShowForm(true)
  }

  // Handle delete
  const handleDelete = async (id) => {
    const confirmed = await confirmAction('Are you sure you want to delete this submission?')
    if (!confirmed) return

    try {
      const response = await apiCall(`/submissions/${id}`, { method: 'DELETE' }, token)
      if (response.ok) {
        fetchData()
        showSuccess('Submission deleted successfully!')
      } else {
        showError(response.data.message || 'Error deleting submission')
      }
    } catch (error) {
      console.error('Error deleting submission:', error)
      showError('Error deleting submission. Please try again.')
    }
  }

  // Filter submissions
  const filteredSubmissions = submissions.filter((sub) => {
    const memberName = sub.member?.fullName.toLowerCase() || ''
    const matchesSearch = memberName.includes(searchTerm.toLowerCase())
    const matchesMember = !filterMember || sub.member?._id === filterMember
    return matchesSearch && matchesMember
  })

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Submissions
        </h1>
        <button
          onClick={() => {
            setShowForm(!showForm)
            setEditingId(null)
            setFormData({ memberId: '', duroodCount: '', notes: '' })
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 dark:bg-primary-700 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-800 transition-colors w-full sm:w-auto justify-center text-sm sm:text-base"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>New Submission</span>
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
            {editingId ? 'Edit Submission' : 'Create New Submission'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {/* Member Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Member *
                </label>
                <select
                  value={formData.memberId}
                  onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-base min-h-[44px]"
                  required
                >
                  <option value="">Select a member...</option>
                  {members.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.fullName} ({member.phoneNumber})
                    </option>
                  ))}
                </select>
              </div>

              {/* Durood Count */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Durood Count *
                </label>
                <input
                  type="number"
                  value={formData.duroodCount}
                  onChange={(e) => setFormData({ ...formData, duroodCount: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-base min-h-[44px]"
                  placeholder="Enter durood count"
                  min="1"
                  required
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="Add any notes (optional)"
                rows="3"
              />
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
              <button
                type="submit"
                className="px-4 sm:px-6 py-2.5 bg-primary-600 dark:bg-primary-700 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-800 transition-colors min-h-[44px] text-sm sm:text-base"
              >
                {editingId ? 'Update' : 'Create'} Submission
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingId(null)
                  setFormData({ memberId: '', duroodCount: '', notes: '' })
                }}
                className="px-4 sm:px-6 py-2.5 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors min-h-[44px] text-sm sm:text-base"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-4">
        <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by member name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-base min-h-[44px]"
            />
          </div>

          {/* Filter by Member */}
          <div className="flex-1">
            <select
              value={filterMember}
              onChange={(e) => setFilterMember(e.target.value)}
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="">All Members</option>
              {members.map((member) => (
                <option key={member._id} value={member._id}>
                  {member.fullName}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setSearchTerm('')
              setFilterMember('')
            }}
            className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {filteredSubmissions.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No submissions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Durood Count
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Week
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Notes
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.map((submission) => (
                  <tr
                    key={submission._id}
                    className="border-b border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {submission.member?.fullName}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {submission.member?.phoneNumber}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full font-semibold">
                        {formatNumber(submission.duroodCount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {new Date(submission.weekStartDate).toLocaleDateString()} -{' '}
                      {new Date(submission.weekEndDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {formatTimeAgo(submission.submissionDateTime)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {submission.notes ? (
                        <span className="inline-block max-w-xs truncate" title={submission.notes}>
                          {submission.notes}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(submission)}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(submission._id)}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                          title="Delete"
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
        )}

        {/* Stats Footer */}
        <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-t border-gray-300 dark:border-gray-600">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Showing <span className="font-semibold">{filteredSubmissions.length}</span> submissions
            {filteredSubmissions.length > 0 && (
              <span className="ml-4">
                Total Durood:{' '}
                <span className="font-semibold text-primary-600 dark:text-primary-400">
                  {formatNumber(filteredSubmissions.reduce((sum, sub) => sum + sub.duroodCount, 0))}
                </span>
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}

export default SubmissionsPage
