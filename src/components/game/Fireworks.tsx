import { Check } from 'lucide-react'
import { cn, COLOR_DISPLAY } from '@/lib/utils'
import type { Color, GameConfig } from '@/lib/types'
import { getActiveColors } from '@/lib/gameEngine'

interface Props {
  fireworks: Record<Color, number>
  config: GameConfig
}

export default function Fireworks({ fireworks, config }: Props) {
  const colors = getActiveColors(config)

  return (
    <div className="flex gap-2 flex-wrap">
      {colors.map(color => {
        const value = fireworks[color] ?? 0
        const complete = value === 5
        const c = COLOR_DISPLAY[color]

        return (
          <div
            key={color}
            className={cn(
              'flex flex-col items-center rounded-lg border-2 px-3 py-2 min-w-[60px]',
              complete
                ? 'border-yellow-400 bg-yellow-950/30'
                : 'border-slate-700 bg-slate-800/50',
            )}
          >
            {/* Color swatch + label */}
            <div className="flex items-center gap-1 mb-1">
              <div className={cn('w-3 h-3 rounded-full', c.dot)} />
              <span className="text-[10px] text-slate-400 uppercase tracking-wide">{c.label}</span>
              {complete && <Check className="h-3 w-3 text-yellow-400" />}
            </div>

            {/* Value */}
            <div className={cn('text-2xl font-bold leading-none', complete ? 'text-yellow-300' : 'text-white')}>
              {value}
            </div>

            {/* Progress pips */}
            <div className="flex gap-0.5 mt-1.5">
              {[1, 2, 3, 4, 5].map(n => (
                <div
                  key={n}
                  className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    n <= value ? c.dot : 'bg-slate-700',
                  )}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
