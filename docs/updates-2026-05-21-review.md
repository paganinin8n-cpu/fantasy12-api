# Atualizações 02 — Revisão de 21/05/2026

Fonte analisada:
- `/Users/roberson/Downloads/Atualizações_02_21_05_2026.pdf`

## Resumo executivo

O PDF traz três grupos de ajuste:

1. Regra comercial do `Bar`
2. Simplificação da `Dashboard`
3. Limpeza de promessa de produto que não existirá no MVP

No geral, as sugestões estão alinhadas com o produto atual e ajudam a deixar a experiência mais clara. O maior impacto está na regra comercial de `fichas`, porque isso mexe em copy, modelagem de pacotes e possivelmente no contrato de pagamento.

## Matriz de leitura

| Sugestão | Status atual | Prioridade | Área |
|---|---|---:|---|
| `Fichas` não podem ter desconto; cada ficha vale `R$ 0,50` | `Implementado` | Alta | Frontend + API |
| Pacotes do bar devem seguir o novo modelo comercial | `Implementado` | Alta | API + Frontend |
| `Duplas` e `Super Duplas` podem ser dadas, sem influenciar no valor | `Implementado` | Alta | API + Frontend |
| Regra de multiplicadores: `4 duplas` e `2 super duplas` por rodada | `Implementado` | Alta | API + Frontend |
| Remover `Estatísticas avançadas` | `Implementado` | Média | Frontend + Docs |
| Tabela redundante de `envio pendente` pode sair | `Implementado` | Média | Frontend |
| Card `Sua rodada` repete informações da faixa superior | `Implementado` | Média | Frontend |
| Consolidar dados da rodada na primeira tabela/bloco | `Implementado` | Média | Frontend |
| “Pode colocar botão pra cima” | `Implementado` | Baixa | Frontend |

## Leitura por item

### 1. Fichas sem desconto

Interpretação mais segura:
- `ficha` vira unidade monetária fixa do produto
- `1 ficha = R$ 0,50`
- logo, o usuário não deve perceber “bônus de valor” no pacote principal de fichas

Impacto:
- revisar `BarPage`
- revisar `PaymentPackage`
- revisar textos como `bonusCoins`, `coinsAmount` e equivalentes
- decidir se `coin` no sistema vira `ficha` na interface ou se `ficha` é só a nomenclatura comercial

Recomendação:
- tratar isso como ajuste de regra comercial e nomenclatura, não só de layout

### 2. Duplas e super duplas não entram no preço

Leitura funcional:
- o preço do pacote deve ser explicado pelas `fichas`
- `duplas` e `super duplas` entram como benefício adicional, não como composição explícita de preço

Impacto:
- o backend pode continuar concedendo benefícios por pacote/rodada
- o frontend deve apresentar `duplas` e `super duplas` como extras, não como fator de cobrança

### 3. Regra fixa de multiplicadores por rodada

Nova regra sugerida:
- `4 duplas`
- `2 super duplas`
- por rodada

Esse item precisa auditoria de implementação:
- concessão ao abrir rodada
- consumo no envio dos palpites
- exibição no resumo lateral e histórico

### 4. Remover “Estatísticas avançadas”

Esse item já aparece explicitamente no frontend atual como benefício PRO.

Estado encontrado:
- `/Users/roberson/dev/personal/fantasy12-frontend/src/pages/Subscription.tsx`

Recomendação:
- remover da lista de benefícios
- revisar FAQ e qualquer copy institucional que ainda prometa isso

### 5. Dashboard redundante

O PDF aponta corretamente uma duplicidade visual:
- faixa superior já mostra rodada, status e estado do envio
- depois há blocos adicionais que repetem parte da mesma informação

Estado encontrado:
- `/Users/roberson/dev/personal/fantasy12-frontend/src/pages/Dashboard.tsx`

Recomendação:
- consolidar `rodada + status + envio` no bloco hero superior
- simplificar ou remover o card `Sua rodada`
- reduzir o card de `Meu envio atual` para ação/resumo, sem repetir cabeçalhos equivalentes

### 6. “Botão pra cima”

Esse ponto está pouco específico no PDF. Pode significar:
- botão de voltar ao topo
- reposicionamento de CTA principal
- subir o botão de ação no layout

Recomendação:
- não implementar sem leitura visual do contexto exato da tela
- manter no backlog como ajuste de UX dependente de mock/screenshot

## Próximos ajustes recomendados

### Bloco 1 — prioridade imediata

1. Remover `Estatísticas avançadas` do produto visível
2. Simplificar a `Dashboard` para eliminar redundância entre hero, `Sua rodada` e `Meu envio atual`
3. Revisar a copy do `Bar` para separar claramente:
   - valor em fichas
   - extras de duplas/super duplas

### Bloco 2 — regra comercial

4. Definir oficialmente no backend e docs:
   - `1 ficha = R$ 0,50`
   - duplas/super duplas não compõem preço
5. Revisar pacotes para bater com esse modelo
6. Implementar a regra fixa de `4 duplas` e `2 super duplas` por rodada

## Conclusão

O PDF está coerente com a direção atual do produto. Os dois melhores ganhos imediatos são:

1. limpar a `Dashboard`
2. ajustar a promessa comercial do `Bar`

O item mais sensível tecnicamente é a regra de `fichas + multiplicadores`, porque ele atravessa frontend, backend e monetização.
