import React, { useMemo, useState } from 'react'
import type { SavingsJar } from '../models/types'
import { useAppStore } from '../store/appStore'
import { useTranslation } from '../i18n/useTranslation'
import { formatCurrency, parseAmount, isValidAmount, amountToInputValue } from '../utils/currency'
import { Modal } from '../components/ui/Modal'
import { Button } from '../components/ui/Button'
import { Input, Toggle } from '../components/ui/Input'

// ─── Jar balance helper ───────────────────────────────────────────────────────

const jarBalance = (jar: SavingsJar): number =>
  jar.transactions.reduce(
    (sum, tx) => sum + (tx.type === 'DEPOSIT' ? tx.amount : -tx.amount),
    0
  )

// ─── Jar Form Modal ───────────────────────────────────────────────────────────

const EMOJI_OPTIONS = ['🏦', '🎯', '✈️', '🏠', '🚗', '📚', '💊', '🎸', '🌴', '💍', '🐶', '💻']
const COLOR_OPTIONS = [
  '#6366f1', '#22c55e', '#f59e0b', '#ec4899', '#3b82f6',
  '#14b8a6', '#f97316', '#8b5cf6', '#ef4444', '#84cc16',
]

interface JarFormModalProps {
  open: boolean
  onClose(): void
  editJar?: SavingsJar | null
}

const JarFormModal: React.FC<JarFormModalProps> = ({ open, onClose, editJar }) => {
  const { t } = useTranslation()
  const { createJar, updateJar } = useAppStore((s) => ({ createJar: s.createJar, updateJar: s.updateJar }))

  const [name, setName] = useState('')
  const [icon, setIcon] = useState('🏦')
  const [color, setColor] = useState('#6366f1')
  const [targetRaw, setTargetRaw] = useState('')

  React.useEffect(() => {
    if (!open) return
    if (editJar) {
      setName(editJar.name)
      setIcon(editJar.icon)
      setColor(editJar.color)
      setTargetRaw(editJar.target ? amountToInputValue(editJar.target) : '')
    } else {
      setName('')
      setIcon('🏦')
      setColor('#6366f1')
      setTargetRaw('')
    }
  }, [open, editJar])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    const target = targetRaw && isValidAmount(targetRaw) ? parseAmount(targetRaw) : undefined
    if (editJar) {
      updateJar(editJar.id, { name: name.trim(), icon, color, target })
    } else {
      createJar({ name: name.trim(), icon, color, target })
    }
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editJar ? t('savings.editJar') : t('savings.createJar')}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label={t('savings.jarName')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Es. Vacanze, Emergenza…"
          autoFocus
        />

        {/* Icon picker */}
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-2">{t('savings.jarIcon')}</label>
          <div className="flex flex-wrap gap-2">
            {EMOJI_OPTIONS.map((em) => (
              <button
                key={em}
                type="button"
                onClick={() => setIcon(em)}
                className={[
                  'w-9 h-9 rounded-lg text-lg flex items-center justify-center border-2 transition-all',
                  icon === em ? 'border-indigo-500 bg-indigo-50 scale-110' : 'border-slate-200 hover:border-slate-300',
                ].join(' ')}
              >
                {em}
              </button>
            ))}
          </div>
        </div>

        {/* Color picker */}
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-2">{t('savings.jarColor')}</label>
          <div className="flex flex-wrap gap-2">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={[
                  'w-7 h-7 rounded-full border-2 transition-all',
                  color === c ? 'border-slate-700 scale-125' : 'border-transparent hover:scale-110',
                ].join(' ')}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <Input
          label={t('savings.jarTarget')}
          value={targetRaw}
          onChange={(e) => setTargetRaw(e.target.value)}
          placeholder="0.00"
          inputMode="decimal"
        />

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} fullWidth>{t('actions.cancel')}</Button>
          <Button type="submit" variant="primary" fullWidth>{t('actions.save')}</Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Transaction Modal ────────────────────────────────────────────────────────

interface TxModalProps {
  open: boolean
  onClose(): void
  jar: SavingsJar
  defaultType: 'DEPOSIT' | 'WITHDRAWAL'
}

