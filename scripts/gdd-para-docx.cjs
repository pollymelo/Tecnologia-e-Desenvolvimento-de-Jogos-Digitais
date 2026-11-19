// Converte docs/GDD.md em DOCX (A4) para a entrega da NP2.
// Uso: npm run gdd   (gera docs/GDD-Rota-Fantasma.docx a partir de docs/GDD.md)
const fs = require('fs')
const path = require('path')
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, ShadingType,
  BorderStyle, AlignmentType, ImageRun, ExternalHyperlink, LevelFormat, Footer, PageNumber, PageBreak,
} = require('docx')

const [, , projeto, saida] = process.argv
const md = fs.readFileSync(path.join(projeto, 'docs/GDD.md'), 'utf8').replace(/\r\n/g, '\n')
const REPO = 'https://github.com/pollymelo/Tecnologia-e-Desenvolvimento-de-Jogos-Digitais/blob/main/'

const FONTE = 'Arial'
const LARGURA_UTIL = 11906 - 1701 - 1134 // A4 menos margens esquerda (3 cm) e direita (2 cm), em DXA
const AZUL = '1F3A5F'

// ---------- texto com formatação (negrito, itálico, código, links) ----------

function linkAbsoluto(href) {
  if (/^https?:/.test(href)) return href
  const limpo = href.replace(/^\.\//, '').split('#')[0]
  return REPO + (limpo.startsWith('docs/') || limpo.startsWith('src/') ? limpo : 'docs/' + limpo)
}

/** Converte uma linha de Markdown em runs do docx. */
function runs(texto, base = {}) {
  const saidaRuns = []
  // tokens: **negrito**, *itálico*, `código`, [texto](url), <url>
  const re = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\)|<(https?:[^>]+)>)/g
  let ultimo = 0
  let m
  while ((m = re.exec(texto))) {
    if (m.index > ultimo) saidaRuns.push(new TextRun({ text: texto.slice(ultimo, m.index), ...base }))
    if (m[2] !== undefined) saidaRuns.push(...runs(m[2], { ...base, bold: true }))
    else if (m[3] !== undefined) saidaRuns.push(new TextRun({ text: m[3], ...base, italics: true }))
    else if (m[4] !== undefined) saidaRuns.push(new TextRun({ text: m[4], ...base, font: 'Consolas', size: (base.size ?? 22) - 2, color: '7A2E2E' }))
    else if (m[5] !== undefined || m[7] !== undefined) {
      const rotulo = m[5] ?? m[7]
      const href = linkAbsoluto(m[6] ?? m[7])
      saidaRuns.push(new ExternalHyperlink({ link: href, children: [new TextRun({ text: rotulo, ...base, color: '0563C1', underline: {} })] }))
    }
    ultimo = re.lastIndex
  }
  if (ultimo < texto.length) saidaRuns.push(new TextRun({ text: texto.slice(ultimo), ...base }))
  return saidaRuns
}

// ---------- imagens ----------

function tamanhoPng(arquivo) {
  const b = fs.readFileSync(arquivo)
  return { largura: b.readUInt32BE(16), altura: b.readUInt32BE(20) }
}

function imagem(rel) {
  const arquivo = path.join(projeto, 'docs', rel)
  const { largura, altura } = tamanhoPng(arquivo)
  const w = 470 // px a 96 dpi (cerca de 12,4 cm)
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new ImageRun({ type: 'png', data: fs.readFileSync(arquivo), transformation: { width: w, height: Math.round((w * altura) / largura) } })],
  })
}

// ---------- tabelas ----------

const borda = { style: BorderStyle.SINGLE, size: 4, color: 'B7C3D0' }
const bordas = { top: borda, bottom: borda, left: borda, right: borda }

function celulas(linha) {
  return linha.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim())
}

