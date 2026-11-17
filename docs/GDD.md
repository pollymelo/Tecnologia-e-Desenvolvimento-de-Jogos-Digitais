# GDD — Rota Fantasma

> Jogo educativo de **educação fiscal** para o **Ensino Médio**, no estilo investigação
> detetivesca. Personagens, empresas e valores são **fictícios**.

## 1. Problema

Muitos estudantes não relacionam a sonegação com a vida real. Para eles, comprar "sem nota" ou
deixar de recolher tributos parece um crime sem vítima. Também não percebem que os tributos
financiam serviços públicos, como o hospital da própria cidade, nem que a fiscalização depende
de **provas**, e não de suspeitas.

## 2. Objetivo

**Do jogador:** como auditor(a) fiscal, descobrir em **3 dias** qual comerciante está sonegando.
Para isso, visita locais, coleta indícios, descarta suspeitos no caderno e emite um
**auto de infração** fundamentado em provas.

**Pedagógico:**
1. **Função social do tributo:** a arrecadação que falta é a verba que o hospital deixou de receber.
2. **Raciocínio por evidências:** cruzar indícios para descartar suspeitos.
3. **Fiscalização exige fundamentação:** acusar sem provas suficientes anula o auto.
4. **Responsabilidade:** acusar a pessoa errada prejudica um comerciante honesto.
5. **Priorização:** a fiscalização tem prazo e custo, e nem todo local ajuda a resolver o caso.

## 2.1 Lore (resumo)

O jogo se passa em **Vila Aurora**, uma cidade fictícia que cresceu em volta do comércio. Há três
anos, a arrecadação cai sem explicação e o Hospital Municipal perde verba. Na cidade, esse dinheiro
que some é chamado de **"os fantasmas da Aurora"**.

**O título:** todo tributo percorre uma **rota**, do caixa da loja ao hospital. O dinheiro sonegado
sai dessa rota e vira um **fantasma**: existiu, mas nunca chega ao destino. O(a) jogador(a) é um(a)
auditor(a) novato(a), nascido(a) no próprio hospital, em seu **primeiro caso**.

O caso termina com um **gancho**: Ricardo comprava de uma **empresa fantasma** (a Distribuidora
Horizonte), o que abre caminho para novos casos.

Lore completa, com motivações dos personagens e ideias de casos futuros: [lore.md](lore.md).

## 3. Mecânicas

| Mecânica | Descrição |
|---|---|
| **Visitar local** | Custa **1 dia** e revela uma pista. Algumas pistas trazem um indício fiscal, outras dão apenas contexto. |
| **Caderno de suspeitos** | O jogador marca manualmente quem descartou. **O jogo não elimina ninguém sozinho**: o raciocínio é do jogador, e é aí que acontece a aprendizagem. |
| **Acusação (auto de infração)** | O jogador escolhe **1 suspeito** e **2 provas coletadas** que justifiquem a escolha. |
| **Resultado** | Há quatro desfechos diferentes, e cada um explica o acerto ou o erro. Todos terminam com perguntas para debate com o mediador. |

### Fluxo de telas (6 telas, HTML + CSS)

```
Briefing → Mapa dos locais (dias restantes + caderno) → Pista do local → Caderno de suspeitos → Acusação → Resultado (com perguntas para debate)
```

## 4. O caso 001

**Briefing:** o hospital municipal perdeu verba porque a arrecadação caiu. Uma denúncia anônima
diz que um comerciante da cidade está sonegando. O jogador tem **3 dias** para investigar.

### Suspeitos

| Suspeito | Vendas no cartão sem nota | Patrimônio incompatível com a renda | Funcionários sem carteira |
|---|:-:|:-:|:-:|
| Mercadinho Bom Preço (Aurélio) | — | ✔ | — |
| Oficina Turbo (Célia) | — | — | ✔ |
| **Eletrônicos TecMais (Ricardo)** | ✔ | ✔ | ✔ |
| Restaurante Sabor do Mar (Marta) | ✔ | — | ✔ |

**Culpado:** Ricardo, o único com os três indícios. A tabela foi montada para que a escolha dos locais importe:
- Cartão + patrimônio identifica Ricardo.
- Patrimônio + funcionários identifica Ricardo.
- Cartão + funcionários deixa a dúvida entre Ricardo e Marta.

Quem investiga bem resolve o caso em 2 ou 3 dias. Quem investiga mal desperdiça o prazo.

### Locais

