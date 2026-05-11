import { useState, useEffect, useCallback, useRef } from 'react'
import type { GameState, Color, Value, ClueType } from '@/lib/types'
import { canGiveClue, canDiscard, chooseBotAction } from '@/lib/gameEngine'
import {
  subscribeToGame, performAction, startGame as startGameFn,
  addBot as addBotFn, removeBot as removeBotFn, leaveGame as leaveGameFn,
} from '@/lib/database'
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
  addBot: () => Promise<void>
  removeBot: (botId: string) => Promise<void>
  leaveGame: () => Promise<void>
}

export function useGame(gameId: string): UseGameReturn {
  const { user } = useAuth()
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const botBusy = useRef(false)

  useEffect(() => {
    setLoading(true)
    const unsubscribe = subscribeToGame(gameId, state => {
      setGameState(state)
      setLoading(false)
    })
    return unsubscribe
  }, [gameId])

  const myPlayerId = user?.uid ?? null

  // Drive bot turns — only the host executes bots to avoid duplicate actions
  useEffect(() => {
    if (!gameState || gameState.status !== 'playing') return
    if (myPlayerId !== gameState.hostId) return

    const currentPlayer = gameState.players[gameState.currentPlayerIndex]
    if (!currentPlayer || !gameState.botIds.includes(currentPlayer.id)) return

    if (botBusy.current) return
    botBusy.current = true

    const timer = setTimeout(async () => {
      try {
        const action = chooseBotAction(gameState, currentPlayer.id)
        await performAction(gameId, action)
      } catch {
        // ignore — next state update will retry if still bot's turn
      } finally {
        botBusy.current = false
      }
    }, 1200)

    return () => {
      clearTimeout(timer)
      botBusy.current = false
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.currentPlayerIndex, gameState?.status, gameId, myPlayerId])

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

  const addBot = useCallback(
    () => wrap(() => addBotFn(gameId, myPlayerId!)),
    [gameId, myPlayerId, wrap],
  )

  const removeBot = useCallback(
    (botId: string) => wrap(() => removeBotFn(gameId, myPlayerId!, botId)),
    [gameId, myPlayerId, wrap],
  )

  const leaveGame = useCallback(
    () => wrap(() => leaveGameFn(gameId, myPlayerId!)),
    [gameId, myPlayerId, wrap],
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
    addBot,
    removeBot,
    leaveGame,
  }
}
