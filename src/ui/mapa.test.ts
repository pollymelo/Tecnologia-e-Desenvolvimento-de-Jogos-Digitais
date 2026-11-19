import { describe, expect, it } from 'vitest'
import {
  andavel,
  caminho,
  comprimento,
  LOTE_PARTIDA,
  LOTES_LOCAIS,
  mover,
  pontoNaRua,
  pontoNoCaminho,
  portaProxima,
  olharPara,
  RUAS,
  type Ponto,
} from './mapa.ts'

/** Anda com a tecla segurada por `n` quadros de `passo` unidades. */
function segurar(p: Ponto, dx: number, dy: number, n: number, passo = 2): Ponto {
  for (let i = 0; i < n; i++) p = mover(p, dx * passo, dy * passo)
  return p
}

const [ruaA, ruaB, ruaC] = RUAS.horizontais
const transversal = RUAS.verticais[1]

describe('mapa: onde dá para andar', () => {
  it('ruas e portas são andáveis; grama e prédios não', () => {
    expect(andavel({ x: 200, y: ruaC })).toBe(true)
    expect(andavel(LOTE_PARTIDA.porta)).toBe(true)
    expect(andavel({ x: LOTE_PARTIDA.porta.x, y: LOTE_PARTIDA.porta.y - 30 })).toBe(false) // dentro do prédio da Auditoria
    expect(andavel({ x: 75, y: 150 })).toBe(false) // lote do meio
  })

  it('o peão anda pela rua e para na borda (não atravessa a grama)', () => {
    const inicio = { x: 200, y: ruaC }
    const direita = segurar(inicio, 1, 0, 20)
    expect(direita.x).toBeCloseTo(240)
    const contraOMuro = segurar({ x: 70, y: ruaC }, 0, 1, 30)
    expect(contraOMuro.y).toBeLessThanOrEqual(ruaC + 11) // borda de baixo da rua
    expect(andavel(contraOMuro)).toBe(true)
  })

  it('na diagonal contra a borda, desliza ao longo da rua', () => {
    const p = segurar({ x: 70, y: ruaC + 10 }, 1, 1, 10)
    expect(p.x).toBeGreaterThan(80)
    expect(andavel(p)).toBe(true)
  })

  it('ajuda na curva: segurar "cima" perto de uma esquina puxa o peão para a rua transversal', () => {
    const quaseNaEsquina = { x: transversal + 11 + 6, y: ruaC } // 6 unidades depois da borda da transversal
    const p = segurar(quaseNaEsquina, 0, -1, 80)
    expect(p.y).toBeLessThan(ruaB) // subiu pela transversal
    expect(Math.abs(p.x - transversal)).toBeLessThanOrEqual(11)
  })

  it('subindo pela calçada, chega à porta e ela fica ao alcance', () => {
    const lote = LOTES_LOCAIS[7] // canto de baixo à esquerda
    const p = segurar({ x: lote.porta.x + 4, y: ruaC }, 0, -1, 20)
    expect(portaProxima(p, 9)).toBe(7)
    expect(portaProxima({ x: RUAS.verticais[2], y: ruaC }, 9)).toBeNull() // na esquina, longe das calçadas
  })

  it('não entra em lote de local que o caso não tem', () => {
    expect(portaProxima(LOTES_LOCAIS[9].porta, 9)).toBeNull()
  })
})

describe('mapa: caminho mais curto (clique para andar)', () => {
  it('da Auditoria até a porta de um local no alto do mapa, só por ruas', () => {
    const rota = caminho(LOTE_PARTIDA.porta, LOTES_LOCAIS[1].porta)
    expect(rota[0]).toEqual(LOTE_PARTIDA.porta)
    expect(rota[rota.length - 1]).toEqual(LOTES_LOCAIS[1].porta)
    // todo ponto do caminho (inclusive no meio dos trechos) é andável
    const total = comprimento(rota)
    for (let d = 0; d <= total; d += 3) expect(andavel(pontoNoCaminho(rota, d))).toBe(true)
    // contorna os prédios do meio: é maior que a linha reta
    expect(total).toBeGreaterThan(Math.abs(LOTE_PARTIDA.porta.y - LOTES_LOCAIS[1].porta.y))
    expect(rota.some((p) => p.y === ruaA)).toBe(true)
  })

  it('clique na grama leva ao ponto de rua mais perto', () => {
    const alvo = pontoNaRua({ x: 200, y: 330 })
    expect(andavel(alvo)).toBe(true)
    expect(alvo.y).toBeCloseTo(ruaC)
  })

  it('no mesmo trecho, o caminho é direto', () => {
    const rota = caminho({ x: 150, y: ruaC }, { x: 190, y: ruaC })
    expect(comprimento(rota)).toBeCloseTo(40)
  })
})

describe('mapa: entrar a partir da rua e direção do boneco', () => {
  it('parado na rua em frente ao prédio, a porta já fica ao alcance', () => {
    const lote = LOTES_LOCAIS[7]
    expect(portaProxima(lote.rua, 9)).toBe(7) // no meio da rua, em frente à calçada
    expect(portaProxima({ x: lote.rua.x + 8, y: lote.rua.y + 8 }, 9)).toBe(7) // quase na borda de baixo
    expect(portaProxima({ x: lote.rua.x + 20, y: lote.rua.y }, 9)).toBeNull() // já passou do prédio
  })

  it('o boneco olha para onde anda (e mantém a direção parado)', () => {
    expect(olharPara(1, 0)).toBe('direita')
    expect(olharPara(-1, 0.2)).toBe('esquerda')
    expect(olharPara(0, -1)).toBe('cima')
    expect(olharPara(0.1, 1)).toBe('baixo')
    expect(olharPara(0, 0, 'esquerda')).toBe('esquerda')
  })
})