const TxModal: React.FC<TxModalProps> = ({ open, onClose, jar, defaultType }) => {
  const { t } = useTranslation()
  const addJarTransaction = useAppStore((s) => s.addJarTransaction)
  const settings = useAppStore((s) => s.settings)

  const [type, setType] = useState<'DEPOSIT' | 'WITHDRAWAL'>(defaultType)
  const [amountRaw, setAmountRaw] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [error, setError] = useState('')

  React.useEffect(() => {
    if (!open) return
    setType(defaultType)
    setAmountRaw('')
    setNote('')
    setDate(new Date().toISOString().slice(0, 10))
    setError('')
  }, [open, defaultType])

  const balance = jarBalance(jar)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValidAmount(amountRaw)) {
      setError('Importo non valido')
      return
    }
    const amount = parseAmount(amountRaw)
    if (type === 'WITHDRAWAL' && amount > balance) {
      setError('Saldo insufficiente')
      return
    }
    addJarTransaction(jar.id, { type, amount, note: note.trim() || undefined, date })
    onClose()
  }

  const title = type === 'DEPOSIT' ? t('savings.deposit') : t('savings.withdraw')

  return (
    <Modal open={open} onClose={onClose} title={`${title} — ${jar.icon} ${jar.name}`} size="sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Type toggle */}
        <Toggle
          variant="income-expense"
          checked={type === 'WITHDRAWAL'}
          onChange={(isWithdraw) => { setType(isWithdraw ? 'WITHDRAWAL' : 'DEPOSIT'); setError('') }}
          labelLeft={t('savings.deposit')}
          labelRight={t('savings.withdraw')}
        />

        <Input
          label={t('form.amount')}
          value={amountRaw}
          onChange={(e) => { setAmountRaw(e.target.value); setError('') }}
          error={error}
          placeholder="0.00"
          inputMode="decimal"
          autoFocus
        />

        <Input
          label={t('form.date')}
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <Input
          label={t('form.note')}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Opzionale…"
        />

        {type === 'WITHDRAWAL' && (
          <p className="text-xs text-slate-500">
            {t('savings.balance')}: {formatCurrency(balance, settings.currency)}
          </p>
        )}

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} fullWidth>{t('actions.cancel')}</Button>
          <Button type="submit" variant="primary" fullWidth>{t('actions.save')}</Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Jar Card ─────────────────────────────────────────────────────────────────

interface JarCardProps {
  jar: SavingsJar
  onEdit(): void
  onDelete(): void
  onDeposit(): void
  onWithdraw(): void
  onShowTx(): void
}

const JarCard: React.FC<JarCardProps> = ({ jar, onEdit, onDelete, onDeposit, onWithdraw, onShowTx }) => {
  const { t } = useTranslation()
  const settings = useAppStore((s) => s.settings)
  const balance = jarBalance(jar)
  const hasTarget = jar.target != null && jar.target > 0
  const progress = hasTarget ? Math.min((balance / jar.target!) * 100, 100) : 0

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Color header */}
      <div className="h-2" style={{ backgroundColor: jar.color }} />

      <div className="p-4 flex flex-col gap-3">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{jar.icon}</span>
            <div>
              <p className="font-semibold text-slate-900 text-sm">{jar.name}</p>
              {hasTarget && (
                <p className="text-xs text-slate-400">
                  {t('savings.target')}: {formatCurrency(jar.target!, settings.currency)}
                </p>
              )}
            </div>
          </div>

          {/* Edit / Delete */}
          <div className="flex gap-1 shrink-0">
            <button
              onClick={onEdit}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Balance */}
        <div>
          <p className="text-xs text-slate-500 mb-0.5">{t('savings.balance')}</p>
          <p className="text-2xl font-bold" style={{ color: jar.color }}>
            {formatCurrency(balance, settings.currency)}
          </p>
        </div>

        {/* Progress bar (if target set) */}
        {hasTarget && (
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>{progress.toFixed(0)}%</span>
              <span>{formatCurrency(jar.target!, settings.currency)}</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, backgroundColor: jar.color }}
              />
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={onDeposit}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg
              bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-medium transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('savings.deposit')}
          </button>
          <button
            onClick={onWithdraw}
            disabled={balance <= 0}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg
              bg-slate-50 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed
              text-xs font-medium transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
            {t('savings.withdraw')}
          </button>
          <button
            onClick={onShowTx}
            className="p-2 rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors"
            title={t('savings.transactions')}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Transaction History Modal ────────────────────────────────────────────────

interface TxHistoryModalProps {
  open: boolean
  onClose(): void
  jar: SavingsJar | null
}

