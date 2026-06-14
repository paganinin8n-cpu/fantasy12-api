# Checklist de QA frontend mobile-first

Data de referencia: 2026-06-14

Ambientes principais:

- Frontend publico: https://www.fantasy12.com
- API publica: https://api.fantasy12.com/health
- Frontend EasyPanel: https://f12-prd-frontend.x18arx.easypanel.host
- API EasyPanel: https://f12-prd-api.x18arx.easypanel.host/health

Este roteiro existe para impedir que melhorias visuais removam ou quebrem fluxos ja entregues. Toda refatoracao visual relevante deve passar por esta lista antes de deploy.

## 1. Matriz minima de viewport

Validar as telas abaixo em:

- Mobile: 390 x 844
- Tablet: 768 x 1024
- Desktop: 1366 x 900

Critérios globais:

- textos nao sobrepoem labels, botoes ou cards
- campos mantem label legivel e area de toque confortavel
- botoes principais ficam visiveis sem depender de zoom
- status de negocio aparecem em portugues
- cards nao empilham informacao demais na primeira dobra
- rotas protegidas redirecionam para login quando nao ha sessao
- console sem erro critico de carregamento

## 2. Login e sessao

Roteiro:

1. Abrir `/login`.
2. Conferir logo, titulo, email, senha, botao principal, recuperacao e criacao de conta.
3. Validar mobile, tablet e desktop.
4. Acessar `/dashboard` sem sessao.
5. Confirmar redirecionamento para `/login`.
6. Fazer login com usuario de teste autorizado.
7. Recarregar a pagina autenticada.
8. Fazer logout.

Resultado esperado:

- login fica legivel nos tres tamanhos
- sem texto cortado ou botao branco sem contraste
- sessao autenticada persiste apos refresh
- logout encerra a sessao

## 3. Dashboard

Roteiro:

1. Abrir `/dashboard` autenticado.
2. Validar hero do jogador, CTA principal e cards de resumo.
3. Confirmar ranking mensal e links para Palpites, Historico, Bar e Mesas.
4. Validar que status de rodada aparece como `Aberta`, `Fechada`, `Apurada`, `Rascunho` ou `Cancelada`.

Resultado esperado:

- primeira dobra informa a proxima acao do jogador
- nao aparecem termos internos como `OPEN`, `SCORED` ou `CLOSED`
- mobile nao exige rolagem horizontal

## 4. Palpites

Roteiro:

1. Abrir `/ticket`.
2. Validar lista de jogos, selecao 1/X/2 e resumo lateral/inferior.
3. Marcar 12 palpites.
4. Marcar duplas e super duplas dentro do limite.
5. Abrir o resumo antes de enviar.
6. Enviar somente em ambiente apropriado para teste.
7. Testar tentativa incompleta.

Resultado esperado:

- selecao clara em mobile
- duplas e super duplas aparecem com contadores corretos
- envio incompleto tem erro amigavel
- envio valido nao perde sessao

## 5. Historico de palpites

Roteiro:

1. Abrir `/tickets`.
2. Validar cards por rodada.
3. Conferir pontuacao, acertos, duplas certas, super duplas certas e status da rodada.
4. Expandir detalhes dos palpites.

Resultado esperado:

- status em portugues
- criterios de desempate ficam claros
- detalhes dos 12 jogos ficam recolhidos por padrao

## 6. Bar/Balcao

Roteiro:

1. Abrir `/bar`.
2. Conferir atalhos: saldo, extras e regras rapidas.
3. Conferir compra de fichas.
4. Conferir compra de duplas e super duplas.
5. Validar regra de consumo: bonus gratis primeiro, compras depois.
6. Iniciar checkout somente em ambiente apropriado para pagamento de teste.

Resultado esperado:

- usuario entende diferenca entre fichas, duplas e super duplas
- botoes de compra ficam acionaveis em mobile
- saldo insuficiente fica claro

## 7. Mesas

Roteiro:

