import type { Language } from '../models/types'
import type { Template } from '../models/types'
import { generateId } from '../utils/idGenerator'

// ─── Localized default category / item names ──────────────────────────────────

const CATEGORY_NAMES: Record<Language, readonly [string, string, string, string, string, string]> = {
  it: ['Entrate',   'Abitazione',    'Alimentari',    'Trasporti', 'Svago',           'Altro'],
  en: ['Income',    'Housing',       'Groceries',     'Transport', 'Entertainment',   'Other'],
  de: ['Einnahmen', 'Wohnen',        'Lebensmittel',  'Verkehr',   'Freizeit',        'Sonstiges'],
}

const ITEM_NAMES: Record<Language, readonly [string, string, string, string, string]> = {
  it: ['Stipendio', 'Affitto', 'Spesa alimentari', 'Trasporto', 'Netflix'],
  en: ['Salary',    'Rent',    'Groceries',         'Transport', 'Netflix'],
  de: ['Gehalt',    'Miete',   'Lebensmittel',      'Verkehr',   'Netflix'],
}

const COLORS = ['#22c55e', '#6366f1', '#f59e0b', '#3b82f6', '#ec4899', '#94a3b8']

// All default category names across every language — used to detect uncustomized templates
export const ALL_DEFAULT_CATEGORY_NAMES: ReadonlySet<string> = new Set(
  Object.values(CATEGORY_NAMES).flat()
)

// ─── Factory ──────────────────────────────────────────────────────────────────

export function getDefaultTemplate(lang: Language): Template {
  const catNames = CATEGORY_NAMES[lang]
  const itemNames = ITEM_NAMES[lang]

  const categories = catNames.map((name, i) => ({
    id: generateId(),
    name,
    color: COLORS[i],
    order: i,
    type: (i === 0 ? 'INCOME' : 'EXPENSE') as import('../models/types').ItemType,
  }))

  const items = [
    { name: itemNames[0], ci: 0, amount: 2000,  type: 'INCOME'  as const, dayOfMonth: 27 },
    { name: itemNames[1], ci: 1, amount: 800,   type: 'EXPENSE' as const, dayOfMonth: 1  },
    { name: itemNames[2], ci: 2, amount: 300,   type: 'EXPENSE' as const                 },
    { name: itemNames[3], ci: 3, amount: 80,    type: 'EXPENSE' as const                 },
    { name: itemNames[4], ci: 4, amount: 12.99, type: 'EXPENSE' as const, dayOfMonth: 15 },
  ].map(({ name, ci, amount, type, dayOfMonth }) => ({
    id: generateId(),
    categoryId: categories[ci].id,
    name,
    amount,
    type,
    dayOfMonth,
    planned: true,
  }))

  return { categories, items }
}
