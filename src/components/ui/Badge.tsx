import React from 'react'

type BadgeVariant = 'income' | 'expense' | 'planned' | 'paid' | 'neutral' | 'category'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  dot?: boolean
  color?: string // for category badges
}

const variantStyles: Record<BadgeVariant, string> = {
  income: 'bg-emerald-100 text-emerald-700',
  expense: 'bg-rose-100 text-rose-700',
  planned: 'bg-amber-100 text-amber-700',
  paid: 'bg-emerald-100 text-emerald-700',
  neutral: 'bg-slate-100 text-slate-600',
  category: 'text-white',
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  dot = false,
  color,
}) => {
  const style = color ? { backgroundColor: color + '22', color } : undefined
  return (
    <span
      className={[
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
        color ? '' : variantStyles[variant],
      ].join(' ')}
      style={style}
    >
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={color ? { backgroundColor: color } : undefined}
        />
      )}
      {children}
    </span>
  )
}
