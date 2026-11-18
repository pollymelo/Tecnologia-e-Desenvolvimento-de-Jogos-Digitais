import { defineConfig } from 'vite'

// base relativa: o mesmo build funciona no GitHub Pages (que serve o site numa subpasta,
// /Tecnologia-e-Desenvolvimento-de-Jogos-Digitais/) e abrindo localmente.
export default defineConfig({
  base: './',
})
