import './style.css'
import { caso001 } from './game/caso.ts'
import { iniciarApp } from './ui/app.ts'

iniciarApp(document.querySelector<HTMLDivElement>('#app')!, caso001)
