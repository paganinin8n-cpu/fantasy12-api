import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { MeController } from '../controllers/me.controller';

const router = Router();
const meController = new MeController();

router.get('/me', authMiddleware, (req, res) => {
  return meController.handle(req, res);
});

export default router;


