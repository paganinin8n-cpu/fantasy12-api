-- Paridade do bootstrap fresh, pois índices parciais não são representáveis
-- no schema Prisma 5 e portanto não são gerados por `prisma db push`.
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "rounds_single_open_idx"
ON "rounds" ((1))
WHERE "status" = 'OPEN';
