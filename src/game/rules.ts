import type {
  Caso,
  IndicioId,
  Local,
  LocalId,
  Resultado,
  Suspeito,
  SuspeitoId,
  TipoResultado,
} from './types.ts'
import type { EstadoJogo } from './state.ts'

/** Ação inválida para o estado atual. A interface deve impedir que isso aconteça. */
export class RegraError extends Error {
  constructor(mensagem: string) {
    super(mensagem)
    this.name = 'RegraError'
  }
}

// ---------- Consultas ----------

export function buscarLocal(caso: Caso, localId: LocalId): Local {
  const local = caso.locais.find((l) => l.id === localId)
  if (!local) throw new RegraError(`Local inexistente: ${localId}`)
  return local
}

export function buscarSuspeito(caso: Caso, suspeitoId: SuspeitoId): Suspeito {
  const suspeito = caso.suspeitos.find((s) => s.id === suspeitoId)
  if (!suspeito) throw new RegraError(`Suspeito inexistente: ${suspeitoId}`)
  return suspeito
}

/** Pistas que o jogador já coletou, na ordem da visita. */
export function pistasColetadas(caso: Caso, estado: EstadoJogo): Local[] {
  return estado.locaisVisitados.map((id) => buscarLocal(caso, id))
}

/** Dias que a visita a um local custa (o local pode sobrescrever o custo padrão do caso). */
export function custoDoLocal(caso: Caso, local: Local): number {
  return local.custoDias ?? caso.custoVisitaDias
}

export function podeVisitar(caso: Caso, estado: EstadoJogo, localId: LocalId): boolean {
  const local = caso.locais.find((l) => l.id === localId)
  return (
    local !== undefined &&
    estado.resultado === null &&
    estado.diasRestantes >= custoDoLocal(caso, local) &&
    !estado.locaisVisitados.includes(localId)
  )
}

/**
 * Pode acusar se a partida está em andamento e há pistas suficientes para escolher.
 * Acusar não gasta dia: mesmo com 0 dias restantes ainda é possível emitir o auto.
 */
export function podeAcusar(caso: Caso, estado: EstadoJogo): boolean {
  return estado.resultado === null && estado.locaisVisitados.length >= caso.provasExigidas
}

// ---------- Ações ----------

/** Visita um local: gasta dias e coleta a pista dele. */
export function visitarLocal(
  caso: Caso,
  estado: EstadoJogo,
  localId: LocalId,
): { estado: EstadoJogo; pista: Local } {
  if (estado.resultado !== null) throw new RegraError('A partida já terminou.')
  const local = buscarLocal(caso, localId)
  if (estado.locaisVisitados.includes(localId)) {
    throw new RegraError(`Local já visitado: ${local.nome}`)
  }
  const custo = custoDoLocal(caso, local)
  if (estado.diasRestantes < custo) {
    throw new RegraError('Não há dias suficientes para visitar outro local.')
  }

  return {
    estado: {
      ...estado,
      diasRestantes: estado.diasRestantes - custo,
      locaisVisitados: [...estado.locaisVisitados, localId],
    },
    pista: local,
  }
}

/** Marca ou desmarca um suspeito como descartado no caderno. */
export function alternarDescarte(
  caso: Caso,
  estado: EstadoJogo,
  suspeitoId: SuspeitoId,
): EstadoJogo {
  if (estado.resultado !== null) throw new RegraError('A partida já terminou.')
  buscarSuspeito(caso, suspeitoId)
  const descartados = estado.descartados.includes(suspeitoId)
    ? estado.descartados.filter((id) => id !== suspeitoId)
    : [...estado.descartados, suspeitoId]
  return { ...estado, descartados }
}

