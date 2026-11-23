import caso001Json from '../data/caso-001.json'
import caso002Json from '../data/caso-002.json'
import caso003Json from '../data/caso-003.json'
import caso004Json from '../data/caso-004.json'
import caso005Json from '../data/caso-005.json'
import caso006Json from '../data/caso-006.json'
import caso007Json from '../data/caso-007.json'
import glossarioComum from '../data/glossario-comum.json'
import { validarCaso } from './rules.ts'
import type { Caso, Termo } from './types.ts'

/**
 * Carrega um caso do JSON e para com erro claro se ele estiver inconsistente.
 * O glossário do caso é somado ao glossário comum (termos do caso têm prioridade).
 */
export function carregarCaso(dados: unknown): Caso {
  const bruto = dados as Caso
  const proprios = bruto.glossario ?? []
  const ids = new Set(proprios.map((t) => t.id))
  const caso: Caso = { ...bruto, glossario: [...(glossarioComum as Termo[]).filter((t) => !ids.has(t.id)), ...proprios] }
  const erros = validarCaso(caso)
  if (erros.length > 0) {
    throw new Error(`Caso "${caso.id}" inválido:\n- ${erros.join('\n- ')}`)
  }
  return caso
}

export const caso001: Caso = carregarCaso(caso001Json)

/** Casos da campanha, na ordem em que são destravados. */
export const casos: Caso[] = [
  caso001,
  ...[caso002Json, caso003Json, caso004Json, caso005Json, caso006Json, caso007Json].map(carregarCaso),
]
