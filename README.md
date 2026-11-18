# Rota Fantasma

Jogo educativo de **educação fiscal** para o Ensino Médio, desenvolvido para a NP2 de Jogos Digitais.
Como auditor(a) fiscal, você tem 3 dias para descobrir qual comerciante está sonegando: visite locais, colete indícios, descarte suspeitos no caderno e emita um auto de infração fundamentado em provas.

**▶ Jogar online:** https://pollymelo.github.io/Tecnologia-e-Desenvolvimento-de-Jogos-Digitais/

- Documento de design: [docs/GDD.md](docs/GDD.md)
- [Lore: Vila Aurora e os fantasmas da Aurora](docs/lore.md)
- Caso 001: [perfis dos suspeitos](docs/caso-001-suspeitos.md) · [ficha de solução para o mediador](docs/caso-001-ficha-solucao.md)
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
