# Fichas de solução (uso do mediador)

> Material para quem aplica o jogo. **Não mostrar aos jogadores antes da partida.**
> Arquivo gerado por `node scripts/gerar-fichas.mjs` a partir de `src/data/caso-*.json`.
> Vale para o **modo história** (no modo desafio, o culpado é sorteado).

**Regra do auto:** as provas (2 na maioria dos casos; 3 no caso 007) precisam ser indícios que o culpado tem **e**, juntas, descartar todos os
outros suspeitos. Cada visita só rende o indício se o jogador escolher a **abordagem certa** dentro do local.

## Caso 001: A verba do hospital

**Tema:** Venda sem nota e sonegação. **Culpado:** Ricardo (Eletrônicos TecMais). **Dias:** 3. **Provas exigidas:** 2.

### Suspeitos

| Suspeito | Indícios | Papel |
|---|---|---|
| Aurélio (Mercadinho Bom Preço) | Patrimônio incompatível com a renda | inocente |
| Célia (Oficina Turbo) | Funcionários sem carteira (indício de informalidade) | inocente |
| Ricardo (Eletrônicos TecMais) | Vendas no cartão sem nota, Patrimônio incompatível com a renda, Funcionários sem carteira (indício de informalidade) | **culpado** |
| Marta (Restaurante Sabor do Mar) | Vendas no cartão sem nota, Funcionários sem carteira (indício de informalidade) | armadilha |

### Locais e abordagem certa

| Local | Indício | Abordagem que revela | Observação |
|---|---|---|---|
| Operadora de cartão | Vendas no cartão sem nota | Pedir o relatório de vendas no cartão |  |
| Cartório de imóveis e Detran | Patrimônio incompatível com a renda | Pedir as certidões de imóveis e veículos |  |
| Conversa com ex-funcionário | Funcionários sem carteira (indício de informalidade) | Conversar com calma, sem pressa |  |
| Concessionária Aurora Motors | Patrimônio incompatível com a renda | Conversar com a vendedora | testemunho |
| Consumidores na praça | Vendas no cartão sem nota | Ouvir os consumidores | testemunho |
| Banco Aurora | Nenhum (contexto) | Pedir o extrato da empresa denunciada |  |
| Junta Comercial | Nenhum (contexto) | Consultar o cadastro das quatro empresas |  |
| Portal da Transparência | Nenhum (contexto) | Ver a receita e a verba do hospital | grátis |
| Escritório Contábil Soma | Nenhum (contexto) | Perguntar como funciona a declaração |  |

### Duplas que resolvem o caso (6 de 36)

- Operadora de cartão + Cartório de imóveis e Detran
- Operadora de cartão + Concessionária Aurora Motors
- Cartório de imóveis e Detran + Conversa com ex-funcionário
- Cartório de imóveis e Detran + Consumidores na praça
- Conversa com ex-funcionário + Concessionária Aurora Motors
- Concessionária Aurora Motors + Consumidores na praça

### Moradores

| Morador | A fala é |
|---|---|
| Seu Nonato, carteiro | verdade |
| Duda, estudante | **boato falso** |
| Dona Cida, aposentada | verdade |

## Caso 002: A empresa fantasma

**Tema:** Nota fria e empresa de fachada. **Culpado:** Otávio (Materiais de Construção Pedra Firme). **Dias:** 3. **Provas exigidas:** 2.

### Suspeitos

| Suspeito | Indícios | Papel |
|---|---|---|
| Otávio (Materiais de Construção Pedra Firme) | Compras da Horizonte sem mercadoria (notas frias), Parente que aparece como sócio de empresa de fachada, Dinheiro pago a fornecedor que volta para a própria conta | **culpado** |
| Sandra (Farmácia Bem-Estar) | Compras da Horizonte sem mercadoria (notas frias), Dinheiro pago a fornecedor que volta para a própria conta | armadilha |
| Jonas (Papelaria Ponto Final) | Parente que aparece como sócio de empresa de fachada | inocente |
| Fátima (Mercadinho Boa Vista) | Dinheiro pago a fornecedor que volta para a própria conta | inocente |

### Locais e abordagem certa

