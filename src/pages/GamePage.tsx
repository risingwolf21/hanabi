import { useParams, Navigate } from 'react-router-dom'
import { useGame } from '@/hooks/useGame'
import { useAuth } from '@/hooks/useAuth'
import GameRoom from '@/components/lobby/GameRoom'
import GameBoard from '@/components/game/GameBoard'

export default function GamePage() {
  const { gameId } = useParams<{ gameId: string }>()
  const { user } = useAuth()
  const {
    gameState, loading, error, clearError,
    myPlayerId, giveClue, discardCard, playCard, startGame,
  } = useGame(gameId!)

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400 text-sm animate-pulse">Loading game…</div>
      </div>
    )
  }

  if (!gameState) {
    return <Navigate to="/" replace />
  }

  if (gameState.status === 'lobby') {
    return (
      <GameRoom
        gameState={gameState}
        myPlayerId={myPlayerId}
        onStart={startGame}
        error={error}
      />
    )
  }

  return (
    <GameBoard
      gameState={gameState}
      myPlayerId={myPlayerId ?? user?.uid ?? null}
      onGiveClue={giveClue}
      onDiscard={discardCard}
      onPlay={playCard}
      error={error}
      clearError={clearError}
    />
  )
}
