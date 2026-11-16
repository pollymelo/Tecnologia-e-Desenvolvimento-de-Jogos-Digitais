import casoJson from '../data/caso-001.json'
import { validarCaso } from './rules.ts'
import type { Caso } from './types.ts'

/** Carrega um caso do JSON e para com erro claro se ele estiver inconsistente. */
export function carregarCaso(dados: unknown): Caso {
  const caso = dados as Caso
  const erros = validarCaso(caso)
  if (erros.length > 0) {
    throw new Error(`Caso "${caso.id}" inválido:\n- ${erros.join('\n- ')}`)
  }
  return caso
}

export const caso001: Caso = carregarCaso(casoJson)
