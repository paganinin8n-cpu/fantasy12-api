type SubscriptionLike = {
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED'
  plan?: 'MONTHLY' | 'ANNUAL'
  startAt?: Date
  endAt?: Date | null
} | null | undefined

export function hasActiveProSubscriptionAt(
  subscription: SubscriptionLike,
  at: Date
) {
  if (!subscription) return false
  if (subscription.status === 'EXPIRED') return false
  if (subscription.startAt && subscription.startAt > at) return false
  return !subscription.endAt || subscription.endAt > at
}

export function hasActiveProSubscription(subscription: SubscriptionLike) {
  return hasActiveProSubscriptionAt(subscription, new Date())
}

export function hasAnnualProSubscription(subscription: SubscriptionLike) {
  return hasActiveProSubscription(subscription) && subscription?.plan === 'ANNUAL'
}