| Local | Indício | Abordagem que revela | Observação |
|---|---|---|---|
| Junta Comercial | Parente que aparece como sócio de empresa de fachada | Pedir o contrato social da Horizonte |  |
| Secretaria da Fazenda | Compras da Horizonte sem mercadoria (notas frias) | Cruzar as notas da Horizonte com as entregas |  |
| Transportadora Rápido | Compras da Horizonte sem mercadoria (notas frias) | Conversar com os motoristas | testemunho |
| Banco Aurora | Dinheiro pago a fornecedor que volta para a própria conta | Apresentar o pedido oficial, com autorização |  |
| Endereço da Horizonte | Nenhum (contexto) | Conversar com o vizinho |  |
| Casa do sócio da Horizonte | Parente que aparece como sócio de empresa de fachada | Conversar com calma | aparece depois de: Junta Comercial; testemunho |
| Feira de Sábado | Nenhum (contexto) | Ouvir os feirantes |  |
| Portal da Transparência | Nenhum (contexto) | Ver a verba da creche | grátis |
| Associação Comercial | Nenhum (contexto) | Perguntar como a Horizonte vendia |  |

### Duplas que resolvem o caso (6 de 36)

- Junta Comercial + Secretaria da Fazenda
- Junta Comercial + Transportadora Rápido
- Junta Comercial + Banco Aurora
- Secretaria da Fazenda + Casa do sócio da Horizonte
- Transportadora Rápido + Casa do sócio da Horizonte
- Banco Aurora + Casa do sócio da Horizonte

### Moradores

| Morador | A fala é |
|---|---|
| Tonho, entregador | verdade |
| Bete, boleira | **boato falso** |
| Seu Zeca, aposentado | verdade |

## Caso 003: O IPTU esquecido

**Tema:** IPTU e a função social da cidade. **Culpado:** Henrique (Galpão Estrela (festas e eventos)). **Dias:** 3. **Provas exigidas:** 2.

### Suspeitos

| Suspeito | Indícios | Papel |
|---|---|---|
| Henrique (Galpão Estrela (festas e eventos)) | Construção maior do que a cadastrada, Comércio funcionando em imóvel cadastrado como casa, IPTU sem pagar há anos (dívida ativa) | **culpado** |
| Rosa (Pousada Recanto) | Construção maior do que a cadastrada, IPTU sem pagar há anos (dívida ativa) | armadilha |
| Gilberto (Oficina do Gil) | Comércio funcionando em imóvel cadastrado como casa | inocente |
| Neusa (Salão Beleza Pura) | IPTU sem pagar há anos (dívida ativa) | inocente |

### Locais e abordagem certa

| Local | Indício | Abordagem que revela | Observação |
|---|---|---|---|
| Prefeitura: Cadastro Imobiliário | Construção maior do que a cadastrada | Comparar o cadastro com a foto aérea |  |
| Vistoria com o fiscal de obras | Construção maior do que a cadastrada | Medir a construção junto com o fiscal | testemunho |
| Rua dos vizinhos | Comércio funcionando em imóvel cadastrado como casa | Conversar com os vizinhos | testemunho |
| Lan House do Beto | Comércio funcionando em imóvel cadastrado como casa | Pesquisar anúncios do endereço |  |
| Procuradoria: Dívida Ativa | IPTU sem pagar há anos (dívida ativa) | Consultar a dívida dos quatro imóveis |  |
| Associação de Moradores | Nenhum (contexto) | Ler o abaixo-assinado |  |
| Cartório de Imóveis | Nenhum (contexto) | Pedir as matrículas dos quatro imóveis |  |
| Portal da Transparência | Nenhum (contexto) | Ver o IPTU arrecadado no bairro | grátis |
| Companhia de Energia | Comércio funcionando em imóvel cadastrado como casa | Apresentar o ofício e pedir o histórico de consumo |  |

### Duplas que resolvem o caso (9 de 36)

- Prefeitura: Cadastro Imobiliário + Rua dos vizinhos
- Prefeitura: Cadastro Imobiliário + Lan House do Beto
- Prefeitura: Cadastro Imobiliário + Companhia de Energia
- Vistoria com o fiscal de obras + Rua dos vizinhos
- Vistoria com o fiscal de obras + Lan House do Beto
- Vistoria com o fiscal de obras + Companhia de Energia
- Rua dos vizinhos + Procuradoria: Dívida Ativa
- Lan House do Beto + Procuradoria: Dívida Ativa
- Procuradoria: Dívida Ativa + Companhia de Energia

