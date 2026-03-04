import React from 'react'
import type { BudgetItem, BudgetMonth } from '../../models/types'
import { filterItems, findCategory } from '../../utils/calculations'
import { formatCurrency } from '../../utils/currency'
import { useTranslation } from '../../i18n/useTranslation'
import { useAppStore } from '../../store/appStore'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

interface ItemListProps {
  month: BudgetMonth
  categoryId: string | null
  search: string
  onlyPlannedUnpaid: boolean
  onEdit(item: BudgetItem): void
}

/** Returns true if the expense date is today or in the past (already debited) */
const isPastDate = (item: BudgetItem): boolean => {
  if (!item.date) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(item.date) <= today
}

export const ItemList: React.FC<ItemListProps> = ({
  month,
  categoryId,
  search,
  onlyPlannedUnpaid,
  onEdit,
}) => {
  const { t } = useTranslation()
  const { deleteItem, duplicateItem } = useAppStore((s) => ({
    deleteItem: s.deleteItem,
    duplicateItem: s.duplicateItem,
  }))

  const items = filterItems(month.items, { categoryId, search, onlyPlannedUnpaid })

  const handleDelete = (item: BudgetItem) => {
    if (window.confirm(t('messages.deleteConfirm'))) {
      deleteItem(month.id, item.id)
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <svg className="w-12 h-12 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="text-sm">{t('summary.noItems')}</p>
      </div>
    )
  }

  // Group by category for display
  const grouped = new Map<string, BudgetItem[]>()
  for (const item of items) {
    const list = grouped.get(item.categoryId) ?? []
    list.push(item)
    grouped.set(item.categoryId, list)
  }

  return (
    <div className="flex flex-col gap-1">
      {Array.from(grouped.entries()).map(([catId, catItems]) => {
        const cat = findCategory(month.categories, catId)
        return (
          <div key={catId}>
            {/* Category header — show only in "all" view */}
            {categoryId === null && cat && (
              <div className="flex items-center gap-2 px-3 py-1.5 mt-2 first:mt-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {cat.name}
                </span>
              </div>
            )}

            {catItems.map((item) => {
              const cat = findCategory(month.categories, item.categoryId)
              // Expenses with a past date are already debited — show slightly muted
              const alreadyDebited = item.type === 'EXPENSE' && isPastDate(item)
              return (
                <div
                  key={item.id}
                  className={[
                    'group flex items-center gap-3 px-3 py-3 rounded-xl',
                    'hover:bg-slate-50 transition-colors',
                    alreadyDebited ? 'opacity-55' : '',
                  ].join(' ')}
                >
                  {/* Type indicator */}
                  <span
                    className={[
                      'w-2 h-2 rounded-full shrink-0',
                      item.type === 'INCOME' ? 'bg-emerald-500' : 'bg-rose-500',
                    ].join(' ')}
                  />

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-slate-900 truncate">
                        {item.name}
                      </span>

                      {cat && categoryId === null && (
                        <Badge variant="neutral" color={cat.color}>
                          {cat.name}
                        </Badge>
                      )}

                      {item.planned && item.type === 'EXPENSE' && !alreadyDebited && (
                        <Badge variant="planned">
                          {t('form.planned')}
                        </Badge>
                      )}
                    </div>

                    {(item.note || item.date) && (
                      <p className="text-xs text-slate-400 mt-0.5 truncate">
                        {item.date && <span className="mr-2">{item.date}</span>}
                        {item.note}
                      </p>
                    )}
                  </div>

                  {/* Amount */}
                  <span
                    className={[
                      'text-sm font-semibold tabular-nums shrink-0',
                      item.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600',
                    ].join(' ')}
                  >
                    {item.type === 'EXPENSE' ? '-' : '+'}
                    {formatCurrency(item.amount, month.currency)}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-0.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(item)}
                      title={t('actions.editItem')}
                      icon={
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      }
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => duplicateItem(month.id, item.id)}
                      title={t('actions.duplicateItem')}
                      icon={
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      }
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item)}
                      title={t('actions.deleteItem')}
                      className="hover:text-rose-600"
                      icon={
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      }
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
