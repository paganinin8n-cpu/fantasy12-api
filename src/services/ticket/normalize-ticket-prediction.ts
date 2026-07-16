export const VALID_TICKET_PREDICTIONS = ['1', 'X', '2'] as const

export function normalizeTicketPrediction(value: string) {
  return String(value ?? '')
    .split(',')
    .map(token => token.trim().toUpperCase())
    .join(',')
}

export function isValidTicketPrediction(value: string) {
  const tokens = value.split(',')
  return tokens.length === 12 && tokens.every(token =>
    VALID_TICKET_PREDICTIONS.includes(
      token as typeof VALID_TICKET_PREDICTIONS[number]
    )
  )
}
