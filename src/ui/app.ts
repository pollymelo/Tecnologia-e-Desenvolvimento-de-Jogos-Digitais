import { criarEstadoInicial, type EstadoJogo } from '../game/state.ts'
import {
  acusar,
  alternarDescarte,
  buscarLocal,
  buscarSuspeito,
  encerrarPrazo,
  pistasColetadas,
  podeAcusar,
  podeVisitar,
  visitarLocal,
  custoDoLocal,
  sortearCaso,
  preencherTexto,
  avaliarDesempenho,
  sortearPistas,
  explicarAcusacao,
  pontuarQuiz,
  escolherAcao,
  precisaEscolher,
  indicioObtido,
  textoObtido,
  localTrancado,
  fechadoHoje,
  diaAtual,
  sortearImprevistos,
  type Aleatorio,
  type LinhaExplicacao,
} from '../game/rules.ts'
import type { Caso, IndicioId, Local, LocalId, Marco, PerguntaQuiz, TipoResultado } from '../game/types.ts'
import { AUDITOR, boneco, bonecoQueVira, ceuNoturno, DONA_HELENA, fundoTabuleiro, predio } from './arte.ts'
import {
  duracaoDoCaminho,
  entrarNaCasa,
  guardarNoCaderno,
  passarDia,
  percorrer,
  posicionarPeao,
} from './animacao.ts'
import {
  caminho,
  LOTE_MARCO,
  posicaoDoMorador,
  LOTE_PARTIDA,
  LOTES_LOCAIS,
  MAPA,
  mover,
  pontoNaRua,
  portaProxima,
  VELOCIDADE,
  olharPara,
  comprimento,
  pontoNoCaminho,
  type Lote,
  type Olhar,
  type Ponto,
} from './mapa.ts'

/** Quanto mais rápido o peão anda correndo (Shift ou botão » do direcional). */
const FATOR_CORRIDA = 1.75
/** Rapidez com que o peão chega à velocidade e para (maior = mais seco). */
const ACELERACAO = 14
import { criarSom } from './som.ts'

type Direcao = 'cima' | 'baixo' | 'esquerda' | 'direita'

const TECLAS_DE_DIRECAO: Record<string, Direcao> = {
  arrowup: 'cima',
  w: 'cima',
  arrowdown: 'baixo',
  s: 'baixo',
  arrowleft: 'esquerda',
  a: 'esquerda',
  arrowright: 'direita',
  d: 'direita',
}

type Tela = 'arquivo' | 'briefing' | 'quiz-antes' | 'mapa' | 'caderno' | 'acusacao' | 'resultado' | 'quiz-depois'

/** Prédio do meio do mapa quando o caso não define outro. */
const MARCO_PADRAO: Marco = { nome: 'Hospital Municipal', icone: 'hospital', tag: 'Verba em falta' }

/** Progresso da campanha, salvo no navegador. */
interface Progresso {
  /** Melhor número de estrelas em cada caso. */
  estrelas: Record<string, number>
  /** Casos já resolvidos (cada um destrava o seguinte). */
  resolvidos: string[]
}

const CHAVE_PROGRESSO = 'rota-fantasma:progresso'

function lerProgresso(): Progresso {
  try {
    const salvo = JSON.parse(globalThis.localStorage?.getItem(CHAVE_PROGRESSO) ?? 'null')
    if (salvo && typeof salvo === 'object') {
      return { estrelas: salvo.estrelas ?? {}, resolvidos: Array.isArray(salvo.resolvidos) ? salvo.resolvidos : [] }
    }
  } catch {
    // armazenamento bloqueado ou corrompido: começa do zero
  }
  return { estrelas: {}, resolvidos: [] }
}

function salvarProgresso(progresso: Progresso): void {
  try {
    globalThis.localStorage?.setItem(CHAVE_PROGRESSO, JSON.stringify(progresso))
  } catch {
    // sem armazenamento: o progresso vale só nesta sessão
  }
}

/** Estado só da interface (o estado do jogo fica em EstadoJogo). */
interface Ui {
  tela: Tela
  estado: EstadoJogo
  ultimaPista: Local | null
  /** Pistas coletadas desde a última vez que o caderno foi aberto. */
  pistasNovas: number
  /** true logo após visitar um local: anima o dia gasto. */
  diaAcabouDeGastar: boolean
  /** Tela para onde o botão "Voltar" do caderno leva. */
  voltarDoCaderno: Tela
  acusado: string | null
  provas: string[]
  /** Onde estão os pés do peão, em unidades do mapa (começa na porta da Auditoria). */
  posicaoPeao: Ponto
  /** Para onde o peão está olhando (muda a vista do boneco). */
  olhar: Olhar
  /** true enquanto uma animação roda (bloqueia novos cliques). */
  andando: boolean
  /** Local cuja pista está aberta no card sobre o tabuleiro (o auditor está dentro da casa). */
  cardAberto: LocalId | null
  /** true só na primeira exibição do card, para tocar a animação de virar. */
  animarCard: boolean
  /** true logo depois de fechar o card: o peão sai da casa com animação. */
  peaoSaindo: boolean
  /** Verbete do glossário aberto ("todos" = lista completa; null = fechado). */
  termoAberto: string | null
  /** Elemento que abriu o glossário, para devolver o foco ao fechar. */
  focoAntesDoGlossario: string | null
  /** Respostas marcadas no teste rápido em andamento (índice da opção ou null). */
  respostas: (number | null)[]
  /** Passo do tutorial da Dona Helena (null = fechado). */
  tutorialPasso: number | null
  /** Morador cuja fala está aberta no mapa (null = nenhum). */
  falaAberta: number | null
  /** Moradores que já falaram com o jogador nesta partida (índices). */
  boatos: number[]
}

type Modo = 'historia' | 'desafio'

export interface OpcoesApp {
  /** false desliga as animações (usado nos testes). */
  animacoes?: boolean
  /** Sorteios (culpado no modo desafio e textos das pistas). Injetável para testes. */
  aleatorio?: Aleatorio
  /** false pula o teste rápido de antes e depois (usado nos testes). */
  quiz?: boolean
  /** false não mostra o tutorial da primeira partida (usado nos testes). */
  tutorial?: boolean
  /** false deixa o jogo mudo. */
  som?: boolean
  /** false desliga os imprevistos (locais fechados em dias sorteados). Usado nos testes. */
  imprevistos?: boolean
}

const reais = (valor: number) =>
  valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

