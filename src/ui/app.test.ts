// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { caso001 as caso, casos } from '../game/caso.ts'
import { iniciarApp } from './app.ts'

let raiz: HTMLElement

/** Sem teste rápido, tutorial e som: os testes do fluxo principal vão direto ao tabuleiro. */
const SEM_EXTRAS = { quiz: false, tutorial: false, som: false, imprevistos: false }

const texto = () => raiz.textContent ?? ''
const titulo = () => raiz.querySelector('h1')?.textContent?.trim()

function clicar(acao: string, id?: string): void {
  const seletor = id ? `[data-acao="${acao}"][data-id="${id}"]` : `[data-acao="${acao}"]`
  const botao = raiz.querySelector<HTMLButtonElement>(seletor)
  if (!botao) throw new Error(`Botão não encontrado: ${seletor} (tela: ${titulo()})`)
  if (botao.disabled) throw new Error(`Botão desabilitado: ${seletor}`)
  botao.click()
}

function marcar(nome: string, valor: string): void {
  const input = raiz.querySelector<HTMLInputElement>(`input[name="${nome}"][value="${valor}"]`)!
  input.checked = !input.checked
  input.dispatchEvent(new Event('change', { bubbles: true }))
}

/** Título do card de pista aberto sobre o tabuleiro. */
const tituloCard = () => raiz.querySelector('.card-pista h2')?.textContent?.trim()

/** Abordagem que revela a pista do local (dentro do card). */
const certa = (id: string) => caso.locais.find((l) => l.id === id)!.acoes!.find((a) => a.revela)!.id

/** Entra no local, escolhe a abordagem certa (se houver escolhas) e abre a pista. */
function entrarEEscolher(id: string): void {
  clicar('visitar', id)
  if (raiz.querySelector('[data-acao="escolher"]')) clicar('escolher', certa(id))
}

function visitar(id: string): void {
  entrarEEscolher(id)
  clicar('guardar-pista')
}

function acusarCom(suspeito: string, provas: [string, string]): void {
  clicar('ir-acusacao')
  marcar('acusado', suspeito)
  marcar('prova', provas[0])
  marcar('prova', provas[1])
  clicar('emitir-auto')
}

/** Emite o mesmo auto errado até acabarem as vidas (o caso então termina). */
function errarAteOFim(suspeito: string, provas: [string, string]): void {
  for (let i = 0; i < 3 && titulo() !== 'Auto anulado' && titulo() !== 'Acusação injusta'; i++) {
    acusarCom(suspeito, provas)
    if (titulo() === 'Auto devolvido') clicar('voltar-mapa')
  }
}

beforeEach(() => {
  document.body.innerHTML = '<div id="app"></div>'
  raiz = document.querySelector<HTMLElement>('#app')!
  iniciarApp(raiz, caso, { animacoes: false, aleatorio: () => 0, ...SEM_EXTRAS })
})

describe('fluxo das 6 telas', () => {
  it('briefing → mapa → pista → caderno → acusação → resultado (caso resolvido)', () => {
    expect(titulo()).toBe('Rota Fantasma')
    expect(texto()).toContain('Hospital Municipal de Vila Aurora')

    clicar('comecar')
    expect(titulo()).toBe('Para onde investigar?')
    expect(texto()).toContain('3 dias restantes')

    clicar('visitar', 'operadora_cartao')
    expect(titulo()).toBe('Para onde investigar?') // o card abre sobre o tabuleiro
    expect(tituloCard()).toBe('Operadora de cartão')
    expect(texto()).toContain('O que você faz?') // primeiro, escolher a abordagem
    expect(raiz.querySelector('[data-acao="guardar-pista"]')).toBeNull()
    expect(texto()).toContain('2 dias restantes')
    expect(raiz.querySelector('.pip.recem-gasto')).not.toBeNull()
    clicar('escolher', 'relatorio')
    expect(texto()).toContain('Nova pista')
    expect(raiz.querySelector('main')?.hasAttribute('inert')).toBe(true)

    clicar('guardar-abrir-caderno')
    expect(raiz.querySelector('.card-pista')).toBeNull()
    expect(titulo()).toBe('Caderno de suspeitos')

    clicar('voltar-caderno')
    visitar('cartorio_detran')
    acusarCom('ricardo', ['operadora_cartao', 'cartorio_detran'])

    expect(titulo()).toBe('Caso resolvido')
    expect(texto()).toContain('Valor recuperado')
    expect(texto()).toMatch(/R\$\s?180\.000/)
    expect(texto()).toContain('Para debater')
    expect(raiz.querySelectorAll('.resultado ol li')).toHaveLength(2)
    expect(texto()).toContain('fictícios')
  })
})

describe('feedback visual', () => {
  beforeEach(() => clicar('comecar'))

  it('mostra badge de pistas novas até abrir o caderno', () => {
    visitar('operadora_cartao')
    visitar('praca')
    expect(raiz.querySelector('.badge')?.textContent).toContain('2 novas')
    clicar('abrir-caderno')
    expect(raiz.querySelector('.badge')).toBeNull()
  })

  it('o caderno revela só as colunas dos indícios já encontrados', () => {
    clicar('abrir-caderno')
    expect(raiz.querySelectorAll('thead th.oculto')).toHaveLength(3)
    clicar('voltar-caderno')

    visitar('operadora_cartao')
    clicar('abrir-caderno')
    expect(raiz.querySelectorAll('thead th.oculto')).toHaveLength(2)
    expect(raiz.querySelectorAll('td.tem')).toHaveLength(2) // Ricardo e Marta
  })

  it('risca e desfaz suspeitos no caderno, sem riscar ninguém sozinho', () => {
    visitar('operadora_cartao')
    clicar('abrir-caderno')
    expect(raiz.querySelectorAll('tr.riscado')).toHaveLength(0)

    clicar('riscar', 'aurelio')
    expect(raiz.querySelectorAll('tr.riscado')).toHaveLength(1)
    expect(texto()).toContain('Riscados: 1/4')

    clicar('riscar', 'aurelio')
    expect(raiz.querySelectorAll('tr.riscado')).toHaveLength(0)
  })

  it('locais visitados ficam marcados e desabilitados', () => {
    visitar('junta_comercial')
    const botao = raiz.querySelector<HTMLButtonElement>('[data-id="junta_comercial"]')!
    expect(botao.disabled).toBe(true)
    expect(botao.textContent).toContain('Visitado')
  })

  it('local sem indício avisa que não serve como prova', () => {
    entrarEEscolher('junta_comercial')
    expect(texto()).toContain('Sem indício novo')
  })

  it('só permite marcar 2 provas', () => {
    visitar('operadora_cartao')
    visitar('cartorio_detran')
    visitar('ex_funcionario')
    clicar('ir-acusacao')
    marcar('prova', 'operadora_cartao')
    marcar('prova', 'cartorio_detran')
    const terceira = raiz.querySelector<HTMLInputElement>('input[value="ex_funcionario"]')!
    expect(terceira.disabled).toBe(true)
  })
})

describe('os 4 resultados na tela', () => {
  beforeEach(() => clicar('comecar'))

  it('auto anulado mostra o valor que continua faltando', () => {
    visitar('operadora_cartao')
    visitar('ex_funcionario')
    errarAteOFim('ricardo', ['operadora_cartao', 'ex_funcionario'])
    expect(titulo()).toBe('Auto anulado')
    expect(texto()).toContain('Continua faltando para o hospital')
    expect(texto()).toContain('a Dona Helena devolveu 2 autos')
  })

  it('acusação injusta', () => {
    visitar('operadora_cartao')
    visitar('ex_funcionario')
    errarAteOFim('marta', ['operadora_cartao', 'ex_funcionario'])
    expect(titulo()).toBe('Acusação injusta')
  })

  it('auto errado volta: perde 1 vida, não revela o culpado e dá para corrigir', () => {
    visitar('operadora_cartao')
    visitar('ex_funcionario')
    expect(raiz.querySelectorAll('.vidas .coracao:not(.perdido)')).toHaveLength(3)
    acusarCom('marta', ['operadora_cartao', 'ex_funcionario'])
    expect(titulo()).toBe('Auto devolvido')
    expect(texto()).toContain('acusar um inocente')
    expect(texto()).toContain('Você ainda tem 2 vidas')
    expect(texto()).not.toContain('Quem tinha todos os indícios')
    expect(raiz.querySelectorAll('.vidas .coracao.perdido')).toHaveLength(1)
    clicar('voltar-mapa')
    visitar('cartorio_detran')
    clicar('ir-acusacao')
    expect(raiz.querySelector('input[name="acusado"]:checked')).toBeNull()
    expect(texto()).toContain('restam 2')
    marcar('acusado', 'ricardo')
    marcar('prova', 'operadora_cartao')
    marcar('prova', 'cartorio_detran')
    clicar('emitir-auto')
    expect(titulo()).toBe('Caso resolvido')
    expect(texto()).toContain('a Dona Helena devolveu 1 auto')
  })

  it('na última vida, a tela do auto avisa', () => {
    visitar('operadora_cartao')
    visitar('ex_funcionario')
    for (let i = 0; i < 2; i++) {
      acusarCom('ricardo', ['operadora_cartao', 'ex_funcionario'])
      clicar('voltar-mapa')
    }
    clicar('ir-acusacao')
    expect(texto()).toContain('Última vida')
  })

  it('Pedir dica: do geral ao específico, e Esc fecha', () => {
    visitar('operadora_cartao')
    clicar('pedir-dica')
    const dialogo = () => raiz.querySelector('.dica[role="dialog"]')
    expect(dialogo()?.textContent).toContain('dica 1 de 3')
    expect(dialogo()?.textContent).toContain('Vendas no cartão sem nota')
    expect(dialogo()?.textContent).toContain('tira a estrela do caderno')
    clicar('dica-mais')
    expect(dialogo()?.textContent).toContain('dica 2 de 3')
    clicar('dica-mais')
    expect(dialogo()?.textContent).toContain('dica 3 de 3')
    expect(dialogo()?.textContent).toContain('Um lugar para procurá-lo')
    expect(raiz.querySelector('[data-acao="dica-mais"]')).toBeNull()
    raiz.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(dialogo()).toBeNull()
  })

  it('sem dias, dá para pedir prorrogação: +1 dia por 1 vida', () => {
    for (const id of ['junta_comercial', 'praca', 'operadora_cartao']) visitar(id)
    expect(texto()).toContain('Os dias acabaram')
    expect(texto()).toContain('custa 1 vida')
    clicar('prorrogar')
    expect(texto()).not.toContain('Os dias acabaram')
    expect(raiz.querySelectorAll('.vidas .coracao.perdido')).toHaveLength(1)
    expect(raiz.querySelector('.hud')?.textContent).toContain(`de ${caso.diasIniciais + 1}`)
    visitar('cartorio_detran')
    acusarCom('ricardo', ['operadora_cartao', 'cartorio_detran'])
    expect(titulo()).toBe('Caso resolvido')
    expect(texto()).toContain('1 dia de prorrogação')
  })

  it('prazo encerrado depois de gastar os 4 dias', () => {
    for (const id of ['junta_comercial', 'portal_transparencia', 'praca', 'operadora_cartao']) visitar(id)
    expect(texto()).toContain('Os dias acabaram')
    clicar('encerrar-prazo')
    expect(titulo()).toBe('Prazo encerrado')
  })

  it('relatório detalhado aparece só com o Portal da Transparência', () => {
    visitar('portal_transparencia')
    visitar('cartorio_detran')
    visitar('ex_funcionario')
    acusarCom('ricardo', ['cartorio_detran', 'ex_funcionario'])
    expect(texto()).toContain('Para onde vai o dinheiro')
  })

  it('jogar novamente volta ao briefing com tudo zerado', () => {
    visitar('operadora_cartao')
    visitar('cartorio_detran')
    acusarCom('ricardo', ['operadora_cartao', 'cartorio_detran'])
    clicar('jogar-novamente')
    expect(titulo()).toBe('Rota Fantasma')
    clicar('comecar')
    expect(texto()).toContain('3 dias restantes')
  })
})

describe('tabuleiro e personagens', () => {
  beforeEach(() => clicar('comecar'))

  it('mostra os 9 locais como casas do tabuleiro, o hospital e o peão na partida', () => {
    expect(raiz.querySelectorAll('button.casa')).toHaveLength(9)
    expect(raiz.querySelector('.casa-marco')?.textContent).toContain('Hospital Municipal')
    expect(raiz.querySelector('.casa.partida')).not.toBeNull()
    expect(raiz.querySelector('.peao .boneco')).not.toBeNull()
  })

  it('o peão fica no último local visitado', () => {
    const partida = raiz.querySelector<HTMLElement>('.peao')!.style.top // o Cartório fica na mesma coluna da Auditoria
    visitar('cartorio_detran')
    const casa = raiz.querySelector<HTMLElement>('[data-id="cartorio_detran"]')!
    const peao = raiz.querySelector<HTMLElement>('.peao')!
    expect(peao.style.top).not.toBe(partida)
    expect(peao.style.left).toBe(casa.style.left)
    expect(peao.style.top).toBe(casa.style.top)
  })

  it('a testemunha do local aparece com o balão da pista', () => {
    entrarEEscolher('ex_funcionario')
    expect(texto()).toContain('Tião, ex-funcionário')
    expect(raiz.querySelector('.balao .pista')?.textContent).toContain('sem carteira assinada')
  })

  it('sem testemunha, quem descobre a pista é o próprio auditor', () => {
    clicar('visitar', 'portal_transparencia')
    expect(texto()).toContain('Você descobre')
  })

  it('suspeito riscado ganha avatar com X no caderno', () => {
    clicar('abrir-caderno')
    expect(raiz.querySelectorAll('.caderno .avatar .boneco')).toHaveLength(4)
    clicar('riscar', 'celia')
    expect(raiz.querySelector('tr.riscado .avatar')).not.toBeNull()
  })

  it('resultado mostra o carimbo sobre o acusado', () => {
    visitar('operadora_cartao')
    visitar('cartorio_detran')
    acusarCom('ricardo', ['operadora_cartao', 'cartorio_detran'])
    expect(raiz.querySelector('.carimbo')?.textContent).toBe('Autuado')
  })
})

