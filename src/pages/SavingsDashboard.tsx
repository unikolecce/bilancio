import React, { useMemo, useState } from 'react'
import type { InvestmentUpdate, SavingsJar } from '../models/types'
import { useAppStore } from '../store/appStore'
import { useTranslation } from '../i18n/useTranslation'
import { formatCurrency, parseAmount, isValidAmount, amountToInputValue } from '../utils/currency'
import { computeMonthSummary } from '../utils/calculations'
import { getCurrentYearMonth } from '../utils/dateUtils'
import { Modal } from '../components/ui/Modal'
import { Button } from '../components/ui/Button'
import { Input, Toggle } from '../components/ui/Input'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const jarBalance = (jar: SavingsJar): number =>
  jar.transactions.reduce(
    (sum, tx) => sum + (tx.type === 'DEPOSIT' ? tx.amount : -tx.amount),
    0
  )

const totalInvested = (jar: SavingsJar): number =>
  (jar.initialValue ?? 0) + jar.transactions
    .filter((t) => t.type === 'DEPOSIT')
    .reduce((s, t) => s + t.amount, 0)

const currentValue = (jar: SavingsJar): number | null => {
  const updates = jar.investmentUpdates ?? []
  if (updates.length === 0) return null
  return [...updates].sort((a, b) => b.date.localeCompare(a.date))[0].value
}

// ─── Jar Form Modal ───────────────────────────────────────────────────────────

