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
} from '../game/rules.ts'
import type { Caso, IndicioId, Local, LocalId, TipoResultado } from '../game/types.ts'
import { angulosDasCasas, AUDITOR, boneco, fundoTabuleiro, pontoNaEstrada, predio, TABULEIRO } from './arte.ts'

type Tela = 'briefing' | 'mapa' | 'pista' | 'caderno' | 'acusacao' | 'resultado'

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
  /** true enquanto o peão anda (bloqueia novos cliques). */
  andando: boolean
}

export interface OpcoesApp {
  /** false desliga as animações (usado nos testes). */
  animacoes?: boolean
}

const DURACAO_PASSEIO_MS = 800

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

export function iniciarApp(raiz: HTMLElement, caso: Caso, opcoes: OpcoesApp = {}): void {
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
    }
  }

  function animar(): boolean {
    if (opcoes.animacoes === false) return false
    const reduzir =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    return !reduzir
  }

  const nomeIndicio = (id: IndicioId) => caso.indicios.find((i) => i.id === id)?.nome ?? id

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
        <button type="button" class="secundario" data-acao="abrir-caderno">Caderno ${badge}</button>
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
            <li>No tabuleiro, escolha um local: seu peão anda até lá. Cada visita custa <strong>1 dia</strong> e revela uma pista.</li>
            <li>No <strong>caderno</strong>, veja quais comerciantes têm cada indício e <strong>risque</strong> quem você descartou.</li>
            <li>Emita o <strong>auto de infração</strong>: escolha o suspeito e <strong>2 provas</strong> que o diferenciem dos outros.</li>
          </ol>
        </div>
        <button type="button" data-acao="comecar">Começar investigação</button>
      </section>`
  }

  function telaMapa(): string {
    const semDias = ui.estado.diasRestantes === 0
    const casas = caso.locais
      .map((local) => {
        const visitado = ui.estado.locaisVisitados.includes(local.id)
        const disponivel = podeVisitar(caso, ui.estado, local.id)
        const tag = visitado
          ? '<span class="tag tag-visitado">✔ Visitado</span>'
          : '<span class="tag tag-custo">1 dia</span>'
        return `
          <button type="button" class="casa ${visitado ? 'visitado' : ''}" style="${estiloPos(local.id)}"
            data-acao="visitar" data-id="${esc(local.id)}" ${disponivel ? '' : 'disabled'}>
            ${predio(local.icone)}
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
        <p class="dica">Escolha bem: são ${caso.locais.length} locais, mas só há tempo para ${caso.diasIniciais}.</p>
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
            <div class="peao" style="${estiloPos(ui.posicaoPeao)}">
              ${boneco(AUDITOR, { expressao: 'feliz', rotulo: 'Seu peão' })}
            </div>
          </div>
        </div>
        <div class="acoes">
          <button type="button" data-acao="ir-acusacao" ${podeAcusar(caso, ui.estado) ? '' : 'disabled'}>Emitir auto de infração</button>
          ${semDias ? '<button type="button" class="perigo" data-acao="encerrar-prazo">Encerrar sem acusar</button>' : ''}
        </div>
        ${podeAcusar(caso, ui.estado) ? '' : `<p class="dica">Colete pelo menos ${caso.provasExigidas} pistas para poder acusar.</p>`}
      </section>`
  }

  function telaPista(): string {
    const local = ui.ultimaPista!
    const testemunha = local.testemunha
    const quemFala = testemunha
      ? boneco(testemunha.aparencia, { classe: 'grande', rotulo: testemunha.nome })
      : boneco(AUDITOR, { classe: 'grande', rotulo: 'Você' })
    const nomeQuemFala = testemunha ? esc(testemunha.nome) : 'Você descobre'

    const destaque = local.indicio
      ? `<div class="nova-pista" role="status">
           <span class="rotulo">Nova pista</span>
           <strong>${esc(nomeIndicio(local.indicio))}</strong>
           ${local.forca === 'fraca' ? '<span class="nota">É um testemunho: indica o mesmo que um documento, mas vem de uma conversa.</span>' : ''}
           <span class="nota">Abra o caderno para ver quais comerciantes apresentam esse indício.</span>
         </div>`
      : `<div class="sem-indicio" role="status">
           <span class="rotulo">Sem indício novo</span>
           <span class="nota">Esta informação não serve como prova, mas ajuda a entender o caso.</span>
         </div>`

    return `
      ${hud()}
      <section class="tela">
        <p class="rotulo">Você visitou</p>
        <h1 tabindex="-1">${esc(local.nome)}</h1>
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
          <button type="button" data-acao="abrir-caderno">Abrir caderno</button>
          <button type="button" class="secundario" data-acao="voltar-mapa">Voltar ao tabuleiro</button>
        </div>
      </section>`
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
        <p class="dica">A pessoa denunciada tem <strong>todos</strong> os indícios encontrados. Risque quem não tem algum deles. Quem decide é você: o caderno não risca ninguém sozinho.</p>
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
        <p class="dica">Acusar não gasta dia, mas encerra o caso. Escolha com cuidado.</p>
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

    return `
      <section class="tela resultado ${sucesso ? 'ok' : 'falha'}">
        <p class="rotulo">Resultado</p>
        <h1 tabindex="-1">${esc(texto.titulo)}</h1>
        ${cenaResultado(resultado.tipo, resultado.suspeitoAcusadoId)}
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
        <p class="nota">${esc(impacto.aviso)}</p>
        <button type="button" data-acao="jogar-novamente">Jogar novamente</button>
      </section>`
  }

  // ---------- Render e eventos ----------

  const telas: Record<Tela, () => string> = {
    briefing: telaBriefing,
    mapa: telaMapa,
    pista: telaPista,
    caderno: telaCaderno,
    acusacao: telaAcusacao,
    resultado: telaResultado,
  }

  function render(focar = true): void {
    raiz.innerHTML = `<main class="app tela-${ui.tela}">${telas[ui.tela]()}</main>`
    ui.diaAcabouDeGastar = false
    if (focar) raiz.querySelector<HTMLElement>('h1')?.focus()
  }

  function irPara(tela: Tela): void {
    ui = { ...ui, tela }
    render()
  }

  function concluirVisita(localId: LocalId): void {
    const { estado, pista } = visitarLocal(caso, ui.estado, localId)
    ui = {
      ...ui,
      estado,
      ultimaPista: pista,
      pistasNovas: ui.pistasNovas + 1,
      diaAcabouDeGastar: true,
      posicaoPeao: localId,
      andando: false,
    }
    irPara('pista')
  }

  /** Anda com o peão até o local e só então mostra a pista. */
  function visitarComPasseio(localId: LocalId): void {
    if (ui.andando || !podeVisitar(caso, ui.estado, localId)) return
    const peao = raiz.querySelector<HTMLElement>('.peao')
    if (!animar() || !peao) {
      concluirVisita(localId)
      return
    }
    ui.andando = true
    raiz.querySelector('.tabuleiro')?.classList.add('andando')
    const { left, top } = posicaoPct(localId)
    peao.classList.add('em-movimento')
    peao.style.left = left
    peao.style.top = top
    window.setTimeout(() => concluirVisita(localId), DURACAO_PASSEIO_MS)
  }

  raiz.addEventListener('click', (evento) => {
    const alvo = (evento.target as HTMLElement).closest<HTMLElement>('[data-acao]')
    if (!alvo || (alvo as HTMLButtonElement).disabled || ui.andando) return
    const id = alvo.dataset.id ?? ''

    switch (alvo.dataset.acao) {
      case 'comecar':
        irPara('mapa')
        break
      case 'visitar':
        visitarComPasseio(id)
        break
      case 'abrir-caderno':
        ui = { ...ui, pistasNovas: 0, voltarDoCaderno: ui.tela === 'caderno' ? ui.voltarDoCaderno : ui.tela }
        irPara('caderno')
        break
      case 'voltar-caderno':
        irPara(ui.voltarDoCaderno === 'pista' ? 'mapa' : ui.voltarDoCaderno)
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

  render(false)
}
