// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { caso001 as caso } from '../game/caso.ts'
import { iniciarApp } from './app.ts'

let raiz: HTMLElement

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

function visitar(id: string): void {
  clicar('visitar', id)
  clicar('voltar-mapa')
}

function acusarCom(suspeito: string, provas: [string, string]): void {
  clicar('ir-acusacao')
  marcar('acusado', suspeito)
  marcar('prova', provas[0])
  marcar('prova', provas[1])
  clicar('emitir-auto')
}

beforeEach(() => {
  document.body.innerHTML = '<div id="app"></div>'
  raiz = document.querySelector<HTMLElement>('#app')!
  iniciarApp(raiz, caso, { animacoes: false, aleatorio: () => 0 })
})

describe('fluxo das 6 telas', () => {
  it('briefing → mapa → pista → caderno → acusação → resultado (caso resolvido)', () => {
    expect(titulo()).toBe('Rota Fantasma')
    expect(texto()).toContain('Hospital Municipal de Vila Aurora')

    clicar('comecar')
    expect(titulo()).toBe('Para onde investigar?')
    expect(texto()).toContain('3 dias restantes')

    clicar('visitar', 'operadora_cartao')
    expect(titulo()).toBe('Operadora de cartão')
    expect(texto()).toContain('Nova pista')
    expect(texto()).toContain('2 dias restantes')
    expect(raiz.querySelector('.pip.recem-gasto')).not.toBeNull()

    clicar('abrir-caderno')
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
    clicar('visitar', 'junta_comercial')
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
    acusarCom('ricardo', ['operadora_cartao', 'ex_funcionario'])
    expect(titulo()).toBe('Auto anulado')
    expect(texto()).toContain('Continua faltando para o hospital')
  })

  it('acusação injusta', () => {
    visitar('operadora_cartao')
    visitar('ex_funcionario')
    acusarCom('marta', ['operadora_cartao', 'ex_funcionario'])
    expect(titulo()).toBe('Acusação injusta')
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

  it('mostra os 6 locais como casas do tabuleiro, o hospital e o peão na partida', () => {
    expect(raiz.querySelectorAll('button.casa')).toHaveLength(6)
    expect(raiz.querySelector('.casa-centro')?.textContent).toContain('Hospital Municipal')
    expect(raiz.querySelector('.casa.partida')).not.toBeNull()
    expect(raiz.querySelector('.peao .boneco')).not.toBeNull()
  })

  it('o peão fica no último local visitado', () => {
    const partida = raiz.querySelector<HTMLElement>('.peao')!.style.left
    visitar('cartorio_detran')
    const casa = raiz.querySelector<HTMLElement>('[data-id="cartorio_detran"]')!
    const peao = raiz.querySelector<HTMLElement>('.peao')!
    expect(peao.style.left).not.toBe(partida)
    expect(peao.style.left).toBe(casa.style.left)
    expect(peao.style.top).toBe(casa.style.top)
  })

  it('a testemunha do local aparece com o balão da pista', () => {
    clicar('visitar', 'ex_funcionario')
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

  it('anda até o local e só depois mostra a pista', () => {
    vi.useFakeTimers()
    document.body.innerHTML = '<div id="app2"></div>'
    raiz = document.querySelector<HTMLElement>('#app2')!
    iniciarApp(raiz, caso, { animacoes: true })
    clicar('comecar')

    clicar('visitar', 'praca')
    expect(titulo()).toBe('Para onde investigar?') // ainda andando
    expect(raiz.querySelector('.peao.em-movimento')).not.toBeNull()

    // cliques durante o passeio são ignorados
    raiz.querySelector<HTMLButtonElement>('[data-id="junta_comercial"]')!.click()

    vi.advanceTimersByTime(1000)
    expect(titulo()).toBe('Consumidores na praça')
    expect(texto()).toContain('2 dias restantes')
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
    acusarCom('ricardo', ['operadora_cartao', 'ex_funcionario'])
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
    clicar('visitar', 'cartorio_detran')
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
    iniciarApp(raiz, caso, { animacoes: false, aleatorio: () => 0.99 })
    clicar('comecar')
    clicar('visitar', 'ex_funcionario')
    const balao = raiz.querySelector('.balao .pista')?.textContent ?? ''
    expect(balao).toContain('A chefia dizia que registrar sai caro')
    expect(texto()).toContain('Funcionários sem carteira')
  })
})
