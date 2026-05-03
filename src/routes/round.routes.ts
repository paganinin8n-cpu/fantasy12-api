import { Router } from 'express'
import { GetOpenRoundController } from '../controllers/round/get-open-round.controller'
import { GetRoundMatchesController } from '../controllers/match/get-round-matches.controller'
import { ListRoundsController } from '../controllers/round/list-rounds.controller'

const router = Router()

// Lista paginada (?status=&limit=&cursor=)
router.get('/rounds', ListRoundsController.handle)

router.get('/rounds/open', GetOpenRoundController.handle)
router.get('/rounds/:roundId/matches', GetRoundMatchesController.handle)

export default router
