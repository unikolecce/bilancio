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
  description: string
}> = ({ tone, title, description }) => (
  <div
    className={[
      'rounded-xl border px-4 py-3',
      tone === 'danger'
        ? 'bg-rose-50 border-rose-200 text-rose-800'
        : 'bg-amber-50 border-amber-200 text-amber-800',
    ].join(' ')}
  >
    <p className="text-sm font-semibold">{title}</p>
    <p className="text-xs mt-1 opacity-90">{description}</p>
  </div>
)

export const BudgetAlerts: React.FC<BudgetAlertsProps> = ({ month }) => {
  const { t } = useTranslation()
  const summary = computeMonthSummary(month)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const in3Days = new Date(today)
  in3Days.setDate(in3Days.getDate() + 3)

  const overdue = month.items.filter((item) => {
    if (item.type !== 'EXPENSE' || !item.planned || item.paid || !item.date) return false
    const d = new Date(item.date)
    d.setHours(0, 0, 0, 0)
    return d < today
  })

  const dueSoon = month.items.filter((item) => {
    if (item.type !== 'EXPENSE' || !item.planned || item.paid || !item.date) return false
    const d = new Date(item.date)
    d.setHours(0, 0, 0, 0)
    return d >= today && d <= in3Days
  })

  if (summary.balance >= 0 && overdue.length === 0 && dueSoon.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      {summary.balance < 0 && (
        <AlertCard
          tone="danger"
          title={t('alerts.negativeBalanceTitle')}
          description={`${t('alerts.negativeBalanceDescription')} ${formatCurrency(Math.abs(summary.balance), month.currency)}`}
        />
      )}

      {overdue.length > 0 && (
        <AlertCard
          tone="danger"
          title={t('alerts.overdueTitle')}
          description={`${overdue.length} ${t('alerts.itemsDue')}`}
        />
      )}

      {dueSoon.length > 0 && (
        <AlertCard
          tone="warning"
          title={t('alerts.dueSoonTitle')}
          description={`${dueSoon.length} ${t('alerts.itemsDue')}`}
        />
      )}
    </div>
  )
}
