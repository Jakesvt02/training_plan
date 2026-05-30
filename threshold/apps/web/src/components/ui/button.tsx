'use client'

import { ButtonHTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, children, className, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          'inline-flex items-center justify-center rounded-xl font-semibold transition-all',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          {
            'bg-gradient-to-r from-[#FF3B30] to-[#FF8C00] text-white hover:opacity-90':
              variant === 'primary',
            'border border-[#3A3A3A] text-gray-300 hover:border-[#FF3B30] hover:text-white':
              variant === 'outline',
            'text-gray-400 hover:text-white': variant === 'ghost',
          },
          {
            'px-3 py-2 text-xs': size === 'sm',
            'px-5 py-3 text-sm': size === 'md',
            'px-6 py-4 text-base w-full': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {loading ? (
          <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        ) : null}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
