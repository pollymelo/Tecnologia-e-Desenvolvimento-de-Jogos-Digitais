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
  sortearCaso,
  preencherTexto,
  avaliarDesempenho,
  custoDoLocal,
  sortearPistas,
  versoesDaPista,
  explicarAcusacao,
  pontuarQuiz,
  visitarLocal,
} from './rules.ts'
import type { Caso } from './types.ts'

function visitar(estado: EstadoJogo, ...locais: string[]): EstadoJogo {
  return locais.reduce((e, id) => visitarLocal(caso, e, id).estado, estado)
}

describe('estado inicial', () => {
  it('começa com 3 dias, sem pistas, sem descartes e sem resultado', () => {
    const estado = criarEstadoInicial(caso)
    expect(estado.diasRestantes).toBe(3)
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
    expect(estado.diasRestantes).toBe(2)
    expect(pista.indicio).toBe('cartao_sem_nota')
    expect(pistasColetadas(caso, estado).map((l) => l.id)).toEqual(['operadora_cartao'])
  })

  it('não altera o estado anterior (imutável)', () => {
    const inicial = criarEstadoInicial(caso)
    visitarLocal(caso, inicial, 'praca')
    expect(inicial.diasRestantes).toBe(3)
    expect(inicial.locaisVisitados).toEqual([])
  })

  it('não permite visitar o mesmo local duas vezes', () => {
    const estado = visitar(criarEstadoInicial(caso), 'praca')
    expect(podeVisitar(caso, estado, 'praca')).toBe(false)
    expect(() => visitarLocal(caso, estado, 'praca')).toThrow(RegraError)
  })

  it('com 3 dias, dá para visitar 3 locais pagos e o Portal (grátis)', () => {
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

  it('das 15 duplas possíveis, só 3 resolvem o caso (ficha de solução)', () => {
    const ids = caso.locais.map((l) => l.id)
    const validas: string[] = []
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        if (provasValidas(caso, [ids[i], ids[j]])) validas.push([ids[i], ids[j]].sort().join('+'))
      }
    }
    expect(validas.sort()).toEqual([
      'cartorio_detran+ex_funcionario',
      'cartorio_detran+operadora_cartao',
      'cartorio_detran+praca',
    ])
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

describe('Portal da Transparência grátis', () => {
  it('visitar o Portal não gasta dia, e ele pode ser visitado com 0 dias', () => {
    const portal = caso.locais.find((l) => l.id === 'portal_transparencia')!
    expect(custoDoLocal(caso, portal)).toBe(0)
    const semDias = visitar(criarEstadoInicial(caso), 'praca', 'junta_comercial', 'operadora_cartao')
    expect(semDias.diasRestantes).toBe(0)
    expect(podeVisitar(caso, semDias, 'portal_transparencia')).toBe(true)
    expect(visitar(semDias, 'portal_transparencia').diasRestantes).toBe(0)
  })
})

describe('modo desafio (culpado sorteado)', () => {
  /** Gera todas as 24 permutações forçando a sequência de sorteios. */
  function todasAsVersoes(): Caso[] {
    const versoes: Caso[] = []
    const n = caso.suspeitos.length
    const escolhas = (k: number): number[][] =>
      k === 1 ? [[]] : escolhas(k - 1).flatMap((r) => Array.from({ length: k }, (_, j) => [...r, j]))
    for (const seq of escolhas(n)) {
      // Fisher-Yates consome n-1 sorteios: i = n-1 ... 1, cada um entre 0 e i
      const valores = [...seq].reverse().map((j, idx) => j / (n - idx) + 0.0001)
      let k = 0
      versoes.push(sortearCaso(caso, () => valores[k++]))
    }
    return versoes
  }

  it('toda versão sorteada continua válida e com solução', () => {
    for (const versao of todasAsVersoes()) {
      expect(validarCaso(versao)).toEqual([])
      const culpado = versao.suspeitos.find((s) => s.id === versao.culpadoId)!
      expect(culpado.indicios).toHaveLength(3)
    }
  })

  it('o sorteio troca o culpado entre os suspeitos', () => {
    const culpados = new Set(todasAsVersoes().map((v) => v.culpadoId))
    expect(culpados).toEqual(new Set(['aurelio', 'celia', 'ricardo', 'marta']))
  })

  it('não altera o caso original', () => {
    sortearCaso(caso, () => 0)
    expect(caso.culpadoId).toBe('ricardo')
  })

  it('o gancho usa o nome e a empresa do culpado sorteado', () => {
    expect(preencherTexto(caso, caso.gancho!)).toContain('Eletrônicos TecMais')
    const versao = { ...caso, culpadoId: 'marta' }
    expect(preencherTexto(versao, '{culpado} / {empresa}')).toBe('Marta / Restaurante Sabor do Mar')
  })
})

describe('estrelas', () => {
  const resolverCom = (estado: EstadoJogo) =>
    acusar(caso, estado, 'ricardo', ['operadora_cartao', 'cartorio_detran'])

  it('3 estrelas: resolveu, sobrou dia e riscou só os inocentes', () => {
    let estado = visitar(criarEstadoInicial(caso), 'operadora_cartao', 'cartorio_detran')
    for (const id of ['aurelio', 'celia', 'marta']) estado = alternarDescarte(caso, estado, id)
    expect(avaliarDesempenho(caso, resolverCom(estado)).estrelas).toBe(3)
  })

  it('2 estrelas: resolveu com tempo, mas sem usar o caderno', () => {
    const estado = visitar(criarEstadoInicial(caso), 'operadora_cartao', 'cartorio_detran')
    expect(avaliarDesempenho(caso, resolverCom(estado)).estrelas).toBe(2)
  })

  it('riscar o culpado tira a estrela do caderno', () => {
    let estado = visitar(criarEstadoInicial(caso), 'operadora_cartao', 'cartorio_detran')
    for (const id of ['aurelio', 'celia', 'marta', 'ricardo']) estado = alternarDescarte(caso, estado, id)
    const { criterios } = avaliarDesempenho(caso, resolverCom(estado))
    expect(criterios[2].cumprido).toBe(false)
  })

  it('1 estrela: resolveu gastando todos os dias', () => {
    const estado = visitar(criarEstadoInicial(caso), 'junta_comercial', 'operadora_cartao', 'cartorio_detran')
    expect(avaliarDesempenho(caso, resolverCom(estado)).estrelas).toBe(1)
  })

  it('0 estrelas em qualquer resultado que não seja "resolvido"', () => {
    let estado = visitar(criarEstadoInicial(caso), 'operadora_cartao', 'ex_funcionario')
    for (const id of ['aurelio', 'celia', 'marta']) estado = alternarDescarte(caso, estado, id)
    const final = acusar(caso, estado, 'ricardo', ['operadora_cartao', 'ex_funcionario'])
    expect(avaliarDesempenho(caso, final).estrelas).toBe(0)
  })
})

describe('textos das pistas variam a cada partida', () => {
  it('cada local tem pelo menos 3 versões de texto', () => {
    for (const local of caso.locais) expect(versoesDaPista(local).length).toBeGreaterThanOrEqual(3)
  })

  it('o sorteio escolhe uma das versões e não muda o indício', () => {
    for (const r of [0, 0.5, 0.99]) {
      const sorteado = sortearPistas(caso, () => r)
      sorteado.locais.forEach((local, i) => {
        expect(versoesDaPista(caso.locais[i])).toContain(local.pista)
        expect(local.indicio).toBe(caso.locais[i].indicio)
      })
    }
    expect(sortearPistas(caso, () => 0).locais[0].pista).not.toBe(sortearPistas(caso, () => 0.99).locais[0].pista)
  })

  it('nenhuma versão entrega o culpado: não cita nome nem empresa de suspeito', () => {
    const proibidos = caso.suspeitos.flatMap((s) => [s.nome, s.empresa])
    for (const local of caso.locais) {
      for (const texto of versoesDaPista(local)) {
        for (const p of proibidos) expect(texto).not.toContain(p)
      }
    }
  })
})

describe('explicação da acusação', () => {
  it('caso resolvido: cada prova vale contra o culpado e cada inocente fica de fora', () => {
    const e = explicarAcusacao(caso, 'ricardo', ['cartorio_detran', 'ex_funcionario'])
    expect(e.provas.every((l) => l.ok)).toBe(true)
    expect(e.outros).toHaveLength(3)
    expect(e.outros.every((l) => l.ok)).toBe(true)
    expect(e.outros.find((l) => l.texto.startsWith('Marta'))?.texto).toContain('não tem Patrimônio incompatível')
    expect(e.culpadoEra).toBeNull()
  })

  it('auto anulado: aponta quem as provas não descartam', () => {
    const e = explicarAcusacao(caso, 'ricardo', ['operadora_cartao', 'ex_funcionario'])
    const marta = e.outros.find((l) => l.texto.startsWith('Marta'))!
    expect(marta.ok).toBe(false)
    expect(marta.texto).toContain('também tem')
    expect(e.outros.filter((l) => !l.ok)).toHaveLength(1)
  })

  it('local sem indício é apontado como prova que não serve', () => {
    const e = explicarAcusacao(caso, 'ricardo', ['junta_comercial', 'cartorio_detran'])
    expect(e.provas[0].ok).toBe(false)
    expect(e.provas[0].texto).toContain('não revela nenhum indício')
  })

  it('acusação injusta: mostra a prova que não vale contra o acusado e quem era o culpado', () => {
    const e = explicarAcusacao(caso, 'marta', ['cartorio_detran', 'praca'])
    expect(e.provas[0].ok).toBe(false)
    expect(e.provas[0].texto).toContain('Marta não tem esse indício')
    expect(e.culpadoEra).toContain('Ricardo')
  })

  it('no modo desafio, explica com o culpado sorteado', () => {
    const sorteado = sortearCaso(caso, () => 0)
    const culpado = sorteado.suspeitos.find((s) => s.id === sorteado.culpadoId)!
    const outro = sorteado.suspeitos.find((s) => s.id !== culpado.id)!
    expect(explicarAcusacao(sorteado, outro.id, ['cartorio_detran', 'praca']).culpadoEra).toContain(culpado.nome)
  })
})

describe('teste rápido', () => {
  const quiz = caso.quiz!

  it('o caso 001 tem 3 perguntas, todas com a resposta certa entre as opções', () => {
    expect(quiz).toHaveLength(3)
    for (const q of quiz) expect(q.opcoes[q.correta]).toBeDefined()
  })

  it('conta acertos; sem resposta conta como erro', () => {
    const certas = quiz.map((q) => q.correta)
    expect(pontuarQuiz(quiz, certas)).toBe(3)
    expect(pontuarQuiz(quiz, [certas[0], null, null])).toBe(1)
    expect(pontuarQuiz(quiz, [])).toBe(0)
  })

  it('a validação pega resposta certa inexistente e id repetido', () => {
    const ruim: Caso = {
      ...caso,
      quiz: [
        { ...quiz[0], correta: 5 },
        { ...quiz[1], id: quiz[0].id },
      ],
    }
    const erros = validarCaso(ruim)
    expect(erros.some((e) => e.includes('opção correta'))).toBe(true)
    expect(erros.some((e) => e.includes('id repetido'))).toBe(true)
  })
})
