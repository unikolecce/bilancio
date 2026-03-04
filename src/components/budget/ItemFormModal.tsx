import React, { useEffect, useMemo, useState } from 'react'
import type { BudgetItem, BudgetMonth, Category, ItemType } from '../../models/types'
import { useAppStore } from '../../store/appStore'
import { useTranslation } from '../../i18n/useTranslation'
import { parseAmount, isValidAmount, amountToInputValue } from '../../utils/currency'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input, Select, TextArea, Toggle } from '../ui/Input'

interface ItemFormModalProps {
  open: boolean
  onClose(): void
  month: BudgetMonth
  editItem?: BudgetItem | null
  defaultCategoryId?: string
  defaultType?: ItemType
}

interface FormState {
  categoryId: string
  name: string
  amountRaw: string
  type: ItemType
  date: string
  planned: boolean
  note: string
}

const EMPTY_FORM: FormState = {
  categoryId: '',
  name: '',
  amountRaw: '',
  type: 'EXPENSE',
  date: '',
  planned: false,
  note: '',
}

export const ItemFormModal: React.FC<ItemFormModalProps> = ({
  open,
  onClose,
  month,
  editItem,
  defaultCategoryId,
  defaultType,
}) => {
  const { t } = useTranslation()
  const { addItem, updateItem, addCategory, template } = useAppStore((s) => ({
    addItem: s.addItem,
    updateItem: s.updateItem,
    addCategory: s.addCategory,
    template: s.template,
  }))

  // ── Merged category list ────────────────────────────────────────────────────
  const allCategories = useMemo<(Category & { _fromTemplate?: boolean })[]>(() => {
    const templateOnly = template.categories.filter(
      (tc) => !month.categories.some((mc) => mc.name === tc.name)
    )
    return [
      ...month.categories,
      ...templateOnly.map((tc) => ({ ...tc, _fromTemplate: true })),
    ]
  }, [month.categories, template.categories])

  const firstCategoryId = allCategories[0]?.id ?? ''

  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})

  // ── Categories filtered by selected type (uses cat.type if set, else show all) ──
  const categoriesForType = useMemo(() => {
    const typed = allCategories.filter((cat) => !cat.type || cat.type === form.type)
    return typed.length > 0 ? typed : allCategories
  }, [allCategories, form.type])

  // Reset form whenever modal opens
  useEffect(() => {
    if (!open) return
    if (editItem) {
      setForm({
        categoryId: editItem.categoryId,
        name: editItem.name,
        amountRaw: amountToInputValue(editItem.amount),
        type: editItem.type,
        date: editItem.date ?? '',
        planned: editItem.planned,
        note: editItem.note ?? '',
      })
    } else {
      const todayDate = new Date().toISOString().split('T')[0]
      setForm({
        ...EMPTY_FORM,
        categoryId: defaultCategoryId ?? firstCategoryId,
        type: defaultType ?? 'EXPENSE',
        date: todayDate,
      })
    }
    setErrors({})
  }, [open, editItem, defaultCategoryId, defaultType, firstCategoryId])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const validate = (): boolean => {
    const e: typeof errors = {}
    if (!form.categoryId) e.categoryId = 'Richiesto'
    if (!form.name.trim()) e.name = 'Richiesto'
    if (!isValidAmount(form.amountRaw)) e.amountRaw = 'Importo non valido (es. 12.99)'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    // If the chosen category is from the template (not yet in the month), auto-create it
    let finalCategoryId = form.categoryId
    const isInMonth = month.categories.some((c) => c.id === form.categoryId)
    if (!isInMonth) {
      const tCat = template.categories.find((c) => c.id === form.categoryId)
      if (tCat) {
        finalCategoryId = addCategory(month.id, {
          name: tCat.name,
          color: tCat.color,
          order: tCat.order,
        })
      }
    }

    const payload = {
      categoryId: finalCategoryId,
      name: form.name.trim(),
      amount: parseAmount(form.amountRaw),
      type: form.type,
      date: form.date || undefined,
      planned: form.planned,
      paid: false,
      note: form.note.trim() || undefined,
    }

    if (editItem) {
      updateItem(month.id, editItem.id, payload)
    } else {
      addItem(month.id, payload)
    }

    onClose()
  }

  const title = editItem ? t('actions.editItem') : t('actions.addItem')

  return (
    <Modal open={open} onClose={onClose} title={title} size="md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Type toggle */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">{t('form.type')}</label>
          <Toggle
            variant="income-expense"
            checked={form.type === 'EXPENSE'}
            onChange={(isExpense) => {
              const newType = isExpense ? 'EXPENSE' : 'INCOME'
              const typed = allCategories.filter((cat) => !cat.type || cat.type === newType)
              const newCatId = (typed.length > 0 ? typed : allCategories)[0]?.id ?? ''
              setForm((prev) => ({ ...prev, type: newType, categoryId: newCatId, planned: false }))
            }}
            labelLeft={t('form.income')}
            labelRight={t('form.expense')}
          />
        </div>

        {/* Category — filtered by selected type */}
        <Select
          label={t('form.category')}
          value={form.categoryId}
          onChange={(e) => set('categoryId', e.target.value)}
          error={errors.categoryId}
        >
          <option value="">— {t('form.category')} —</option>
          {categoriesForType.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </Select>

        {/* Name */}
        <Input
          label={t('form.name')}
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          error={errors.name}
          placeholder="Es. Affitto, Netflix, Stipendio…"
          autoFocus
        />

        {/* Amount */}
        <Input
          label={t('form.amount')}
          value={form.amountRaw}
          onChange={(e) => set('amountRaw', e.target.value)}
          error={errors.amountRaw}
          placeholder="0.00"
          inputMode="decimal"
        />

        {/* Date */}
        <Input
          label={t('form.date')}
          type="date"
          value={form.date}
          onChange={(e) => set('date', e.target.value)}
        />

        {/* Planned */}
        <Toggle
          checked={form.planned}
          onChange={(v) => set('planned', v)}
          label={t('form.planned')}
        />

        {/* Note */}
        <TextArea
          label={t('form.note')}
          value={form.note}
          onChange={(e) => set('note', e.target.value)}
          placeholder="Opzionale…"
          rows={2}
        />

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} fullWidth>
            {t('actions.cancel')}
          </Button>
          <Button type="submit" variant="primary" fullWidth>
            {t('actions.save')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