### Moradores

| Morador | A fala é |
|---|---|
| Juca, pipoqueiro | verdade |
| Lara, skatista | **boato falso** |
| Seu Messias, eletricista | verdade |

## Caso 004: A nota que ninguém pede

**Tema:** O consumidor e a nota fiscal. **Culpado:** Bruno (Lanchonete Mordida). **Dias:** 3. **Provas exigidas:** 2.

### Suspeitos

| Suspeito | Indícios | Papel |
|---|---|---|
| Bruno (Lanchonete Mordida) | Entrega 'cupom' que não é documento fiscal, Maquininha de cartão em nome de outra empresa, Compra mercadoria do fornecedor sem nota | **culpado** |
| Cláudia (Loja de Roupas Estilo) | Entrega 'cupom' que não é documento fiscal, Compra mercadoria do fornecedor sem nota | armadilha |
| Wagner (Açougue Bom Corte) | Maquininha de cartão em nome de outra empresa | inocente |
| Yara (Sorveteria Gelato) | Compra mercadoria do fornecedor sem nota | inocente |

### Locais e abordagem certa

| Local | Indício | Abordagem que revela | Observação |
|---|---|---|---|
| Escola Estadual (campanha) | Entrega 'cupom' que não é documento fiscal | Ver os cupons conferidos no aplicativo |  |
| Procon | Entrega 'cupom' que não é documento fiscal | Ler as reclamações dos consumidores | testemunho |
| Operadora de cartão | Maquininha de cartão em nome de outra empresa | Consultar o cadastro da maquininha |  |
| Conversa com ex-atendente | Maquininha de cartão em nome de outra empresa | Conversar com calma | testemunho |
| Atacado Central | Compra mercadoria do fornecedor sem nota | Conferir as notas de venda do atacado |  |
| Escritório Contábil Soma | Nenhum (contexto) | Perguntar como funciona a cadeia da nota |  |
| Rádio Aurora FM | Nenhum (contexto) | Perguntar sobre a campanha no ar |  |
| Portal da Transparência | Nenhum (contexto) | Ver a verba da biblioteca | grátis |
| Depósito dos fundos | Compra mercadoria do fornecedor sem nota | Conferir as caixas e as notas de entrada | aparece depois de: Atacado Central |

### Duplas que resolvem o caso (8 de 36)

- Escola Estadual (campanha) + Operadora de cartão
- Escola Estadual (campanha) + Conversa com ex-atendente
- Procon + Operadora de cartão
- Procon + Conversa com ex-atendente
- Operadora de cartão + Atacado Central
- Operadora de cartão + Depósito dos fundos
- Conversa com ex-atendente + Atacado Central
- Conversa com ex-atendente + Depósito dos fundos

### Moradores

| Morador | A fala é |
|---|---|
| Mel, aluna da campanha | verdade |
| Seu Osvaldo, taxista | **boato falso** |
| Professora Irene | verdade |

## Caso 005: O barato que sai caro

**Tema:** Pirataria, descaminho e consumo consciente. **Culpado:** Diego (Conecta Celulares). **Dias:** 3. **Provas exigidas:** 2.

### Suspeitos

| Suspeito | Indícios | Papel |
|---|---|---|
| Diego (Conecta Celulares) | Vende aparelho com a marca copiada (pirataria), Mercadoria do exterior que entrou sem pagar os tributos (descaminho), Vende produto sem o selo obrigatório de segurança | **culpado** |
| Marta (Bazar Mil Coisas) | Vende aparelho com a marca copiada (pirataria), Vende produto sem o selo obrigatório de segurança | armadilha |
| Caio (Games Point) | Mercadoria do exterior que entrou sem pagar os tributos (descaminho) | inocente |
| Sueli (Brinquedos Alegria) | Vende produto sem o selo obrigatório de segurança | inocente |

### Locais e abordagem certa

