// Gera docs/fichas-de-solucao.md a partir dos JSON dos casos.
// Uso: node scripts/gerar-fichas.mjs   (rode de novo sempre que editar um caso)
import { readFileSync, writeFileSync } from 'node:fs'

const ids = ['001', '002', '003', '004']
const casos = ids.map((n) => JSON.parse(readFileSync(new URL(`../src/data/caso-${n}.json`, import.meta.url), 'utf8')))

const nomeIndicio = (c, id) => c.indicios.find((i) => i.id === id)?.nome ?? id

/** Mesma regra de src/game/rules.ts (provasValidas), considerando a abordagem certa. */
function provasValidas(c, provas) {
  const culpado = c.suspeitos.find((s) => s.id === c.culpadoId)
  const indicios = provas.map((id) => c.locais.find((l) => l.id === id).indicio)
  if (!indicios.every((i) => i !== null && culpado.indicios.includes(i))) return false
  return c.suspeitos
    .filter((s) => s.id !== culpado.id)
    .every((outro) => indicios.some((i) => i !== null && !outro.indicios.includes(i)))
}

const partes = [
  `# Fichas de solução (uso do mediador)

> Material para quem aplica o jogo. **Não mostrar aos jogadores antes da partida.**
> Arquivo gerado por \`node scripts/gerar-fichas.mjs\` a partir de \`src/data/caso-*.json\`.
> Vale para o **modo história** (no modo desafio, o culpado é sorteado).

**Regra do auto:** as 2 provas precisam ser indícios que o culpado tem **e**, juntas, descartar todos os
outros suspeitos. Cada visita só rende o indício se o jogador escolher a **abordagem certa** dentro do local.
`,
]

for (const [k, c] of casos.entries()) {
  const culpado = c.suspeitos.find((s) => s.id === c.culpadoId)
  const locais = c.locais
    .map((l) => {
      const certa = l.acoes?.find((a) => a.revela)?.rotulo ?? '(sem escolhas)'
      const extra = [l.custoDias === 0 ? 'grátis' : '', l.liberadoPor ? `aparece depois de: ${c.locais.find((x) => x.id === l.liberadoPor).nome}` : '', l.forca === 'fraca' ? 'testemunho' : '']
        .filter(Boolean)
        .join('; ')
      return `| ${l.nome} | ${l.indicio ? nomeIndicio(c, l.indicio) : 'Nenhum (contexto)'} | ${certa} | ${extra} |`
    })
    .join('\n')

  const pares = []
  for (let i = 0; i < c.locais.length; i++) {
    for (let j = i + 1; j < c.locais.length; j++) {
      if (provasValidas(c, [c.locais[i].id, c.locais[j].id])) pares.push(`- ${c.locais[i].nome} + ${c.locais[j].nome}`)
    }
  }
  const total = (c.locais.length * (c.locais.length - 1)) / 2

  const suspeitos = c.suspeitos
    .map((s) => `| ${s.nome} (${s.empresa}) | ${s.indicios.map((i) => nomeIndicio(c, i)).join(', ')} | ${s.id === c.culpadoId ? '**culpado**' : s.indicios.length === c.indicios.length - 1 ? 'armadilha' : 'inocente'} |`)
    .join('\n')

  const moradores = (c.moradores ?? [])
    .map((m) => `| ${m.nome} | ${m.verdadeira ? 'verdade' : '**boato falso**'} |`)
    .join('\n')

  partes.push(`
## Caso ${ids[k]}: ${c.titulo}

**Tema:** ${c.tema}. **Culpado:** ${culpado.nome} (${culpado.empresa}). **Dias:** ${c.diasIniciais}.

### Suspeitos

| Suspeito | Indícios | Papel |
|---|---|---|
${suspeitos}

### Locais e abordagem certa

| Local | Indício | Abordagem que revela | Observação |
|---|---|---|---|
${locais}

### Duplas que resolvem o caso (${pares.length} de ${total})

${pares.join('\n')}

### Moradores

| Morador | A fala é |
|---|---|
${moradores}
`)
}

writeFileSync(new URL('../docs/fichas-de-solucao.md', import.meta.url), partes.join(''))
console.log('docs/fichas-de-solucao.md gerado')
