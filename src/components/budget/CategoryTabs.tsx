import React, { useRef, useState, useEffect } from 'react'
import type { BudgetMonth } from '../../models/types'
import { computeCategorySummaries } from '../../utils/calculations'
import { formatCurrency } from '../../utils/currency'
import { useTranslation } from '../../i18n/useTranslation'

interface CategoryTabsProps {
  month: BudgetMonth
  activeCategoryId: string | null
  onChange(categoryId: string | null): void
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  month,
  activeCategoryId,
  onChange,
}) => {
  const { t } = useTranslation()
  const summaries = computeCategorySummaries(month)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }

  useEffect(() => {
    checkScroll()
    const el = scrollRef.current
    el?.addEventListener('scroll', checkScroll, { passive: true })
    window.addEventListener('resize', checkScroll)
    return () => {
      el?.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [month.categories])

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'right' ? 160 : -160, behavior: 'smooth' })
  }

  const tabs = [
    { id: null, name: t('filter.all'), color: '#6366f1', net: 0 },
    ...summaries.map((s) => ({
      id: s.categoryId,
      name: s.name,
      color: s.color,
      net: s.totalIncome - s.totalExpenses,
    })),
  ]

  return (
    <div className="relative flex items-center gap-1">
      {/* Left arrow */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg
            bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 shadow-sm transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Scroll container */}
      <div className="relative flex-1 min-w-0">
        <div
          ref={scrollRef}
          className="flex gap-1 overflow-x-auto scrollbar-hide pb-0.5"
          onScroll={checkScroll}
        >
          {tabs.map((tab) => {
            const active = activeCategoryId === tab.id
            return (
              <button
                key={tab.id ?? 'all'}
                onClick={() => onChange(tab.id)}
                className={[
                  'flex-none flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium',
                  'transition-colors whitespace-nowrap',
                  active
                    ? 'text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300',
                ].join(' ')}
                style={active ? { backgroundColor: tab.color } : undefined}
              >
                {tab.id !== null && (
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: active ? 'rgba(255,255,255,0.7)' : tab.color }}
                  />
                )}
                {tab.name}
                {tab.id !== null && (
                  <span
                    className={[
                      'text-xs px-1.5 py-0.5 rounded-full',
                      active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500',
                    ].join(' ')}
                  >
                    {tab.net >= 0 ? '+' : ''}
                    {formatCurrency(tab.net, month.currency)}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Right fade overlay — only when there's more to scroll */}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0.5 w-12
            bg-gradient-to-l from-slate-50 via-slate-50/80 to-transparent pointer-events-none" />
        )}
      </div>

      {/* Right arrow */}
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg
            bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 shadow-sm transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  )
}
