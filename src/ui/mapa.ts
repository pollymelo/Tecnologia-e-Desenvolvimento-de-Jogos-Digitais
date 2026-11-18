// Mapa de Vila Aurora: ruas, lotes e portas, em unidades do desenho (viewBox 400 × 340).
// Aqui fica só a geometria (sem DOM): por onde o peão pode andar, como ele desliza nas
// bordas e vira nas esquinas, e o caminho mais curto pelas ruas.

export interface Ponto {
  x: number
  y: number
}

export const MAPA = { largura: 400, altura: 340 }

/** Largura das ruas e da calçada que leva até cada porta. */
export const LARGURA_RUA = 22
export const LARGURA_CALCADA = 10

/** Velocidade do peão andando com o teclado (unidades do mapa por segundo). */
export const VELOCIDADE = 95

const RUAS_Y = [96, 206, 316]
const RUAS_X = [16, 137.5, 262.5, 384]
const COLUNAS = [75, 200, 325]
/** Distância entre a porta e o meio da rua (o tamanho da calçada). */
const RECUO = 18

/** Um terreno do mapa: o prédio fica em cima da porta, que dá para a rua de baixo. */
export interface Lote {
  linha: number
  coluna: number
  /** Ponto em frente à porta, onde o peão para para entrar. */
  porta: Ponto
  /** Onde a calçada encontra a rua. */
  rua: Ponto
}

function lote(linha: number, coluna: number): Lote {
  const x = COLUNAS[coluna]
  const y = RUAS_Y[linha]
  return { linha, coluna, porta: { x, y: y - RECUO }, rua: { x, y } }
}

export const LOTE_HOSPITAL = lote(1, 1)
export const LOTE_PARTIDA = lote(2, 1)
/** Lotes dos locais do caso, na ordem em que aparecem no JSON. */
export const LOTES_LOCAIS: Lote[] = [lote(0, 0), lote(0, 1), lote(0, 2), lote(1, 0), lote(1, 2), lote(2, 0), lote(2, 2)]
/** Quantos locais cabem no mapa. */
export const MAX_LOCAIS = LOTES_LOCAIS.length
const TODOS_OS_LOTES = [...LOTES_LOCAIS, LOTE_HOSPITAL, LOTE_PARTIDA]

// ---------- Grafo das ruas ----------

interface Aresta {
  a: number
  b: number
  largura: number
}

const nos: Ponto[] = []
const arestas: Aresta[] = []

function no(p: Ponto): number {
  const i = nos.findIndex((n) => Math.abs(n.x - p.x) < 0.01 && Math.abs(n.y - p.y) < 0.01)
  if (i >= 0) return i
  nos.push(p)
  return nos.length - 1
}

function ligar(p: Ponto, q: Ponto, largura: number): void {
  arestas.push({ a: no(p), b: no(q), largura })
}

// ruas horizontais, com um nó em cada esquina e em cada calçada
for (const y of RUAS_Y) {
  const xs = [...new Set([...RUAS_X, ...COLUNAS])].sort((m, n) => m - n)
  for (let i = 0; i < xs.length - 1; i++) ligar({ x: xs[i], y }, { x: xs[i + 1], y }, LARGURA_RUA)
}
// ruas verticais, de uma rua horizontal à outra
for (const x of RUAS_X) {
  for (let i = 0; i < RUAS_Y.length - 1; i++) ligar({ x, y: RUAS_Y[i] }, { x, y: RUAS_Y[i + 1] }, LARGURA_RUA)
}
// calçadas até as portas
for (const l of TODOS_OS_LOTES) ligar(l.rua, l.porta, LARGURA_CALCADA)

/** Segmentos de rua e calçada, para desenhar o mapa. */
export function trechos(): { de: Ponto; para: Ponto; largura: number }[] {
  return arestas.map((e) => ({ de: nos[e.a], para: nos[e.b], largura: e.largura }))
}

export const RUAS = { horizontais: RUAS_Y, verticais: RUAS_X }

// ---------- Onde dá para andar ----------

