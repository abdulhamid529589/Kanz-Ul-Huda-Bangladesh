import { useState, useEffect, useCallback } from 'react'
import { Trophy, TrendingUp, Award, Zap } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { apiCall, formatNumber } from '../utils/api'

const LeaderboardPage = () => {
  const { token } = useAuth()
  const [members, setMembers] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState('alltime')

  const fetchData = useCallback(async () => {
    if (!token) return

    setLoading(true)
    try {
      const [submissionsRes, membersRes] = await Promise.all([
        apiCall('/submissions?limit=500', {}, token),
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

  // Calculate rankings based on timeframe
  const getLeaderboardData = () => {
    const now = new Date()
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)

    let filteredSubmissions = submissions

    if (timeframe === 'month') {
      filteredSubmissions = submissions.filter(
        (sub) => new Date(sub.submissionDateTime) >= oneMonthAgo,
      )
    } else if (timeframe === 'quarter') {
      filteredSubmissions = submissions.filter(
        (sub) => new Date(sub.submissionDateTime) >= threeMonthsAgo,
      )
    } else if (timeframe === 'year') {
      filteredSubmissions = submissions.filter(
        (sub) => new Date(sub.submissionDateTime) >= oneYearAgo,
      )
    }

    const stats = members
      .map((member) => {
        const memberSubs = filteredSubmissions.filter((sub) => sub.member?._id === member._id)
        const totalDurood = memberSubs.reduce((sum, sub) => sum + sub.duroodCount, 0)
        return {
          id: member._id,
          name: member.fullName,
          country: member.country,
          duroodCount: totalDurood,
          submissions: memberSubs.length,
          avgPerSubmission: memberSubs.length > 0 ? Math.round(totalDurood / memberSubs.length) : 0,
          lastSubmission: memberSubs.length > 0 ? memberSubs[0].submissionDateTime : null,
        }
      })
      .filter((m) => m.duroodCount > 0)
      .sort((a, b) => b.duroodCount - a.duroodCount)

    return stats
  }

  const leaderboard = getLeaderboardData()

  // Get medal icon
  const getMedalIcon = (rank) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return null
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Trophy className="w-8 h-8 text-yellow-500" />
          Leaderboard
        </h1>
      </div>

      {/* Timeframe Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setTimeframe('month')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              timeframe === 'month'
                ? 'bg-primary-600 dark:bg-primary-700 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setTimeframe('quarter')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              timeframe === 'quarter'
                ? 'bg-primary-600 dark:bg-primary-700 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            This Quarter
          </button>
          <button
            onClick={() => setTimeframe('year')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              timeframe === 'year'
                ? 'bg-primary-600 dark:bg-primary-700 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            This Year
          </button>
          <button
            onClick={() => setTimeframe('alltime')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              timeframe === 'alltime'
                ? 'bg-primary-600 dark:bg-primary-700 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Top 3 Featured */}
      {leaderboard.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {leaderboard.slice(0, 3).map((member, index) => (
            <div
              key={member.id}
              className={`rounded-lg shadow-lg p-6 text-white ${
                index === 0
                  ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 md:row-span-2 md:col-span-1 flex flex-col justify-between'
                  : index === 1
                  ? 'bg-gradient-to-br from-gray-400 to-gray-600'
                  : 'bg-gradient-to-br from-orange-400 to-orange-600'
              }`}
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm opacity-90">#{index + 1}</p>
                    <p className="text-2xl font-bold">
                      {getMedalIcon(index + 1) || `#${index + 1}`}
                    </p>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                <p className="text-sm opacity-90">{member.country}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-white border-opacity-30">
                <p className="text-4xl font-bold">{formatNumber(member.duroodCount)}</p>
                <p className="text-sm opacity-90">Total Durood</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full Leaderboard Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-300 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {leaderboard.length} Members
          </h2>
        </div>

        {leaderboard.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No submissions in this timeframe</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Country
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                    Total Durood
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                    Submissions
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                    Average
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">
                    Badge
                  </th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((member, index) => {
                  const medal = getMedalIcon(index + 1)
                  return (
                    <tr
                      key={member.id}
                      className={`border-t border-gray-300 dark:border-gray-700 transition-colors ${
                        index < 3
                          ? 'bg-yellow-50 dark:bg-yellow-900/10 hover:bg-yellow-100 dark:hover:bg-yellow-900/20'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block w-10 h-10 flex items-center justify-center rounded-full font-bold text-white ${
                            index === 0
                              ? 'bg-yellow-500'
                              : index === 1
                              ? 'bg-gray-400'
                              : index === 2
                              ? 'bg-orange-500'
                              : 'bg-gray-400'
                          }`}
                        >
                          {medal || index + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900 dark:text-white">{member.name}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                        {member.country}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-block px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full font-bold">
                          {formatNumber(member.duroodCount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-gray-600 dark:text-gray-300">
                        {member.submissions}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-600 dark:text-gray-300 font-medium">
                        {formatNumber(member.avgPerSubmission)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {index === 0 && (
                          <span className="inline-block text-2xl" title="1st Place - Golden Star">
                            ⭐
                          </span>
                        )}
                        {index === 1 && (
                          <span className="inline-block text-2xl" title="2nd Place - Silver Star">
                            ⭐
                          </span>
                        )}
                        {index === 2 && (
                          <span className="inline-block text-2xl" title="3rd Place - Bronze Star">
                            ⭐
                          </span>
                        )}
                        {member.duroodCount >= 1000 && index > 2 && (
                          <span className="inline-block text-2xl" title="1000+ Durood Achievement">
                            🎖️
                          </span>
                        )}
                        {member.submissions >= 50 && index > 2 && (
                          <span className="inline-block text-2xl" title="50+ Submissions">
                            🏆
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Achievements Legend */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Achievements</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex gap-3 items-start">
            <span className="text-3xl">🥇</span>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">1st Place</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Highest durood count</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="text-3xl">🥈</span>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">2nd Place</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Second highest</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="text-3xl">🥉</span>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">3rd Place</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Third highest</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="text-3xl">🎖️</span>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">1000+ Achievement</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Reached 1000 durood</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="text-3xl">🏆</span>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">50+ Submissions</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">50+ total submissions</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="text-3xl">⭐</span>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Top 3 Star</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">In top 3 ranking</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LeaderboardPage
