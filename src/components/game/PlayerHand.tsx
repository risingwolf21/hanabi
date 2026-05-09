import { cn } from '@/lib/utils'
import type { CardInHand, Player } from '@/lib/types'
import CardComponent from './CardComponent'
import { Badge } from '@/components/ui/badge'

interface Props {
  player: Player
  hand: CardInHand[]
  isOwnHand: boolean
  isCurrentPlayer: boolean
  selectedCardId?: string | null
  onCardSelect?: (cardId: string) => void
  /** 'select' = card can be clicked to select; 'view' = read-only */
  interactionMode?: 'select' | 'view'
  size?: 'sm' | 'md' | 'lg'
  highlightedCardIds?: string[]
}

export default function PlayerHand({
  player,
  hand,
  isOwnHand,
  isCurrentPlayer,
  selectedCardId,
  onCardSelect,
  interactionMode = 'view',
  size = 'md',
  highlightedCardIds = [],
}: Props) {
  const canSelect = isOwnHand && interactionMode === 'select'

  return (
    <div
      className={cn(
        'flex flex-col gap-1 rounded-lg p-2',
        isCurrentPlayer && 'ring-2 ring-indigo-500 bg-slate-800/50',
      )}
    >
      {/* Player label */}
      <div className="flex items-center gap-1.5 px-1">
        <span className="text-xs font-medium text-slate-300 truncate max-w-[100px]">
          {player.name}
        </span>
        {isOwnHand && <Badge variant="default" className="text-[10px] px-1 py-0">You</Badge>}
        {isCurrentPlayer && (
          <Badge variant="secondary" className="text-[10px] px-1 py-0">Turn</Badge>
        )}
      </div>

      {/* Cards */}
      <div className="flex gap-1.5 flex-wrap">
        {hand.map(card => (
          <CardComponent
            key={card.id}
            card={card}
            mode={isOwnHand ? 'back' : 'front'}
            selected={selectedCardId === card.id}
            highlighted={highlightedCardIds.includes(card.id)}
            size={size}
            onClick={canSelect ? () => onCardSelect?.(card.id) : undefined}
          />
        ))}
        {hand.length === 0 && (
          <span className="text-xs text-slate-600 italic px-1">No cards</span>
        )}
      </div>
    </div>
  )
}
