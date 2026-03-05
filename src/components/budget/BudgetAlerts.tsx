import React from 'react'
import type { BudgetMonth } from '../../models/types'
import { computeMonthSummary } from '../../utils/calculations'
import { formatCurrency } from '../../utils/currency'
import { useTranslation } from '../../i18n/useTranslation'

interface BudgetAlertsProps {
  month: BudgetMonth
}

const AlertCard: React.FC<{
  tone: 'danger' | 'warning'
  title: string
  items: string[]
}> = ({ tone, title, items }) => (
  <div
    className={[
      'rounded-xl border px-4 py-3',
      tone === 'danger'
        ? 'bg-rose-50 border-rose-200 text-rose-800'
        : 'bg-amber-50 border-amber-200 text-amber-800',
    ].join(' ')}
  >
    <p className="text-sm font-semibold">{title}</p>
    <ul className="mt-1 flex flex-col gap-0.5">
      {items.map((name, i) => (
        <li key={i} className="text-xs opacity-90">· {name}</li>
      ))}
    </ul>
  </div>
)

export const BudgetAlerts: React.FC<BudgetAlertsProps> = ({ month }) => {
  const { t } = useTranslation()
  const summary = computeMonthSummary(month)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const in3Days = new Date(today)
  in3Days.setDate(in3Days.getDate() + 3)

  const dueSoon = month.items.filter((item) => {
    if (item.type !== 'EXPENSE' || !item.planned || item.paid || !item.date) return false
    const d = new Date(item.date)
    d.setHours(0, 0, 0, 0)
    return d >= today && d <= in3Days
  })

  if (summary.balance >= 0 && dueSoon.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      {summary.balance < 0 && (
        <AlertCard
          tone="danger"
          title={t('alerts.negativeBalanceTitle')}
          items={[`${t('alerts.negativeBalanceDescription')} ${formatCurrency(Math.abs(summary.balance), month.currency)}`]}
        />
      )}

      {dueSoon.length > 0 && (
        <AlertCard
          tone="warning"
          title={t('alerts.dueSoonTitle')}
          items={dueSoon.map((i) => i.name)}
        />
      )}
    </div>
  )
}
