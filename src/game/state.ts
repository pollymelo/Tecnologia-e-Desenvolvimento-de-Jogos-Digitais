import type { Caso, LocalId, Resultado, SuspeitoId } from './types.ts'

/**
 * Estado de uma partida. É imutável: as regras (rules.ts) sempre devolvem
 * um novo objeto em vez de alterar o atual.
 */
export interface EstadoJogo {
  casoId: string
  diasRestantes: number
  /** Locais na ordem em que foram visitados. As pistas coletadas são as desses locais. */
  locaisVisitados: LocalId[]
  /** Suspeitos riscados no caderno. Quem decide é o jogador; o jogo não descarta ninguém sozinho. */
  descartados: SuspeitoId[]
  /** null enquanto a partida está em andamento. */
  resultado: Resultado | null
}

export function criarEstadoInicial(caso: Caso): EstadoJogo {
  return {
    casoId: caso.id,
    diasRestantes: caso.diasIniciais,
    locaisVisitados: [],
    descartados: [],
    resultado: null,
  }
}

export function partidaEncerrada(estado: EstadoJogo): boolean {
  return estado.resultado !== null
}
