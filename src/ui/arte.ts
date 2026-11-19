// Arte do jogo em SVG: bonecos de blocos (personagens originais) e prédios do tabuleiro.
// Tudo é desenhado em código, sem imagens externas.

import type { Aparencia } from '../game/types.ts'
import { LARGURA_CALCADA, LARGURA_RUA, LOTES_LOCAIS, MAPA, RUAS, trechos, type Ponto } from './mapa.ts'

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
  // Banco: colunas e um cifrão no frontão
  banco: `
    <polygon points="6,20 40,6 74,20" fill="#5cc28a" stroke="${CONTORNO}" stroke-width="2"/>
    <text x="40" y="18" text-anchor="middle" font-size="10" font-weight="700" fill="${CONTORNO}">$</text>
    <rect x="10" y="20" width="60" height="42" fill="#e9f5ee" stroke="${CONTORNO}" stroke-width="2"/>
    <rect x="16" y="24" width="6" height="22" fill="#cfe8d9" stroke="${CONTORNO}"/><rect x="58" y="24" width="6" height="22" fill="#cfe8d9" stroke="${CONTORNO}"/>
    ${porta(34, 46)}`,
  // Concessionária: vitrine com um carro
  concessionaria: `
    <rect x="6" y="14" width="68" height="48" fill="#dbe4ee" stroke="${CONTORNO}" stroke-width="2"/>
    <rect x="6" y="8" width="68" height="8" fill="#3d5a80" stroke="${CONTORNO}" stroke-width="2"/>
    <rect x="10" y="20" width="22" height="22" fill="#bfe3ff" stroke="${CONTORNO}" stroke-width="1.5"/>
    <rect x="12" y="32" width="18" height="6" rx="2" fill="#e5675d" stroke="${CONTORNO}"/><rect x="15" y="28" width="11" height="5" rx="1" fill="#e5675d" stroke="${CONTORNO}"/>
    <rect x="48" y="20" width="22" height="22" fill="#bfe3ff" stroke="${CONTORNO}" stroke-width="1.5"/>
    ${porta(34, 46)}`,
  // Escritório de contabilidade: prédio com calculadora
  contabilidade: `
    <rect x="12" y="10" width="56" height="52" fill="#a3b18a" stroke="${CONTORNO}" stroke-width="2"/>
    <rect x="18" y="16" width="20" height="24" rx="2" fill="#f5f1e6" stroke="${CONTORNO}" stroke-width="1.5"/>
    <rect x="21" y="19" width="14" height="5" fill="#5cc28a"/>
    <rect x="21" y="27" width="4" height="4" fill="${CONTORNO}"/><rect x="27" y="27" width="4" height="4" fill="${CONTORNO}"/><rect x="21" y="33" width="4" height="4" fill="${CONTORNO}"/><rect x="27" y="33" width="4" height="4" fill="${CONTORNO}"/>
    ${janelas(46, 18, 1, 2)}
    ${porta(34, 46)}`,
  // Secretaria da Fazenda: prédio público com bandeira
  fazenda: `
    <rect x="10" y="16" width="60" height="46" fill="#f5f1e6" stroke="${CONTORNO}" stroke-width="2"/>
    <rect x="6" y="12" width="68" height="6" fill="#3d5a80" stroke="${CONTORNO}" stroke-width="2"/>
    <rect x="38" y="0" width="2" height="12" fill="${CONTORNO}"/><rect x="40" y="0" width="12" height="7" fill="#5cc28a" stroke="${CONTORNO}"/>
    ${janelas(16, 22, 2, 2)}${janelas(50, 22, 2, 2)}
    ${porta(34, 46)}`,
  // Transportadora: galpão com caminhão
  transportadora: `
    <polygon points="4,24 40,10 76,24" fill="#8a8f98" stroke="${CONTORNO}" stroke-width="2"/>
    <rect x="8" y="24" width="64" height="38" fill="#c9ced6" stroke="${CONTORNO}" stroke-width="2"/>
    <rect x="46" y="38" width="26" height="16" fill="#f4d35e" stroke="${CONTORNO}" stroke-width="2"/><rect x="64" y="42" width="8" height="8" fill="#bfe3ff" stroke="${CONTORNO}"/>
    <rect x="48" y="54" width="6" height="6" rx="3" fill="${CONTORNO}"/><rect x="64" y="54" width="6" height="6" rx="3" fill="${CONTORNO}"/>
    ${porta(34, 46)}`,
  // Terreno baldio: cerca, mato e uma caixa de correio
  terreno: `
    <rect x="4" y="50" width="72" height="12" fill="#b08d57" stroke="${CONTORNO}" stroke-width="2"/>
    <rect x="6" y="36" width="68" height="3" fill="#8a5a44"/>
    ${[8, 20, 32, 46, 58, 70].map((x) => `<rect x="${x - 2}" y="30" width="4" height="22" fill="#8a5a44" stroke="${CONTORNO}"/>`).join('')}
    <rect x="12" y="44" width="10" height="8" fill="#3e8e41"/><rect x="52" y="42" width="12" height="10" fill="#3e8e41"/>
    <rect x="36" y="22" width="12" height="9" fill="#8a8f98" stroke="${CONTORNO}" stroke-width="1.5"/><rect x="41" y="31" width="2" height="20" fill="${CONTORNO}"/>`,
  // Creche municipal com obra parada (andaime)
  creche: `
    <rect x="10" y="20" width="60" height="42" fill="#f9c74f" stroke="${CONTORNO}" stroke-width="2"/>
    <polygon points="6,22 40,6 74,22" fill="#f3722c" stroke="${CONTORNO}" stroke-width="2"/>
    ${janelas(16, 28, 1, 1)}${janelas(57, 28, 1, 1)}
    <rect x="54" y="6" width="2" height="56" fill="#8a8f98"/><rect x="72" y="6" width="2" height="56" fill="#8a8f98"/><rect x="54" y="20" width="20" height="2" fill="#8a8f98"/><rect x="54" y="36" width="20" height="2" fill="#8a8f98"/>
    ${porta(34, 46, '#9ad1f5')}`,
  // Prefeitura: prédio com torre e relógio
  prefeitura: `
    <rect x="8" y="22" width="64" height="40" fill="#e9e4d4" stroke="${CONTORNO}" stroke-width="2"/>
    <rect x="30" y="4" width="20" height="20" fill="#d8d2bf" stroke="${CONTORNO}" stroke-width="2"/>
    <circle cx="40" cy="14" r="6" fill="#fff" stroke="${CONTORNO}" stroke-width="1.5"/><path d="M40 10 V14 H43" stroke="${CONTORNO}" stroke-width="1.5" fill="none"/>
    ${janelas(14, 28, 1, 2)}${janelas(59, 28, 1, 2)}
    ${porta(34, 46)}`,
  // Fiscal de obras: casa em construção com placa
  obras: `
    <rect x="14" y="26" width="44" height="36" fill="#d8b98a" stroke="${CONTORNO}" stroke-width="2"/>
    <rect x="14" y="14" width="44" height="12" fill="none" stroke="#8a8f98" stroke-width="2" stroke-dasharray="4 3"/>
    <rect x="60" y="30" width="16" height="12" fill="#f4d35e" stroke="${CONTORNO}" stroke-width="1.5"/><rect x="67" y="42" width="2" height="20" fill="${CONTORNO}"/>
    <polygon points="64,40 68,32 72,40" fill="${CONTORNO}"/>
    ${porta(34, 46)}`,
  // Lan house: loja com monitor na vitrine
  lanhouse: `
    <rect x="10" y="12" width="60" height="50" fill="#7b4bb7" stroke="${CONTORNO}" stroke-width="2"/>
    <rect x="16" y="18" width="22" height="16" rx="1" fill="#1b2430" stroke="${CONTORNO}" stroke-width="1.5"/><rect x="19" y="21" width="16" height="10" fill="#5cc28a"/>
    <rect x="24" y="34" width="6" height="4" fill="${CONTORNO}"/>
    <rect x="44" y="18" width="20" height="10" rx="2" fill="#f4d35e" stroke="${CONTORNO}"/>
    ${porta(34, 46)}`,
  // Companhia de energia: prédio com raio
  energia: `
    <rect x="12" y="12" width="56" height="50" fill="#f4d35e" stroke="${CONTORNO}" stroke-width="2"/>
    <polygon points="44,16 30,36 39,36 34,46 50,26 41,26" fill="#e5675d" stroke="${CONTORNO}" stroke-width="1.5"/>
    ${porta(34, 46)}`,
  // Praça apagada: poste sem luz e brinquedo quebrado
  praca_apagada: `
    <rect x="4" y="52" width="72" height="10" rx="2" fill="#6b8f5e" stroke="${CONTORNO}" stroke-width="2"/>
    <rect x="18" y="10" width="4" height="44" fill="#4a4f57" stroke="${CONTORNO}"/><rect x="12" y="8" width="16" height="6" fill="#4a4f57" stroke="${CONTORNO}"/>
    <rect x="15" y="14" width="10" height="4" fill="#2b2f36"/>
    <rect x="44" y="30" width="2" height="24" fill="#8a5a44"/><rect x="66" y="30" width="2" height="24" fill="#8a5a44"/><rect x="42" y="28" width="28" height="4" fill="#8a5a44" stroke="${CONTORNO}"/>
    <rect x="52" y="32" width="1.5" height="12" fill="${CONTORNO}"/><rect x="50" y="44" width="8" height="3" fill="#c0392b"/>`,
  // Escola: prédio com sino e bandeira
  escola: `
    <rect x="8" y="20" width="64" height="42" fill="#e5675d" stroke="${CONTORNO}" stroke-width="2"/>
    <polygon points="28,20 40,8 52,20" fill="#f5f1e6" stroke="${CONTORNO}" stroke-width="2"/><circle cx="40" cy="15" r="3" fill="#f4d35e" stroke="${CONTORNO}"/>
    ${janelas(14, 26, 2, 1)}${janelas(50, 26, 2, 1)}
    <rect x="14" y="38" width="18" height="6" fill="#f5f1e6" stroke="${CONTORNO}"/><rect x="50" y="38" width="18" height="6" fill="#f5f1e6" stroke="${CONTORNO}"/>
    ${porta(34, 46)}`,
  // Biblioteca: prédio com livros na fachada
  biblioteca: `
    <rect x="8" y="16" width="64" height="46" fill="#8e6c8a" stroke="${CONTORNO}" stroke-width="2"/>
    <rect x="4" y="10" width="72" height="8" fill="#6b4f6b" stroke="${CONTORNO}" stroke-width="2"/>
    <rect x="14" y="22" width="6" height="18" fill="#e5675d" stroke="${CONTORNO}"/><rect x="21" y="24" width="6" height="16" fill="#5cc28a" stroke="${CONTORNO}"/><rect x="28" y="22" width="6" height="18" fill="#f4d35e" stroke="${CONTORNO}"/>
    <rect x="48" y="22" width="18" height="18" fill="#bfe3ff" stroke="${CONTORNO}" stroke-width="1.5"/>
    ${porta(34, 46)}`,
  // Atacado: galpão grande com caixas
  atacado: `
    <rect x="6" y="18" width="68" height="44" fill="#4a90d9" stroke="${CONTORNO}" stroke-width="2"/>
    <rect x="6" y="12" width="68" height="8" fill="#2c5aa0" stroke="${CONTORNO}" stroke-width="2"/>
    <rect x="50" y="42" width="10" height="10" fill="#d8b98a" stroke="${CONTORNO}"/><rect x="60" y="42" width="10" height="10" fill="#d8b98a" stroke="${CONTORNO}"/><rect x="55" y="32" width="10" height="10" fill="#d8b98a" stroke="${CONTORNO}"/>
    ${porta(34, 46)}`,
  // Rádio: prédio com antena
  radio: `
    <rect x="14" y="26" width="52" height="36" fill="#f3722c" stroke="${CONTORNO}" stroke-width="2"/>
    <rect x="52" y="0" width="3" height="26" fill="#4a4f57"/><circle cx="53.5" cy="4" r="3" fill="#e5675d" stroke="${CONTORNO}"/>
    <rect x="20" y="32" width="20" height="10" rx="2" fill="#1b2430"/><circle cx="25" cy="37" r="3" fill="#f4d35e"/>
    ${porta(34, 46)}`,
  // Depósito: porta de enrolar
  deposito: `
    <rect x="10" y="16" width="60" height="46" fill="#8a8f98" stroke="${CONTORNO}" stroke-width="2"/>
    <rect x="50" y="24" width="18" height="38" fill="#c9ced6" stroke="${CONTORNO}" stroke-width="2"/>
    ${[28, 34, 40, 46, 52].map((y) => `<rect x="50" y="${y}" width="18" height="1.5" fill="#8a8f98"/>`).join('')}
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

// ---------- Tabuleiro (mapa de Vila Aurora) ----------

const n1 = (v: number) => v.toFixed(1)

/**
 * Fundo do mapa: grama, ruas com calçada e faixa, calçadas até as portas, árvores e,
 * nos lotes que o caso não usa, uma pracinha.
 */
export function fundoTabuleiro(quantidadeLocais: number): string {
  const { largura, altura } = MAPA
  const ruas = trechos().filter((t) => t.largura === LARGURA_RUA)
  const calcadas = trechos().filter((t) => t.largura === LARGURA_CALCADA)

  const ret = (t: { de: Ponto; para: Ponto }, meia: number, cor: string, pontas = meia) => {
    const x0 = Math.min(t.de.x, t.para.x) - (t.de.y === t.para.y ? pontas : meia)
    const x1 = Math.max(t.de.x, t.para.x) + (t.de.y === t.para.y ? pontas : meia)
    const y0 = Math.min(t.de.y, t.para.y) - (t.de.x === t.para.x ? pontas : meia)
    const y1 = Math.max(t.de.y, t.para.y) + (t.de.x === t.para.x ? pontas : meia)
    return `<rect x="${n1(x0)}" y="${n1(y0)}" width="${n1(x1 - x0)}" height="${n1(y1 - y0)}" fill="${cor}"/>`
  }

  const meio = LARGURA_RUA / 2
  const meioFio = ruas.map((t) => ret(t, meio + 3, '#d9d4c7')).join('')
  const asfalto = ruas.map((t) => ret(t, meio, '#7d838d')).join('')
  const faixas = ruas
    .map(
      (t) =>
        `<line x1="${t.de.x}" y1="${t.de.y}" x2="${t.para.x}" y2="${t.para.y}" stroke="#f7f4ec" stroke-width="1.6" stroke-dasharray="7 7"/>`,
    )
    .join('')
  const caminhos = calcadas
    .map((t) => {
      const x = t.de.x
      const topo = Math.min(t.de.y, t.para.y)
      const base = Math.max(t.de.y, t.para.y) - meio
      return `<rect x="${n1(x - LARGURA_CALCADA / 2)}" y="${n1(topo)}" width="${LARGURA_CALCADA}" height="${n1(base - topo)}" fill="#e9e2cf" stroke="#c9bfa6" stroke-width="1"/>`
    })
    .join('')

  // faixas de pedestre nas esquinas da rua do meio
  const zebra = (x: number, y: number) =>
    Array.from({ length: 4 }, (_, i) => `<rect x="${n1(x - 9 + i * 5)}" y="${n1(y - 4)}" width="3" height="8" fill="#f7f4ec"/>`).join('')
  const zebras = RUAS.verticais
    .slice(1, -1)
    .flatMap((x) => RUAS.horizontais.slice(1).map((y) => zebra(x, y - meio - 6)))
    .join('')

  const arvore = (x: number, y: number) =>
    `<rect x="${x - 2}" y="${y}" width="4" height="7" fill="#8a5a44"/><rect x="${x - 7}" y="${y - 11}" width="14" height="13" rx="3" fill="#3e8e41" stroke="${CONTORNO}" stroke-width="1"/>`
  // árvores na faixa de grama do alto, entre os prédios (nunca em cima da rua)
  const arvores = RUAS.verticais
    .map((x) => arvore(x, 34))
    .join('')

  // lotes vagos viram pracinha (árvores, banco e chafariz)
  const pracinhas = LOTES_LOCAIS.slice(quantidadeLocais)
    .map(({ porta: { x, y } }) => {
      const topo = y - 70
      return `
      <rect x="${x - 40}" y="${topo}" width="80" height="66" rx="10" fill="#86c96a" stroke="#6fb556" stroke-width="2"/>
      ${arvore(x - 24, topo + 22)}${arvore(x + 24, topo + 22)}${arvore(x - 24, topo + 50)}
      <circle cx="${x + 10}" cy="${topo + 44}" r="11" fill="#9ad1f5" stroke="${CONTORNO}" stroke-width="1.5"/>
      <rect x="${x + 7}" y="${topo + 36}" width="6" height="10" fill="#f7f4ec" stroke="${CONTORNO}" stroke-width="1"/>
      <rect x="${x - 12}" y="${topo + 56}" width="20" height="4" fill="#8a5a44"/>`
    })
    .join('')

  return `
  <svg class="tabuleiro-fundo" viewBox="0 0 ${largura} ${altura}" aria-hidden="true">
    <rect width="${largura}" height="${altura}" rx="18" fill="#9bd77f"/>
    ${meioFio}${asfalto}${faixas}${zebras}${caminhos}${arvores}${pracinhas}
  </svg>`
}

// ---------- Céu (dia e noite) ----------

/** Camada do céu noturno com lua e estrelas, que aparece quando um dia passa. */
export function ceuNoturno(): string {
  const estrelas = [
    [40, 30], [110, 60], [190, 22], [270, 48], [340, 18], [420, 70], [490, 110], [60, 130], [380, 140], [150, 280], [330, 270], [20, 200], [470, 250],
  ]
    .map(([x, y], i) => `<rect class="estrela-ceu" style="animation-delay:${(i % 4) * 0.15}s" x="${x}" y="${y}" width="4" height="4" fill="#fff6c9"/>`)
    .join('')
  return `
  <svg class="ceu-desenho" viewBox="0 0 ${MAPA.largura} ${MAPA.altura}" aria-hidden="true">
    ${estrelas}
    <rect x="${MAPA.largura - 70}" y="16" width="34" height="34" rx="10" fill="#fff6c9" stroke="${CONTORNO}" stroke-width="2"/>
    <rect x="${MAPA.largura - 63}" y="24" width="7" height="7" rx="2" fill="#e8dca0"/>
    <rect x="${MAPA.largura - 50}" y="35" width="6" height="6" rx="2" fill="#e8dca0"/>
  </svg>`
}
