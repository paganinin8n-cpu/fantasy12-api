import { Router } from 'express'
import { GetOpenRoundController } from '../controllers/round/get-open-round.controller'
import { GetRoundMatchesController } from '../controllers/match/get-round-matches.controller'

const router = Router()

router.get('/rounds/open', GetOpenRoundController.handle)

router.get('/rounds/:roundId/matches', GetRoundMatchesController.handle)

export default router