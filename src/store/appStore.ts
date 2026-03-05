import { create } from 'zustand'
import type {
  AppData,
  BudgetItem,
  BudgetMonth,
  Category,
  Currency,
  InvestmentUpdate,
  Language,
  SavingsJar,
  SavingsTransaction,
  Settings,
  Template,
  TemplateCategory,
  TemplateItem,
} from '../models/types'
import { storageService, DEFAULT_DATA } from '../services/storage'
import { generateId } from '../utils/idGenerator'
import { nextMonth, formatYearMonth } from '../utils/dateUtils'
import { getDefaultTemplate, ALL_DEFAULT_CATEGORY_NAMES } from '../i18n/defaultTemplates'

// ─── State shape ──────────────────────────────────────────────────────────────

interface AppState {
  months: BudgetMonth[]
  template: Template
  settings: Settings
  savingsJars: SavingsJar[]
}

// ─── Action shape ─────────────────────────────────────────────────────────────

interface AppActions {
  // ── Settings ──────────────────────────────────────────────────────────────
  setLanguage(lang: Language): void
  setCurrency(currency: Currency): void
  setNotificationsEnabled(enabled: boolean): void
  completeOnboarding(): void

  // ── Months ────────────────────────────────────────────────────────────────
  /** Create a blank month. Returns its id. Throws if already exists. */
  createMonth(year: number, month: number, currency?: Currency): string
  deleteMonth(monthId: string): void
  getMonth(year: number, month: number): BudgetMonth | undefined
  getMonthById(id: string): BudgetMonth | undefined

  // ── Categories (within a month) ───────────────────────────────────────────
  addCategory(monthId: string, category: Omit<Category, 'id'>): string
  updateCategory(monthId: string, categoryId: string, updates: Partial<Omit<Category, 'id'>>): void
  deleteCategory(monthId: string, categoryId: string): void

  // ── Items (within a month) ────────────────────────────────────────────────
  addItem(monthId: string, item: Omit<BudgetItem, 'id' | 'createdAt'>): string
  updateItem(monthId: string, itemId: string, updates: Partial<Omit<BudgetItem, 'id' | 'createdAt'>>): void
  deleteItem(monthId: string, itemId: string): void
  duplicateItem(monthId: string, itemId: string): string | null

  // ── Template ──────────────────────────────────────────────────────────────
  addTemplateCategory(category: Omit<TemplateCategory, 'id'>): string
  updateTemplateCategory(categoryId: string, updates: Partial<Omit<TemplateCategory, 'id'>>): void
  deleteTemplateCategory(categoryId: string): void
  addTemplateItem(item: Omit<TemplateItem, 'id'>): string
  updateTemplateItem(itemId: string, updates: Partial<Omit<TemplateItem, 'id'>>): void
  deleteTemplateItem(itemId: string): void

  /**
   * Apply the global template to an existing month.
   * - Copies missing categories (by name).
   * - Copies missing items (no duplicate if same name+amount+type exists).
   */
  applyTemplateToMonth(monthId: string): void

  /**
   * Creates the next calendar month (relative to monthId) and applies the template.
   * Returns the new month's id, or null if the month already exists.
   */
  createNextMonthFromTemplate(monthId: string): string | null

  // ── Savings Jars ──────────────────────────────────────────────────────────
  createJar(jar: Omit<SavingsJar, 'id' | 'transactions' | 'investmentUpdates' | 'createdAt'>): string
  updateJar(jarId: string, updates: Partial<Omit<SavingsJar, 'id' | 'transactions' | 'investmentUpdates' | 'createdAt'>>): void
  deleteJar(jarId: string): void
  addJarTransaction(jarId: string, tx: Omit<SavingsTransaction, 'id' | 'createdAt'>): string
  deleteJarTransaction(jarId: string, txId: string): void
  addInvestmentUpdate(jarId: string, update: Omit<InvestmentUpdate, 'id' | 'createdAt'>): string
  deleteInvestmentUpdate(jarId: string, updateId: string): void

  // ── Carry-over balance ────────────────────────────────────────────────────
  /**
   * Imports the previous month's net balance as an INCOME item in this month.
   * Returns true if the import succeeded, false if there's no positive balance.
   */
  importPreviousBalance(monthId: string): boolean

  // ── Import / Export ───────────────────────────────────────────────────────
  exportData(): string
  importData(json: string): void
  clearAllData(): void
}

export type AppStore = AppState & AppActions

// ─── Helpers ──────────────────────────────────────────────────────────────────

