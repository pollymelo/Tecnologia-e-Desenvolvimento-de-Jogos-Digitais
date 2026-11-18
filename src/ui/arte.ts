// Arte do jogo em SVG: bonecos de blocos (personagens originais) e prédios do tabuleiro.
// Tudo é desenhado em código, sem imagens externas.

import type { Aparencia } from '../game/types.ts'

const CONTORNO = '#1b2430'

/** Aceita só cores hexadecimais (o JSON pode ser editado por terceiros). */
function cor(valor: string | undefined, padrao: string): string {
  return valor && /^#[0-9a-f]{3,8}$/i.test(valor) ? valor : padrao
}

/** Personagem da pessoa que joga. */
export const AUDITOR: Aparencia = {
  pele: '#c68642',
  cabelo: '#1f1a17',
  estiloCabelo: 'curto',
  camisa: '#2f4b7c',
  calca: '#3a3a3a',
  acessorios: ['cracha'],
}

/** Dona Helena, chefe da Auditoria Fiscal de Vila Aurora (ver docs/lore.md). Dá as dicas do tutorial. */
export const DONA_HELENA: Aparencia = {
  pele: '#8d5524',
  cabelo: '#d6d6d6',
  estiloCabelo: 'coque',
  camisa: '#6b2d5c',
  calca: '#2b2b2b',
  acessorios: ['oculos', 'cracha'],
}

export type Expressao = 'feliz' | 'neutro' | 'triste'