describe('peão animado', () => {
  afterEach(() => vi.useRealTimers())

  function iniciarAnimado(): void {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance', 'Date'] })
    document.body.innerHTML = '<div id="app2"></div>'
    raiz = document.querySelector<HTMLElement>('#app2')!
    iniciarApp(raiz, caso, { animacoes: true, aleatorio: () => 0, ...SEM_EXTRAS })
    clicar('comecar')
  }

  it('caminha pela estrada, entra na casa, o dia passa e só então o card abre', async () => {
    iniciarAnimado()
    clicar('visitar', 'praca')
    const peao = raiz.querySelector<HTMLElement>('.peao')!
    const inicio = peao.style.left
    expect(peao.classList.contains('caminhando')).toBe(true)
    expect(raiz.querySelector('.card-pista')).toBeNull()

    // cliques durante a caminhada são ignorados
    raiz.querySelector<HTMLButtonElement>('[data-id="junta_comercial"]')!.click()

    await vi.advanceTimersByTimeAsync(300)
    expect(peao.style.left).not.toBe(inicio) // está andando pela estrada

    await vi.advanceTimersByTimeAsync(6000)
    expect(tituloCard()).toBe('Consumidores na praça')
    expect(raiz.querySelector('.card-pista.virando')).not.toBeNull()
    expect(raiz.querySelector('.casa.iluminada .predio.porta-aberta')).not.toBeNull()
    expect(raiz.querySelector('.peao.dentro')).not.toBeNull()
    expect(texto()).toContain('2 dias restantes')
    expect(raiz.querySelectorAll('[data-id="junta_comercial"].visitado')).toHaveLength(0)
  })

  it('ao guardar a pista, o peão sai da casa e a porta fecha', async () => {
    iniciarAnimado()
    clicar('visitar', 'operadora_cartao') // do outro lado do mapa: caminhada longa
    await vi.advanceTimersByTimeAsync(9000)
    clicar('escolher', 'relatorio')
    clicar('guardar-pista')
    await vi.advanceTimersByTimeAsync(1000)
    expect(raiz.querySelector('.card-pista')).toBeNull()
    expect(raiz.querySelector('.peao.saindo')).not.toBeNull()
    expect(raiz.querySelector('.predio.porta-aberta')).toBeNull()
  })

  it('o Portal (grátis) não tem noite: o dia não passa', async () => {
    iniciarAnimado()
    clicar('visitar', 'portal_transparencia')
    await vi.advanceTimersByTimeAsync(6000)
    expect(tituloCard()).toBe('Portal da Transparência')
    expect(raiz.querySelector('.pip.apagando')).toBeNull()
    expect(texto()).toContain('3 dias restantes')
  })
})

describe('lore', () => {
  it('o briefing abre com a lore de Vila Aurora', () => {
    expect(raiz.querySelector('.abertura')?.textContent).toContain('Vila Aurora')
  })

  it('o gancho do próximo caso aparece só quando o caso é resolvido', () => {
    clicar('comecar')
    visitar('operadora_cartao')
    visitar('cartorio_detran')
    acusarCom('ricardo', ['operadora_cartao', 'cartorio_detran'])
    expect(raiz.querySelector('.gancho')?.textContent).toContain('Distribuidora Horizonte')

    clicar('jogar-novamente')
    clicar('comecar')
    visitar('operadora_cartao')
    visitar('ex_funcionario')
    errarAteOFim('ricardo', ['operadora_cartao', 'ex_funcionario'])
    expect(raiz.querySelector('.gancho')).toBeNull()
  })
})

describe('glossário', () => {
  it('termo destacado abre o verbete, e "Entendi" fecha', () => {
    clicar('termo', 'auto')
    expect(raiz.querySelector('[role="dialog"]')?.textContent).toContain('Auto de infração')
    expect(raiz.querySelector('main')?.hasAttribute('inert')).toBe(true)
    raiz.querySelector<HTMLButtonElement>('.janela .fechar')!.click()
    expect(raiz.querySelector('[role="dialog"]')).toBeNull()
  })

  it('botão Glossário do topo lista todos os termos', () => {
    clicar('comecar')
    clicar('termo', 'todos')
    expect(raiz.querySelectorAll('.verbetes dt').length).toBe(caso.glossario!.length)
  })

  it('Esc fecha o glossário', () => {
    clicar('termo', 'indicio')
    raiz.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(raiz.querySelector('[role="dialog"]')).toBeNull()
  })

  it('a pista nova liga o indício ao glossário', () => {
    clicar('comecar')
    entrarEEscolher('cartorio_detran')
    clicar('termo', 'patrimonio')
    expect(raiz.querySelector('[role="dialog"]')?.textContent).toContain('renda declarada')
  })
})

describe('novidades: Portal grátis, estrelas e modo desafio', () => {
  it('o Portal aparece como grátis e não gasta dia', () => {
    clicar('comecar')
    expect(raiz.querySelector('[data-id="portal_transparencia"]')?.textContent).toContain('Grátis')
    clicar('visitar', 'portal_transparencia')
    expect(texto()).toContain('3 dias restantes')
  })

  it('o resultado mostra as estrelas conquistadas', () => {
    clicar('comecar')
    visitar('operadora_cartao')
    visitar('cartorio_detran')
    acusarCom('ricardo', ['operadora_cartao', 'cartorio_detran'])
    expect(raiz.querySelector('.estrelas')?.getAttribute('aria-label')).toBe('2 de 3 estrelas')
  })

  it('o modo desafio mostra a etiqueta e volta ao modo história ao jogar de novo', () => {
    clicar('comecar', 'desafio')
    expect(raiz.querySelector('.tag-desafio')).not.toBeNull()
    for (const id of ['junta_comercial', 'praca', 'operadora_cartao']) visitar(id)
    clicar('encerrar-prazo')
    clicar('jogar-novamente')
    clicar('comecar', 'historia')
    expect(raiz.querySelector('.tag-desafio')).toBeNull()
  })
})

