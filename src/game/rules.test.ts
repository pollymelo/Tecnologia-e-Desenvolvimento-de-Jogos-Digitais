import { describe, expect, it } from 'vitest'
import { caso001 as caso } from './caso.ts'
import { criarEstadoInicial, type EstadoJogo } from './state.ts'
import {
  acusar,
  alternarDescarte,
  calcularTipoResultado,
  encerrarPrazo,
  pistasColetadas,
  podeAcusar,
  podeVisitar,
  provasValidas,
  RegraError,
  validarCaso,
  visitarLocal,
} from './rules.ts'
import type { Caso } from './types.ts'

function visitar(estado: EstadoJogo, ...locais: string[]): EstadoJogo {
  return locais.reduce((e, id) => visitarLocal(caso, e, id).estado, estado)
}

describe('estado inicial', () => {
  it('começa com 4 dias, sem pistas, sem descartes e sem resultado', () => {
    const estado = criarEstadoInicial(caso)
    expect(estado.diasRestantes).toBe(4)
    expect(estado.locaisVisitados).toEqual([])
    expect(estado.descartados).toEqual([])
    expect(estado.resultado).toBeNull()
  })

  it('o JSON do caso 001 é consistente', () => {
    expect(validarCaso(caso)).toEqual([])
  })
})

describe('visitar local', () => {
  it('gasta 1 dia e revela a pista do local', () => {
    const inicial = criarEstadoInicial(caso)
    const { estado, pista } = visitarLocal(caso, inicial, 'operadora_cartao')
    expect(estado.diasRestantes).toBe(3)
    expect(pista.indicio).toBe('cartao_sem_nota')
    expect(pistasColetadas(caso, estado).map((l) => l.id)).toEqual(['operadora_cartao'])
  })

  it('não altera o estado anterior (imutável)', () => {
    const inicial = criarEstadoInicial(caso)
    visitarLocal(caso, inicial, 'praca')
    expect(inicial.diasRestantes).toBe(4)
    expect(inicial.locaisVisitados).toEqual([])
  })

  it('não permite visitar o mesmo local duas vezes', () => {
    const estado = visitar(criarEstadoInicial(caso), 'praca')
    expect(podeVisitar(caso, estado, 'praca')).toBe(false)
    expect(() => visitarLocal(caso, estado, 'praca')).toThrow(RegraError)
  })

  it('só dá tempo de visitar 4 dos 6 locais', () => {
    const estado = visitar(
      criarEstadoInicial(caso),
      'praca',
      'junta_comercial',
      'portal_transparencia',
      'operadora_cartao',
    )
    expect(estado.diasRestantes).toBe(0)
    expect(podeVisitar(caso, estado, 'cartorio_detran')).toBe(false)
    expect(() => visitarLocal(caso, estado, 'cartorio_detran')).toThrow(RegraError)
  })

  it('rejeita local inexistente', () => {
    expect(() => visitarLocal(caso, criarEstadoInicial(caso), 'shopping')).toThrow(RegraError)
  })
})

describe('caderno de suspeitos', () => {
  it('marca e desmarca descarte manualmente', () => {
    let estado = criarEstadoInicial(caso)
    estado = alternarDescarte(caso, estado, 'celia')
    expect(estado.descartados).toEqual(['celia'])
    estado = alternarDescarte(caso, estado, 'celia')
    expect(estado.descartados).toEqual([])
  })

  it('visitar locais não descarta ninguém automaticamente', () => {
    const estado = visitar(criarEstadoInicial(caso), 'operadora_cartao', 'cartorio_detran')
    expect(estado.descartados).toEqual([])
  })
})

describe('validação das provas', () => {
  it('cartão + patrimônio identifica Ricardo', () => {
    expect(provasValidas(caso, ['operadora_cartao', 'cartorio_detran'])).toBe(true)
  })

  it('patrimônio + funcionários identifica Ricardo', () => {
    expect(provasValidas(caso, ['cartorio_detran', 'ex_funcionario'])).toBe(true)
  })

  it('testemunho da praça + patrimônio também identifica Ricardo', () => {
    expect(provasValidas(caso, ['praca', 'cartorio_detran'])).toBe(true)
  })

  it('cartão + funcionários não diferencia Ricardo de Marta', () => {
    expect(provasValidas(caso, ['operadora_cartao', 'ex_funcionario'])).toBe(false)
  })

  it('duas provas do mesmo indício não diferenciam', () => {
    expect(provasValidas(caso, ['operadora_cartao', 'praca'])).toBe(false)
  })

  it('local só de contexto não serve como prova', () => {
    expect(provasValidas(caso, ['cartorio_detran', 'junta_comercial'])).toBe(false)
    expect(provasValidas(caso, ['operadora_cartao', 'portal_transparencia'])).toBe(false)
  })
})

