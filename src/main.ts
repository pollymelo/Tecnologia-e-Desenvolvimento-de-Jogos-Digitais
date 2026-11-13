import './style.css'

// Tela de briefing provisória. Estado, regras e dados do caso
// serão implementados em state.ts, rules.ts e no JSON do caso (ver docs/GDD.md).
const DIAS_INICIAIS = 4

const app = document.querySelector<HTMLDivElement>('#app')!

app.innerHTML = `
  <main class="tela">
    <h1>Rota Fantasma</h1>
    <p class="subtitulo">Auditoria Fiscal · Caso 001</p>
    <section class="briefing">
      <p>
        O hospital municipal perdeu verba porque a arrecadação caiu.
        Uma denúncia anônima diz que um comerciante da cidade está sonegando.
      </p>
      <p>Você tem <strong>${DIAS_INICIAIS} dias</strong> para investigar e emitir o auto de infração.</p>
    </section>
    <button id="iniciar" type="button">Começar investigação</button>
  </main>
`

document.querySelector<HTMLButtonElement>('#iniciar')!.addEventListener('click', () => {
  alert('Em breve: mapa dos locais, caderno de suspeitos e acusação.')
})
