import { useEffect, useRef, useState } from 'react'
import {
  DndContext, closestCenter, PointerSensor, TouchSensor,
  useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, horizontalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
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
  interactionMode?: 'select' | 'view'
  size?: 'sm' | 'md' | 'lg'
  highlightedCardIds?: string[]
  hideHints?: boolean
}

// Wrapper that makes a single card sortable
function SortableCard({
  card, selected, highlighted, isNew, hideHints, size, canSelect, onCardSelect,
}: {
  card: CardInHand
  selected: boolean
  highlighted: boolean
  isNew: boolean
  hideHints: boolean
  size: 'sm' | 'md' | 'lg'
  canSelect: boolean
  onCardSelect?: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
    touchAction: 'none',
  }
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <CardComponent
        card={card}
        mode="back"
        selected={selected}
        highlighted={highlighted}
        isNew={isNew}
        hideHints={hideHints}
        size={size}
        onClick={canSelect ? () => onCardSelect?.(card.id) : undefined}
      />
    </div>
  )
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
  hideHints = false,
}: Props) {
  const canSelect = isOwnHand && interactionMode === 'select'

  // Card order for own hand (drag-and-drop reordering)
  const [cardOrder, setCardOrder] = useState<string[]>(() => hand.map(c => c.id))
  const [newCardId, setNewCardId] = useState<string | null>(null)
  const prevIdsRef = useRef<Set<string>>(new Set(hand.map(c => c.id)))

  // Sync order when hand changes — detect newly drawn card
  useEffect(() => {
    if (!isOwnHand) return
    const currentIds = new Set(hand.map(c => c.id))
    const added = hand.filter(c => !prevIdsRef.current.has(c.id))
    prevIdsRef.current = currentIds

    setCardOrder(prev => {
      // Remove cards no longer in hand
      const kept = prev.filter(id => currentIds.has(id))
      // Append any new cards
      const newIds = added.map(c => c.id).filter(id => !kept.includes(id))
      return [...kept, ...newIds]
    })

    if (added.length > 0) {
      setNewCardId(added[0].id)
      const t = setTimeout(() => setNewCardId(null), 3200)
      return () => clearTimeout(t)
    }
  }, [hand, isOwnHand])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setCardOrder(prev => {
        const oldIndex = prev.indexOf(active.id as string)
        const newIndex = prev.indexOf(over.id as string)
        return arrayMove(prev, oldIndex, newIndex)
      })
    }
  }

  // Build display list respecting drag order
  const orderedHand = isOwnHand
    ? cardOrder.map(id => hand.find(c => c.id === id)).filter(Boolean) as CardInHand[]
    : hand

  if (!isOwnHand) {
    return (
      <div
        className={cn(
          'flex flex-col gap-1 rounded-lg p-2',
          isCurrentPlayer && 'ring-2 ring-indigo-500 bg-slate-800/50',
        )}
      >
        <div className="flex items-center gap-1.5 px-1">
          <span className="text-xs font-medium text-slate-300 truncate max-w-[100px]">{player.name}</span>
          {isCurrentPlayer && <Badge variant="secondary" className="text-[10px] px-1 py-0">Turn</Badge>}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {orderedHand.map(card => (
            <CardComponent
              key={card.id}
              card={card}
              mode="front"
              highlighted={highlightedCardIds.includes(card.id)}
              size={size}
            />
          ))}
          {orderedHand.length === 0 && <span className="text-xs text-slate-600 italic px-1">No cards</span>}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-1 rounded-lg p-2',
        isCurrentPlayer && 'ring-2 ring-indigo-500 bg-slate-800/50',
      )}
    >
      <div className="flex items-center gap-1.5 px-1">
        <span className="text-xs font-medium text-slate-300 truncate max-w-[100px]">{player.name}</span>
        <Badge variant="default" className="text-[10px] px-1 py-0">You</Badge>
        {isCurrentPlayer && <Badge variant="secondary" className="text-[10px] px-1 py-0">Turn</Badge>}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={cardOrder} strategy={horizontalListSortingStrategy}>
          <div className="flex gap-1.5 flex-wrap">
            {orderedHand.map(card => (
              <SortableCard
                key={card.id}
                card={card}
                selected={selectedCardId === card.id}
                highlighted={highlightedCardIds.includes(card.id)}
                isNew={newCardId === card.id}
                hideHints={hideHints}
                size={size}
                canSelect={canSelect}
                onCardSelect={onCardSelect}
              />
            ))}
            {orderedHand.length === 0 && <span className="text-xs text-slate-600 italic px-1">No cards</span>}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
