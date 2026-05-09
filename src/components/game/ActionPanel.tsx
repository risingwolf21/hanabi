import { Lightbulb, Trash2, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'

interface Props {
  canHint: boolean
  canDiscard: boolean
  selectedCardId: string | null
  onGiveClue: () => void
  onDiscard: () => void
  onPlay: () => void
  disabled?: boolean
}

export default function ActionPanel({
  canHint,
  canDiscard,
  selectedCardId,
  onGiveClue,
  onDiscard,
  onPlay,
  disabled = false,
}: Props) {
  const hasCard = !!selectedCardId

  return (
    <TooltipProvider>
      <div className="flex gap-2 flex-wrap">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex-1">
              <Button
                className="w-full"
                variant="outline"
                onClick={onGiveClue}
                disabled={disabled || !canHint}
              >
                <Lightbulb className="h-4 w-4" />
                Give Clue
              </Button>
            </span>
          </TooltipTrigger>
          {!canHint && (
            <TooltipContent>No hint tokens remaining. Discard a card to regain one.</TooltipContent>
          )}
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex-1">
              <Button
                className="w-full"
                variant="secondary"
                onClick={onDiscard}
                disabled={disabled || !canDiscard || !hasCard}
              >
                <Trash2 className="h-4 w-4" />
                Discard
              </Button>
            </span>
          </TooltipTrigger>
          {(!canDiscard || !hasCard) && (
            <TooltipContent>
              {!canDiscard
                ? 'All hint tokens are full. Play a card or give a clue.'
                : 'Select a card from your hand first.'}
            </TooltipContent>
          )}
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex-1">
              <Button
                className="w-full"
                variant="success"
                onClick={onPlay}
                disabled={disabled || !hasCard}
              >
                <Play className="h-4 w-4" />
                Play Card
              </Button>
            </span>
          </TooltipTrigger>
          {!hasCard && (
            <TooltipContent>Select a card from your hand first.</TooltipContent>
          )}
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}
