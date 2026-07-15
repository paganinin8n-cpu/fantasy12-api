-- Data-only backfill. The latest chronologically closed round is the source
-- for the permanent score accumulated before this column existed.
UPDATE "users" AS app_user
SET "scoreTotal" = latest_score."scoreTotal"
FROM (
  SELECT DISTINCT ON (history."userId")
    history."userId",
    history."scoreTotal"
  FROM "user_score_history" AS history
  JOIN "rounds" AS round ON round."id" = history."roundId"
  ORDER BY history."userId", round."number" DESC, history."createdAt" DESC
) AS latest_score
WHERE app_user."id" = latest_score."userId";

-- Keep only one legacy monthly ranking per type/month eligible for the new
-- unique key; older duplicates remain historical with periodRef NULL.
WITH monthly_rankings AS (
  SELECT
    ranking."id",
    to_char(ranking."startDate" AT TIME ZONE 'UTC', 'YYYY-MM') AS period_ref,
    row_number() OVER (
      PARTITION BY
        ranking."type",
        to_char(ranking."startDate" AT TIME ZONE 'UTC', 'YYYY-MM')
      ORDER BY ranking."createdAt" DESC, ranking."id"
    ) AS priority
  FROM "rankings" AS ranking
  WHERE ranking."type" IN ('GLOBAL', 'PRO')
    AND ranking."startDate" IS NOT NULL
    AND ranking."periodRef" IS NULL
)
UPDATE "rankings" AS ranking
SET "periodRef" = monthly_rankings.period_ref
FROM monthly_rankings
WHERE ranking."id" = monthly_rankings."id"
  AND monthly_rankings.priority = 1;