describe('os 4 resultados', () => {
  it('resolvido: suspeito certo e provas válidas', () => {
    const estado = visitar(criarEstadoInicial(caso), 'operadora_cartao', 'cartorio_detran')
    const final = acusar(caso, estado, 'ricardo', ['operadora_cartao', 'cartorio_detran'])
    expect(final.resultado?.tipo).toBe('resolvido')
  })

  it('auto anulado: suspeito certo, mas provas que não o diferenciam', () => {
    const estado = visitar(criarEstadoInicial(caso), 'operadora_cartao', 'ex_funcionario')
    const final = acusar(caso, estado, 'ricardo', ['operadora_cartao', 'ex_funcionario'])
    expect(final.resultado?.tipo).toBe('auto_anulado')
  })

  it('acusação injusta: suspeito errado, mesmo com provas válidas para o culpado', () => {
    const estado = visitar(criarEstadoInicial(caso), 'operadora_cartao', 'cartorio_detran')
    const final = acusar(caso, estado, 'aurelio', ['operadora_cartao', 'cartorio_detran'])
    expect(final.resultado?.tipo).toBe('acusacao_injusta')
    expect(calcularTipoResultado(caso, 'marta', ['operadora_cartao', 'ex_funcionario'])).toBe(
      'acusacao_injusta',
    )
  })

  it('prazo encerrado: dias esgotados sem acusação', () => {
    const estado = visitar(criarEstadoInicial(caso), 'praca', 'junta_comercial', 'portal_transparencia', 'ex_funcionario')
    const final = encerrarPrazo(caso, estado)
    expect(final.resultado?.tipo).toBe('prazo_encerrado')
    expect(final.resultado?.suspeitoAcusadoId).toBeNull()
  })

  it('ainda é possível acusar no último dia (0 dias restantes)', () => {
    const estado = visitar(
      criarEstadoInicial(caso),
      'junta_comercial',
      'portal_transparencia',
      'cartorio_detran',
      'ex_funcionario',
    )
    expect(estado.diasRestantes).toBe(0)
    expect(podeAcusar(caso, estado)).toBe(true)
    const final = acusar(caso, estado, 'ricardo', ['cartorio_detran', 'ex_funcionario'])
    expect(final.resultado?.tipo).toBe('resolvido')
  })

  it('relatório detalhado só se o Portal da Transparência foi visitado', () => {
    const sem = visitar(criarEstadoInicial(caso), 'operadora_cartao', 'cartorio_detran')
    expect(acusar(caso, sem, 'ricardo', ['operadora_cartao', 'cartorio_detran']).resultado?.relatorioDetalhado).toBe(false)

    const com = visitar(sem, 'portal_transparencia')
    expect(acusar(caso, com, 'ricardo', ['operadora_cartao', 'cartorio_detran']).resultado?.relatorioDetalhado).toBe(true)
  })

  it('depois do resultado, nenhuma ação é aceita', () => {
    const estado = visitar(criarEstadoInicial(caso), 'operadora_cartao', 'cartorio_detran')
    const final = acusar(caso, estado, 'ricardo', ['operadora_cartao', 'cartorio_detran'])
    expect(() => visitarLocal(caso, final, 'praca')).toThrow(RegraError)
    expect(() => alternarDescarte(caso, final, 'celia')).toThrow(RegraError)
    expect(() => encerrarPrazo(caso, final)).toThrow(RegraError)
  })
})

describe('acusação mal formada', () => {
  const estado = visitar(criarEstadoInicial(caso), 'operadora_cartao', 'cartorio_detran')

  it('exige exatamente 2 provas diferentes', () => {
    expect(() => acusar(caso, estado, 'ricardo', ['operadora_cartao'])).toThrow(RegraError)
    expect(() => acusar(caso, estado, 'ricardo', ['operadora_cartao', 'operadora_cartao'])).toThrow(RegraError)
  })

  it('só aceita provas já coletadas', () => {
    expect(() => acusar(caso, estado, 'ricardo', ['operadora_cartao', 'ex_funcionario'])).toThrow(RegraError)
  })

  it('não permite acusar com menos de 2 pistas coletadas', () => {
    expect(podeAcusar(caso, visitar(criarEstadoInicial(caso), 'praca'))).toBe(false)
  })
})

describe('validação de um caso novo (JSON editado)', () => {
  it('aponta indício desconhecido e caso sem solução', () => {
    const quebrado: Caso = {
      ...caso,
      locais: caso.locais.map((l) => (l.id === 'praca' ? { ...l, indicio: 'nota_fria' } : l)),
    }
    expect(validarCaso(quebrado)).toContain('Local "praca" revela indício desconhecido "nota_fria".')

    const semSolucao: Caso = { ...caso, locais: caso.locais.filter((l) => l.indicio !== 'patrimonio_incompativel') }
    expect(validarCaso(semSolucao)).toContain('Nenhuma combinação de locais fundamenta a acusação do culpado.')
  })
})
