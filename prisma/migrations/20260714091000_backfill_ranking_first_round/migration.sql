-- Data-only backfill for competitions created before first-round linking.
-- The deterministic text id makes this migration idempotent by relationship.
INSERT INTO "ranking_rounds" ("id", "rankingId", "roundId")
SELECT
  md5('ranking-first-round:' || ranking."id" || ':' || first_round."id"),
  ranking."id",
  first_round."id"
FROM "rankings" AS ranking
JOIN LATERAL (
  SELECT round."id"
  FROM "rounds" AS round
  WHERE round."closeAt" >= ranking."startDate"
    AND (ranking."endDate" IS NULL OR round."closeAt" <= ranking."endDate")
  ORDER BY round."closeAt" ASC, round."number" ASC
  LIMIT 1
) AS first_round ON true
WHERE ranking."startDate" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "ranking_rounds" AS linked_round
    WHERE linked_round."rankingId" = ranking."id"
  )
ON CONFLICT ("rankingId", "roundId") DO NOTHING;
