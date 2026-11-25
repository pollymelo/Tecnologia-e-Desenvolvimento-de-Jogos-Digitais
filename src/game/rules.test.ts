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
  escolherAcao,
  indicioObtido,
  precisaEscolher,
  localTrancado,
  fechadoHoje,
  diaAtual,
  sortearImprevistos,
  podeProrrogar,
  gerarDica,
  pedirProrrogacao,
  diasTotais,
} from './rules.ts'
import { casos } from './caso.ts'
import type { Caso } from './types.ts'

/** Abordagem que revela a pista do local. */
const certa = (c: Caso, id: string) => c.locais.find((l) => l.id === id)!.acoes!.find((a) => a.revela)!.id

/** Deixa a partida na última vida: o próximo auto errado encerra o caso. */
const naUltimaVida = (estado: EstadoJogo): EstadoJogo => ({ ...estado, vidasRestantes: 1 })

/** Visita os locais e, dentro de cada um, escolhe a abordagem certa. */
function visitar(estado: EstadoJogo, ...locais: string[]): EstadoJogo {
  return locais.reduce((e, id) => escolherAcao(caso, visitarLocal(caso, e, id).estado, id, certa(caso, id)), estado)
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

  it('das 36 duplas possíveis, só 6 resolvem o caso (ficha de solução)', () => {
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
      'concessionaria+ex_funcionario',
      'concessionaria+operadora_cartao',
      'concessionaria+praca',
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
    const estado = naUltimaVida(visitar(criarEstadoInicial(caso), 'operadora_cartao', 'ex_funcionario'))
    const final = acusar(caso, estado, 'ricardo', ['operadora_cartao', 'ex_funcionario'])
    expect(final.resultado?.tipo).toBe('auto_anulado')
  })

  it('acusação injusta: suspeito errado, mesmo com provas válidas para o culpado', () => {
    const estado = naUltimaVida(visitar(criarEstadoInicial(caso), 'operadora_cartao', 'cartorio_detran'))
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
  it('os locais originais do caso 001 têm pelo menos 3 versões de texto', () => {
    const originais = ['operadora_cartao', 'cartorio_detran', 'ex_funcionario', 'praca', 'junta_comercial', 'portal_transparencia']
    for (const local of caso.locais.filter((l) => originais.includes(l.id))) {
      expect(versoesDaPista(local).length).toBeGreaterThanOrEqual(3)
    }
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

describe('escolhas dentro do local', () => {
  it('a visita gasta o dia, mas a pista só vem com a abordagem escolhida', () => {
    const { estado } = visitarLocal(caso, criarEstadoInicial(caso), 'cartorio_detran')
    expect(estado.diasRestantes).toBe(2)
    expect(precisaEscolher(caso, estado, 'cartorio_detran')).toBe(true)
    expect(indicioObtido(caso, estado, 'cartorio_detran')).toBeNull()
  })

  it('a abordagem certa revela o indício; a errada não rende prova', () => {
    const base = visitarLocal(caso, criarEstadoInicial(caso), 'cartorio_detran').estado
    expect(indicioObtido(caso, escolherAcao(caso, base, 'cartorio_detran', 'certidoes'), 'cartorio_detran')).toBe('patrimonio_incompativel')
    expect(indicioObtido(caso, escolherAcao(caso, base, 'cartorio_detran', 'fofoca'), 'cartorio_detran')).toBeNull()
  })

  it('só dá para escolher uma vez, e só depois de entrar', () => {
    const base = criarEstadoInicial(caso)
    expect(() => escolherAcao(caso, base, 'cartorio_detran', 'certidoes')).toThrow(RegraError)
    const dentro = escolherAcao(caso, visitarLocal(caso, base, 'cartorio_detran').estado, 'cartorio_detran', 'fofoca')
    expect(() => escolherAcao(caso, dentro, 'cartorio_detran', 'certidoes')).toThrow(RegraError)
  })

  it('com a abordagem errada, o auto é anulado mesmo com o culpado certo', () => {
    let estado = visitarLocal(caso, criarEstadoInicial(caso), 'cartorio_detran').estado
    estado = escolherAcao(caso, estado, 'cartorio_detran', 'fofoca')
    estado = naUltimaVida(visitar(estado, 'ex_funcionario'))
    const final = acusar(caso, estado, 'ricardo', ['cartorio_detran', 'ex_funcionario'])
    expect(final.resultado?.tipo).toBe('auto_anulado')
    const e = explicarAcusacao(caso, 'ricardo', ['cartorio_detran', 'ex_funcionario'], estado)
    expect(e.provas[0].texto).toContain('a abordagem escolhida não revelou o indício')
  })
})

describe('vidas: auto errado volta para corrigir', () => {
  it('cada caso começa com 3 vidas (ou com as do JSON)', () => {
    expect(criarEstadoInicial(caso).vidasRestantes).toBe(3)
    expect(criarEstadoInicial({ ...caso, vidas: 5 }).vidasRestantes).toBe(5)
    expect(validarCaso({ ...caso, vidas: 0 })).toContain('vidas deve ser um inteiro de pelo menos 1.')
  })

  it('auto errado com vidas sobrando: perde 1 vida, guarda o auto e a partida continua', () => {
    let estado = visitar(criarEstadoInicial(caso), 'operadora_cartao', 'ex_funcionario')
    estado = acusar(caso, estado, 'marta', ['operadora_cartao', 'ex_funcionario'])
    expect(estado.resultado).toBeNull()
    expect(estado.vidasRestantes).toBe(2)
    expect(estado.autosRecusados).toEqual([
      { tipo: 'acusacao_injusta', suspeitoAcusadoId: 'marta', provas: ['operadora_cartao', 'ex_funcionario'] },
    ])
    // continua investigando e acerta
    estado = visitar(estado, 'cartorio_detran')
    estado = acusar(caso, estado, 'ricardo', ['operadora_cartao', 'cartorio_detran'])
    expect(estado.resultado?.tipo).toBe('resolvido')
    expect(estado.vidasRestantes).toBe(2)
  })

  it('o terceiro auto errado encerra o caso com o desfecho desse erro', () => {
    let estado = visitar(criarEstadoInicial(caso), 'operadora_cartao', 'ex_funcionario')
    estado = acusar(caso, estado, 'marta', ['operadora_cartao', 'ex_funcionario'])
    estado = acusar(caso, estado, 'ricardo', ['operadora_cartao', 'ex_funcionario'])
    expect(estado.resultado).toBeNull()
    estado = acusar(caso, estado, 'ricardo', ['operadora_cartao', 'ex_funcionario'])
    expect(estado.vidasRestantes).toBe(0)
    expect(estado.resultado?.tipo).toBe('auto_anulado')
    expect(estado.autosRecusados).toHaveLength(3)
  })

  it('dá para acusar de novo mesmo com os dias zerados', () => {
    let estado = visitar(criarEstadoInicial(caso), 'praca', 'operadora_cartao', 'cartorio_detran')
    expect(estado.diasRestantes).toBe(0)
    estado = acusar(caso, estado, 'marta', ['operadora_cartao', 'cartorio_detran'])
    expect(podeAcusar(caso, estado)).toBe(true)
    expect(acusar(caso, estado, 'ricardo', ['operadora_cartao', 'cartorio_detran']).resultado?.tipo).toBe('resolvido')
  })
})

describe('dicas graduais da Dona Helena', () => {
  const dica = (estado: EstadoJogo, nivel: number) => gerarDica(caso, estado, nivel).texto

  it('no começo: sem indício, não dá para riscar, e aponta um indício e um lugar', () => {
    const estado = criarEstadoInicial(caso)
    expect(dica(estado, 1)).toContain('nenhum indício')
    expect(dica(estado, 2)).toContain('não dá para riscar')
    const n3 = dica(estado, 3)
    expect(n3).toMatch(/Um lugar para procurá-lo: (Operadora de cartão|Cartório)/)
  })

  it('nível 1 lista os indícios e avisa da abordagem que não rendeu prova', () => {
    let estado = visitarLocal(caso, criarEstadoInicial(caso), 'cartorio_detran').estado
    estado = escolherAcao(caso, estado, 'cartorio_detran', 'fofoca')
    estado = visitar(estado, 'operadora_cartao')
    const n1 = dica(estado, 1)
    expect(n1).toContain('Vendas no cartão sem nota')
    expect(n1).toContain('a abordagem escolhida não rendeu prova')
  })

  it('nível 2 diz quem dá para riscar e avisa de quem foi riscado sem motivo', () => {
    let estado = visitar(criarEstadoInicial(caso), 'operadora_cartao', 'ex_funcionario')
    expect(dica(estado, 2)).toContain('dá para riscar Aurélio e Célia')
    expect(dica(estado, 2)).toContain('sobram 2 pessoas')
    estado = alternarDescarte(caso, estado, 'marta')
    expect(dica(estado, 2)).toContain('Cuidado: você riscou Marta')
  })

  it('nível 3 aponta o indício que resolve, e depois diz que já dá para emitir o auto', () => {
    let estado = visitar(criarEstadoInicial(caso), 'operadora_cartao', 'ex_funcionario')
    const n3 = dica(estado, 3)
    expect(n3).toContain('Patrimônio incompatível com a renda')
    expect(n3).toContain('Cartório') // prefere o documento ao testemunho
    estado = visitar(estado, 'cartorio_detran')
    expect(dica(estado, 3)).toContain('Você já tem o que precisa')
  })

  it('em nenhum caso, nem no modo desafio, a dica diz o nome do culpado', () => {
    for (const base of casos) {
      for (const r of [0, 0.5, 0.99]) {
        const c = sortearCaso(base, () => r)
        const culpado = c.suspeitos.find((s) => s.id === c.culpadoId)!
        const estados = [criarEstadoInicial(c)]
        for (const l of c.locais.filter((x) => !x.liberadoPor)) {
          const e = visitarLocal(c, criarEstadoInicial(c), l.id).estado
          estados.push(escolherAcao(c, e, l.id, l.acoes!.find((a) => a.revela)!.id))
        }
        for (const e of estados) {
          for (const nivel of [1, 2, 3]) expect(gerarDica(c, e, nivel).texto).not.toContain(culpado.nome)
        }
      }
    }
  })

  it('pedir dica tira a estrela do caderno', () => {
    let estado = visitar(criarEstadoInicial(caso), 'cartorio_detran', 'ex_funcionario')
    for (const id of ['aurelio', 'celia', 'marta']) estado = alternarDescarte(caso, estado, id)
    const final = acusar(caso, estado, 'ricardo', ['cartorio_detran', 'ex_funcionario'])
    expect(avaliarDesempenho(caso, final).estrelas).toBe(3)
    expect(avaliarDesempenho(caso, { ...final, dicasUsadas: 1 }).estrelas).toBe(2)
  })
})

describe('prorrogação: mais 1 dia em troca de 1 vida', () => {
  it('só com os dias zerados, e nunca na última vida', () => {
    let estado = visitar(criarEstadoInicial(caso), 'praca', 'junta_comercial')
    expect(podeProrrogar(caso, estado)).toBe(false) // ainda tem dia
    expect(() => pedirProrrogacao(caso, estado)).toThrow(RegraError)
    estado = visitar(estado, 'operadora_cartao')
    expect(estado.diasRestantes).toBe(0)
    expect(podeProrrogar(caso, estado)).toBe(true)
    expect(podeProrrogar(caso, naUltimaVida(estado))).toBe(false)
  })

  it('ganha 1 dia, perde 1 vida, e dá para visitar mais um local e resolver', () => {
    let estado = visitar(criarEstadoInicial(caso), 'praca', 'junta_comercial', 'operadora_cartao')
    estado = pedirProrrogacao(caso, estado)
    expect(estado.diasRestantes).toBe(1)
    expect(estado.vidasRestantes).toBe(2)
    expect(diasTotais(caso, estado)).toBe(caso.diasIniciais + 1)
    expect(diaAtual(caso, estado)).toBe(caso.diasIniciais + 1)
    estado = visitar(estado, 'cartorio_detran')
    expect(acusar(caso, estado, 'ricardo', ['operadora_cartao', 'cartorio_detran']).resultado?.tipo).toBe('resolvido')
  })

  it('com duas prorrogações, sobra só a última vida e não há terceira', () => {
    let estado = visitar(criarEstadoInicial(caso), 'praca', 'junta_comercial', 'operadora_cartao')
    estado = visitar(pedirProrrogacao(caso, estado), 'ex_funcionario')
    estado = pedirProrrogacao(caso, estado)
    expect(estado.vidasRestantes).toBe(1)
    estado = visitar(estado, 'concessionaria')
    expect(podeProrrogar(caso, estado)).toBe(false)
  })
})

describe('locais descobertos e imprevistos', () => {
  const [, caso002, , caso004] = casos

  it('a casa do sócio só aparece depois da Junta Comercial (caso 002)', () => {
    let estado = criarEstadoInicial(caso002)
    expect(localTrancado(caso002, estado, 'casa_socio')).toBe(true)
    expect(podeVisitar(caso002, estado, 'casa_socio')).toBe(false)
    estado = visitarLocal(caso002, estado, 'junta_comercial').estado
    expect(localTrancado(caso002, estado, 'casa_socio')).toBe(false)
    expect(podeVisitar(caso002, estado, 'casa_socio')).toBe(true)
  })

  it('local fechado num dia reabre no dia seguinte', () => {
    let estado = criarEstadoInicial(caso, { cartorio_detran: { dia: 1, motivo: 'está em greve hoje' } })
    expect(diaAtual(caso, estado)).toBe(1)
    expect(fechadoHoje(caso, estado, 'cartorio_detran')?.motivo).toBe('está em greve hoje')
    expect(podeVisitar(caso, estado, 'cartorio_detran')).toBe(false)
    expect(() => visitarLocal(caso, estado, 'cartorio_detran')).toThrow(RegraError)
    estado = visitar(estado, 'portal_transparencia') // grátis: o dia não passa
    expect(podeVisitar(caso, estado, 'cartorio_detran')).toBe(false)
    estado = visitar(estado, 'operadora_cartao')
    expect(diaAtual(caso, estado)).toBe(2)
    expect(podeVisitar(caso, estado, 'cartorio_detran')).toBe(true)
  })

  it('o sorteio fecha um local pago por dia, menos no último, e nunca o Portal nem local escondido', () => {
    for (const r of [0, 0.3, 0.6, 0.99]) {
      for (const c of casos) {
        const fechados = sortearImprevistos(c, () => r)
        const dias = Object.values(fechados).map((f) => f.dia).sort()
        expect(dias).toEqual(Array.from({ length: c.diasIniciais - 1 }, (_, i) => i + 1))
        for (const id of Object.keys(fechados)) {
          const local = c.locais.find((l) => l.id === id)!
          expect(local.custoDias ?? c.custoVisitaDias).toBeGreaterThan(0)
          expect(local.liberadoPor).toBeUndefined()
        }
      }
    }
    expect(caso004.locais.some((l) => l.liberadoPor)).toBe(true)
  })
})

describe('os sete casos da campanha', () => {
  it('todos carregam sem erro, com 9 locais, 3 moradores e 3 perguntas', () => {
    expect(casos.map((c) => c.id)).toEqual(['caso-001', 'caso-002', 'caso-003', 'caso-004', 'caso-005', 'caso-006', 'caso-007'])
    for (const c of casos) {
      expect(validarCaso(c)).toEqual([])
      expect(c.locais).toHaveLength(9)
      expect(c.moradores).toHaveLength(3)
      expect(c.quiz).toHaveLength(3)
      expect(c.marco).toBeDefined()
    }
  })

  it('em todos, todo local tem escolhas e exatamente uma revela a pista', () => {
    for (const c of casos) {
      for (const l of c.locais) expect(l.acoes?.filter((a) => a.revela)).toHaveLength(1)
    }
  })

  /** Todas as combinações de `tamanho` locais do caso. */
  const grupos = (ids: string[], tamanho: number, inicio = 0): string[][] =>
    tamanho === 0 ? [[]] : ids.slice(inicio).flatMap((id, d) => grupos(ids, tamanho - 1, inicio + d + 1).map((g) => [id, ...g]))

  it('em todos, há várias combinações de provas que resolvem o caso', () => {
    for (const c of casos) {
      const validas = grupos(c.locais.map((l) => l.id), c.provasExigidas).filter((g) => provasValidas(c, g))
      expect(validas.length).toBeGreaterThanOrEqual(4)
    }
  })

  it('caso 006: com 5 suspeitos, só "poucas notas" + "muito movimento" resolve', () => {
    const c = casos[5]
    expect(c.suspeitos).toHaveLength(5)
    for (const g of grupos(c.locais.map((l) => l.id), 2).filter((g) => provasValidas(c, g))) {
      expect(g.map((id) => c.locais.find((l) => l.id === id)!.indicio).sort()).toEqual(['movimento', 'poucas_notas'])
    }
  })

  it('caso 007: exige 3 provas; nenhum trio sem medição falsa e sem estrutura resolve', () => {
    const c = casos[6]
    expect(c.provasExigidas).toBe(3)
    expect(c.diasIniciais).toBe(4)
    for (const g of grupos(c.locais.map((l) => l.id), 3).filter((g) => provasValidas(c, g))) {
      const indicios = g.map((id) => c.locais.find((l) => l.id === id)!.indicio)
      expect(indicios).toContain('medicao_falsa')
      expect(indicios).toContain('sem_estrutura')
    }
    // duas provas não bastam: o auto exige exatamente 3
    let estado = criarEstadoInicial(c)
    for (const id of ['vistoria', 'sindicato', 'tribunal']) estado = escolherAcao(c, visitarLocal(c, estado, id).estado, id, certa(c, id))
    expect(() => acusar(c, estado, 'vanessa', ['vistoria', 'sindicato'])).toThrow(RegraError)
    expect(acusar(c, estado, 'vanessa', ['vistoria', 'sindicato', 'tribunal']).resultado?.tipo).toBe('resolvido')
  })

  it('nenhum caso fala que o IPTU paga a luz dos postes (é a COSIP)', () => {
    const textos = JSON.stringify(casos)
    expect(textos).not.toMatch(/IPTU que paga a luz|IPTU paga a luz|ilumina a praça/)
    expect(casos[2].glossario!.some((t) => t.id === 'cosip')).toBe(true)
  })

  it('o modo desafio funciona em todos os casos', () => {
    for (const c of casos) {
      for (const r of [0, 0.5, 0.99]) expect(validarCaso(sortearCaso(c, () => r))).toEqual([])
    }
  })

  it('boatos falsos continuam falsos no modo desafio: {inocente} nunca é o culpado', () => {
    for (const c of casos) {
      for (const r of [0, 0.5, 0.99]) {
        const sorteado = sortearCaso(c, () => r)
        const culpado = sorteado.suspeitos.find((s) => s.id === sorteado.culpadoId)!
        sorteado.moradores!.forEach((m, i) => {
          if (!m.verdadeira) expect(preencherTexto(sorteado, m.fala, i)).not.toContain(culpado.nome)
        })
      }
    }
  })

  it('nenhuma pista ou ação cita o nome de um suspeito', () => {
    for (const c of casos) {
      const nomes = c.suspeitos.flatMap((s) => [s.nome, s.empresa])
      for (const l of c.locais) {
        const textos = [...versoesDaPista(l), ...(l.acoes ?? []).map((a) => `${a.rotulo} ${a.texto ?? ''}`)]
        for (const t of textos) for (const n of nomes) expect(t).not.toContain(n)
      }
    }
  })
})