export function boneco(
  aparencia: Aparencia = {},
  opcoes: { expressao?: Expressao; classe?: string; rotulo?: string } = {},
): string {
  const pele = cor(aparencia.pele, '#e0ac69')
  const cabelo = cor(aparencia.cabelo, '#3b2a20')
  const camisa = cor(aparencia.camisa, '#4a7bd0')
  const calca = cor(aparencia.calca, '#2c3e50')
  const acessorios = aparencia.acessorios ?? []
  const expressao = opcoes.expressao ?? 'neutro'
  const tem = (a: string) => (acessorios as string[]).includes(a)
  const s = `stroke="${CONTORNO}" stroke-width="1.5"`

  const cabelos: Record<string, string> = {
    curto: `<rect x="15" y="3" width="30" height="8" rx="2" fill="${cabelo}" ${s}/>
            <rect x="15" y="9" width="4" height="8" fill="${cabelo}"/>
            <rect x="41" y="9" width="4" height="8" fill="${cabelo}"/>`,
    longo: `<rect x="12" y="6" width="6" height="30" rx="2" fill="${cabelo}" ${s}/>
            <rect x="42" y="6" width="6" height="30" rx="2" fill="${cabelo}" ${s}/>
            <rect x="14" y="2" width="32" height="9" rx="3" fill="${cabelo}" ${s}/>`,
    coque: `<rect x="24" y="0" width="12" height="6" rx="2" fill="${cabelo}" ${s}/>
            <rect x="15" y="4" width="30" height="7" rx="2" fill="${cabelo}" ${s}/>
            <rect x="15" y="9" width="4" height="7" fill="${cabelo}"/>
            <rect x="41" y="9" width="4" height="7" fill="${cabelo}"/>`,
    careca: `<rect x="13" y="11" width="4" height="10" fill="${cabelo}" ${s}/>
             <rect x="43" y="11" width="4" height="10" fill="${cabelo}" ${s}/>`,
    bone: `<rect x="14" y="2" width="32" height="9" rx="3" fill="${cabelo}" ${s}/>
           <rect x="30" y="8" width="20" height="4" rx="1" fill="${cabelo}" ${s}/>`,
  }

  const bocas: Record<Expressao, string> = {
    feliz: `<path d="M23 23 Q30 30 37 23" fill="none" stroke="${CONTORNO}" stroke-width="2" stroke-linecap="round"/>`,
    neutro: `<path d="M24 25 H36" stroke="${CONTORNO}" stroke-width="2" stroke-linecap="round"/>`,
    triste: `<path d="M23 28 Q30 22 37 28" fill="none" stroke="${CONTORNO}" stroke-width="2" stroke-linecap="round"/>`,
  }

  const rotulo = opcoes.rotulo
    ? `role="img" aria-label="${opcoes.rotulo.replaceAll('"', '&quot;')}"`
    : 'aria-hidden="true"'

  return `
  <svg class="boneco ${opcoes.classe ?? ''}" viewBox="0 -8 60 108" ${rotulo}>
    <!-- pernas e sapatos (grupos animados na caminhada) -->
    <g class="perna perna-e">
      <rect x="17" y="64" width="12" height="28" fill="${calca}" ${s}/>
      <rect x="16" y="90" width="14" height="7" rx="1" fill="#2b2b2b" ${s}/>
    </g>
    <g class="perna perna-d">
      <rect x="31" y="64" width="12" height="28" fill="${calca}" ${s}/>
      <rect x="30" y="90" width="14" height="7" rx="1" fill="#2b2b2b" ${s}/>
    </g>
    <!-- braços e mãos -->
    <g class="braco braco-e">
      <rect x="3" y="35" width="10" height="23" rx="2" fill="${camisa}" ${s}/>
      <rect x="4" y="57" width="8" height="8" rx="2" fill="${pele}" ${s}/>
    </g>
    <g class="braco braco-d">
      <rect x="47" y="35" width="10" height="23" rx="2" fill="${camisa}" ${s}/>
      <rect x="48" y="57" width="8" height="8" rx="2" fill="${pele}" ${s}/>
    </g>
    <!-- tronco -->
    <rect x="13" y="33" width="34" height="33" rx="2" fill="${camisa}" ${s}/>
    ${tem('avental') ? `<rect x="18" y="42" width="24" height="26" rx="1" fill="#f7f4ec" ${s}/>` : ''}
    ${tem('gravata') ? `<path d="M28 34 H32 L34 52 L30 57 L26 52 Z" fill="#c0392b" ${s}/>` : ''}
    ${tem('cracha') ? `<rect x="34" y="39" width="9" height="12" rx="1" fill="#fff" ${s}/><rect x="35.5" y="41" width="6" height="3" fill="#e8b04b"/>` : ''}
    <!-- cabeça -->
    <rect x="15" y="5" width="30" height="28" rx="4" fill="${pele}" ${s}/>
    ${cabelos[aparencia.estiloCabelo ?? 'curto'] ?? cabelos.curto}
    ${tem('chef') ? `<rect x="16" y="-6" width="28" height="12" rx="5" fill="#fff" ${s}/><rect x="17" y="3" width="26" height="5" fill="#fff" ${s}/>` : ''}
    <!-- rosto -->
    <rect x="22" y="15" width="4" height="5" rx="1" fill="${CONTORNO}"/>
    <rect x="34" y="15" width="4" height="5" rx="1" fill="${CONTORNO}"/>
    ${tem('oculos') ? `<rect x="19.5" y="13" width="9" height="9" rx="2" fill="none" ${s}/><rect x="31.5" y="13" width="9" height="9" rx="2" fill="none" ${s}/><path d="M28.5 16 H31.5" ${s}/>` : ''}
    ${bocas[expressao]}
  </svg>`
}

// ---------- Prédios ----------

const janelas = (x: number, y: number, colunas: number, linhas: number, corJanela = '#bfe3ff') =>
  Array.from({ length: colunas * linhas }, (_, i) => {
    const cx = x + (i % colunas) * 11
    const cy = y + Math.floor(i / colunas) * 11
    return `<rect class="janela-predio" x="${cx}" y="${cy}" width="7" height="7" fill="${corJanela}" stroke="${CONTORNO}" stroke-width="1"/>`
  }).join('')

