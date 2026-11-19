`# Ficha de Aplicação Extensionista: Rota Fantasma
`
`> **Rascunho.** Os campos marcados com **[preencher]** dependem do grupo, da escola ou do modelo
`> oficial da disciplina. As citações à BNCC estão marcadas para conferência no documento oficial.
`
`## 1. Identificação
`
`| Campo | Informação |
`|---|---|
`| Nome do jogo | **Rota Fantasma** |
`| Tema | Educação fiscal: para onde vai o tributo, o que é sonegação e por que pedir nota fiscal |
`| Disciplina | NP2: Tecnologia e Desenvolvimento de Jogos Digitais (Sistemas de Informação, 2026.2) |
`| Integrantes do grupo | **[preencher]** |
`| Professor(a) orientador(a) | **[preencher]** |
`| Parceiro extensionista | NAF (Núcleo de Apoio Contábil e Fiscal) **[confirmar o nome do NAF parceiro]** |
`| Escola ou turma de aplicação | **[preencher]** |
`| Link do jogo | https://pollymelo.github.io/Tecnologia-e-Desenvolvimento-de-Jogos-Digitais/ |
`| Código-fonte | https://github.com/pollymelo/Tecnologia-e-Desenvolvimento-de-Jogos-Digitais |
`
`## 2. Público-alvo
`
`- **Estudantes do Ensino Médio** (15 a 18 anos), sem conhecimento prévio de tributos.
`- **Mediador:** professor(a) da turma ou estudante extensionista do NAF. Não é preciso saber
`  programar nem conhecer o jogo a fundo: esta ficha e as fichas de solução bastam.
`
`## 3. Problema que o jogo enfrenta
`
`Jovens pagam tributos todos os dias, embutidos no preço do lanche, da roupa e do celular, mas
`raramente ligam isso aos serviços públicos que usam: hospital, creche, iluminação, biblioteca. A
`sonegação parece algo distante, "coisa de empresário", e pedir nota fiscal parece burocracia.
`
`## 4. Objetivos de aprendizagem
`
`**Geral:** compreender a função social do tributo e o papel do cidadão e da fiscalização para que
`ele chegue aos serviços públicos.
`
`**Específicos.** Ao final da aplicação, o estudante deve ser capaz de:
`1. explicar que o tributo já está no preço e que a sonegação tira dinheiro de serviços da cidade;
`2. diferenciar **indício**, **prova** e **boato**, e explicar por que punir exige prova;
`3. reconhecer práticas de sonegação: venda sem nota, nota fria, empresa de fachada, "laranja",
`   imóvel declarado menor que o real;
`4. reconhecer a nota fiscal como direito do consumidor e saber como conferi-la;
`5. saber que os gastos públicos são consultáveis no **Portal da Transparência**.
`
`**Relação com a BNCC** **[conferir na BNCC oficial]:**
`- Competência geral 7 (**argumentação**): o auto de infração só vale com provas que sustentem a
`  acusação.
`- Competência geral 10 (**responsabilidade e cidadania**): consequências da sonegação e de uma
`  acusação injusta.
`- Área de Ciências Humanas e Sociais Aplicadas: cidadania, Estado e o papel dos tributos.
`- Tema contemporâneo transversal de **educação fiscal** e de educação financeira.
`
`## 5. Como o jogo ensina (mecânica → aprendizagem)
`
`| Mecânica | O que ensina |
`|---|---|
`| Cada visita gasta 1 de 3 dias | Fiscalização tem custo e prazo: é preciso priorizar |
`| Escolher a abordagem dentro do local (documento × fofoca × pressão) | Prova vem de documento ou de testemunho direto, obtidos pelo caminho legal |
`| Moradores com dicas (2 verdades e 1 boato falso) | Boato não é prova, mesmo quando parece certo |
`| Caderno: o jogador risca os suspeitos sozinho | Raciocínio por eliminação: o jogo não pensa pelo aluno |
`| Auto de infração com 2 provas que diferenciem o culpado | Acusar exige fundamentação; acertar "no chute" anula o auto |
`| 4 desfechos (resolvido, anulado, injusto, prazo) | O erro também tem consequência: acusação injusta prejudica um inocente |
`| Resultado mostra para onde vai o dinheiro recuperado | Função social do tributo (hospital, creche, praça, biblioteca) |
`| Teste rápido antes e depois (3 perguntas) | Autoavaliação: o aluno vê o próprio progresso |
`
`**Os 4 casos** (destravados em sequência):
`
`| Caso | Tema | Serviço afetado |
`|---|---|---|
`| 001: A verba do hospital | Venda sem nota e sonegação | Hospital Municipal |
`| 002: A empresa fantasma | Nota fria, empresa de fachada e laranja | Creche Municipal |
`| 003: O IPTU esquecido | IPTU e a função social da cidade | Iluminação da praça |
`| 004: A nota que ninguém pede | O consumidor e a nota fiscal | Biblioteca Pública |
`
`## 6. Requisitos de infraestrutura
`
`| Item | Mínimo | Observação |
`|---|---|---|
`| Aparelho | 1 por dupla: computador, notebook ou celular | Funciona com teclado, mouse ou toque (direcional na tela) |
`| Navegador | Chrome, Edge, Firefox ou Safari atualizado | Não precisa instalar nada |
`| Internet | Para abrir o link | Depois de carregado, o jogo roda no navegador. **Recarregar a página precisa de internet de novo** |
`| Som | Opcional | Há botão para desligar; em sala, o ideal é sem som ou com fones |
`| Projetor | Recomendado | Para a abertura e o debate final |
`| Sem internet na escola | Um computador com o projeto serve o jogo na rede local (`npm run build` e um servidor local) | Exige apoio técnico do grupo |
`
`**Acessibilidade:** dá para jogar só com o teclado. Botões e personagens têm descrição para leitor
`de tela. Quando o sistema pede menos movimento, o jogo usa animações suaves (há também um botão para
`escolher). Termos difíceis abrem um glossário.
`
`**Dados pessoais:** o jogo **não tem login e não coleta nem envia dados**. O progresso fica salvo
`só no navegador do aparelho. O placar do teste rápido aparece na tela, e o mediador anota à mão.
`Isso é importante para aplicar com menores de idade.
`
`## 7. Plano de aplicação
`
`### Versão de 1 aula (50 minutos): caso 001
`
`| Tempo | Atividade | Quem conduz |
`|---|---|---|
`| 0–5 min | **Abertura.** Pergunta disparadora: "No preço de um lanche, quanto é imposto? Para onde ele vai?" Apresentar Vila Aurora e os "fantasmas da Aurora" | Mediador |
`| 5–8 min | Abrir o link em duplas e responder o **teste rápido (antes)** | Estudantes |
`| 8–33 min | **Jogar o caso 001.** O mediador circula, não dá respostas e anota observações (roteiro na seção 9) | Estudantes |
`| 33–43 min | **Debate** com as perguntas da tela de resultado. Comparar duplas que resolveram com as que tiveram o auto anulado ou fizeram acusação injusta | Mediador |
`| 43–48 min | **Teste rápido (depois)** e anotação do placar antes → depois de cada dupla | Estudantes e mediador |
`| 48–50 min | Fechamento: "o que você vai fazer diferente na próxima compra?" | Mediador |
`
`### Versão de 2 aulas (100 minutos): campanha
`
`Primeira aula como acima. Na segunda, cada dupla continua para os casos 002 a 004 (cerca de 20
`minutos por caso), e o debate final compara os temas: venda sem nota, nota fria, IPTU e o papel do
`consumidor. O **modo desafio** (culpado sorteado) serve para quem terminar antes e evita que a
`resposta "vaze" entre as duplas.
`
`### Papel do mediador
`
`- **Antes:** jogar o caso 001 uma vez e ler a ficha de solução
`  ([fichas-de-solucao.md](fichas-de-solucao.md)). Ela traz o culpado, a abordagem certa em cada
`  local, as duplas de provas válidas e quais moradores mentem. **Não mostrar aos estudantes.**
`- **Durante:** não dizer quem é o culpado. Se uma dupla travar por mais de 2 minutos, perguntar:
`  "Quem do caderno tem todos os indícios que vocês encontraram?"
`- **Entre duplas:** cada dupla usa um aparelho próprio ou uma aba anônima. Assim o teste rápido e as
`  dicas da Dona Helena aparecem de novo, e o progresso de uma dupla não abre casos para a seguinte.
`
`## 8. Avaliação da aprendizagem e da aplicação
`
`| Indicador | Como medir | Meta sugerida |
`|---|---|---|
`| Ganho no teste rápido | Placar antes → depois de cada dupla (de 0 a 3) | Média da turma sobe pelo menos 1 ponto |
`| Casos resolvidos | Desfecho de cada dupla | Mais da metade resolve o caso 001 |
`| Compreensão de prova × boato | Perguntas do debate e observações 2c e 2d do roteiro | Duplas justificam a acusação com as provas |
`| Engajamento | "Quis jogar de novo?" (roteiro) e satisfação de 1 a 5 | Maioria quer continuar |
`
`**Registro da turma** **[preencher após a aplicação]:**
`
`| Data | Escola/turma | Nº de duplas | Média antes | Média depois | Casos resolvidos | Observações |
`|---|---|---|---|---|---|---|
`| | | | | | | |
`
`## 9. Material de apoio (no repositório)
`
`| Material | Para quê |
`|---|---|
`| [GDD.md](GDD.md) | Design completo: mecânicas, regras e decisões |
`| [lore.md](lore.md) | História de Vila Aurora e dos 4 casos |
`| [fichas-de-solucao.md](fichas-de-solucao.md) | Soluções dos 4 casos (só para o mediador) |
`| [roteiro-teste-jogador.md](roteiro-teste-jogador.md) | O que observar durante a partida e o registro de ajustes |
`| [caso-001-suspeitos.md](caso-001-suspeitos.md) | Perfis dos suspeitos do caso 001, com notas para o mediador |
`
`## 10. Utilização e adaptação pelo NAF
`
`O NAF pode **criar casos novos sem programar**, só editando um arquivo de texto (JSON):
`
`1. Copiar um caso existente (`src/data/caso-00X.json`) e trocar suspeitos, locais, falas,
`   perguntas do teste e textos do resultado.
`2. **Regras que o arquivo precisa seguir:**
`   - até 10 locais e 4 moradores;
`   - cada local com uma única abordagem que revela a pista;
`   - nenhuma pista pode citar o nome do suspeito.
`
`   Se algo estiver errado, o jogo **mostra o erro ao carregar** e não abre um caso sem solução.
`3. Registrar o caso na lista `src/game/caso.ts`, rodar `npm test` e
`   `node scripts/gerar-fichas.mjs` (gera a ficha de solução do caso novo).
`4. Ao enviar para o GitHub, o jogo é **testado e publicado sozinho** no mesmo link.
`
`**Ideias de adaptação:**
`- um caso com o ISS de um prestador de serviço;
`- um caso sobre contrabando e pirataria;
`- um caso montado a partir de uma notícia da cidade da escola, com valores fictícios.
`
`**Simplificações conceituais (para o mediador comentar):** o jogo junta tributos de esferas
`diferentes sob um único "auditor fiscal". Na vida real, a venda sem nota envolve ICMS (estadual), a
`renda incompatível envolve o Imposto de Renda (federal), e o IPTU é municipal. "Funcionário sem
`carteira" é uma irregularidade trabalhista e aparece no jogo como indício de informalidade.
`Detalhes na seção 6 do GDD.
`
`## 11. Riscos e cuidados
`
`| Risco | Cuidado |
`|---|---|
`| Internet instável na escola | Testar o link antes; ter a versão local como reserva (seção 6) |
`| Duplas copiando a solução umas das outras | Usar o modo desafio, em que o culpado muda a cada partida |
`| Estudante associar o comércio local real a sonegação | Todos os nomes, empresas e valores são fictícios; reforçar isso na abertura |
`| Conteúdo fiscal simplificado | Comentar as simplificações no debate (seção 10) |
`| Aparelhos com tela pequena | Preferir computadores; no celular, usar o modo paisagem |
`
`## 12. Resultados da aplicação
`
`**[preencher depois de aplicar]:**
`- o que funcionou;
`- o que os estudantes não entenderam;
`- os ajustes feitos no jogo (registrar também no roteiro de teste);
`- um depoimento de um estudante ou do professor da turma, se houver autorização.