const load = (): AppState => {
  const data = storageService.load() ?? DEFAULT_DATA
  return {
    months: data.months,
    template: data.template,
    settings: data.settings,
    // Backward-compat: existing jars may lack `type` and `investmentUpdates`
    savingsJars: data.savingsJars.map((j) => ({
      ...j,
      type: j.type ?? 'RISPARMIO',
      investmentUpdates: j.investmentUpdates ?? [],
    })),
  }
}

const persist = (state: AppState): void => {
  const data: AppData = { schemaVersion: 1, ...state }
  storageService.save(data)
}

/** Mutate months array in place by patching a specific month */
const patchMonth = (
  months: BudgetMonth[],
  monthId: string,
  fn: (m: BudgetMonth) => BudgetMonth
): BudgetMonth[] => months.map((m) => (m.id === monthId ? fn(m) : m))

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppStore>((set, get) => {
  const initial = load()

  const save = () => {
    const { months, template, settings, savingsJars } = get()
    persist({ months, template, settings, savingsJars })
  }

  return {
    ...initial,

    // ── Settings ─────────────────────────────────────────────────────────────
    setLanguage(lang) {
      const { template } = get()
      // Auto-translate template if it's still the default (no custom category names)
      const isDefault =
        template.categories.length > 0 &&
        template.categories.every((c) => ALL_DEFAULT_CATEGORY_NAMES.has(c.name))
      if (isDefault) {
        set((s) => ({
          settings: { ...s.settings, language: lang },
          template: getDefaultTemplate(lang),
        }))
      } else {
        set((s) => ({ settings: { ...s.settings, language: lang } }))
      }
      save()
    },
    setCurrency(currency) {
      set((s) => ({ settings: { ...s.settings, currency } }))
      save()
    },
    setNotificationsEnabled(enabled) {
      set((s) => ({ settings: { ...s.settings, notificationsEnabled: enabled } }))
      save()
    },
    completeOnboarding() {
      set((s) => ({ settings: { ...s.settings, onboardingComplete: true } }))
      save()
    },

    // ── Months ────────────────────────────────────────────────────────────────
    createMonth(year, month, currency) {
      const existing = get().months.find((m) => m.year === year && m.month === month)
      if (existing) throw new Error('monthAlreadyExists')

      const curr = currency ?? get().settings.currency
      const newMonth: BudgetMonth = {
        id: generateId(),
        year,
        month,
        currency: curr,
        categories: [],
        items: [],
        createdAt: new Date().toISOString(),
      }
      set((s) => ({ months: [...s.months, newMonth] }))
      save()
      return newMonth.id
    },

    deleteMonth(monthId) {
      set((s) => ({ months: s.months.filter((m) => m.id !== monthId) }))
      save()
    },

    getMonth(year, month) {
      return get().months.find((m) => m.year === year && m.month === month)
    },

    getMonthById(id) {
      return get().months.find((m) => m.id === id)
    },

    // ── Categories ────────────────────────────────────────────────────────────
    addCategory(monthId, category) {
      const id = generateId()
      set((s) => ({
        months: patchMonth(s.months, monthId, (m) => ({
          ...m,
          categories: [...m.categories, { id, ...category }],
        })),
      }))
      save()
      return id
    },

    updateCategory(monthId, categoryId, updates) {
      set((s) => ({
        months: patchMonth(s.months, monthId, (m) => ({
          ...m,
          categories: m.categories.map((c) =>
            c.id === categoryId ? { ...c, ...updates } : c
          ),
        })),
      }))
      save()
    },

    deleteCategory(monthId, categoryId) {
      set((s) => ({
        months: patchMonth(s.months, monthId, (m) => ({
          ...m,
          categories: m.categories.filter((c) => c.id !== categoryId),
        })),
      }))
      save()
    },

    // ── Items ─────────────────────────────────────────────────────────────────
    addItem(monthId, item) {
      const id = generateId()
      const newItem: BudgetItem = {
        id,
        createdAt: new Date().toISOString(),
        ...item,
      }
      set((s) => ({
        months: patchMonth(s.months, monthId, (m) => ({
          ...m,
          items: [...m.items, newItem],
        })),
      }))
      save()
      return id
    },

    updateItem(monthId, itemId, updates) {
      set((s) => ({
        months: patchMonth(s.months, monthId, (m) => ({
          ...m,
          items: m.items.map((i) => (i.id === itemId ? { ...i, ...updates } : i)),
        })),
      }))
      save()
    },

    deleteItem(monthId, itemId) {
      set((s) => ({
        months: patchMonth(s.months, monthId, (m) => ({
          ...m,
          items: m.items.filter((i) => i.id !== itemId),
        })),
      }))
      save()
    },

    duplicateItem(monthId, itemId) {
      const month = get().getMonthById(monthId)
      if (!month) return null
      const original = month.items.find((i) => i.id === itemId)
      if (!original) return null

      const newId = generateId()
      const duplicate: BudgetItem = {
        ...original,
        id: newId,
        paid: false,
        createdAt: new Date().toISOString(),
      }
      set((s) => ({
        months: patchMonth(s.months, monthId, (m) => ({
          ...m,
          items: [...m.items, duplicate],
        })),
      }))
      save()
      return newId
    },

    // ── Template ──────────────────────────────────────────────────────────────
    addTemplateCategory(category) {
      const id = generateId()
      set((s) => ({
        template: {
          ...s.template,
          categories: [...s.template.categories, { id, ...category }],
        },
      }))
      save()
      return id
    },

    updateTemplateCategory(categoryId, updates) {
      set((s) => ({
        template: {
          ...s.template,
          categories: s.template.categories.map((c) =>
            c.id === categoryId ? { ...c, ...updates } : c
          ),
        },
      }))
      save()
    },

    deleteTemplateCategory(categoryId) {
      set((s) => ({
        template: {
          categories: s.template.categories.filter((c) => c.id !== categoryId),
          items: s.template.items.filter((i) => i.categoryId !== categoryId),
        },
      }))
      save()
    },

    addTemplateItem(item) {
      const id = generateId()
      set((s) => ({
        template: {
          ...s.template,
          items: [...s.template.items, { id, ...item }],
        },
      }))
      save()
      return id
    },

    updateTemplateItem(itemId, updates) {
      set((s) => ({
        template: {
          ...s.template,
          items: s.template.items.map((i) =>
            i.id === itemId ? { ...i, ...updates } : i
          ),
        },
      }))
      save()
    },

    deleteTemplateItem(itemId) {
      set((s) => ({
        template: {
          ...s.template,
          items: s.template.items.filter((i) => i.id !== itemId),
        },
      }))
      save()
    },

    applyTemplateToMonth(monthId) {
      const { template, months } = get()
      const month = months.find((m) => m.id === monthId)
      if (!month) return

      // Full reset: rebuild categories and items entirely from template.
      // Any manually-added items/categories are removed.
      const newCategories: Category[] = []
      const templateCatIdToMonthCatId = new Map<string, string>()

      for (const tCat of template.categories) {
        const newId = generateId()
        newCategories.push({ id: newId, name: tCat.name, color: tCat.color, order: tCat.order, type: tCat.type })
        templateCatIdToMonthCatId.set(tCat.id, newId)
      }

      const newItems: BudgetItem[] = []
      for (const tItem of template.items) {
        const targetCatId = templateCatIdToMonthCatId.get(tItem.categoryId) ?? tItem.categoryId
        newItems.push({
          id: generateId(),
          categoryId: targetCatId,
          name: tItem.name,
          amount: tItem.amount,
          type: tItem.type,
          date: tItem.dayOfMonth
            ? `${month.year}-${String(month.month).padStart(2, '0')}-${String(tItem.dayOfMonth).padStart(2, '0')}`
            : undefined,
          planned: tItem.planned,
          paid: false,
          note: tItem.note,
          createdAt: new Date().toISOString(),
        })
      }

      set((s) => ({
        months: patchMonth(s.months, monthId, (m) => ({
          ...m,
          categories: newCategories,
          items: newItems,
        })),
      }))
      save()
    },

    createNextMonthFromTemplate(monthId) {
      const month = get().getMonthById(monthId)
      if (!month) return null

      const { year: ny, month: nm } = nextMonth(month.year, month.month)
      const exists = get().months.find((m) => m.year === ny && m.month === nm)
      if (exists) return null

      let newId: string
      try {
        newId = get().createMonth(ny, nm, month.currency)
      } catch {
        return null
      }
      get().applyTemplateToMonth(newId)
      return newId
    },

    // ── Savings Jars ──────────────────────────────────────────────────────────
    createJar(jar) {
      const id = generateId()
      const newJar: SavingsJar = {
        id,
        ...jar,
        transactions: [],
        investmentUpdates: [],
        createdAt: new Date().toISOString(),
      }
      set((s) => ({ savingsJars: [...s.savingsJars, newJar] }))
      save()
      return id
    },

    updateJar(jarId, updates) {
      set((s) => ({
        savingsJars: s.savingsJars.map((j) => (j.id === jarId ? { ...j, ...updates } : j)),
      }))
      save()
    },

    deleteJar(jarId) {
      set((s) => ({ savingsJars: s.savingsJars.filter((j) => j.id !== jarId) }))
      save()
    },

    addJarTransaction(jarId, tx) {
      const id = generateId()
      const newTx: SavingsTransaction = {
        id,
        ...tx,
        createdAt: new Date().toISOString(),
      }
      set((s) => ({
        savingsJars: s.savingsJars.map((j) =>
          j.id === jarId ? { ...j, transactions: [...j.transactions, newTx] } : j
        ),
      }))
      save()
      return id
    },

    deleteJarTransaction(jarId, txId) {
      set((s) => ({
        savingsJars: s.savingsJars.map((j) =>
          j.id === jarId
            ? { ...j, transactions: j.transactions.filter((t) => t.id !== txId) }
            : j
        ),
      }))
      save()
    },

    addInvestmentUpdate(jarId, update) {
      const id = generateId()
      const newUpdate: InvestmentUpdate = { id, ...update, createdAt: new Date().toISOString() }
      set((s) => ({
        savingsJars: s.savingsJars.map((j) =>
          j.id === jarId
            ? { ...j, investmentUpdates: [...(j.investmentUpdates ?? []), newUpdate] }
            : j
        ),
      }))
      save()
      return id
    },

    deleteInvestmentUpdate(jarId, updateId) {
      set((s) => ({
        savingsJars: s.savingsJars.map((j) =>
          j.id === jarId
            ? { ...j, investmentUpdates: (j.investmentUpdates ?? []).filter((u) => u.id !== updateId) }
            : j
        ),
      }))
      save()
    },

    // ── Carry-over balance ─────────────────────────────────────────────────────
    importPreviousBalance(monthId) {
      const { months } = get()
      const month = months.find((m) => m.id === monthId)
      if (!month) return false

      // Find the most recent month strictly before this one
      const prevMonth = months
        .filter((m) => m.year < month.year || (m.year === month.year && m.month < month.month))
        .sort((a, b) => b.year !== a.year ? b.year - a.year : b.month - a.month)[0]

      if (!prevMonth) return false

      const income = prevMonth.items
        .filter((i) => i.type === 'INCOME')
        .reduce((s, i) => s + i.amount, 0)
      const expenses = prevMonth.items
        .filter((i) => i.type === 'EXPENSE')
        .reduce((s, i) => s + i.amount, 0)
      const balance = income - expenses

      if (balance <= 0) return false

      // Target: first category that already has income items, else first category
      const incomeCat = month.categories.find(
        (c) => month.items.some((i) => i.categoryId === c.id && i.type === 'INCOME')
      )
      const targetCat = incomeCat ?? month.categories[0]
      if (!targetCat) return false

      const prevLabel = `${prevMonth.year}-${String(prevMonth.month).padStart(2, '0')}`
      get().addItem(monthId, {
        categoryId: targetCat.id,
        name: `Saldo ${prevLabel}`,
        amount: balance,
        type: 'INCOME',
        planned: true,
        paid: true,
      })
      return true
    },

    // ── Import / Export ────────────────────────────────────────────────────────
    exportData() {
      return storageService.exportJSON()
    },

    importData(json) {
      const data = storageService.importJSON(json)
      set({ months: data.months, template: data.template, settings: data.settings, savingsJars: data.savingsJars })
    },

    clearAllData() {
      storageService.clear()
      const fresh = DEFAULT_DATA
      set({ months: fresh.months, template: fresh.template, settings: fresh.settings, savingsJars: fresh.savingsJars })
    },
  }
})

// ─── Convenience selectors ────────────────────────────────────────────────────

export const selectSortedMonths = (s: AppStore): BudgetMonth[] =>
  [...s.months].sort((a, b) =>
    a.year !== b.year ? b.year - a.year : b.month - a.month
  )

export const selectMonthByYM = (year: number, month: number) => (s: AppStore) =>
  s.months.find((m) => m.year === year && m.month === month)

export const selectCurrentMonthId = (yearMonth: string) => (s: AppStore) => {
  const [y, m] = yearMonth.split('-').map(Number)
  return s.months.find((mo) => mo.year === y && mo.month === m)?.id ?? null
}

export { formatYearMonth }