describe('pistas com texto sorteado', () => {
  it('outra partida pode mostrar outra versão da mesma pista', () => {
    document.body.innerHTML = '<div id="app3"></div>'
    raiz = document.querySelector<HTMLElement>('#app3')!
    iniciarApp(raiz, caso, { animacoes: false, aleatorio: () => 0.99, ...SEM_EXTRAS })
    clicar('comecar')
    entrarEEscolher('ex_funcionario')
    const balao = raiz.querySelector('.balao .pista')?.textContent ?? ''
    expect(balao).toContain('A chefia dizia que registrar sai caro')
    expect(texto()).toContain('Funcionários sem carteira')
  })
})

describe('teste rápido, tutorial, explicação e som', () => {
  function iniciarCompleto(): void {
    localStorage.clear()
    document.body.innerHTML = '<div id="app4"></div>'
    raiz = document.querySelector<HTMLElement>('#app4')!
    iniciarApp(raiz, caso, { animacoes: false, aleatorio: () => 0, som: false, imprevistos: false })
  }

  const responderQuiz = (respostas: number[]) => respostas.forEach((r, i) => marcar(`quiz-${i}`, String(r)))

  /** Começa a partida pulando o teste e as dicas. */
  function irDiretoAoMapa(): void {
    iniciarCompleto()
    clicar('comecar')
    clicar('pular-quiz')
    clicar('tutorial-fechar')
  }

  it('teste antes → tutorial → partida → teste depois → comparação', () => {
    iniciarCompleto()
    clicar('comecar')
    expect(titulo()).toBe('3 perguntas rápidas')
    expect(raiz.querySelector<HTMLButtonElement>('[data-acao="concluir-quiz"]')!.disabled).toBe(true)
    responderQuiz([0, 0, 1]) // nenhuma certa (as certas são 1, 2 e 0)
    clicar('concluir-quiz')

    // tutorial da Dona Helena, uma dica por vez, com o alvo destacado
    expect(texto()).toContain('Dona Helena · dica 1 de 4')
    expect(raiz.querySelector('.tabuleiro.alvo-tutorial')).not.toBeNull()
    expect(raiz.querySelector('main')?.hasAttribute('inert')).toBe(true)
    clicar('tutorial-proximo')
    expect(raiz.querySelector('.dias.alvo-tutorial')).not.toBeNull()
    clicar('tutorial-fechar')
    expect(raiz.querySelector('.tutorial')).toBeNull()
    expect(raiz.querySelector('main')?.hasAttribute('inert')).toBe(false)

    visitar('cartorio_detran')
    visitar('ex_funcionario')
    acusarCom('ricardo', ['cartorio_detran', 'ex_funcionario'])
    expect(texto()).toContain('Por que deu certo')
    expect(texto()).toContain('Teste rápido: e agora?')

    clicar('ir-quiz-depois')
    expect(titulo()).toBe('As mesmas 3 perguntas')
    expect(raiz.querySelectorAll('input[name^="quiz-"]:checked')).toHaveLength(0) // começa em branco
    responderQuiz([1, 2, 0])
    clicar('concluir-quiz')
    expect(titulo()).toBe('Caso resolvido')
    expect(raiz.querySelector('.placar-quiz')!.getAttribute('aria-label')).toBe(
      'Antes do jogo: 0 de 3 acertos. Depois: 3 de 3.',
    )
    expect(texto()).toContain('Você acertou mais depois de jogar!')
    expect(texto()).toContain('No Portal da Transparência')

    // jogar de novo não repete o teste nem o tutorial
    clicar('jogar-novamente')
    clicar('comecar')
    expect(titulo()).toBe('Para onde investigar?')
    expect(raiz.querySelector('.tutorial')).toBeNull()
  })

  it('dá para pular o teste; aí o resultado não oferece o teste final', () => {
    iniciarCompleto()
    clicar('comecar')
    clicar('pular-quiz')
    expect(raiz.querySelector('.tutorial')).not.toBeNull()
    for (let i = 0; i < 4; i++) clicar('tutorial-proximo')
    expect(raiz.querySelector('.tutorial')).toBeNull()
    visitar('operadora_cartao')
    visitar('ex_funcionario')
    errarAteOFim('ricardo', ['operadora_cartao', 'ex_funcionario'])
    expect(texto()).toContain('Onde a acusação falhou')
    expect(texto()).toContain('Marta também tem')
    expect(raiz.querySelector('.cartao-quiz')).toBeNull()
  })

  it('o botão Dicas reabre o tutorial e Esc fecha', () => {
    irDiretoAoMapa()
    clicar('tutorial-abrir')
    expect(raiz.querySelector('.tutorial')).not.toBeNull()
    raiz.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(raiz.querySelector('.tutorial')).toBeNull()
  })

  it('acusação injusta mostra quem era o culpado', () => {
    irDiretoAoMapa()
    visitar('cartorio_detran')
    visitar('praca')
    errarAteOFim('marta', ['cartorio_detran', 'praca'])
    expect(texto()).toContain('Quem tinha todos os indícios do caso era Ricardo')
  })

  it('o botão de som liga e desliga, e a escolha fica salva', () => {
    iniciarCompleto()
    const botao = () => raiz.querySelector<HTMLButtonElement>('[data-acao="alternar-som"]')!
    expect(botao().getAttribute('aria-pressed')).toBe('true')
    clicar('alternar-som')
    expect(botao().textContent).toContain('Som: desligado')
    expect(localStorage.getItem('rota-fantasma:som')).toBe('desligado')
    localStorage.clear()
  })
})

