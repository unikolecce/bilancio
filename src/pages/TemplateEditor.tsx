import React, { useState } from 'react'
import { useAppStore } from '../store/appStore'
import { useTranslation } from '../i18n/useTranslation'
import { isValidAmount, parseAmount, amountToInputValue } from '../utils/currency'
import type { TemplateCategory, TemplateItem, ItemType } from '../models/types'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Input, Select, Toggle } from '../components/ui/Input'

// ─── Quick colour swatches ────────────────────────────────────────────────────
const SWATCHES = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981',
  '#3b82f6', '#ef4444', '#8b5cf6', '#14b8a6',
  '#f97316', '#84cc16', '#22c55e', '#94a3b8',
]

// ─── Category form modal ───────────────────────────────────────────────────────
interface CatModalProps {
  open: boolean
  onClose(): void
  edit?: TemplateCategory | null
}

const CategoryModal: React.FC<CatModalProps> = ({ open, onClose, edit }) => {
  const { t } = useTranslation()
  const { addTemplateCategory, updateTemplateCategory, template } = useAppStore((s) => ({
    addTemplateCategory: s.addTemplateCategory,
    updateTemplateCategory: s.updateTemplateCategory,
    template: s.template,
  }))

  const [name, setName] = useState('')
  const [color, setColor] = useState(SWATCHES[0])
  const [type, setType] = useState<ItemType>('EXPENSE')
  const [nameError, setNameError] = useState('')

  React.useEffect(() => {
    if (!open) return
    setName(edit?.name ?? '')
    setColor(edit?.color ?? SWATCHES[0])
    setType(edit?.type ?? 'EXPENSE')
    setNameError('')
  }, [open, edit])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setNameError('Richiesto'); return }
    const order = edit?.order ?? template.categories.length
    if (edit) {
      updateTemplateCategory(edit.id, { name: name.trim(), color, order, type })
    } else {
      addTemplateCategory({ name: name.trim(), color, order, type })
    }
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={edit ? t('actions.editCategory') : t('actions.addCategory')}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">{t('form.type')}</label>
          <Toggle
            variant="income-expense"
            checked={type === 'EXPENSE'}
            onChange={(isExp) => setType(isExp ? 'EXPENSE' : 'INCOME')}
            labelLeft={t('form.income')}
            labelRight={t('form.expense')}
          />
        </div>
        <Input
          label={t('form.name')}
          value={name}
          onChange={(e) => { setName(e.target.value); setNameError('') }}
          error={nameError}
          autoFocus
        />
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-700">{t('form.color')}</label>
          {/* Native color picker + preview */}
          <div className="flex items-center gap-3">
            <label className="relative cursor-pointer shrink-0">
              <div
                className="w-10 h-10 rounded-xl border-2 border-white ring-1 ring-slate-200 shadow-sm transition-transform hover:scale-105"
                style={{ backgroundColor: color }}
              />
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              />
            </label>
            <span className="text-xs font-mono text-slate-400 uppercase">{color}</span>
          </div>
          {/* Quick swatches */}
          <div className="flex flex-wrap gap-1.5">
            {SWATCHES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={[
                  'w-6 h-6 rounded-full transition-transform hover:scale-110',
                  color === c ? 'ring-2 ring-offset-1 ring-slate-500 scale-110' : '',
                ].join(' ')}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose} fullWidth>{t('actions.cancel')}</Button>
          <Button type="submit" variant="primary" fullWidth>{t('actions.save')}</Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Template item form modal ─────────────────────────────────────────────────
interface ItemModalProps {
  open: boolean
  onClose(): void
  edit?: TemplateItem | null
  defaultCategoryId?: string
}

interface ItemFormState {
  categoryId: string
  name: string
  amountRaw: string
  type: ItemType
  dayOfMonth: string
  planned: boolean
  note: string
}