const porta = (x: number, y: number, corPorta = '#6b4f2f') =>
  `<rect class="vao" x="${x}" y="${y}" width="12" height="16" fill="#1b2430"/><rect class="porta" x="${x}" y="${y}" width="12" height="16" fill="${corPorta}" stroke="${CONTORNO}" stroke-width="1.5"/>`

const PREDIOS: Record<string, string> = {
  // Operadora de cartão: prédio com um cartão gigante na fachada
  operadora: `
    <rect x="12" y="14" width="56" height="48" fill="#d64545" stroke="${CONTORNO}" stroke-width="2"/>
    <rect x="8" y="10" width="64" height="7" fill="#a83232" stroke="${CONTORNO}" stroke-width="2"/>
    <rect x="20" y="20" width="40" height="24" rx="3" fill="#f4d35e" stroke="${CONTORNO}" stroke-width="2"/>
    <rect x="20" y="25" width="40" height="5" fill="${CONTORNO}"/>
    <rect x="24" y="34" width="10" height="6" rx="1" fill="#e8b04b" stroke="${CONTORNO}"/>
    ${porta(34, 46)}`,
  // Cartório e Detran: prédio de colunas com um carro na frente
  cartorio: `
    <polygon points="6,18 40,4 74,18" fill="#e9e4d4" stroke="${CONTORNO}" stroke-width="2"/>
    <rect x="10" y="18" width="60" height="34" fill="#f5f1e6" stroke="${CONTORNO}" stroke-width="2"/>
    <rect x="16" y="22" width="6" height="28" fill="#d8d2bf" stroke="${CONTORNO}"/>
    <rect x="30" y="22" width="6" height="28" fill="#d8d2bf" stroke="${CONTORNO}"/>
    <rect x="44" y="22" width="6" height="28" fill="#d8d2bf" stroke="${CONTORNO}"/>
    <rect x="58" y="22" width="6" height="28" fill="#d8d2bf" stroke="${CONTORNO}"/>
    <rect x="40" y="48" width="34" height="10" rx="3" fill="#2a9d8f" stroke="${CONTORNO}" stroke-width="2"/>
    <rect x="46" y="42" width="20" height="8" rx="2" fill="#2a9d8f" stroke="${CONTORNO}" stroke-width="2"/>
    <rect x="49" y="44" width="6" height="5" fill="#bfe3ff"/><rect x="57" y="44" width="6" height="5" fill="#bfe3ff"/>
    <rect x="43" y="56" width="7" height="7" rx="3" fill="${CONTORNO}"/><rect x="64" y="56" width="7" height="7" rx="3" fill="${CONTORNO}"/>`,
  // Casa do ex-funcionário
  casa: `
    <polygon points="10,30 40,8 70,30" fill="#c0392b" stroke="${CONTORNO}" stroke-width="2"/>
    <rect x="16" y="30" width="48" height="32" fill="#f4d35e" stroke="${CONTORNO}" stroke-width="2"/>
    ${janelas(22, 36, 1, 1)}${janelas(49, 36, 1, 1)}
    ${porta(34, 46)}
    <rect x="52" y="10" width="7" height="12" fill="#8a5a44" stroke="${CONTORNO}" stroke-width="1.5"/>`,
  // Praça: árvore, banco e chafariz
  praca: `
    <rect x="4" y="52" width="72" height="10" rx="2" fill="#7bc96f" stroke="${CONTORNO}" stroke-width="2"/>
    <rect x="16" y="30" width="6" height="24" fill="#8a5a44" stroke="${CONTORNO}" stroke-width="1.5"/>
    <rect x="4" y="8" width="30" height="26" rx="4" fill="#3e8e41" stroke="${CONTORNO}" stroke-width="2"/>
    <rect x="40" y="44" width="28" height="5" fill="#8a5a44" stroke="${CONTORNO}" stroke-width="1.5"/>
    <rect x="42" y="49" width="4" height="6" fill="#5a3825"/><rect x="62" y="49" width="4" height="6" fill="#5a3825"/>
    <rect x="44" y="20" width="20" height="8" rx="2" fill="#9ad1f5" stroke="${CONTORNO}" stroke-width="1.5"/>
    <rect x="52" y="12" width="4" height="10" fill="#9ad1f5" stroke="${CONTORNO}" stroke-width="1"/>`,
  // Junta Comercial: escritório com carimbo
  junta: `
    <rect x="14" y="8" width="52" height="54" fill="#3d5a80" stroke="${CONTORNO}" stroke-width="2"/>
    ${janelas(20, 14, 4, 3)}
    ${porta(34, 46)}
    <rect x="54" y="38" width="18" height="10" rx="2" fill="#c0392b" stroke="${CONTORNO}" stroke-width="2"/>
    <rect x="60" y="30" width="6" height="9" fill="#8a5a44" stroke="${CONTORNO}" stroke-width="1.5"/>`,
  // Portal da Transparência: prédio com um telão de gráfico
  portal: `
    <rect x="10" y="10" width="60" height="52" fill="#2a9d8f" stroke="${CONTORNO}" stroke-width="2"/>
    <rect x="16" y="15" width="48" height="28" rx="2" fill="#1b2430" stroke="${CONTORNO}" stroke-width="2"/>
    <rect x="22" y="31" width="7" height="9" fill="#5cc28a"/><rect x="32" y="25" width="7" height="15" fill="#e8b04b"/>
    <rect x="42" y="20" width="7" height="20" fill="#5cc28a"/><rect x="52" y="28" width="7" height="12" fill="#e5675d"/>
    ${porta(34, 46)}`,
  // Hospital municipal (centro do tabuleiro)
  hospital: `
    <rect x="8" y="14" width="64" height="48" fill="#f7f4ec" stroke="${CONTORNO}" stroke-width="2"/>
    <rect x="4" y="10" width="72" height="7" fill="#d8d2bf" stroke="${CONTORNO}" stroke-width="2"/>
    <rect x="34" y="20" width="12" height="24" fill="#e5675d"/><rect x="28" y="26" width="24" height="12" fill="#e5675d"/>
    ${janelas(14, 22, 1, 2)}${janelas(59, 22, 1, 2)}
    ${porta(34, 46, '#9ad1f5')}`,
  // Base da auditoria (casa de partida)
  auditoria: `
    <rect x="14" y="16" width="52" height="46" fill="#e8b04b" stroke="${CONTORNO}" stroke-width="2"/>
    <rect x="10" y="10" width="60" height="8" fill="#b9862e" stroke="${CONTORNO}" stroke-width="2"/>
    <polygon points="40,22 43,30 52,30 45,35 48,43 40,38 32,43 35,35 28,30 37,30" fill="#fff" stroke="${CONTORNO}" stroke-width="1.5"/>
    ${porta(34, 46)}`,
  // Prédio genérico (casos novos sem ícone)
  generico: `
    <rect x="14" y="10" width="52" height="52" fill="#8a8f98" stroke="${CONTORNO}" stroke-width="2"/>
    ${janelas(20, 16, 4, 3)}
    ${porta(34, 46)}`,
}

