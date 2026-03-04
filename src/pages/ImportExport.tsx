import React, { useRef, useState } from 'react'
import { useAppStore } from '../store/appStore'
import { useTranslation } from '../i18n/useTranslation'
import type { Currency, Language } from '../models/types'
import { Button } from '../components/ui/Button'
import { Select } from '../components/ui/Input'

const CURRENCIES: Currency[] = ['EUR', 'USD', 'CHF', 'GBP']
const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'it', label: '🇮🇹 Italiano' },
  { value: 'en', label: '🇬🇧 English' },
  { value: 'de', label: '🇩🇪 Deutsch' },
]

export const ImportExport: React.FC = () => {
  const { t } = useTranslation()
  const { exportData, importData, clearAllData, settings, setLanguage, setCurrency } =
    useAppStore((s) => ({
      exportData: s.exportData,
      importData: s.importData,
      clearAllData: s.clearAllData,
      settings: s.settings,
      setLanguage: s.setLanguage,
      setCurrency: s.setCurrency,
    }))

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importMsg, setImportMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const handleExport = () => {
    const json = exportData()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `budget-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      try {
        importData(text)
        setImportMsg({ type: 'ok', text: t('messages.importSuccess') })
      } catch (err) {
        setImportMsg({ type: 'err', text: t('messages.importError') + String(err) })
      }
    }
    reader.readAsText(file)
    // Reset so same file can be re-imported
    e.target.value = ''
  }

  const handleClear = () => {
    if (window.confirm(t('messages.clearConfirm'))) {
      clearAllData()
      setImportMsg({ type: 'ok', text: t('messages.cleared') })
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto w-full flex flex-col gap-6">
      {/* Settings */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5">
        <h2 className="text-base font-semibold text-slate-900 mb-4">{t('settings.title')}</h2>
        <div className="flex flex-col gap-4">
          <Select
            label={t('settings.language')}
            value={settings.language}
            onChange={(e) => setLanguage(e.target.value as Language)}
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </Select>

          <Select
            label={t('settings.currency')}
            value={settings.currency}
            onChange={(e) => setCurrency(e.target.value as Currency)}
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
        </div>
      </section>

      {/* Export */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5">
        <h2 className="text-base font-semibold text-slate-900 mb-1">
          {t('importExport.title')}
        </h2>
        <div className="flex flex-col gap-4 mt-4">
          {/* Export */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-700">{t('actions.export')}</p>
              <p className="text-xs text-slate-500">{t('importExport.exportDesc')}</p>
            </div>
            <Button
              variant="secondary"
              onClick={handleExport}
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              }
            >
              {t('actions.export')}
            </Button>
          </div>

          <div className="h-px bg-slate-100" />

          {/* Import */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-700">{t('actions.import')}</p>
              <p className="text-xs text-slate-500">{t('importExport.importDesc')}</p>
            </div>
            <Button
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l4-4m0 0l4 4m-4-4v12" />
                </svg>
              }
            >
              {t('actions.import')}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleImport}
              className="hidden"
            />
          </div>

          {/* Status message */}
          {importMsg && (
            <div
              className={[
                'rounded-lg px-4 py-3 text-sm',
                importMsg.type === 'ok'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200',
              ].join(' ')}
            >
              {importMsg.text}
            </div>
          )}
        </div>
      </section>

      {/* Danger zone */}
      <section className="bg-white rounded-2xl border border-rose-200 p-5">
        <h2 className="text-base font-semibold text-rose-700 mb-1">
          {t('importExport.dangerZone')}
        </h2>
        <div className="flex items-center justify-between gap-4 mt-4">
          <div>
            <p className="text-sm font-medium text-slate-700">{t('actions.clearData')}</p>
            <p className="text-xs text-slate-500">{t('importExport.clearDesc')}</p>
          </div>
          <Button
            variant="danger"
            onClick={handleClear}
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            }
          >
            {t('actions.clearData')}
          </Button>
        </div>
      </section>
    </div>
  )
}
