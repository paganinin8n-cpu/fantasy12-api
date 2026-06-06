import { Router } from 'express'
import webhooksRoutes from './webhooks.routes'
import jobsRoutes from './jobs.routes'
import subscriptionJobsRoutes from './subscription-jobs.routes'
import alertsJobsRoutes from './alerts-jobs.routes'

const router = Router()

router.use(webhooksRoutes)
router.use(jobsRoutes)
router.use(subscriptionJobsRoutes)
router.use(alertsJobsRoutes)

export default router
