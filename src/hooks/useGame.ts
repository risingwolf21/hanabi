import { useState, useEffect, useCallback } from 'react'
import type { GameState, Color, Value, ClueType } from '@/lib/types'
import { canGiveClue, canDiscard } from '@/lib/gameEngine'
import { subscribeToGame, performAction, startGame as startGameFn } from '@/lib/database'
import { useAuth } from './useAuth'

interface UseGameReturn {
  gameState: GameState | null
  loading: boolean
  error: string | null
  clearError: () => void
  isMyTurn: boolean
  myPlayerId: string | null
  canHint: boolean
  canThrow: boolean
  giveClue: (targetId: string, clueType: ClueType, clueValue: Color | Value) => Promise<void>
  discardCard: (cardId: string) => Promise<void>
  playCard: (cardId: string) => Promise<void>
  startGame: () => Promise<void>
}

export function useGame(gameId: string): UseGameReturn {
  const { user } = useAuth()
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    const unsubscribe = subscribeToGame(gameId, state => {
      setGameState(state)
      setLoading(false)
    })
    return unsubscribe
  }, [gameId])

  const myPlayerId = user?.uid ?? null

  const isMyTurn = !!gameState &&
    gameState.status === 'playing' &&
    gameState.players[gameState.currentPlayerIndex]?.id === myPlayerId

  const canHint = !!gameState && canGiveClue(gameState)
  const canThrow = !!gameState && canDiscard(gameState)

  const wrap = useCallback(async (fn: () => Promise<void>) => {
    try {
      setError(null)
      await fn()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    }
  }, [])

  const giveClue = useCallback(
    (targetId: string, clueType: ClueType, clueValue: Color | Value) =>
      wrap(() =>
        performAction(gameId, {
          type: 'clue',
          actorId: myPlayerId!,
          targetPlayerId: targetId,
          clueType,
          clueValue,
          cardIds: [],
        }),
      ),
    [gameId, myPlayerId, wrap],
  )

  const discardCard = useCallback(
    (cardId: string) =>
      wrap(() =>
        performAction(gameId, {
          type: 'discard',
          actorId: myPlayerId!,
          cardId,
          card: { id: cardId, color: 'red', value: 1 }, // placeholder; engine uses real state
        }),
      ),
    [gameId, myPlayerId, wrap],
  )

  const playCard = useCallback(
    (cardId: string) =>
      wrap(() =>
        performAction(gameId, {
          type: 'play',
          actorId: myPlayerId!,
          cardId,
          card: { id: cardId, color: 'red', value: 1 }, // placeholder
          success: false,
        }),
      ),
    [gameId, myPlayerId, wrap],
  )

  const startGame = useCallback(
    () => wrap(() => startGameFn(gameId)),
    [gameId, wrap],
  )

  return {
    gameState,
    loading,
    error,
    clearError: () => setError(null),
    isMyTurn,
    myPlayerId,
    canHint,
    canThrow,
    giveClue,
    discardCard,
    playCard,
    startGame,
  }
}
