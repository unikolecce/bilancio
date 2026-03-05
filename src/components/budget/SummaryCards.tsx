import React, { useState } from 'react'
import type { BudgetItem, BudgetMonth } from '../../models/types'
import { computeMonthSummary } from '../../utils/calculations'
import { formatCurrency } from '../../utils/currency'
import { useTranslation } from '../../i18n/useTranslation'

interface SummaryCardsProps {
  month: BudgetMonth
}

type ActiveCard = 'income' | 'paid' | 'today' | 'balance' | null

// ─── Helpers ─────────────────────────────────────────────────────────────────

const todayDate = new Date()
todayDate.setHours(0, 0, 0, 0)

const isSettled = (item: BudgetItem) =>
  item.paid || (!!item.date && new Date(item.date + 'T00:00:00') <= todayDate)

// ─── Detail drawer ────────────────────────────────────────────────────────────

interface DrawerProps {
  open: boolean
  onClose(): void
  title: string
  currency: string
  children: React.ReactNode
}

const Drawer: React.FC<DrawerProps> = ({ open, onClose, title, currency: _currency, children }) => {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-800">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-5 py-4">
          {children}
        </div>
      </div>
    </div>
  )
}

// ─── Item row inside drawer ───────────────────────────────────────────────────

const DrawerItemRow: React.FC<{ item: BudgetItem; currency: string; catColor?: string }> = ({
  item, currency, catColor,
}) => (
  <div className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-b-0">
    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: catColor ?? '#94a3b8' }} />
    <div className="flex-1 min-w-0">
      <p className="text-sm text-slate-700 truncate">{item.name}</p>
      {item.date && (
        <p className="text-xs text-slate-400">
          {new Date(item.date + 'T00:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
        </p>
      )}
    </div>
    <span className={`text-sm font-semibold tabular-nums ${item.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
      {item.type === 'INCOME' ? '+' : '−'}{formatCurrency(item.amount, currency as never)}
    </span>
  </div>
)

// ─── Card ─────────────────────────────────────────────────────────────────────

interface CardProps {
  label: string
  amount: number
  currency: string
  colorClass: string
  bgClass: string
  icon: React.ReactNode
  onClick(): void
}

const Card: React.FC<CardProps> = ({ label, amount, currency, colorClass, bgClass, icon, onClick }) => (
  <button
    onClick={onClick}
    className={`rounded-xl p-4 ${bgClass} flex flex-col gap-2 text-left w-full transition-opacity hover:opacity-80 active:opacity-70`}
  >
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium uppercase tracking-wide opacity-70">{label}</span>
      <span className={`text-lg ${colorClass} opacity-80`}>{icon}</span>
    </div>
    <p className={`text-2xl font-bold tabular-nums ${colorClass}`}>
      {formatCurrency(amount, currency as never)}
    </p>
  </button>
)

// ─── SummaryCards ─────────────────────────────────────────────────────────────

export const SummaryCards: React.FC<SummaryCardsProps> = ({ month }) => {
  const { t } = useTranslation()
  const s = computeMonthSummary(month)
  const [active, setActive] = useState<ActiveCard>(null)

  const balancePositive = s.balance >= 0

  const getCatColor = (item: BudgetItem) =>
    month.categories.find((c) => c.id === item.categoryId)?.color

  const incomeItems = month.items.filter((i) => i.type === 'INCOME')
  const paidItems = month.items.filter((i) => i.type === 'EXPENSE' && isSettled(i))
  const receivedIncomeItems = month.items.filter((i) => i.type === 'INCOME' && isSettled(i))
  const allExpenseItems = month.items.filter((i) => i.type === 'EXPENSE')

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Entrate totali */}
        <Card
          label={t('summary.totalIncome')}
          amount={s.totalIncome}
          currency={month.currency}
          colorClass="text-emerald-700"
          bgClass="bg-emerald-50"
          onClick={() => setActive('income')}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          }
        />

        {/* Uscite pagate */}
        <Card
          label={t('summary.paidExpenses')}
          amount={s.paidExpenses}
          currency={month.currency}
          colorClass="text-rose-700"
          bgClass="bg-rose-50"
          onClick={() => setActive('paid')}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        {/* Saldo a oggi */}
        <Card
          label={t('summary.todayBalance')}
          amount={Math.abs(s.todayBalance)}
          currency={month.currency}
          colorClass={s.todayBalance >= 0 ? 'text-indigo-700' : 'text-rose-700'}
          bgClass={s.todayBalance >= 0 ? 'bg-indigo-50' : 'bg-rose-100'}
          onClick={() => setActive('today')}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />

        {/* Saldo previsto */}
        <Card
          label={t('summary.balance')}
          amount={Math.abs(s.balance)}
          currency={month.currency}
          colorClass={balancePositive ? 'text-violet-700' : 'text-rose-700'}
          bgClass={balancePositive ? 'bg-violet-50' : 'bg-rose-100'}
          onClick={() => setActive('balance')}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
          }
        />
      </div>

      {/* ── Drawers ── */}

      {/* Entrate */}
      <Drawer
        open={active === 'income'}
        onClose={() => setActive(null)}
        title={t('summary.totalIncome')}
        currency={month.currency}
      >
        {incomeItems.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">Nessuna entrata</p>
        ) : (
          <>
            {incomeItems.map((item) => (
              <DrawerItemRow key={item.id} item={item} currency={month.currency} catColor={getCatColor(item)} />
            ))}
            <div className="flex justify-between items-center pt-3 mt-1 border-t border-slate-200">
              <span className="text-sm font-semibold text-slate-600">Totale</span>
              <span className="text-base font-bold text-emerald-600 tabular-nums">
                +{formatCurrency(s.totalIncome, month.currency)}
              </span>
            </div>
          </>
        )}
      </Drawer>

      {/* Uscite pagate */}
      <Drawer
        open={active === 'paid'}
        onClose={() => setActive(null)}
        title={t('summary.paidExpenses')}
        currency={month.currency}
      >
        {paidItems.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">Nessuna uscita pagata</p>
        ) : (
          <>
            {paidItems.map((item) => (
              <DrawerItemRow key={item.id} item={item} currency={month.currency} catColor={getCatColor(item)} />
            ))}
            <div className="flex justify-between items-center pt-3 mt-1 border-t border-slate-200">
              <span className="text-sm font-semibold text-slate-600">Totale</span>
              <span className="text-base font-bold text-rose-600 tabular-nums">
                −{formatCurrency(s.paidExpenses, month.currency)}
              </span>
            </div>
          </>
        )}
      </Drawer>

      {/* Saldo a oggi */}
      <Drawer
        open={active === 'today'}
        onClose={() => setActive(null)}
        title={t('summary.todayBalance')}
        currency={month.currency}
      >
        {/* Calculation breakdown */}
        <div className="flex flex-col gap-1 mb-5 bg-slate-50 rounded-xl p-4">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Entrate ricevute</span>
            <span className="font-semibold text-emerald-600 tabular-nums">
              +{formatCurrency(receivedIncomeItems.reduce((a, i) => a + i.amount, 0), month.currency)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Uscite pagate</span>
            <span className="font-semibold text-rose-600 tabular-nums">
              −{formatCurrency(s.paidExpenses, month.currency)}
            </span>
          </div>
          <div className="flex justify-between text-sm font-bold pt-2 mt-1 border-t border-slate-200">
            <span className="text-slate-700">{t('summary.todayBalance')}</span>
            <span className={`tabular-nums ${s.todayBalance >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
              {s.todayBalance >= 0 ? '+' : ''}{formatCurrency(s.todayBalance, month.currency)}
            </span>
          </div>
        </div>

        {/* Entrate non ancora ricevute */}
        {incomeItems.filter((i) => !isSettled(i)).length > 0 && (
          <>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Entrate non ancora ricevute
            </p>
            {incomeItems.filter((i) => !isSettled(i)).map((item) => (
              <DrawerItemRow key={item.id} item={item} currency={month.currency} catColor={getCatColor(item)} />
            ))}
          </>
        )}
      </Drawer>

      {/* Saldo previsto */}
      <Drawer
        open={active === 'balance'}
        onClose={() => setActive(null)}
        title={t('summary.balance')}
        currency={month.currency}
      >
        {/* Calculation breakdown */}
        <div className="flex flex-col gap-1 mb-5 bg-slate-50 rounded-xl p-4">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Entrate totali</span>
            <span className="font-semibold text-emerald-600 tabular-nums">
              +{formatCurrency(s.totalIncome, month.currency)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Uscite totali</span>
            <span className="font-semibold text-rose-600 tabular-nums">
              −{formatCurrency(s.totalExpenses, month.currency)}
            </span>
          </div>
          <div className="flex justify-between text-sm font-bold pt-2 mt-1 border-t border-slate-200">
            <span className="text-slate-700">{t('summary.balance')}</span>
            <span className={`tabular-nums ${s.balance >= 0 ? 'text-violet-600' : 'text-rose-600'}`}>
              {s.balance >= 0 ? '+' : ''}{formatCurrency(s.balance, month.currency)}
            </span>
          </div>
        </div>

        {/* Uscite non ancora pagate */}
        {allExpenseItems.filter((i) => !isSettled(i)).length > 0 && (
          <>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Uscite non ancora pagate
            </p>
            {allExpenseItems.filter((i) => !isSettled(i)).map((item) => (
              <DrawerItemRow key={item.id} item={item} currency={month.currency} catColor={getCatColor(item)} />
            ))}
          </>
        )}
      </Drawer>
    </>
  )
}
