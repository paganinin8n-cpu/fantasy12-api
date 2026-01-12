import { Router } from "express";
import { UserController } from "../controllers/user.controller";

const router = Router();
const controller = new UserController();

router.post("/users", (req, res) => controller.create(req, res));

export default router;
