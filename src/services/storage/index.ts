/**
 * Storage service singleton.
 *
 * To migrate to Supabase:
 *   1. Create `SupabaseAdapter.ts` implementing `StorageAdapter`
 *   2. Replace the import below — zero other changes needed.
 */
import { LocalStorageAdapter } from './LocalStorageAdapter'

export { DEFAULT_DATA } from './LocalStorageAdapter'
export type { StorageAdapter } from './StorageAdapter'

export const storageService = new LocalStorageAdapter()
