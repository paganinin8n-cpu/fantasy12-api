# Revisão Do PDF De Atualizações 18/05/2026

Documento analisado:

- `/Users/roberson/Downloads/Atualizações_01_18_05_2026 (1).pdf`

## Objetivo

Transformar as sugestões do PDF em uma matriz prática para execução no Fantasy12, separando:

- o que já foi atendido
- o que está parcial
- o que ainda precisa entrar no backlog

## Matriz De Sugestões

| Sugestão do PDF | Status atual | Prioridade | Área | Observação |
|---|---|---:|---|---|
| Exibir rodada no formato `001` com status visível e cor forte | Parcial | P1 | Frontend | O dashboard já mostra rodada e status, mas ainda não no formato “placa operacional” com forte destaque visual. |
| Botão do palpite com copy mais forte, ex.: `Bora Mister!` | Não iniciado | P3 | Frontend / Copy | Faz sentido como tom de produto, mas deve ser usado com cuidado para não competir com a copy funcional principal. |
| Classificação mensal `Geral` e `PRO`, mostrando top 10 e posição do usuário | Parcial | P1 | Backend / Frontend | Está alinhado com a direção do produto, mas ainda precisa revisão explícita da implementação final. |
| Após finalizar o bilhete, mudar estado visual do botão e abrir visualização sem edição | Parcial | P1 | Frontend | O fluxo já carrega ticket enviado em modo de revisão, mas ainda cabe refinamento visual/comportamental. |
| Depois do ranking, exibir botão do Bar | Não iniciado | P2 | Frontend | É uma decisão de hierarquia da home/dashboard. |
| Mostrar bolões do usuário e bolões disponíveis para entrar | Parcial | P1 | Frontend / Backend | A área de bolões já existe, mas ainda precisa melhorar descoberta e separação entre “meus” e “disponíveis”. |
| Menu superior direito com ações do perfil PRO | Não iniciado | P2 | Frontend | Faz sentido para organizar melhor navegação e recursos premium. |
| Tela dos palpites finalizada sem opção de editar, só visual | Parcial | P1 | Frontend | Já existe revisão sem reenvio automático, mas ainda pode evoluir como tela final dedicada. |
| Remover palavras ligadas a `aposta/apostar` | Parcial | P1 | Frontend / Conteúdo | As telas principais já caminharam para `palpite/palpites`, mas ainda vale revisão final em FAQ, conteúdos institucionais e bordas do produto. |
| Recuperação de login não funciona | Não validado / provável bug operacional | P0 | Backend / Frontend / Infra | A feature existe no código e nas rotas. O ponto provável é integração de email/ambiente, não ausência de implementação. |
| Pensar em botão voltar nas telas | Não iniciado | P2 | Frontend / UX | Boa melhoria transversal, especialmente para auth, ticket, bar, bolões e histórico. |

## Leitura Consolidada

### Sugestões mais alinhadas ao que já existe

Estas sugestões conversam diretamente com a direção já consolidada do produto:

- classificação mensal `Geral` e `PRO`
- visualização final dos palpites sem edição
- reforço visual da rodada ativa
- organização melhor de bolões e bar
- remoção da linguagem de `aposta`

### Sugestões que apontam bug real ou risco real

O item mais importante do PDF é:

- recuperação de login não funciona

Esse ponto merece investigação funcional imediata, porque:

- a rota frontend existe (`/forgot-password`, `/reset-password`)
- a API existe (`/api/auth/forgot-password`, `/api/auth/reset-password`)
- o schema já tem `password_reset_tokens`

Então o problema parece ser mais de integração real do fluxo do que de ausência de código.

### Sugestões mais de refino do que de bloqueio

Estas são boas, mas não travam uso real:

- `Bora Mister!`
- formato `001`
- botão voltar genérico
- menu superior mais elaborado

## Recomendações De Execução

### Curto prazo

1. validar a recuperação de senha ponta a ponta;
2. revisar o dashboard para destacar rodada, status e ranking mensal;
3. fechar a visualização final do envio já concluído;
4. revisar todos os textos restantes para remover linguagem de `aposta`.

### Médio prazo

1. reorganizar a home/dashboard com a ordem:
   - rodada ativa
   - classificação mensal
   - bar
   - bolões
2. evoluir o menu superior do perfil PRO;
3. adicionar padrões de navegação com botão voltar onde fizer sentido.

## Relação Com O Backlog Mestre

Estas sugestões se conectam principalmente com:

- `P1.7 Fechar ranking FREE, PRO e boloes premium`
- `P1.10 Consolidar fluxo principal de palpites`
- `P1.12 Revisar UX da BarPage`
- `P1.13 Evoluir tela de perfil`
- `P2` de refinamento de UX e produto

O item de recuperação de senha deve ser tratado como exceção:

- ele entra mais perto de `P0/P1`, porque afeta acesso real à plataforma.
