import { Check } from 'lucide-react'
import { cn, COLOR_DISPLAY, RAINBOW_GRADIENT } from '@/lib/utils'
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
        const isMulti = color === 'multicolor'

        return (
          <div
            key={color}
            className={cn(
              'relative rounded-lg border-2 flex items-center justify-center w-12 h-16 select-none',
              !isMulti && c.bg,
              complete ? 'border-yellow-400' : c.border,
            )}
            style={isMulti ? { background: RAINBOW_GRADIENT } : undefined}
          >
            <span className={cn('text-2xl font-bold drop-shadow', isMulti ? 'text-white' : c.text)}>
              {value || '–'}
            </span>
            {complete && (
              <div className="absolute -top-1.5 -right-1.5 bg-yellow-400 rounded-full w-4 h-4 flex items-center justify-center">
                <Check className="h-2.5 w-2.5 text-yellow-900" />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