function tabela(linhas) {
  const cab = celulas(linhas[0])
  const corpo = linhas.slice(2).map(celulas)
  const n = cab.length
  // larguras proporcionais ao texto (com mínimo), somando a largura útil
  const pesos = Array.from({ length: n }, (_, j) => {
    const maior = Math.max(cab[j].length, ...corpo.map((l) => (l[j] ?? '').replace(/\*\*|`/g, '').length))
    return Math.max(8, Math.min(maior, 90))
  })
  const soma = pesos.reduce((a, b) => a + b, 0)
  const larguras = pesos.map((p) => Math.floor((p / soma) * LARGURA_UTIL))
  larguras[n - 1] += LARGURA_UTIL - larguras.reduce((a, b) => a + b, 0)

  const celula = (texto, j, cabecalho) =>
    new TableCell({
      width: { size: larguras[j], type: WidthType.DXA },
      borders: bordas,
      margins: { top: 60, bottom: 60, left: 100, right: 100 },
      shading: cabecalho ? { fill: 'DCE6F2', type: ShadingType.CLEAR, color: 'auto' } : undefined,
      children: [new Paragraph({ children: runs(texto, { size: 19, bold: cabecalho || undefined }) })],
    })

  return new Table({
    width: { size: LARGURA_UTIL, type: WidthType.DXA },
    columnWidths: larguras,
    rows: [
      new TableRow({ tableHeader: true, children: cab.map((t, j) => celula(t, j, true)) }),
      ...corpo.map((l) => new TableRow({ children: Array.from({ length: n }, (_, j) => celula(l[j] ?? '', j, false)) })),
    ],
  })
}

// ---------- blocos ----------

const filhos = []
const espaco = () => new Paragraph({ spacing: { after: 60 }, children: [] })
const linhas = md.split('\n')
let i = 0
let primeiroTitulo = true
/** Cada lista numerada recomeça do 1: uma instância de numeração por lista. */
let instanciaLista = 0
let emLista = false
const ITEM = /^(\s*)([-*]|\d+\.) (.*)$/

while (i < linhas.length) {
  const l = linhas[i]

  if (l.trim() === '') {
    i++
    continue
  }
  if (!ITEM.test(l)) emLista = false

  // bloco de código
  if (l.startsWith('```')) {
    const bloco = []
    i++
    while (i < linhas.length && !linhas[i].startsWith('```')) bloco.push(linhas[i++])
    i++
    for (const [k, b] of bloco.entries()) {
      filhos.push(
        new Paragraph({
          shading: { fill: 'F2F4F7', type: ShadingType.CLEAR, color: 'auto' },
          spacing: { before: k === 0 ? 120 : 0, after: k === bloco.length - 1 ? 160 : 0 },
          children: [new TextRun({ text: b || ' ', font: 'Consolas', size: 16 })],
        }),
      )
    }
    continue
  }

  // títulos
  const t = /^(#{1,3}) (.*)$/.exec(l)
  if (t) {
    const nivel = t[1].length
    if (nivel === 1 && primeiroTitulo) {
      primeiroTitulo = false
      filhos.push(new Paragraph({ heading: HeadingLevel.TITLE, children: runs(t[2]) }))
    } else {
      // seções principais a partir da ficha começam em página nova
      const novaPagina = nivel === 2 && /^(19\.|Apêndice A)/.test(t[2])
      if (novaPagina) filhos.push(new Paragraph({ children: [new PageBreak()] }))
      filhos.push(new Paragraph({ heading: nivel === 2 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2, children: runs(t[2]) }))
    }
    i++
    continue
  }

  // tabela
  if (l.trim().startsWith('|') && linhas[i + 1]?.trim().startsWith('|') && /^\|?[\s:|-]+\|?$/.test(linhas[i + 1].trim())) {
    const bloco = []
    while (i < linhas.length && linhas[i].trim().startsWith('|')) bloco.push(linhas[i++])
    // tabela de capturas de tela: vira legenda + imagem
    if (bloco.slice(2).some((r) => /!\[[^\]]*\]\(([^)]+)\)/.test(r))) {
      for (const r of bloco.slice(2)) {
        const [legenda, cel] = celulas(r)
        const img = /!\[[^\]]*\]\(([^)]+)\)/.exec(cel)
        filhos.push(new Paragraph({ keepNext: true, spacing: { before: 160, after: 80 }, children: runs(legenda, { bold: true }) }))
        if (img) filhos.push(imagem(img[1]))
      }
    } else {
      filhos.push(tabela(bloco))
      filhos.push(espaco())
    }
    continue
  }

  // citação (bloco >)
  if (l.startsWith('>')) {
    const bloco = []
    while (i < linhas.length && linhas[i].startsWith('>')) bloco.push(linhas[i++].replace(/^>\s?/, ''))
    filhos.push(
      new Paragraph({
        indent: { left: 360 },
        border: { left: { style: BorderStyle.SINGLE, size: 18, color: 'E8B04B', space: 8 } },
        spacing: { after: 160 },
        children: runs(bloco.join(' '), { italics: true, color: '44546A' }),
      }),
    )
    continue
  }

  // listas (marcadores e numeradas, com um nível de recuo)
  const item = /^(\s*)([-*]|\d+\.) (.*)$/.exec(l)
  if (item) {
    const recuo = Math.min(1, Math.floor(item[1].length / 2))
    const numerada = /\d+\./.test(item[2])
    if (!emLista) instanciaLista++
    emLista = true
    let texto = item[3]
    i++
    // continuação do item (linhas recuadas que não são novo item)
    while (i < linhas.length && /^\s{2,}\S/.test(linhas[i]) && !/^\s*([-*]|\d+\.) /.test(linhas[i])) texto += ' ' + linhas[i++].trim()
    filhos.push(
      new Paragraph({
        numbering: { reference: numerada ? 'numeros' : 'marcadores', level: recuo, instance: instanciaLista },
        spacing: { after: 60 },
        children: runs(texto),
      }),
    )
    continue
  }

  // parágrafo comum (junta linhas seguidas)
  let texto = l
  i++
  while (i < linhas.length && linhas[i].trim() !== '' && !/^(#|>|\||```|\s*([-*]|\d+\.) )/.test(linhas[i])) texto += ' ' + linhas[i++].trim()
  filhos.push(new Paragraph({ spacing: { after: 140 }, children: runs(texto) }))
}

// ---------- documento ----------

const titulo = (size, before, after, color = AZUL) => ({
  run: { font: FONTE, size, bold: true, color },
  paragraph: { spacing: { before, after }, keepNext: true, keepLines: true },
})

const doc = new Document({
  creator: 'Rota Fantasma',
  title: 'GDD: Rota Fantasma',
  styles: {
    default: { document: { run: { font: FONTE, size: 22 }, paragraph: { spacing: { line: 276 } } } },
    paragraphStyles: [
      { id: 'Title', name: 'Title', basedOn: 'Normal', run: { font: FONTE, size: 44, bold: true, color: AZUL }, paragraph: { spacing: { before: 0, after: 200 }, keepNext: true } },
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, ...titulo(30, 360, 140), paragraph: { spacing: { before: 360, after: 140 }, keepNext: true, keepLines: true, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, ...titulo(25, 240, 100, '2F5496'), paragraph: { spacing: { before: 240, after: 100 }, keepNext: true, keepLines: true, outlineLevel: 1 } },
    ],
  },
  numbering: {
    config: [
      {
        reference: 'marcadores',
        levels: [
          { level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } },
          { level: 1, format: LevelFormat.BULLET, text: '◦', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1080, hanging: 270 } } } },
        ],
      },
      {
        reference: 'numeros',
        levels: [
          { level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 300 } } } },
          { level: 1, format: LevelFormat.DECIMAL, text: '%2.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1080, hanging: 300 } } } },
        ],
      },
    ],
  },
  sections: [
    {
      properties: {
        page: { size: { width: 11906, height: 16838 }, margin: { top: 1701, bottom: 1134, left: 1701, right: 1134 } },
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({ text: 'GDD: Rota Fantasma · NP2 2026.2 · Página ', size: 16, color: '7F7F7F' }),
                new TextRun({ children: [PageNumber.CURRENT], size: 16, color: '7F7F7F' }),
              ],
            }),
          ],
        }),
      },
      children: filhos,
    },
  ],
})

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(saida, buf)
  console.log('gerado:', saida, `(${Math.round(buf.length / 1024)} KB, ${filhos.length} blocos)`)
})
