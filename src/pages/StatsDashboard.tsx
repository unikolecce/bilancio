import React, { useMemo, useState } from 'react'
import { useAppStore, selectSortedMonths } from '../store/appStore'
import { useTranslation } from '../i18n/useTranslation'
import { formatCurrency } from '../utils/currency'
import { getMonthName } from '../utils/dateUtils'
import { computeMonthSummary, computeCategorySummaries } from '../utils/calculations'

// ─── Pure-CSS pie chart ────────────────────────────────────────────────────────

interface PieSlice {
  color: string
  pct: number  // 0-100
}

const PieChart: React.FC<{ slices: PieSlice[]; size?: number }> = ({ slices, size = 160 }) => {
  // Build conic-gradient stops
  let cumulative = 0
  const stops = slices.map(({ color, pct }) => {
    const start = cumulative
    cumulative += pct
    return `${color} ${start.toFixed(1)}% ${cumulative.toFixed(1)}%`
  })

  if (stops.length === 0) {
    return (
      <div
        style={{ width: size, height: size, borderRadius: '50%', background: '#e2e8f0' }}
      />
    )
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `conic-gradient(${stops.join(', ')})`,
      }}
    />
  )
}

// ─── Horizontal bar ────────────────────────────────────────────────────────────

const Bar: React.FC<{ color: string; pct: number; label: string; value: string }> = ({
  color, pct, label, value,
}) => (
  <div className="flex items-center gap-3">
    <div className="w-24 text-xs text-slate-600 truncate shrink-0">{label}</div>
    <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
      <div
        className="h-2 rounded-full transition-all duration-500"
        style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }}
      />
    </div>
    <div className="w-20 text-xs text-slate-700 text-right shrink-0">{value}</div>
  </div>
)

// ─── StatsDashboard ────────────────────────────────────────────────────────────

