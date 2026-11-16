# Caso 001: ficha de solução (uso do mediador)

> Material para quem aplica o jogo. **Não mostrar aos jogadores antes da partida.**

**Culpado:** Ricardo (Eletrônicos TecMais).
**Regra:** o auto é válido se as 2 provas forem indícios que Ricardo tem **e**, juntas, descartarem os outros três suspeitos.

## Indícios por local

| Sigla | Local | Indício |
|---|---|---|
| OP | Operadora de cartão | Cartão sem nota |
| CD | Cartório de imóveis e Detran | Patrimônio incompatível |
| EX | Conversa com ex-funcionário | Funcionários sem carteira |
| PR | Consumidores na praça | Cartão sem nota (testemunho) |
| JC | Junta Comercial | Nenhum (contexto) |
| PT | Portal da Transparência | Nenhum (contexto; libera o relatório detalhado) |

## As 15 duplas de provas (acusando Ricardo)

| # | Provas | Suspeitos que continuam possíveis | Resultado |
|:-:|---|---|---|
| 1 | OP + CD | Ricardo | ✅ **Caso resolvido** |
| 2 | CD + EX | Ricardo | ✅ **Caso resolvido** |
| 3 | CD + PR | Ricardo | ✅ **Caso resolvido** |
| 4 | OP + EX | Ricardo, Marta | ❌ Auto anulado |
| 5 | EX + PR | Ricardo, Marta | ❌ Auto anulado |
| 6 | OP + PR | Ricardo, Marta (mesmo indício duas vezes) | ❌ Auto anulado |
| 7 | OP + JC | Ricardo, Marta | ❌ Auto anulado |
| 8 | OP + PT | Ricardo, Marta | ❌ Auto anulado |
| 9 | PR + JC | Ricardo, Marta | ❌ Auto anulado |
| 10 | PR + PT | Ricardo, Marta | ❌ Auto anulado |
| 11 | CD + JC | Aurélio, Ricardo | ❌ Auto anulado |
| 12 | CD + PT | Aurélio, Ricardo | ❌ Auto anulado |
| 13 | EX + JC | Célia, Ricardo, Marta | ❌ Auto anulado |
| 14 | EX + PT | Célia, Ricardo, Marta | ❌ Auto anulado |
| 15 | JC + PT | todos | ❌ Auto anulado |

Acusar **qualquer outro suspeito** resulta em **acusação injusta**, sejam quais forem as provas.

### O que a tabela mostra
- **3 das 15 duplas** resolvem o caso, e **todas passam pelo Cartório/Detran**. O patrimônio incompatível é o único indício que separa Ricardo de Marta.
- Operadora e praça revelam o **mesmo indício**. Visitar as duas gasta um dia sem informação nova.
- Junta Comercial e Portal **nunca** servem como prova, mas o Portal enriquece o resultado final.

## Caminhos típicos (4 dias)

| Caminho | Dias usados | Desfecho provável |
|---|:-:|---|
| Cartório → Operadora → acusar | 2 | Resolvido, o caminho mais eficiente |
| Portal → Cartório → Ex-funcionário → acusar | 3 | Resolvido, com relatório detalhado |
| Operadora → Ex-funcionário → Praça → Junta | 4 | Sem como diferenciar Ricardo de Marta: auto anulado, acusação injusta ou prazo encerrado |
| Junta → Portal → Praça → Operadora | 4 | Nenhuma dupla válida: o auto é anulado se acusar Ricardo, e o prazo encerra se não acusar |

## Perguntas para o debate
- Por que o Cartório/Detran foi decisivo neste caso?
- Visitar a Operadora **e** a Praça ajudou? Por quê?
- O que o Portal da Transparência mostrou sobre o impacto da sonegação?
- Que tipo de nota fiscal você pode pedir no dia a dia, e por que ela importa?
