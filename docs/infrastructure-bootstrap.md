# Bootstrap do `fantasy12-infra`

## Status

O diretório irmão `/Users/roberson/dev/personal/fantasy12-infra` ainda não pôde ser criado automaticamente porque o diretório pai `.../personal` continua sem permissão de escrita para este processo.

Para não bloquear o trabalho, o scaffold inicial foi gerado em:

- `/tmp/fantasy12-infra`

## Conteúdo preparado

- `README.md`
- `.env.example`
- `docker-compose.yml`
- `postgres/init.sql`
- `docs/README.md`
- `scripts/bootstrap-local.sh`

## Próximo passo

Quando o diretório puder ser criado no workspace definitivo, mover o conteúdo de `/tmp/fantasy12-infra` para:

- `/Users/roberson/dev/personal/fantasy12-infra`

## Escopo da v1

- Postgres local
- API apontando para o banco local
- Frontend apontando para a API local
- variáveis mínimas de sessão e jobs internos
- script de bootstrap

## Observações

- o `docker-compose.yml` atual usa bind mounts para `../fantasy12-api` e `../fantasy12-frontend`
- o compose foi pensado para desenvolvimento local, não para produção
- antes de produção ainda faltam proxy, secrets management, backup/restore e pipeline de deploy
