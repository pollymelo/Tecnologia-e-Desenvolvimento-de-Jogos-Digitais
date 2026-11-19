# Rota Fantasma

Jogo educativo de **educação fiscal** para o Ensino Médio, desenvolvido para a NP2 de Jogos Digitais.
Como auditor(a) fiscal, você anda pelo mapa de Vila Aurora, entra nos locais, escolhe como investigar, ouve os moradores e, em 3 dias, emite um auto de infração fundamentado em provas. São **4 casos** em sequência (cada caso resolvido destrava o próximo): venda sem nota, nota fria e empresa de fachada, IPTU e a nota fiscal do consumidor.

**▶ Jogar online:** https://pollymelo.github.io/Tecnologia-e-Desenvolvimento-de-Jogos-Digitais/

- Documento de design (GDD): [docs/GDD.md](docs/GDD.md) · versão de entrega em [DOCX](docs/GDD-Rota-Fantasma.docx) (gerar de novo com `npm run gdd`; para PDF, abrir no Word e usar Arquivo → Exportar → PDF)
- [Lore: Vila Aurora e os fantasmas da Aurora](docs/lore.md)
- [Fichas de solução dos 4 casos (para o mediador)](docs/fichas-de-solucao.md): geradas com `node scripts/gerar-fichas.mjs`
- Caso 001: [perfis dos suspeitos](docs/caso-001-suspeitos.md)
- [Ficha de Aplicação Extensionista](docs/GDD.md#19-ficha-de-aplicação-extensionista) (seção 19 do GDD)
- [Roteiro de teste com jogador de fora](docs/roteiro-teste-jogador.md)

## Como rodar

```bash
npm install
npm run dev
```

Build de produção: `npm run build`

Testes (regras e telas): `npm test`

## Publicação (GitHub Pages)

Cada push na `main` roda os testes, gera o build e publica o jogo
(`.github/workflows/deploy.yml`). Na primeira vez, é preciso ativar no GitHub:
**Settings → Pages → Build and deployment → Source: GitHub Actions**.
