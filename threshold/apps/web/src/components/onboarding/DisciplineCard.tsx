'use client'

import { clsx } from 'clsx'
import type { Discipline } from '@threshold/shared'

const ICONS: Record<Discipline, string> = {
  hyrox: '🏁',
  powerlifting: '🏋️',
  bodybuilding: '💪',
  crossfit: '⚡',
  running: '🏃',
  cycling: '🚴',
  general_fitness: '🎯',
}

interface Props {
  discipline: Discipline
  label: string
  description: string
  selected: boolean
  onSelect: () => void
}

export function DisciplineCard({ discipline, label, description, selected, onSelect }: Props) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={clsx(
        'text-left p-4 rounded-2xl border-2 transition-all w-full',
        selected
          ? 'border-[#FF3B30] bg-[#FF3B30]/10'
          : 'border-[#3A3A3A] bg-[#242424] hover:border-[#FF3B30]/50'
      )}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{ICONS[discipline]}</span>
        <div>
          <p className={clsx('font-semibold text-sm', selected ? 'text-white' : 'text-gray-300')}>
            {label}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
        {selected && (
          <div className="ml-auto w-5 h-5 rounded-full bg-[#FF3B30] flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs">✓</span>
          </div>
        )}
      </div>
    </button>
  )
}
