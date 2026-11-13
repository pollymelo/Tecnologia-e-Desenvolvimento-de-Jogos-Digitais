# GDD — Rota Fantasma

> Jogo educativo de **educação fiscal** no estilo "perseguição detetivesca pelo mapa".
> Personagens, órgão fictício, casos e arte são originais.

## 1. Problema

Muita gente não sabe **para onde vai o dinheiro dos tributos**, não diferencia imposto municipal,
estadual e federal e não vê problema em comprar "sem nota". Com isso, a sonegação parece um
crime sem vítima, e o cidadão deixa de exercer seu papel de fiscalizar o uso do dinheiro público.

## 2. Objetivo

**Do jogador:** como auditor(a) da **Força-Tarefa Bússola**, seguir pelas capitais brasileiras
o rastro da quadrilha de **Vesper**, que usa **empresas fantasmas** e **notas frias** para sonegar
tributos. É preciso reunir provas, identificar o responsável e emitir o mandado **antes que o prazo
acabe e o prejuízo à sociedade cresça demais**.

**Pedagógico:** ao final de um caso, o jogador deve ser capaz de:
1. Explicar a **função social do tributo**, ou seja, como ele financia escola, saúde e infraestrutura.
2. Classificar os principais tributos por **esfera**: municipal (IPTU, ISS), estadual (ICMS, IPVA) e federal (IR, IPI).
3. Reconhecer a **nota fiscal** como direito do consumidor e ferramenta contra a sonegação.
4. Identificar fraudes comuns: venda sem nota, nota fria, empresa fantasma e subfaturamento.

## 3. Mecânicas

| Mecânica | Descrição |
|---|---|
| **Investigar** | Cada capital tem 3 locais (ex.: porto, feira, cartório). Testemunhas dão **pistas geográficas** sobre o próximo destino ou **pistas fiscais** sobre o responsável. |
| **Viajar** | Escolher 1 entre 4 capitais. Só uma está certa. |
| **Desafio fiscal** | Em cada cidade, um documento suspeito traz uma pergunta de múltipla escolha sobre tributos (ex.: "IPVA é de qual esfera?"). Quem acerta ganha **1 prova** e economiza tempo. |
| **Dossiê** | As pistas fiscais (tipo de fraude, tributo sonegado, setor da empresa, esfera) filtram a lista de suspeitos. |
| **Mandado** | Pode ser emitido quando há **1 suspeito restante** e **provas suficientes**. |
| **Prejuízo social** | Um contador mostra o valor sonegado, que cresce a cada hora, e o converte em serviços públicos perdidos (merendas, leitos, km de asfalto). |
| **Captura** | Na capital final, quem tem o mandado certo vence. Sem mandado ou com o mandado errado, a quadrilha escapa. |

### Loop principal

```
Capital atual → Investigar (pistas) → Desafio fiscal (provas) → Atualizar dossiê → Viajar → ... → Captura → Tela de impacto
```

### Tela de impacto (fim do caso)
Mostra o valor recuperado e o que ele financia, por exemplo "R$ 120 mil = 30.000 merendas escolares".
Também apresenta um resumo dos conceitos fiscais vistos no caso.

## 4. Regras numéricas

### Tempo
| Ação | Custo |
|---|---|
| Prazo inicial do caso | **72 h** |
| Investigar local | **2 h** (1º), **3 h** (2º), **4 h** (3º) na mesma cidade |
| Desafio fiscal: acerto | **1 h** e **+1 prova** |
| Desafio fiscal: erro | **3 h**, sem prova |
| Viagem correta | **5 h** |
| Viagem errada | **10 h** (ida + volta) |
| Emitir mandado | **1 h** |

### Prejuízo social
| Item | Valor |
|---|---|
| Valor sonegado no início | **R$ 500.000** |
| Crescimento do prejuízo | **+R$ 10.000 por hora** |
| Valor recuperado na vitória | **100%** do valor acumulado |
| Conversão exibida (referência fictícia do jogo) | 1 merenda = R$ 4 · 1 diária de leito = R$ 1.000 · 1 m de asfalto = R$ 500 |

### Estrutura do caso
| Item | Valor |
|---|---|
| Capitais na rota | **5** (Novato) / **6** (Auditor) / **7** (Auditor-Chefe) |
| Destinos por viagem | **4** (1 certo + 3 errados) |
| Locais por cidade | **3** |
| Desafios fiscais por cidade | **1** |
| Provas necessárias para o mandado | **3** (Novato) / **4** / **5** |
| Suspeitos no banco | **8** |
| Atributos do suspeito | **4**: tipo de fraude, tributo sonegado, setor, esfera |
| Banco de perguntas (MVP) | **30** perguntas |

### Pontuação
| Evento | Pontos |
|---|---|
| Caso resolvido | **+1000** |
| Bônus de tempo | **+10 por hora restante** |
| Desafio fiscal certo | **+50** |
| Viagem errada | **−50** |
| Mandado errado | caso perdido, **0** pontos |

| Patente | Casos resolvidos |
|---|---|
| Auditor(a) Novato(a) | 0 |
| Auditor(a) | 3 |
| Auditor(a)-Chefe | 7 |

### Condições
- **Vitória:** chegar à capital final dentro do prazo, com o mandado do suspeito correto e as provas mínimas.
- **Derrota:** prazo zerado, **ou** captura sem mandado, **ou** mandado para o suspeito errado.
  A tela de derrota mostra quanto a sociedade perdeu.

## 5. Escopo do MVP (NP2)

- 1 caso jogável no nível Novato (5 capitais).
- 10 capitais, 8 suspeitos e 30 perguntas fiscais, tudo em JSON.
- Tela de impacto ao final.
- HTML/CSS/JS puro com Vite.

## 6. Stack

- **Vite** (template vanilla JS)
- HTML + CSS + JavaScript (ES Modules)
- Git/GitHub para versionamento
