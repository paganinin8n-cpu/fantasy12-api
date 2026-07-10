type SubscriptionLike = {
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED'
  plan?: 'MONTHLY' | 'ANNUAL'
  endAt?: Date | null
} | null | undefined

export function hasActiveProSubscription(subscription: SubscriptionLike) {
  if (!subscription) return false
  if (subscription.status === 'EXPIRED') return false
  return !subscription.endAt || subscription.endAt > new Date()
}

export function hasAnnualProSubscription(subscription: SubscriptionLike) {
  return hasActiveProSubscription(subscription) && subscription?.plan === 'ANNUAL'
}