/** Emite o auto de infração contra um suspeito, fundamentado nas provas (locais visitados). */
export function acusar(
  caso: Caso,
  estado: EstadoJogo,
  suspeitoId: SuspeitoId,
  provas: LocalId[],
): EstadoJogo {
  if (estado.resultado !== null) throw new RegraError('A partida já terminou.')
  buscarSuspeito(caso, suspeitoId)
  if (provas.length !== caso.provasExigidas) {
    throw new RegraError(`Escolha exatamente ${caso.provasExigidas} provas.`)
  }
  if (new Set(provas).size !== provas.length) {
    throw new RegraError('As provas precisam ser diferentes.')
  }
  for (const prova of provas) {
    if (!estado.locaisVisitados.includes(prova)) {
      throw new RegraError(`A prova "${prova}" ainda não foi coletada.`)
    }
  }

  const tipo = calcularTipoResultado(caso, suspeitoId, provas)
  return { ...estado, resultado: montarResultado(caso, estado, tipo, suspeitoId, provas) }
}

/**
 * Encerra a partida sem acusação ("Prazo encerrado").
 * A interface chama isto quando os dias acabam e o jogador não emite o auto.
 */
export function encerrarPrazo(caso: Caso, estado: EstadoJogo): EstadoJogo {
  if (estado.resultado !== null) throw new RegraError('A partida já terminou.')
  return {
    ...estado,
    resultado: montarResultado(caso, estado, 'prazo_encerrado', null, []),
  }
}

// ---------- Validação da acusação ----------

/** Indícios das provas escolhidas. Locais só de contexto não contribuem com indício. */
function indiciosDasProvas(caso: Caso, provas: LocalId[]): (IndicioId | null)[] {
  return provas.map((id) => buscarLocal(caso, id).indicio)
}

/**
 * As provas são válidas se:
 * 1. todas forem indícios que o culpado tem; e
 * 2. juntas, descartarem todos os outros suspeitos
 *    (cada outro suspeito deixa de ter pelo menos um desses indícios).
 */
export function provasValidas(caso: Caso, provas: LocalId[]): boolean {
  const culpado = buscarSuspeito(caso, caso.culpadoId)
  const indicios = indiciosDasProvas(caso, provas)

  const todasDoCulpado = indicios.every((i) => i !== null && culpado.indicios.includes(i))
  if (!todasDoCulpado) return false

  return caso.suspeitos
    .filter((s) => s.id !== culpado.id)
    .every((outro) => indicios.some((i) => i !== null && !outro.indicios.includes(i)))
}

export function calcularTipoResultado(
  caso: Caso,
  suspeitoId: SuspeitoId,
  provas: LocalId[],
): Exclude<TipoResultado, 'prazo_encerrado'> {
  if (suspeitoId !== caso.culpadoId) return 'acusacao_injusta'
  return provasValidas(caso, provas) ? 'resolvido' : 'auto_anulado'
}

function montarResultado(
  caso: Caso,
  estado: EstadoJogo,
  tipo: TipoResultado,
  suspeitoAcusadoId: SuspeitoId | null,
  provas: LocalId[],
): Resultado {
  const relatorioDetalhado = estado.locaisVisitados.some(
    (id) => buscarLocal(caso, id).liberaRelatorioDetalhado === true,
  )
  return { tipo, suspeitoAcusadoId, provas, relatorioDetalhado }
}

// ---------- Validação do JSON do caso ----------

/**
 * Confere a consistência de um caso carregado do JSON. Como novos casos podem ser
 * criados só editando o JSON, isso pega erros de digitação antes de o jogo começar.
 */
export function validarCaso(caso: Caso): string[] {
  const erros: string[] = []
  const indicios = new Set(caso.indicios.map((i) => i.id))
  const suspeitos = new Set(caso.suspeitos.map((s) => s.id))

  if (!suspeitos.has(caso.culpadoId)) erros.push(`culpadoId "${caso.culpadoId}" não é um suspeito.`)
  if (caso.diasIniciais < 1) erros.push('diasIniciais deve ser pelo menos 1.')
  if (caso.custoVisitaDias < 1) erros.push('custoVisitaDias deve ser pelo menos 1.')

  for (const s of caso.suspeitos) {
    for (const i of s.indicios) {
      if (!indicios.has(i)) erros.push(`Suspeito "${s.id}" tem indício desconhecido "${i}".`)
    }
  }
  for (const l of caso.locais) {
    if (l.custoDias !== undefined && l.custoDias < 0) erros.push(`Local "${l.id}" tem custoDias negativo.`)
    if (l.indicio !== null && !indicios.has(l.indicio)) {
      erros.push(`Local "${l.id}" revela indício desconhecido "${l.indicio}".`)
    }
  }
  if (new Set(caso.locais.map((l) => l.id)).size !== caso.locais.length) {
    erros.push('Há locais com id repetido.')
  }
  if (suspeitos.size !== caso.suspeitos.length) erros.push('Há suspeitos com id repetido.')

  // O caso precisa ter solução: algum par (ou grupo) de locais com provas válidas.
  if (erros.length === 0 && !existeSolucao(caso)) {
    erros.push('Nenhuma combinação de locais fundamenta a acusação do culpado.')
  }
  return erros
}

