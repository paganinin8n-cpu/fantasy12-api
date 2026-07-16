import { SCHEDULE_TIMEZONE } from '../jobs/constants'

/**
 * Builds YYYY-MM periodRef for the given instant in a timezone.
 * Defaults to America/Sao_Paulo for monthly ranking creation.
 */
export function periodRefFromDate(
  date: Date,
  timeZone: string = SCHEDULE_TIMEZONE
): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(date)

  const year = parts.find(part => part.type === 'year')?.value
  const month = parts.find(part => part.type === 'month')?.value

  if (!year || !month) {
    throw new Error(`Unable to derive periodRef for timezone ${timeZone}`)
  }

  return `${year}-${month}`
}
