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
  type Aleatorio,
} from '../game/rules.ts'
import type { Caso, IndicioId, Local, LocalId, TipoResultado } from '../game/types.ts'
import { angulosDasCasas, AUDITOR, boneco, ceuNoturno, fundoTabuleiro, pontoNaEstrada, predio, TABULEIRO } from './arte.ts'
import { caminharPelaEstrada, entrarNaCasa, guardarNoCaderno, passarDia } from './animacao.ts'

type Tela = 'briefing' | 'mapa' | 'caderno' | 'acusacao' | 'resultado'

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
}

type Modo = 'historia' | 'desafio'

export interface OpcoesApp {
  /** false desliga as animações (usado nos testes). */
  animacoes?: boolean
  /** Sorteios (culpado no modo desafio e textos das pistas). Injetável para testes. */
  aleatorio?: Aleatorio
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
    }
  }

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
          <button type="button" class="secundario" data-acao="termo" data-id="todos" aria-haspopup="dialog">Glossário</button>
          <button type="button" class="secundario" data-acao="abrir-caderno">Caderno ${badge}</button>
        </div>
      </header>`
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
        ${valor}
        <div class="cartao">
          <h2>O que este resultado ensina</h2>
          <p>${esc(texto.ensina)}</p>
        </div>
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
    mapa: telaMapa,
    caderno: telaCaderno,
    acusacao: telaAcusacao,
    resultado: telaResultado,
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
    const bloqueado = ui.termoAberto !== null || ui.cardAberto !== null
    raiz.innerHTML = `<main class="app tela-${ui.tela}" ${bloqueado ? 'inert' : ''}>${telas[ui.tela]()}</main>${cardPista()}${glossario()}`
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
    await caminharPelaEstrada(peao, anguloDe(ui.posicaoPeao), anguloDe(localId), suave)
    await entrarNaCasa(peao, casa, tabuleiro, suave)
    if (custoDoLocal(caso, buscarLocal(caso, localId)) > 0) {
      const pips = raiz.querySelectorAll<HTMLElement>('.pip:not(.gasto)')
      await passarDia(tabuleiro, pips[pips.length - 1] ?? null)
    }
    concluirVisita(localId, true)
  }

  /** Fecha o card: ele voa até o caderno e o peão sai da casa. */
  async function guardarPista(depois: 'mapa' | 'caderno'): Promise<void> {
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
        ui = { ...estadoUiInicial(), tela: 'mapa' }
        render()
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
        break
      case 'encerrar-prazo':
        ui = { ...ui, estado: encerrarPrazo(caso, ui.estado) }
        irPara('resultado')
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
    } else {
      return
    }
    render(false)
    raiz.querySelector<HTMLInputElement>(`input[name="${input.name}"][value="${CSS.escape(input.value)}"]`)?.focus()
  })

  raiz.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && ui.termoAberto !== null) fecharTermo()
  })

  render(false)
}