export const StatsDashboard: React.FC = () => {
  const { t, language } = useTranslation()
  const months = useAppStore(selectSortedMonths)
  const settings = useAppStore((s) => s.settings)

  // Default to most recent month; fall back to 'all' only if no months exist
  const [selectedMonthId, setSelectedMonthId] = useState<string | 'all'>(months[0]?.id ?? 'all')

  const selectedMonths = useMemo(() => {
    if (selectedMonthId === 'all') return months
    return months.filter((m) => m.id === selectedMonthId)
  }, [months, selectedMonthId])

  // Aggregate income/expenses across selected months
  const totals = useMemo(() => {
    let income = 0
    let expenses = 0
    for (const m of selectedMonths) {
      const s = computeMonthSummary(m)
      income += s.totalIncome
      expenses += s.totalExpenses
    }
    return { income, expenses, balance: income - expenses }
  }, [selectedMonths])

  // Aggregate expenses by category across selected months
  const categoryData = useMemo(() => {
    const map = new Map<string, { name: string; color: string; expenses: number; income: number }>()
    for (const m of selectedMonths) {
      const summaries = computeCategorySummaries(m)
      for (const s of summaries) {
        const existing = map.get(s.name) // group by name (not id, since ids differ per month)
        if (existing) {
          existing.expenses += s.totalExpenses
          existing.income += s.totalIncome
        } else {
          map.set(s.name, {
            name: s.name,
            color: s.color,
            expenses: s.totalExpenses,
            income: s.totalIncome,
          })
        }
      }
    }
    return [...map.values()].sort((a, b) => b.expenses - a.expenses)
  }, [selectedMonths])

  // Pie slices for expense distribution
  const pieSlices = useMemo<PieSlice[]>(() => {
    const total = categoryData.reduce((s, c) => s + c.expenses, 0)
    if (total === 0) return []
    return categoryData
      .filter((c) => c.expenses > 0)
      .map((c) => ({ color: c.color, pct: (c.expenses / total) * 100 }))
  }, [categoryData])

  // Monthly trend (last 6 months, oldest → newest)
  const trendMonths = useMemo(() => {
    return [...months].reverse().slice(-6)
  }, [months])

  const maxTrendVal = useMemo(() => {
    return Math.max(
      ...trendMonths.map((m) => {
        const s = computeMonthSummary(m)
        return Math.max(s.totalIncome, s.totalExpenses)
      }),
      1
    )
  }, [trendMonths])

  const currency = settings.currency

  if (months.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center gap-4">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
          <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p className="text-slate-500">{t('stats.noData')}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-slate-900">{t('stats.title')}</h1>

        {/* Period picker */}
        <select
          value={selectedMonthId}
          onChange={(e) => setSelectedMonthId(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="all">{t('stats.allMonths')}</option>
          {months.map((m) => (
            <option key={m.id} value={m.id}>
              {getMonthName(m.month, language)} {m.year}
            </option>
          ))}
        </select>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-50 rounded-xl p-4">
          <p className="text-xs text-emerald-600 font-medium mb-1">{t('summary.totalIncome')}</p>
          <p className="text-lg font-bold text-emerald-700">{formatCurrency(totals.income, currency)}</p>
        </div>
        <div className="bg-rose-50 rounded-xl p-4">
          <p className="text-xs text-rose-600 font-medium mb-1">{t('summary.totalExpenses')}</p>
          <p className="text-lg font-bold text-rose-700">{formatCurrency(totals.expenses, currency)}</p>
        </div>
        <div className={`rounded-xl p-4 ${totals.balance >= 0 ? 'bg-indigo-50' : 'bg-orange-50'}`}>
          <p className={`text-xs font-medium mb-1 ${totals.balance >= 0 ? 'text-indigo-600' : 'text-orange-600'}`}>
            {t('summary.balance')}
          </p>
          <p className={`text-lg font-bold ${totals.balance >= 0 ? 'text-indigo-700' : 'text-orange-700'}`}>
            {totals.balance >= 0 ? '+' : ''}{formatCurrency(totals.balance, currency)}
          </p>
        </div>
      </div>

      {/* Expenses by category */}
      {categoryData.some((c) => c.expenses > 0) && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-5">{t('stats.expensesByCategory')}</h2>

          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            {/* Pie chart */}
            <div className="shrink-0">
              <PieChart slices={pieSlices} size={140} />
            </div>

            {/* Legend + bars */}
            <div className="flex flex-col gap-3 flex-1 w-full">
              {categoryData
                .filter((c) => c.expenses > 0)
                .map((cat) => {
                  const total = categoryData.reduce((s, c) => s + c.expenses, 0)
                  const pct = total > 0 ? (cat.expenses / total) * 100 : 0
                  return (
                    <div key={cat.name} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="text-xs text-slate-600">{cat.name}</span>
                        </div>
                        <span className="text-xs font-medium text-slate-700">
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full"
                            style={{ width: `${pct}%`, backgroundColor: cat.color }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 w-20 text-right shrink-0">
                          {formatCurrency(cat.expenses, currency)}
                        </span>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        </div>
      )}

      {/* Monthly trend */}
      {trendMonths.length > 1 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-5">{t('stats.monthlyTrend')}</h2>

          {/* Bar chart */}
          <div className="flex items-end gap-2 h-32">
            {trendMonths.map((m) => {
              const s = computeMonthSummary(m)
              const incPct = (s.totalIncome / maxTrendVal) * 100
              const expPct = (s.totalExpenses / maxTrendVal) * 100
              return (
                <div key={m.id} className="flex-1 flex flex-col items-center gap-1">
                  <div className="flex items-end gap-0.5 h-24 w-full">
                    {/* Income bar */}
                    <div className="flex-1 flex flex-col justify-end">
                      <div
                        className="bg-emerald-400 rounded-t-sm transition-all duration-500"
                        style={{ height: `${incPct}%` }}
                        title={`Entrate: ${formatCurrency(s.totalIncome, currency)}`}
                      />
                    </div>
                    {/* Expense bar */}
                    <div className="flex-1 flex flex-col justify-end">
                      <div
                        className="bg-rose-400 rounded-t-sm transition-all duration-500"
                        style={{ height: `${expPct}%` }}
                        title={`Uscite: ${formatCurrency(s.totalExpenses, currency)}`}
                      />
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 text-center leading-tight">
                    {getMonthName(m.month, language).slice(0, 3)}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-emerald-400 rounded-sm" />
              <span className="text-xs text-slate-500">{t('summary.totalIncome')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-rose-400 rounded-sm" />
              <span className="text-xs text-slate-500">{t('summary.totalExpenses')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Top categories table */}
      {categoryData.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">{t('stats.topCategories')}</h2>
          <div className="flex flex-col gap-2">
            {categoryData.map((cat) => (
              <div key={cat.name} className="flex items-center gap-3 py-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="flex-1 text-sm text-slate-700">{cat.name}</span>
                {cat.income > 0 && (
                  <span className="text-xs text-emerald-600 font-medium">
                    +{formatCurrency(cat.income, currency)}
                  </span>
                )}
                {cat.expenses > 0 && (
                  <span className="text-xs text-rose-600 font-medium">
                    -{formatCurrency(cat.expenses, currency)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