const ItemModal: React.FC<ItemModalProps> = ({ open, onClose, edit, defaultCategoryId }) => {
  const { t } = useTranslation()
  const { addTemplateItem, updateTemplateItem, template } = useAppStore((s) => ({
    addTemplateItem: s.addTemplateItem,
    updateTemplateItem: s.updateTemplateItem,
    template: s.template,
  }))

  const EMPTY: ItemFormState = {
    categoryId: defaultCategoryId ?? template.categories[0]?.id ?? '',
    name: '',
    amountRaw: '',
    type: 'EXPENSE',
    dayOfMonth: '',
    planned: true,
    note: '',
  }

  const [form, setForm] = useState<ItemFormState>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof ItemFormState, string>>>({})

  React.useEffect(() => {
    if (!open) return
    if (edit) {
      setForm({
        categoryId: edit.categoryId,
        name: edit.name,
        amountRaw: amountToInputValue(edit.amount),
        type: edit.type,
        dayOfMonth: edit.dayOfMonth ? String(edit.dayOfMonth) : '',
        planned: edit.planned,
        note: edit.note ?? '',
      })
    } else {
      setForm({ ...EMPTY, categoryId: defaultCategoryId ?? template.categories[0]?.id ?? '' })
    }
    setErrors({})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, edit, defaultCategoryId])

  const setField = <K extends keyof ItemFormState>(k: K, v: ItemFormState[K]) => {
    setForm((p) => ({ ...p, [k]: v }))
    setErrors((p) => ({ ...p, [k]: undefined }))
  }

  const validate = () => {
    const e: typeof errors = {}
    if (!form.categoryId) e.categoryId = 'Richiesto'
    if (!form.name.trim()) e.name = 'Richiesto'
    if (!isValidAmount(form.amountRaw)) e.amountRaw = 'Importo non valido'
    const day = form.dayOfMonth ? parseInt(form.dayOfMonth, 10) : 0
    if (form.dayOfMonth && (isNaN(day) || day < 1 || day > 31)) e.dayOfMonth = '1-31'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    const payload: Omit<TemplateItem, 'id'> = {
      categoryId: form.categoryId,
      name: form.name.trim(),
      amount: parseAmount(form.amountRaw),
      type: form.type,
      dayOfMonth: form.dayOfMonth ? parseInt(form.dayOfMonth, 10) : undefined,
      planned: form.planned,
      note: form.note.trim() || undefined,
    }
    if (edit) {
      updateTemplateItem(edit.id, payload)
    } else {
      addTemplateItem(payload)
    }
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={edit ? t('actions.editItem') : t('actions.addItem')}
      size="md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">{t('form.type')}</label>
          <Toggle
            variant="income-expense"
            checked={form.type === 'EXPENSE'}
            onChange={(isExp) => {
              const newType = isExp ? 'EXPENSE' : 'INCOME'
              const firstMatch = template.categories.find((c) => !c.type || c.type === newType)
              setForm((p) => ({ ...p, type: newType, categoryId: firstMatch?.id ?? p.categoryId }))
            }}
            labelLeft={t('form.income')}
            labelRight={t('form.expense')}
          />
        </div>

        <Select
          label={t('form.category')}
          value={form.categoryId}
          onChange={(e) => setField('categoryId', e.target.value)}
          error={errors.categoryId}
        >
          <option value="">— {t('form.category')} —</option>
          {template.categories
            .filter((c) => !c.type || c.type === form.type)
            .map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
        </Select>

        <Input
          label={t('form.name')}
          value={form.name}
          onChange={(e) => setField('name', e.target.value)}
          error={errors.name}
          placeholder="Es. Affitto, Netflix…"
          autoFocus
        />

        <Input
          label={t('form.amount')}
          value={form.amountRaw}
          onChange={(e) => setField('amountRaw', e.target.value)}
          error={errors.amountRaw}
          placeholder="0.00"
          inputMode="decimal"
        />

        <Input
          label={t('form.dayOfMonth')}
          type="number"
          min={1}
          max={31}
          value={form.dayOfMonth}
          onChange={(e) => setField('dayOfMonth', e.target.value)}
          error={errors.dayOfMonth}
          placeholder="1–31 (opzionale)"
        />

        <Toggle
          checked={form.planned}
          onChange={(v) => setField('planned', v)}
          label={t('form.planned')}
        />

        <div className="flex gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose} fullWidth>{t('actions.cancel')}</Button>
          <Button type="submit" variant="primary" fullWidth>{t('actions.save')}</Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export const TemplateEditor: React.FC = () => {
  const { t } = useTranslation()
  const { template, deleteTemplateCategory, deleteTemplateItem } = useAppStore((s) => ({
    template: s.template,
    deleteTemplateCategory: s.deleteTemplateCategory,
    deleteTemplateItem: s.deleteTemplateItem,
  }))

  const [selectedCatId, setSelectedCatId] = useState<string | null>(
    template.categories[0]?.id ?? null
  )
  const [catModalOpen, setCatModalOpen] = useState(false)
  const [editCat, setEditCat] = useState<TemplateCategory | null>(null)
  const [itemModalOpen, setItemModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<TemplateItem | null>(null)

  const selectedCat = template.categories.find((c) => c.id === selectedCatId)
  const catItems = template.items.filter((i) => i.categoryId === selectedCatId)

  const handleDeleteCat = (cat: TemplateCategory) => {
    if (window.confirm(t('messages.deleteCategoryConfirm'))) {
      deleteTemplateCategory(cat.id)
      if (selectedCatId === cat.id) {
        const remaining = template.categories.filter((c) => c.id !== cat.id)
        setSelectedCatId(remaining[0]?.id ?? null)
      }
    }
  }

  // ── Estimated monthly summary from template items ──────────────────────────
  const estimatedIncome = template.items
    .filter((i) => i.type === 'INCOME')
    .reduce((sum, i) => sum + i.amount, 0)
  const estimatedExpenses = template.items
    .filter((i) => i.type === 'EXPENSE')
    .reduce((sum, i) => sum + i.amount, 0)
  const estimatedBalance = estimatedIncome - estimatedExpenses

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-slate-900">{t('template.title')}</h1>
        <p className="text-sm text-slate-500 mt-0.5">{t('template.subtitle')}</p>
      </div>

      {/* Estimated summary */}
      {template.items.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-emerald-50 rounded-xl p-3">
            <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide mb-1">
              {t('summary.totalIncome')}
            </p>
            <p className="text-lg font-bold text-emerald-700 tabular-nums">
              +{estimatedIncome.toFixed(2)}
            </p>
          </div>
          <div className="bg-rose-50 rounded-xl p-3">
            <p className="text-xs font-medium text-rose-600 uppercase tracking-wide mb-1">
              {t('summary.totalExpenses')}
            </p>
            <p className="text-lg font-bold text-rose-700 tabular-nums">
              −{estimatedExpenses.toFixed(2)}
            </p>
          </div>
          <div className={`rounded-xl p-3 ${estimatedBalance >= 0 ? 'bg-indigo-50' : 'bg-rose-50'}`}>
            <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${estimatedBalance >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
              {t('summary.balance')}
            </p>
            <p className={`text-lg font-bold tabular-nums ${estimatedBalance >= 0 ? 'text-indigo-700' : 'text-rose-700'}`}>
              {estimatedBalance >= 0 ? '+' : '−'}{Math.abs(estimatedBalance).toFixed(2)}
            </p>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-[240px,1fr] gap-4">
        {/* ── Categories panel ──────────────────────────────────────────── */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              {t('template.categories')}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setEditCat(null); setCatModalOpen(true) }}
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              }
            >
              {t('actions.addCategory')}
            </Button>
          </div>

          {template.categories.length === 0 ? (
            <div className="text-sm text-slate-400 bg-white rounded-xl border border-dashed border-slate-200 p-6 text-center">
              {t('template.noCategories')}
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {template.categories.map((cat) => (
                <div
                  key={cat.id}
                  className={[
                    'group flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-colors',
                    selectedCatId === cat.id
                      ? 'bg-indigo-50 border border-indigo-200'
                      : 'bg-white border border-slate-200 hover:border-slate-300',
                  ].join(' ')}
                  onClick={() => setSelectedCatId(cat.id)}
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="flex-1 text-sm font-medium text-slate-800 truncate">
                    {cat.name}
                  </span>
                  {cat.type && (
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${cat.type === 'INCOME' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {cat.type === 'INCOME' ? t('form.income') : t('form.expense')}
                    </span>
                  )}
                  <span className="text-xs text-slate-400">
                    {template.items.filter((i) => i.categoryId === cat.id).length}
                  </span>
                  <div className="flex gap-0.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditCat(cat); setCatModalOpen(true) }}
                      className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteCat(cat) }}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Items panel ───────────────────────────────────────────────── */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              {t('template.items')}
              {selectedCat && (
                <span className="ml-2 font-normal text-slate-400">— {selectedCat.name}</span>
              )}
            </h2>
            {selectedCatId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setEditItem(null); setItemModalOpen(true) }}
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                }
              >
                {t('actions.addItem')}
              </Button>
            )}
          </div>

          {!selectedCatId ? (
            <div className="text-sm text-slate-400 bg-white rounded-xl border border-dashed border-slate-200 p-8 text-center">
              {t('template.selectCategory')}
            </div>
          ) : catItems.length === 0 ? (
            <div className="text-sm text-slate-400 bg-white rounded-xl border border-dashed border-slate-200 p-8 text-center">
              {t('template.noItems')}
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {catItems.map((item) => (
                <div
                  key={item.id}
                  className="group flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-slate-200"
                >
                  <span
                    className={[
                      'w-2 h-2 rounded-full shrink-0',
                      item.type === 'INCOME' ? 'bg-emerald-500' : 'bg-rose-500',
                    ].join(' ')}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{item.name}</p>
                    {item.dayOfMonth && (
                      <p className="text-xs text-slate-400">
                        {t('form.dayOfMonth')}: {item.dayOfMonth}
                      </p>
                    )}
                  </div>
                  <span
                    className={[
                      'text-sm font-semibold tabular-nums shrink-0',
                      item.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600',
                    ].join(' ')}
                  >
                    {item.type === 'EXPENSE' ? '−' : '+'}
                    {item.amount.toFixed(2)} {' '}
                    <span className="text-xs font-normal text-slate-400">
                      {selectedCat?.name}
                    </span>
                  </span>
                  <div className="flex gap-0.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => { setEditItem(item); setItemModalOpen(true) }}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-50"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(t('messages.deleteConfirm'))) deleteTemplateItem(item.id)
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-50"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CategoryModal
        open={catModalOpen}
        onClose={() => setCatModalOpen(false)}
        edit={editCat}
      />
      <ItemModal
        open={itemModalOpen}
        onClose={() => setItemModalOpen(false)}
        edit={editItem}
        defaultCategoryId={selectedCatId ?? undefined}
      />
    </div>
  )
}
