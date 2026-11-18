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
  type Aleatorio,
  type LinhaExplicacao,
} from '../game/rules.ts'
import type { Caso, IndicioId, Local, LocalId, PerguntaQuiz, TipoResultado } from '../game/types.ts'
import {
  angulosDasCasas,
  AUDITOR,
  boneco,
  ceuNoturno,
  DONA_HELENA,
  fundoTabuleiro,
  pontoNaEstrada,
  predio,
  TABULEIRO,
} from './arte.ts'
import { caminharPelaEstrada, duracaoCaminhada, entrarNaCasa, guardarNoCaderno, passarDia } from './animacao.ts'
import { criarSom } from './som.ts'

type Tela = 'briefing' | 'quiz-antes' | 'mapa' | 'caderno' | 'acusacao' | 'resultado' | 'quiz-depois'

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
  /** Onde está o peão do auditor no tabuleiro (null = casa de partida). */
  posicaoPeao: LocalId | null
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

export function iniciarApp(raiz: HTMLElement, casoBase: Caso, opcoes: OpcoesApp = {}): void {
  /** Caso em jogo: o da história ou uma versão sorteada (modo desafio). */
  let caso: Caso = casoBase
  let modo: Modo = 'historia'
  const aleatorio: Aleatorio = opcoes.aleatorio ?? Math.random
  const som = criarSom(opcoes.som !== false)
  /**
   * Teste rápido: feito na primeira partida da sessão (antes) e depois do primeiro resultado.
   * null = ainda não respondido; [] = a pessoa pulou o teste.
   */
  let quizAntes: (number | null)[] | null = null
  let quizDepois: (number | null)[] | null = null
  /** O tutorial aparece sozinho só na primeira vez que o tabuleiro abre na sessão. */
  let tutorialVisto = opcoes.tutorial === false
  let ui: Ui = estadoUiInicial()

  function estadoUiInicial(): Ui {
    return {
      tela: 'briefing',
      estado: criarEstadoInicial(caso),
      ultimaPista: null,
      pistasNovas: 0,
      diaAcabouDeGastar: false,
      voltarDoCaderno: 'mapa',
      acusado: null,
      provas: [],
      posicaoPeao: null,
      andando: false,
      cardAberto: null,
      animarCard: false,
      peaoSaindo: false,
      termoAberto: null,
      focoAntesDoGlossario: null,
      respostas: [],
      tutorialPasso: null,
    }
  }

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

  const angulos = angulosDasCasas(caso.locais.length)

  /** Posição em % do tabuleiro (para posicionar elementos HTML sobre o desenho). */
  function posicaoPct(localId: LocalId | null): { left: string; top: string } {
    const indice = localId === null ? -1 : caso.locais.findIndex((l) => l.id === localId)
    const angulo = indice < 0 ? angulos.partida : angulos.locais[indice]
    const { x, y } = pontoNaEstrada(angulo)
    return {
      left: `${((x / TABULEIRO.largura) * 100).toFixed(2)}%`,
      top: `${((y / TABULEIRO.altura) * 100).toFixed(2)}%`,
    }
  }

  const estiloPos = (localId: LocalId | null) => {
    const { left, top } = posicaoPct(localId)
    return `left:${left};top:${top}`
  }

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
        <p class="rotulo">Auditoria Fiscal · ${esc(caso.titulo)}</p>
        <h1 tabindex="-1">Rota Fantasma</h1>
        ${caso.abertura ? `<p class="abertura">${esc(caso.abertura)}</p>` : ''}
        <div class="cena cena-briefing">
          ${predio('hospital', 'cena-predio')}
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
            <li>No tabuleiro, escolha um local: seu peão anda até lá. Cada visita custa <strong>1 dia</strong> e revela uma pista.${temLocalGratis() ? ' Locais marcados como <strong>grátis</strong> não gastam dia.' : ''}</li>
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
        const visitado = ui.estado.locaisVisitados.includes(local.id)
        const disponivel = podeVisitar(caso, ui.estado, local.id)
        const custo = custoDoLocal(caso, local)
        const tag = visitado
          ? '<span class="tag tag-visitado">✔ Visitado</span>'
          : custo === 0
            ? '<span class="tag tag-gratis">Grátis (online)</span>'
            : `<span class="tag tag-custo">${custo} ${custo === 1 ? 'dia' : 'dias'}</span>`
        const dentro = ui.cardAberto === local.id
        return `
          <button type="button" class="casa ${visitado ? 'visitado' : ''} ${dentro ? 'iluminada' : ''}" style="${estiloPos(local.id)}"
            data-acao="visitar" data-id="${esc(local.id)}" ${disponivel ? '' : 'disabled'}>
            ${predio(local.icone, dentro ? 'porta-aberta' : '')}
            <span class="casa-nome">${esc(local.nome)}</span>
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

    return `
      ${hud()}
      <section class="tela">
        <h1 tabindex="-1">Para onde investigar?</h1>
        <p class="dica">Escolha bem: são ${caso.locais.length} locais e só ${caso.diasIniciais} dias.${temLocalGratis() ? ' Locais grátis não gastam dia.' : ''}</p>
        ${aviso}
        <div class="tabuleiro-rolagem">
          <div class="tabuleiro ${ui.andando ? 'andando' : ''}">
            ${fundoTabuleiro(caso.locais.length)}
            <div class="casa-centro">
              ${predio('hospital')}
              <span class="casa-nome">Hospital Municipal</span>
              <span class="tag tag-falta">Verba em falta</span>
            </div>
            <div class="casa partida" style="${estiloPos(null)}">
              ${predio('auditoria')}
              <span class="casa-nome">Auditoria (partida)</span>
            </div>
            ${casas}
            <div class="peao ${ui.cardAberto ? 'dentro' : ''} ${ui.peaoSaindo ? 'saindo' : ''}" style="${estiloPos(ui.posicaoPeao)}">
              <div class="peao-corpo">${boneco(AUDITOR, { expressao: 'feliz', rotulo: 'Seu peão' })}</div>
            </div>
            <div class="ceu ceu-noite" aria-hidden="true">${ceuNoturno()}</div>
            <div class="ceu ceu-amanhecer" aria-hidden="true"></div>
          </div>
        </div>
        <div class="acoes">
          <button type="button" data-acao="ir-acusacao" ${podeAcusar(caso, ui.estado) ? '' : 'disabled'}>Emitir auto de infração</button>
          ${semDias ? '<button type="button" class="perigo" data-acao="encerrar-prazo">Encerrar sem acusar</button>' : ''}
        </div>
        ${podeAcusar(caso, ui.estado) ? '' : `<p class="dica">Colete pelo menos ${caso.provasExigidas} pistas para poder acusar.</p>`}
      </section>`
  }

  /** Card da pista, aberto sobre o tabuleiro quando o auditor entra na casa. */
  function cardPista(): string {
    if (ui.cardAberto === null) return ''
    const local = buscarLocal(caso, ui.cardAberto)
    const testemunha = local.testemunha
    const quemFala = testemunha
      ? boneco(testemunha.aparencia, { classe: 'grande', rotulo: testemunha.nome })
      : boneco(AUDITOR, { classe: 'grande', rotulo: 'Você' })
    const nomeQuemFala = testemunha ? esc(testemunha.nome) : 'Você descobre'

    const destaque = local.indicio
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
            ${balao(`<blockquote class="pista">${esc(local.pista)}</blockquote>`)}
          </div>
          ${destaque}
          <div class="acoes">
            <button type="button" data-acao="guardar-pista">Guardar no caderno</button>
            <button type="button" class="secundario" data-acao="guardar-abrir-caderno">Guardar e abrir o caderno</button>
          </div>
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
              `<li><strong>${esc(l.nome)}:</strong> ${l.indicio ? esc(nomeIndicio(l.indicio)) : '<em>sem indício (contexto)</em>'}</li>`,
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
    if (!qs.length || !quizAntes || quizAntes.length === 0) return ''
    if (!quizDepois) {
      return `
        <div class="cartao cartao-quiz">
          <h2>Teste rápido: e agora?</h2>
          <p>No começo você respondeu ${qs.length} perguntas. Responda de novo e veja o quanto aprendeu.</p>
          <button type="button" data-acao="ir-quiz-depois">Responder de novo</button>
        </div>`
    }
    const antes = pontuarQuiz(qs, quizAntes)
    const depois = pontuarQuiz(qs, quizDepois)
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
          <span class="marcas">Antes: ${marca(quizAntes![i] === q.correta)} · Depois: ${marca(quizDepois![i] === q.correta)}</span>
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
    const e = explicarAcusacao(caso, r.suspeitoAcusadoId, r.provas)
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
          'Bem-vindo(a) à Auditoria! Eu sou a Dona Helena, sua chefe. Este é o tabuleiro de Vila Aurora: clique num local e seu peão vai até lá ouvir uma testemunha.',
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

  function cenaResultado(tipo: TipoResultado, acusadoId: string | null): string {
    const acusado = acusadoId ? buscarSuspeito(caso, acusadoId) : null
    const bonecoAcusado = (expressao: 'feliz' | 'neutro' | 'triste') =>
      acusado ? boneco(acusado.aparencia, { expressao, classe: 'grande', rotulo: acusado.nome }) : ''

    const cenas: Record<TipoResultado, string> = {
      resolvido: `
        <div class="cena-personagem">${boneco(AUDITOR, { expressao: 'feliz', classe: 'grande' })}</div>
        <div class="cena-personagem com-carimbo">${bonecoAcusado('triste')}${carimbo('Autuado', 'ok')}</div>
        ${predio('hospital', 'cena-predio')}`,
      auto_anulado: `
        <div class="cena-personagem">${boneco(AUDITOR, { expressao: 'triste', classe: 'grande' })}</div>
        <div class="cena-personagem com-carimbo">${bonecoAcusado('feliz')}${carimbo('Anulado', 'falha')}</div>`,
      acusacao_injusta: `
        <div class="cena-personagem">${boneco(AUDITOR, { expressao: 'triste', classe: 'grande' })}</div>
        <div class="cena-personagem com-carimbo">${bonecoAcusado('triste')}${carimbo('Inocente', 'falha')}</div>`,
      prazo_encerrado: `
        <div class="cena-personagem com-carimbo">${boneco(AUDITOR, { expressao: 'triste', classe: 'grande' })}${carimbo('Prazo encerrado', 'falha')}</div>
        ${predio('hospital', 'cena-predio')}`,
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
        <button type="button" data-acao="jogar-novamente">Jogar novamente</button>
      </section>`
  }

  // ---------- Render e eventos ----------

  const telas: Record<Tela, () => string> = {
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
      posicaoPeao: localId,
      andando: false,
      cardAberto: localId,
      animarCard: animou,
    }
    render(false)
    som.tocar('pista')
    raiz.querySelector<HTMLElement>('.card-pista')?.focus()
  }

  function anguloDe(localId: LocalId | null): number {
    const indice = localId === null ? -1 : caso.locais.findIndex((l) => l.id === localId)
    return indice < 0 ? angulos.partida : angulos.locais[indice]
  }

  /** O peão caminha pela estrada, entra na casa, o dia passa e o card da pista abre. */
  async function visitarComPasseio(localId: LocalId): Promise<void> {
    if (ui.andando || !podeVisitar(caso, ui.estado, localId)) return
    const peao = raiz.querySelector<HTMLElement>('.peao')
    const tabuleiro = raiz.querySelector<HTMLElement>('.tabuleiro')
    const casa = raiz.querySelector<HTMLElement>(`.casa[data-id="${CSS.escape(localId)}"]`)
    if (!animar() || !peao || !tabuleiro || !casa) {
      concluirVisita(localId, false)
      return
    }

    ui.andando = true
    tabuleiro.classList.add('andando')
    const suave = movimento === 'suave'
    const de = anguloDe(ui.posicaoPeao)
    const para = anguloDe(localId)
    som.passos(duracaoCaminhada(de, para, suave))
    await caminharPelaEstrada(peao, de, para, suave)
    som.tocar('porta', 0.4) // a porta abre depois que o peão chega até ela
    await entrarNaCasa(peao, casa, tabuleiro, suave)
    if (custoDoLocal(caso, buscarLocal(caso, localId)) > 0) {
      const pips = raiz.querySelectorAll<HTMLElement>('.pip:not(.gasto)')
      som.tocar('dia')
      await passarDia(tabuleiro, pips[pips.length - 1] ?? null)
    }
    concluirVisita(localId, true)
  }

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
        ui = estadoUiInicial()
        if (quizAntes === null && perguntas().length > 0) {
          ui = { ...ui, tela: 'quiz-antes', respostas: perguntas().map(() => null) }
          render()
        } else {
          entrarNoMapa()
        }
        break
      case 'concluir-quiz':
        if (ui.tela === 'quiz-antes') {
          quizAntes = [...ui.respostas]
          entrarNoMapa()
        } else {
          quizDepois = [...ui.respostas]
          ui = { ...ui, tela: 'resultado', respostas: [] }
          render(false)
          raiz.querySelector<HTMLElement>('#comparacao-quiz')?.focus()
        }
        break
      case 'pular-quiz':
        quizAntes = []
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
        ui = estadoUiInicial()
        render()
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
