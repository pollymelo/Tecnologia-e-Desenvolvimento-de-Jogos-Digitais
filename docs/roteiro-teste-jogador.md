# Roteiro de teste com jogador de fora

> Objetivo: ver se alguém que **nunca viu o jogo** entende as regras, usa o caderno e chega
> a um resultado sem ajuda. Duração: cerca de 15 minutos por pessoa.

## Antes

- Rode `npm run dev` e abra o jogo no navegador. Teste também no celular, se possível.
- Perfil ideal do testador: estudante do Ensino Médio ou alguém sem conhecimento de tributos.
- Diga apenas: *"É um jogo sobre fiscalização de tributos. Jogue como achar melhor e pense em voz alta."*
- **Não explique as regras e não ajude**, a menos que a pessoa fique travada por mais de 1 minuto. Anote quando isso acontecer.

## Durante: o que observar

| # | Observação | Sim | Não | Anotações |
|:-:|---|:-:|:-:|---|
| 1 | Leu o briefing e entendeu que precisa achar **um** comerciante entre quatro? | | | |
| 2 | Percebeu que cada local custa 1 dia (olhou as bolinhas e o contador de dias)? | | | |
| 3 | Notou o aviso de "Nova pista" e abriu o caderno? | | | |
| 4 | Entendeu as colunas "?" do caderno, que se revelam com as pistas? | | | |
| 5 | Riscou suspeitos por conta própria? | | | |
| 6 | Riscou os suspeitos **certos** (quem não tem o indício)? | | | |
| 7 | Entendeu que precisa de 2 provas que **diferenciem** o suspeito? | | | |
| 8 | Leu o resultado e as perguntas de debate até o fim? | | | |
| 9 | Algum texto foi lido em voz alta com dúvida ou travou a leitura? Qual? | | | |
| 10 | Quis jogar de novo? | | | |

Registre também:
- **Locais visitados, em ordem:**
- **Resultado obtido:** resolvido / auto anulado / acusação injusta / prazo encerrado
- **Tempo total de jogo:**

## Depois: perguntas ao testador

1. Explique com suas palavras o que você tinha que fazer no jogo.
2. Por que o comerciante que você acusou era (ou não era) o culpado?
3. Teve algum momento em que você não soube o que fazer? Qual?
4. Alguma palavra ou frase ficou confusa? (por exemplo: "auto de infração", "indício", "patrimônio incompatível")
5. O que o jogo mostrou sobre para onde vai o dinheiro dos tributos?
6. De 1 a 5, quanto você gostou? O que mudaria?

## Registro de ajustes

Preencha depois de cada teste. Todo texto do caso fica em `src/data/caso-001.json`. Os textos fixos
das telas ficam em `src/ui/app.ts`.

| Data | Testador | Problema observado | Ajuste feito | Arquivo |
|---|---|---|---|---|
| | | | | |
| | | | | |
| | | | | |

### Ajustes já feitos na revisão interna (antes do teste externo)

| Problema | Ajuste |
|---|---|
| As pistas diziam "do suspeito" sem deixar claro de quem se tratava | Todas as pistas agora falam do **comerciante denunciado** |
| O briefing não deixava claro que a denúncia não diz o nome | O briefing passou a dizer: "um destes quatro comerciantes está sonegando, mas não diz qual" |
| O testemunho da praça parecia valer menos que um documento, sem explicação | A tela da pista explica que o testemunho indica o mesmo que um documento, mas vem de uma conversa |
| Não estava claro como usar o caderno | Instrução fixa no caderno: "A pessoa denunciada tem todos os indícios encontrados. Risque quem não tem algum deles." |
| Locais sem indício pareciam inúteis | A tela avisa: "Esta informação não serve como prova, mas ajuda a entender o caso." |
