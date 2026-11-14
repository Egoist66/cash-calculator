import type { CashStorType } from '../store/cash.store'
import { CashForm } from './CashForm'

export function App(store: CashStorType): string {
  return CashForm(store)
}
