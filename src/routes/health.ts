import { Router } from "express";
import nodemailer from "nodemailer";
import { prisma } from "../lib/prisma";

const router = Router();

router.get("/health", async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  return res.json({ api: "ok", db: "ok" });
});

router.get("/health/smtp", async (_req, res) => {
  const host = process.env.SMTP_HOST ?? "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    return res.status(400).json({ ok: false, error: "SMTP_USER/SMTP_PASS not set" });
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: false,
      auth: { user, pass },
    });
    await transporter.verify();
    return res.json({ ok: true, host, port, user });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ ok: false, host, port, user, error: message });
  }
});

export default router;