| Local | Indício | Abordagem que revela | Observação |
|---|---|---|---|
| Receita Federal (aduana) | Mercadoria do exterior que entrou sem pagar os tributos (descaminho) | Consultar as apreensões e as declarações de importação |  |
| Rodoviária | Mercadoria do exterior que entrou sem pagar os tributos (descaminho) | Conversar com o carregador de malas | testemunho |
| Escritório da fabricante | Vende aparelho com a marca copiada (pirataria) | Pedir para conferir os números de série |  |
| Assistência técnica | Vende aparelho com a marca copiada (pirataria) | Perguntar que aparelhos chegam com defeito | testemunho |
| Procon | Vende produto sem o selo obrigatório de segurança | Ler as reclamações dos consumidores | testemunho |
| Laboratório de ensaios | Vende produto sem o selo obrigatório de segurança | Pedir o laudo dos carregadores apreendidos | aparece depois de: Procon |
| Agência dos Correios | Nenhum (contexto) | Perguntar como chega uma compra do exterior |  |
| Escola Estadual (grêmio) | Nenhum (contexto) | Perguntar o que a turma anda comprando |  |
| Portal da Transparência | Nenhum (contexto) | Ver a verba dos bombeiros | grátis |

### Duplas que resolvem o caso (8 de 36)

- Receita Federal (aduana) + Escritório da fabricante
- Receita Federal (aduana) + Assistência técnica
- Receita Federal (aduana) + Procon
- Receita Federal (aduana) + Laboratório de ensaios
- Rodoviária + Escritório da fabricante
- Rodoviária + Assistência técnica
- Rodoviária + Procon
- Rodoviária + Laboratório de ensaios

### Moradores

| Morador | A fala é |
|---|---|
| Dona Cida, costureira | verdade |
| Pedro, motoboy | **boato falso** |
| Seu Nestor, bombeiro aposentado | verdade |

## Caso 006: Serviço sem nota

**Tema:** ISS e a nota fiscal de serviço. **Culpado:** Rodrigo (Academia Força Total). **Dias:** 3. **Provas exigidas:** 2.

### Suspeitos

| Suspeito | Indícios | Papel |
|---|---|---|
| Rodrigo (Academia Força Total) | Recebe dos clientes na conta pessoal, não na da empresa, Emite poucas notas de serviço (NFS-e), Atende muitos clientes todos os dias | **culpado** |
| Lívia (Clínica de Estética Bella) | Recebe dos clientes na conta pessoal, não na da empresa, Atende muitos clientes todos os dias | armadilha |
| Tiago (Estúdio de Tatuagem Traço) | Recebe dos clientes na conta pessoal, não na da empresa, Emite poucas notas de serviço (NFS-e) | armadilha |
| Patrícia (Autoescola Via Certa) | Emite poucas notas de serviço (NFS-e) | inocente |
| Marcelo (Pet Shop Banho & Tosa) | Atende muitos clientes todos os dias | inocente |

### Locais e abordagem certa

| Local | Indício | Abordagem que revela | Observação |
|---|---|---|---|
| Secretaria Municipal de Finanças | Emite poucas notas de serviço (NFS-e) | Consultar as notas de serviço emitidas |  |
| Conversa com ex-recepcionista | Emite poucas notas de serviço (NFS-e) | Conversar com calma | testemunho |
| Banco Aurora | Recebe dos clientes na conta pessoal, não na da empresa | Apresentar o pedido oficial da fiscalização |  |
| Praça do Centro | Recebe dos clientes na conta pessoal, não na da empresa | Conversar com quem passa pela praça | testemunho |
| Corpo de Bombeiros (vistoria) | Atende muitos clientes todos os dias | Consultar os pedidos de vistoria |  |
| Lan House do Beto | Atende muitos clientes todos os dias | Pesquisar as redes sociais do endereço | testemunho |
| Escritório Contábil Soma | Nenhum (contexto) | Perguntar o que conta como sonegação de ISS |  |
| Prefeitura: cadastro do ISS | Nenhum (contexto) | Perguntar como funciona o cadastro do ISS |  |
| Portal da Transparência | Nenhum (contexto) | Ver a verba do ginásio | grátis |

### Duplas que resolvem o caso (4 de 36)

