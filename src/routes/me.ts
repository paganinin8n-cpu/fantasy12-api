import { Router } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { MeController } from '../controllers/me.controller';

const router = Router();
const meController = new MeController();

router.get('/me', authMiddleware, (req, res) => {
  return meController.handle(req, res);
});

export default router;


