import React, { useMemo, useState } from 'react'
import type { BudgetMonth, ItemType } from '../../models/types'
import { useAppStore } from '../../store/appStore'
import { useTranslation } from '../../i18n/useTranslation'
import { isValidAmount, parseAmount } from '../../utils/currency'
import { Button } from '../ui/Button'

interface QuickAddFormProps {
  month: BudgetMonth
  defaultCategoryId?: string
}

export const QuickAddForm: React.FC<QuickAddFormProps> = ({
  month,
  defaultCategoryId,
}) => {
  const { t } = useTranslation()
  const { addItem, addCategory, template } = useAppStore((s) => ({
    addItem: s.addItem,
    addCategory: s.addCategory,
    template: s.template,
  }))

  // Merged category list: month + template-only (deduplicated by name)
  const allCategories = useMemo(() => {
    const templateOnly = template.categories.filter(
      (tc) => !month.categories.some((mc) => mc.name === tc.name)
    )
    return [...month.categories, ...templateOnly]
  }, [month.categories, template.categories])

  const firstExpenseId = defaultCategoryId
    ?? allCategories.find((c) => !c.type || c.type === 'EXPENSE')?.id
    ?? allCategories[0]?.id
    ?? ''

  const todayDate = new Date().toISOString().split('T')[0]

  const [name, setName] = useState('')
  const [amountRaw, setAmountRaw] = useState('')
  const [type, setType] = useState<ItemType>('EXPENSE')
  const [categoryId, setCategoryId] = useState(firstExpenseId)
  const [error, setError] = useState('')

  // If no categories anywhere, don't render
  if (allCategories.length === 0) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) { setError('Nome richiesto'); return }
    if (!isValidAmount(amountRaw)) { setError('Importo non valido'); return }
    if (!categoryId) { setError('Categoria richiesta'); return }

    // Auto-create category in month if it's from the template only
    let finalCategoryId = categoryId
    const isInMonth = month.categories.some((c) => c.id === categoryId)
    if (!isInMonth) {
      const tCat = template.categories.find((c) => c.id === categoryId)
      if (tCat) {
        finalCategoryId = addCategory(month.id, {
          name: tCat.name,
          color: tCat.color,
          order: tCat.order,
        })
      }
    }

    addItem(month.id, {
      categoryId: finalCategoryId,
      name: name.trim(),
      amount: parseAmount(amountRaw),
      type,
      date: todayDate,
      planned: false,
      paid: false,
    })

    setName('')
    setAmountRaw('')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-slate-200 rounded-xl p-3"
    >
      <div className="flex flex-wrap gap-2 items-end">
        {/* Type toggle */}
        <div className="flex rounded-lg overflow-hidden border border-slate-200 shrink-0">
          <button
            type="button"
            onClick={() => {
              setType('INCOME')
              const first = allCategories.find((c) => !c.type || c.type === 'INCOME')
              if (first) setCategoryId(first.id)
            }}
            className={[
              'px-3 py-2 text-xs font-semibold transition-colors',
              type === 'INCOME'
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-slate-500 hover:bg-slate-50',
            ].join(' ')}
          >
            + {t('form.income')}
          </button>
          <button
            type="button"
            onClick={() => {
              setType('EXPENSE')
              const first = allCategories.find((c) => !c.type || c.type === 'EXPENSE')
              if (first) setCategoryId(first.id)
            }}
            className={[
              'px-3 py-2 text-xs font-semibold transition-colors',
              type === 'EXPENSE'
                ? 'bg-rose-600 text-white'
                : 'bg-white text-slate-500 hover:bg-slate-50',
            ].join(' ')}
          >
            − {t('form.expense')}
          </button>
        </div>

        {/* Category select — filtered by type */}
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="rounded-lg border border-slate-200 px-2.5 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          {allCategories
            .filter((cat) => !cat.type || cat.type === type)
            .map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
        </select>

        {/* Name */}
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('form.name') + '…'}
          className="flex-1 min-w-[120px] rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />

        {/* Amount */}
        <input
          type="text"
          value={amountRaw}
          onChange={(e) => setAmountRaw(e.target.value)}
          placeholder="0.00"
          inputMode="decimal"
          className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />

        {/* Submit */}
        <Button type="submit" variant="primary" size="md">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </Button>
      </div>

      {error && <p className="mt-1.5 text-xs text-rose-600">{error}</p>}
    </form>
  )
}
