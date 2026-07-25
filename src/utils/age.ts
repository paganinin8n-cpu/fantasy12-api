const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/

/** Calendar date in America/Sao_Paulo (YYYY-MM-DD parts). */
export function getTodayPartsInSaoPaulo(now = new Date()): { year: number; month: number; day: number } {
  const formatted = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)

  const [year, month, day] = formatted.split('-').map(Number)
  return { year, month, day }
}

/**
 * Parses YYYY-MM-DD as a UTC midnight calendar date (date-only semantics).
 * Returns null if the string is not a real calendar day.
 */
export function parseDateOnly(value: string): Date | null {
  const match = DATE_ONLY.exec(value.trim())
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null
  }

  return date
}

/** Age in full years using Brazil calendar day as "today". */
export function ageInYears(birthDate: Date, now = new Date()): number {
  const today = getTodayPartsInSaoPaulo(now)
  const birthYear = birthDate.getUTCFullYear()
  const birthMonth = birthDate.getUTCMonth() + 1
  const birthDay = birthDate.getUTCDate()

  let age = today.year - birthYear
  if (today.month < birthMonth || (today.month === birthMonth && today.day < birthDay)) {
    age -= 1
  }
  return age
}

export function isAtLeastAge(birthDate: Date, minAge: number, now = new Date()): boolean {
  return ageInYears(birthDate, now) >= minAge
}
