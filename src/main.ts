import './style.css'
import { casos } from './game/caso.ts'
import { iniciarApp } from './ui/app.ts'

iniciarApp(document.querySelector<HTMLDivElement>('#app')!, casos)
