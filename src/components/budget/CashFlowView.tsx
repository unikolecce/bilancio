import React, { useMemo } from 'react'
import type { BudgetItem, BudgetMonth } from '../../models/types'
import { filterItems } from '../../utils/calculations'
import { formatCurrency } from '../../utils/currency'

const today = new Date()
today.setHours(0, 0, 0, 0)
const isPast = (date?: string) => !!date && new Date(date) <= today

interface CashFlowViewProps {
  month: BudgetMonth
  categoryId: string | null
  search: string
  onEdit(item: BudgetItem): void
}

export const CashFlowView: React.FC<CashFlowViewProps> = ({ month, categoryId, search, onEdit }) => {
  const filteredItems = useMemo(
    () => filterItems(month.items, { categoryId, search }),
    [month.items, categoryId, search]
  )

  // Dated items sorted ascending by date
  const datedItems = useMemo(
    () => [...filteredItems.filter((i) => i.date)].sort((a, b) => a.date!.localeCompare(b.date!)),
    [filteredItems]
  )

  // Undated items
  const undatedIncome = useMemo(() => filteredItems.filter((i) => !i.date && i.type === 'INCOME'), [filteredItems])
  const undatedExpense = useMemo(() => filteredItems.filter((i) => !i.date && i.type === 'EXPENSE'), [filteredItems])

  // Group dated items by date string
  const groups = useMemo<[string, BudgetItem[]][]>(() => {
    const map = new Map<string, BudgetItem[]>()
    for (const item of datedItems) {
      const list = map.get(item.date!) ?? []
      list.push(item)
      map.set(item.date!, list)
    }
    return [...map.entries()]
  }, [datedItems])

  // Pre-compute running balance for every item in display order (avoids mutation during render)
  const runningMap = useMemo<Map<string, number>>(() => {
    const map = new Map<string, number>()
    let acc = 0
    const displayOrder = [...undatedIncome, ...datedItems, ...undatedExpense]
    for (const item of displayOrder) {
      acc += item.type === 'INCOME' ? item.amount : -item.amount
      map.set(item.id, acc)
    }
    return map
  }, [undatedIncome, undatedExpense, datedItems])

  const finalBalance = useMemo(() => {
    const last = [...runningMap.values()]
    return last.length > 0 ? last[last.length - 1] : 0
  }, [runningMap])

  const getCategoryColor = (item: BudgetItem) =>
    month.categories.find((c) => c.id === item.categoryId)?.color ?? '#94a3b8'

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00')
    const now = new Date()
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    const label = d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })
    return isToday ? `${label} · Oggi` : label
  }

  if (filteredItems.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 px-4 py-10 text-center">
        <p className="text-sm text-slate-400">Nessuna voce trovata</p>
      </div>
    )
  }

  const ItemRow = ({ item }: { item: BudgetItem }) => {
    const snap = runningMap.get(item.id) ?? 0
    return (
      <div
        onClick={() => onEdit(item)}
        className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0"
      >
        {/* Color dot */}
        <div
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: item.type === 'INCOME' ? '#22c55e' : getCategoryColor(item) }}
        />

        {/* Name + badge */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-700 truncate">{item.name}</p>
          {item.planned && item.type === 'EXPENSE' && !isPast(item.date) && (
            <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-600 rounded-full">
              pianificata
            </span>
          )}
        </div>

        {/* Amount */}
        <span className={`text-sm font-semibold shrink-0 ${item.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
          {item.type === 'INCOME' ? '+' : '−'}{formatCurrency(item.amount, month.currency)}
        </span>

        {/* Running balance */}
        <span className={`text-xs w-24 text-right shrink-0 tabular-nums ${snap >= 0 ? 'text-slate-400' : 'text-rose-400'}`}>
          {formatCurrency(snap, month.currency)}
        </span>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Column header */}
      <div className="grid grid-cols-[1fr_auto_auto] px-4 py-2 bg-slate-50 border-b border-slate-200">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Voce</span>
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide w-20 text-right">Importo</span>
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide w-24 text-right">Saldo</span>
      </div>

      {/* Undated income */}
      {undatedIncome.length > 0 && (
        <>
          <div className="px-4 py-2 bg-emerald-50/60 border-b border-slate-100">
            <p className="text-xs font-semibold text-emerald-700">Entrate senza data</p>
          </div>
          {undatedIncome.map((item) => <ItemRow key={item.id} item={item} />)}
        </>
      )}

      {/* Dated groups */}
      {groups.map(([date, items]) => {
        const dayNet = items.reduce(
          (s, i) => s + (i.type === 'INCOME' ? i.amount : -i.amount),
          0
        )
        return (
          <React.Fragment key={date}>
            <div className="px-4 py-2 bg-slate-50/70 border-b border-slate-100 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-600">{formatDateLabel(date)}</p>
              <span className={`text-xs font-medium ${dayNet >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {dayNet >= 0 ? '+' : ''}{formatCurrency(dayNet, month.currency)}
              </span>
            </div>
            {items.map((item) => <ItemRow key={item.id} item={item} />)}
          </React.Fragment>
        )
      })}

      {/* Undated expenses — at end of month */}
      {undatedExpense.length > 0 && (
        <>
          <div className="px-4 py-2 bg-slate-50/70 border-b border-slate-100 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500">Uscite ricorrenti</p>
          </div>
          {undatedExpense.map((item) => <ItemRow key={item.id} item={item} />)}
        </>
      )}

      {/* Final balance footer */}
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Saldo finale</span>
        <span className={`text-sm font-bold tabular-nums ${finalBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
          {finalBalance >= 0 ? '+' : ''}{formatCurrency(finalBalance, month.currency)}
        </span>
      </div>
    </div>
  )
}
