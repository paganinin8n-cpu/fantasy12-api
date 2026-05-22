const { BackfillMonthlyRankingStateService } = require('../dist/services/ranking/backfill-monthly-ranking-state.service')

async function main() {
  const result = await BackfillMonthlyRankingStateService.execute()
  console.log(JSON.stringify(result, null, 2))
}

main().catch(error => {
  console.error('Failed to backfill monthly ranking state')
  console.error(error)
  process.exit(1)
})
