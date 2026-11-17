// Tipos compartilhados entre o caso (JSON), o estado e as regras.

export type IndicioId = string
export type SuspeitoId = string
export type LocalId = string

export interface Indicio {
  id: IndicioId
  nome: string
}

/** Visual de um boneco de blocos. Cores em hexadecimal (#rrggbb). Tudo opcional. */
export interface Aparencia {
  pele?: string
  cabelo?: string
  estiloCabelo?: 'curto' | 'longo' | 'coque' | 'careca' | 'bone'
  camisa?: string
  calca?: string
  acessorios?: ('cracha' | 'avental' | 'oculos' | 'gravata' | 'chef')[]
}

/** Personagem que conta a pista no local. */
export interface Testemunha {
  nome: string
  aparencia?: Aparencia
}

export interface Suspeito {
  id: SuspeitoId
  nome: string
  empresa: string
  /** Descrição curta exibida no caderno. Não deve citar os indícios. */
  perfil: string
  aparencia?: Aparencia
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
  /** Desenho do prédio no tabuleiro (ver src/ui/arte.ts). Sem ele, usa um prédio genérico. */
  icone?: string
  /** Quem conta a pista. Sem testemunha, o próprio auditor lê a informação. */
  testemunha?: Testemunha
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
  /** Abertura com a lore, exibida no briefing antes da denúncia. */
  abertura?: string
  briefing: string
  diasIniciais: number
  custoVisitaDias: number
  provasExigidas: number
  culpadoId: SuspeitoId
  indicios: Indicio[]
  suspeitos: Suspeito[]
  locais: Local[]
  impacto: Impacto
  /** Gancho para o próximo caso, exibido quando o caso é resolvido. */
  gancho?: string
  resultados: Record<TipoResultado, TextoResultado>
}

export interface Resultado {
  tipo: TipoResultado
  suspeitoAcusadoId: SuspeitoId | null
  provas: LocalId[]
  /** true se o jogador visitou um local que libera o relatório detalhado. */
  relatorioDetalhado: boolean
}
