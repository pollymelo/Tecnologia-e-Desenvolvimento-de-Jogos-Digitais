import type {
  Caso,
  IndicioId,
  Local,
  LocalId,
  PerguntaQuiz,
  Resultado,
  Suspeito,
  SuspeitoId,
  TipoResultado,
} from './types.ts'
import { VIDAS_PADRAO, type EstadoJogo, type Fechamento } from './state.ts'

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

/**
 * Pistas que o jogador já coletou, na ordem da visita. Cada local volta com o indício e o
 * texto que a abordagem escolhida rendeu (sem a abordagem certa, `indicio` vem null).
 */
export function pistasColetadas(caso: Caso, estado: EstadoJogo): Local[] {
  return estado.locaisVisitados.map((id) => ({
    ...buscarLocal(caso, id),
    indicio: indicioObtido(caso, estado, id),
    pista: textoObtido(caso, estado, id),
  }))
}

/** Indício que a visita realmente rendeu: depende da abordagem escolhida dentro do local. */
export function indicioObtido(caso: Caso, estado: EstadoJogo, localId: LocalId): IndicioId | null {
  const local = buscarLocal(caso, localId)
  if (!estado.locaisVisitados.includes(localId)) return null
  if (!local.acoes?.length) return local.indicio
  const acao = local.acoes.find((a) => a.id === estado.escolhas[localId])
  return acao?.revela ? local.indicio : null
}

/** Texto que o jogador leu no local (a pista, ou o resultado da abordagem escolhida). */
export function textoObtido(caso: Caso, estado: EstadoJogo, localId: LocalId): string {
  const local = buscarLocal(caso, localId)
  if (!local.acoes?.length) return local.pista
  const acao = local.acoes.find((a) => a.id === estado.escolhas[localId])
  if (!acao) return ''
  return acao.revela ? local.pista : (acao.texto ?? '')
}

/** true se o jogador já entrou no local, mas ainda não escolheu o que fazer lá dentro. */
export function precisaEscolher(caso: Caso, estado: EstadoJogo, localId: LocalId): boolean {
  const local = buscarLocal(caso, localId)
  return Boolean(local.acoes?.length) && estado.locaisVisitados.includes(localId) && !estado.escolhas[localId]
}

/** Total de dias da partida: os do caso mais os ganhos com prorrogação. */
export function diasTotais(caso: Caso, estado: EstadoJogo): number {
  return caso.diasIniciais + estado.diasExtras
}

/** Dia da investigação (1 = primeiro dia). Local grátis não faz o dia passar. */
export function diaAtual(caso: Caso, estado: EstadoJogo): number {
  const total = diasTotais(caso, estado)
  return Math.min(total, total - estado.diasRestantes + 1)
}

/** Vidas com que o caso começa. */
export function vidasIniciais(caso: Caso): number {
  return caso.vidas ?? VIDAS_PADRAO
}

/**
 * Prorrogação: com os dias zerados, a chefia concede mais 1 dia em troca de 1 vida.
 * Não existe na última vida, para o caso sempre poder terminar.
 */
export function podeProrrogar(_caso: Caso, estado: EstadoJogo): boolean {
  return estado.resultado === null && estado.diasRestantes === 0 && estado.vidasRestantes > 1
}

export function pedirProrrogacao(caso: Caso, estado: EstadoJogo): EstadoJogo {
  if (!podeProrrogar(caso, estado)) throw new RegraError('Não é possível pedir prorrogação agora.')
  return {
    ...estado,
    diasRestantes: estado.diasRestantes + caso.custoVisitaDias,
    diasExtras: estado.diasExtras + caso.custoVisitaDias,
    vidasRestantes: estado.vidasRestantes - 1,
  }
}

/** Imprevisto de hoje no local, se houver. */
export function fechadoHoje(caso: Caso, estado: EstadoJogo, localId: LocalId): Fechamento | null {
  const f = estado.fechados[localId]
  return f && f.dia === diaAtual(caso, estado) ? f : null
}

