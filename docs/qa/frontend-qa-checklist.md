# Roteiro de QA do Frontend

Data de referencia: 2026-05-09

Ambiente principal de teste:

- Frontend: https://f12-prd-frontend.x18arx.easypanel.host/login
- API health: https://f12-prd-api.x18arx.easypanel.host/health
- API rodada aberta: https://f12-prd-api.x18arx.easypanel.host/api/rounds/open

Credenciais de teste:

- Email: `admin@fantasy12.com`
- Senha: `123456`

## 1. Preparacao

1. Abrir o frontend no ambiente de teste.
2. Confirmar que a pagina carrega sem tela em branco.
3. Abrir o console do navegador e verificar se nao existem erros criticos de carregamento.
4. Confirmar que a API responde em `/health`.

Resultado esperado:

- Frontend acessivel.
- Console sem erros fatais.
- API respondendo `{"api":"ok","db":"ok"}`.

## 2. Login e sessao

1. Acessar `/login`.
2. Fazer login com as credenciais de teste.
3. Confirmar redirecionamento apos login.
4. Recarregar a pagina.
5. Confirmar que a sessao continua ativa.
6. Fazer logout.
7. Confirmar retorno para a tela de login.
8. Tentar acessar uma rota protegida sem login.

Resultado esperado:

- Login concluido com sucesso.
- Sessao persistida apos refresh.
- Logout funcionando.
- Rotas protegidas bloqueadas sem sessao.

## 3. Dashboard

1. Entrar no dashboard apos login.
2. Confirmar carregamento das informacoes principais.
3. Recarregar a tela.
4. Verificar se nao ha mensagens de erro da API.

Resultado esperado:

- Dashboard visivel.
- Sem erro visual.
- Sessao mantida apos refresh.

## 4. Rodada aberta

1. Confirmar exibicao da rodada aberta.
2. Validar numero, status e datas da rodada.
3. Validar o comportamento da tela mesmo com `matches` vazio.

Resultado esperado:

- Rodada `OPEN` visivel.
- Interface estavel mesmo sem lista detalhada de partidas.

## 5. Ticket / palpites

1. Abrir a tela de ticket.
2. Confirmar que o formulario carrega.
3. Preencher os 12 palpites.
4. Enviar o ticket.
5. Confirmar feedback de sucesso.
6. Tentar um envio invalido ou incompleto.
7. Confirmar feedback de erro amigavel.
8. Recarregar a pagina apos o envio.

Resultado esperado:

- Palpites enviados com sucesso quando validos.
- Mensagens de erro claras quando invalido.
- Sem travamento ou perda inesperada de sessao.

## 6. Admin de rodadas

1. Acessar a area administrativa.
2. Confirmar listagem de rodadas.
3. Criar nova rodada.
4. Abrir a rodada criada, se aplicavel.
5. Confirmar atualizacao de status na interface.

Resultado esperado:

- Tela admin acessivel.
- Operacoes principais de rodada funcionando.
- Feedback de sucesso e erro coerente.

## 7. Wallet, payments e bar

1. Abrir carteira.
2. Confirmar que a pagina carrega sem erro.
3. Abrir pagamentos.
4. Abrir bar.
5. Confirmar que os pacotes aparecem.
6. Acionar o fluxo de compra disponivel.

Resultado esperado:

- Paginas acessiveis.
- Pacotes visiveis.
- Sem quebra de interface ao iniciar compra.

## 8. Navegacao geral

1. Navegar entre login, dashboard, ticket, admin, wallet e bar.
2. Usar o botao voltar do navegador.
3. Confirmar que menus e links funcionam.

Resultado esperado:

- Navegacao consistente.
- Sem loops, paginas em branco ou sessao perdida sem motivo.

## 9. Responsividade

1. Testar em largura desktop.
2. Testar em largura mobile.
3. Validar login, dashboard e ticket.

Resultado esperado:

- Fluxos principais continuam utilizaveis em telas menores.

## 10. Tratamento de erro

1. Observar mensagens quando alguma chamada falhar.
2. Confirmar que nao ha stack trace exposta ao usuario.
3. Confirmar que estados de loading aparecem quando necessario.

Resultado esperado:

- Erros amigaveis.
- Sem exposicao de detalhes internos.
- Indicacao visual durante carregamentos.

## 11. Dominios

1. Validar no dominio do EasyPanel.
2. Depois da troca de DNS, repetir no dominio publico:
   - `https://www.fantasy12.com/login`
   - `https://api.fantasy12.com/health`

Resultado esperado:

- Mesmo comportamento no dominio final.

## Registro sugerido do teste

Para cada etapa, marcar:

- Status: `Aprovado`, `Falhou` ou `Bloqueado`
- Evidencia: print, video curto ou descricao do erro
- Observacao: impacto percebido e passos para reproduzir
