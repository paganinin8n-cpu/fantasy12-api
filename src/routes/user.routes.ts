import { Router } from "express";
import { UserController } from "../controllers/user.controller";

const router = Router();
const controller = new UserController();

router.post("/users", (req, res) => controller.create(req, res));

// ⚠️ LOGIN movido para /api/auth/login (AuthController)
// Endpoint duplicado removido em favor de uma única implementação.

export default router;
