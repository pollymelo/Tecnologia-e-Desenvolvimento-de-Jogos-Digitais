import type { Caso, LocalId, Resultado, SuspeitoId } from './types.ts'

/** Imprevisto: um local fechado em um dos dias da investigação. */
export interface Fechamento {
  /** Dia (1 = primeiro dia) em que o local fica fechado. */
  dia: number
  /** Frase do motivo, ex.: "está em greve hoje". */
  motivo: string
}

/**
 * Estado de uma partida. É imutável: as regras (rules.ts) sempre devolvem
 * um novo objeto em vez de alterar o atual.
 */
export interface EstadoJogo {
  casoId: string
  diasRestantes: number
  /** Locais na ordem em que foram visitados. As pistas coletadas são as desses locais. */
  locaisVisitados: LocalId[]
  /** Abordagem escolhida dentro de cada local visitado (id da ação). */
  escolhas: Record<LocalId, string>
  /** Imprevistos sorteados para esta partida. */
  fechados: Record<LocalId, Fechamento>
  /** Suspeitos riscados no caderno. Quem decide é o jogador; o jogo não descarta ninguém sozinho. */
  descartados: SuspeitoId[]
  /** null enquanto a partida está em andamento. */
  resultado: Resultado | null
}

export function criarEstadoInicial(caso: Caso, fechados: Record<LocalId, Fechamento> = {}): EstadoJogo {
  return {
    casoId: caso.id,
    diasRestantes: caso.diasIniciais,
    locaisVisitados: [],
    escolhas: {},
    fechados,
    descartados: [],
    resultado: null,
  }
}

export function partidaEncerrada(estado: EstadoJogo): boolean {
  return estado.resultado !== null
}
