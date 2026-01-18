import { useState, useEffect } from 'react'
import { User, Mail, Phone, Globe, Calendar, TrendingUp, Award } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { apiCall, formatNumber, formatTimeAgo } from '../utils/api'

const MemberProfilesPage = () => {
  const { token } = useAuth()
  const [members, setMembers] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMember, setSelectedMember] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('durood')

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      if (!token) return

      setLoading(true)
      try {
        const [membersRes, submissionsRes] = await Promise.all([
          apiCall('/members?limit=1000', {}, token),
          apiCall('/submissions?limit=500', {}, token),
        ])

        if (membersRes.ok) setMembers(membersRes.data.data || [])
        if (submissionsRes.ok) setSubmissions(submissionsRes.data.data || [])
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [token])

  // Get member stats
  const getMemberStats = (memberId) => {
    const memberSubs = submissions.filter((sub) => sub.member?._id === memberId)
    const totalDurood = memberSubs.reduce((sum, sub) => sum + sub.duroodCount, 0)
    const avgPerSubmission = memberSubs.length > 0 ? Math.round(totalDurood / memberSubs.length) : 0
    const lastSubmission = memberSubs.length > 0 ? memberSubs[0] : null

    return {
      totalDurood,
      submissions: memberSubs.length,
      avgPerSubmission,
      lastSubmission,
      recentSubmissions: memberSubs.slice(0, 5),
    }
  }

  // Filter and sort members
  const filteredMembers = members
    .filter((member) => member.fullName.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      const statsA = getMemberStats(a._id)
      const statsB = getMemberStats(b._id)

      if (sortBy === 'durood') return statsB.totalDurood - statsA.totalDurood
      if (sortBy === 'submissions') return statsB.submissions - statsA.submissions
      if (sortBy === 'name') return a.fullName.localeCompare(b.fullName)
      return 0
    })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner w-12 h-12"></div>
      </div>
    )
  }

  const selectedStats = selectedMember ? getMemberStats(selectedMember._id) : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <User className="w-8 h-8" />
          Member Profiles
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Members List */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col h-full">
            {/* Search and Sort */}
            <div className="p-4 border-b border-gray-300 dark:border-gray-700 space-y-3">
              <input
                type="text"
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option value="durood">Sort by Durood Count</option>
                <option value="submissions">Sort by Submissions</option>
                <option value="name">Sort by Name</option>
              </select>
            </div>

            {/* Members List */}
            <div className="flex-1 overflow-y-auto">
              {filteredMembers.map((member) => {
                const stats = getMemberStats(member._id)
                const isSelected = selectedMember?._id === member._id

                return (
                  <button
                    key={member._id}
                    onClick={() => setSelectedMember(member)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-300 dark:border-gray-700 transition-colors ${
                      isSelected
                        ? 'bg-primary-100 dark:bg-primary-900'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">
                      {member.fullName}
                    </p>
                    <div className="flex gap-2 mt-1 text-xs">
                      <span className="bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 px-2 py-0.5 rounded">
                        {formatNumber(stats.totalDurood)} durood
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {stats.submissions} subs
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Profile Detail */}
        <div className="lg:col-span-2">
          {selectedMember && selectedStats ? (
            <div className="space-y-6">
              {/* Header Card */}
              <div className="bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-700 dark:to-primary-800 rounded-lg shadow-lg p-6 text-white">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{selectedMember.fullName}</h2>
                      <p className="text-primary-100">{selectedMember.country}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white bg-opacity-20 rounded-lg p-3">
                    <p className="text-sm opacity-90">Total Durood</p>
                    <p className="text-3xl font-bold">{formatNumber(selectedStats.totalDurood)}</p>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-lg p-3">
                    <p className="text-sm opacity-90">Submissions</p>
                    <p className="text-3xl font-bold">{selectedStats.submissions}</p>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-lg p-3">
                    <p className="text-sm opacity-90">Average</p>
                    <p className="text-3xl font-bold">{selectedStats.avgPerSubmission}</p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Contact Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {selectedMember.phoneNumber}
                    </span>
                  </div>
                  {selectedMember.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <span className="text-gray-700 dark:text-gray-300">
                        {selectedMember.email}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {selectedMember.country}
                    </span>
                  </div>
                  {selectedMember.city && (
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <span className="text-gray-700 dark:text-gray-300">
                        {selectedMember.city}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300">
                      Member since {new Date(selectedMember.memberSince).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Statistics
                </h3>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Durood per Submission
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedStats.avgPerSubmission}
                    </p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Total Submissions
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedStats.submissions}
                    </p>
                  </div>
                </div>

                {selectedStats.lastSubmission && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Last Submission</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatTimeAgo(selectedStats.lastSubmission.submissionDateTime)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {formatNumber(selectedStats.lastSubmission.duroodCount)} durood
                    </p>
                  </div>
                )}
              </div>

              {/* Recent Submissions */}
              {selectedStats.recentSubmissions.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Recent Submissions
                  </h3>

                  <div className="space-y-3">
                    {selectedStats.recentSubmissions.map((sub) => (
                      <div
                        key={sub._id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {new Date(sub.weekStartDate).toLocaleDateString()} -{' '}
                            {new Date(sub.weekEndDate).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {formatTimeAgo(sub.submissionDateTime)}
                          </p>
                        </div>
                        <span className="inline-block px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full font-semibold">
                          {formatNumber(sub.duroodCount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
              <User className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Select a member to view their profile
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MemberProfilesPage