- Secretaria Municipal de Finanças + Corpo de Bombeiros (vistoria)
- Secretaria Municipal de Finanças + Lan House do Beto
- Conversa com ex-recepcionista + Corpo de Bombeiros (vistoria)
- Conversa com ex-recepcionista + Lan House do Beto

### Moradores

| Morador | A fala é |
|---|---|
| Seu Arlindo, porteiro | verdade |
| Bia, estudante | **boato falso** |
| Professora Irene | verdade |

## Caso 007: A obra que nunca terminou

**Tema:** Corrupção e controle social. **Culpado:** Vanessa (Construtora Alicerce). **Dias:** 4. **Provas exigidas:** 3.

### Suspeitos

| Suspeito | Indícios | Papel |
|---|---|---|
| Vanessa (Construtora Alicerce) | Recebeu por etapa da obra que não foi feita (medição falsa), Cobrou preço muito acima do mercado, Não tem trabalhadores nem máquinas para o serviço que cobrou, Sacou em dinheiro vivo logo depois de cada pagamento | **culpado** |
| Edson (Concreto Forte) | Recebeu por etapa da obra que não foi feita (medição falsa), Cobrou preço muito acima do mercado, Sacou em dinheiro vivo logo depois de cada pagamento | armadilha |
| Luana (Ferragens Aço Bom) | Cobrou preço muito acima do mercado, Não tem trabalhadores nem máquinas para o serviço que cobrou, Sacou em dinheiro vivo logo depois de cada pagamento | armadilha |
| Mauro (Topografia Exata) | Recebeu por etapa da obra que não foi feita (medição falsa), Não tem trabalhadores nem máquinas para o serviço que cobrou | inocente |
| Célia (Transportes Rio Claro) | Sacou em dinheiro vivo logo depois de cada pagamento | inocente |

### Locais e abordagem certa

| Local | Indício | Abordagem que revela | Observação |
|---|---|---|---|
| Vistoria na ponte | Recebeu por etapa da obra que não foi feita (medição falsa) | Medir a obra com o projeto na mão |  |
| Conversa com pedreiro demitido | Recebeu por etapa da obra que não foi feita (medição falsa) | Conversar com calma | testemunho |
| Tribunal de Contas | Cobrou preço muito acima do mercado | Pedir a comparação de preços do contrato |  |
| Loja de material de construção | Cobrou preço muito acima do mercado | Comparar a tabela de preços com o contrato | testemunho |
| Sindicato da Construção | Não tem trabalhadores nem máquinas para o serviço que cobrou | Consultar os trabalhadores registrados |  |
| Endereço da empresa | Não tem trabalhadores nem máquinas para o serviço que cobrou | Conversar com a vizinha | aparece depois de: Sindicato da Construção; testemunho |
| Banco Aurora | Sacou em dinheiro vivo logo depois de cada pagamento | Apresentar o pedido oficial, com autorização |  |
| Câmara Municipal (audiência pública) | Nenhum (contexto) | Assistir à audiência pública |  |
| Portal da Transparência | Nenhum (contexto) | Ver os pagamentos do contrato da ponte | grátis |

### Trios que resolvem o caso (12 de 84)

- Vistoria na ponte + Tribunal de Contas + Sindicato da Construção
- Vistoria na ponte + Tribunal de Contas + Endereço da empresa
- Vistoria na ponte + Loja de material de construção + Sindicato da Construção
- Vistoria na ponte + Loja de material de construção + Endereço da empresa
- Vistoria na ponte + Sindicato da Construção + Banco Aurora
- Vistoria na ponte + Endereço da empresa + Banco Aurora
- Conversa com pedreiro demitido + Tribunal de Contas + Sindicato da Construção
- Conversa com pedreiro demitido + Tribunal de Contas + Endereço da empresa
- Conversa com pedreiro demitido + Loja de material de construção + Sindicato da Construção
- Conversa com pedreiro demitido + Loja de material de construção + Endereço da empresa
- Conversa com pedreiro demitido + Sindicato da Construção + Banco Aurora
- Conversa com pedreiro demitido + Endereço da empresa + Banco Aurora

### Moradores

| Morador | A fala é |
|---|---|
| Seu Tião, barqueiro | verdade |
| Rafa, estudante | **boato falso** |
| Seu Ezequiel, engenheiro aposentado | verdade |
