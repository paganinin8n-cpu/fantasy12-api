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
| Exibir rodada no formato `001` com status visível e cor forte | Implementado | P1 | Frontend | O dashboard público já destaca a rodada ativa no formato `001` com badge de status. |
| Botão do palpite com copy mais forte, ex.: `Bora Mister!` | Implementado | P3 | Frontend / Copy | A home já usa CTA com esse tom sem perder a clareza funcional. |
| Classificação mensal `Geral` e `PRO`, mostrando top 10 e posição do usuário | Implementado | P1 | Backend / Frontend | O contrato público já expõe `scope=general|pro` e o dashboard alterna entre as duas leituras. |
| Após finalizar o envio, mudar estado visual do botão e abrir visualização sem edição | Implementado | P1 | Frontend | O fluxo já troca a ação principal e entra em revisão do envio sem permitir reenvio cego. |
| Depois do ranking, exibir botão do Bar | Implementado | P2 | Frontend | O dashboard já organiza a hierarquia com ranking seguido por Bar. |
| Mostrar bolões do usuário e bolões disponíveis para entrar | Implementado | P1 | Frontend / Backend | A página de bolões agora separa `Meus bolões` e `Disponíveis para entrar`, com entrada direta e por convite. |
| Menu superior direito com ações do perfil PRO | Implementado | P2 | Frontend | O header já tem menu com perfil, assinatura PRO, palpites, bar, bolões e administração. |
| Tela dos palpites finalizada sem opção de editar, só visual | Implementado | P1 | Frontend | O ticket carregado entra em modo de revisão visual depois do envio. |
| Remover palavras ligadas a `aposta/apostar` | Implementado no fluxo ativo | P1 | Frontend / Conteúdo | O produto ativo já usa `palpite/palpites`; restam apenas menções históricas em documentação de análise e rotas legadas. |
| Recuperação de login não funciona | Implementado | P0 | Backend / Frontend / Infra | O fluxo agora responde em produção com preview funcional e reset assinado mesmo sem tabela de tokens íntegra. |
| Pensar em botão voltar nas telas | Implementado | P2 | Frontend / UX | Auth, ticket, bar, bolões, histórico e perfil já receberam retorno explícito. |

## Leitura Consolidada

### Sugestões mais alinhadas ao que já existe

Estas sugestões conversam diretamente com a direção já consolidada do produto:

- classificação mensal `Geral` e `PRO`
- visualização final dos palpites sem edição
- reforço visual da rodada ativa
- organização melhor de bolões e bar
- remoção da linguagem de `aposta` no produto ativo

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

1. enriquecer o ranking mensal com participantes reais e posição do usuário assim que houver snapshots do período;
2. evoluir bolões com ranking interno e descoberta mais rica conforme a base crescer;
3. revisar apenas documentação histórica e rotas legadas que ainda mencionem a nomenclatura antiga.

### Médio prazo

1. consolidar conteúdo institucional e FAQ com a nova linguagem do produto;
2. evoluir bolões com superfícies próprias de detalhe e ranking interno;
3. adicionar componentes de navegação reutilizáveis para manter o padrão de retorno entre telas.

## Relação Com O Backlog Mestre

Estas sugestões se conectam principalmente com:

- `P1.7 Fechar ranking FREE, PRO e boloes premium`
- `P1.10 Consolidar fluxo principal de palpites`
- `P1.12 Revisar UX da BarPage`
- `P1.13 Evoluir tela de perfil`
- `P2` de refinamento de UX e produto

O item de recuperação de senha deve ser tratado como exceção:

- ele entra mais perto de `P0/P1`, porque afeta acesso real à plataforma.