const EMOJI_OPTIONS = ['🏦', '🎯', '✈️', '🏠', '🚗', '📚', '💊', '🎸', '🌴', '💍', '🐶', '💻', '📈', '💰', '🏛️']
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
  const [type, setType] = useState<'RISPARMIO' | 'INVESTIMENTO'>('RISPARMIO')
  const [targetRaw, setTargetRaw] = useState('')
  const [initialValueRaw, setInitialValueRaw] = useState('')

  React.useEffect(() => {
    if (!open) return
    if (editJar) {
      setName(editJar.name)
      setIcon(editJar.icon)
      setColor(editJar.color)
      setType(editJar.type ?? 'RISPARMIO')
      setTargetRaw(editJar.target ? amountToInputValue(editJar.target) : '')
      setInitialValueRaw(editJar.initialValue ? amountToInputValue(editJar.initialValue) : '')
    } else {
      setName('')
      setIcon('🏦')
      setColor('#6366f1')
      setType('RISPARMIO')
      setTargetRaw('')
      setInitialValueRaw('')
    }
  }, [open, editJar])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    const target = targetRaw && isValidAmount(targetRaw) ? parseAmount(targetRaw) : undefined
    const initialValue = type === 'INVESTIMENTO' && initialValueRaw && isValidAmount(initialValueRaw)
      ? parseAmount(initialValueRaw)
      : undefined
    if (editJar) {
      updateJar(editJar.id, { name: name.trim(), icon, color, type, target, initialValue })
    } else {
      createJar({ name: name.trim(), icon, color, type, target, initialValue })
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
        {/* Type selector */}
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-2">Tipo</label>
          <div className="flex gap-2">
            {(['RISPARMIO', 'INVESTIMENTO'] as const).map((tp) => (
              <button
                key={tp}
                type="button"
                onClick={() => setType(tp)}
                className={[
                  'flex-1 py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all',
                  type === tp
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300',
                ].join(' ')}
              >
                {tp === 'RISPARMIO' ? '🏦 Risparmio' : '📈 Investimento'}
              </button>
            ))}
          </div>
        </div>

        <Input
          label={t('savings.jarName')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={type === 'RISPARMIO' ? 'Es. Vacanze, Emergenza…' : 'Es. ETF, Azioni…'}
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

        {type === 'INVESTIMENTO' && (
          <Input
            label="Valore già investito (prima dell'app)"
            value={initialValueRaw}
            onChange={(e) => setInitialValueRaw(e.target.value)}
            placeholder="0.00"
            inputMode="decimal"
          />
        )}

        <Input
          label={type === 'RISPARMIO' ? t('savings.jarTarget') : 'Obiettivo valore (opzionale)'}
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

// ─── Transaction Modal (deposits/withdrawals) ─────────────────────────────────

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
    if (!isValidAmount(amountRaw)) { setError('Importo non valido'); return }
    const amount = parseAmount(amountRaw)
    if (type === 'WITHDRAWAL' && amount > balance) { setError('Saldo insufficiente'); return }
    addJarTransaction(jar.id, { type, amount, note: note.trim() || undefined, date })
    onClose()
  }

  const title = type === 'DEPOSIT' ? t('savings.deposit') : t('savings.withdraw')

  return (
    <Modal open={open} onClose={onClose} title={`${title} — ${jar.icon} ${jar.name}`} size="sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
        <Input label={t('form.date')} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
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

// ─── Investment Update Modal ──────────────────────────────────────────────────

interface InvUpdateModalProps {
  open: boolean
  onClose(): void
  jarId: string
}

const InvUpdateModal: React.FC<InvUpdateModalProps> = ({ open, onClose, jarId }) => {
  const addInvestmentUpdate = useAppStore((s) => s.addInvestmentUpdate)
  const settings = useAppStore((s) => s.settings)
  // Read jar live from store so invested amount is always fresh
  const jar = useAppStore((s) => s.savingsJars.find((j) => j.id === jarId))

  const [valueRaw, setValueRaw] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  React.useEffect(() => {
    if (!open) return
    setValueRaw('')
    setDate(new Date().toISOString().slice(0, 10))
    setNote('')
    setError('')
  }, [open])

  if (!jar) return null

  const invested = totalInvested(jar)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValidAmount(valueRaw)) { setError('Importo non valido'); return }
    addInvestmentUpdate(jar.id, {
      date,
      value: parseAmount(valueRaw),
      note: note.trim() || undefined,
    })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={`Aggiorna valore — ${jar.icon} ${jar.name}`} size="sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
          Capitale investito: <strong>{formatCurrency(invested, settings.currency)}</strong>
        </p>
        <Input
          label="Valore attuale del portafoglio"
          value={valueRaw}
          onChange={(e) => { setValueRaw(e.target.value); setError('') }}
          error={error}
          placeholder="0.00"
          inputMode="decimal"
          autoFocus
        />
        <Input label="Data" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Input
          label="Nota (opzionale)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Es. +dividendi Q1…"
        />
        <div className="flex gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} fullWidth>Annulla</Button>
          <Button type="submit" variant="primary" fullWidth>Salva</Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Investment Stats Modal ───────────────────────────────────────────────────

interface InvStatsModalProps {
  open: boolean
  onClose(): void
  jarId: string | null
}

const InvStatsModal: React.FC<InvStatsModalProps> = ({ open, onClose, jarId }) => {
  const settings = useAppStore((s) => s.settings)
  const deleteInvestmentUpdate = useAppStore((s) => s.deleteInvestmentUpdate)
  const jar = useAppStore((s) => s.savingsJars.find((j) => j.id === jarId) ?? null)

  const updates = useMemo(() => {
    if (!jar) return []
    return [...(jar.investmentUpdates ?? [])].sort((a, b) => a.date.localeCompare(b.date))
  }, [jar])

  const invested = jar ? totalInvested(jar) : 0

  const maxValue = useMemo(
    () => Math.max(...updates.map((u) => u.value), invested, 1),
    [updates, invested]
  )

  if (!jar) return null

  return (
    <Modal open={open} onClose={onClose} title={`${jar.icon} ${jar.name} — Statistiche`} size="md">
      {updates.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-6">
          Nessun aggiornamento. Premi "Aggiorna valore" per registrare il valore del portafoglio.
        </p>
      ) : (
        <>
          {/* Summary row */}
          {(() => {
            const latest = updates[updates.length - 1]
            const gain = latest.value - invested
            const pct = invested > 0 ? (gain / invested) * 100 : 0
            return (
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-500 mb-1">Investito</p>
                  <p className="text-sm font-bold text-slate-700">{formatCurrency(invested, settings.currency)}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-500 mb-1">Valore attuale</p>
                  <p className="text-sm font-bold text-slate-700">{formatCurrency(latest.value, settings.currency)}</p>
                </div>
                <div className={`rounded-xl p-3 text-center ${gain >= 0 ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                  <p className="text-xs text-slate-500 mb-1">Rendimento</p>
                  <p className={`text-sm font-bold ${gain >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {gain >= 0 ? '+' : ''}{pct.toFixed(2)}%
                  </p>
                  <p className={`text-xs ${gain >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {gain >= 0 ? '+' : ''}{formatCurrency(gain, settings.currency)}
                  </p>
                </div>
              </div>
            )
          })()}

          {/* Mini bar chart */}
          {updates.length > 1 && (
            <div className="mb-5">
              <div className="flex items-end gap-1.5 h-24 mb-1">
                {updates.map((u) => {
                  const pct = (u.value / maxValue) * 100
                  const gain = u.value - invested
                  return (
                    <div
                      key={u.id}
                      className="flex-1 rounded-t-sm transition-all duration-300"
                      style={{
                        height: `${pct}%`,
                        backgroundColor: gain >= 0 ? '#22c55e' : '#f43f5e',
                        opacity: 0.75,
                      }}
                      title={`${u.date}: ${formatCurrency(u.value, settings.currency)}`}
                    />
                  )
                })}
              </div>
              {/* Baseline */}
              <div className="h-px bg-slate-200 mb-1" />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>{updates[0].date.slice(0, 7)}</span>
                <span>{updates[updates.length - 1].date.slice(0, 7)}</span>
              </div>
            </div>
          )}

          {/* Updates table */}
          <div className="flex flex-col divide-y divide-slate-100 max-h-64 overflow-y-auto">
            {[...updates].reverse().map((u) => {
              const gain = u.value - invested
              const pct = invested > 0 ? (gain / invested) * 100 : 0
              return (
                <div key={u.id} className="flex items-center gap-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700">
                      {formatCurrency(u.value, settings.currency)}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(u.date + 'T00:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {u.note && <> · {u.note}</>}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold tabular-nums shrink-0 ${gain >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {gain >= 0 ? '+' : ''}{pct.toFixed(2)}%
                  </span>
                  <button
                    onClick={() => deleteInvestmentUpdate(jar.id, u.id)}
                    className="p-1 text-slate-300 hover:text-rose-400 transition-colors shrink-0"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )
            })}
          </div>
        </>
      )}
      <div className="pt-4 border-t border-slate-100 mt-4">
        <Button variant="secondary" fullWidth onClick={onClose}>Chiudi</Button>
      </div>
    </Modal>
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

// ─── Jar Card ─────────────────────────────────────────────────────────────────

interface JarCardProps {
  jar: SavingsJar
  onEdit(): void
  onDelete(): void
  onDeposit(): void
  onWithdraw(): void
  onShowTx(): void
  onUpdateValue(): void
  onShowStats(): void
}

const JarCard: React.FC<JarCardProps> = ({
  jar, onEdit, onDelete, onDeposit, onWithdraw, onShowTx, onUpdateValue, onShowStats,
}) => {
  const { t } = useTranslation()
  const settings = useAppStore((s) => s.settings)
  const isInvestment = jar.type === 'INVESTIMENTO'

  // RISPARMIO
  const balance = jarBalance(jar)
  const hasTarget = jar.target != null && jar.target > 0
  const progress = hasTarget ? Math.min((balance / jar.target!) * 100, 100) : 0

  // INVESTIMENTO
  const invested = totalInvested(jar)
  const curValue = currentValue(jar)
  const gain = curValue != null ? curValue - invested : null
  const gainPct = gain != null && invested > 0 ? (gain / invested) * 100 : null

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="h-2" style={{ backgroundColor: jar.color }} />

      <div className="p-4 flex flex-col gap-3">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{jar.icon}</span>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="font-semibold text-slate-900 text-sm">{jar.name}</p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                  isInvestment ? 'bg-violet-100 text-violet-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {isInvestment ? '📈' : '🏦'}
                </span>
              </div>
              {hasTarget && (
                <p className="text-xs text-slate-400">
                  {t('savings.target')}: {formatCurrency(jar.target!, settings.currency)}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-1 shrink-0">
            <button onClick={onEdit} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button onClick={onDelete} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Balance / value */}
        {isInvestment ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Capitale investito</span>
              <span className="font-medium tabular-nums">{formatCurrency(invested, settings.currency)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>Valore attuale</span>
              <span className="font-medium tabular-nums">
                {curValue != null ? formatCurrency(curValue, settings.currency) : '—'}
              </span>
            </div>
            {gainPct != null && (
              <div className={`flex justify-between text-sm font-bold ${gainPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                <span>Rendimento</span>
                <span className="tabular-nums">
                  {gainPct >= 0 ? '+' : ''}{gainPct.toFixed(2)}%
                  {' '}
                  <span className="text-xs font-normal">
                    ({gain! >= 0 ? '+' : ''}{formatCurrency(gain!, settings.currency)})
                  </span>
                </span>
              </div>
            )}
          </div>
        ) : (
          <div>
            <p className="text-xs text-slate-500 mb-0.5">{t('savings.balance')}</p>
            <p className="text-2xl font-bold" style={{ color: jar.color }}>
              {formatCurrency(balance, settings.currency)}
            </p>
          </div>
        )}

        {/* Progress bar for RISPARMIO */}
        {!isInvestment && hasTarget && (
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>{progress.toFixed(0)}%</span>
              <span>{formatCurrency(jar.target!, settings.currency)}</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: jar.color }} />
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          {isInvestment ? (
            <>
              <button
                onClick={onUpdateValue}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg
                  bg-violet-50 text-violet-700 hover:bg-violet-100 text-xs font-medium transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Aggiorna valore
              </button>
              <button
                onClick={onDeposit}
                className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg
                  bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-medium transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Versamento
              </button>
              <button
                onClick={onShowStats}
                className="p-2 rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors"
                title="Statistiche"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </button>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
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
  const [invUpdateJar, setInvUpdateJar] = useState<string | null>(null)
  const [statsJar, setStatsJar] = useState<string | null>(null)

  const settings = useAppStore((s) => s.settings)

  const totalRisparmio = useMemo(
    () => savingsJars.filter((j) => j.type !== 'INVESTIMENTO').reduce((s, j) => s + jarBalance(j), 0),
    [savingsJars]
  )

  const totalInvestito = useMemo(
    () => savingsJars.filter((j) => j.type === 'INVESTIMENTO').reduce((s, j) => s + totalInvested(j), 0),
    [savingsJars]
  )

  const totalValoreAttuale = useMemo(() => {
    const inv = savingsJars.filter((j) => j.type === 'INVESTIMENTO')
    const withUpdates = inv.filter((j) => currentValue(j) != null)
    if (withUpdates.length === 0) return null
    return withUpdates.reduce((s, j) => s + (currentValue(j) ?? 0), 0)
  }, [savingsJars])

  const currentMonthBalance = useAppStore((s) => {
    const { year, month } = getCurrentYearMonth()
    const m = s.months.find((mo) => mo.year === year && mo.month === month)
    return m ? computeMonthSummary(m).todayBalance : null
  })

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{t('savings.title')}</h1>
          <div className="flex flex-col gap-0.5 mt-0.5">
            {savingsJars.some((j) => j.type !== 'INVESTIMENTO') && (
              <p className="text-sm text-slate-500">
                🏦 Risparmi: {formatCurrency(totalRisparmio, settings.currency)}
              </p>
            )}
            {savingsJars.some((j) => j.type === 'INVESTIMENTO') && (
              <p className="text-sm text-slate-500">
                📈 Investito: {formatCurrency(totalInvestito, settings.currency)}
                {totalValoreAttuale != null && (
                  <span className={`ml-2 font-medium ${totalValoreAttuale >= totalInvestito ? 'text-emerald-600' : 'text-rose-600'}`}>
                    → {formatCurrency(totalValoreAttuale, settings.currency)}
                    {' '}({totalInvestito > 0
                      ? `${((totalValoreAttuale - totalInvestito) / totalInvestito * 100) >= 0 ? '+' : ''}${((totalValoreAttuale - totalInvestito) / totalInvestito * 100).toFixed(2)}%`
                      : '—'})
                  </span>
                )}
              </p>
            )}
          </div>
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

      {/* ── Patrimonio totale ── */}
      {savingsJars.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Patrimonio totale</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {/* Risparmi */}
            {savingsJars.some((j) => j.type !== 'INVESTIMENTO') && (
              <div className="bg-emerald-50 rounded-xl p-3">
                <p className="text-xs text-emerald-600 font-medium mb-1">🏦 Risparmi</p>
                <p className="text-base font-bold text-emerald-700 tabular-nums">
                  {formatCurrency(totalRisparmio, settings.currency)}
                </p>
              </div>
            )}
            {/* Investito */}
            {savingsJars.some((j) => j.type === 'INVESTIMENTO') && (
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-500 font-medium mb-1">📈 Investito</p>
                <p className="text-base font-bold text-slate-700 tabular-nums">
                  {formatCurrency(totalInvestito, settings.currency)}
                </p>
              </div>
            )}
            {/* Valore attuale investimenti */}
            {totalValoreAttuale != null && (
              <div className={`rounded-xl p-3 ${totalValoreAttuale >= totalInvestito ? 'bg-violet-50' : 'bg-rose-50'}`}>
                <p className={`text-xs font-medium mb-1 ${totalValoreAttuale >= totalInvestito ? 'text-violet-600' : 'text-rose-600'}`}>
                  Valore investimenti
                </p>
                <p className={`text-base font-bold tabular-nums ${totalValoreAttuale >= totalInvestito ? 'text-violet-700' : 'text-rose-700'}`}>
                  {formatCurrency(totalValoreAttuale, settings.currency)}
                </p>
                {totalInvestito > 0 && (
                  <p className={`text-xs mt-0.5 ${totalValoreAttuale >= totalInvestito ? 'text-violet-500' : 'text-rose-500'}`}>
                    {((totalValoreAttuale - totalInvestito) / totalInvestito * 100) >= 0 ? '+' : ''}
                    {((totalValoreAttuale - totalInvestito) / totalInvestito * 100).toFixed(2)}%
                  </p>
                )}
              </div>
            )}
            {/* Saldo mese corrente */}
            {currentMonthBalance != null && (
              <div className={`rounded-xl p-3 ${currentMonthBalance >= 0 ? 'bg-sky-50' : 'bg-rose-50'}`}>
                <p className={`text-xs font-medium mb-1 ${currentMonthBalance >= 0 ? 'text-sky-600' : 'text-rose-600'}`}>
                  💳 Saldo mese
                </p>
                <p className={`text-base font-bold tabular-nums ${currentMonthBalance >= 0 ? 'text-sky-700' : 'text-rose-700'}`}>
                  {currentMonthBalance >= 0 ? '+' : ''}{formatCurrency(currentMonthBalance, settings.currency)}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">a oggi</p>
              </div>
            )}

            {/* Totale patrimonio */}
            {(() => {
              const patrimonio = totalRisparmio + (totalValoreAttuale ?? totalInvestito) + (currentMonthBalance ?? 0)
              return (
                <div className="bg-indigo-50 rounded-xl p-3">
                  <p className="text-xs text-indigo-600 font-medium mb-1">💎 Totale</p>
                  <p className="text-base font-bold text-indigo-700 tabular-nums">
                    {formatCurrency(patrimonio, settings.currency)}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">risparmi + inv. + mese</p>
                </div>
              )
            })()}
          </div>

          {/* Per-jar breakdown table */}
          <div className="flex flex-col divide-y divide-slate-100">
            {savingsJars.map((jar) => {
              const isInv = jar.type === 'INVESTIMENTO'
              const val = isInv ? (currentValue(jar) ?? totalInvested(jar)) : jarBalance(jar)
              const inv = isInv ? totalInvested(jar) : null
              const gain = isInv && currentValue(jar) != null ? currentValue(jar)! - totalInvested(jar) : null
              const gainPct = gain != null && totalInvested(jar) > 0 ? (gain / totalInvested(jar)) * 100 : null
              return (
                <div key={jar.id} className="flex items-center gap-3 py-2.5">
                  <span className="text-base">{jar.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700">{jar.name}</p>
                    {isInv && inv != null && (
                      <p className="text-xs text-slate-400">Investito: {formatCurrency(inv, settings.currency)}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold tabular-nums text-slate-700">
                      {formatCurrency(val, settings.currency)}
                    </p>
                    {gainPct != null && (
                      <p className={`text-xs ${gainPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {gainPct >= 0 ? '+' : ''}{gainPct.toFixed(2)}%
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

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
              onUpdateValue={() => setInvUpdateJar(jar.id)}
              onShowStats={() => setStatsJar(jar.id)}
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

      {invUpdateJar && (
        <InvUpdateModal
          open={!!invUpdateJar}
          onClose={() => setInvUpdateJar(null)}
          jarId={invUpdateJar}
        />
      )}

      <InvStatsModal
        open={!!statsJar}
        onClose={() => setStatsJar(null)}
        jarId={statsJar}
      />
    </div>
  )
}
