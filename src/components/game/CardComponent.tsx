import { cn, COLOR_DISPLAY } from '@/lib/utils'
import type { CardInHand, Color, Value } from '@/lib/types'

interface Props {
  card: CardInHand
  mode: 'front' | 'back'
  selected?: boolean
  highlighted?: boolean
  onClick?: () => void
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: 'w-10 h-14 text-base',
  md: 'w-14 h-20 text-xl',
  lg: 'w-16 h-24 text-2xl',
}

export default function CardComponent({ card, mode, selected, highlighted, onClick, size = 'md' }: Props) {
  if (mode === 'front') {
    const c = COLOR_DISPLAY[card.color]
    return (
      <div
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        className={cn(
          'relative rounded-lg border-2 flex flex-col items-center justify-center cursor-default select-none transition-all duration-150',
          sizes[size],
          c.bg, c.border, c.text,
          onClick && 'cursor-pointer hover:scale-105',
          highlighted && 'ring-4 ring-yellow-400 ring-offset-1 ring-offset-slate-900 scale-105',
          selected && 'ring-4 ring-indigo-400 ring-offset-1 ring-offset-slate-900 scale-105',
        )}
        title={`${c.label} ${card.value}`}
      >
        <span className="font-bold leading-none">{card.value}</span>
        <span className="text-[0.55em] leading-none mt-1 opacity-80">{c.label}</span>
      </div>
    )
  }

  // Back mode — show card back with hint badges
  const hasHints =
    card.colorHints.length > 0 ||
    card.valueHints.length > 0 ||
    card.colorNotHints.length > 0 ||
    card.valueNotHints.length > 0

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      className={cn(
        'relative rounded-lg border-2 border-slate-600 bg-slate-800 flex flex-col items-center justify-between py-1 px-0.5 cursor-default select-none transition-all duration-150',
        sizes[size],
        onClick && 'cursor-pointer hover:scale-105 hover:border-slate-400',
        selected && 'ring-4 ring-indigo-400 ring-offset-1 ring-offset-slate-900 scale-105 border-indigo-500',
      )}
    >
      {/* Decorative back pattern */}
      {!hasHints && (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-5 h-5 border border-slate-600 rounded-sm opacity-40" />
        </div>
      )}

      {hasHints && (
        <div className="flex flex-col gap-0.5 w-full items-center flex-1 justify-center overflow-hidden">
          {/* Positive color hints */}
          {card.colorHints.length > 0 && (
            <div className="flex flex-wrap justify-center gap-0.5">
              {card.colorHints.map((c, i) => (
                <span
                  key={`ch-${i}`}
                  className={cn('w-3 h-3 rounded-full border border-white/20', COLOR_DISPLAY[c].dot)}
                  title={`Is ${COLOR_DISPLAY[c].label}`}
                />
              ))}
            </div>
          )}
          {/* Positive value hints */}
          {card.valueHints.length > 0 && (
            <div className="flex flex-wrap justify-center gap-0.5">
              {card.valueHints.map((v, i) => (
                <span
                  key={`vh-${i}`}
                  className="text-[9px] font-bold bg-yellow-500 text-black rounded px-0.5 leading-tight"
                  title={`Is ${v}`}
                >
                  {v}
                </span>
              ))}
            </div>
          )}
          {/* Negative color hints */}
          {card.colorNotHints.length > 0 && (
            <div className="flex flex-wrap justify-center gap-0.5">
              {card.colorNotHints.map((c, i) => (
                <span
                  key={`nc-${i}`}
                  className={cn('w-3 h-3 rounded-full border border-white/20 opacity-40 relative', COLOR_DISPLAY[c].dot)}
                  title={`Not ${COLOR_DISPLAY[c].label}`}
                >
                  <span className="absolute inset-0 flex items-center justify-center text-white text-[8px] font-bold">×</span>
                </span>
              ))}
            </div>
          )}
          {/* Negative value hints */}
          {card.valueNotHints.length > 0 && (
            <div className="flex flex-wrap justify-center gap-0.5">
              {card.valueNotHints.map((v, i) => (
                <span
                  key={`nv-${i}`}
                  className="text-[9px] font-bold bg-slate-600 text-slate-400 rounded px-0.5 leading-tight line-through"
                  title={`Not ${v}`}
                >
                  {v}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Card index indicator at bottom */}
      <div className="w-1.5 h-1.5 rounded-full bg-slate-600 shrink-0" />
    </div>
  )
}

// Helper to create a placeholder CardInHand for front-mode rendering of plain Card
export function toCardInHand(card: { id: string; color: Color; value: Value }): CardInHand {
  return { ...card, colorHints: [], valueHints: [], colorNotHints: [], valueNotHints: [] }
}
