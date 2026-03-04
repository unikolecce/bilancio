import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', id, ...rest }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-slate-700"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            'block w-full rounded-lg border px-3 py-2 text-sm text-slate-900',
            'placeholder:text-slate-400',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
            'transition-colors',
            error
              ? 'border-rose-400 bg-rose-50'
              : 'border-slate-300 bg-white hover:border-slate-400',
            className,
          ].join(' ')}
          {...rest}
        />
        {error && <p className="text-xs text-rose-600">{error}</p>}
        {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className = '', id, children, ...rest }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={selectId}
            className="text-sm font-medium text-slate-700"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={[
            'block w-full rounded-lg border px-3 py-2 text-sm text-slate-900',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
            'transition-colors appearance-none bg-white',
            error ? 'border-rose-400 bg-rose-50' : 'border-slate-300 hover:border-slate-400',
            className,
          ].join(' ')}
          {...rest}
        >
          {children}
        </select>
        {error && <p className="text-xs text-rose-600">{error}</p>}
      </div>
    )
  }
)
Select.displayName = 'Select'

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, className = '', id, ...rest }, ref) => {
    const taId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={taId} className="text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={taId}
          rows={3}
          className={[
            'block w-full rounded-lg border px-3 py-2 text-sm text-slate-900',
            'placeholder:text-slate-400 resize-none',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
            'transition-colors',
            error ? 'border-rose-400 bg-rose-50' : 'border-slate-300 bg-white hover:border-slate-400',
            className,
          ].join(' ')}
          {...rest}
        />
        {error && <p className="text-xs text-rose-600">{error}</p>}
      </div>
    )
  }
)
TextArea.displayName = 'TextArea'

interface ToggleProps {
  checked: boolean
  onChange(checked: boolean): void
  label?: string
  labelLeft?: string
  labelRight?: string
  variant?: 'default' | 'income-expense'
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  labelLeft,
  labelRight,
  variant = 'default',
}) => {
  if (variant === 'income-expense') {
    return (
      <div className="flex rounded-lg overflow-hidden border border-slate-300">
        <button
          type="button"
          onClick={() => onChange(false)}
          className={[
            'flex-1 py-2 text-sm font-medium transition-colors',
            !checked
              ? 'bg-emerald-600 text-white'
              : 'bg-white text-slate-500 hover:bg-slate-50',
          ].join(' ')}
        >
          {labelLeft}
        </button>
        <button
          type="button"
          onClick={() => onChange(true)}
          className={[
            'flex-1 py-2 text-sm font-medium transition-colors',
            checked
              ? 'bg-rose-600 text-white'
              : 'bg-white text-slate-500 hover:bg-slate-50',
          ].join(' ')}
        >
          {labelRight}
        </button>
      </div>
    )
  }

  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={[
          'relative w-10 h-6 rounded-full transition-colors',
          checked ? 'bg-indigo-600' : 'bg-slate-300',
        ].join(' ')}
      >
        <span
          className={[
            'absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-4' : 'translate-x-0',
          ].join(' ')}
        />
      </button>
      {label && <span className="text-sm text-slate-700">{label}</span>}
    </label>
  )
}
