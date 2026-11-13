import './style.css'

// Estado inicial do caso (ver regras numéricas em docs/GDD.md)
const estado = {
  horasRestantes: 72,
  cidadeAtual: 'Brasília',
  provas: 0,
  provasNecessarias: 3,
  prejuizo: 500000,
  pontos: 0,
}

const reais = (valor) =>
  valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

document.querySelector('#app').innerHTML = `
  <main class="tela">
    <h1>Rota Fantasma</h1>
    <p class="subtitulo">Força-Tarefa Bússola: Caso #001 · Empresas fantasmas</p>
    <section class="hud">
      <span>Local: <strong>${estado.cidadeAtual}</strong></span>
      <span>Prazo: <strong>${estado.horasRestantes} h</strong></span>
      <span>Provas: <strong>${estado.provas}/${estado.provasNecessarias}</strong></span>
      <span>Prejuízo social: <strong>${reais(estado.prejuizo)}</strong></span>
      <span>Pontos: <strong>${estado.pontos}</strong></span>
    </section>
    <button id="iniciar" type="button">Aceitar caso</button>
  </main>
`

document.querySelector('#iniciar').addEventListener('click', () => {
  alert('Em breve: investigação, desafios fiscais e viagens!')
})
