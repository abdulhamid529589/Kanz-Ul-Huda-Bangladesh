import { useState, useEffect, useCallback, useMemo } from 'react'
import { Trophy, TrendingUp, Award, Zap } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { apiCall, formatNumber } from '../utils/api'
import { useCache } from '../hooks/useCache'

const LeaderboardPage = () => {
  const { token } = useAuth()
  const { get: getCached, set: setCached } = useCache()
  const [members, setMembers] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState('alltime')

  const fetchData = useCallback(async () => {
    if (!token) return

    const cacheKey = `leaderboard_${timeframe}`
    const cached = getCached(cacheKey)

    if (cached) {
      setMembers(cached.members)
      setSubmissions(cached.submissions)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const [submissionsRes, membersRes] = await Promise.all([
        apiCall('/submissions?limit=500', {}, token),
        apiCall('/members?limit=1000', {}, token),
      ])

      if (submissionsRes.ok) setSubmissions(submissionsRes.data.data || [])
      if (membersRes.ok) {
        setMembers(membersRes.data.data || [])
        setCached(cacheKey, {
          submissions: submissionsRes.data.data || [],
          members: membersRes.data.data || [],
        })
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [token, timeframe, getCached, setCached])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Memoized leaderboard calculation - O(n) only when data changes
  const leaderboard = useMemo(() => {
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

    return members
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
  }, [members, submissions, timeframe])

  // Get medal icon
  const getMedalIcon = (rank) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 mx-auto">
        <div className="spinner w-8 xs:w-10 sm:w-12 h-8 xs:h-10 sm:h-12"></div>
      </div>
    )
  }

  return (
    <div className="space-y-2 xs:space-y-3 sm:space-y-4 md:space-y-6 px-2 xs:px-3 sm:px-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl xs:text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-1.5 xs:gap-2 min-w-0">
          <Trophy className="w-5 xs:w-6 sm:w-8 h-5 xs:h-6 sm:h-8 text-yellow-500 flex-shrink-0" />
          <span className="truncate">Leaderboard</span>
        </h1>
      </div>

      {/* Timeframe Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-2 xs:p-2.5 sm:p-3 md:p-4">
        <div className="flex flex-wrap gap-1 xs:gap-1.5 sm:gap-2">
          <button
            onClick={() => setTimeframe('month')}
            className={`px-1.5 xs:px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-lg transition-colors text-xs sm:text-sm font-medium whitespace-nowrap ${
              timeframe === 'month'
                ? 'bg-primary-600 dark:bg-primary-700 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setTimeframe('quarter')}
            className={`px-1.5 xs:px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-lg transition-colors text-xs sm:text-sm font-medium whitespace-nowrap ${
              timeframe === 'quarter'
                ? 'bg-primary-600 dark:bg-primary-700 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Quarter
          </button>
          <button
            onClick={() => setTimeframe('year')}
            className={`px-1.5 xs:px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-lg transition-colors text-xs sm:text-sm font-medium whitespace-nowrap ${
              timeframe === 'year'
                ? 'bg-primary-600 dark:bg-primary-700 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Year
          </button>
          <button
            onClick={() => setTimeframe('alltime')}
            className={`px-1.5 xs:px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-lg transition-colors text-xs sm:text-sm font-medium whitespace-nowrap ${
              timeframe === 'alltime'
                ? 'bg-primary-600 dark:bg-primary-700 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Top 3 Featured - Fully Responsive */}
      {leaderboard.length >= 3 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 xs:gap-2.5 sm:gap-3 md:gap-4">
          {leaderboard.slice(0, 3).map((member, index) => (
            <div
              key={member.id}
              className={`rounded-xl shadow-lg p-2 xs:p-3 sm:p-4 md:p-6 text-white transition-transform hover:scale-105 ${
                index === 0
                  ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 sm:row-span-2 lg:row-span-2 lg:col-span-1'
                  : index === 1
                    ? 'bg-gradient-to-br from-gray-400 to-gray-600'
                    : 'bg-gradient-to-br from-orange-400 to-orange-600'
              }`}
            >
              <div className="space-y-1.5 xs:space-y-2 sm:space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs opacity-90">#{index + 1}</p>
                    <p className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-bold">
                      {getMedalIcon(index + 1) || `#${index + 1}`}
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm xs:text-base sm:text-lg md:text-xl font-bold truncate">
                    {member.name}
                  </h3>
                  <p className="text-xs opacity-90 truncate">{member.country}</p>
                </div>
              </div>
              <div className="mt-2 xs:mt-3 sm:mt-4 pt-2 xs:pt-3 sm:pt-4 border-t border-white border-opacity-30">
                <p className="text-lg xs:text-2xl sm:text-3xl md:text-4xl font-bold">
                  {formatNumber(member.duroodCount)}
                </p>
                <p className="text-xs opacity-90">Total Durood</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full Leaderboard Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-2 xs:p-3 sm:p-6 border-b border-gray-300 dark:border-gray-700">
          <h2 className="text-base xs:text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            {leaderboard.length} Members
          </h2>
        </div>

        {leaderboard.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No submissions in this timeframe</p>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="md:hidden space-y-1.5 xs:space-y-2">
              {leaderboard.map((member, index) => {
                const medal = getMedalIcon(index + 1)
                return (
                  <div
                    key={member.id}
                    className={`border-b border-gray-300 dark:border-gray-700 p-2 xs:p-3 transition-colors ${
                      index < 3
                        ? 'bg-yellow-50 dark:bg-yellow-900/10'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-start gap-2 xs:gap-3">
                      <span
                        className={`inline-flex items-center justify-center w-7 xs:w-8 h-7 xs:h-8 rounded-full font-bold text-white flex-shrink-0 text-xs xs:text-sm ${
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
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white text-xs xs:text-sm truncate">
                          {member.name}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          {member.country}
                        </p>
                        <div className="grid grid-cols-3 gap-1.5 xs:gap-2 mt-1.5 xs:mt-2">
                          <div className="text-center">
                            <p className="text-xs font-bold text-primary-600 dark:text-primary-400 leading-tight">
                              {formatNumber(member.duroodCount)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 leading-tight">
                              Durood
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs font-bold text-gray-900 dark:text-white leading-tight">
                              {member.submissions}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 leading-tight">
                              Subs
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs font-bold text-gray-900 dark:text-white leading-tight">
                              {member.avgPerSubmission}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 leading-tight">
                              Avg
                            </p>
                          </div>
                        </div>
                        {/* Badges */}
                        <div className="flex gap-0.5 xs:gap-1 mt-1.5 xs:mt-2 flex-wrap">
                          {index === 0 && (
                            <span className="text-sm xs:text-base" title="1st Place">
                              ⭐
                            </span>
                          )}
                          {index === 1 && (
                            <span className="text-sm xs:text-base" title="2nd Place">
                              ⭐
                            </span>
                          )}
                          {index === 2 && (
                            <span className="text-sm xs:text-base" title="3rd Place">
                              ⭐
                            </span>
                          )}
                          {member.duroodCount >= 1000 && index > 2 && (
                            <span className="text-sm xs:text-base" title="1000+ Achievement">
                              🎖️
                            </span>
                          )}
                          {member.submissions >= 50 && index > 2 && (
                            <span className="text-sm xs:text-base" title="50+ Submissions">
                              🏆
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
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
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {member.name}
                          </p>
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
                            <span
                              className="inline-block text-2xl"
                              title="1000+ Durood Achievement"
                            >
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
          </>
        )}
      </div>

      {/* Achievements Legend */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-2 xs:p-3 sm:p-4 md:p-6">
        <h3 className="text-sm xs:text-base sm:text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-2 xs:mb-3 sm:mb-4">
          🏆 Achievements
        </h3>
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 xs:gap-2 sm:gap-3 md:gap-4">
          <div className="flex gap-1.5 xs:gap-2 sm:gap-3 items-start p-1.5 xs:p-2 sm:p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <span className="text-lg xs:text-xl sm:text-2xl md:text-3xl flex-shrink-0">🥇</span>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm">
                1st Place
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Highest durood</p>
            </div>
          </div>
          <div className="flex gap-1.5 xs:gap-2 sm:gap-3 items-start p-1.5 xs:p-2 sm:p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <span className="text-lg xs:text-xl sm:text-2xl md:text-3xl flex-shrink-0">🥈</span>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm">
                2nd Place
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Second highest</p>
            </div>
          </div>
          <div className="flex gap-1.5 xs:gap-2 sm:gap-3 items-start p-1.5 xs:p-2 sm:p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <span className="text-lg xs:text-xl sm:text-2xl md:text-3xl flex-shrink-0">🥉</span>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm">
                3rd Place
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Third highest</p>
            </div>
          </div>
          <div className="flex gap-1.5 xs:gap-2 sm:gap-3 items-start p-1.5 xs:p-2 sm:p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <span className="text-lg xs:text-xl sm:text-2xl md:text-3xl flex-shrink-0">🎖️</span>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm">
                1000+ Award
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">1000+ durood</p>
            </div>
          </div>
          <div className="flex gap-1.5 xs:gap-2 sm:gap-3 items-start p-1.5 xs:p-2 sm:p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <span className="text-lg xs:text-xl sm:text-2xl md:text-3xl flex-shrink-0">🏆</span>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm">
                50+ Active
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">50+ submissions</p>
            </div>
          </div>
          <div className="flex gap-1.5 xs:gap-2 sm:gap-3 items-start p-1.5 xs:p-2 sm:p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <span className="text-lg xs:text-xl sm:text-2xl md:text-3xl flex-shrink-0">⭐</span>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm">
                Top 3 Star
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Top 3 ranking</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LeaderboardPage
