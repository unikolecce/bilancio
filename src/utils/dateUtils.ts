/**
 * Returns the current year and month (1-based) in local time.
 */
export const getCurrentYearMonth = (): { year: number; month: number } => {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

/**
 * Formats a year+month (1-based) as "YYYY-MM" string.
 */
export const formatYearMonth = (year: number, month: number): string =>
  `${year}-${String(month).padStart(2, '0')}`

/**
 * Parses a "YYYY-MM" string into { year, month }.
 * Returns null if format is invalid.
 */
export const parseYearMonth = (
  s: string
): { year: number; month: number } | null => {
  const match = /^(\d{4})-(\d{2})$/.exec(s)
  if (!match) return null
  const year = parseInt(match[1], 10)
  const month = parseInt(match[2], 10)
  if (month < 1 || month > 12) return null
  return { year, month }
}

/**
 * Returns the next month's year+month pair.
 */
export const nextMonth = (
  year: number,
  month: number
): { year: number; month: number } => {
  if (month === 12) return { year: year + 1, month: 1 }
  return { year, month: month + 1 }
}

/**
 * Returns the month name in the given language.
 */
export const getMonthName = (month: number, language: string): string => {
  const date = new Date(2000, month - 1, 1)
  return date.toLocaleString(language, { month: 'long' })
}

/**
 * Builds a Date object from a YYYY-MM-DD string (local timezone).
 */
export const parseDateString = (s: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (!match) return null
  return new Date(
    parseInt(match[1], 10),
    parseInt(match[2], 10) - 1,
    parseInt(match[3], 10)
  )
}

/**
 * Returns today as "YYYY-MM-DD".
 */
export const todayString = (): string => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}