1. Abrir `/mesas`.
2. Validar area social, criar Mesa e entrar com convite.
3. Conferir lista de Mesas do usuario e Mesas disponiveis.
4. Abrir detalhe de uma Mesa.
5. Alternar abas `Ranking`, `Participantes`, `Historico` e `Regras`.
6. Validar convite privado quando usuario for dono da Mesa.

Resultado esperado:

- lista nao vira uma sequencia poluida de cards
- detalhe separa leitura por tarefa
- regras de PRO, entrada, custo e janela continuam preservadas

## 8. Perfil

Roteiro:

1. Abrir `/profile`.
2. Alternar `Dados pessoais`, `Seguranca` e `Conta`.
3. Validar nome, apelido, telefone, imagem e bio.
4. Validar troca de senha com senha atual.
5. Conferir atalhos de assinatura, pagamentos e sair.

Resultado esperado:

- nenhum label sobrepoe campo
- campos ficam alinhados em mobile, tablet e desktop
- troca de senha continua exigindo senha atual
- status PRO nao compete visualmente com o formulario

## 9. Admin Rodadas

Roteiro:

1. Abrir `/admin/rounds` com usuario admin.
2. Conferir separacao entre rodada ativa, criacao e historico.
3. Criar rodada somente em ambiente de teste.
4. Preencher os 12 jogos.
5. Abrir/editar rodada.
6. Lancar resultado com 1/X/2.
7. Apurar rodada.

Resultado esperado:

- tarefas administrativas ficam separadas
- jogos nao exigem campo `Grupo` visivel quando nao usado no produto
- status aparece em portugues para o operador

## 10. Admin Usuarios

Roteiro:

1. Abrir `/admin/users` com usuario admin.
2. Filtrar por nome/email.
3. Validar paginacao.
4. Confirmar ordenacao padrao por usuarios mais recentes.
5. Abrir detalhe progressivo do usuario.
6. Ajustar permissao, plano, fichas, duplas e super duplas somente em ambiente apropriado.
7. Conferir historico/auditoria do usuario.

Resultado esperado:

- grade fica escaneavel mesmo com muitos usuarios
- acoes perigosas ficam claras e auditaveis
- nao ha excesso de cards competindo na primeira dobra

## 11. Admin Operacional e logs

Roteiro:

1. Abrir `/admin/operations`.
2. Conferir estado geral, pagamentos, webhooks, assinaturas e jobs.
3. Validar que avisos tecnicos aparecem com rotulo humano.
4. Abrir `/admin/logs`.
5. Usar filtros por acao, ator, severidade e periodo.

Resultado esperado:

- termos de sistema nao aparecem crus quando houver traducao de negocio
- runbook fica legivel para operador nao tecnico
- logs continuam rastreaveis para auditoria

## 12. Registro de evidencia

Para cada execucao, registrar:

- data e ambiente
- commit ou bundle testado
- viewport validado
- status: `Aprovado`, `Falhou` ou `Bloqueado`
- evidencia: screenshot, video curto ou descricao objetiva
- observacao: impacto e passos para reproduzir

Sugestao de nomes:

- `YYYY-MM-DD-tela-mobile.png`
- `YYYY-MM-DD-tela-tablet.png`
- `YYYY-MM-DD-tela-desktop.png`

## Execucao parcial: 2026-06-14

Ambiente:

- https://www.fantasy12.com

Escopo executado sem credenciais autenticadas:

- login mobile, tablet e desktop
- redirecionamento de `/dashboard` para `/login` sem sessao
- API health publica

Evidencias salvas:

- `docs/qa/screenshots/2026-06-14-login-mobile.png`
- `docs/qa/screenshots/2026-06-14-login-tablet.png`
- `docs/qa/screenshots/2026-06-14-login-desktop.png`
- `docs/qa/screenshots/2026-06-14-protected-dashboard-redirect-mobile.png`

Resultado:

- `Aprovado` para renderizacao publica do login nos tres breakpoints
- `Aprovado` para protecao de rota sem sessao
- `Bloqueado` para telas autenticadas ate execucao com usuario de teste/admin ativo no navegador de QA
