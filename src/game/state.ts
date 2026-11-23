import type { AutoRecusado, Caso, LocalId, Resultado, SuspeitoId } from './types.ts'

/** Vidas de cada caso quando o JSON não define `vidas`. */
export const VIDAS_PADRAO = 3

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
  /** Autos errados que ainda podem ser emitidos sem encerrar o caso. */
  vidasRestantes: number
  /** Autos devolvidos pela chefia, na ordem. O último é o que o jogador acabou de ver. */
  autosRecusados: AutoRecusado[]
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
    vidasRestantes: caso.vidas ?? VIDAS_PADRAO,
    autosRecusados: [],
    resultado: null,
  }
}

export function partidaEncerrada(estado: EstadoJogo): boolean {
  return estado.resultado !== null
}
