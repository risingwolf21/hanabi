import { AlertTriangle } from 'lucide-react'
import { cn, COLOR_DISPLAY, getCardDistribution } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { Card, Color } from '@/lib/types'
import { COLORS_BASE, COLORS_ALL } from '@/lib/types'
import type { GameConfig } from '@/lib/types'

interface Props {
  discardPile: Card[]
  config: GameConfig
}

// Count how many copies of each (color, value) are in the pile
function buildCounts(pile: Card[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const card of pile) {
    const key = `${card.color}-${card.value}`
    map.set(key, (map.get(key) ?? 0) + 1)
  }
  return map
}

// Max copies of each value per distribution
function maxCopies(color: Color, value: number, config: GameConfig): number {
  if (color === 'multicolor' && config.multicolorVariant === 2) return 1
  return getCardDistribution().find(([v]) => v === value)?.[1] ?? 0
}

export default function DiscardPile({ discardPile, config }: Props) {
  const counts = buildCounts(discardPile)
  const colors = config.multicolorVariant === 0 ? COLORS_BASE : COLORS_ALL

  if (discardPile.length === 0) {
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-3 text-center">
        <p className="text-xs text-slate-600 italic">Discard pile is empty</p>
      </div>
    )
  }

  return (
    <ScrollArea className="max-h-48 rounded-lg border border-slate-700 bg-slate-800/50">
      <div className="p-2 space-y-1.5">
        <p className="text-[10px] text-slate-500 uppercase tracking-wide px-1">
          Discard Pile ({discardPile.length})
        </p>
        {colors.map(color => {
          const c = COLOR_DISPLAY[color]
          const cardGroups = getCardDistribution()
            .map(([value]) => {
              const key = `${color}-${value}`
              const count = counts.get(key) ?? 0
              if (count === 0) return null
              const max = maxCopies(color, value, config)
              const isLast = count === max
              return { value, count, max, isLast }
            })
            .filter(Boolean) as { value: number; count: number; max: number; isLast: boolean }[]

          if (cardGroups.length === 0) return null

          return (
            <div key={color} className="flex items-center gap-1.5 px-1">
              <div className={cn('w-2.5 h-2.5 rounded-full shrink-0', c.dot)} />
              <span className="text-[10px] text-slate-500 w-12 shrink-0">{c.label}</span>
              <div className="flex gap-1 flex-wrap">
                {cardGroups.map(({ value, count, isLast }) => (
                  <div
                    key={value}
                    className={cn(
                      'flex items-center gap-0.5 rounded px-1 py-0.5',
                      isLast ? 'bg-red-950 border border-red-800' : 'bg-slate-700',
                    )}
                    title={isLast ? 'Last copy! This firework cannot be completed.' : undefined}
                  >
                    {isLast && <AlertTriangle className="h-2.5 w-2.5 text-red-400" />}
                    <span className={cn('text-[10px] font-bold', isLast ? 'text-red-300' : 'text-slate-300')}>
                      {value}
                    </span>
                    {count > 1 && (
                      <span className="text-[9px] text-slate-400">×{count}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}