| Local | Pista | Indício revelado |
|---|---|---|
| Operadora de cartão | As vendas no cartão do suspeito são muito maiores que as notas fiscais emitidas | Cartão sem nota |
| Cartório de imóveis e Detran | Compras à vista de imóvel e carro incompatíveis com a renda declarada | Patrimônio incompatível |
| Conversa com ex-funcionário | Trabalhou anos sem carteira assinada e sem FGTS | Funcionários sem carteira |
| Consumidores na praça | "Pedi nota e me disseram que sairia mais caro" | Cartão sem nota (versão mais fraca, um testemunho) |
| Junta Comercial | Todas as empresas estão com o registro em dia | Nenhum. Ensina que estar registrado não prova regularidade |
| Portal da Transparência | Mostra quanto o hospital deixou de receber | Nenhum. Dá contexto e liga o caso à função social do tributo |

A tabela traz o resumo de cada pista. Os textos finais, ajustados para deixar claro que a pista fala
do comerciante denunciado, estão em `src/data/caso-001.json`.

Os dois últimos locais não servem como prova, mas trazem conteúdo educativo:
- A **Junta Comercial** custa 1 dia e ensina a priorizar: estar registrado não prova regularidade.
- O **Portal da Transparência não gasta dia**, porque é um site público. Assim, o conteúdo mais
  educativo, o impacto no hospital, não vira um "local a evitar". Visitá-lo também deixa o
  **resultado final mais detalhado**.

## 5. Regras numéricas

| Regra | Valor |
|---|---|
| Prazo do caso | **3 dias** (reduzido de 4 para criar pressão: o caso se resolve com 2) |
| Custo de visitar um local | **1 dia**; o Portal da Transparência é **grátis** (0 dia) |
| Locais disponíveis | **6** (4 com indício, 2 sem indício) |
| Máximo de locais visitados por caso | **3 pagos + o Portal** (dos 6 disponíveis) |
| Suspeitos | **4** |
| Tipos de indício | **3** |
| Provas exigidas na acusação | **2** |
| Mínimo de visitas para resolver | **2** (com o par de locais certo) |
| Valores monetários do resultado | **ilustrativos e fictícios**, sinalizados na tela |

### Estrelas (desempenho)

Só um caso **resolvido** pontua. Cada critério vale 1 estrela:

| Estrela | Critério | O que reforça |
|:-:|---|---|
| ★ | Caso resolvido com provas válidas | Fundamentação |
| ★ | Sobrou pelo menos 1 dia | Priorização (fiscalização tem prazo) |
| ★ | Caderno em ordem: todos os inocentes riscados e o culpado não | Raciocínio por eliminação |

### Modos de jogo

| Modo | Como funciona | Para quê |
|---|---|---|
| **História** (padrão) | Culpado fixo: Ricardo. Segue a lore e a ficha de solução do mediador | Primeira partida e aplicação em sala |
| **Desafio** | As combinações de indícios são **sorteadas entre os suspeitos** a cada partida. A estrutura (culpado com 3 indícios, armadilha com 2, duas iscas com 1) se mantém, então sempre há solução | Rejogar sem que a resposta "vaze" entre colegas |

### Glossário

Termos destacados nas telas (indício, prova, auto de infração e os indícios do caso) abrem uma
explicação curta. Um botão **Glossário** no topo lista todos os 12 termos. Os verbetes ficam no JSON do
caso (`glossario`), então novos casos podem incluir novos termos.

### Validação da acusação

As duas provas escolhidas são **válidas** se:
1. as duas forem indícios que o culpado tem; **e**
2. juntas, descartarem todos os outros suspeitos.

### Esclarecimentos de regra (definidos na implementação)

- **Acusar não gasta dia.** Mesmo com 0 dias restantes, o jogador ainda pode emitir o auto.
- **Prazo encerrado** acontece quando os dias acabam e o jogador encerra sem acusar.
- Para acusar, é preciso ter visitado pelo menos **2 locais**. As provas são escolhidas entre os locais visitados.
- O **testemunho da praça** vale como prova de "cartão sem nota", igual à operadora. Escolher os dois juntos não diferencia ninguém, então o auto é anulado.
- Escolher um local **só de contexto** (Junta Comercial ou Portal) como prova anula o auto.
- Se o suspeito acusado é o errado, o resultado é **acusação injusta**, mesmo que as provas sejam boas.
- **As pistas falam sempre do comerciante denunciado**, cujo nome a denúncia não revela. O caderno mostra a
  tabela suspeitos × indícios, mas **cada coluna começa oculta ("?")** e só é revelada quando o jogador
  coleta uma pista daquele indício. Se a tabela inteira aparecesse no início, o culpado ficaria óbvio
  (é o único com três ✔). Assim, a pista diz o que o denunciado tem, o caderno mostra quem mais tem
  isso, e o jogador risca quem não tem.

### Direção de arte

- **Público:** jovens do Ensino Médio. A estética usa **bonecos de blocos** (cabeça quadrada, corpo
  de peças), um visual de brinquedo de montar que lembra os avatares de jogos populares entre eles.
  **Todos os personagens são originais**; o jogo não usa marca, logotipo nem personagem de outro jogo.
- **Mapa em estilo tabuleiro:** cidade com estrada oval e casinhas coloridas, o hospital no centro
  ("verba em falta") e a Auditoria como casa de partida. Os 6 locais são prédios desenhados. O
  **peão do auditor anda** até o local escolhido antes de a pista aparecer.
- **Personagens:** auditor(a) (jogador), os 4 suspeitos e uma **testemunha por local**, que conta a
  pista num balão de fala (Bia da operadora, Seu Jorge do cartório, Tião, Dona Lúcia e Rafa da Junta).
  No Portal da Transparência, quem lê a informação é o próprio auditor.
- **Resultado:** cena com um carimbo sobre o acusado: "Autuado", "Anulado", "Inocente" ou "Prazo encerrado".
- Toda a arte é SVG feito em código (`src/ui/arte.ts`), sem imagens externas. A aparência dos
  personagens e o ícone de cada local ficam no JSON do caso, então novos casos podem ter novos personagens.
- As animações respeitam a preferência do sistema por **movimento reduzido**.

### Feedback visual

| Elemento | Feedback |
|---|---|
| Dias restantes | Bolinhas no topo de todas as telas. A bolinha gasta "apaga" com animação; o contador fica amarelo com 1 dia e vermelho com 0 |
| Pistas novas | Selo "N nova(s)" pulsando no botão do caderno até ele ser aberto; destaque verde "Nova pista" na tela do local |
| Local sem indício | Caixa tracejada "Sem indício novo", explicando que a informação serve de contexto |
| Suspeitos riscados | Nome e empresa tachados em vermelho e linha esmaecida; contador "Riscados: N/4" no topo |
| Locais visitados | Marcados como "✔ Visitado" no tabuleiro; o peão fica parado ao lado do último local |
| Resultado | Verde com o valor recuperado (vitória) ou vermelho com o valor que continua faltando ao hospital (derrota) |

### Desfechos

| Situação | Resultado | O que ensina |
|---|---|---|
| Suspeito certo e duas provas válidas | **Caso resolvido.** O valor recuperado volta ao orçamento e a tela mostra o que ele financia | Função social do tributo |
| Suspeito certo, mas provas que não o diferenciam | **Auto anulado** por falta de fundamentação | A fiscalização precisa de provas, não de suspeita |
| Suspeito errado | **Acusação injusta.** Um comerciante honesto foi prejudicado e o sonegador segue impune | Responsabilidade da fiscalização |
| Dias esgotados sem acusação | **Prazo encerrado** | Fiscalização tem custo e prazo |

Os três desfechos ruins são diferentes e explicam o erro, o que atende ao critério de feedback
ao jogador e rende perguntas para o mediador.

## 6. Simplificações conceituais (intencionais)

- **Esfera do tributo:** na vida real, a venda de mercadoria sem nota envolve **ICMS (estadual)**,
  e a renda incompatível envolve o **Imposto de Renda (federal)**. Para o Ensino Médio, o jogo
  simplifica para "auditor fiscal" e "tributos". A simplificação é intencional.
- **Funcionários sem carteira:** é uma irregularidade **trabalhista e previdenciária**
  (contribuições e FGTS não recolhidos), não sonegação de imposto em sentido estrito. No jogo, ela
  aparece como **indício de informalidade**. Uma alternativa estritamente tributária seria
  "notas fiscais com valor abaixo do real".
- **Valores monetários:** todos são ilustrativos e fictícios.

## 7. Dados e continuidade

Todo o caso (briefing, suspeitos, locais, indícios e textos de resultado) fica em **um único
arquivo JSON**. O núcleo do jogo fica separado:
- `state.ts`: estado da partida (dias restantes, locais visitados, provas coletadas, descartes do caderno);
- `rules.ts`: regras (custo de visita, validação da acusação, desfecho).

**Potencial de continuidade (para a Ficha de Aplicação):** o NAF pode criar novos casos editando
apenas o JSON, sem mexer no código.

## 8. Stack

- **Vite** com TypeScript (template vanilla-ts)
- HTML + CSS
- Git/GitHub para versionamento