describe('andar com o teclado e o direcional', () => {
  const tecla = (tipo: 'keydown' | 'keyup', key: string) =>
    document.dispatchEvent(new KeyboardEvent(tipo, { key, bubbles: true, cancelable: true }))

  async function segurar(key: string, ms: number): Promise<void> {
    tecla('keydown', key)
    await vi.advanceTimersByTimeAsync(ms)
    tecla('keyup', key)
  }

  function iniciarNoMapa(): void {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance', 'Date'] })
    document.body.innerHTML = '<div id="app5"></div>'
    raiz = document.querySelector<HTMLElement>('#app5')!
    iniciarApp(raiz, caso, { animacoes: false, aleatorio: () => 0, ...SEM_EXTRAS })
    clicar('comecar')
  }

  afterEach(() => {
    vi.useRealTimers()
  })

  const peao = () => raiz.querySelector<HTMLElement>('.peao')!

  it('as setas movem o peão pela rua; Espaço na porta entra no local', async () => {
    iniciarNoMapa()
    const inicio = peao().style.left
    await segurar('ArrowDown', 300) // sai da porta da Auditoria para a rua de baixo
    await segurar('ArrowLeft', 1300) // segue pela rua até a calçada do escritório vizinho (126 unidades)
    expect(peao().style.left).not.toBe(inicio)
    await segurar('ArrowUp', 400) // sobe a calçada até a porta
    expect(raiz.querySelector('.aviso-porta')?.textContent).toContain('Escritório Contábil Soma')
    expect(raiz.querySelector('.casa.perto[data-id="contabilidade"]')).not.toBeNull()

    tecla('keydown', ' ')
    expect(tituloCard()).toBe('Escritório Contábil Soma')
  })

  it('W A S D também andam, e o peão não atravessa prédios', async () => {
    iniciarNoMapa()
    const topo = peao().style.top
    await segurar('w', 1000) // a Auditoria está em cima: não dá para subir
    expect(peao().style.top).toBe(topo)
    await segurar('s', 300)
    expect(parseFloat(peao().style.top)).toBeGreaterThan(parseFloat(topo))
  })

  it('com o card aberto, as setas não movem o peão', async () => {
    iniciarNoMapa()
    clicar('visitar', 'praca')
    const antes = peao().style.left
    await segurar('ArrowRight', 500)
    expect(peao().style.left).toBe(antes)
  })

  it('o direcional na tela anda enquanto o botão está pressionado', async () => {
    iniciarNoMapa()
    const seta = (dir: string) => raiz.querySelector<HTMLElement>(`[data-dir="${dir}"]`)!
    seta('baixo').dispatchEvent(new Event('pointerdown', { bubbles: true, cancelable: true }))
    await vi.advanceTimersByTimeAsync(300)
    document.dispatchEvent(new Event('pointerup', { bubbles: true }))
    await vi.advanceTimersByTimeAsync(400) // desliza um pouquinho até parar
    const depois = peao().style.top
    await vi.advanceTimersByTimeAsync(300)
    expect(peao().style.top).toBe(depois) // soltou, parou
    expect(parseFloat(depois)).toBeGreaterThan(87.7)
  })

  it('clicar num local leva o peão até a porta dele', () => {
    iniciarNoMapa()
    visitar('junta_comercial')
    const casa = raiz.querySelector<HTMLElement>('.casa[data-id="junta_comercial"]')!
    expect(peao().style.left).toBe(casa.style.left)
    expect(peao().style.top).toBe(casa.style.top)
    expect(raiz.querySelector('.aviso-porta')?.textContent).toContain('Você já visitou este local')
  })
})

