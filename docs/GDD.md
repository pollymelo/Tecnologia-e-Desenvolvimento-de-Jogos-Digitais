# GDD — Rota Fantasma

> Jogo de investigação e geografia, inspirado no gênero "perseguição detetivesca pelo mundo".
> Personagens, cidades-caso e arte são originais.

## 1. Problema

Estudantes costumam decorar geografia (capitais, bandeiras, moedas, pontos turísticos) de forma
mecânica e esquecem rápido. Falta uma forma de **usar** esse conhecimento para tomar decisões,
o que ajuda a fixá-lo.

## 2. Objetivo

**Do jogador:** como agente da AGÊNCIA BÚSSOLA, seguir as pistas deixadas pela ladra **Vesper**
e sua gangue, descobrir para qual cidade ela fugiu, identificar o suspeito certo e prendê-lo
**antes que o prazo acabe**.

**Do jogo (pedagógico):** fazer o jogador relacionar pistas (idioma, moeda, bandeira, monumento,
clima) a cidades e países, treinando raciocínio dedutivo e conhecimento geográfico.

## 3. Mecânicas

| Mecânica | Descrição |
|---|---|
| **Investigar** | Em cada cidade há 3 locais (ex.: aeroporto, mercado, museu). Visitar um local revela uma pista sobre o próximo destino ou sobre o suspeito. |
| **Viajar** | O jogador escolhe 1 entre 4 destinos possíveis. Só um é o correto; os outros são becos sem saída. |
| **Dossiê** | Pistas sobre o suspeito (cabelo, hobby, veículo, traço marcante) são marcadas num dossiê que filtra a lista de suspeitos. |
| **Mandado** | Quando restar 1 suspeito no dossiê, o jogador pode emitir o mandado de prisão. |
| **Captura** | Na cidade final, ao investigar, o suspeito aparece. Com mandado correto = vitória; sem mandado ou mandado errado = fuga. |
| **Relógio** | Toda ação consome horas do prazo do caso. Prazo zerado = derrota. |

### Loop principal

```
Cidade atual → Investigar locais → (Atualizar dossiê) → Viajar → ... → Cidade final → Captura
```

## 4. Regras numéricas

### Tempo
| Ação | Custo |
|---|---|
| Prazo inicial do caso | **72 horas** (segunda 09h → quinta 09h) |
| Investigar um local | **2 h** (1º local), **3 h** (2º), **4 h** (3º) na mesma cidade |
| Viajar para destino correto | **5 h** |
| Viajar para destino errado | **5 h** + **5 h** para voltar = 10 h desperdiçadas |
| Emitir mandado | **1 h** |
| Dormir (automático entre 23h e 07h) | **8 h** — ocorre uma vez por noite |

### Estrutura de um caso
| Item | Valor |
|---|---|
| Cidades na rota (incluindo a inicial e a final) | **5** (Novato) / **6** (Detetive) / **7** (Chefe) |
| Destinos oferecidos por viagem | **4** (1 certo + 3 errados) |
| Locais por cidade | **3** |
| Pistas de destino por cidade | **2** (1 local pode dar pista de suspeito) |
| Suspeitos no banco | **8** |
| Atributos de suspeito | **4** (cabelo, hobby, veículo, traço), cada um com 3–4 valores |
| Pistas de suspeito por caso | **≥ 3** (o suficiente para isolar 1 suspeito) |

### Pontuação e progressão
| Evento | Pontos |
|---|---|
| Caso resolvido | **+1000** |
| Bônus de tempo | **+10 por hora restante** |
| Viagem errada | **−50** |
| Mandado errado (prisão falha) | caso perdido, **0** pontos |

| Patente | Casos resolvidos necessários |
|---|---|
| Novato | 0 |
| Detetive | 3 |
| Chefe | 7 |

### Condições
- **Vitória:** chegar à cidade final dentro do prazo **e** com mandado do suspeito correto.
- **Derrota:** prazo chega a 0 h, **ou** captura sem mandado, **ou** mandado para o suspeito errado.

## 5. Escopo do MVP (NP2)

- 1 caso jogável, dificuldade Novato (5 cidades).
- 10 cidades no banco de dados, 8 suspeitos.
- Interface em HTML/CSS/JS puro (Vite, sem framework).
- Dados de cidades e suspeitos em JSON.

## 6. Stack

- **Vite** (template vanilla JS)
- HTML + CSS + JavaScript (ES Modules)
- Git/GitHub para versionamento
