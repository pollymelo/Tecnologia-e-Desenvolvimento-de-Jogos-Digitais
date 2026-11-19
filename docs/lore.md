# Lore: Rota Fantasma

> Cidade, personagens e acontecimentos são **fictícios**. A lore serve ao objetivo pedagógico:
> cada elemento da história ajuda a explicar a função social do tributo.

## O título

Todo tributo percorre uma **rota**: sai do caixa da loja, passa pela nota fiscal, entra no
orçamento público e chega à escola, ao posto de saúde, ao hospital.

Quando alguém sonega, o dinheiro sai dessa rota e vira um **fantasma**. Ele existiu (a venda
aconteceu e o cliente pagou), mas nunca chega ao destino. Ninguém o vê sumir; só se percebe a falta
dele: um remédio que acabou, uma ala que fechou, uma ambulância parada.

O trabalho de quem joga é **seguir a rota do fantasma** e trazer esse dinheiro de volta.

## O mundo: Vila Aurora

Vila Aurora é uma cidade média do interior que cresceu em volta do comércio. Lojas, oficinas,
restaurantes e mercadinhos fazem a economia girar, e a maior parte da população conhece os donos
pelo nome.

O orgulho da cidade é o **Hospital Municipal de Vila Aurora**, que atende também as cidades vizinhas.
Quase todo mundo nasceu lá, levou um filho lá ou foi atendido lá.

Há **três anos**, a arrecadação de Vila Aurora começou a cair, mesmo com o comércio cheio e as vendas
no cartão crescendo. A conta não fecha: se as lojas vendem mais, por que entra menos tributo?
O resultado aparece no hospital. A farmácia fica sem medicamentos, a ala de pediatria ameaça fechar
e a ambulância passa mais tempo na oficina do que na rua.

Na cidade, o povo começou a chamar esse dinheiro que some de **"os fantasmas da Aurora"**.

## Quem joga: o(a) auditor(a)

Você nasceu no Hospital Municipal de Vila Aurora. Estudou na escola pública da cidade, passou no
concurso e acaba de entrar na **Auditoria Fiscal do município**. Este é o seu **primeiro caso**.

A sua chefe, **Dona Helena**, auditora veterana a poucos meses da aposentadoria, entrega o caso com
um conselho que resume o jogo:

> "Suspeita não autua ninguém. Prova autua. E lembre: do outro lado de cada caso tem um comerciante,
> e do outro lado de cada tributo tem um hospital."

Você tem **3 dias** porque o prazo para incluir o valor recuperado no orçamento do próximo trimestre
está acabando. Se perder esse prazo, o hospital fica mais três meses sem a verba.

## O caso 001: "A verba do hospital"

Uma **denúncia anônima** chega à Auditoria: um dos comerciantes da rua principal está vendendo sem
nota. A denúncia não diz qual.

### Os suspeitos

| Personagem | Quem é | O que a lore explica |
|---|---|---|
| **Aurélio**, Mercadinho Bom Preço | Dono do mercadinho há mais de 20 anos, vende fiado para meio bairro. | Comprou uma casa nova à vista com a **herança do pai**. O dinheiro tem origem legal, mas aparece como "patrimônio incompatível" nos registros. Ensina que **um indício sozinho não prova nada**. |
| **Célia**, Oficina Turbo | Mecânica mais procurada da cidade. | Nos dias de movimento chama ajudantes "por fora", sem carteira. É uma irregularidade **trabalhista**, não sonegação, e ela precisa se regularizar. Ensina que **nem toda irregularidade é o crime investigado**. |
| **Ricardo**, Eletrônicos TecMais | Abriu a loja há 5 anos e cresceu mais rápido que todo mundo. | **O fantasma do caso.** Oferece "desconto sem nota", recebe no cartão muito mais do que declara e usou o dinheiro sonegado para comprar casa e carro à vista. Os ajudantes também trabalham sem registro. |
| **Marta**, Restaurante Sabor do Mar | Dona do restaurante mais cheio da orla. | Acha a nota fiscal "burocracia" e, nos dias cheios, deixa de emitir. Também tem garçons sem carteira. Não é a pessoa denunciada, mas está no caminho errado. É a **armadilha do caso**: parece culpada para quem investiga pela metade. |

