import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppStore, selectSortedMonths, formatYearMonth } from '../store/appStore'
import { useTranslation } from '../i18n/useTranslation'
import { parseYearMonth, getCurrentYearMonth, getMonthName } from '../utils/dateUtils'
import { SummaryCards } from '../components/budget/SummaryCards'
import { CategoryTabs } from '../components/budget/CategoryTabs'
import { ItemList } from '../components/budget/ItemList'
import { CalendarView } from '../components/budget/CalendarView'
import { CashFlowView } from '../components/budget/CashFlowView'
import { ItemFormModal } from '../components/budget/ItemFormModal'
import { QuickAddForm } from '../components/budget/QuickAddForm'
import { PreviousBalanceBanner } from '../components/budget/PreviousBalanceBanner'
import { BudgetAlerts } from '../components/budget/BudgetAlerts'
import { QuickSavingsDeposit } from '../components/budget/QuickSavingsDeposit'
import { Button } from '../components/ui/Button'
import type { BudgetItem } from '../models/types'

type ViewMode = 'list' | 'calendar' | 'cashflow'

const VIEW_OPTIONS: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
  {
    id: 'list',
    label: 'Lista',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
  },
  {
    id: 'calendar',
    label: 'Calendario',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'cashflow',
    label: 'Flusso',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
]

export const DashboardMonth: React.FC = () => {
  const { yearMonth } = useParams<{ yearMonth: string }>()
  const navigate = useNavigate()
  const { t, language } = useTranslation()

  const months = useAppStore(selectSortedMonths)
  const createMonth = useAppStore((s) => s.createMonth)
  const applyTemplateToMonth = useAppStore((s) => s.applyTemplateToMonth)

  // Parse URL param
  const parsed = yearMonth ? parseYearMonth(yearMonth) : null
  const year = parsed?.year ?? getCurrentYearMonth().year
  const month = parsed?.month ?? getCurrentYearMonth().month

  const budgetMonth = useAppStore((s) => s.getMonth(year, month))

  // UI state
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [onlyPlannedUnpaid, setOnlyPlannedUnpaid] = useState(false)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<BudgetItem | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  const handleEdit = (item: BudgetItem) => {
    setEditItem(item)
    setAddModalOpen(true)
  }

  // ─── Month doesn't exist yet ───────────────────────────────────────────────
  if (!budgetMonth) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-1">
            {getMonthName(month, language)} {year}
          </h2>
          <p className="text-slate-500 text-sm mb-6">
            {months.length === 0
              ? t('summary.noMonths')
              : 'Questo mese non esiste ancora.'}
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={() => {
              try {
                const id = createMonth(year, month)
                applyTemplateToMonth(id)
              } catch {
                // already exists, just navigate
              }
              navigate(`/month/${formatYearMonth(year, month)}`)
            }}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            {t('actions.createMonth')}
          </Button>
        </div>

        {months.length > 0 && (
          <div className="w-full max-w-xs">
            <p className="text-sm text-slate-500 text-center mb-3">o vai a un mese esistente:</p>
            <div className="flex flex-col gap-2">
              {months.slice(0, 5).map((m) => (
                <button
                  key={m.id}
                  onClick={() => navigate(`/month/${formatYearMonth(m.year, m.month)}`)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
                >
                  {getMonthName(m.month, language)} {m.year}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const monthName = `${getMonthName(budgetMonth.month, language)} ${budgetMonth.year}`

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6 max-w-5xl mx-auto w-full">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{monthName}</h1>
          <p className="text-sm text-slate-500">
            {budgetMonth.items.length} voci · {budgetMonth.currency}
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setAddModalOpen(true)}
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          }
        >
          {t('actions.addItem')}
        </Button>
      </div>

      {/* Previous month balance banner */}
      <PreviousBalanceBanner month={budgetMonth} />

      {/* In-app alerts */}
      <BudgetAlerts month={budgetMonth} />

      {/* Summary cards */}
      <SummaryCards month={budgetMonth} />

      {/* Quick add form */}
      {budgetMonth.categories.length > 0 && (
        <QuickAddForm month={budgetMonth} defaultCategoryId={activeCategoryId ?? undefined} />
      )}

      {/* Quick savings deposit */}
      <QuickSavingsDeposit month={budgetMonth} />

      {/* Filters + view toggle */}
      <div className="flex flex-col gap-2">
        {/* Category tabs */}
        {budgetMonth.categories.length > 0 && (
          <CategoryTabs
            month={budgetMonth}
            activeCategoryId={activeCategoryId}
            onChange={setActiveCategoryId}
          />
        )}

        {/* Search + filter + view toggle row */}
        <div className="flex gap-2 items-center">
          {/* Search */}
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('form.search')}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-sm
                focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* Planned/unpaid filter — hidden in calendar/cashflow */}
          {viewMode === 'list' && (
            <button
              onClick={() => setOnlyPlannedUnpaid((v) => !v)}
              className={[
                'flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors whitespace-nowrap',
                onlyPlannedUnpaid
                  ? 'bg-amber-100 border-amber-300 text-amber-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300',
              ].join(' ')}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="hidden sm:inline">{t('filter.onlyPlannedUnpaid')}</span>
            </button>
          )}

          {/* View mode toggle */}
          <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-white shrink-0">
            {VIEW_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setViewMode(opt.id)}
                title={opt.label}
                className={[
                  'flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium transition-colors',
                  viewMode === opt.id
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-500 hover:bg-slate-50',
                ].join(' ')}
              >
                {opt.icon}
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content area — switches by view mode */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <ItemList
            month={budgetMonth}
            categoryId={activeCategoryId}
            search={search}
            onlyPlannedUnpaid={onlyPlannedUnpaid}
            onEdit={handleEdit}
          />
        </div>
      )}

      {viewMode === 'calendar' && (
        <CalendarView
          month={budgetMonth}
          categoryId={activeCategoryId}
          search={search}
          onEdit={handleEdit}
        />
      )}

      {viewMode === 'cashflow' && (
        <CashFlowView
          month={budgetMonth}
          categoryId={activeCategoryId}
          search={search}
          onEdit={handleEdit}
        />
      )}

      {/* Add/Edit modal */}
      <ItemFormModal
        open={addModalOpen}
        onClose={() => {
          setAddModalOpen(false)
          setEditItem(null)
        }}
        month={budgetMonth}
        editItem={editItem}
        defaultCategoryId={activeCategoryId ?? undefined}
      />
    </div>
  )
}
