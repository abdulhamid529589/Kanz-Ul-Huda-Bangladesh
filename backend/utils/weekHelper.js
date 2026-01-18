import moment from 'moment'

// Get week start day from environment (6=Saturday, 5=Friday, etc.)
const WEEK_START_DAY = parseInt(process.env.WEEK_START_DAY) || 6 // Default to Saturday (6)

/**
 * Get the start and end dates of the current week
 * Week: Saturday to Friday
 * @returns {Object} { weekStartDate, weekEndDate }
 */
export const getCurrentWeek = () => {
  const now = moment()
  const currentDay = now.day()

  let weekStartDate

  // Calculate days to subtract to get to week start (Saturday)
  if (currentDay >= WEEK_START_DAY) {
    weekStartDate = moment().day(WEEK_START_DAY).startOf('day')
  } else {
    weekStartDate = moment().subtract(1, 'week').day(WEEK_START_DAY).startOf('day')
  }

  const weekEndDate = moment(weekStartDate).add(6, 'days').endOf('day') // Friday

  return {
    weekStartDate: weekStartDate.toDate(),
    weekEndDate: weekEndDate.toDate(),
  }
}

/**
 * Get week dates for a specific date
 * Week: Saturday to Friday
 * @param {Date} date - The date to get week for
 * @returns {Object} { weekStartDate, weekEndDate }
 */
export const getWeekForDate = (date) => {
  const targetDate = moment(date)
  const targetDay = targetDate.day()

  let weekStartDate

  if (targetDay >= WEEK_START_DAY) {
    weekStartDate = moment(targetDate).day(WEEK_START_DAY).startOf('day')
  } else {
    weekStartDate = moment(targetDate).subtract(1, 'week').day(WEEK_START_DAY).startOf('day')
  }

  const weekEndDate = moment(weekStartDate).add(6, 'days').endOf('day') // Friday

  return {
    weekStartDate: weekStartDate.toDate(),
    weekEndDate: weekEndDate.toDate(),
  }
}

/**
 * Get previous week dates
 * @returns {Object} { weekStartDate, weekEndDate }
 */
export const getPreviousWeek = () => {
  const currentWeek = getCurrentWeek()
  const prevWeekStart = moment(currentWeek.weekStartDate).subtract(7, 'days').toDate()
  const prevWeekEnd = moment(currentWeek.weekEndDate).subtract(7, 'days').toDate()

  return {
    weekStartDate: prevWeekStart,
    weekEndDate: prevWeekEnd,
  }
}

/**
 * Format week for display
 * @param {Date} weekStartDate
 * @param {Date} weekEndDate
 * @returns {String} "Jan 9 - Jan 15, 2026"
 */
export const formatWeekDisplay = (weekStartDate, weekEndDate) => {
  const start = moment(weekStartDate)
  const end = moment(weekEndDate)

  if (start.year() === end.year()) {
    if (start.month() === end.month()) {
      return `${start.format('MMM D')} - ${end.format('D, YYYY')}`
    }
    return `${start.format('MMM D')} - ${end.format('MMM D, YYYY')}`
  }
  return `${start.format('MMM D, YYYY')} - ${end.format('MMM D, YYYY')}`
}

/**
 * Get all weeks in a date range
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Array} Array of week objects
 */
export const getWeeksInRange = (startDate, endDate) => {
  const weeks = []
  let currentDate = moment(startDate)
  const end = moment(endDate)

  while (currentDate.isSameOrBefore(end)) {
    const week = getWeekForDate(currentDate.toDate())
    weeks.push(week)
    currentDate = moment(week.weekEndDate).add(1, 'day')
  }

  return weeks
}

/**
 * Check if date is in current week
 * @param {Date} date
 * @returns {Boolean}
 */
export const isCurrentWeek = (date) => {
  const currentWeek = getCurrentWeek()
  const checkDate = moment(date)

  return checkDate.isBetween(
    moment(currentWeek.weekStartDate),
    moment(currentWeek.weekEndDate),
    null,
    '[]',
  )
}
