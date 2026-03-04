import type { AppData } from '../../models/types'

/**
 * Abstract storage interface.
 * Swap LocalStorageAdapter → SupabaseAdapter when ready to add a backend.
 */
export interface StorageAdapter {
  /** Load the full app data. Returns null if nothing is stored yet. */
  load(): AppData | null

  /** Persist the full app data. */
  save(data: AppData): void

  /** Serialize the data for download. */
  exportJSON(): string

  /** Parse and validate an imported JSON string, then persist it. */
  importJSON(json: string): AppData

  /** Wipe all stored data. */
  clear(): void
}
