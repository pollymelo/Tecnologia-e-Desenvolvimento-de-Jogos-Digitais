import './style.css'

// Estado inicial do caso (ver regras numéricas em docs/GDD.md)
const estado = {
  horasRestantes: 72,
  cidadeAtual: 'Ponto de partida',
  pontos: 0,
}

document.querySelector('#app').innerHTML = `
  <main class="tela">
    <h1>Rota Fantasma</h1>
    <p class="subtitulo">Agência Bússola — Caso #001</p>
    <section class="hud">
      <span>Local: <strong>${estado.cidadeAtual}</strong></span>
      <span>Prazo: <strong>${estado.horasRestantes} h</strong></span>
      <span>Pontos: <strong>${estado.pontos}</strong></span>
    </section>
    <button id="iniciar" type="button">Aceitar caso</button>
  </main>
`

document.querySelector('#iniciar').addEventListener('click', () => {
  alert('Em breve: investigação e viagens!')
})
