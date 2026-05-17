type SubscriptionLike = {
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED'
  endAt?: Date | null
} | null | undefined

export function hasActiveProSubscription(subscription: SubscriptionLike) {
  if (!subscription) return false
  if (subscription.status !== 'ACTIVE') return false
  return !subscription.endAt || subscription.endAt > new Date()
}
