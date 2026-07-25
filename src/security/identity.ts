export function canonicalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function normalizeDigits(value: string): string {
  return value.replace(/\D/g, '')
}
