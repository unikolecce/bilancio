import type {
  BudgetItem,
  BudgetMonth,
  Category,
  MonthSummary,
  CategorySummary,
} from '../models/types'

/**
 * Computes the top-level financial summary for a month.
 */
export const computeMonthSummary = (month: BudgetMonth): MonthSummary => {
  let totalIncome = 0
  let totalExpenses = 0
  let paidExpenses = 0
  let plannedRemaining = 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (const item of month.items) {
    if (item.type === 'INCOME') {
      totalIncome += item.amount
    } else {
      totalExpenses += item.amount

      // An expense is "paid" if:
      //   • manually marked paid, OR
      //   • has a date that is today or in the past (already debited)
      const effectivelyPaid =
        item.paid ||
        (!!item.date && new Date(item.date) <= today)

      if (effectivelyPaid) {
        paidExpenses += item.amount
      } else if (item.planned) {
        plannedRemaining += item.amount
      }
    }
  }

  return {
    totalIncome,
    totalExpenses,
    paidExpenses,
    balance: totalIncome - totalExpenses,
    plannedRemaining,
  }
}

/**
 * Computes per-category summaries for a month.
 */
export const computeCategorySummaries = (
  month: BudgetMonth
): CategorySummary[] => {
  const map = new Map<string, CategorySummary>()

  // Pre-populate from categories so order is preserved
  for (const cat of month.categories) {
    map.set(cat.id, {
      categoryId: cat.id,
      name: cat.name,
      color: cat.color,
      totalIncome: 0,
      totalExpenses: 0,
      itemCount: 0,
    })
  }

  for (const item of month.items) {
    const existing = map.get(item.categoryId)
    if (existing) {
      existing.itemCount++
      if (item.type === 'INCOME') {
        existing.totalIncome += item.amount
      } else {
        existing.totalExpenses += item.amount
      }
    } else {
      // Item references an unknown category — create an "Uncategorized" entry
      const uncatId = item.categoryId
      const uncat = map.get(uncatId) ?? {
        categoryId: uncatId,
        name: '—',
        color: '#94a3b8',
        totalIncome: 0,
        totalExpenses: 0,
        itemCount: 0,
      }
      uncat.itemCount++
      if (item.type === 'INCOME') {
        uncat.totalIncome += item.amount
      } else {
        uncat.totalExpenses += item.amount
      }
      map.set(uncatId, uncat)
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    const catA = month.categories.find((c) => c.id === a.categoryId)
    const catB = month.categories.find((c) => c.id === b.categoryId)
    return (catA?.order ?? 99) - (catB?.order ?? 99)
  })
}

const filterToday = new Date()
filterToday.setHours(0, 0, 0, 0)

/**
 * Filters items by category and/or search query.
 */
export const filterItems = (
  items: BudgetItem[],
  opts: {
    categoryId?: string | null
    search?: string
    onlyPlannedUnpaid?: boolean
  }
): BudgetItem[] => {
  return items.filter((item) => {
    if (opts.categoryId && item.categoryId !== opts.categoryId) return false
    if (opts.onlyPlannedUnpaid) {
      // Show only planned expenses that haven't been debited yet (future date or no date)
      if (!item.planned || item.type !== 'EXPENSE') return false
      if (item.date) {
        const d = new Date(item.date); d.setHours(0, 0, 0, 0)
        if (d <= filterToday) return false
      }
    }
    if (opts.search) {
      const q = opts.search.toLowerCase()
      const matchName = item.name.toLowerCase().includes(q)
      const matchNote = (item.note ?? '').toLowerCase().includes(q)
      if (!matchName && !matchNote) return false
    }
    return true
  })
}

/**
 * Finds a category by ID in a categories array.
 */
export const findCategory = (
  categories: Category[],
  id: string
): Category | undefined => categories.find((c) => c.id === id)
