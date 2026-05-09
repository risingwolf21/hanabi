import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn, COLOR_DISPLAY } from '@/lib/utils'
import type { CardInHand, ClueType, Color, Value, Player, GameConfig } from '@/lib/types'
import { COLORS_BASE, COLORS_ALL } from '@/lib/types'
import CardComponent from './CardComponent'

interface Props {
  isOpen: boolean
  onClose: () => void
  onConfirm: (targetId: string, clueType: ClueType, clueValue: Color | Value) => void
  players: Player[]
  hands: Record<string, CardInHand[]>
  currentPlayerId: string
  config: GameConfig
}

const VALUES: Value[] = [1, 2, 3, 4, 5]

function matchesClue(
  card: CardInHand,
  clueType: ClueType,
  clueValue: Color | Value,
  config: GameConfig,
): boolean {
  if (clueType === 'color') {
    const color = clueValue as Color
    if (config.multicolorVariant === 3 && card.color === 'multicolor') return true
    return card.color === color
  }
  return card.value === (clueValue as Value)
}

export default function ClueModal({
  isOpen, onClose, onConfirm, players, hands, currentPlayerId, config,
}: Props) {
  const [targetId, setTargetId] = useState<string | null>(null)
  const [clueType, setClueType] = useState<ClueType>('color')
  const [selectedColor, setSelectedColor] = useState<Color | null>(null)
  const [selectedValue, setSelectedValue] = useState<Value | null>(null)

  const targets = players.filter(p => p.id !== currentPlayerId)
  const clueValue = clueType === 'color' ? selectedColor : selectedValue

  const availableColors = config.multicolorVariant === 0 ? COLORS_BASE : COLORS_ALL
  // Variant 3 cannot use multicolor as a clue color
  const clueableColors =
    config.multicolorVariant === 3
      ? availableColors.filter(c => c !== 'multicolor')
      : availableColors

  const highlightedIds: string[] =
    targetId && clueValue !== null
      ? (hands[targetId] ?? [])
          .filter(card => matchesClue(card, clueType, clueValue, config))
          .map(c => c.id)
      : []

  const canConfirm = !!targetId && clueValue !== null && highlightedIds.length > 0

  function handleConfirm() {
    if (!targetId || clueValue === null) return
    onConfirm(targetId, clueType, clueValue)
    resetAndClose()
  }

  function resetAndClose() {
    setTargetId(null)
    setClueType('color')
    setSelectedColor(null)
    setSelectedValue(null)
    onClose()
  }

  function switchClueType(type: ClueType) {
    setClueType(type)
    setSelectedColor(null)
    setSelectedValue(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => { if (!open) resetAndClose() }}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Give a Clue</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Step 1: Target player */}
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">1. Choose a player</p>
            <div className="flex flex-wrap gap-2">
              {targets.map(p => (
                <button
                  key={p.id}
                  onClick={() => setTargetId(p.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-md border text-sm transition-colors',
                    targetId === p.id
                      ? 'border-indigo-500 bg-indigo-900/40 text-indigo-200'
                      : 'border-slate-600 bg-slate-800 text-slate-300 hover:border-slate-400',
                  )}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Clue type */}
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">2. Clue type</p>
            <div className="flex gap-2">
              {(['color', 'value'] as ClueType[]).map(t => (
                <button
                  key={t}
                  onClick={() => switchClueType(t)}
                  className={cn(
                    'px-4 py-1.5 rounded-md border text-sm capitalize transition-colors',
                    clueType === t
                      ? 'border-indigo-500 bg-indigo-900/40 text-indigo-200'
                      : 'border-slate-600 bg-slate-800 text-slate-300 hover:border-slate-400',
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Specific value */}
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">3. Choose {clueType}</p>
            {clueType === 'color' ? (
              <div className="flex flex-wrap gap-2">
                {clueableColors.map(color => {
                  const c = COLOR_DISPLAY[color]
                  return (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={cn(
                        'w-10 h-10 rounded-lg border-2 transition-all',
                        c.bg,
                        selectedColor === color
                          ? 'border-white scale-110 ring-2 ring-white ring-offset-2 ring-offset-slate-900'
                          : 'border-transparent opacity-80 hover:opacity-100',
                      )}
                      title={c.label}
                    />
                  )
                })}
              </div>
            ) : (
              <div className="flex gap-2">
                {VALUES.map(v => (
                  <button
                    key={v}
                    onClick={() => setSelectedValue(v)}
                    className={cn(
                      'w-10 h-10 rounded-lg border-2 text-lg font-bold transition-all',
                      selectedValue === v
                        ? 'border-indigo-400 bg-indigo-900/50 text-indigo-200 scale-110'
                        : 'border-slate-600 bg-slate-800 text-slate-300 hover:border-slate-400',
                    )}
                  >
                    {v}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Preview */}
          {targetId && (
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">
                Preview — {players.find(p => p.id === targetId)?.name}'s hand
                {highlightedIds.length > 0 && (
                  <span className="text-yellow-400 ml-2">
                    ({highlightedIds.length} card{highlightedIds.length !== 1 ? 's' : ''} match)
                  </span>
                )}
                {clueValue !== null && highlightedIds.length === 0 && (
                  <span className="text-red-400 ml-2">(no cards match — invalid)</span>
                )}
              </p>
              <div className="flex gap-2 flex-wrap">
                {(hands[targetId] ?? []).map(card => (
                  <CardComponent
                    key={card.id}
                    card={card}
                    mode="front"
                    highlighted={highlightedIds.includes(card.id)}
                    size="md"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button variant="ghost" onClick={resetAndClose} className="flex-1">Cancel</Button>
            <Button onClick={handleConfirm} disabled={!canConfirm} className="flex-1">
              Give Clue
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
