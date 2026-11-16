// Tipos compartilhados entre o caso (JSON), o estado e as regras.

export type IndicioId = string
export type SuspeitoId = string
export type LocalId = string

export interface Indicio {
  id: IndicioId
  nome: string
}

export interface Suspeito {
  id: SuspeitoId
  nome: string
  empresa: string
  indicios: IndicioId[]
}

export interface Local {
  id: LocalId
  nome: string
  pista: string
  /** Indício revelado pela pista; null = local só de contexto (não serve como prova). */
  indicio: IndicioId | null
  /** "fraca" = testemunho; vale como prova, mas o texto da tela pode destacar a diferença. */
  forca?: 'forte' | 'fraca'
  /** Visitar este local libera o relatório detalhado no resultado (ex.: Portal da Transparência). */
  liberaRelatorioDetalhado?: boolean
}

export type TipoResultado =
  | 'resolvido'
  | 'auto_anulado'
  | 'acusacao_injusta'
  | 'prazo_encerrado'

export interface TextoResultado {
  titulo: string
  mensagem: string
  ensina: string
  perguntasDebate: string[]
}

export interface Impacto {
  valorRecuperado: number
  aviso: string
  resumo: string
  /** Mostrado só quando o jogador visitou um local com liberaRelatorioDetalhado. */
  detalhes: string[]
}

export interface Caso {
  id: string
  titulo: string
  briefing: string
  diasIniciais: number
  custoVisitaDias: number
  provasExigidas: number
  culpadoId: SuspeitoId
  indicios: Indicio[]
  suspeitos: Suspeito[]
  locais: Local[]
  impacto: Impacto
  resultados: Record<TipoResultado, TextoResultado>
}

export interface Resultado {
  tipo: TipoResultado
  suspeitoAcusadoId: SuspeitoId | null
  provas: LocalId[]
  /** true se o jogador visitou um local que libera o relatório detalhado. */
  relatorioDetalhado: boolean
}
