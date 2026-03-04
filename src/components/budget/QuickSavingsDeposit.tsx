import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import type { SavingsJar } from '../../models/types'
import { useAppStore } from '../../store/appStore'
import { useTranslation } from '../../i18n/useTranslation'
import { isValidAmount, parseAmount, formatCurrency } from '../../utils/currency'

// Helper: compute balance of a jar
const jarBalance = (jar: SavingsJar) =>
  jar.transactions.reduce(
    (sum, tx) => sum + (tx.type === 'DEPOSIT' ? tx.amount : -tx.amount),
    0
  )

export const QuickSavingsDeposit: React.FC = () => {
  const { t } = useTranslation()
  const { savingsJars, addJarTransaction, settings } = useAppStore((s) => ({
    savingsJars: s.savingsJars,
    addJarTransaction: s.addJarTransaction,
    settings: s.settings,
  }))

  const [selectedJarId, setSelectedJarId] = useState<string>(savingsJars[0]?.id ?? '')
  const [amountRaw, setAmountRaw] = useState('')
  const [note, setNote] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  if (savingsJars.length === 0) return null

  const selectedJar = savingsJars.find((j) => j.id === selectedJarId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!isValidAmount(amountRaw)) { setError('Importo non valido'); return }
    if (!selectedJarId) return

    addJarTransaction(selectedJarId, {
      type: 'DEPOSIT',
      amount: parseAmount(amountRaw),
      note: note.trim() || undefined,
      date: new Date().toISOString().slice(0, 10),
    })

    setAmountRaw('')
    setNote('')
    setDone(true)
    setTimeout(() => setDone(false), 2000)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-slate-200 rounded-xl p-3"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          🏦 {t('savings.deposit')}
        </span>
        <Link
          to="/savings"
          className="ml-auto text-xs text-indigo-500 hover:text-indigo-700 transition-colors"
        >
          {t('savings.title')} →
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 items-end">
        {/* Jar selector */}
        <select
          value={selectedJarId}
          onChange={(e) => setSelectedJarId(e.target.value)}
          className="rounded-lg border border-slate-200 px-2.5 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          {savingsJars.map((jar) => (
            <option key={jar.id} value={jar.id}>
              {jar.icon} {jar.name} ({formatCurrency(jarBalance(jar), settings.currency)})
            </option>
          ))}
        </select>

        {/* Amount */}
        <input
          type="text"
          value={amountRaw}
          onChange={(e) => { setAmountRaw(e.target.value); setError('') }}
          placeholder="0.00"
          inputMode="decimal"
          className="w-28 rounded-lg border border-slate-200 px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />

        {/* Note */}
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t('form.note') + '…'}
          className="flex-1 min-w-[100px] rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />

        {/* Submit */}
        <button
          type="submit"
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium
            rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
        >
          {done ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              OK
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('savings.deposit')}
            </>
          )}
        </button>
      </div>

      {error && <p className="mt-1.5 text-xs text-rose-600">{error}</p>}
      {done && (
        <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
          <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-sm text-emerald-700 font-medium">Deposito effettuato!</p>
        </div>
      )}
      {!done && selectedJar?.target && (
        <p className="mt-1.5 text-xs text-slate-400">
          {t('savings.target')}: {formatCurrency(selectedJar.target, settings.currency)}
          {' · '}
          {t('savings.balance')}: {formatCurrency(jarBalance(selectedJar), settings.currency)}
        </p>
      )}
    </form>
  )
}
