import './assets/css/style.css'
import { createApp } from '../core/createApp'
import { App } from './components/App'
import { useCashCalculator } from './hooks/useCashCalculator'

const { cashStore, bindCashForm } = useCashCalculator()

createApp({
  app: () => App(cashStore),
  root: '#app',
  componentInitializers: [bindCashForm],
})
