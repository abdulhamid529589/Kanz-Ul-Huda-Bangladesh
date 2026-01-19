import { useState, useEffect, useCallback } from 'react'
import { Trash2, Edit, Plus, Search, Upload } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { apiCall } from '../utils/api'
import { showError, showSuccess } from '../utils/toast'

const AdminMemberManagementPage = () => {
  const { token } = useAuth()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [showBulkImportModal, setShowBulkImportModal] = useState(false)
  const [editingMember, setEditingMember] = useState(null)
  const [bulkImportText, setBulkImportText] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    memberNo: '',
    status: 'active',
  })

  const fetchMembers = useCallback(async () => {
    if (!token) return

    setLoading(true)
    try {
      const params = new URLSearchParams({
        page,
        limit: 20,
        search: search || undefined,
        status: statusFilter || undefined,
      })

      const res = await apiCall(`/admin/members?${params.toString()}`, {}, token)

      if (res.ok) {
        setMembers(res.data.data.members || [])
        setTotalPages(res.data.data.pagination.pages)
      }
    } catch (error) {
      console.error('Error fetching members:', error)
      showError('Failed to load members')
    } finally {
      setLoading(false)
    }
  }, [token, page, search, statusFilter])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  const handleCreateMember = async () => {
    if (!formData.name || !formData.memberNo) {
      showError('Please fill in all required fields')
      return
    }

    try {
      const res = await apiCall(
        '/admin/members',
        { method: 'POST', body: JSON.stringify(formData) },
        token,
      )

      if (res.ok) {
        showSuccess('Member created successfully')
        setShowModal(false)
        setFormData({
          name: '',
          memberNo: '',
          status: 'active',
        })
        fetchMembers()
      }
    } catch (error) {
      showError(error.message || 'Failed to create member')
    }
  }

  const handleUpdateMember = async () => {
    if (!editingMember) return

    try {
      const res = await apiCall(
        `/admin/members/${editingMember._id}`,
        { method: 'PUT', body: JSON.stringify(formData) },
        token,
      )

      if (res.ok) {
        showSuccess('Member updated successfully')
        setShowModal(false)
        setEditingMember(null)
        setFormData({
          name: '',
          memberNo: '',
          status: 'active',
        })
        fetchMembers()
      }
    } catch (error) {
      showError(error.message || 'Failed to update member')
    }
  }

  const handleToggleStatus = async (memberId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'

    try {
      const res = await apiCall(
        `/admin/members/${memberId}`,
        { method: 'PUT', body: JSON.stringify({ status: newStatus }) },
        token,
      )

      if (res.ok) {
        showSuccess(`Member ${newStatus === 'active' ? 'activated' : 'deactivated'}`)
        fetchMembers()
      }
    } catch (error) {
      showError(error.message || 'Failed to update member')
    }
  }

  const handleDeleteMember = async (memberId) => {
    if (!confirm('Are you sure you want to delete this member?')) return

    try {
      const res = await apiCall(`/admin/members/${memberId}`, { method: 'DELETE' }, token)

      if (res.ok) {
        showSuccess('Member deleted successfully')
        fetchMembers()
      }
    } catch (error) {
      showError(error.message || 'Failed to delete member')
    }
  }

  const handleBulkImport = async () => {
    if (!bulkImportText.trim()) {
      showError('Please paste member data')
      return
    }

    try {
      const lines = bulkImportText
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => {
          const [name, memberNo] = line.split('\t').map((s) => s.trim())
          return { name, memberNo, status: 'active' }
        })

      if (lines.length === 0) {
        showError('No valid member data found. Use format: Name\\tMember No')
        return
      }

      const res = await apiCall(
        '/admin/members/bulk-import',
        { method: 'POST', body: JSON.stringify({ members: lines }) },
        token,
      )

      if (res.ok) {
        const result = res.data.data
        showSuccess(
          `Imported ${result.successful || 0}/${lines.length} members. ${result.failed || 0} failed.`,
        )
        setBulkImportText('')
        setShowBulkImportModal(false)
        fetchMembers()
      }
    } catch (error) {
      showError(error.message || 'Failed to bulk import members')
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
    <div className="space-y-6 px-3 sm:px-4 md:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Member Management
        </h1>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={() => setShowBulkImportModal(true)}
            className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-xs sm:text-sm font-medium"
          >
            <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Bulk Import</span>
            <span className="sm:hidden">Import</span>
          </button>
          <button
            onClick={() => {
              setEditingMember(null)
              setFormData({
                name: '',
                memberNo: '',
                status: 'active',
              })
              setShowModal(true)
            }}
            className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-primary-600 dark:bg-primary-700 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors text-xs sm:text-sm font-medium"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            Add Member
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-4 space-y-3 sm:space-y-0 px-3 sm:px-4">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or member number..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="w-full pl-9 sm:pl-10 px-3 sm:px-4 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden px-3 sm:px-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Name
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Member No
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Submissions
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Total Durood
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {members.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 text-center text-gray-500 dark:text-gray-400 text-sm"
                  >
                    No members found
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr
                    key={member._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 font-medium text-gray-900 dark:text-white text-sm">
                      {member.name}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {member.memberNo}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {member.submissionCount || 0}
                    </td>
                    <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 font-semibold text-green-600 dark:text-green-400 text-xs sm:text-sm">
                      {member.totalDurood || 0}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          member.status === 'active'
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                            : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                        }`}
                      >
                        {member.status}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-gray-600 dark:text-gray-300 text-xs sm:text-sm">
                      {new Date(member.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingMember(member)
                            setFormData({
                              name: member.name,
                              memberNo: member.memberNo,
                              status: member.status,
                            })
                            setShowModal(true)
                          }}
                          title="Edit"
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(member._id, member.status)}
                          title={member.status === 'active' ? 'Deactivate' : 'Activate'}
                          className={`p-2 rounded-lg transition-colors ${
                            member.status === 'active'
                              ? 'text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900'
                              : 'text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900'
                          }`}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteMember(member._id)}
                          title="Delete"
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-colors"
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
        <div className="flex items-center justify-center gap-1 sm:gap-2 flex-wrap px-3 sm:px-0">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm rounded-lg transition-colors ${
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

      {/* Create/Edit Member Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {editingMember ? 'Edit Member' : 'Add New Member'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Member Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Member Number
                </label>
                <input
                  type="text"
                  value={formData.memberNo}
                  onChange={(e) => setFormData({ ...formData, memberNo: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false)
                  setEditingMember(null)
                  setFormData({
                    name: '',
                    memberNo: '',
                    status: 'active',
                  })
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingMember ? handleUpdateMember : handleCreateMember}
                className="flex-1 px-4 py-2 bg-primary-600 dark:bg-primary-700 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
              >
                {editingMember ? 'Update Member' : 'Add Member'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showBulkImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Bulk Import Members
            </h2>

            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Paste member data in tab-separated format:
                <br />
                <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  Name Tab MemberNo
                </code>
              </p>

              <textarea
                value={bulkImportText}
                onChange={(e) => setBulkImportText(e.target.value)}
                placeholder="John Doe	001&#10;Jane Smith	002&#10;..."
                rows="8"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowBulkImportModal(false)
                  setBulkImportText('')
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkImport}
                className="flex-1 px-4 py-2 bg-primary-600 dark:bg-primary-700 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminMemberManagementPage
