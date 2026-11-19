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
| **Andar pelo mapa** | O jogador conduz o boneco pelas ruas (teclado, direcional na tela ou clique). Andar não gasta dia. |
| **Visitar local** | Entrar custa **1 dia**. Lá dentro, o jogador **escolhe uma abordagem** entre três (pedir documento, conversar, observar...). Só a abordagem certa revela a pista com o indício; as outras gastam a visita e ensinam por que não servem como prova. |
| **Moradores** | Três moradores andam pelas ruas. Encostar num deles (ou clicar) faz ele contar uma dica de graça, anotada no caderno. Duas falas são verdade e uma é **boato falso**: nenhuma vale como prova. |
| **Imprevistos** | A cada partida, um local pago fica **fechado** no dia 1 e outro no dia 2 (greve, reforma, falta de luz...). Ele reabre no dia seguinte. Alguns locais só **aparecem no mapa** depois de outra visita (ex.: a casa do sócio-laranja, descoberta na Junta Comercial). |
| **Caderno de suspeitos** | O jogador marca manualmente quem descartou. **O jogo não elimina ninguém sozinho**: o raciocínio é do jogador, e é aí que acontece a aprendizagem. |
| **Acusação (auto de infração)** | O jogador escolhe **1 suspeito** e **2 provas coletadas** que justifiquem a escolha. |
| **Resultado** | Há quatro desfechos diferentes, e cada um explica o acerto ou o erro. Todos terminam com perguntas para debate com o mediador. |

### Fluxo de telas (HTML + CSS)

```
Arquivo de casos → Briefing do caso → (Teste rápido) → Mapa (andar, entrar, escolher a abordagem, ouvir moradores)
→ Caderno de suspeitos → Acusação → Resultado (explicação, perguntas para debate, próximo caso)
```

### Campanha: arquivo de casos

A tela inicial é o **arquivo de casos** da Auditoria. Só o caso 001 começa aberto; **resolver um caso
destrava o próximo**. As melhores estrelas de cada caso ficam salvas no navegador (`localStorage`),
então o progresso continua depois de fechar a página. Resumo dos casos em `docs/lore.md` e soluções em
`docs/fichas-de-solucao.md`.

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
| Casos | **4**, destravados em sequência |
| Locais por caso | **9** (5 com indício, 4 de contexto; até 10 cabem no mapa) |
| Abordagens por local | **3**, e só **1** revela a pista |
| Máximo de locais visitados por caso | **3 pagos + o Portal** (dos 9 disponíveis) |
| Moradores por caso | **3** (2 falas verdadeiras e 1 boato falso) |
| Imprevistos por partida | **1 local fechado no dia 1** e **1 no dia 2** (sorteados entre os pagos) |
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

### Textos variados das pistas

Cada local tem **3 versões** do texto da pista (campo `variacoes` no JSON), e o jogo sorteia uma a cada
partida, nos dois modos. Todas as versões revelam o **mesmo indício**, só muda a forma como a
testemunha conta, e **nenhuma cita nome ou empresa de suspeito**, o que um teste automático confere.
Assim, quem joga de novo não lê sempre as mesmas falas, e a solução do caso não muda.

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
- **Mapa de Vila Aurora visto de cima:** 3 ruas e 4 transversais formando quarteirões, com calçada, faixa e faixa de pedestre. Cada prédio fica num lote com a porta virada para a rua; o hospital fica no quarteirão do meio, a Auditoria (partida) embaixo, e lotes vagos viram pracinha
  ("verba em falta") e a Auditoria como casa de partida. Os 6 locais são prédios desenhados. O
  **peão do auditor anda** até o local escolhido antes de a pista aparecer.
- **Personagens:** auditor(a) (jogador), os 4 suspeitos e uma **testemunha por local**, que conta a
  pista num balão de fala (Bia da operadora, Seu Jorge do cartório, Tião, Dona Lúcia e Rafa da Junta).
  No Portal da Transparência, quem lê a informação é o próprio auditor.
- **Resultado:** cena com um carimbo sobre o acusado: "Autuado", "Anulado", "Inocente" ou "Prazo encerrado".
- Toda a arte é SVG feito em código (`src/ui/arte.ts`), sem imagens externas. A aparência dos
  personagens e o ícone de cada local ficam no JSON do caso, então novos casos podem ter novos personagens.
- As animações respeitam a preferência do sistema por **movimento reduzido**.

### Mapa e controle do peão

O jogador **anda com o boneco** pelas ruas de Vila Aurora:

| Entrada | Como funciona |
|---|---|
| **Teclado** | Setas ou **W A S D**. Segurar a tecla anda; soltar para. **Shift** corre (1,75× mais rápido, passos mais curtos e corpo inclinado). Na diagonal, o peão desliza pela borda da rua |
| **Celular** | **Direcional na tela** (fixo no canto, em telas de toque): segurar a seta anda; o botão **»** do meio liga e desliga a corrida |
| **Mouse / toque no mapa** | Clicar na rua (ou na grama) faz o peão ir andando até ali, **pelo caminho mais curto pelas ruas** |
| **Clicar num local** | O peão vai sozinho até a porta e entra (atalho e acessibilidade: cada local é um botão) |

**Entrar num local:** parado na rua em frente ao prédio (ou na calçada), aparece o aviso **"Entrar"** acima da cabeça do boneco, com o custo
(1 dia ou grátis) e a casa ganha contorno dourado. **Espaço**, **Enter** ou **E** (ou tocar em
"Entrar") faz o peão entrar. Andar não gasta dia; só **entrar** gasta. Local já visitado ou sem dias
suficientes mostra o motivo no aviso.

**Para parecer um personagem:**
- o boneco **vira para onde anda**: de lado indo para os lados (espelhado à esquerda), de costas subindo, de frente descendo;
- **partida e parada suaves**: a velocidade sobe e desce em cerca de 0,1 s, sem arranque seco;
- **as setas tiram o controle da caminhada automática**: se o jogador clicou num local e se arrependeu, uma seta cancela a visita no meio do caminho, sem gastar dia;
- o **morador chamado para e espera**; na conversa, os dois ficam frente a frente e se olham.

**Para ser natural de andar** (`src/ui/mapa.ts`):
- o peão só anda em ruas e calçadas; nunca atravessa prédio nem grama;
- ao bater na borda, ele **desliza** ao longo da rua em vez de travar;
- **ajuda na curva:** segurando "cima" a até 11 unidades de uma transversal ou calçada, o peão é
  puxado para ela, então não é preciso alinhar no pixel para virar a esquina;
- a página e o mapa rolam sozinhos para o peão não sair de vista.

O mapa tem **10 lotes** para locais, em 4 colunas e 3 linhas (a validação do JSON recusa caso com mais de 10). O prédio do meio muda com o caso: hospital, creche, praça ou biblioteca.

### Animação da visita (sequência)

Ao entrar num local (pela porta ou clicando nele):

| # | Animação | Duração aproximada |
|:-:|---|---|
| 1 | Se o jogador clicou no local de longe, o boneco **caminha pelas ruas** até a porta, pelo caminho mais curto, com ciclo de passos (pernas alternadas, braços balançando, corpo quicando) | até 3,2 s, conforme a distância |
| 2 | Ele vai até a **porta**, que **abre**; ele **entra** e a casa **acende** (janelas amarelas e brilho) | cerca de 1,1 s |
| 3 | **O dia passa:** o céu escurece, aparecem lua e estrelas, uma **bolinha de dia se apaga** e amanhece. O Portal da Transparência, que é grátis, não tem noite | cerca de 1,7 s |
| 4 | O **card da pista vira** (efeito 3D) sobre o tabuleiro, com a testemunha e a fala | cerca de 0,65 s |
| 5 | Em **Guardar no caderno**, o card **voa até o botão do caderno** e o boneco sai da casa | cerca de 0,55 s |

Durante a sequência, novos cliques são ignorados. A animação usa `requestAnimationFrame` e a Web
Animations API, sem bibliotecas (`src/ui/animacao.ts`).

**Acessibilidade:** se o sistema pede **movimento reduzido** (comum no Windows com "efeitos de
animação" desligados), o jogo usa **animações suaves**. O boneco ainda anda, mais rápido e sem pulos
nem balanço, e os giros e zooms viram fades. Na tela inicial, o botão **"Animações: completas / suaves"**
deixa a pessoa escolher.

### Som

Efeitos curtos, **sintetizados no navegador** com a Web Audio API (`src/ui/som.ts`). Não há
arquivos de áudio, então não há nada para baixar nem problema de direito autoral.

| Momento | Som |
|---|---|
| Caminhada | Passos a cada ~0,28 s |
| Porta abrindo | Rangido curto |
| O dia passa | Acorde grave (noite) e dois piados (amanhecer) |
| Card da pista | Sininho de duas notas |
| Guardar no caderno | "Vuuush" |
| Riscar suspeito | Risco de lápis |
| Resultado | Carimbo, seguido de fanfarra (resolvido) ou duas notas descendo (demais desfechos) |

O botão **"Som: ligado / desligado"** fica na tela inicial e no HUD. A escolha fica salva no navegador.

### Tutorial (Dona Helena)

Na **primeira partida da sessão**, a chefe da Auditoria (ver a lore) dá **4 dicas**, uma por vez, e
o elemento da dica pisca com um contorno dourado: o tabuleiro, os dias, o caderno e o botão do auto
de infração. Dá para pular, e o botão **Dicas** no HUD reabre o tutorial. O tutorial não volta
sozinho em "Jogar novamente".

### Explicação do resultado

Depois de qualquer acusação, a tela de resultado mostra **por que** ela deu certo ou errado:
- **cada prova:** que indício aponta e se a pessoa acusada tem esse indício (local sem indício
  aparece como "não serve de prova");
- **cada outro suspeito:** qual indício o descarta ou, se nenhum descarta, que ele "também tem"
  os indícios das provas. É assim que o auto é anulado;
- **acusação injusta:** quem tinha todos os indícios do caso.

A explicação é calculada pelas regras (`explicarAcusacao` em `rules.ts`), então funciona também no
modo desafio e em novos casos do NAF.

### Teste rápido (antes e depois): medir o aprendizado

São **3 perguntas** de múltipla escolha (campo `quiz` do JSON): **sem nota fiscal**, **patrimônio
incompatível = indício, não prova** e **Portal da Transparência**.

1. Antes da primeira partida, o jogador responde sem ver as respostas certas (pode pular).
2. No resultado, o cartão **"Teste rápido: e agora?"** chama para responder **as mesmas perguntas**.
3. Depois, a tela mostra o placar **Antes X/3 → Depois Y/3**, a resposta certa e uma explicação de
   cada pergunta.

O teste aparece **uma vez por sessão**. Assim, o placar mede a primeira partida e serve de dado
para o roteiro de teste com jogadores e para o relatório.

### Escolhas dentro do local: por que só uma abordagem dá prova

Cada local tem três abordagens. A certa costuma ser **pedir o documento oficial** ou **conversar com
calma com quem viu**; as erradas são fofoca, palpite, pressão ou "dar uma olhada". O texto de cada
abordagem errada explica a lição: palpite não é prova, sigilo bancário existe, testemunha assustada não
fala, observar de longe não mostra nada. A visita gasta o dia mesmo com a abordagem errada, então
escolher bem importa. Em todos os casos, o indício que separa o culpado da armadilha aparece em pelo
menos dois locais, e há de 6 a 9 duplas de provas válidas: um erro não trava o caso, mas custa tempo.

### Feedback visual

| Elemento | Feedback |
|---|---|
| Dias restantes | Bolinhas no topo de todas as telas. A bolinha gasta "apaga" com animação; o contador fica amarelo com 1 dia e vermelho com 0 |
| Pistas novas | O card voa até o botão do caderno, que ganha o selo "N nova(s)" pulsando até ser aberto; destaque verde "Nova pista" no card |
| Local sem indício | Caixa tracejada "Sem indício novo", explicando que a informação serve de contexto |
| Suspeitos riscados | Nome e empresa tachados em vermelho e linha esmaecida; contador "Riscados: N/4" no topo |
| Locais visitados | Marcados como "✔ Visitado" no mapa; o peão sai pela porta do último local |
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
- **GitHub Pages** para publicar: cada push na `main` testa, gera o build e publica (GitHub Actions)

## 9. Ficha de Aplicação Extensionista

> Como o Rota Fantasma pode ser usado numa ação educativa mediada pelo **NAF da Unichristus**, nas
> iniciativas de Cidadania Fiscal da Receita Federal. Os itens seguem a seção 6.1 do enunciado da NP2.
> Campos **[preencher]** só podem ser completados pela equipe ou depois da aplicação.

| Campo | Informação |
|---|---|
| Jogo | Rota Fantasma: <https://pollymelo.github.io/Tecnologia-e-Desenvolvimento-de-Jogos-Digitais/> |
| Código-fonte | <https://github.com/pollymelo/Tecnologia-e-Desenvolvimento-de-Jogos-Digitais> |
| Mediação | Extensionista do NAF da Unichristus ou professor(a) da turma |
| Escola ou turma da primeira aplicação | **[preencher]** |

### 9.1 Público esperado e faixa etária

- **Estudantes do Ensino Médio, de 15 a 18 anos** (1ª a 3ª série), sem conhecimento prévio de tributos.
- Linguagem do dia a dia (lanche, loja, celular, praça). Termos técnicos (auto de infração, indício,
  nota fria, IPTU, dívida ativa) aparecem sublinhados e abrem um **glossário**.
- Jogo em **duplas**: um controla o boneco e o outro cuida do caderno, e os dois decidem juntos a acusação.

### 9.2 Objetivo educativo da atividade

Levar o estudante a perceber que **o tributo já está no preço do que ele compra** e que a sonegação
tira dinheiro de serviços que ele usa (hospital, creche, iluminação, biblioteca). Ao final, ele deve
conseguir:

1. ligar a arrecadação aos serviços públicos (**função social do tributo**);
2. diferenciar **indício, prova e boato**, e explicar por que punir alguém exige prova;
3. reconhecer práticas de sonegação: venda sem nota, nota fria, empresa de fachada, "laranja" e
   imóvel declarado menor que o real;
4. reconhecer a **nota fiscal como direito do consumidor** e saber conferi-la;
5. saber que os gastos públicos podem ser consultados no **Portal da Transparência** (controle social).

O jogo cobre quatro linhas temáticas do enunciado: função social dos tributos, sonegação e suas
consequências, cidadania fiscal e controle social, e consumo consciente e documentos fiscais.

### 9.3 Duração aproximada

| Formato | Duração | Conteúdo |
|---|---|---|
| **Uma aula** (recomendado para a primeira aplicação) | **50 min** | Caso 001, com teste rápido antes e depois e debate |
| **Duas aulas** | **100 min** | Caso 001 na primeira aula; casos 002 a 004 e debate comparando os temas na segunda |
| Partida de um caso | 15 a 25 min | Varia com a leitura e as escolhas da dupla |

**Roteiro da aula de 50 minutos:**

| Tempo | Atividade |
|---|---|
| 0–5 min | Abertura com a pergunta disparadora: "No preço de um lanche, quanto é imposto? Para onde ele vai?" |
| 5–8 min | As duplas abrem o link e respondem o **teste rápido (antes)**, com 3 perguntas |
| 8–33 min | Jogam o caso 001. O mediador circula e observa, sem dar respostas |
| 33–43 min | **Debate** com as perguntas da tela de resultado (item 9.8) |
| 43–48 min | **Teste rápido (depois)**. O mediador anota o placar antes → depois de cada dupla |
| 48–50 min | Fechamento: "O que você vai fazer diferente na próxima compra?" |

### 9.4 Equipamentos necessários

- **1 aparelho por dupla:** computador, notebook, tablet ou celular. No computador, joga-se com
  teclado (setas ou W A S D) ou mouse; no celular, com toque e um direcional na tela. Computador ou
  tablet é melhor, porque no celular o mapa fica pequeno.
- **Navegador atualizado** (Chrome, Edge, Firefox ou Safari).
- **Projetor** (recomendado) para a abertura e o debate.
- **Som:** opcional. O jogo tem botão para desligar; em sala, o ideal é jogar sem som ou com fones.

### 9.5 Necessidade de conexão com a Internet

- **Sim, para abrir o jogo.** Ele é um site e carrega pelo link.
- Depois de carregado, o jogo roda inteiro no navegador. Se a internet cair durante a partida, dá para
  continuar, mas **recarregar a página exige conexão de novo**.
- **Sem internet na escola:** um computador com o projeto pode servir o jogo na rede local
  (`npm run build` e um servidor local). Isso exige alguém da equipe e não é uma opção para o mediador
  fazer sozinho.

### 9.6 Contas, licenças, instalações ou dependências

| Para quem | O que precisa |
|---|---|
| **Estudantes e mediador** | **Nada:** sem conta, sem login, sem instalação e sem licença paga. Só o navegador e o link |
| **NAF, para criar ou editar casos** | Editor de texto para os arquivos JSON. Para testar e publicar: Node.js 20 ou mais recente, `npm install` (bibliotecas abertas e gratuitas: Vite, TypeScript, Vitest) e uma conta no GitHub para enviar as alterações; a publicação no link é automática |

**Dados pessoais:** o jogo **não coleta nem envia nenhum dado**. O progresso (casos destravados e
estrelas) fica só no navegador do aparelho. O placar do teste rápido aparece na tela, e o mediador
anota à mão. Isso facilita a aplicação com menores de idade.

### 9.7 Instruções básicas para o mediador

**Antes da aula**
1. Abrir o link no aparelho da escola e testar (conexão, tela, som).
2. Jogar o caso 001 uma vez, de 15 a 20 minutos.
3. Ler a ficha de solução ([docs/fichas-de-solucao.md](fichas-de-solucao.md)). Ela traz o culpado,
   a abordagem certa em cada local, as duplas de provas válidas e quais moradores mentem.
   **Não mostrar aos estudantes.**

**Para iniciar**
1. Cada dupla abre o link. Na tela **Arquivo de casos**, clica em **Investigar** no caso 001 e depois
   em **Começar investigação**.
2. As duplas respondem as 3 perguntas do teste rápido. Dá para pular, mas aí não há placar.
3. A Dona Helena dá 4 dicas de como jogar. Se precisar, o botão **Dicas** reabre o tutorial.

**Durante a partida**
- Não dizer quem é o culpado. Se uma dupla travar por mais de 2 minutos, perguntar: "Quem do caderno
  tem **todos** os indícios que vocês encontraram?"
- Lembrar que **boato de morador não é prova** e que, dentro de cada local, a abordagem escolhida importa.
- Duplas que terminarem antes podem jogar o **modo desafio** (culpado sorteado) ou seguir para o
  caso 002, que se abre ao resolver o 001.

**Entre turmas ou duplas no mesmo aparelho**
- Usar uma **aba anônima** ou limpar os dados do site. Assim o teste rápido e as dicas aparecem de
  novo, e o progresso de uma dupla não abre casos para a próxima.

### 9.8 Questões para discussão depois do uso

**Gerais (servem para qualquer caso):**
1. Quais serviços públicos da sua cidade são pagos com tributos? Qual deles você usou esta semana?
2. Por que uma suspeita, mesmo correta, não basta para punir alguém?
3. Que diferença faz pedir a nota fiscal, para você e para a cidade?
4. Algum morador contou um boato falso? Como vocês decidiram em quem acreditar?
5. O que pode acontecer com um comerciante acusado injustamente?

**Por desfecho:** a tela de resultado mostra duas perguntas específicas. Exemplo do caso 001:

| Desfecho | Perguntas |
|---|---|
| Caso resolvido | Quais serviços públicos da sua cidade são pagos com tributos? Por que pedir nota fiscal ajuda a evitar a sonegação? |
| Auto anulado | Que dupla de provas teria fundamentado a acusação? Por que uma suspeita, mesmo correta, não basta para punir alguém? |
| Acusação injusta | Que consequências uma acusação injusta pode trazer para um comerciante? Que indício faltava para descartar o suspeito acusado? |
| Prazo encerrado | Quais locais trouxeram informação útil e quais não? Como vocês escolheriam os locais se jogassem de novo? |

**Por tema:**

| Caso | Pergunta |
|---|---|
| 002 | O que pode acontecer com quem empresta o nome para abrir uma empresa para outra pessoa? |
| 003 | É justo um imóvel grande pagar o mesmo IPTU que uma casa pequena? |
| 004 | Como garantir que uma campanha de cidadania não vire "caça às bruxas"? |

**Dica de condução:** comparar uma dupla que resolveu o caso com uma que teve o auto anulado, com a
mesma pergunta "que provas vocês usaram?", costuma render o melhor debate.

### 9.9 Limitações conhecidas e cuidados para aplicação

| Limitação ou risco | Cuidado |
|---|---|
| **Simplificação conceitual:** o jogo reúne tributos de esferas diferentes sob um "auditor fiscal". Na vida real, venda sem nota envolve ICMS (estadual), renda incompatível envolve Imposto de Renda (federal) e IPTU é municipal; "funcionário sem carteira" é irregularidade trabalhista | Comentar no debate (seção 6 deste GDD) |
| Precisa de internet para abrir | Testar o link antes; ter a versão local como reserva (item 9.5) |
| **Testado só no Edge** (computador e celular simulado) | Testar o navegador da escola antes da aula |
| No celular, o mapa fica pequeno | Preferir computador ou tablet; no celular, usar a tela deitada |
| O progresso fica salvo no aparelho | Usar aba anônima entre duplas (item 9.7) |
| O placar do teste rápido não é registrado automaticamente | O mediador anota à mão (tabela abaixo) |
| Duplas podem copiar a solução umas das outras | Usar o modo desafio, em que o culpado muda a cada partida |
| Estudantes podem associar comerciantes reais à sonegação | Todos os nomes, empresas e valores são fictícios; reforçar isso na abertura |
| Ainda **não foi aplicado com estudantes** | Primeira aplicação com observação (roteiro em [docs/roteiro-teste-jogador.md](roteiro-teste-jogador.md)) e ajustes registrados |

**Registro da aplicação** **[preencher]:**

| Data | Escola/turma | Nº de duplas | Média do teste antes | Média do teste depois | Casos resolvidos | Observações |
|---|---|---|---|---|---|---|
| | | | | | | |

### 9.10 Potencial de uso e adaptação pelo NAF

O NAF pode **criar casos novos sem programar**, editando um arquivo JSON:

1. Copiar um caso existente (`src/data/caso-00X.json`) e trocar suspeitos, locais, falas, perguntas
   e textos do resultado.
2. **Regras que o arquivo precisa seguir:**
   - até 10 locais e 4 moradores;
   - cada local com uma única abordagem que revela a pista;
   - nenhuma pista pode citar o nome de um suspeito.

   Se algo estiver errado, o jogo mostra o erro ao carregar e não abre um caso sem solução.
3. Incluir o caso na lista `src/game/caso.ts`, rodar `npm test` e
   `node scripts/gerar-fichas.mjs` (gera a ficha de solução do caso novo).
4. Ao enviar para o GitHub, o jogo é testado e publicado sozinho no mesmo link.

**Ideias de casos:**
- o ISS de um prestador de serviço;
- contrabando e pirataria;
- um caso baseado numa notícia da cidade da escola, com nomes e valores fictícios.