/** Retângulo de um trecho. A calçada termina na porta; a rua sobra meia largura nas pontas. */
function retangulo(e: Aresta) {
  const p = nos[e.a]
  const q = nos[e.b]
  const meia = e.largura / 2
  const calcada = e.largura === LARGURA_CALCADA
  if (p.y === q.y) {
    return { x0: Math.min(p.x, q.x) - meia, x1: Math.max(p.x, q.x) + meia, y0: p.y - meia, y1: p.y + meia }
  }
  return {
    x0: p.x - meia,
    x1: p.x + meia,
    y0: Math.min(p.y, q.y) - (calcada ? 0 : meia),
    y1: Math.max(p.y, q.y) + (calcada ? 0 : meia),
  }
}

const retangulos = arestas.map(retangulo)

export function andavel(p: Ponto): boolean {
  return retangulos.some((r) => p.x >= r.x0 && p.x <= r.x1 && p.y >= r.y0 && p.y <= r.y1)
}

/** Até quantas unidades o peão é puxado para entrar numa rua transversal ou calçada. */
const AJUDA_NA_CURVA = 11

/**
 * Tenta mover o peão por (dx, dy). Se bater na borda, desliza pelo outro eixo; se estiver
 * quase alinhado com uma rua transversal ou calçada, é puxado para ela (ajuda na curva).
 */
export function mover(p: Ponto, dx: number, dy: number): Ponto {
  if (dx === 0 && dy === 0) return p
  const direto = { x: p.x + dx, y: p.y + dy }
  if (andavel(direto)) return direto

  // Eixo principal primeiro: desliza nele; se não der, a ajuda na curva; por último, o outro eixo.
  const passo = Math.hypot(dx, dy)
  const resultado =
    Math.abs(dx) >= Math.abs(dy)
      ? (deslizar(p, dx, 0) ?? alinhar(p, 'x', Math.sign(dx), passo) ?? deslizar(p, 0, dy))
      : (deslizar(p, 0, dy) ?? alinhar(p, 'y', Math.sign(dy), passo) ?? deslizar(p, dx, 0))
  return resultado ?? p
}

function deslizar(p: Ponto, dx: number, dy: number): Ponto | null {
  if (dx === 0 && dy === 0) return null
  const q = { x: p.x + dx, y: p.y + dy }
  return andavel(q) ? q : null
}

/**
 * O peão quer ir no `eixo` (sentido ±1), mas está bloqueado. Procura, por perto, uma
 * posição no outro eixo de onde dá para seguir, e anda um pouco na direção dela.
 */
function alinhar(p: Ponto, eixo: 'x' | 'y', sentido: number, passo: number): Ponto | null {
  for (let k = 1; k <= AJUDA_NA_CURVA; k++) {
    for (const s of [-1, 1]) {
      const teste =
        eixo === 'x' ? { x: p.x + sentido * passo, y: p.y + s * k } : { x: p.x + s * k, y: p.y + sentido * passo }
      if (!andavel(teste)) continue
      const ajuste = s * Math.min(passo, k)
      const q = eixo === 'x' ? { x: p.x, y: p.y + ajuste } : { x: p.x + ajuste, y: p.y }
      return andavel(q) ? q : null
    }
  }
  return null
}

// ---------- Portas ----------

/** Índice do lote de local cuja porta está ao alcance do peão (ou null). */
export function portaProxima(p: Ponto, quantidadeLocais: number): number | null {
  for (let i = 0; i < Math.min(quantidadeLocais, LOTES_LOCAIS.length); i++) {
    const porta = LOTES_LOCAIS[i].porta
    if (Math.abs(p.x - porta.x) <= LARGURA_CALCADA / 2 + 1 && p.y >= porta.y - 1 && p.y <= porta.y + 8) return i
  }
  return null
}

// ---------- Caminho mais curto (clique para andar) ----------

const distancia = (p: Ponto, q: Ponto) => Math.hypot(p.x - q.x, p.y - q.y)

