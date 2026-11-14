import './assets/css/style.css'
import { createApp } from '../core/createApp'
import { App } from './components/App'
import { useCashCalculator } from './hooks/useCashCalculator'
import { initInstallPrompt } from './pwa/install'

const { cashStore, bindCashForm } = useCashCalculator()

createApp({
  app: () => App(cashStore),
  root: '#app',
  componentInitializers: [bindCashForm, initInstallPrompt],
})