describe('campanha: arquivo de casos, escolhas, moradores e imprevistos', () => {
  function iniciarCampanha(extras: Record<string, unknown> = {}): void {
    localStorage.clear()
    document.body.innerHTML = '<div id="app6"></div>'
    raiz = document.querySelector<HTMLElement>('#app6')!
    iniciarApp(raiz, casos, { animacoes: false, aleatorio: () => 0, ...SEM_EXTRAS, ...extras })
  }

  afterEach(() => localStorage.clear())

  it('o arquivo mostra os 7 casos; só o primeiro começa aberto', () => {
    iniciarCampanha()
    expect(titulo()).toBe('Rota Fantasma')
    const botoes = [...raiz.querySelectorAll<HTMLButtonElement>('[data-acao="abrir-caso"]')]
    expect(botoes).toHaveLength(7)
    expect(botoes.map((b) => b.disabled)).toEqual([false, true, true, true, true, true, true])
    expect(texto()).toContain('Resolva o caso 001 para abrir')
  })

  it('resolver o caso 001 destrava o 002, e o progresso fica salvo', () => {
    iniciarCampanha()
    clicar('abrir-caso', 'caso-001')
    expect(texto()).toContain('Caso 001')
    clicar('comecar')
    visitar('cartorio_detran')
    visitar('ex_funcionario')
    acusarCom('ricardo', ['cartorio_detran', 'ex_funcionario'])
    expect(titulo()).toBe('Caso resolvido')
    clicar('abrir-caso', 'caso-002')
    expect(texto()).toContain('A empresa fantasma')
    expect(texto()).toContain('Otávio')

    // outra sessão (recarregou a página): o 002 continua aberto
    iniciarApp((document.body.innerHTML = '<div id="app7"></div>', document.querySelector<HTMLElement>('#app7')!), casos, { animacoes: false, ...SEM_EXTRAS })
    raiz = document.querySelector<HTMLElement>('#app7')!
    const botoes = [...raiz.querySelectorAll<HTMLButtonElement>('[data-acao="abrir-caso"]')]
    expect(botoes.map((b) => b.disabled)).toEqual([false, false, true, true, true, true, true])
  })

  it('caso 002: a casa do sócio aparece no mapa depois da Junta Comercial', () => {
    iniciarCampanha()
    localStorage.setItem('rota-fantasma:progresso', JSON.stringify({ estrelas: {}, resolvidos: ['caso-001'] }))
    iniciarApp((document.body.innerHTML = '<div id="app8"></div>', document.querySelector<HTMLElement>('#app8')!), casos, { animacoes: false, aleatorio: () => 0, ...SEM_EXTRAS })
    raiz = document.querySelector<HTMLElement>('#app8')!
    clicar('abrir-caso', 'caso-002')
    clicar('comecar')
    expect(raiz.querySelector('.casa.trancada[data-id="casa_socio"]')).not.toBeNull()
    expect(raiz.querySelector('button.casa[data-id="casa_socio"]')).toBeNull()
    clicar('visitar', 'junta_comercial')
    clicar('escolher', 'contrato')
    clicar('guardar-pista')
    expect(raiz.querySelector('button.casa[data-id="casa_socio"]')).not.toBeNull()
    expect(texto()).toContain('Novo endereço no mapa: Casa do sócio da Horizonte')
  })

  it('caso 007: 4 dias, 5 suspeitos e um auto com 3 provas', () => {
    iniciarCampanha()
    const anteriores = ['caso-001', 'caso-002', 'caso-003', 'caso-004', 'caso-005', 'caso-006']
    localStorage.setItem('rota-fantasma:progresso', JSON.stringify({ estrelas: {}, resolvidos: anteriores }))
    iniciarApp((document.body.innerHTML = '<div id="app9"></div>', document.querySelector<HTMLElement>('#app9')!), casos, { animacoes: false, aleatorio: () => 0, ...SEM_EXTRAS })
    raiz = document.querySelector<HTMLElement>('#app9')!
    clicar('abrir-caso', 'caso-007')
    expect(texto()).toContain('3 provas')
    clicar('comecar')
    const c007 = casos[6]
    for (const id of ['vistoria', 'sindicato', 'tribunal']) {
      clicar('visitar', id)
      clicar('escolher', c007.locais.find((l) => l.id === id)!.acoes!.find((a) => a.revela)!.id)
      clicar('guardar-pista')
    }
    clicar('ir-acusacao')
    expect(texto()).toContain('Escolha 3 provas')
    expect(raiz.querySelectorAll('input[name="acusado"]')).toHaveLength(5)
    marcar('acusado', 'vanessa')
    for (const id of ['vistoria', 'sindicato', 'tribunal']) marcar('prova', id)
    clicar('emitir-auto')
    expect(titulo()).toBe('Caso resolvido')
    expect(texto()).toContain('Fim da segunda temporada')
  })

  it('a abordagem errada gasta o dia e não rende prova', () => {
    iniciarCampanha()
    clicar('abrir-caso', 'caso-001')
    clicar('comecar')
    clicar('visitar', 'cartorio_detran')
    clicar('escolher', 'fofoca')
    expect(texto()).toContain('Sem prova')
    expect(texto()).toContain('2 dias restantes')
    clicar('guardar-abrir-caderno')
    expect(texto()).toContain('sem prova (a abordagem escolhida não revelou o indício)')
  })

  it('imprevisto: um local fica fechado no dia sorteado', () => {
    iniciarCampanha({ imprevistos: true })
    clicar('abrir-caso', 'caso-001')
    clicar('comecar')
    // com o sorteio () => 0, o primeiro local pago (Operadora) fecha no dia 1
    expect(texto()).toContain('Imprevisto: Operadora de cartão')
    expect(raiz.querySelector<HTMLButtonElement>('[data-acao="visitar"][data-id="operadora_cartao"]')!.disabled).toBe(true)
    expect(raiz.querySelector('.casa.fechado[data-id="operadora_cartao"]')?.textContent).toContain('Fechado hoje')
    visitar('cartorio_detran')
    expect(raiz.querySelector<HTMLButtonElement>('[data-acao="visitar"][data-id="operadora_cartao"]')!.disabled).toBe(false)
  })

  it('morador: conversar anota o boato no caderno, e o resultado diz se era verdade', () => {
    iniciarCampanha()
    clicar('abrir-caso', 'caso-001')
    clicar('comecar')
    expect(raiz.querySelectorAll('.morador')).toHaveLength(3)
    clicar('conversar', '1') // Duda: boato falso
    expect(raiz.querySelector('.fala-morador')?.textContent).toContain('Duda')
    expect(raiz.querySelector('.fala-morador')?.textContent).not.toContain('Ricardo')
    clicar('abrir-caderno')
    expect(texto()).toContain('Conversas na rua')
    expect(texto()).toContain('Boato não vale como prova')
    clicar('voltar-caderno')
    visitar('cartorio_detran')
    visitar('ex_funcionario')
    acusarCom('ricardo', ['cartorio_detran', 'ex_funcionario'])
    expect(texto()).toContain('Conversas na rua: era verdade?')
    expect(texto()).toContain('Era só boato.')
  })
})