/** Ponto mais próximo de `p` sobre o eixo de algum trecho. */
function projetar(p: Ponto): { aresta: number; ponto: Ponto } {
  let melhor = { aresta: 0, ponto: nos[0], d: Infinity }
  arestas.forEach((e, i) => {
    const a = nos[e.a]
    const b = nos[e.b]
    const comp2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / comp2))
    const q = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
    const d = distancia(p, q)
    if (d < melhor.d) melhor = { aresta: i, ponto: q, d }
  })
  return { aresta: melhor.aresta, ponto: melhor.ponto }
}

/** Ponto andável mais perto de `p` (para quem clica na grama). */
export function pontoNaRua(p: Ponto): Ponto {
  return andavel(p) ? p : projetar(p).ponto
}

/**
 * Caminho pelas ruas de `de` até `para`, como lista de pontos (o primeiro é `de`).
 * Se `para` não for andável, o destino é o ponto de rua mais próximo dele.
 */
export function caminho(de: Ponto, para: Ponto): Ponto[] {
  const inicio = projetar(de)
  const fim = andavel(para) ? { ...projetar(para), alvo: para } : { ...projetar(para), alvo: projetar(para).ponto }
  const limpar = (pontos: Ponto[]) =>
    pontos.filter((pt, i) => i === 0 || distancia(pt, pontos[i - 1]) > 0.01)

  if (inicio.aresta === fim.aresta) return limpar([de, inicio.ponto, fim.ponto, fim.alvo])

  // Dijkstra com dois nós extras: o início e o fim projetados nas ruas
  const N = nos.length
  const INICIO = N
  const FIM = N + 1
  const ponto = (i: number) => (i === INICIO ? inicio.ponto : i === FIM ? fim.ponto : nos[i])
  const vizinhos = new Map<number, number[]>()
  const juntar = (a: number, b: number) => {
    vizinhos.set(a, [...(vizinhos.get(a) ?? []), b])
    vizinhos.set(b, [...(vizinhos.get(b) ?? []), a])
  }
  arestas.forEach((e, i) => {
    if (i !== inicio.aresta && i !== fim.aresta) juntar(e.a, e.b)
  })
  for (const [extra, aresta] of [
    [INICIO, inicio.aresta],
    [FIM, fim.aresta],
  ] as const) {
    juntar(extra, arestas[aresta].a)
    juntar(extra, arestas[aresta].b)
  }

  const dist = new Map<number, number>([[INICIO, 0]])
  const anterior = new Map<number, number>()
  const abertos = new Set<number>([INICIO])
  const fechados = new Set<number>()
  while (abertos.size) {
    let atual = -1
    for (const i of abertos) if (atual < 0 || dist.get(i)! < dist.get(atual)!) atual = i
    abertos.delete(atual)
    fechados.add(atual)
    if (atual === FIM) break
    for (const v of vizinhos.get(atual) ?? []) {
      if (fechados.has(v)) continue
      const d = dist.get(atual)! + distancia(ponto(atual), ponto(v))
      if (d < (dist.get(v) ?? Infinity)) {
        dist.set(v, d)
        anterior.set(v, atual)
        abertos.add(v)
      }
    }
  }

  const rota: Ponto[] = []
  for (let i: number | undefined = FIM; i !== undefined; i = anterior.get(i)) rota.unshift(ponto(i))
  return limpar([de, ...rota, fim.alvo])
}

/** Comprimento total de um caminho. */
export function comprimento(pontos: Ponto[]): number {
  let total = 0
  for (let i = 1; i < pontos.length; i++) total += distancia(pontos[i - 1], pontos[i])
  return total
}

/** Ponto a uma distância `d` do início do caminho. */
export function pontoNoCaminho(pontos: Ponto[], d: number): Ponto {
  let resto = d
  for (let i = 1; i < pontos.length; i++) {
    const trecho = distancia(pontos[i - 1], pontos[i])
    if (resto <= trecho) {
      const t = trecho === 0 ? 0 : resto / trecho
      return {
        x: pontos[i - 1].x + (pontos[i].x - pontos[i - 1].x) * t,
        y: pontos[i - 1].y + (pontos[i].y - pontos[i - 1].y) * t,
      }
    }
    resto -= trecho
  }
  return pontos[pontos.length - 1]
}
