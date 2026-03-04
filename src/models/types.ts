// ─── Core enums ──────────────────────────────────────────────────────────────

export type Currency = 'EUR' | 'USD' | 'CHF' | 'GBP'
export type ItemType = 'INCOME' | 'EXPENSE'
export type Language = 'it' | 'en' | 'de'

// ─── Category ────────────────────────────────────────────────────────────────

export interface Category {
  id: string
  name: string
  color: string
  order: number
  type?: ItemType
}

// ─── Budget Item ─────────────────────────────────────────────────────────────

export interface BudgetItem {
  id: string
  categoryId: string
  name: string
  amount: number
  type: ItemType
  date?: string
  planned: boolean
  paid: boolean
  note?: string
  createdAt: string
}

// ─── Budget Month ─────────────────────────────────────────────────────────────

export interface BudgetMonth {
  id: string
  year: number
  month: number
  currency: Currency
  categories: Category[]
  items: BudgetItem[]
  createdAt: string
}

// ─── Template ─────────────────────────────────────────────────────────────────

export interface TemplateCategory {
  id: string
  name: string
  color: string
  order: number
  type?: ItemType
}

export interface TemplateItem {
  id: string
  categoryId: string
  name: string
  amount: number
  type: ItemType
  dayOfMonth?: number
  planned: boolean
  note?: string
}

export interface Template {
  categories: TemplateCategory[]
  items: TemplateItem[]
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export interface Settings {
  currency: Currency
  language: Language
  onboardingComplete: boolean
}

// ─── Savings Jars ─────────────────────────────────────────────────────────────

export interface SavingsTransaction {
  id: string
  type: 'DEPOSIT' | 'WITHDRAWAL'
  amount: number
  note?: string
  date: string        // YYYY-MM-DD
  createdAt: string
}

export interface SavingsJar {
  id: string
  name: string
  color: string
  icon: string        // emoji
  target?: number     // savings goal, optional
  transactions: SavingsTransaction[]
  createdAt: string
}

// ─── Root data structure ──────────────────────────────────────────────────────

export interface AppData {
  schemaVersion: number
  months: BudgetMonth[]
  template: Template
  settings: Settings
  savingsJars: SavingsJar[]
}

// ─── Computed summaries ───────────────────────────────────────────────────────

export interface MonthSummary {
  totalIncome: number
  totalExpenses: number   // all expenses (paid + planned) — used for balance
  paidExpenses: number    // only paid expenses — shown in the summary card
  balance: number         // totalIncome - totalExpenses (projected end-of-month)
  plannedRemaining: number // planned but not yet paid
}

export interface CategorySummary {
  categoryId: string
  name: string
  color: string
  totalIncome: number
  totalExpenses: number
  itemCount: number
}
