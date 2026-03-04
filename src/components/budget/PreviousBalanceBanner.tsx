import React, { useMemo, useState } from 'react'
import type { BudgetMonth } from '../../models/types'
import { useAppStore, selectSortedMonths } from '../../store/appStore'
import { useTranslation } from '../../i18n/useTranslation'
import { formatCurrency } from '../../utils/currency'
import { getMonthName } from '../../utils/dateUtils'

interface PreviousBalanceBannerProps {
  month: BudgetMonth
}

export const PreviousBalanceBanner: React.FC<PreviousBalanceBannerProps> = ({ month }) => {
  const { t, language } = useTranslation()
  const months = useAppStore(selectSortedMonths)
  const importPreviousBalance = useAppStore((s) => s.importPreviousBalance)
  const [dismissed, setDismissed] = useState(false)

  const prevData = useMemo(() => {
    // Find items already imported from previous balance (to avoid showing banner again)
    const alreadyImported = month.items.some(
      (i) => i.type === 'INCOME' && i.name.startsWith('Saldo ')
    )
    if (alreadyImported) return null

    const prevMonth = months
      .filter((m) => m.year < month.year || (m.year === month.year && m.month < month.month))
      .sort((a, b) => b.year !== a.year ? b.year - a.year : b.month - a.month)[0]

    if (!prevMonth) return null

    const income = prevMonth.items
      .filter((i) => i.type === 'INCOME')
      .reduce((s, i) => s + i.amount, 0)
    const expenses = prevMonth.items
      .filter((i) => i.type === 'EXPENSE')
      .reduce((s, i) => s + i.amount, 0)
    const balance = income - expenses

    if (balance <= 0) return null

    return {
      balance,
      currency: prevMonth.currency,
      monthName: `${getMonthName(prevMonth.month, language)} ${prevMonth.year}`,
    }
  }, [month, months, language])

  if (!prevData || dismissed) return null

  const handleImport = () => {
    importPreviousBalance(month.id)
    setDismissed(true)
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl">
      <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
        <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-emerald-800">{t('previousBalance.title')}</p>
        <p className="text-xs text-emerald-600 truncate">
          {prevData.monthName}: {t('previousBalance.description')}{' '}
          <span className="font-semibold">
            +{formatCurrency(prevData.balance, prevData.currency)}
          </span>
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleImport}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium
            rounded-lg transition-colors"
        >
          {t('previousBalance.importButton')}
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 text-emerald-400 hover:text-emerald-600 transition-colors"
          aria-label="Chiudi"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
