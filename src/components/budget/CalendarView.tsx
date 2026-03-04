import React, { useMemo, useState } from 'react'
import type { BudgetItem, BudgetMonth } from '../../models/types'
import { filterItems } from '../../utils/calculations'
import { formatCurrency } from '../../utils/currency'
import { getMonthName } from '../../utils/dateUtils'
import { useTranslation } from '../../i18n/useTranslation'

interface CalendarViewProps {
  month: BudgetMonth
  categoryId: string | null
  search: string
  onEdit(item: BudgetItem): void
}

const DAY_HEADERS = ['L', 'M', 'M', 'G', 'V', 'S', 'D']

export const CalendarView: React.FC<CalendarViewProps> = ({ month, categoryId, search, onEdit }) => {
  const { language } = useTranslation()
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  const filteredItems = useMemo(
    () => filterItems(month.items, { categoryId, search }),
    [month.items, categoryId, search]
  )

  // Items grouped by day number (1–31), only items with a date in this month
  const itemsByDay = useMemo(() => {
    const map = new Map<number, BudgetItem[]>()
    for (const item of filteredItems) {
      if (!item.date) continue
      // Ensure the date belongs to this month
      const [y, m, d] = item.date.split('-').map(Number)
      if (y !== month.year || m !== month.month) continue
      const list = map.get(d) ?? []
      list.push(item)
      map.set(d, list)
    }
    return map
  }, [filteredItems, month.year, month.month])

  // Items without date
  const undatedItems = useMemo(
    () => filteredItems.filter((i) => !i.date),
    [filteredItems]
  )

  // First weekday of the month (Monday-based: 0=Mon … 6=Sun)
  const firstDayOfWeek = useMemo(() => {
    const d = new Date(month.year, month.month - 1, 1).getDay()
    return d === 0 ? 6 : d - 1
  }, [month.year, month.month])

  const daysInMonth = new Date(month.year, month.month, 0).getDate()

  const today = new Date()
  const isCurrentMonth = today.getFullYear() === month.year && today.getMonth() + 1 === month.month
  const todayDay = isCurrentMonth ? today.getDate() : -1

  const getCategoryColor = (item: BudgetItem) =>
    month.categories.find((c) => c.id === item.categoryId)?.color ?? '#94a3b8'

  const selectedDayItems = selectedDay ? (itemsByDay.get(selectedDay) ?? []) : []

  return (
    <div className="flex flex-col gap-3">
      {/* Calendar grid */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
          {DAY_HEADERS.map((d, i) => (
            <div key={i} className="py-2 text-center text-[11px] font-semibold text-slate-400">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {/* Leading empty cells */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`e-${i}`} className="min-h-[56px] bg-slate-50/60 border-b border-r border-slate-100" />
          ))}

          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
            const dayItems = itemsByDay.get(day) ?? []
            const isSelected = selectedDay === day
            const isToday = day === todayDay

            // Day net for coloring
            const net = dayItems.reduce(
              (s, i) => s + (i.type === 'INCOME' ? i.amount : -i.amount), 0
            )

            return (
              <div
                key={day}
                onClick={() => setSelectedDay(isSelected ? null : day)}
                className={[
                  'min-h-[56px] border-b border-r border-slate-100 p-1.5 cursor-pointer transition-colors relative',
                  isSelected ? 'bg-indigo-50 border-indigo-100' : 'hover:bg-slate-50',
                ].join(' ')}
              >
                {/* Day number */}
                <div className={[
                  'text-[11px] font-semibold w-5 h-5 flex items-center justify-center rounded-full mb-1',
                  isToday ? 'bg-indigo-600 text-white' : 'text-slate-500',
                ].join(' ')}>
                  {day}
                </div>

                {/* Item dots */}
                {dayItems.length > 0 && (
                  <div className="flex flex-wrap gap-0.5">
                    {dayItems.slice(0, 5).map((item) => (
                      <div
                        key={item.id}
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{
                          backgroundColor: item.type === 'INCOME' ? '#22c55e' : getCategoryColor(item),
                        }}
                        title={item.name}
                      />
                    ))}
                    {dayItems.length > 5 && (
                      <span className="text-[9px] text-slate-400 leading-none self-end">
                        +{dayItems.length - 5}
                      </span>
                    )}
                  </div>
                )}

                {/* Day net badge */}
                {dayItems.length > 0 && (
                  <div className={[
                    'absolute bottom-1 right-1 text-[9px] font-semibold',
                    net >= 0 ? 'text-emerald-500' : 'text-rose-400',
                  ].join(' ')}>
                    {net >= 0 ? '+' : ''}{net.toFixed(0)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Selected day detail */}
      {selectedDay !== null && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-2.5 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-indigo-800">
              {selectedDay} {getMonthName(month.month, language)} {month.year}
            </p>
            <button
              onClick={() => setSelectedDay(null)}
              className="text-indigo-400 hover:text-indigo-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {selectedDayItems.length === 0 ? (
            <p className="px-4 py-4 text-sm text-slate-400 text-center">Nessuna voce per questo giorno</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {selectedDayItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onEdit(item)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer"
                >
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: getCategoryColor(item) }}
                  />
                  <span className="flex-1 text-sm text-slate-700">{item.name}</span>
                  {item.paid && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-600 rounded-full">
                      pagata
                    </span>
                  )}
                  <span className={`text-sm font-semibold shrink-0 ${item.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {item.type === 'INCOME' ? '+' : '−'}{formatCurrency(item.amount, month.currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Undated items */}
      {undatedItems.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Senza data</p>
          </div>
          <div className="divide-y divide-slate-100">
            {undatedItems.map((item) => (
              <div
                key={item.id}
                onClick={() => onEdit(item)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer"
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: getCategoryColor(item) }}
                />
                <span className="flex-1 text-sm text-slate-700">{item.name}</span>
                <span className={`text-sm font-semibold shrink-0 ${item.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {item.type === 'INCOME' ? '+' : '−'}{formatCurrency(item.amount, month.currency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