/** Escapa texto vindo do JSON do caso (que pode ser editado por terceiros). */
function esc(texto: string): string {
  return texto
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export function iniciarApp(raiz: HTMLElement, casosDoJogo: Caso | Caso[], opcoes: OpcoesApp = {}): void {
  /** Casos da campanha, na ordem de desbloqueio. Com um caso só, o jogo abre direto no briefing. */
  const lista = Array.isArray(casosDoJogo) ? casosDoJogo : [casosDoJogo]
  const temArquivo = lista.length > 1
  let progresso = lerProgresso()
  /** Caso escolhido no arquivo (sem sorteio). */
  let casoBase: Caso = lista[0]
  /** Caso em jogo: o da história ou uma versão sorteada (modo desafio). */
  let caso: Caso = casoBase
  let modo: Modo = 'historia'
  const aleatorio: Aleatorio = opcoes.aleatorio ?? Math.random
  const som = criarSom(opcoes.som !== false)
  /**
   * Teste rápido: feito na primeira partida da sessão (antes) e depois do primeiro resultado.
   * null = ainda não respondido; [] = a pessoa pulou o teste.
   */
  const quizAntes = new Map<string, (number | null)[]>()
  const quizDepois = new Map<string, (number | null)[]>()
  /** O tutorial aparece sozinho só na primeira vez que o tabuleiro abre na sessão. */
  let tutorialVisto = opcoes.tutorial === false
  let ui: Ui = estadoUiInicial()

  function estadoUiInicial(): Ui {
    return {
      tela: temArquivo ? 'arquivo' : 'briefing',
      estado: criarEstadoInicial(caso),
      ultimaPista: null,
      pistasNovas: 0,
      diaAcabouDeGastar: false,
      voltarDoCaderno: 'mapa',
      acusado: null,
      provas: [],
      posicaoPeao: LOTE_PARTIDA.porta,
      olhar: 'baixo',
      andando: false,
      cardAberto: null,
      animarCard: false,
      peaoSaindo: false,
      termoAberto: null,
      focoAntesDoGlossario: null,
      respostas: [],
      tutorialPasso: null,
      falaAberta: null,
      boatos: [],
    }
  }

  const casoDestravado = (i: number) => i === 0 || progresso.resolvidos.includes(lista[i - 1].id)
  const marco = () => caso.marco ?? MARCO_PADRAO

  const perguntas = (): PerguntaQuiz[] => (opcoes.quiz === false ? [] : (casoBase.quiz ?? []))

  /**
   * Nível de animação: "completo", "suave" (quem pediu movimento reduzido no sistema:
   * o boneco ainda anda, mas sem pulos, giros nem zoom) ou "nenhum" (testes).
   */
  type Movimento = 'completo' | 'suave' | 'nenhum'
  const sistemaPedeMenosMovimento =
    typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  let movimento: Movimento = opcoes.animacoes === false ? 'nenhum' : sistemaPedeMenosMovimento ? 'suave' : 'completo'

  function animar(): boolean {
    return movimento !== 'nenhum'
  }

  const nomeIndicio = (id: IndicioId) => caso.indicios.find((i) => i.id === id)?.nome ?? id

  /** Texto clicável que abre o verbete do glossário (ou texto simples, se o termo não existir). */
  function termo(id: string | undefined, texto: string): string {
    if (!id || !caso.glossario?.some((t) => t.id === id)) return texto
    return `<button type="button" class="termo" data-acao="termo" data-id="${esc(id)}" aria-haspopup="dialog">${texto}</button>`
  }

  const temLocalGratis = () => caso.locais.some((l) => custoDoLocal(caso, l) === 0)

  function indiciosRevelados(): Set<IndicioId> {
    const revelados = new Set<IndicioId>()
    for (const local of pistasColetadas(caso, ui.estado)) {
      if (local.indicio) revelados.add(local.indicio)
    }
    return revelados
  }

  // ---------- Posições no tabuleiro ----------

  /** Posição em % do tabuleiro, para pôr elementos HTML sobre o desenho do mapa. */
  const estiloPonto = (p: Ponto) =>
    `left:${((p.x / MAPA.largura) * 100).toFixed(2)}%;top:${((p.y / MAPA.altura) * 100).toFixed(2)}%`

  /** Lote do mapa de cada local (na ordem do JSON). */
  const loteDe = (localId: LocalId): Lote => LOTES_LOCAIS[caso.locais.findIndex((l) => l.id === localId)]

  // ---------- Componentes ----------

  function hud(): string {
    const { diasRestantes } = ui.estado
    const pips = Array.from({ length: caso.diasIniciais }, (_, i) => {
      const disponivel = i < diasRestantes
      const recemGasto = ui.diaAcabouDeGastar && i === diasRestantes
      const classe = disponivel ? 'pip' : recemGasto ? 'pip gasto recem-gasto' : 'pip gasto'
      return `<span class="${classe}" aria-hidden="true"></span>`
    }).join('')
    const alerta = diasRestantes === 0 ? 'zerado' : diasRestantes === 1 ? 'alerta' : ''
    const badge =
      ui.pistasNovas > 0
        ? `<span class="badge" aria-label="${ui.pistasNovas} pista(s) nova(s)">${ui.pistasNovas} nova${ui.pistasNovas > 1 ? 's' : ''}</span>`
        : ''
    const riscados = ui.estado.descartados.length

    return `
      <header class="hud">
        <div class="dias ${alerta}" role="status">
          <span class="pips">${pips}</span>
          <span><strong>${diasRestantes}</strong> ${diasRestantes === 1 ? 'dia restante' : 'dias restantes'}</span>
        </div>
        <div class="hud-info">Dia <strong>${diaAtual(caso, ui.estado)}</strong> de ${caso.diasIniciais}</div>
        <div class="hud-info">Pistas: <strong>${ui.estado.locaisVisitados.length}</strong></div>
        <div class="hud-info">Riscados: <strong>${riscados}/${caso.suspeitos.length}</strong></div>
        ${modo === 'desafio' ? '<span class="tag tag-desafio">Modo desafio</span>' : ''}
        <div class="hud-botoes">
          ${botaoSom()}
          ${ui.tela === 'mapa' ? '<button type="button" class="secundario" data-acao="tutorial-abrir" aria-haspopup="dialog">Dicas</button>' : ''}
          <button type="button" class="secundario" data-acao="termo" data-id="todos" aria-haspopup="dialog">Glossário</button>
          <button type="button" class="secundario" data-acao="abrir-caderno">Caderno ${badge}</button>
        </div>
      </header>`
  }

  function botaoSom(): string {
    return `<button type="button" class="secundario" data-acao="alternar-som" aria-pressed="${som.ligado}">
      <span aria-hidden="true">${som.ligado ? '♪' : '✕'}</span> Som: ${som.ligado ? 'ligado' : 'desligado'}
    </button>`
  }

  function balao(texto: string, classe = ''): string {
    return `<div class="balao ${classe}">${texto}</div>`
  }

  function carimbo(texto: string, tipo: 'ok' | 'falha'): string {
    return `<span class="carimbo carimbo-${tipo}">${esc(texto)}</span>`
  }

  // ---------- Telas ----------

  function telaBriefing(): string {
    const suspeitos = caso.suspeitos
      .map(
        (s) => `
        <figure class="ficha-suspeito">
          ${boneco(s.aparencia, { classe: 'medio' })}
          <figcaption><strong>${esc(s.nome)}</strong><span>${esc(s.empresa)}</span></figcaption>
        </figure>`,
      )
      .join('')

    return `
      <section class="tela briefing">
        ${temArquivo ? '<p class="voltar-arquivo"><button type="button" class="secundario pequeno" data-acao="ir-arquivo">← Arquivo de casos</button></p>' : ''}
        <p class="rotulo">Auditoria Fiscal · Caso ${numeroDoCaso(casoBase)} · ${esc(caso.titulo)}</p>
        <h1 tabindex="-1">Rota Fantasma</h1>
        ${caso.abertura ? `<p class="abertura">${esc(caso.abertura)}</p>` : ''}
        <div class="cena cena-briefing">
          ${predio(marco().icone, 'cena-predio')}
          <div class="cena-personagem">
            ${boneco(AUDITOR, { expressao: 'feliz', classe: 'grande', rotulo: 'Você, auditor(a) fiscal' })}
            <span class="nome-personagem">Você, auditor(a) fiscal</span>
          </div>
          ${balao(`<strong>Denúncia anônima!</strong> ${esc(caso.briefing)}`)}
        </div>
        <h2>Os suspeitos</h2>
        <div class="fila-suspeitos">${suspeitos}</div>
        <div class="cartao">
          <h2>Como jogar</h2>
          <ol>
            <li>Ande pelo mapa e entre num local. Cada visita custa <strong>1 dia</strong>.${temLocalGratis() ? ' Locais marcados como <strong>grátis</strong> não gastam dia.' : ''}</li>
            <li>Lá dentro, <strong>escolha o que fazer</strong>: só a abordagem certa (o documento certo, a conversa certa) rende prova.</li>
            <li>Na rua, <strong>moradores</strong> contam dicas de graça, mas <strong>boato não é prova</strong>. Fique de olho nos <strong>imprevistos</strong>: um local pode estar fechado no dia.</li>
            <li>No <strong>caderno</strong>, veja quais comerciantes têm cada ${termo('indicio', 'indício')} e <strong>risque</strong> quem você descartou.</li>
            <li>Emita o ${termo('auto', '<strong>auto de infração</strong>')}: escolha o suspeito e <strong>${caso.provasExigidas} ${termo('prova', 'provas')}</strong> que o diferenciem dos outros.</li>
            <li>Ganhe até <strong>3 estrelas</strong>: resolva o caso, termine com tempo sobrando e deixe o caderno certo.</li>
          </ol>
        </div>
        <div class="acoes acoes-centro">
          <button type="button" data-acao="comecar" data-id="historia">Começar investigação</button>
          <button type="button" class="secundario" data-acao="comecar" data-id="desafio">Modo desafio: culpado sorteado</button>
        </div>
        <p class="nota">Palavras sublinhadas abrem o glossário. No modo desafio, o culpado muda a cada partida.</p>
        <p class="nota">${botaoSom()}</p>
        ${
          movimento === 'nenhum'
            ? ''
            : `<p class="nota">
                <button type="button" class="secundario pequeno" data-acao="alternar-movimento" aria-pressed="${movimento === 'completo'}">
                  Animações: ${movimento === 'completo' ? 'completas' : 'suaves'}
                </button>
                ${movimento === 'suave' ? 'Seu sistema pede menos movimento, então o jogo usa animações suaves.' : ''}
              </p>`
        }
      </section>`
  }

  function telaMapa(): string {
    const semDias = ui.estado.diasRestantes === 0
    const casas = caso.locais
      .map((local) => {
        if (localTrancado(caso, ui.estado, local.id)) {
          return `
          <div class="casa trancada" style="${estiloPonto(loteDe(local.id).porta)}" data-id="${esc(local.id)}">
            <span class="casa-nome">Endereço desconhecido</span>
            ${predio('generico')}
            <span class="tag tag-trancado">?</span>
          </div>`
        }
        const visitado = ui.estado.locaisVisitados.includes(local.id)
        const disponivel = podeVisitar(caso, ui.estado, local.id)
        const custo = custoDoLocal(caso, local)
        const fechado = fechadoHoje(caso, ui.estado, local.id)
        const novo = local.liberadoPor !== undefined && !visitado
        const tag = visitado
          ? '<span class="tag tag-visitado">✔ Visitado</span>'
          : fechado
            ? '<span class="tag tag-fechado">Fechado hoje</span>'
            : custo === 0
              ? '<span class="tag tag-gratis">Grátis</span>'
              : `<span class="tag tag-custo">${novo ? 'Novo · ' : ''}${custo} ${custo === 1 ? 'dia' : 'dias'}</span>`
        const dentro = ui.cardAberto === local.id
        const perto = !dentro && !ui.andando && portaProxima(ui.posicaoPeao, caso.locais.length) === caso.locais.indexOf(local)
        return `
          <button type="button" class="casa ${visitado ? 'visitado' : ''} ${fechado ? 'fechado' : ''} ${dentro ? 'iluminada' : ''} ${perto ? 'perto' : ''}" style="${estiloPonto(loteDe(local.id).porta)}"
            data-acao="visitar" data-id="${esc(local.id)}" ${disponivel ? '' : 'disabled'}>
            <span class="casa-nome">${esc(local.nome)}</span>
            ${predio(local.icone, dentro ? 'porta-aberta' : '')}
            ${tag}
          </button>`
      })
      .join('')

    const aviso = semDias
      ? `<div class="aviso" role="alert">
           <strong>Os dias acabaram.</strong>
           ${podeAcusar(caso, ui.estado) ? 'Emita o auto de infração agora ou encerre o caso sem acusar.' : 'Não há pistas suficientes para emitir o auto.'}
         </div>`
      : ''

    const seta = (dir: Direcao, simbolo: string, nome: string) =>
      `<button type="button" class="dpad-${dir}" data-dir="${dir}" tabindex="-1" aria-label="${nome}">${simbolo}</button>`

    return `
      ${hud()}
      <section class="tela">
        <h1 tabindex="-1">Para onde investigar?</h1>
        <p class="dica">Escolha bem: são ${caso.locais.length} locais e só ${caso.diasIniciais} dias.${temLocalGratis() ? ' Locais grátis não gastam dia.' : ''}</p>
        ${avisoImprevistos()}
        ${aviso}
        <div class="tabuleiro-rolagem">
          <div class="tabuleiro ${ui.andando ? 'andando' : ''}" aria-describedby="como-andar">
            ${fundoTabuleiro(caso.locais.length)}
            <div class="casa casa-marco" style="${estiloPonto(LOTE_MARCO.porta)}">
              <span class="casa-nome">${esc(marco().nome)}</span>
              ${predio(marco().icone)}
              <span class="tag tag-falta">${esc(marco().tag)}</span>
            </div>
            <div class="casa partida" style="${estiloPonto(LOTE_PARTIDA.porta)}">
              <span class="casa-nome">Auditoria</span>
              ${predio('auditoria')}
              <span class="tag tag-partida">Partida</span>
            </div>
            ${casas}
            <div class="peao ${ui.cardAberto ? 'dentro' : ''} ${ui.peaoSaindo ? 'saindo' : ''}" data-olhar="${ui.olhar}" style="${estiloPonto(ui.posicaoPeao)}">
              <div class="peao-corpo">${bonecoQueVira(AUDITOR, { expressao: 'feliz', rotulo: 'Seu peão' })}</div>
            </div>
            ${moradores()}
            ${avisoPorta()}
            ${falaMorador()}
            <div class="ceu ceu-noite" aria-hidden="true">${ceuNoturno()}</div>
            <div class="ceu ceu-amanhecer" aria-hidden="true"></div>
          </div>
        </div>
        <div class="controles">
          <p class="como-andar" id="como-andar">
            <span class="so-teclado">Ande com as <kbd>setas</kbd> ou <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> (segure <kbd>Shift</kbd> para correr).
            Em frente a um local, aperte <kbd>Espaço</kbd> para entrar.</span>
            <span class="so-toque">Segure as setas da tela para andar (» corre). Em frente a um local, toque em <strong>Entrar</strong>.</span>
            Também dá para tocar ou clicar na rua ou num local.
          </p>
          <div class="dpad" aria-hidden="true">
            ${seta('cima', '▲', 'Andar para cima')}${seta('esquerda', '◀', 'Andar para a esquerda')}
            <button type="button" class="dpad-correr ${correrToque ? 'ativo' : ''}" data-correr tabindex="-1" aria-label="Correr" aria-pressed="${correrToque}">»</button>
            ${seta('direita', '▶', 'Andar para a direita')}${seta('baixo', '▼', 'Andar para baixo')}
          </div>
        </div>
        <div class="acoes">
          <button type="button" data-acao="ir-acusacao" ${podeAcusar(caso, ui.estado) ? '' : 'disabled'}>Emitir auto de infração</button>
          ${semDias ? '<button type="button" class="perigo" data-acao="encerrar-prazo">Encerrar sem acusar</button>' : ''}
        </div>
        ${podeAcusar(caso, ui.estado) ? '' : `<p class="dica">Colete pelo menos ${caso.provasExigidas} pistas para poder acusar.</p>`}
      </section>`
  }

  /** Aviso que aparece quando o peão está na porta de um local. */
  function avisoPorta(): string {
    const i = ui.cardAberto !== null || ui.andando ? null : portaProxima(ui.posicaoPeao, caso.locais.length)
    if (i === null) return '<div class="aviso-porta" hidden></div>'
    const local = caso.locais[i]
    const custo = custoDoLocal(caso, local)
    const preco = custo === 0 ? 'grátis' : `${custo} ${custo === 1 ? 'dia' : 'dias'}`
    const fechado = fechadoHoje(caso, ui.estado, local.id)
    const motivo = localTrancado(caso, ui.estado, local.id)
      ? 'Este endereço ainda não foi descoberto.'
      : ui.estado.locaisVisitados.includes(local.id)
        ? 'Você já visitou este local.'
        : fechado
          ? `Fechado: ${esc(local.nome)} ${esc(fechado.motivo)}. Volte outro dia.`
          : 'Não há dias para esta visita.'
    const conteudo = podeVisitar(caso, ui.estado, local.id)
      ? `<button type="button" data-acao="entrar" data-id="${esc(local.id)}">Entrar <kbd class="so-teclado">Espaço</kbd></button>
         <span class="nota">${esc(local.nome)} · ${preco}</span>`
      : `<span class="nota">${motivo}</span>`
    return `<div class="aviso-porta" role="status">${conteudo}</div>`
  }

  /** Card da pista, aberto sobre o tabuleiro quando o auditor entra na casa. */
  function cardPista(): string {
    if (ui.cardAberto === null) return ''
    const original = buscarLocal(caso, ui.cardAberto)
    const escolhendo = precisaEscolher(caso, ui.estado, original.id)
    const acaoEscolhida = original.acoes?.find((a) => a.id === ui.estado.escolhas[original.id])
    // o card mostra o que a abordagem escolhida rendeu (ou a pista, em locais sem escolhas)
    const local = { ...original, indicio: indicioObtido(caso, ui.estado, original.id), pista: textoObtido(caso, ui.estado, original.id) }
    const testemunha = local.testemunha
    const quemFala = testemunha
      ? boneco(testemunha.aparencia, { classe: 'grande', rotulo: testemunha.nome })
      : boneco(AUDITOR, { classe: 'grande', rotulo: 'Você' })
    const nomeQuemFala = testemunha ? esc(testemunha.nome) : 'Você descobre'

    const semProva = original.indicio !== null && local.indicio === null
    const destaque = escolhendo
      ? ''
      : semProva
        ? `<div class="sem-indicio" role="status">
             <span class="rotulo">Sem prova</span>
             <span class="nota">Esta abordagem não revelou o indício. Na fiscalização, prova vem de documento ou de testemunho direto.</span>
           </div>`
        : local.indicio
      ? `<div class="nova-pista" role="status">
           <span class="rotulo">Nova pista</span>
           <strong>${termo(caso.indicios.find((i) => i.id === local.indicio)?.termo, esc(nomeIndicio(local.indicio)))}</strong>
           ${local.forca === 'fraca' ? '<span class="nota">É um testemunho: indica o mesmo que um documento, mas vem de uma conversa.</span>' : ''}
           <span class="nota">No caderno, veja quais comerciantes apresentam esse indício.</span>
         </div>`
      : `<div class="sem-indicio" role="status">
           <span class="rotulo">Sem indício novo</span>
           <span class="nota">Esta informação não serve como prova, mas ajuda a entender o caso.</span>
         </div>`

    return `
      <div class="camada-card">
        <article class="card-pista ${ui.animarCard ? 'virando' : ''}" role="dialog" aria-modal="true"
          aria-labelledby="titulo-card" tabindex="-1" ${ui.termoAberto ? 'inert' : ''}>
          <header class="card-topo">
            <span class="card-selo" aria-hidden="true">PISTA</span>
            <span class="rotulo">Você visitou</span>
            <h2 id="titulo-card">${esc(local.nome)}</h2>
          </header>
          <div class="cena">
            ${predio(local.icone, 'cena-predio')}
            ${testemunha ? `<div class="cena-ouvinte">${boneco(AUDITOR, { classe: 'pequeno' })}</div>` : ''}
            <div class="cena-personagem">
              ${quemFala}
              <span class="nome-personagem">${nomeQuemFala}</span>
            </div>
            ${
              escolhendo
                ? balao(`<p class="pista">${testemunha ? `${esc(testemunha.nome)} está aqui.` : 'Você está no local.'} O que você faz?</p>`)
                : balao(`<blockquote class="pista">${esc(local.pista)}</blockquote>`)
            }
          </div>
          ${
            escolhendo
              ? `<fieldset class="escolhas">
                   <legend>Escolha uma abordagem (só uma)</legend>
                   ${(original.acoes ?? [])
                     .map((a) => `<button type="button" class="escolha" data-acao="escolher" data-id="${esc(a.id)}">${esc(a.rotulo)}</button>`)
                     .join('')}
                 </fieldset>`
              : `${acaoEscolhida ? `<p class="abordagem">Você escolheu: <strong>${esc(acaoEscolhida.rotulo)}</strong></p>` : ''}
                 ${destaque}
                 <div class="acoes">
                   <button type="button" data-acao="guardar-pista">Guardar no caderno</button>
                   <button type="button" class="secundario" data-acao="guardar-abrir-caderno">Guardar e abrir o caderno</button>
                 </div>`
          }
        </article>
      </div>`
  }

  function telaCaderno(): string {
    const revelados = indiciosRevelados()
    const cabecalho = caso.indicios
      .map((i) =>
        revelados.has(i.id)
          ? `<th scope="col">${esc(i.nome)}</th>`
          : `<th scope="col" class="oculto" title="Colete a pista deste indício para revelar">? ? ?</th>`,
      )
      .join('')

    const linhas = caso.suspeitos
      .map((s) => {
        const riscado = ui.estado.descartados.includes(s.id)
        const celulas = caso.indicios
          .map((i) => {
            if (!revelados.has(i.id)) return '<td class="oculto">?</td>'
            return s.indicios.includes(i.id)
              ? '<td class="tem"><span aria-hidden="true">✔</span> tem</td>'
              : '<td class="nao-tem"><span aria-hidden="true">—</span> não tem</td>'
          })
          .join('')
        return `
          <tr class="${riscado ? 'riscado' : ''}">
            <th scope="row">
              <div class="suspeito">
                <span class="avatar">${boneco(s.aparencia, { expressao: riscado ? 'feliz' : 'neutro' })}</span>
                <span>
                  <span class="suspeito-nome">${esc(s.nome)}</span>
                  <span class="suspeito-empresa">${esc(s.empresa)}</span>
                  <span class="suspeito-perfil">${esc(s.perfil)}</span>
                </span>
              </div>
            </th>
            ${celulas}
            <td>
              <button type="button" class="${riscado ? 'secundario' : 'perigo'} pequeno" data-acao="riscar" data-id="${esc(s.id)}" aria-pressed="${riscado}">
                ${riscado ? 'Desfazer' : 'Riscar'}
              </button>
            </td>
          </tr>`
      })
      .join('')

    const pistas = pistasColetadas(caso, ui.estado)
    const listaPistas = pistas.length
      ? pistas
          .map(
            (l) =>
              `<li><strong>${esc(l.nome)}:</strong> ${
                l.indicio
                  ? esc(nomeIndicio(l.indicio))
                  : buscarLocal(caso, l.id).indicio
                    ? '<em>sem prova (a abordagem escolhida não revelou o indício)</em>'
                    : '<em>sem indício (contexto)</em>'
              }</li>`,
          )
          .join('')
      : '<li><em>Nenhuma pista ainda. Visite um local no tabuleiro.</em></li>'

    return `
      ${hud()}
      <section class="tela">
        <h1 tabindex="-1">Caderno de suspeitos</h1>
        <p class="dica">A pessoa denunciada tem <strong>todos</strong> os ${termo('indicio', 'indícios')} encontrados. Risque quem não tem algum deles. Quem decide é você: o caderno não risca ninguém sozinho.</p>
        <div class="tabela-rolagem">
          <table class="caderno">
            <thead><tr><th scope="col">Suspeito</th>${cabecalho}<th scope="col"><span class="sr">Ação</span></th></tr></thead>
            <tbody>${linhas}</tbody>
          </table>
        </div>
        <h2>Pistas coletadas</h2>
        <ul class="pistas-coletadas">${listaPistas}</ul>
        ${
          ui.boatos.length
            ? `<h2>Conversas na rua</h2>
               <p class="dica">Boato não vale como prova: pode ser verdade ou não. Use só para decidir onde investigar.</p>
               <ul class="boatos">${ui.boatos.map((i) => `<li><strong>${esc(caso.moradores![i].nome)}:</strong> "${esc(preencherTexto(caso, caso.moradores![i].fala, i))}"</li>`).join('')}</ul>`
            : ''
        }
        <div class="acoes">
          <button type="button" class="secundario" data-acao="voltar-caderno">Voltar</button>
          <button type="button" data-acao="ir-acusacao" ${podeAcusar(caso, ui.estado) ? '' : 'disabled'}>Emitir auto de infração</button>
        </div>
      </section>`
  }

  function telaAcusacao(): string {
    const suspeitos = caso.suspeitos
      .map((s) => {
        const riscado = ui.estado.descartados.includes(s.id)
        return `
          <label class="opcao opcao-suspeito ${riscado ? 'riscado' : ''} ${ui.acusado === s.id ? 'escolhido' : ''}">
            <input type="radio" name="acusado" value="${esc(s.id)}" ${ui.acusado === s.id ? 'checked' : ''}>
            <span class="avatar">${boneco(s.aparencia)}</span>
            <span><strong>${esc(s.nome)}</strong><br>${esc(s.empresa)}${riscado ? '<br><em>(riscado no caderno)</em>' : ''}</span>
          </label>`
      })
      .join('')

    const provas = pistasColetadas(caso, ui.estado)
      .map((l) => {
        const marcada = ui.provas.includes(l.id)
        const bloqueada = !marcada && ui.provas.length >= caso.provasExigidas
        return `
          <label class="opcao ${bloqueada ? 'bloqueada' : ''}">
            <input type="checkbox" name="prova" value="${esc(l.id)}" ${marcada ? 'checked' : ''} ${bloqueada ? 'disabled' : ''}>
            <span><strong>${esc(l.nome)}</strong> · ${l.indicio ? esc(nomeIndicio(l.indicio)) : '<em>sem indício</em>'}</span>
          </label>`
      })
      .join('')

    const pronto = ui.acusado !== null && ui.provas.length === caso.provasExigidas

    return `
      ${hud()}
      <section class="tela">
        <h1 tabindex="-1">Auto de infração</h1>
        <p class="dica">O ${termo('auto', 'auto de infração')} não gasta dia, mas encerra o caso. Escolha com cuidado.</p>
        <fieldset>
          <legend>1. Quem está sonegando?</legend>
          <div class="grade-suspeitos">${suspeitos}</div>
        </fieldset>
        <fieldset>
          <legend>2. Escolha ${caso.provasExigidas} provas (${ui.provas.length}/${caso.provasExigidas})</legend>
          <p class="dica">As provas precisam, juntas, descartar todos os outros suspeitos.</p>
          ${provas}
        </fieldset>
        <div class="acoes">
          <button type="button" class="secundario" data-acao="voltar-mapa">Voltar ao tabuleiro</button>
          <button type="button" data-acao="emitir-auto" ${pronto ? '' : 'disabled'}>Emitir auto</button>
        </div>
      </section>`
  }

  /** Teste rápido: as mesmas perguntas antes de jogar e depois do resultado. */
  function telaQuiz(fase: 'antes' | 'depois'): string {
    const qs = perguntas()
    const itens = qs
      .map(
        (q, i) => `
        <fieldset class="pergunta">
          <legend>${i + 1}. ${esc(q.pergunta)}</legend>
          ${q.opcoes
            .map(
              (o, j) => `
            <label class="opcao ${ui.respostas[i] === j ? 'escolhido' : ''}">
              <input type="radio" name="quiz-${i}" value="${j}" ${ui.respostas[i] === j ? 'checked' : ''}>
              <span>${esc(o)}</span>
            </label>`,
            )
            .join('')}
        </fieldset>`,
      )
      .join('')
    const respondidas = qs.filter((_, i) => ui.respostas[i] !== null && ui.respostas[i] !== undefined).length
    const pronto = respondidas === qs.length

    const cabecalho =
      fase === 'antes'
        ? `<p class="rotulo">Antes de começar</p>
           <h1 tabindex="-1">${qs.length} perguntas rápidas</h1>
           <p class="dica">Não vale nota e não precisa saber a resposta: marque o que você acha agora.
           No fim do jogo você responde de novo e compara.</p>`
        : `<p class="rotulo">Depois de jogar</p>
           <h1 tabindex="-1">As mesmas ${qs.length} perguntas</h1>
           <p class="dica">Responda de novo. Em seguida você vê as respostas certas e compara com o começo.</p>`

    const botoes =
      fase === 'antes'
        ? `<button type="button" class="secundario" data-acao="pular-quiz">Pular o teste</button>
           <button type="button" data-acao="concluir-quiz" ${pronto ? '' : 'disabled'}>Começar investigação</button>`
        : `<button type="button" class="secundario" data-acao="voltar-resultado">Voltar ao resultado</button>
           <button type="button" data-acao="concluir-quiz" ${pronto ? '' : 'disabled'}>Ver a comparação</button>`

    return `
      <section class="tela quiz">
        ${cabecalho}
        ${itens}
        <p class="nota" role="status">${respondidas} de ${qs.length} respondidas</p>
        <div class="acoes">${botoes}</div>
      </section>`
  }

  /** Cartão do resultado: convite para o teste final ou a comparação antes × depois. */
  function cartaoQuiz(): string {
    const qs = perguntas()
    const antesDoCaso = quizAntes.get(casoBase.id)
    const depoisDoCaso = quizDepois.get(casoBase.id)
    if (!qs.length || !antesDoCaso || antesDoCaso.length === 0) return ''
    if (!depoisDoCaso) {
      return `
        <div class="cartao cartao-quiz">
          <h2>Teste rápido: e agora?</h2>
          <p>No começo você respondeu ${qs.length} perguntas. Responda de novo e veja o quanto aprendeu.</p>
          <button type="button" data-acao="ir-quiz-depois">Responder de novo</button>
        </div>`
    }
    const antes = pontuarQuiz(qs, antesDoCaso)
    const depois = pontuarQuiz(qs, depoisDoCaso)
    const frase =
      depois > antes
        ? 'Você acertou mais depois de jogar!'
        : depois === qs.length
          ? 'Você acertou tudo nas duas vezes!'
          : depois === antes
            ? 'O mesmo número de acertos. Leia as explicações abaixo.'
            : 'Leia as explicações abaixo e tente de novo numa próxima partida.'
    const marca = (ok: boolean) => (ok ? '<span class="certo">✔ certo</span>' : '<span class="errado">✘ errado</span>')
    const correcao = qs
      .map(
        (q, i) => `
        <li>
          <strong>${esc(q.pergunta)}</strong>
          <span class="marcas">Antes: ${marca(antesDoCaso[i] === q.correta)} · Depois: ${marca(depoisDoCaso[i] === q.correta)}</span>
          <span>Resposta certa: <em>${esc(q.opcoes[q.correta])}</em></span>
          <span class="nota">${esc(q.explicacao)}</span>
        </li>`,
      )
      .join('')
    return `
      <div class="cartao cartao-quiz" id="comparacao-quiz" tabindex="-1">
        <h2>Teste rápido: antes e depois</h2>
        <div class="placar-quiz" role="img" aria-label="Antes do jogo: ${antes} de ${qs.length} acertos. Depois: ${depois} de ${qs.length}.">
          <div><span class="rotulo">Antes</span><strong>${antes}/${qs.length}</strong></div>
          <span class="seta" aria-hidden="true">→</span>
          <div class="${depois > antes ? 'subiu' : ''}"><span class="rotulo">Depois</span><strong>${depois}/${qs.length}</strong></div>
        </div>
        <p>${frase}</p>
        <ol class="correcao-quiz">${correcao}</ol>
      </div>`
  }

  /** Cartão do resultado que mostra o raciocínio: o que cada prova aponta e quem ela descarta. */
  function cartaoExplicacao(): string {
    const r = ui.estado.resultado
    if (!r || r.suspeitoAcusadoId === null) return ''
    const e = explicarAcusacao(caso, r.suspeitoAcusadoId, r.provas, ui.estado)
    const linha = (l: LinhaExplicacao) =>
      `<li class="${l.ok ? 'ok' : 'falhou'}"><span aria-hidden="true">${l.ok ? '✔' : '✘'}</span><span class="sr">${l.ok ? 'Certo:' : 'Problema:'}</span> ${esc(l.texto)}</li>`
    return `
      <div class="cartao explicacao">
        <h2>${r.tipo === 'resolvido' ? 'Por que deu certo' : 'Onde a acusação falhou'}</h2>
        <h3>O que cada prova aponta</h3>
        <ul class="lista-explicacao">${e.provas.map(linha).join('')}</ul>
        <h3>Os outros suspeitos</h3>
        <ul class="lista-explicacao">${e.outros.map(linha).join('')}</ul>
        ${e.culpadoEra ? `<p class="culpado-era">${esc(e.culpadoEra)}</p>` : ''}
      </div>`
  }

  // ---------- Tutorial (Dona Helena) ----------

  function passosTutorial(): { alvo: string; texto: string }[] {
    const dia = caso.custoVisitaDias === 1 ? '1 dia' : `${caso.custoVisitaDias} dias`
    return [
      {
        alvo: '.tabuleiro',
        texto:
          'Bem-vindo(a) à Auditoria! Eu sou a Dona Helena, sua chefe. Esta é Vila Aurora: ande pelas ruas com as setas (ou W A S D; Shift corre), pare em frente a um local e aperte Espaço para entrar. Lá dentro, escolha o que fazer: só a abordagem certa rende prova. No celular, use as setas da tela. Também dá para clicar num local.',
      },
      {
        alvo: '.hud .dias',
        texto: `Cada visita gasta ${dia}, e você só tem ${caso.diasIniciais}. Escolha bem!${temLocalGratis() ? ' Locais online, como o Portal da Transparência, não gastam dia.' : ''}`,
      },
      {
        alvo: '.hud [data-acao="abrir-caderno"]',
        texto: 'Cada pista vai para o caderno. Lá você vê quem tem cada indício e risca quem não tem.',
      },
      {
        alvo: '[data-acao="ir-acusacao"]',
        texto: `Quando tiver ${caso.provasExigidas} provas que só batem com uma pessoa, emita o auto de infração. Prova fraca anula o auto, e acusar a pessoa errada prejudica um inocente.`,
      },
    ]
  }

  function tutorial(): string {
    if (ui.tutorialPasso === null) return ''
    const passos = passosTutorial()
    const i = ui.tutorialPasso
    const ultimo = i === passos.length - 1
    return `
      <div class="tutorial" role="dialog" aria-modal="true" aria-labelledby="titulo-tutorial" aria-describedby="texto-tutorial" tabindex="-1">
        <div class="tutorial-personagem">${boneco(DONA_HELENA, { expressao: 'feliz', rotulo: 'Dona Helena' })}</div>
        <div class="tutorial-balao">
          <p class="rotulo" id="titulo-tutorial">Dona Helena · dica ${i + 1} de ${passos.length}</p>
          <p id="texto-tutorial">${esc(passos[i].texto)}</p>
          <div class="acoes">
            <button type="button" data-acao="tutorial-proximo">${ultimo ? 'Vamos lá!' : 'Próxima dica'}</button>
            ${ultimo ? '' : '<button type="button" class="secundario" data-acao="tutorial-fechar">Pular dicas</button>'}
          </div>
        </div>
      </div>`
  }

  function abrirTutorial(): void {
    tutorialVisto = true
    ui = { ...ui, tutorialPasso: 0 }
    render(false)
    raiz.querySelector<HTMLElement>('.tutorial')?.focus()
  }

  function fecharTutorial(): void {
    ui = { ...ui, tutorialPasso: null }
    render()
  }

  /** Vai para o tabuleiro e, na primeira vez da sessão, abre as dicas. */
  function entrarNoMapa(): void {
    ui = { ...ui, tela: 'mapa', respostas: [] }
    if (!tutorialVisto) abrirTutorial()
    else render()
  }

  // ---------- Campanha: arquivo de casos e progresso ----------

  /** Número do caso na campanha, com três dígitos (001, 002...). */
  const numeroDoCaso = (c: Caso) => String(Math.max(0, lista.indexOf(c)) + 1).padStart(3, '0')

  function telaArquivo(): string {
    const fichas = lista
      .map((c, i) => {
        const aberto = casoDestravado(i)
        const resolvido = progresso.resolvidos.includes(c.id)
        const estrelas = progresso.estrelas[c.id] ?? 0
        return `
          <li class="ficha-caso ${aberto ? '' : 'trancado'} ${resolvido ? 'resolvido' : ''}">
            <div class="ficha-predio">${predio((c.marco ?? MARCO_PADRAO).icone)}</div>
            <div class="ficha-texto">
              <span class="rotulo">Caso ${numeroDoCaso(c)}${resolvido ? ' · resolvido' : ''}</span>
              <h2>${aberto ? esc(c.titulo) : 'Caso trancado'}</h2>
              <p>${aberto ? esc(c.tema ?? '') : `Resolva o caso ${numeroDoCaso(lista[i - 1])} para abrir.`}</p>
              <span class="estrelas-ficha" role="img" aria-label="${estrelas} de 3 estrelas">
                ${[0, 1, 2].map((k) => `<span class="${k < estrelas ? 'ganha' : ''}" aria-hidden="true">★</span>`).join('')}
              </span>
            </div>
            <button type="button" data-acao="abrir-caso" data-id="${esc(c.id)}" ${aberto ? '' : 'disabled'}>
              ${!aberto ? 'Trancado' : resolvido ? 'Jogar de novo' : 'Investigar'}
            </button>
          </li>`
      })
      .join('')

    return `
      <section class="tela arquivo">
        <p class="rotulo">Auditoria Fiscal de Vila Aurora</p>
        <h1 tabindex="-1">Rota Fantasma</h1>
        <div class="cena cena-briefing">
          <div class="cena-personagem">
            ${boneco(DONA_HELENA, { expressao: 'feliz', classe: 'grande', rotulo: 'Dona Helena' })}
            <span class="nome-personagem">Dona Helena</span>
          </div>
          ${balao('<strong>Bem-vindo(a) à Auditoria!</strong> Os "fantasmas da Aurora" são o dinheiro de tributo que some antes de chegar à cidade. Cada caso resolvido abre o próximo arquivo.')}
        </div>
        <h2>Arquivo de casos</h2>
        <ol class="arquivo-casos">${fichas}</ol>
        <p class="nota">${progresso.resolvidos.length} de ${lista.length} casos resolvidos. O progresso fica salvo neste navegador.</p>
        <p class="nota">${botaoSom()}</p>
      </section>`
  }

  /** Guarda as estrelas e, se o caso foi resolvido, destrava o próximo. */
  function registrarProgresso(): void {
    const r = ui.estado.resultado
    if (!r) return
    const { estrelas } = avaliarDesempenho(caso, ui.estado)
    const resolvidos =
      r.tipo === 'resolvido' && !progresso.resolvidos.includes(casoBase.id)
        ? [...progresso.resolvidos, casoBase.id]
        : progresso.resolvidos
    progresso = {
      estrelas: { ...progresso.estrelas, [casoBase.id]: Math.max(progresso.estrelas[casoBase.id] ?? 0, estrelas) },
      resolvidos,
    }
    salvarProgresso(progresso)
  }

  /** Caso seguinte da campanha, se este foi resolvido agora. */
  function proximoCaso(): Caso | null {
    if (!temArquivo || ui.estado.resultado?.tipo !== 'resolvido') return null
    return lista[lista.indexOf(casoBase) + 1] ?? null
  }

  // ---------- Imprevistos ----------

  function avisoImprevistos(): string {
    const hoje = caso.locais
      .map((l) => ({ l, f: fechadoHoje(caso, ui.estado, l.id) }))
      .filter(({ l, f }) => f !== null && !ui.estado.locaisVisitados.includes(l.id))
    const novos = caso.locais.filter(
      (l) => l.liberadoPor !== undefined && !localTrancado(caso, ui.estado, l.id) && !ui.estado.locaisVisitados.includes(l.id),
    )
    if (!hoje.length && !novos.length) return ''
    return `
      <div class="imprevistos" role="status">
        <span class="rotulo">Dia ${diaAtual(caso, ui.estado)} de ${caso.diasIniciais}</span>
        ${hoje.map(({ l, f }) => `<p><strong>Imprevisto:</strong> ${esc(l.nome)} ${esc(f!.motivo)}. Amanhã reabre.</p>`).join('')}
        ${novos.map((l) => `<p><strong>Novo endereço no mapa:</strong> ${esc(l.nome)}.</p>`).join('')}
      </div>`
  }

  // ---------- Moradores ----------

  /** Tempo de caminhada de cada morador (segundos). Quem está conversando fica parado. */
  const temposMoradores: number[] = []
  /** Morador que o jogador chamou com um clique: ele espera parado o peão chegar. */
  let moradorChamado: number | null = null
  const posMorador = (i: number) => posicaoDoMorador(i, temposMoradores[i] ?? 0)

  /** Andando, o morador olha para onde vai; conversando, olha para o peão. */
  function olharDoMorador(i: number): Olhar {
    const aqui = posMorador(i)
    if (ui.falaAberta === i || moradorChamado === i) return olharPara(ui.posicaoPeao.x - aqui.x, ui.posicaoPeao.y - aqui.y)
    if (!animar()) return 'baixo'
    const adiante = posicaoDoMorador(i, (temposMoradores[i] ?? 0) + 0.3)
    return olharPara(adiante.x - aqui.x, adiante.y - aqui.y)
  }
  let loopMoradores = false
  /** Onde a fala aberta apareceu (ela fecha quando o peão se afasta dali). */
  let falaPonto: Ponto | null = null

  function moradores(): string {
    return (caso.moradores ?? [])
      .map(
        (m, i) => `
        <button type="button" class="morador ${ui.boatos.includes(i) ? 'ouvido' : ''}" data-acao="conversar" data-id="${i}"
          data-olhar="${olharDoMorador(i)}" style="${estiloPonto(posMorador(i))}" aria-label="Conversar com ${esc(m.nome)}">
          ${bonecoQueVira(m.aparencia, { expressao: 'feliz' })}
          <span class="balaozinho" aria-hidden="true">${ui.boatos.includes(i) ? '✓' : '!'}</span>
        </button>`,
      )
      .join('')
  }

  function falaMorador(): string {
    const i = ui.falaAberta
    const m = i === null ? undefined : caso.moradores?.[i]
    if (i === null || !m) return '<div class="fala-morador" hidden></div>'
    const p = falaPonto ?? posMorador(i)
    const lado = p.x < MAPA.largura * 0.25 ? 'esquerda' : p.x > MAPA.largura * 0.75 ? 'direita' : 'meio'
    return `
      <div class="fala-morador lado-${lado}" style="${estiloPonto(p)}" role="status">
        <strong>${esc(m.nome)}</strong>
        <span>"${esc(preencherTexto(caso, m.fala, i))}"</span>
        <span class="nota">Anotado no caderno. Boato não vale como prova.</span>
      </div>`
  }

  function cartaoBoatos(): string {
    if (!ui.boatos.length || !caso.moradores) return ''
    const itens = ui.boatos
      .map((i) => {
        const m = caso.moradores![i]
        return `<li class="${m.verdadeira ? 'ok' : 'falhou'}"><span aria-hidden="true">${m.verdadeira ? '✔' : '✘'}</span><span class="sr">${m.verdadeira ? 'Verdade:' : 'Boato falso:'}</span>
          <span><strong>${esc(m.nome)}:</strong> "${esc(preencherTexto(caso, m.fala, i))}" ${m.verdadeira ? 'Era verdade.' : 'Era só boato.'}</span></li>`
      })
      .join('')
    return `
      <div class="cartao">
        <h2>Conversas na rua: era verdade?</h2>
        <ul class="lista-explicacao">${itens}</ul>
        <p class="nota">Mesmo um boato verdadeiro não serve como prova: ele só aponta onde procurar.</p>
      </div>`
  }

  function atualizarMoradores(): void {
    raiz.querySelectorAll<HTMLElement>('.morador').forEach((el, i) => {
      posicionarPeao(el, posMorador(i))
      el.dataset.olhar = olharDoMorador(i)
      const ouvido = ui.boatos.includes(i)
      el.classList.toggle('ouvido', ouvido)
      const marca = el.querySelector('.balaozinho')
      if (marca) marca.textContent = ouvido ? '✓' : '!'
    })
  }

  function abrirFala(i: number): void {
    if (ui.falaAberta === i || !caso.moradores?.[i]) return
    ui.falaAberta = i
    falaPonto = posMorador(i)
    // os dois se olham
    virarPeao(falaPonto.x - ui.posicaoPeao.x, falaPonto.y - ui.posicaoPeao.y)
    if (!ui.boatos.includes(i)) ui.boatos = [...ui.boatos, i]
    som.tocar('conversa')
    raiz.querySelector('.fala-morador')?.replaceWith(htmlParaElemento(falaMorador()))
    atualizarMoradores()
  }

  function fecharFala(): void {
    if (ui.falaAberta === null) return
    ui.falaAberta = null
    falaPonto = null
    raiz.querySelector('.fala-morador')?.replaceWith(htmlParaElemento(falaMorador()))
    atualizarMoradores()
  }

  /** O peão encostou num morador? Ele conta a dica. Afastou-se? A fala fecha. */
  function verificarEncontros(): void {
    if (!caso.moradores?.length || ui.tela !== 'mapa') return
    const p = ui.posicaoPeao
    const distancia = (q: Ponto) => Math.hypot(p.x - q.x, p.y - q.y)
    if (ui.falaAberta !== null && falaPonto && distancia(falaPonto) > 40) fecharFala()
    if (ui.cardAberto !== null || ui.tutorialPasso !== null || ui.termoAberto !== null) return
    caso.moradores.forEach((_, i) => {
      if (ui.falaAberta !== i && distancia(posMorador(i)) < 14) abrirFala(i)
    })
  }

  /** Clique num morador: o peão vai até ele e conversa. */
  async function conversarCom(i: number): Promise<void> {
    if (!caso.moradores?.[i] || !podeAndarLivre()) return
    moradorChamado = i
    // para um passo antes do morador, para os dois ficarem frente a frente
    const rota = caminho(ui.posicaoPeao, posMorador(i))
    const total = comprimento(rota)
    const pertinho = total > 14 ? pontoNoCaminho(rota, total - 12) : ui.posicaoPeao
    const chegou = !animar() || (await andarAte(pertinho))
    moradorChamado = null
    if (chegou) abrirFala(i)
  }

  /** requestAnimationFrame com setTimeout de reserva. */
  function agendarQuadro(fn: () => void): void {
    let feito = false
    const uma = () => {
      if (feito) return
      feito = true
      fn()
    }
    requestAnimationFrame(uma)
    setTimeout(uma, 40)
  }

  /** Os moradores andam em volta dos quarteirões enquanto o mapa está aberto. */
  function animarMoradores(): void {
    if (loopMoradores || !animar() || !caso.moradores?.length) return
    loopMoradores = true
    let ultimo = performance.now()
    const quadro = () => {
      if (!raiz.isConnected || ui.tela !== 'mapa') {
        loopMoradores = false
        return
      }
      const agora = performance.now()
      const dt = Math.min(0.1, Math.max(0, (agora - ultimo) / 1000))
      ultimo = agora
      if (ui.cardAberto === null && ui.termoAberto === null && ui.tutorialPasso === null) {
        ;(caso.moradores ?? []).forEach((_, i) => {
          if (ui.falaAberta !== i && moradorChamado !== i) temposMoradores[i] = (temposMoradores[i] ?? 0) + dt
        })
        atualizarMoradores()
        verificarEncontros()
      }
      agendarQuadro(quadro)
    }
    agendarQuadro(quadro)
  }

  function cenaResultado(tipo: TipoResultado, acusadoId: string | null): string {
    const acusado = acusadoId ? buscarSuspeito(caso, acusadoId) : null
    const bonecoAcusado = (expressao: 'feliz' | 'neutro' | 'triste') =>
      acusado ? boneco(acusado.aparencia, { expressao, classe: 'grande', rotulo: acusado.nome }) : ''

    const cenas: Record<TipoResultado, string> = {
      resolvido: `
        <div class="cena-personagem">${boneco(AUDITOR, { expressao: 'feliz', classe: 'grande' })}</div>
        <div class="cena-personagem com-carimbo">${bonecoAcusado('triste')}${carimbo('Autuado', 'ok')}</div>
        ${predio(marco().icone, 'cena-predio')}`,
      auto_anulado: `
        <div class="cena-personagem">${boneco(AUDITOR, { expressao: 'triste', classe: 'grande' })}</div>
        <div class="cena-personagem com-carimbo">${bonecoAcusado('feliz')}${carimbo('Anulado', 'falha')}</div>`,
      acusacao_injusta: `
        <div class="cena-personagem">${boneco(AUDITOR, { expressao: 'triste', classe: 'grande' })}</div>
        <div class="cena-personagem com-carimbo">${bonecoAcusado('triste')}${carimbo('Inocente', 'falha')}</div>`,
      prazo_encerrado: `
        <div class="cena-personagem com-carimbo">${boneco(AUDITOR, { expressao: 'triste', classe: 'grande' })}${carimbo('Prazo encerrado', 'falha')}</div>
        ${predio(marco().icone, 'cena-predio')}`,
    }
    return `<div class="cena cena-resultado">${cenas[tipo]}</div>`
  }

  function telaResultado(): string {
    const resultado = ui.estado.resultado!
    const texto = caso.resultados[resultado.tipo]
    const sucesso = resultado.tipo === 'resolvido'
    const { impacto } = caso

    let acusacao = ''
    if (resultado.suspeitoAcusadoId !== null) {
      const s = buscarSuspeito(caso, resultado.suspeitoAcusadoId)
      const provas = resultado.provas.map((id) => esc(buscarLocal(caso, id).nome)).join(' e ')
      acusacao = `<p class="resumo-acusacao">Você acusou <strong>${esc(s.nome)}</strong> (${esc(s.empresa)}) com as provas: ${provas}.</p>`
    }

    const valor = sucesso
      ? `<div class="valor sucesso">
           <span class="rotulo">Valor recuperado</span>
           <strong>${reais(impacto.valorRecuperado)}</strong>
           <p>${esc(impacto.resumo)}</p>
           ${
             resultado.relatorioDetalhado
               ? `<h3>Para onde vai o dinheiro</h3><ul>${impacto.detalhes.map((d) => `<li>${esc(d)}</li>`).join('')}</ul>`
               : '<p class="nota">Quem visita o Portal da Transparência vê aqui o detalhamento de para onde vai o dinheiro.</p>'
           }
         </div>`
      : `<div class="valor perda">
           <span class="rotulo">Continua faltando para o hospital</span>
           <strong>${reais(impacto.valorRecuperado)}</strong>
         </div>`

    const perguntas = texto.perguntasDebate.map((p) => `<li>${esc(p)}</li>`).join('')

    const desempenho = avaliarDesempenho(caso, ui.estado)
    const estrelas = `
      <div class="estrelas" role="img" aria-label="${desempenho.estrelas} de 3 estrelas">
        ${[0, 1, 2].map((i) => `<span class="estrela ${i < desempenho.estrelas ? 'ganha' : ''}" style="animation-delay:${0.5 + i * 0.25}s" aria-hidden="true">★</span>`).join('')}
      </div>
      <ul class="criterios">
        ${desempenho.criterios.map((c) => `<li class="${c.cumprido ? 'ok' : ''}"><span aria-hidden="true">${c.cumprido ? '★' : '☆'}</span> ${esc(c.texto)}</li>`).join('')}
      </ul>`

    return `
      <section class="tela resultado ${sucesso ? 'ok' : 'falha'}">
        <p class="rotulo">Resultado</p>
        <h1 tabindex="-1">${esc(texto.titulo)}</h1>
        ${cenaResultado(resultado.tipo, resultado.suspeitoAcusadoId)}
        ${estrelas}
        <p class="mensagem">${esc(texto.mensagem)}</p>
        ${acusacao}
        ${cartaoExplicacao()}
        ${valor}
        <div class="cartao">
          <h2>O que este resultado ensina</h2>
          <p>${esc(texto.ensina)}</p>
        </div>
        ${cartaoBoatos()}
        ${cartaoQuiz()}
        <div class="cartao">
          <h2>Para debater</h2>
          <ol>${perguntas}</ol>
        </div>
        ${
          sucesso && caso.gancho
            ? `<div class="gancho"><span class="rotulo">Continua…</span><p>${esc(preencherTexto(caso, caso.gancho))}</p></div>`
            : ''
        }
        <p class="nota">${esc(impacto.aviso)}</p>
        <div class="acoes acoes-centro">
          ${proximoCaso() ? `<button type="button" data-acao="abrir-caso" data-id="${esc(proximoCaso()!.id)}">Próximo caso: ${esc(proximoCaso()!.titulo)}</button>` : ''}
          <button type="button" class="${proximoCaso() ? 'secundario' : ''}" data-acao="jogar-novamente">Jogar este caso de novo</button>
          ${temArquivo ? '<button type="button" class="secundario" data-acao="ir-arquivo">Arquivo de casos</button>' : ''}
        </div>
      </section>`
  }

  // ---------- Render e eventos ----------

  const telas: Record<Tela, () => string> = {
    arquivo: telaArquivo,
    briefing: telaBriefing,
    'quiz-antes': () => telaQuiz('antes'),
    mapa: telaMapa,
    caderno: telaCaderno,
    acusacao: telaAcusacao,
    resultado: telaResultado,
    'quiz-depois': () => telaQuiz('depois'),
  }

  function glossario(): string {
    if (ui.termoAberto === null) return ''
    const verbetes = caso.glossario ?? []
    const lista = ui.termoAberto === 'todos' ? verbetes : verbetes.filter((t) => t.id === ui.termoAberto)
    const titulo = ui.termoAberto === 'todos' ? 'Glossário' : (lista[0]?.termo ?? 'Glossário')
    const corpo = lista
      .map((t) =>
        ui.termoAberto === 'todos'
          ? `<dt>${esc(t.termo)}</dt><dd>${esc(t.definicao)}</dd>`
          : `<p>${esc(t.definicao)}</p>`,
      )
      .join('')
    return `
      <div class="sobreposicao" data-acao="fechar-termo">
        <div class="janela" role="dialog" aria-modal="true" aria-labelledby="titulo-glossario" tabindex="-1">
          <h2 id="titulo-glossario">${esc(titulo)}</h2>
          ${ui.termoAberto === 'todos' ? `<dl class="verbetes">${corpo}</dl>` : corpo}
          <button type="button" data-acao="fechar-termo" class="fechar">Entendi</button>
        </div>
      </div>`
  }

  function abrirTermo(id: string, origem: HTMLElement): void {
    const seletor = origem.dataset.id ? `[data-acao="termo"][data-id="${CSS.escape(origem.dataset.id)}"]` : null
    ui = { ...ui, termoAberto: id, focoAntesDoGlossario: seletor }
    render(false)
    raiz.querySelector<HTMLElement>(".janela")?.focus()
  }

  function fecharTermo(): void {
    const seletor = ui.focoAntesDoGlossario
    ui = { ...ui, termoAberto: null, focoAntesDoGlossario: null }
    render(false)
    if (seletor) raiz.querySelector<HTMLElement>(seletor)?.focus()
  }

  function render(focar = true): void {
    raiz.classList.toggle('movimento-suave', movimento === 'suave')
    const bloqueado = ui.termoAberto !== null || ui.cardAberto !== null || ui.tutorialPasso !== null
    raiz.innerHTML = `<main class="app tela-${ui.tela}" ${bloqueado ? 'inert' : ''}>${telas[ui.tela]()}</main>${cardPista()}${tutorial()}${glossario()}`
    ultimoAviso = ui.tela === 'mapa' ? avisoPorta() : ''
    posicionarAviso()
    if (ui.tela === 'mapa') animarMoradores()
    if (ui.tutorialPasso !== null) {
      const alvo = raiz.querySelector(passosTutorial()[ui.tutorialPasso].alvo)
      alvo?.classList.add('alvo-tutorial')
      // o balão fica embaixo da tela: o alvo vai para o meio, para não ficar escondido
      alvo?.scrollIntoView?.({ block: 'center' })
      // alvo no fim da página (não dá para centralizar): o balão sobe para o topo
      const balao = raiz.querySelector<HTMLElement>('.tutorial')
      if (alvo && balao) {
        const baixoDoAlvo = alvo.getBoundingClientRect().bottom
        balao.classList.toggle('no-topo', baixoDoAlvo > window.innerHeight - balao.offsetHeight - 24)
      }
    }
    ui.diaAcabouDeGastar = false
    ui.animarCard = false
    ui.peaoSaindo = false
    if (focar) raiz.querySelector<HTMLElement>('h1')?.focus()
  }

  function irPara(tela: Tela): void {
    ui = { ...ui, tela }
    render()
  }

  /** Registra a visita no estado do jogo e abre o card da pista. */
  function concluirVisita(localId: LocalId, animou: boolean): void {
    const { estado, pista } = visitarLocal(caso, ui.estado, localId)
    ui = {
      ...ui,
      tela: 'mapa',
      estado,
      ultimaPista: pista,
      pistasNovas: ui.pistasNovas + 1,
      // Com animação, a bolinha já se apagou durante a noite.
      diaAcabouDeGastar: !animou,
      posicaoPeao: loteDe(localId).porta,
      andando: false,
      cardAberto: localId,
      animarCard: animou,
    }
    render(false)
    if (!precisaEscolher(caso, ui.estado, localId)) som.tocar('pista')
    raiz.querySelector<HTMLElement>('.card-pista')?.focus()
  }

  /** O peão anda pelas ruas até a porta, entra na casa, o dia passa e o card da pista abre. */
  async function visitarComPasseio(localId: LocalId): Promise<void> {
    if (ui.andando || !podeVisitar(caso, ui.estado, localId)) return
    const peao = raiz.querySelector<HTMLElement>('.peao')
    const tabuleiro = raiz.querySelector<HTMLElement>('.tabuleiro')
    const casa = raiz.querySelector<HTMLElement>(`.casa[data-id="${CSS.escape(localId)}"]`)
    teclas.clear()
    if (!animar() || !peao || !tabuleiro || !casa) {
      concluirVisita(localId, false)
      return
    }

    ui.andando = true
    tabuleiro.classList.add('andando')
    atualizarPorta()
    const porta = loteDe(localId).porta
    const rota = caminho(ui.posicaoPeao, porta)
    som.passos(duracaoDoCaminho(rota))
    caminhadaCancelavel = true
    const chegou = await percorrer(peao, rota, aoAndarSozinho(peao), () => teclas.size > 0)
    caminhadaCancelavel = false
    if (!chegou) {
      // o jogador pegou o controle no meio do caminho: a visita é cancelada, sem gastar dia
      ui.andando = false
      tabuleiro.classList.remove('andando')
      atualizarPorta()
      comecarAAndar()
      return
    }
    virarPeao(0, -1) // de costas, entrando pela porta
    ui.posicaoPeao = porta
    posicionarPeao(peao, porta)
    som.tocar('porta')
    await entrarNaCasa(peao, casa, movimento === 'suave')
    if (custoDoLocal(caso, buscarLocal(caso, localId)) > 0) {
      const pips = raiz.querySelectorAll<HTMLElement>('.pip:not(.gasto)')
      som.tocar('dia')
      await passarDia(tabuleiro, pips[pips.length - 1] ?? null)
    }
    concluirVisita(localId, true)
  }

  // ---------- Controle do peão (teclado, direcional e clique na rua) ----------

  /** Direções seguradas agora (teclado e direcional na tela). */
  const teclas = new Set<Direcao>()
  let andandoLivre = false
  let ultimoQuadro = 0
  let andadoDesdeUltimoPasso = 0
  let ultimoAviso = ''
  /** Velocidade atual do peão (unidades por segundo): sobe e desce suave. */
  let velocidade = { x: 0, y: 0 }
  /** Shift segurado ou o botão » do direcional ligado. */
  let correndoTecla = false
  let correrToque = false
  /** true durante uma caminhada automática que o jogador pode interromper com as setas. */
  let caminhadaCancelavel = false

  /** Atualiza a posição e a direção do peão durante uma caminhada automática. */
  const aoAndarSozinho = (peao: HTMLElement) => (p: Ponto, anterior: Ponto) => {
    ui.posicaoPeao = p
    virarPeao(p.x - anterior.x, p.y - anterior.y)
    verificarEncontros()
    seguirPeao(peao)
  }

  /** O peão só anda livre no tabuleiro, sem nada aberto por cima e fora de outra animação. */
  const podeAndarLivre = () =>
    ui.tela === 'mapa' &&
    !ui.andando &&
    ui.cardAberto === null &&
    ui.termoAberto === null &&
    ui.tutorialPasso === null &&
    ui.estado.resultado === null

  function direcaoSegurada(): { dx: number; dy: number } {
    const dx = (teclas.has('direita') ? 1 : 0) - (teclas.has('esquerda') ? 1 : 0)
    const dy = (teclas.has('baixo') ? 1 : 0) - (teclas.has('cima') ? 1 : 0)
    const n = Math.hypot(dx, dy) || 1
    return { dx: dx / n, dy: dy / n }
  }

  function comecarAAndar(): void {
    if (andandoLivre) return
    andandoLivre = true
    ultimoQuadro = performance.now()
    proximoQuadro()
  }

  /** requestAnimationFrame, com setTimeout de reserva (mesma ideia de interpolar). */
  function proximoQuadro(): void {
    let feito = false
    const uma = () => {
      if (feito) return
      feito = true
      quadroDoPeao()
    }
    requestAnimationFrame(uma)
    setTimeout(uma, 40)
  }

  function quadroDoPeao(): void {
    const agora = performance.now()
    const dt = Math.min(0.05, Math.max(0, (agora - ultimoQuadro) / 1000))
    ultimoQuadro = agora
    const { dx, dy } = direcaoSegurada()
    const peao = raiz.querySelector<HTMLElement>('.peao')
    if (!raiz.isConnected || !peao || !podeAndarLivre()) {
      andandoLivre = false
      velocidade = { x: 0, y: 0 }
      peao?.classList.remove('caminhando', 'correndo')
      return
    }
    // aceleração: a velocidade se aproxima da desejada aos poucos (partida e parada suaves)
    const correr = correndoTecla || correrToque
    const desejada = { x: dx * VELOCIDADE * (correr ? FATOR_CORRIDA : 1), y: dy * VELOCIDADE * (correr ? FATOR_CORRIDA : 1) }
    const k = Math.min(1, dt * ACELERACAO)
    velocidade = { x: velocidade.x + (desejada.x - velocidade.x) * k, y: velocidade.y + (desejada.y - velocidade.y) * k }
    if (dx === 0 && dy === 0 && Math.hypot(velocidade.x, velocidade.y) < 6) {
      andandoLivre = false
      velocidade = { x: 0, y: 0 }
      peao.classList.remove('caminhando', 'correndo')
      return
    }
    if (dx !== 0 || dy !== 0) virarPeao(dx, dy)
    const antes = ui.posicaoPeao
    const depois = mover(antes, velocidade.x * dt, velocidade.y * dt)
    const andou = Math.hypot(depois.x - antes.x, depois.y - antes.y)
    if (andou === 0) velocidade = { x: 0, y: 0 } // bateu: sem "embalo" contra a parede
    ui.posicaoPeao = depois
    posicionarPeao(peao, depois)
    peao.classList.toggle('caminhando', andou > 0)
    peao.classList.toggle('correndo', andou > 0 && correr)
    andadoDesdeUltimoPasso += andou
    if (andadoDesdeUltimoPasso >= 14) {
      andadoDesdeUltimoPasso = 0
      som.tocar('passo')
    }
    atualizarPorta()
    verificarEncontros()
    seguirPeao(peao)
    proximoQuadro()
  }

  /** Mostra ou esconde o aviso "Entrar" e destaca a casa cuja porta está ao alcance. */
  function atualizarPorta(): void {
    const novo = avisoPorta()
    if (novo === ultimoAviso) {
      posicionarAviso()
      return
    }
    ultimoAviso = novo
    raiz.querySelector('.aviso-porta')?.replaceWith(htmlParaElemento(novo))
    const i = ui.andando || ui.cardAberto !== null ? null : portaProxima(ui.posicaoPeao, caso.locais.length)
    raiz.querySelectorAll('.casa.perto').forEach((c) => c.classList.remove('perto'))
    if (i !== null) raiz.querySelector(`.casa[data-id="${CSS.escape(caso.locais[i].id)}"]`)?.classList.add('perto')
    posicionarAviso()
  }

  /** O aviso "Entrar" flutua acima da cabeça do peão. */
  function posicionarAviso(): void {
    const aviso = raiz.querySelector<HTMLElement>('.aviso-porta:not([hidden])')
    if (aviso) posicionarPeao(aviso, { x: ui.posicaoPeao.x, y: ui.posicaoPeao.y - 38 })
  }

  /** Vira o peão para a direção do movimento. */
  function virarPeao(dx: number, dy: number): void {
    const novo = olharPara(dx, dy, ui.olhar)
    if (novo === ui.olhar) return
    ui.olhar = novo
    const peao = raiz.querySelector<HTMLElement>('.peao')
    if (peao) peao.dataset.olhar = novo
  }

  function htmlParaElemento(html: string): Element {
    const molde = document.createElement('template')
    molde.innerHTML = html.trim()
    return molde.content.firstElementChild!
  }

  /** Rola a página (e o tabuleiro, em telas estreitas) para o peão não sair de vista. */
  function seguirPeao(peao: HTMLElement): void {
    const r = peao.getBoundingClientRect()
    if (r.width === 0) return
    const margem = 70
    if (r.top < margem) window.scrollBy?.(0, r.top - margem)
    else if (r.bottom > window.innerHeight - margem) window.scrollBy?.(0, r.bottom - window.innerHeight + margem)
    const rolagem = raiz.querySelector<HTMLElement>('.tabuleiro-rolagem')
    if (rolagem && rolagem.scrollWidth > rolagem.clientWidth) {
      const c = rolagem.getBoundingClientRect()
      if (r.left < c.left + margem) rolagem.scrollLeft -= c.left + margem - r.left
      else if (r.right > c.right - margem) rolagem.scrollLeft += r.right - (c.right - margem)
    }
  }

  /** Clique na rua (ou na grama): o peão vai andando até o ponto de rua mais perto. */
  /** Devolve true se o peão chegou (false se o jogador assumiu o controle no caminho). */
  async function andarAte(destino: Ponto): Promise<boolean> {
    const peao = raiz.querySelector<HTMLElement>('.peao')
    if (!peao || !podeAndarLivre()) return false
    const alvo = pontoNaRua(destino)
    if (!animar()) {
      virarPeao(alvo.x - ui.posicaoPeao.x, alvo.y - ui.posicaoPeao.y)
      ui.posicaoPeao = alvo
      posicionarPeao(peao, alvo)
      atualizarPorta()
      return true
    }
    ui.andando = true
    atualizarPorta()
    const rota = caminho(ui.posicaoPeao, alvo)
    som.passos(duracaoDoCaminho(rota))
    caminhadaCancelavel = true
    const chegou = await percorrer(peao, rota, aoAndarSozinho(peao), () => teclas.size > 0)
    caminhadaCancelavel = false
    if (chegou) ui.posicaoPeao = alvo
    ui.andando = false
    atualizarPorta()
    if (!chegou) comecarAAndar()
    return chegou
  }

  function pontoDoClique(tabuleiro: HTMLElement, evento: MouseEvent): Ponto | null {
    const r = tabuleiro.getBoundingClientRect()
    if (r.width === 0 || r.height === 0) return null
    return {
      x: ((evento.clientX - r.left) / r.width) * MAPA.largura,
      y: ((evento.clientY - r.top) / r.height) * MAPA.altura,
    }
  }

  document.addEventListener('keydown', (evento) => {
    if (!raiz.isConnected || ui.tela !== 'mapa' || evento.ctrlKey || evento.metaKey || evento.altKey) return
    const alvo = evento.target as HTMLElement
    if (alvo.closest?.('input, textarea, select')) return
    const tecla = evento.key.toLowerCase()
    if (tecla === 'shift') correndoTecla = true
    const direcao = TECLAS_DE_DIRECAO[tecla]
    if (direcao) {
      // durante uma caminhada automática, a seta tira o controle dela
      if (!podeAndarLivre() && !caminhadaCancelavel) return
      evento.preventDefault() // as setas não rolam a página enquanto o peão anda
      correndoTecla = evento.shiftKey
      teclas.add(direcao)
      if (podeAndarLivre()) comecarAAndar()
      return
    }
    if (tecla === ' ' || tecla === 'enter' || tecla === 'e') {
      if (!podeAndarLivre()) return
      // Espaço/Enter num botão focado continuam apertando o botão (exceto o "Entrar" do aviso)
      if (tecla !== 'e' && alvo.closest?.('button') && !alvo.closest('.aviso-porta')) return
      const i = portaProxima(ui.posicaoPeao, caso.locais.length)
      if (i === null) return
      evento.preventDefault()
      void visitarComPasseio(caso.locais[i].id)
    }
  })

  document.addEventListener('keyup', (evento) => {
    const tecla = evento.key.toLowerCase()
    if (tecla === 'shift') correndoTecla = false
    const direcao = TECLAS_DE_DIRECAO[tecla]
    if (direcao) teclas.delete(direcao)
  })
  window.addEventListener('blur', () => {
    teclas.clear()
    correndoTecla = false
  })

  // Direcional na tela (celular e mouse): segurar o botão faz o peão andar.
  raiz.addEventListener('pointerdown', (evento) => {
    const correrBotao = (evento.target as HTMLElement).closest<HTMLElement>('[data-correr]')
    if (correrBotao) {
      evento.preventDefault()
      correrToque = !correrToque
      correrBotao.classList.toggle('ativo', correrToque)
      correrBotao.setAttribute('aria-pressed', String(correrToque))
      return
    }
    const botao = (evento.target as HTMLElement).closest<HTMLElement>('[data-dir]')
    if (!botao || (!podeAndarLivre() && !caminhadaCancelavel)) return
    evento.preventDefault()
    teclas.add(botao.dataset.dir as Direcao)
    if (podeAndarLivre()) comecarAAndar()
  })
  document.addEventListener('pointerup', () => teclas.clear())
  document.addEventListener('pointercancel', () => teclas.clear())
  raiz.addEventListener('contextmenu', (evento) => {
    if ((evento.target as HTMLElement).closest('.dpad')) evento.preventDefault()
  })

  /** Fecha o card: ele voa até o caderno e o peão sai da casa. */
  async function guardarPista(depois: 'mapa' | 'caderno'): Promise<void> {
    som.tocar('guardar')
    if (animar()) {
      ui.andando = true
      await guardarNoCaderno(
        raiz.querySelector<HTMLElement>('.card-pista'),
        raiz.querySelector<HTMLElement>('.hud [data-acao="abrir-caderno"]'),
        movimento === 'suave',
      )
    }
    ui = { ...ui, andando: false, cardAberto: null, peaoSaindo: animar() }
    if (depois === 'caderno') {
      ui = { ...ui, pistasNovas: 0, voltarDoCaderno: 'mapa' }
      irPara('caderno')
    } else {
      render(false)
      raiz.querySelector<HTMLElement>('h1')?.focus()
    }
  }

  /** Carimbo e, logo depois, fanfarra (caso resolvido) ou duas notas descendo. */
  function somDoResultado(): void {
    som.tocar('carimbo', 0.3)
    som.tocar(ui.estado.resultado?.tipo === 'resolvido' ? 'vitoria' : 'falha', 0.7)
  }

  raiz.addEventListener('click', (evento) => {
    const alvo = (evento.target as HTMLElement).closest<HTMLElement>('[data-acao]')

    // Clique na rua ou na grama do tabuleiro (fora das casas): o peão anda até lá.
    const tabuleiro = (evento.target as HTMLElement).closest<HTMLElement>('.tabuleiro')
    if (tabuleiro && !(evento.target as HTMLElement).closest('.casa, .aviso-porta, .morador, .fala-morador')) {
      const ponto = pontoDoClique(tabuleiro, evento)
      if (ponto) void andarAte(ponto)
      return
    }

    if (!alvo || (alvo as HTMLButtonElement).disabled || ui.andando) return
    const id = alvo.dataset.id ?? ''

    // Clique no fundo escuro fecha o glossário; clique dentro da janela, não.
    if (alvo.dataset.acao === 'fechar-termo' && alvo.classList.contains('sobreposicao') && alvo !== evento.target) return

    switch (alvo.dataset.acao) {
      case 'termo':
        abrirTermo(id, alvo)
        break
      case 'fechar-termo':
        fecharTermo()
        break
      case 'comecar':
        modo = id === 'desafio' ? 'desafio' : 'historia'
        caso = sortearPistas(modo === 'desafio' ? sortearCaso(casoBase, aleatorio) : casoBase, aleatorio)
        ui = {
          ...estadoUiInicial(),
          estado: criarEstadoInicial(caso, opcoes.imprevistos === false ? {} : sortearImprevistos(caso, aleatorio)),
        }
        if (!quizAntes.has(casoBase.id) && perguntas().length > 0) {
          ui = { ...ui, tela: 'quiz-antes', respostas: perguntas().map(() => null) }
          render()
        } else {
          entrarNoMapa()
        }
        break
      case 'concluir-quiz':
        if (ui.tela === 'quiz-antes') {
          quizAntes.set(casoBase.id, [...ui.respostas])
          entrarNoMapa()
        } else {
          quizDepois.set(casoBase.id, [...ui.respostas])
          ui = { ...ui, tela: 'resultado', respostas: [] }
          render(false)
          raiz.querySelector<HTMLElement>('#comparacao-quiz')?.focus()
        }
        break
      case 'pular-quiz':
        quizAntes.set(casoBase.id, [])
        entrarNoMapa()
        break
      case 'ir-quiz-depois':
        ui = { ...ui, tela: 'quiz-depois', respostas: perguntas().map(() => null) }
        render()
        break
      case 'voltar-resultado':
        ui = { ...ui, tela: 'resultado', respostas: [] }
        render()
        break
      case 'tutorial-abrir':
        abrirTutorial()
        break
      case 'tutorial-proximo':
        if (ui.tutorialPasso === null || ui.tutorialPasso >= passosTutorial().length - 1) {
          fecharTutorial()
        } else {
          ui = { ...ui, tutorialPasso: ui.tutorialPasso + 1 }
          render(false)
          raiz.querySelector<HTMLElement>('.tutorial')?.focus()
        }
        break
      case 'tutorial-fechar':
        fecharTutorial()
        break
      case 'alternar-som':
        som.alternar()
        som.tocar('pista')
        render(false)
        raiz.querySelector<HTMLElement>('[data-acao="alternar-som"]')?.focus()
        break
      case 'visitar':
      case 'entrar':
        void visitarComPasseio(id)
        break
      case 'alternar-movimento':
        movimento = movimento === 'completo' ? 'suave' : 'completo'
        render(false)
        raiz.querySelector<HTMLElement>('[data-acao="alternar-movimento"]')?.focus()
        break
      case 'guardar-pista':
        void guardarPista('mapa')
        break
      case 'guardar-abrir-caderno':
        void guardarPista('caderno')
        break
      case 'abrir-caderno':
        ui = { ...ui, pistasNovas: 0, voltarDoCaderno: ui.tela === 'caderno' ? ui.voltarDoCaderno : ui.tela }
        irPara('caderno')
        break
      case 'voltar-caderno':
        irPara(ui.voltarDoCaderno)
        break
      case 'riscar':
        ui = { ...ui, estado: alternarDescarte(caso, ui.estado, id) }
        som.tocar('risco')
        render(false)
        raiz.querySelector<HTMLElement>(`[data-acao="riscar"][data-id="${CSS.escape(id)}"]`)?.focus()
        break
      case 'voltar-mapa':
        irPara('mapa')
        break
      case 'ir-acusacao':
        irPara('acusacao')
        break
      case 'emitir-auto':
        ui = { ...ui, estado: acusar(caso, ui.estado, ui.acusado!, ui.provas) }
        registrarProgresso()
        irPara('resultado')
        somDoResultado()
        break
      case 'encerrar-prazo':
        ui = { ...ui, estado: encerrarPrazo(caso, ui.estado) }
        irPara('resultado')
        somDoResultado()
        break
      case 'jogar-novamente':
        caso = casoBase
        modo = 'historia'
        ui = { ...estadoUiInicial(), tela: 'briefing' }
        render()
        break
      case 'ir-arquivo':
        caso = casoBase
        modo = 'historia'
        ui = { ...estadoUiInicial(), tela: 'arquivo' }
        render()
        break
      case 'abrir-caso': {
        const escolhido = lista.find((c) => c.id === id)
        if (!escolhido || !casoDestravado(lista.indexOf(escolhido))) break
        casoBase = escolhido
        caso = escolhido
        modo = 'historia'
        ui = { ...estadoUiInicial(), tela: 'briefing' }
        render()
        break
      }
      case 'escolher': {
        const dentroDe = ui.cardAberto
        if (dentroDe === null) break
        ui = { ...ui, estado: escolherAcao(caso, ui.estado, dentroDe, id) }
        if (indicioObtido(caso, ui.estado, dentroDe)) som.tocar('pista')
        else som.tocar('risco')
        render(false)
        raiz.querySelector<HTMLElement>('.card-pista')?.focus()
        break
      }
      case 'conversar':
        void conversarCom(Number(id))
        break
    }
  })

  raiz.addEventListener('change', (evento) => {
    const input = evento.target as HTMLInputElement
    if (input.name === 'acusado') {
      ui = { ...ui, acusado: input.value }
    } else if (input.name === 'prova') {
      const provas = input.checked
        ? [...ui.provas, input.value]
        : ui.provas.filter((p) => p !== input.value)
      ui = { ...ui, provas }
    } else if (input.name.startsWith('quiz-')) {
      const respostas = [...ui.respostas]
      respostas[Number(input.name.slice(5))] = Number(input.value)
      ui = { ...ui, respostas }
    } else {
      return
    }
    render(false)
    raiz.querySelector<HTMLInputElement>(`input[name="${input.name}"][value="${CSS.escape(input.value)}"]`)?.focus()
  })

  raiz.addEventListener('keydown', (evento) => {
    if (evento.key !== 'Escape') return
    if (ui.termoAberto !== null) fecharTermo()
    else if (ui.tutorialPasso !== null) fecharTutorial()
  })

  render(false)
}
