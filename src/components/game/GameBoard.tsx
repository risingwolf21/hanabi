import { useState, useEffect, useCallback } from 'react'
import type { GameState, ClueType, Color, Value } from '@/lib/types'
import { canGiveClue, canDiscard } from '@/lib/gameEngine'
import TokenArea from './TokenArea'
import Fireworks from './Fireworks'
import DiscardPile from './DiscardPile'
import PlayerHand from './PlayerHand'
import ActionPanel from './ActionPanel'
import ClueModal from './ClueModal'
import GameOverScreen from './GameOverScreen'
import CardActionOverlay from './CardActionOverlay'
import { Badge } from '@/components/ui/badge'

interface Props {
  gameState: GameState
  myPlayerId: string | null
  onGiveClue: (targetId: string, clueType: ClueType, clueValue: Color | Value) => Promise<void>
  onDiscard: (cardId: string) => Promise<void>
  onPlay: (cardId: string) => Promise<void>
  onLeave: () => Promise<void>
  onReorderHand: (order: string[]) => Promise<void>
  error: string | null
  clearError: () => void
}

export default function GameBoard({
  gameState,
  myPlayerId,
  onGiveClue,
  onDiscard,
  onPlay,
  onLeave,
  onReorderHand,
  error,
  clearError,
}: Props) {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [clueModalOpen, setClueModalOpen] = useState(false)
  const [actionPending, setActionPending] = useState(false)
  const [lastActionId, setLastActionId] = useState<string | null>(null)
  const [flashingCardIds, setFlashingCardIds] = useState<string[]>([])
  const [leaving, setLeaving] = useState(false)

  const isAbandoned = gameState.abandonedBy !== null && gameState.status !== 'ended'

  async function handleLeave() {
    setLeaving(true)
    try { await onLeave() } finally { setLeaving(false) }
  }

  const isMyTurn =
    gameState.status === 'playing' &&
    gameState.players[gameState.currentPlayerIndex]?.id === myPlayerId

  // Flash cards when a clue is given
  useEffect(() => {
    const action = gameState.lastAction
    if (!action || action.type !== 'clue') return
    const key = `${action.actorId}-${action.clueValue}-${action.cardIds.join('')}`
    if (key === lastActionId) return
    setLastActionId(key)
    setFlashingCardIds(action.cardIds)
    const timer = setTimeout(() => setFlashingCardIds([]), 1500)
    return () => clearTimeout(timer)
  }, [gameState.lastAction, lastActionId])

  const wrap = useCallback(
    async (fn: () => Promise<void>) => {
      setActionPending(true)
      try {
        await fn()
        setSelectedCardId(null)
      } finally {
        setActionPending(false)
      }
    },
    [],
  )

  function handleGiveClue(targetId: string, clueType: ClueType, clueValue: Color | Value) {
    setClueModalOpen(false)
    wrap(() => onGiveClue(targetId, clueType, clueValue))
  }

  function handleDiscard() {
    if (!selectedCardId) return
    wrap(() => onDiscard(selectedCardId))
  }

  function handlePlay() {
    if (!selectedCardId) return
    wrap(() => onPlay(selectedCardId))
  }

  const myPlayer = gameState.players.find(p => p.id === myPlayerId)
  const myHand = myPlayerId ? (gameState.hands[myPlayerId] ?? []) : []
  const otherPlayers = gameState.players.filter(p => p.id !== myPlayerId)

  return (
    <div className="min-h-screen bg-slate-950 p-3 flex flex-col gap-3">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-mono">{gameState.id}</span>
          {gameState.lastRoundStarted && (
            <Badge variant="warning" className="animate-pulse">
              Last Round! {gameState.lastRoundTurnsLeft} turn{gameState.lastRoundTurnsLeft !== 1 ? 's' : ''} left
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">
            {gameState.players[gameState.currentPlayerIndex]?.name}'s turn
          </span>
          <button
            onClick={handleLeave}
            disabled={leaving}
            className="text-xs text-slate-600 hover:text-red-400 transition-colors disabled:opacity-50"
          >
            {leaving ? 'Leaving…' : 'Leave'}
          </button>
        </div>
      </div>

      {/* Error toast */}
      {error && (
        <div
          className="bg-red-950 border border-red-800 text-red-300 text-sm px-3 py-2 rounded-md cursor-pointer"
          onClick={clearError}
        >
          {error} <span className="text-red-500 ml-2">✕</span>
        </div>
      )}

      {/* Main game area */}
      <div className="flex flex-col gap-3 lg:flex-row">
        {/* Left column: tokens + discard */}
        <div className="flex flex-col gap-3 lg:w-48 shrink-0">
          <TokenArea
            clocks={gameState.clocks}
            fuses={gameState.fuses}
            deckCount={gameState.deck.length}
          />
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1 px-1">Discard</p>
            <DiscardPile discardPile={gameState.discardPile} config={gameState.config} />
          </div>
        </div>

        {/* Center column: fireworks + players */}
        <div className="flex-1 flex flex-col gap-3">
          {/* Fireworks */}
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1 px-1">Fireworks</p>
            <Fireworks fireworks={gameState.fireworks} config={gameState.config} />
          </div>

          {/* Other players' hands */}
          {otherPlayers.length > 0 && (
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1 px-1">Other Players</p>
              <div className="flex flex-wrap gap-2">
                {otherPlayers.map(player => (
                  <PlayerHand
                    key={player.id}
                    player={player}
                    hand={gameState.hands[player.id] ?? []}
                    serverOrder={gameState.handOrder[player.id]}
                    isOwnHand={false}
                    isCurrentPlayer={
                      gameState.players[gameState.currentPlayerIndex]?.id === player.id
                    }
                    highlightedCardIds={flashingCardIds}
                    size="sm"
                  />
                ))}
              </div>
            </div>
          )}

          {/* My hand */}
          {myPlayer && (
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1 px-1">Your Hand</p>
              <PlayerHand
                player={myPlayer}
                hand={myHand}
                isOwnHand
                isCurrentPlayer={isMyTurn}
                selectedCardId={selectedCardId}
                onCardSelect={id => setSelectedCardId(prev => prev === id ? null : id)}
                interactionMode={isMyTurn ? 'select' : 'view'}
                highlightedCardIds={flashingCardIds}
                hideHints={gameState.config.hideOwnHints && !isMyTurn}
                onReorder={onReorderHand}
                size="md"
              />
            </div>
          )}

          {/* Action panel */}
          {isMyTurn && !isAbandoned && (
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1 px-1">Your Action</p>
              <ActionPanel
                canHint={canGiveClue(gameState)}
                canDiscard={canDiscard(gameState)}
                selectedCardId={selectedCardId}
                onGiveClue={() => setClueModalOpen(true)}
                onDiscard={handleDiscard}
                onPlay={handlePlay}
                disabled={actionPending}
              />
            </div>
          )}

          {!isMyTurn && gameState.status === 'playing' && (
            <p className="text-center text-sm text-slate-500 py-2">
              Waiting for {gameState.players[gameState.currentPlayerIndex]?.name}…
            </p>
          )}
        </div>
      </div>

      {/* Clue modal */}
      <ClueModal
        isOpen={clueModalOpen}
        onClose={() => setClueModalOpen(false)}
        onConfirm={handleGiveClue}
        players={gameState.players}
        hands={gameState.hands}
        currentPlayerId={myPlayerId ?? ''}
        config={gameState.config}
      />

      {/* Game over */}
      {gameState.status === 'ended' && gameState.score !== null && gameState.winner !== null && (
        <GameOverScreen
          score={gameState.score}
          winner={gameState.winner}
          fireworks={gameState.fireworks}
          config={gameState.config}
        />
      )}

      {/* Abandoned overlay */}
      {isAbandoned && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-8 max-w-sm w-full mx-4 text-center space-y-4">
            <div className="text-4xl">👋</div>
            <h2 className="text-xl font-bold text-white">{gameState.abandonedBy} left the game</h2>
            <p className="text-sm text-slate-400">The game cannot continue. Thanks for playing!</p>
            <button
              onClick={handleLeave}
              className="w-full mt-2 rounded-md bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white transition-colors"
            >
              Return to Home
            </button>
          </div>
        </div>
      )}

      {/* Card action animation overlay */}
      <CardActionOverlay lastAction={gameState.lastAction} />
    </div>
  )
}
