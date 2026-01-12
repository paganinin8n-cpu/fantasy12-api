import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

router.get("/health", async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  return res.json({ api: "ok", db: "ok" });
});

export default router;