### As testemunhas

| Personagem | Onde está | Papel |
|---|---|---|
| **Bia** | Operadora de cartão | Analista que cruza as vendas no cartão com as notas emitidas. |
| **Seu Jorge** | Cartório de imóveis e Detran | Escrevente há 30 anos; sabe quem comprou o quê na cidade. |
| **Tião** | Casa dele | Ex-funcionário da TecMais; trabalhou anos sem carteira e saiu sem FGTS. |
| **Dona Lúcia** | Praça | Cliente que pediu nota e ouviu que "sairia mais caro". Leva a neta ao hospital toda semana. |
| **Rafa** | Junta Comercial | Atendente que mostra que todas as empresas estão com o registro em dia, o que não prova que pagam os tributos. |

## O que acontece depois (desfechos na lore)

- **Caso resolvido:** Ricardo é autuado e o valor recuperado volta ao orçamento. A farmácia do hospital
  é reabastecida e a ala de pediatria continua aberta. Dona Helena assina o seu primeiro relatório.
- **Auto anulado:** você acusou a pessoa certa, mas sem provas que se sustentem. O auto cai e o fantasma
  continua solto.
- **Acusação injusta:** um comerciante honesto vira notícia na cidade por algo que não fez. A confiança
  na Auditoria diminui.
- **Prazo encerrado:** o trimestre fecha sem a verba. O hospital espera mais três meses.

## O gancho para os próximos casos

Ao revisar as notas de compra da TecMais, você encontra um detalhe: boa parte das mercadorias de Ricardo
veio de um fornecedor chamado **Distribuidora Horizonte**. No endereço da Horizonte há um terreno baldio.

**Uma empresa que só existe no papel: uma empresa fantasma.** Ricardo não agia sozinho. Os fantasmas da
Aurora têm uma rota, e ela está só começando.

### A primeira temporada: quatro casos

Os quatro casos estão no jogo (`src/data/caso-00X.json`) e são destravados em sequência. O gancho de
cada caso leva ao seguinte.

| Caso | Tema fiscal | O que falta na cidade | Culpado (modo história) | Gancho para o próximo |
|---|---|---|---|---|
| 001: A verba do hospital | Venda sem nota e sonegação | Verba do Hospital Municipal | Ricardo, Eletrônicos TecMais | A Distribuidora Horizonte, que só existe no papel |
| 002: A empresa fantasma | Nota fria, empresa de fachada e laranja | Obra da Creche Municipal parada | Otávio, Materiais de Construção Pedra Firme | Um galpão enorme cadastrado como "casa pequena" no Jardim Aurora |
| 003: O IPTU esquecido | IPTU e a função social da cidade | Praça do Jardim Aurora sem luz | Henrique, Galpão Estrela | O anúncio "desconto sem nota" e a campanha dos alunos |
| 004: A nota que ninguém pede | O consumidor e a nota fiscal | Livros novos da Biblioteca Pública | Bruno, Lanchonete Mordida | Dona Helena se aposenta: "agora a cidade inteira aprendeu a olhar" |

Personagens que voltam: Seu Jorge (cartório), Rafa (Junta Comercial), Bia (operadora de cartão),
Dona Lúcia (feira), Seu Ademar (banco) e Dr. Paulo (contador). Cada caso tem também **três moradores**
que andam pelas ruas: dois contam verdades e um espalha um boato falso.

## Como a lore aparece no jogo

| Onde | O quê |
|---|---|
| Briefing | Abertura sobre Vila Aurora, os "fantasmas" e o primeiro caso do auditor |
| Testemunhas | Nomes e falas em balão (Bia, Seu Jorge, Tião, Dona Lúcia, Rafa) |
| Portal da Transparência | Mostra o "fantasma" em números: quanto o hospital deixou de receber |
| Resultado (caso resolvido) | Gancho da Distribuidora Horizonte, a deixa para o caso 002 |

Os textos do jogo ficam em `src/data/caso-001.json` (campos `abertura` e `gancho`).
