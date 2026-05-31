'use client'

import { clsx } from 'clsx'

const STEPS = [
  { n: 1, label: 'Account' },
  { n: 2, label: 'Body Stats' },
  { n: 3, label: 'Measurements' },
  { n: 4, label: 'Training' },
  { n: 5, label: 'Goal' },
]

export function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10 w-full max-w-lg mx-auto">
      {STEPS.map((step, i) => (
        <div key={step.n} className="flex items-center flex-1">
          <div className="flex flex-col items-center gap-1 flex-1">
            <div
              className={clsx(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                current === step.n &&
                  'bg-gradient-to-br from-[#FF3B30] to-[#FF8C00] text-white scale-110',
                current > step.n && 'bg-[#FF3B30]/20 text-[#FF3B30]',
                current < step.n && 'bg-[#3A3A3A] text-gray-500'
              )}
            >
              {current > step.n ? '✓' : step.n}
            </div>
            <span
              className={clsx(
                'text-[10px] font-medium hidden sm:block',
                current === step.n ? 'text-white' : 'text-gray-500'
              )}
            >
              {step.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={clsx(
                'h-px flex-1 mb-4 transition-all',
                current > step.n ? 'bg-[#FF3B30]/40' : 'bg-[#3A3A3A]'
              )}
            />
          )}
        </div>
      ))}
    </div>
  )
}
