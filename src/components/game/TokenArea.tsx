import { Lightbulb, Flame } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MAX_CLOCKS, MAX_FUSES } from '@/lib/types'

interface Props {
  clocks: number
  fuses: number
  deckCount: number
}

export default function TokenArea({ clocks, fuses, deckCount }: Props) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-700 bg-slate-800/50 p-3">
      {/* Deck count */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 w-16 shrink-0">Deck</span>
        <span className="text-sm font-bold text-slate-200">{deckCount}</span>
        <span className="text-xs text-slate-500">cards left</span>
      </div>

      {/* Hint tokens */}
      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <Lightbulb className="h-3.5 w-3.5 text-yellow-400" />
          <span className="text-xs text-slate-400">Hints {clocks}/{MAX_CLOCKS}</span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: MAX_CLOCKS }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-5 h-5 rounded-full border-2 transition-colors',
                i < clocks
                  ? 'bg-yellow-400 border-yellow-300'
                  : 'bg-transparent border-slate-600',
              )}
            />
          ))}
        </div>
      </div>

      {/* Fuse tokens */}
      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <Flame className="h-3.5 w-3.5 text-red-400" />
          <span className="text-xs text-slate-400">Fuses {fuses}/{MAX_FUSES}</span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: MAX_FUSES }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-5 h-5 rounded-full border-2 transition-colors',
                i < fuses
                  ? 'bg-red-500 border-red-400'
                  : 'bg-transparent border-slate-600',
              )}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
