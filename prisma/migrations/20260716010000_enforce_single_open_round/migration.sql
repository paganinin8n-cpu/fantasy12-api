-- Defesa final contra duas rodadas OPEN. A aplicação já faz a checagem antes
-- da transição; o índice cobre concorrência entre processos/operadores.
-- CREATE INDEX CONCURRENTLY não bloqueia escritas na tabela durante a criação.
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "rounds_single_open_idx"
ON "rounds" ((1))
WHERE "status" = 'OPEN';
