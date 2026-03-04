import type { StorageAdapter } from './StorageAdapter'
import type { AppData, Language, Settings } from '../../models/types'
import { getDefaultTemplate } from '../../i18n/defaultTemplates'

const STORAGE_KEY = 'mbp_data_v1'
const SCHEMA_VERSION = 1

// ─── Browser language detection ───────────────────────────────────────────────

const SUPPORTED: Language[] = ['it', 'en', 'de']

function detectLanguage(): Language {
  try {
    const codes = navigator.languages?.length ? navigator.languages : [navigator.language]
    for (const code of codes) {
      const prefix = code.toLowerCase().split('-')[0]
      if ((SUPPORTED as string[]).includes(prefix)) return prefix as Language
    }
  } catch { /* non-browser environment */ }
  return 'en'
}

// Evaluated once at module load — picks up the OS/browser language on first run.
const browserLang = detectLanguage()

const DEFAULT_SETTINGS: Settings = {
  currency: 'EUR',
  language: browserLang,
  onboardingComplete: false,
}

export const DEFAULT_DATA: AppData = {
  schemaVersion: SCHEMA_VERSION,
  months: [],
  template: getDefaultTemplate(browserLang),
  settings: DEFAULT_SETTINGS,
  savingsJars: [],
}

// ─── Adapter ──────────────────────────────────────────────────────────────────

export class LocalStorageAdapter implements StorageAdapter {
  load(): AppData | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw) as Partial<AppData>
      return this.migrate(parsed)
    } catch {
      console.warn('[storage] Failed to load data, starting fresh.')
      return null
    }
  }

  save(data: AppData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (err) {
      console.error('[storage] Save failed:', err)
    }
  }

  exportJSON(): string {
    const data = this.load() ?? DEFAULT_DATA
    return JSON.stringify(data, null, 2)
  }

  importJSON(json: string): AppData {
    let parsed: unknown
    try {
      parsed = JSON.parse(json)
    } catch {
      throw new Error('JSON non valido / Invalid JSON / Ungültiges JSON')
    }

    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !Array.isArray((parsed as AppData).months)
    ) {
      throw new Error('Formato dati non riconosciuto / Unrecognized data format')
    }

    const migrated = this.migrate(parsed as Partial<AppData>)
    this.save(migrated)
    return migrated
  }

  clear(): void {
    localStorage.removeItem(STORAGE_KEY)
  }

  // ── Future-proof migration hook ─────────────────────────────────────────────
  private migrate(raw: Partial<AppData>): AppData {
    const base: AppData = { ...DEFAULT_DATA }

    // schemaVersion: 1 → future versions get migrations here
    const mergedSettings: Settings = { ...base.settings, ...(raw.settings ?? {}) }
    // Existing users (who have months or template items) skip onboarding automatically
    if (mergedSettings.onboardingComplete === undefined) {
      const hasData = (raw.months?.length ?? 0) > 0 || (raw.template?.items?.length ?? 0) > 0
      mergedSettings.onboardingComplete = hasData
    }

    // ── Backfill category.type for data saved before this field was added ──────
    // A category is INCOME if it has at least one INCOME item; otherwise EXPENSE.
    const rawTemplate = raw.template ?? base.template
    const patchedTemplateCats = (rawTemplate.categories ?? []).map((cat) => {
      if (cat.type) return cat
      const hasIncome = (rawTemplate.items ?? []).some(
        (i) => i.categoryId === cat.id && i.type === 'INCOME'
      )
      return { ...cat, type: hasIncome ? 'INCOME' as const : 'EXPENSE' as const }
    })

    const rawMonths = raw.months ?? base.months
    const patchedMonths = rawMonths.map((month) => ({
      ...month,
      categories: month.categories.map((cat) => {
        if (cat.type) return cat
        const hasIncome = month.items.some(
          (i) => i.categoryId === cat.id && i.type === 'INCOME'
        )
        return { ...cat, type: hasIncome ? 'INCOME' as const : 'EXPENSE' as const }
      }),
    }))

    return {
      schemaVersion: SCHEMA_VERSION,
      months: patchedMonths,
      template: { ...rawTemplate, categories: patchedTemplateCats },
      settings: mergedSettings,
      savingsJars: raw.savingsJars ?? [],
    }
  }
}
