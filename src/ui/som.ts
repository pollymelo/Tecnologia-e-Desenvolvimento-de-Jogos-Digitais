// Efeitos sonoros sintetizados com a Web Audio API: não há arquivos de áudio
// (nada para baixar e nenhum problema de direito autoral).
// Sem suporte no navegador (ou nos testes), tudo vira silêncio.

export type Efeito = 'porta' | 'dia' | 'pista' | 'guardar' | 'risco' | 'carimbo' | 'vitoria' | 'falha'

export interface Som {
  readonly ligado: boolean
  alternar(): void
  tocar(efeito: Efeito, atrasoSeg?: number): void
  /** Passos durante `duracaoMs` (um a cada ~0,28 s). */
  passos(duracaoMs: number): void
}

const CHAVE = 'rota-fantasma:som'

function lerPreferencia(): boolean {
  try {
    return globalThis.localStorage?.getItem(CHAVE) !== 'desligado'
  } catch {
    return true
  }
}

function salvarPreferencia(ligado: boolean): void {
  try {
    globalThis.localStorage?.setItem(CHAVE, ligado ? 'ligado' : 'desligado')
  } catch {
    // modo anônimo ou armazenamento bloqueado: só não lembra a escolha
  }
}

type CtxAudio = AudioContext

export function criarSom(ativo = true): Som {
  let ligado = lerPreferencia()
  let ctx: CtxAudio | null = null
  let ruido: AudioBuffer | null = null

  /** Cria o contexto só no primeiro som (o navegador exige um clique antes). */
  function contexto(): CtxAudio | null {
    if (!ativo || !ligado) return null
    if (!ctx) {
      const Construtor =
        globalThis.AudioContext ?? (globalThis as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Construtor) return null
      try {
        ctx = new Construtor()
      } catch {
        return null
      }
    }
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  }

  function bufferDeRuido(c: CtxAudio): AudioBuffer {
    if (!ruido) {
      ruido = c.createBuffer(1, c.sampleRate, c.sampleRate)
      const dados = ruido.getChannelData(0)
      for (let i = 0; i < dados.length; i++) dados[i] = Math.random() * 2 - 1
    }
    return ruido
  }

  /** Envelope rápido de ataque e queda num ganho. */
  function envelope(c: CtxAudio, inicio: number, duracao: number, pico: number): GainNode {
    const g = c.createGain()
    g.gain.setValueAtTime(0.0001, inicio)
    g.gain.exponentialRampToValueAtTime(pico, inicio + Math.min(0.02, duracao / 4))
    g.gain.exponentialRampToValueAtTime(0.0001, inicio + duracao)
    g.connect(c.destination)
    return g
  }

  function nota(c: CtxAudio, inicio: number, freq: number, duracao: number, pico: number, tipo: OscillatorType = 'triangle', freqFim?: number): void {
    const o = c.createOscillator()
    o.type = tipo
    o.frequency.setValueAtTime(freq, inicio)
    if (freqFim) o.frequency.exponentialRampToValueAtTime(freqFim, inicio + duracao)
    o.connect(envelope(c, inicio, duracao, pico))
    o.start(inicio)
    o.stop(inicio + duracao + 0.05)
  }

  function chiado(c: CtxAudio, inicio: number, duracao: number, pico: number, filtro: BiquadFilterType, freq: number, freqFim?: number): void {
    const fonte = c.createBufferSource()
    fonte.buffer = bufferDeRuido(c)
    const f = c.createBiquadFilter()
    f.type = filtro
    f.frequency.setValueAtTime(freq, inicio)
    if (freqFim) f.frequency.exponentialRampToValueAtTime(freqFim, inicio + duracao)
    fonte.connect(f)
    f.connect(envelope(c, inicio, duracao, pico))
    fonte.start(inicio, Math.random() * 0.5)
    fonte.stop(inicio + duracao + 0.05)
  }

  const efeitos: Record<Efeito, (c: CtxAudio, t: number) => void> = {
    // rangido: tom áspero que sobe e desce
    porta: (c, t) => {
      nota(c, t, 260, 0.22, 0.035, 'sawtooth', 430)
      nota(c, t + 0.2, 430, 0.3, 0.03, 'sawtooth', 300)
    },
    // noite (acorde grave e calmo) e amanhecer (dois piados)
    dia: (c, t) => {
      nota(c, t, 220, 1.1, 0.05, 'sine')
      nota(c, t, 330, 1.1, 0.035, 'sine')
      nota(c, t + 1.1, 1400, 0.12, 0.03, 'sine', 2100)
      nota(c, t + 1.3, 1500, 0.12, 0.03, 'sine', 2300)
    },
    pista: (c, t) => {
      nota(c, t, 880, 0.18, 0.08)
      nota(c, t + 0.12, 1320, 0.3, 0.07)
    },
    guardar: (c, t) => chiado(c, t, 0.35, 0.08, 'bandpass', 600, 3000),
    risco: (c, t) => chiado(c, t, 0.14, 0.1, 'highpass', 2500),
    carimbo: (c, t) => {
      nota(c, t, 140, 0.28, 0.35, 'sine', 45)
      chiado(c, t, 0.06, 0.15, 'lowpass', 1200)
    },
    vitoria: (c, t) => [523, 659, 784, 1047].forEach((f, i) => nota(c, t + i * 0.12, f, 0.35, 0.08)),
    falha: (c, t) => {
      nota(c, t, 392, 0.3, 0.07)
      nota(c, t + 0.25, 311, 0.5, 0.07)
    },
  }

  return {
    get ligado() {
      return ligado
    },
    alternar() {
      ligado = !ligado
      salvarPreferencia(ligado)
    },
    tocar(efeito, atrasoSeg = 0) {
      const c = contexto()
      if (!c) return
      try {
        efeitos[efeito](c, c.currentTime + atrasoSeg)
      } catch {
        // falha de áudio nunca pode travar o jogo
      }
    },
    passos(duracaoMs) {
      const c = contexto()
      if (!c) return
      try {
        const n = Math.max(1, Math.round(duracaoMs / 280))
        for (let i = 0; i < n; i++) chiado(c, c.currentTime + i * 0.28, 0.06, 0.06, 'lowpass', 500 + (i % 2) * 150)
      } catch {
        // idem
      }
    },
  }
}