export function predio(icone: string | undefined, classe = ''): string {
  const desenho = PREDIOS[icone ?? ''] ?? PREDIOS.generico
  return `<svg class="predio ${classe}" viewBox="0 0 80 66" aria-hidden="true">${desenho}</svg>`
}

// ---------- Tabuleiro ----------

export const TABULEIRO = { largura: 400, altura: 320, cx: 200, cy: 160, rx: 140, ry: 112 }

/** Ponto na estrada oval do tabuleiro (ângulo em graus; 90 = embaixo, no centro). */
export function pontoNaEstrada(anguloGraus: number): { x: number; y: number } {
  const a = (anguloGraus * Math.PI) / 180
  return { x: TABULEIRO.cx + TABULEIRO.rx * Math.cos(a), y: TABULEIRO.cy + TABULEIRO.ry * Math.sin(a) }
}

/**
 * Ângulos das casas: a partida fica embaixo, e os locais se distribuem no sentido horário.
 * Funciona para qualquer número de locais, então casos novos se ajustam sozinhos.
 */
export function angulosDasCasas(quantidadeLocais: number): { partida: number; locais: number[] } {
  const passo = 360 / (quantidadeLocais + 1)
  return {
    partida: 90,
    locais: Array.from({ length: quantidadeLocais }, (_, i) => 90 + passo * (i + 1)),
  }
}

