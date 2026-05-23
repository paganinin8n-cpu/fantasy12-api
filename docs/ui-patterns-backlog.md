# Backlog de Padrões de Tela

Referência analisada:

- `/Users/roberson/Downloads/stitch_fantasy12_pro_exclusive_section`

Conjuntos encontrados:

- `admin_create_round_form`
- `admin_rodadas_management`
- `admin_system_logs`
- `admin_user_management`
- `responsive_bar_store_details`
- `responsive_create_league_modal`
- `responsive_match_analysis_picks`
- `responsive_prediction_summary_modal`
- `responsive_profile_settings`

Uso recomendado deste documento:

- referencia de UX e padroes visuais
- backlog oficial consolidado em [`docs/backlog-master.md`](/Users/roberson/dev/personal/fantasy12-api/docs/backlog-master.md)

Ultima atualizacao:

- 2026-05-22

## Leitura geral

Esse material não deve ser tratado apenas como mockup isolado. Ele já define uma direção clara de produto para o Fantasy12:

- experiência mobile-first
- separação visual entre app do jogador, bar/loja e painel admin
- linguagem de cards, badges, bottom actions e estados rápidos
- foco em operação ágil para rodada, palpites, benefícios e administração

Em outras palavras: isso vira backlog de design system, UX e frontend, não apenas backlog de telas.

## Padrões visuais identificados

### 1. Linguagem principal do produto

- header escuro com marca forte
- fundo claro com cards brancos e bordas suaves
- cor primária laranja para ações principais e marca
- azul para `Dupla (2x)`
- roxo para `Super (4x)`
- verde para sucesso, saldo e confirmações
- badges pequenos e objetivos para estado da rodada e benefício ativo

### 2. Padrão de composição

- blocos em cards grandes com cantos arredondados
- ações principais no rodapé ou footer fixo
- componentes de escolha muito explícitos e táteis
- resumos em modal/overlay com confirmação final
- admin com navegação segmentada e listas operacionais

### 3. Padrão de densidade

- jogador: baixa densidade, foco em decisão rápida
- admin: média densidade, foco em controle operacional
- bar/loja: foco em pacotes, preço e CTA

## O que isso sugere para o produto

### Frente 1: App do jogador

Telas de referência:

- `responsive_match_analysis_picks`
- `responsive_prediction_summary_modal`
- `responsive_profile_settings`

Direção:

- fluxo principal deve ser mobile-first
- tela de análise/palpites precisa ser tratada como fluxo central do produto
- resumo dos palpites deve existir como etapa formal antes do envio
- perfil deve ter uma tela mais “produto” e menos “formulário cru”

### Frente 2: Bar e monetização

Telas de referência:

- `responsive_bar_store_details`

Direção:

- loja deve ter narrativa mais forte de pacotes e vantagens
- coins, duplas e super duplas precisam aparecer como economia integrada
- a UI de compra não deve parecer uma página administrativa

### Frente 3: Bolões

Telas de referência:

- `responsive_create_league_modal`

Direção:

- criação de bolão merece fluxo próprio e claro
- status premium/pro anual precisa aparecer na UX
- regras de entrada, período e observações precisam ser parte do contrato visual

### Frente 4: Painel admin

Telas de referência:

- `admin_rodadas_management`
- `admin_create_round_form`
- `admin_user_management`
- `admin_system_logs`

Direção:

- admin precisa parecer console operacional
- rodadas devem ter fluxo de criação, abertura, edição e acompanhamento
- usuários devem poder ser ajustados em coins e benefícios sem recorrer a banco
- logs devem existir como superfície real, não só como ideia

## Matriz de aderência ao estado atual

| Área | Situação atual | Aderência ao padrão |
|---|---|---|
| Login | existe e funciona | `Parcial` |
| Dashboard | existe, mas ainda sem a linguagem forte das referências | `Parcial` |
| Ticket / análise de palpites | funcional, mas ainda abaixo do padrão visual esperado | `Parcial` |
| Resumo de palpite | não consolidado como modal principal do fluxo | `Baixa` |
| Perfil | perfil editavel entregue; ainda precisa refinamento visual fino | `Parcial` |
| Bar / loja | Menu Tatico entregue para compra de duplas e super duplas; pacotes de fichas continuam no fluxo PIX | `Parcial` |
| Bolões | criacao visual para PRO anual e paginas ativas entregues; ainda cabe refinamento | `Parcial` |
| Admin rodadas | existe base funcional | `Parcial` |
| Admin usuários | endpoint e tela ativa entregues; ajustes operacionais continuam pendentes | `Parcial` |
| Admin logs | endpoint e tela ativa entregues; filtros e rotina operacional continuam pendentes | `Parcial` |

## Backlog proposto

### Prioridade alta

1. Consolidar o fluxo principal de palpites com base em `responsive_match_analysis_picks`

- transformar a tela de ticket em experiência mobile-first
- explicitar palpite grátis ativo, benefícios e estoque pago
- destacar CTA final e progresso da seleção

2. Implementar modal de resumo de palpite inspirado em `responsive_prediction_summary_modal`

- revisão final antes do envio
- destaque visual para `2x` e `4x`
- confirmação clara do envio de palpites

3. Revisar a BarPage usando `responsive_bar_store_details` como referência

- melhorar hierarquia de pacotes
- conectar coins, benefícios e vantagens táticas
- deixar o fluxo mais comercial e menos técnico
- manter Menu Tatico com compra de duplas e super duplas para qualquer usuario

4. Formalizar um mini design system do Fantasy12

- tokens de cor
- padrões de card
- padrões de badge/status
- padrões de CTA
- padrões de modal e footer fixo

### Prioridade média

5. Evoluir tela de perfil para o padrão de `responsive_profile_settings`

- estado PRO visível
- edição de dados com UX melhor
- ações de conta mais claras

6. Refinar fluxo visual de bolão com base em `responsive_create_league_modal`

- criação ja entregue
- restrições por plano
- comunicação clara de premium

7. Amadurecer superfícies admin baseadas nas referências

- rodadas
- usuários ja entregue como tela base
- logs ja entregue como tela base

### Prioridade estrutural

8. Separar backlog de UI por domínio

- jogador
- monetização/bar
- bolões
- admin

Isso ajuda a evitar que o frontend vire uma coleção de páginas desconectadas.

## Recomendação prática

O melhor uso desse material agora é:

1. tratar essas telas como referência oficial inicial de UX
2. escolher uma trilha por vez
3. começar pelo fluxo central do jogador

Ordem recomendada:

1. `ticket / análise`
2. `resumo do palpite`
3. `bar / loja`
4. `perfil`
5. `bolões`
6. `admin`

## Conclusão

Esse pacote de telas adiciona um detalhe importante ao backlog: o projeto não precisa apenas "funcionar"; ele precisa consolidar uma linguagem operacional e comercial própria.

O principal ganho aqui é clareza de direção:

- jogador: fluxo tático e rápido
- bar: conversão e vantagens
- admin: operação objetiva

Isso deve entrar no backlog oficial como frente de UX e padronização visual.
