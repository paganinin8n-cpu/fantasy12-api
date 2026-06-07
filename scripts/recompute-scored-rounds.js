const { RecomputeScoredRoundsService } = require('../dist/services/score/recompute-scored-rounds.service')

async function main() {
  const result = await RecomputeScoredRoundsService.execute()
  console.log(JSON.stringify(result, null, 2))
}

main().catch(error => {
  console.error('Failed to recompute scored rounds')
  console.error(error)
  process.exit(1)
})