function existeSolucao(caso: Caso): boolean {
  const combinar = (inicio: number, escolhidos: LocalId[]): boolean => {
    if (escolhidos.length === caso.provasExigidas) return provasValidas(caso, escolhidos)
    for (let i = inicio; i < caso.locais.length; i++) {
      if (combinar(i + 1, [...escolhidos, caso.locais[i].id])) return true
    }
    return false
  }
  return combinar(0, [])
}

// ---------- Modo desafio: culpado sorteado ----------

/** Gerador de números aleatórios entre 0 e 1 (injetável para testes). */
export type Aleatorio = () => number

/**
 * Sorteia quem é quem: as combinações de indícios dos suspeitos são embaralhadas entre eles.
 * A estrutura do caso (culpado com todos os indícios, armadilha, iscas) continua a mesma,
 * então ele sempre tem solução. Só muda quem ocupa cada papel.
 */
export function sortearCaso(caso: Caso, aleatorio: Aleatorio = Math.random): Caso {
  const conjuntos = caso.suspeitos.map((s) => [...s.indicios])
  const indiceCulpado = caso.suspeitos.findIndex((s) => s.id === caso.culpadoId)

  // Fisher-Yates
  const ordem = conjuntos.map((_, i) => i)
  for (let i = ordem.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1))
    ;[ordem[i], ordem[j]] = [ordem[j], ordem[i]]
  }

  const suspeitos = caso.suspeitos.map((s, i) => ({ ...s, indicios: conjuntos[ordem[i]] }))
  const novoCulpado = caso.suspeitos[ordem.indexOf(indiceCulpado)].id
  return { ...caso, suspeitos, culpadoId: novoCulpado }
}

/** Troca {culpado} e {empresa} pelo nome e pela empresa do culpado do caso. */
export function preencherTexto(caso: Caso, texto: string): string {
  const culpado = buscarSuspeito(caso, caso.culpadoId)
  return texto.replaceAll('{culpado}', culpado.nome).replaceAll('{empresa}', culpado.empresa)
}

// ---------- Desempenho (estrelas) ----------

export interface Criterio {
  texto: string
  cumprido: boolean
}

export interface Desempenho {
  estrelas: number
  criterios: Criterio[]
}

/**
 * Até 3 estrelas, uma por critério. Só um caso resolvido pontua.
 * - Resolver o caso com provas válidas.
 * - Terminar com pelo menos 1 dia sobrando (investigar com eficiência).
 * - Caderno em ordem: todos os inocentes riscados e o culpado não riscado.
 */
export function avaliarDesempenho(caso: Caso, estado: EstadoJogo): Desempenho {
  const resolvido = estado.resultado?.tipo === 'resolvido'
  const inocentes = caso.suspeitos.filter((s) => s.id !== caso.culpadoId).map((s) => s.id)
  const cadernoEmOrdem =
    inocentes.every((id) => estado.descartados.includes(id)) &&
    !estado.descartados.includes(caso.culpadoId)

  const criterios: Criterio[] = [
    { texto: 'Caso resolvido com provas válidas', cumprido: resolvido },
    { texto: 'Sobrou pelo menos 1 dia', cumprido: resolvido && estado.diasRestantes >= 1 },
    { texto: 'Caderno em ordem: só os inocentes riscados', cumprido: resolvido && cadernoEmOrdem },
  ]
  return { estrelas: criterios.filter((c) => c.cumprido).length, criterios }
}
