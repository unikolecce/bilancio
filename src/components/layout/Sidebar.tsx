import React from 'react'
import { NavLink, useNavigate, useParams } from 'react-router-dom'
import { useAppStore, selectSortedMonths, formatYearMonth } from '../../store/appStore'
import { useTranslation } from '../../i18n/useTranslation'
import { getCurrentYearMonth, nextMonth } from '../../utils/dateUtils'
import { MonthPicker } from '../budget/MonthPicker'
import { Button } from '../ui/Button'

interface SidebarProps {
  onClose?(): void
}

export const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { yearMonth } = useParams<{ yearMonth: string }>()
  const months = useAppStore(selectSortedMonths)
  const { createMonth, applyTemplateToMonth, clearAllData } = useAppStore((s) => ({
    createMonth: s.createMonth,
    applyTemplateToMonth: s.applyTemplateToMonth,
    clearAllData: s.clearAllData,
  }))

  // Month currently viewed in the URL (used for "Applica template")
  const currentMonth = yearMonth
    ? months.find((m) => formatYearMonth(m.year, m.month) === yearMonth)
    : undefined

  // Default nav target: current calendar month if it exists, otherwise most recent existing month
  const calendarYM = formatYearMonth(
    getCurrentYearMonth().year,
    getCurrentYearMonth().month
  )
  const dashboardYM = months.some((m) => formatYearMonth(m.year, m.month) === calendarYM)
    ? calendarYM
    : months[0]
      ? formatYearMonth(months[0].year, months[0].month)
      : calendarYM

  const [msg, setMsg] = React.useState<string | null>(null)

  const showMsg = (text: string) => {
    setMsg(text)
    setTimeout(() => setMsg(null), 2500)
  }

  // Single smart "Nuovo mese" button:
  // - If no months exist → create current calendar month
  // - Otherwise → create the month after the most recent existing month
  const handleNewMonth = () => {
    let year: number, month: number
    if (months.length === 0) {
      const curr = getCurrentYearMonth()
      year = curr.year
      month = curr.month
    } else {
      const newest = months[0] // selectSortedMonths is sorted desc
      const nxt = nextMonth(newest.year, newest.month)
      year = nxt.year
      month = nxt.month
    }
    try {
      const id = createMonth(year, month)
      applyTemplateToMonth(id)
      navigate(`/month/${formatYearMonth(year, month)}`)
      showMsg(t('messages.monthCreated'))
    } catch {
      showMsg(t('messages.monthAlreadyExists'))
    }
    onClose?.()
  }

  const handleApplyTemplate = () => {
    if (!currentMonth) return
    if (!window.confirm('Applicare il template? Tutte le voci e categorie del mese verranno sostituite con le Voci Ricorrenti.')) return
    applyTemplateToMonth(currentMonth.id)
    showMsg(t('messages.templateApplied'))
    onClose?.()
  }

  const navItems = [
    {
      to: `/month/${dashboardYM}`,
      labelKey: 'nav.dashboard' as const,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      to: '/template',
      labelKey: 'nav.template' as const,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
    },
    {
      to: '/stats',
      labelKey: 'nav.stats' as const,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      to: '/savings',
      labelKey: 'nav.savings' as const,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      to: '/settings',
      labelKey: 'nav.settings' as const,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ]

  return (
    <aside className="flex flex-col h-full bg-slate-900 text-slate-100 w-64 px-3 py-5 gap-4 overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-2 mb-1">
        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
          ₿
        </div>
        <span className="font-bold text-white text-base tracking-tight">Budget Planner</span>
      </div>

      {/* Month picker */}
      {months.length > 0 && (
        <div className="px-1">
          <MonthPicker currentYearMonth={yearMonth ?? dashboardYM} />
        </div>
      )}

      {/* Month actions */}
      <div className="flex flex-col gap-1.5 px-1">
        <Button
          variant="ghost"
          size="sm"
          fullWidth
          onClick={handleNewMonth}
          className="text-indigo-300 hover:text-white hover:bg-indigo-700 justify-start"
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          }
        >
          {t('actions.newMonth')}
        </Button>

        {currentMonth && (
          <Button
            variant="ghost"
            size="sm"
            fullWidth
            onClick={handleApplyTemplate}
            className="text-slate-300 hover:text-white hover:bg-slate-700 justify-start"
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            }
          >
            {t('actions.applyTemplate')}
          </Button>
        )}
      </div>

      {/* Toast message */}
      {msg && (
        <div className="px-3 py-2 bg-slate-700 rounded-lg text-xs text-slate-100 text-center">
          {msg}
        </div>
      )}

      {/* Divider */}
      <div className="h-px bg-slate-700 mx-2" />

      {/* Nav links */}
      <nav className="flex flex-col gap-0.5">
        {navItems.map(({ to, labelKey, icon }) => (
          <NavLink
            key={labelKey}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800',
              ].join(' ')
            }
          >
            {icon}
            {t(labelKey)}
          </NavLink>
        ))}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Reset button */}
      <div className="px-1">
        <button
          onClick={() => {
            if (window.confirm(t('messages.clearConfirm'))) {
              clearAllData()
              navigate('/template')
              onClose?.()
            }
          }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-600
            hover:text-rose-400 hover:bg-slate-800 transition-colors"
        >
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Reset dati
        </button>
      </div>

      {/* Footer */}
      <p className="px-3 text-xs text-slate-700">v0.2.0</p>
    </aside>
  )
}
