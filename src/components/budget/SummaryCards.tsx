import React from 'react'
import type { BudgetMonth } from '../../models/types'
import { computeMonthSummary } from '../../utils/calculations'
import { formatCurrency } from '../../utils/currency'
import { useTranslation } from '../../i18n/useTranslation'

interface SummaryCardsProps {
  month: BudgetMonth
}

interface CardProps {
  label: string
  amount: number
  currency: string
  colorClass: string
  bgClass: string
  icon: React.ReactNode
  percent?: number
}

const Card: React.FC<CardProps> = ({
  label,
  amount,
  currency,
  colorClass,
  bgClass,
  icon,
  percent,
}) => (
  <div className={`rounded-xl p-4 ${bgClass} flex flex-col gap-2`}>
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium uppercase tracking-wide opacity-70">{label}</span>
      <span className={`text-lg ${colorClass} opacity-80`}>{icon}</span>
    </div>
    <p className={`text-2xl font-bold tabular-nums ${colorClass}`}>
      {formatCurrency(amount, currency as never)}
    </p>
    {percent !== undefined && (
      <div className="h-1.5 bg-black/10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-current opacity-50 transition-all"
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>
    )}
  </div>
)

export const SummaryCards: React.FC<SummaryCardsProps> = ({ month }) => {
  const { t } = useTranslation()
  const s = computeMonthSummary(month)

  const balancePositive = s.balance >= 0

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Entrate totali */}
      <Card
        label={t('summary.totalIncome')}
        amount={s.totalIncome}
        currency={month.currency}
        colorClass="text-emerald-700"
        bgClass="bg-emerald-50"
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 4v16m8-8H4" />
          </svg>
        }
      />
      {/* Uscite già uscite dal conto (data passata o marcate pagate) */}
      <Card
        label={t('summary.paidExpenses')}
        amount={s.paidExpenses}
        currency={month.currency}
        colorClass="text-rose-700"
        bgClass="bg-rose-50"
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
      {/* Saldo previsto = entrate - tutte le uscite */}
      <Card
        label={t('summary.balance')}
        amount={Math.abs(s.balance)}
        currency={month.currency}
        colorClass={balancePositive ? 'text-indigo-700' : 'text-rose-700'}
        bgClass={balancePositive ? 'bg-indigo-50' : 'bg-rose-100'}
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
          </svg>
        }
      />
      {/* Spese pianificate non ancora pagate */}
      <Card
        label={t('summary.plannedRemaining')}
        amount={s.plannedRemaining}
        currency={month.currency}
        colorClass="text-amber-700"
        bgClass="bg-amber-50"
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
    </div>
  )
}
