UPDATE "rankings" AS ranking
SET "entryEndDate" = LEAST(ranking."endDate", first_round."closeAt")
FROM (
  SELECT
    ranking_round."rankingId",
    MIN(round."closeAt") AS "closeAt"
  FROM "ranking_rounds" AS ranking_round
  INNER JOIN "rounds" AS round ON round."id" = ranking_round."roundId"
  WHERE round."closeAt" IS NOT NULL
  GROUP BY ranking_round."rankingId"
) AS first_round
WHERE ranking."id" = first_round."rankingId"
  AND ranking."type" = 'BOLAO'
  AND ranking."entryEndDate" IS NULL;

UPDATE "rankings"
SET "maxParticipants" = NULL
WHERE "type" = 'BOLAO';