const TxHistoryModal: React.FC<TxHistoryModalProps> = ({ open, onClose, jar }) => {
  const { t } = useTranslation()
  const settings = useAppStore((s) => s.settings)
  const deleteJarTransaction = useAppStore((s) => s.deleteJarTransaction)

  if (!jar) return null

  const sorted = [...jar.transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return (
    <Modal open={open} onClose={onClose} title={`${jar.icon} ${jar.name} — ${t('savings.transactions')}`} size="md">
      {sorted.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-4">{t('savings.noTransactions')}</p>
      ) : (
        <div className="flex flex-col divide-y divide-slate-100 max-h-80 overflow-y-auto">
          {sorted.map((tx) => (
            <div key={tx.id} className="flex items-center gap-3 py-2.5">
              <div className={[
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                tx.type === 'DEPOSIT' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600',
              ].join(' ')}>
                {tx.type === 'DEPOSIT' ? '+' : '−'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700">
                  {tx.type === 'DEPOSIT' ? t('savings.depositLabel') : t('savings.withdrawalLabel')}
                  {tx.note && <span className="text-slate-400"> · {tx.note}</span>}
                </p>
                <p className="text-xs text-slate-400">{tx.date}</p>
              </div>
              <span className={`text-sm font-semibold shrink-0 ${tx.type === 'DEPOSIT' ? 'text-emerald-600' : 'text-slate-600'}`}>
                {tx.type === 'DEPOSIT' ? '+' : '−'}{formatCurrency(tx.amount, settings.currency)}
              </span>
              <button
                onClick={() => deleteJarTransaction(jar.id, tx.id)}
                className="p-1 text-slate-300 hover:text-rose-400 transition-colors shrink-0"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="pt-4 border-t border-slate-100 mt-4">
        <Button variant="secondary" fullWidth onClick={onClose}>{t('actions.cancel')}</Button>
      </div>
    </Modal>
  )
}

// ─── SavingsDashboard ─────────────────────────────────────────────────────────

export const SavingsDashboard: React.FC = () => {
  const { t } = useTranslation()
  const { savingsJars, deleteJar } = useAppStore((s) => ({
    savingsJars: s.savingsJars,
    deleteJar: s.deleteJar,
  }))

  const [jarFormOpen, setJarFormOpen] = useState(false)
  const [editingJar, setEditingJar] = useState<SavingsJar | null>(null)
  const [txJar, setTxJar] = useState<SavingsJar | null>(null)
  const [txType, setTxType] = useState<'DEPOSIT' | 'WITHDRAWAL'>('DEPOSIT')
  const [historyJar, setHistoryJar] = useState<SavingsJar | null>(null)

  const totalSaved = useMemo(
    () => savingsJars.reduce((s, j) => s + jarBalance(j), 0),
    [savingsJars]
  )
  const settings = useAppStore((s) => s.settings)

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{t('savings.title')}</h1>
          {savingsJars.length > 0 && (
            <p className="text-sm text-slate-500 mt-0.5">
              {t('savings.balance')}: {formatCurrency(totalSaved, settings.currency)}
            </p>
          )}
        </div>
        <Button
          variant="primary"
          onClick={() => { setEditingJar(null); setJarFormOpen(true) }}
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          }
        >
          {t('savings.createJar')}
        </Button>
      </div>

      {/* Jar grid */}
      {savingsJars.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
          <div className="text-5xl">🏦</div>
          <p className="text-slate-500 text-sm">{t('savings.noJars')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {savingsJars.map((jar) => (
            <JarCard
              key={jar.id}
              jar={jar}
              onEdit={() => { setEditingJar(jar); setJarFormOpen(true) }}
              onDelete={() => {
                if (window.confirm(t('savings.deleteJarConfirm'))) deleteJar(jar.id)
              }}
              onDeposit={() => { setTxJar(jar); setTxType('DEPOSIT') }}
              onWithdraw={() => { setTxJar(jar); setTxType('WITHDRAWAL') }}
              onShowTx={() => setHistoryJar(jar)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <JarFormModal
        open={jarFormOpen}
        onClose={() => { setJarFormOpen(false); setEditingJar(null) }}
        editJar={editingJar}
      />

      {txJar && (
        <TxModal
          open={!!txJar}
          onClose={() => setTxJar(null)}
          jar={txJar}
          defaultType={txType}
        />
      )}

      <TxHistoryModal
        open={!!historyJar}
        onClose={() => setHistoryJar(null)}
        jar={historyJar}
      />
    </div>
  )
}