/** Fundo do tabuleiro: grama, estrada oval, casinhas coloridas e árvores. */
export function fundoTabuleiro(quantidadeLocais: number): string {
  const { largura, altura, cx, cy, rx, ry } = TABULEIRO
  const cores = ['#f4d35e', '#5cc28a', '#4a90d9', '#e5675d']
  const passo = 360 / (quantidadeLocais + 1)

  // Casinhas da trilha entre um local e outro (estilo tabuleiro)
  const casinhas: string[] = []
  for (let i = 0; i <= quantidadeLocais; i++) {
    for (let k = 1; k <= 2; k++) {
      const { x, y } = pontoNaEstrada(90 + passo * i + (passo * k) / 3)
      const c = cores[(i * 2 + k) % cores.length]
      casinhas.push(
        `<rect x="${(x - 7).toFixed(1)}" y="${(y - 7).toFixed(1)}" width="14" height="14" rx="3" fill="${c}" stroke="${CONTORNO}" stroke-width="1.5"/>`,
      )
    }
  }

  const arvore = (x: number, y: number) =>
    `<rect x="${x - 2}" y="${y}" width="4" height="8" fill="#8a5a44"/><rect x="${x - 8}" y="${y - 12}" width="16" height="14" rx="3" fill="#3e8e41" stroke="${CONTORNO}" stroke-width="1"/>`

  return `
  <svg class="tabuleiro-fundo" viewBox="0 0 ${largura} ${altura}" aria-hidden="true">
    <rect width="${largura}" height="${altura}" rx="18" fill="#9bd77f"/>
    <rect x="6" y="6" width="${largura - 12}" height="${altura - 12}" rx="14" fill="none" stroke="#7bc96f" stroke-width="4" stroke-dasharray="2 10"/>
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="#8a8f98" stroke-width="30"/>
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="#f7f4ec" stroke-width="2" stroke-dasharray="8 8"/>
    ${casinhas.join('')}
    ${arvore(30, 30)}${arvore(372, 290)}${arvore(372, 34)}${arvore(28, 292)}${arvore(150, 120)}${arvore(258, 210)}
  </svg>`
}

// ---------- Céu (dia e noite) ----------

/** Camada do céu noturno com lua e estrelas, que aparece quando um dia passa. */
export function ceuNoturno(): string {
  const estrelas = [
    [40, 30], [90, 60], [150, 22], [210, 48], [262, 18], [330, 40], [372, 80], [60, 110], [300, 110], [120, 280], [280, 270], [20, 200],
  ]
    .map(([x, y], i) => `<rect class="estrela-ceu" style="animation-delay:${(i % 4) * 0.15}s" x="${x}" y="${y}" width="4" height="4" fill="#fff6c9"/>`)
    .join('')
  return `
  <svg class="ceu-desenho" viewBox="0 0 ${TABULEIRO.largura} ${TABULEIRO.altura}" aria-hidden="true">
    ${estrelas}
    <rect x="330" y="16" width="34" height="34" rx="10" fill="#fff6c9" stroke="${CONTORNO}" stroke-width="2"/>
    <rect x="337" y="24" width="7" height="7" rx="2" fill="#e8dca0"/>
    <rect x="350" y="35" width="6" height="6" rx="2" fill="#e8dca0"/>
  </svg>`
}
