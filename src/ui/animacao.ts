// Animações do tabuleiro: caminhada pelas ruas, entrada na casa e passagem do dia.
// Usa requestAnimationFrame e a Web Animations API, sem bibliotecas.

import { comprimento, MAPA, pontoNoCaminho, type Ponto } from './mapa.ts'

export const esperar = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/** Chama `aoQuadro(t)` com t de 0 a 1 ao longo de `duracao` ms, um quadro por vez. */
export function interpolar(duracao: number, aoQuadro: (t: number) => void): Promise<void> {
  return new Promise((resolve) => {
    const inicio = performance.now()
    let terminou = false
    // requestAnimationFrame para quadros suaves; setTimeout de reserva para nunca travar
    // (o navegador pausa requestAnimationFrame quando a aba fica em segundo plano).
    const agendar = () => {
      let feito = false
      const uma = () => {
        if (feito) return
        feito = true
        passo()
      }
      requestAnimationFrame(uma)
      setTimeout(uma, 40)
    }
    const passo = () => {
      if (terminou) return
      const t = Math.min(1, (performance.now() - inicio) / duracao)
      aoQuadro(t)
      if (t < 1) agendar()
      else {
        terminou = true
        resolve()
      }
    }
    agendar()
  })
}

/** Anima com a Web Animations API. Sem suporte no navegador, termina na hora. */
export function animarElemento(
  elemento: Element | null,
  quadros: Keyframe[],
  opcoes: KeyframeAnimationOptions,
): Promise<void> {
  if (!elemento || typeof elemento.animate !== 'function') return Promise.resolve()
  const duracao = typeof opcoes.duration === 'number' ? opcoes.duration : 0
  const animacao = elemento.animate(quadros, opcoes)
  const fim = animacao.finished ? animacao.finished.then(() => undefined).catch(() => undefined) : Promise.resolve()
  // Tempo-limite: se o navegador não avisar o fim da animação, o jogo não trava.
  return Promise.race([fim, esperar(duracao + 150)])
}

const pct = (valor: number, total: number) => `${((valor / total) * 100).toFixed(2)}%`

/** Põe o peão num ponto do mapa (os pés dele ficam no ponto). */
export function posicionarPeao(peao: HTMLElement, p: Ponto): void {
  peao.style.left = pct(p.x, MAPA.largura)
  peao.style.top = pct(p.y, MAPA.altura)
}

/** Velocidade da caminhada automática (clique), em unidades do mapa por segundo. */
const VELOCIDADE_CLIQUE = 150

/** Duração da caminhada por um caminho, em ms (também usada para tocar os passos). */
export function duracaoDoCaminho(pontos: Ponto[]): number {
  return Math.min(3200, Math.max(200, (comprimento(pontos) / VELOCIDADE_CLIQUE) * 1000))
}

/** O peão anda pelo caminho, em velocidade constante, com o ciclo de passos. */
export async function percorrer(peao: HTMLElement, pontos: Ponto[], aoMover?: (p: Ponto) => void): Promise<void> {
  const total = comprimento(pontos)
  if (total < 0.5) return
  peao.classList.add('caminhando')
  await interpolar(duracaoDoCaminho(pontos), (t) => {
    const p = pontoNoCaminho(pontos, total * t)
    posicionarPeao(peao, p)
    aoMover?.(p)
  })
  peao.classList.remove('caminhando')
}

/** Com o peão na porta: a porta abre, a casa acende e o peão entra. */
export async function entrarNaCasa(peao: HTMLElement, casa: HTMLElement, suave = false): Promise<void> {
  peao.classList.remove('caminhando')
  casa.querySelector('.predio')?.classList.add('porta-aberta')
  await esperar(280)
  casa.classList.add('iluminada')
  await animarElemento(
    peao.querySelector('.peao-corpo'),
    suave
      ? [{ opacity: 1 }, { opacity: 0 }]
      : [
          { transform: 'scale(1)', opacity: 1 },
          { transform: 'scale(0.45) translateY(-10%)', opacity: 0 },
        ],
    { duration: 380, easing: 'ease-in', fill: 'forwards' },
  )
  peao.classList.add('dentro')
}

/** Noite e amanhecer sobre o tabuleiro; no meio da noite, uma bolinha de dia se apaga. */
export async function passarDia(tabuleiro: HTMLElement, pipQueApaga: HTMLElement | null): Promise<void> {
  const noite = tabuleiro.querySelector('.ceu-noite')
  const amanhecer = tabuleiro.querySelector('.ceu-amanhecer')
  await animarElemento(noite, [{ opacity: 0 }, { opacity: 1 }], { duration: 550, easing: 'ease-in', fill: 'forwards' })
  pipQueApaga?.classList.add('apagando')
  await esperar(500)
  await Promise.all([
    animarElemento(noite, [{ opacity: 1 }, { opacity: 0 }], { duration: 650, easing: 'ease-out', fill: 'forwards' }),
    animarElemento(amanhecer, [{ opacity: 0 }, { opacity: 0.55, offset: 0.4 }, { opacity: 0 }], {
      duration: 900,
      fill: 'forwards',
    }),
  ])
}

/** O card da pista voa até o botão do caderno e some. */
export async function guardarNoCaderno(
  card: HTMLElement | null,
  destino: HTMLElement | null,
  suave = false,
): Promise<void> {
  if (!card || !destino) return
  if (suave) {
    await animarElemento(card, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' })
    return
  }
  const a = card.getBoundingClientRect()
  const b = destino.getBoundingClientRect()
  if (a.width === 0) return
  const dx = b.left + b.width / 2 - (a.left + a.width / 2)
  const dy = b.top + b.height / 2 - (a.top + a.height / 2)
  await animarElemento(
    card,
    [
      { transform: 'none', opacity: 1 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.08) rotate(-12deg)`, opacity: 0.3 },
    ],
    { duration: 550, easing: 'cubic-bezier(0.5, 0, 0.75, 0)', fill: 'forwards' },
  )
}
