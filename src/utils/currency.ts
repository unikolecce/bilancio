import type { Currency } from '../models/types'

/**
 * Formats a number as currency string using Intl.NumberFormat.
 */
export const formatCurrency = (amount: number, currency: Currency = 'EUR'): string => {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Parses a user-typed amount string (accepts both comma and period as decimal separator).
 * Returns NaN if invalid.
 */
export const parseAmount = (raw: string): number => {
  if (!raw || raw.trim() === '') return NaN
  // Replace comma with period, strip non-numeric except leading minus and decimal
  const normalised = raw.trim().replace(',', '.')
  const value = parseFloat(normalised)
  if (isNaN(value) || value < 0) return NaN
  // Round to 2 decimal places to avoid floating-point issues
  return Math.round(value * 100) / 100
}

/**
 * Returns whether an amount string is valid (> 0, max 2 decimal places).
 */
export const isValidAmount = (raw: string): boolean => {
  const v = parseAmount(raw)
  if (isNaN(v) || v <= 0) return false
  const parts = raw.replace(',', '.').split('.')
  if (parts[1] && parts[1].length > 2) return false
  return true
}

/**
 * Formats a number for display in an input field (e.g., "12.99").
 */
export const amountToInputValue = (amount: number): string => {
  if (amount === 0) return ''
  return amount.toFixed(2).replace(/\.?0+$/, '')
}

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  EUR: '€',
  USD: '$',
  CHF: 'Fr.',
  GBP: '£',
}
