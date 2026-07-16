export const FANTASY12_TIME_ZONE = 'America/Sao_Paulo'

type LocalDateTime = {
  year: number
  month: number
  day: number
  hour?: number
  minute?: number
  second?: number
}

const formatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: FANTASY12_TIME_ZONE,
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
})

export class SaoPauloPeriodService {
  static parts(date: Date) {
    const values = Object.fromEntries(
      formatter.formatToParts(date)
        .filter(part => part.type !== 'literal')
        .map(part => [part.type, Number(part.value)])
    )
    return values as LocalDateTime & { hour: number; minute: number; second: number }
  }

  static fromLocal(parts: LocalDateTime) {
    const wanted = Date.UTC(
      parts.year, parts.month - 1, parts.day,
      parts.hour ?? 0, parts.minute ?? 0, parts.second ?? 0
    )
    let candidate = new Date(wanted)
    for (let attempt = 0; attempt < 3; attempt++) {
      const actual = this.parts(candidate)
      const represented = Date.UTC(
        actual.year, actual.month - 1, actual.day,
        actual.hour, actual.minute, actual.second
      )
      candidate = new Date(candidate.getTime() + wanted - represented)
    }
    return candidate
  }

  static periodRef(date = new Date()) {
    const { year, month } = this.parts(date)
    return `${year}-${String(month).padStart(2, '0')}`
  }

  static parse(periodRef: string) {
    const match = /^(\d{4})-(\d{2})$/.exec(periodRef)
    if (!match) throw new Error('Invalid period format. Expected YYYY-MM')
    const year = Number(match[1])
    const month = Number(match[2])
    if (month < 1 || month > 12) {
      throw new Error('Invalid month. Expected a value from 01 to 12')
    }
    const nextYear = month === 12 ? year + 1 : year
    const nextMonth = month === 12 ? 1 : month + 1
    return {
      start: this.fromLocal({ year, month, day: 1 }),
      end: this.fromLocal({ year: nextYear, month: nextMonth, day: 1 }),
    }
  }
}