describe('movimento: direção, corrida, entrar pela rua e retomar o controle', () => {
  const tecla = (tipo: 'keydown' | 'keyup', key: string, shiftKey = false) =>
    document.dispatchEvent(new KeyboardEvent(tipo, { key, shiftKey, bubbles: true, cancelable: true }))

  async function segurar(key: string, ms: number, shiftKey = false): Promise<void> {
    tecla('keydown', key, shiftKey)
    await vi.advanceTimersByTimeAsync(ms)
    tecla('keyup', key)
    await vi.advanceTimersByTimeAsync(400) // até parar de deslizar
  }

  function iniciar(animacoes: boolean): void {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance', 'Date'] })
    document.body.innerHTML = '<div id="app9"></div>'
    raiz = document.querySelector<HTMLElement>('#app9')!
    iniciarApp(raiz, caso, { animacoes, aleatorio: () => 0, ...SEM_EXTRAS })
    clicar('comecar')
  }

  afterEach(() => vi.useRealTimers())

  const peao = () => raiz.querySelector<HTMLElement>('.peao')!
  const x = () => parseFloat(peao().style.left)

  it('o boneco vira: de lado andando para os lados, de costas subindo', async () => {
    iniciar(false)
    expect(peao().dataset.olhar).toBe('baixo')
    expect(peao().querySelectorAll('.boneco')).toHaveLength(3) // frente, costas e lado
    await segurar('ArrowDown', 250)
    await segurar('ArrowLeft', 300)
    expect(peao().dataset.olhar).toBe('esquerda')
    await segurar('ArrowRight', 300)
    expect(peao().dataset.olhar).toBe('direita')
    await segurar('ArrowUp', 100)
    expect(peao().dataset.olhar).toBe('cima')
  })

  it('com Shift o peão corre: anda mais no mesmo tempo', async () => {
    iniciar(false)
    await segurar('ArrowDown', 250)
    const inicio = x()
    await segurar('ArrowLeft', 500)
    const andando = inicio - x()
    const meio = x()
    await segurar('ArrowLeft', 500, true)
    const correndo = meio - x()
    expect(correndo).toBeGreaterThan(andando * 1.4)
  })

  it('na rua, em frente ao local, Espaço já entra (sem subir a calçada)', async () => {
    iniciar(false)
    await segurar('ArrowDown', 250)
    await segurar('ArrowLeft', 1250) // para na rua em frente ao Escritório Contábil Soma
    expect(raiz.querySelector('.aviso-porta')?.textContent).toContain('Escritório Contábil Soma')
    tecla('keydown', ' ')
    expect(tituloCard()).toBe('Escritório Contábil Soma')
  })

  it('apertar uma seta durante a caminhada automática cancela a visita, sem gastar dia', async () => {
    iniciar(true)
    clicar('visitar', 'operadora_cartao') // do outro lado do mapa
    await vi.advanceTimersByTimeAsync(500)
    tecla('keydown', 'ArrowDown')
    await vi.advanceTimersByTimeAsync(300)
    tecla('keyup', 'ArrowDown')
    await vi.advanceTimersByTimeAsync(3000)
    expect(raiz.querySelector('.card-pista')).toBeNull()
    expect(texto()).toContain('3 dias restantes')
    expect(peao().dataset.olhar).toBe('baixo')
  })

  it('o morador para e olha para o peão enquanto conversa', async () => {
    iniciar(true)
    const morador = () => raiz.querySelector<HTMLElement>('.morador[data-id="0"]')!
    clicar('conversar', '0')
    await vi.advanceTimersByTimeAsync(6000) // o peão vai até ele
    expect(raiz.querySelector('.fala-morador')?.textContent).toContain('Seu Nonato')
    const parado = morador().style.left + morador().style.top
    await vi.advanceTimersByTimeAsync(2000)
    expect(morador().style.left + morador().style.top).toBe(parado)
    // os dois se olham: se o peão está à esquerda do morador, o morador olha para a esquerda
    const px = parseFloat(peao().style.left)
    const mx = parseFloat(morador().style.left)
    const py = parseFloat(peao().style.top)
    const my = parseFloat(morador().style.top)
    if (Math.abs(px - mx) * 520 >= Math.abs(py - my) * 340) {
      expect(morador().dataset.olhar).toBe(px < mx ? 'esquerda' : 'direita')
      expect(peao().dataset.olhar).toBe(px < mx ? 'direita' : 'esquerda')
    }
  })
})