/** O local ainda não apareceu no mapa (depende de outra visita para ser descoberto). */
export function localTrancado(caso: Caso, estado: EstadoJogo, localId: LocalId): boolean {
  const local = buscarLocal(caso, localId)
  return local.liberadoPor !== undefined && !estado.locaisVisitados.includes(local.liberadoPor)
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
    !estado.locaisVisitados.includes(localId) &&
    !localTrancado(caso, estado, localId) &&
    fechadoHoje(caso, estado, localId) === null
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
  if (localTrancado(caso, estado, localId)) throw new RegraError(`Local ainda não descoberto: ${local.nome}`)
  if (fechadoHoje(caso, estado, localId)) throw new RegraError(`Local fechado hoje: ${local.nome}`)

  return {
    estado: {
      ...estado,
      diasRestantes: estado.diasRestantes - custo,
      locaisVisitados: [...estado.locaisVisitados, localId],
    },
    pista: local,
  }
}

/** Escolhe o que fazer dentro de um local já visitado. Uma escolha só, sem volta. */
export function escolherAcao(caso: Caso, estado: EstadoJogo, localId: LocalId, acaoId: string): EstadoJogo {
  if (estado.resultado !== null) throw new RegraError('A partida já terminou.')
  const local = buscarLocal(caso, localId)
  if (!estado.locaisVisitados.includes(localId)) throw new RegraError(`Local ainda não visitado: ${local.nome}`)
  if (estado.escolhas[localId]) throw new RegraError(`Você já escolheu o que fazer em: ${local.nome}`)
  if (!local.acoes?.some((a) => a.id === acaoId)) throw new RegraError(`Ação inexistente: ${acaoId}`)
  return { ...estado, escolhas: { ...estado.escolhas, [localId]: acaoId } }
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

/**
 * Emite o auto de infração contra um suspeito, fundamentado nas provas (locais visitados).
 * Auto errado com vidas sobrando: a chefia devolve o auto, o jogador perde uma vida e continua
 * investigando (resultado continua null). Na última vida, o erro encerra o caso.
 */
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

  const tipo = calcularTipoResultado(caso, suspeitoId, provas, estado)
  if (tipo === 'resolvido') {
    return { ...estado, resultado: montarResultado(caso, estado, tipo, suspeitoId, provas) }
  }
  const vidasRestantes = estado.vidasRestantes - 1
  const autosRecusados = [...estado.autosRecusados, { tipo, suspeitoAcusadoId: suspeitoId, provas }]
  return {
    ...estado,
    vidasRestantes,
    autosRecusados,
    resultado: vidasRestantes > 0 ? null : montarResultado(caso, estado, tipo, suspeitoId, provas),
  }
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

/**
 * Indícios das provas escolhidas. Locais só de contexto (ou visitados com a abordagem errada)
 * não contribuem com indício. Sem `estado`, considera a abordagem certa (usado na validação).
 */
function indiciosDasProvas(caso: Caso, provas: LocalId[], estado?: EstadoJogo): (IndicioId | null)[] {
  return provas.map((id) => (estado ? indicioObtido(caso, estado, id) : buscarLocal(caso, id).indicio))
}

/**
 * As provas são válidas se:
 * 1. todas forem indícios que o culpado tem; e
 * 2. juntas, descartarem todos os outros suspeitos
 *    (cada outro suspeito deixa de ter pelo menos um desses indícios).
 */
export function provasValidas(caso: Caso, provas: LocalId[], estado?: EstadoJogo): boolean {
  const culpado = buscarSuspeito(caso, caso.culpadoId)
  const indicios = indiciosDasProvas(caso, provas, estado)

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
  estado?: EstadoJogo,
): Exclude<TipoResultado, 'prazo_encerrado'> {
  if (suspeitoId !== caso.culpadoId) return 'acusacao_injusta'
  return provasValidas(caso, provas, estado) ? 'resolvido' : 'auto_anulado'
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
  if (caso.vidas !== undefined && (!Number.isInteger(caso.vidas) || caso.vidas < 1)) erros.push('vidas deve ser um inteiro de pelo menos 1.')
  if (caso.custoVisitaDias < 1) erros.push('custoVisitaDias deve ser pelo menos 1.')

  for (const s of caso.suspeitos) {
    for (const i of s.indicios) {
      if (!indicios.has(i)) erros.push(`Suspeito "${s.id}" tem indício desconhecido "${i}".`)
    }
  }
  for (const l of caso.locais) {
    if (l.variacoes?.some((v) => v.trim() === '')) erros.push(`Local "${l.id}" tem variação de pista vazia.`)
    if (l.custoDias !== undefined && l.custoDias < 0) erros.push(`Local "${l.id}" tem custoDias negativo.`)
    if (l.indicio !== null && !indicios.has(l.indicio)) {
      erros.push(`Local "${l.id}" revela indício desconhecido "${l.indicio}".`)
    }
  }
  // O mapa de Vila Aurora tem 10 lotes para locais (src/ui/mapa.ts, LOTES_LOCAIS).
  if (caso.locais.length > 10) erros.push('O mapa comporta no máximo 10 locais.')
  const idsLocais = new Set(caso.locais.map((l) => l.id))
  for (const l of caso.locais) {
    if (l.acoes) {
      if (l.acoes.length < 2) erros.push(`Local "${l.id}" precisa de pelo menos 2 ações.`)
      if (l.acoes.filter((a) => a.revela).length !== 1) erros.push(`Local "${l.id}" precisa de exatamente 1 ação que revela a pista.`)
      if (l.acoes.some((a) => !a.revela && !a.texto?.trim())) erros.push(`Local "${l.id}" tem ação sem texto.`)
      if (new Set(l.acoes.map((a) => a.id)).size !== l.acoes.length) erros.push(`Local "${l.id}" tem ações com id repetido.`)
    }
    if (l.liberadoPor !== undefined && (!idsLocais.has(l.liberadoPor) || l.liberadoPor === l.id)) {
      erros.push(`Local "${l.id}" é liberado por um local que não existe.`)
    }
  }
  if ((caso.moradores?.length ?? 0) > 4) erros.push('No máximo 4 moradores por caso.')
  if (new Set(caso.locais.map((l) => l.id)).size !== caso.locais.length) {
    erros.push('Há locais com id repetido.')
  }
  if (suspeitos.size !== caso.suspeitos.length) erros.push('Há suspeitos com id repetido.')
  for (const q of caso.quiz ?? []) {
    if (q.opcoes.length < 2) erros.push(`Pergunta "${q.id}" precisa de pelo menos 2 opções.`)
    if (!Number.isInteger(q.correta) || q.correta < 0 || q.correta >= q.opcoes.length) {
      erros.push(`Pergunta "${q.id}" aponta uma opção correta que não existe.`)
    }
  }
  if (caso.quiz && new Set(caso.quiz.map((q) => q.id)).size !== caso.quiz.length) {
    erros.push('Há perguntas do teste com id repetido.')
  }

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

/**
 * Troca {culpado} e {empresa} pelo nome e pela empresa do culpado do caso, e {inocente} por um
 * dos inocentes (o de número `qual`), para boatos falsos continuarem falsos no modo desafio.
 */
export function preencherTexto(caso: Caso, texto: string, qual = 0): string {
  const culpado = buscarSuspeito(caso, caso.culpadoId)
  const inocentes = caso.suspeitos.filter((s) => s.id !== culpado.id)
  const inocente = inocentes[qual % inocentes.length]
  return texto
    .replaceAll('{culpado}', culpado.nome)
    .replaceAll('{empresa}', culpado.empresa)
    .replaceAll('{inocente}', inocente?.nome ?? '')
}

// ---------- Imprevistos ----------

const MOTIVOS_FECHADO = [
  'está fechado para reforma hoje',
  'está em greve hoje',
  'ficou sem luz e fechou hoje',
  'fechou por causa do feriado do bairro',
]

/**
 * Sorteia os imprevistos da partida: em cada dia, menos o último, um local pago fica fechado.
 * O local reabre no dia seguinte, então o caso continua com solução.
 */
export function sortearImprevistos(caso: Caso, aleatorio: Aleatorio = Math.random): Record<LocalId, Fechamento> {
  const candidatos = caso.locais.filter((l) => custoDoLocal(caso, l) > 0 && l.liberadoPor === undefined)
  const fechados: Record<LocalId, Fechamento> = {}
  for (let dia = 1; dia < caso.diasIniciais && candidatos.length > 0; dia++) {
    const [local] = candidatos.splice(Math.floor(aleatorio() * candidatos.length), 1)
    fechados[local.id] = { dia, motivo: MOTIVOS_FECHADO[Math.floor(aleatorio() * MOTIVOS_FECHADO.length)] }
  }
  return fechados
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
 * - Caderno em ordem: todos os inocentes riscados e o culpado não riscado, sem pedir dica.
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
    {
      texto: 'Caderno em ordem, sem pedir dica',
      cumprido: resolvido && cadernoEmOrdem && estado.dicasUsadas === 0,
    },
  ]
  return { estrelas: criterios.filter((c) => c.cumprido).length, criterios }
}

// ---------- Textos variados a cada partida ----------

/** Todas as versões possíveis do texto da pista de um local. */
export function versoesDaPista(local: Local): string[] {
  return [local.pista, ...(local.variacoes ?? [])]
}

/**
 * Sorteia uma versão do texto de cada pista. O indício revelado não muda:
 * só a forma como a testemunha conta.
 */
export function sortearPistas(caso: Caso, aleatorio: Aleatorio = Math.random): Caso {
  return {
    ...caso,
    locais: caso.locais.map((local) => {
      const versoes = versoesDaPista(local)
      return { ...local, pista: versoes[Math.floor(aleatorio() * versoes.length)] }
    }),
  }
}

// ---------- Por que deu esse resultado ----------

export interface LinhaExplicacao {
  texto: string
  /** true = esse ponto ajudou a acusação; false = foi onde ela falhou. */
  ok: boolean
}

export interface Explicacao {
  /** Uma linha por prova: o que ela aponta e se vale contra o acusado. */
  provas: LinhaExplicacao[]
  /** Uma linha por outro suspeito: se as provas o descartam ou não. */
  outros: LinhaExplicacao[]
  /** Só quando a pessoa acusada era inocente: quem tinha todos os indícios. */
  culpadoEra: string | null
}

/**
 * Explica, em linguagem do jogador, por que a acusação deu certo ou errado.
 * Mostra o raciocínio: cada prova precisa valer contra o acusado e, juntas,
 * precisam descartar todos os outros suspeitos.
 */
export function explicarAcusacao(
  caso: Caso,
  suspeitoId: SuspeitoId,
  provas: LocalId[],
  estado?: EstadoJogo,
): Explicacao {
  const acusado = buscarSuspeito(caso, suspeitoId)
  const nome = (id: IndicioId) => caso.indicios.find((i) => i.id === id)?.nome ?? id
  const indicios = indiciosDasProvas(caso, provas, estado).filter((i): i is IndicioId => i !== null)

  const linhasProvas = provas.map((id): LinhaExplicacao => {
    const original = buscarLocal(caso, id)
    const local = { ...original, indicio: estado ? indicioObtido(caso, estado, id) : original.indicio }
    if (local.indicio === null && original.indicio !== null) {
      return {
        texto: `Em ${local.nome}, a abordagem escolhida não revelou o indício: sem documento ou testemunho, não há prova.`,
        ok: false,
      }
    }
    if (local.indicio === null) {
      return { texto: `${local.nome} não revela nenhum indício: ajuda a entender o caso, mas não serve de prova.`, ok: false }
    }
    return acusado.indicios.includes(local.indicio)
      ? { texto: `${local.nome} aponta ${nome(local.indicio)}, e ${acusado.nome} tem esse indício.`, ok: true }
      : { texto: `${local.nome} aponta ${nome(local.indicio)}, mas ${acusado.nome} não tem esse indício.`, ok: false }
  })

  const outros = caso.suspeitos
    .filter((s) => s.id !== acusado.id)
    .map((outro): LinhaExplicacao => {
      const falta = indicios.find((i) => !outro.indicios.includes(i))
      if (falta) return { texto: `${outro.nome} fica de fora: não tem ${nome(falta)}.`, ok: true }
      const tem = [...new Set(indicios)].map(nome)
      return {
        texto: tem.length
          ? `${outro.nome} também tem ${tem.join(' e ')}: essas provas não descartam essa pessoa.`
          : `Nada nas provas descarta ${outro.nome}.`,
        ok: false,
      }
    })

  const culpado = buscarSuspeito(caso, caso.culpadoId)
  const culpadoEra =
    acusado.id === culpado.id
      ? null
      : `Quem tinha todos os indícios do caso era ${culpado.nome} (${culpado.empresa}).`

  return { provas: linhasProvas, outros, culpadoEra }
}

// ---------- Teste rápido (antes e depois) ----------

/** Quantas respostas estão certas. Resposta ausente ou null conta como errada. */
export function pontuarQuiz(quiz: PerguntaQuiz[], respostas: (number | null)[]): number {
  return quiz.filter((q, i) => respostas[i] === q.correta).length
}


// ---------- Dicas graduais da Dona Helena ----------

/** Quantos níveis de dica existem: do geral ao específico. */
export const NIVEIS_DICA = 3

export interface Dica {
  nivel: number
  titulo: string
  texto: string
}

/** Indícios que o jogador realmente obteve (abordagem certa), sem repetição, na ordem da visita. */
export function indiciosEncontrados(caso: Caso, estado: EstadoJogo): IndicioId[] {
  const ids = estado.locaisVisitados.map((id) => indicioObtido(caso, estado, id)).filter((i): i is IndicioId => i !== null)
  return [...new Set(ids)]
}

/** Suspeitos que têm todos os indícios encontrados até agora (ainda não dá para descartar). */
export function suspeitosPossiveis(caso: Caso, estado: EstadoJogo): Suspeito[] {
  const encontrados = indiciosEncontrados(caso, estado)
  return caso.suspeitos.filter((s) => encontrados.every((i) => s.indicios.includes(i)))
}

/**
 * Algum grupo de até `provasExigidas` indícios (tirados de `indicios`) fundamenta o auto?
 * Mesma regra de provasValidas: todos do culpado e, juntos, descartam os outros.
 */
function indiciosBastam(caso: Caso, indicios: IndicioId[]): boolean {
  const culpado = buscarSuspeito(caso, caso.culpadoId)
  const validos = indicios.filter((i) => culpado.indicios.includes(i))
  const descartaTodos = (grupo: IndicioId[]) =>
    caso.suspeitos.filter((s) => s.id !== culpado.id).every((s) => grupo.some((i) => !s.indicios.includes(i)))
  const testar = (inicio: number, grupo: IndicioId[]): boolean => {
    if (grupo.length > 0 && descartaTodos(grupo)) return true
    if (grupo.length === caso.provasExigidas) return false
    for (let k = inicio; k < validos.length; k++) if (testar(k + 1, [...grupo, validos[k]])) return true
    return false
  }
  return testar(0, [])
}

/** Já existe, entre as pistas coletadas, um grupo de provas que resolve o caso? */
export function temProvasSuficientes(caso: Caso, estado: EstadoJogo): boolean {
  const ids = estado.locaisVisitados.filter((id) => indicioObtido(caso, estado, id) !== null)
  const testar = (inicio: number, grupo: LocalId[]): boolean => {
    if (grupo.length === caso.provasExigidas) return provasValidas(caso, grupo, estado)
    for (let k = inicio; k < ids.length; k++) if (testar(k + 1, [...grupo, ids[k]])) return true
    return false
  }
  return testar(0, [])
}

const lista = (itens: string[]) =>
  itens.length <= 1 ? (itens[0] ?? '') : `${itens.slice(0, -1).join(', ')} e ${itens[itens.length - 1]}`

/**
 * Dica da Dona Helena para o momento da partida, do geral (nível 1) ao específico (nível 3).
 * Nenhum nível diz quem é o culpado: o nível 2 só usa o que o caderno já mostra, e o
 * nível 3 aponta um indício que falta e um lugar onde procurá-lo.
 */
export function gerarDica(caso: Caso, estado: EstadoJogo, nivel: number): Dica {
  const nome = (id: IndicioId) => caso.indicios.find((i) => i.id === id)?.nome ?? id
  const encontrados = indiciosEncontrados(caso, estado)
  const possiveis = suspeitosPossiveis(caso, estado)
  const provas = caso.provasExigidas === 1 ? '1 prova' : `${caso.provasExigidas} provas`
  const semProva = estado.locaisVisitados.filter((id) => buscarLocal(caso, id).indicio !== null && indicioObtido(caso, estado, id) === null)

  if (nivel <= 1) {
    const partes: string[] = []
    if (encontrados.length === 0) {
      partes.push('Você ainda não encontrou nenhum indício.')
      partes.push('Prefira lugares com documento oficial ou com quem viu de perto. Lá dentro, pense no que vira prova: documento, medição ou testemunho direto, e não palpite, pressão ou fofoca.')
    } else {
      partes.push(`Você já tem ${encontrados.length === 1 ? 'um indício' : `${encontrados.length} indícios`}: ${lista(encontrados.map((i) => `"${nome(i)}"`))}.`)
      partes.push(`Para o auto, você precisa de ${provas} que, juntas, só batam com uma pessoa.`)
    }
    if (semProva.length > 0) {
      const locais = semProva.map((id) => buscarLocal(caso, id).nome)
      partes.push(`Em ${lista(locais)}, a abordagem escolhida não rendeu prova.`)
    }
    return { nivel: 1, titulo: 'O que você já tem?', texto: partes.join(' ') }
  }

  if (nivel === 2) {
    if (encontrados.length === 0) {
      return {
        nivel: 2,
        titulo: 'Quem ainda não foi riscado?',
        texto: 'Sem nenhum indício, ainda não dá para riscar ninguém com segurança. Encontre o primeiro indício e volte ao caderno.',
      }
    }
    const partes: string[] = []
    const podeRiscar = caso.suspeitos.filter((s) => !possiveis.includes(s) && !estado.descartados.includes(s.id))
    const riscouErrado = possiveis.filter((s) => estado.descartados.includes(s.id))
    if (podeRiscar.length > 0) {
      partes.push(`Pelos indícios que você tem, dá para riscar ${lista(podeRiscar.map((s) => s.nome))}: ${podeRiscar.length === 1 ? 'essa pessoa não tem' : 'essas pessoas não têm'} pelo menos um deles.`)
    } else {
      partes.push('O seu caderno está em dia com os indícios encontrados.')
    }
    if (riscouErrado.length > 0) {
      partes.push(`Cuidado: você riscou ${lista(riscouErrado.map((s) => s.nome))}, mas ${riscouErrado.length === 1 ? 'essa pessoa tem' : 'essas pessoas têm'} todos os indícios encontrados até agora.`)
    }
    partes.push(
      possiveis.length === 1
        ? 'Só sobra uma pessoa com todos os indícios.'
        : `Ainda sobram ${possiveis.length} pessoas com todos os indícios: falta um indício que as separe.`,
    )
    return { nivel: 2, titulo: 'Quem ainda não foi riscado?', texto: partes.join(' ') }
  }

  // Nível 3: o que procurar
  if (temProvasSuficientes(caso, estado)) {
    return {
      nivel: 3,
      titulo: 'O que falta procurar?',
      texto: `Você já tem o que precisa. No auto, escolha ${provas} que, juntas, descartem todos os outros suspeitos. O caderno mostra quem cada indício deixa de fora.`,
    }
  }
  // Locais ainda úteis: não visitados e não fechados hoje (um local escondido conta, com o aviso de onde ele aparece).
  const aindaDa = (l: Local) => !estado.locaisVisitados.includes(l.id) && fechadoHoje(caso, estado, l.id) === null
  const faltam = caso.indicios.map((i) => i.id).filter((i) => !encontrados.includes(i))
  const opcoes = faltam
    .map((i) => {
      const locais = caso.locais.filter((l) => l.indicio === i && aindaDa(l))
      const separa = possiveis.filter((s) => !s.indicios.includes(i)).length
      const resolve = indiciosBastam(caso, [...encontrados, i])
      return { i, locais, nota: (resolve ? 100 : 0) + separa }
    })
    .filter((o) => o.locais.length > 0)
    .sort((a, b) => b.nota - a.nota)
  const melhor = opcoes[0]
  if (!melhor) {
    return {
      nivel: 3,
      titulo: 'O que falta procurar?',
      texto: 'Não sobrou nenhum lugar onde encontrar um indício novo. Emita o auto com as melhores provas que você tem, ou encerre o caso e tente de novo com outro caminho.',
    }
  }
  // Prefere documento (forte), e um local que já esteja no mapa.
  const local = [...melhor.locais].sort(
    (a, b) => Number(localTrancado(caso, estado, a.id)) - Number(localTrancado(caso, estado, b.id)) || Number(a.forca === 'fraca') - Number(b.forca === 'fraca'),
  )[0]
  const escondido = localTrancado(caso, estado, local.id)
    ? ` Ele aparece no mapa depois que você visitar ${buscarLocal(caso, local.liberadoPor!).nome}.`
    : ''
  return {
    nivel: 3,
    titulo: 'O que falta procurar?',
    texto: `O indício "${nome(melhor.i)}" ajudaria a separar quem sobrou. Um lugar para procurá-lo: ${local.nome}.${escondido} Lá dentro, escolha o caminho legal.`,
  }
}
