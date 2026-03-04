import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore, selectSortedMonths } from '../../store/appStore'
import { useTranslation } from '../../i18n/useTranslation'
import { formatYearMonth, getMonthName } from '../../utils/dateUtils'

interface MonthPickerProps {
  currentYearMonth: string // 'YYYY-MM'
}

export const MonthPicker: React.FC<MonthPickerProps> = ({ currentYearMonth }) => {
  const { language } = useTranslation()
  const months = useAppStore(selectSortedMonths)
  const navigate = useNavigate()

  if (months.length === 0) return null

  return (
    <div className="relative">
      <select
        value={currentYearMonth}
        onChange={(e) => navigate(`/month/${e.target.value}`)}
        className="w-full appearance-none bg-slate-800 text-white rounded-lg px-3 py-2 text-sm
          pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer"
      >
        {months.map((m) => {
          const ym = formatYearMonth(m.year, m.month)
          const label = `${getMonthName(m.month, language)} ${m.year}`
          return (
            <option key={m.id} value={ym}>
              {label}
            </option>
          )
        })}
      </select>

      {/* Chevron icon */}
      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </span>
    </div>
  )
}
