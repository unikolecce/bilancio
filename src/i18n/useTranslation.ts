import { useAppStore } from '../store/appStore'
import { translations } from './translations'
import type { Language } from '../models/types'

type PathsOf<T, Prefix extends string = ''> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? PathsOf<T[K], `${Prefix}${K}.`>
        : `${Prefix}${K}`
    }[keyof T & string]
  : never

export type TKey = PathsOf<typeof translations.it>

/**
 * Returns a `t(key)` function that resolves a dot-notation key
 * against the active language translations.
 */
export const useTranslation = () => {
  const language = useAppStore((s) => s.settings.language) as Language

  const t = (key: TKey): string => {
    const parts = key.split('.')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let current: any = translations[language] ?? translations.it
    for (const part of parts) {
      if (current == null) return key
      current = current[part]
    }
    return typeof current === 'string' ? current : key
  }

  return { t, language }
}
