import { useState } from 'react'
import { useParams, Navigate, useNavigate } from 'react-router-dom'
import { Sparkles, Info } from 'lucide-react'
import { useGame } from '@/hooks/useGame'
import { useAuth } from '@/hooks/useAuth'
import { joinGame } from '@/lib/database'
import { Button } from '@/components/ui/button'
import GameRoom from '@/components/lobby/GameRoom'
import GameBoard from '@/components/game/GameBoard'

export default function GamePage() {
  const { gameId } = useParams<{ gameId: string }>()
  const navigate = useNavigate()
  const { user, displayName, setDisplayName, signIn, authError } = useAuth()
  const {
    gameState, loading, error, clearError,
    myPlayerId, giveClue, discardCard, playCard, startGame, addBot, removeBot, leaveGame,
  } = useGame(gameId!)

  const [nameInput, setNameInput] = useState(displayName)
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState('')

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

  const isPlayer = myPlayerId !== null && gameState.players.some(p => p.id === myPlayerId)

  if (gameState.status === 'lobby' && !isPlayer) {
    async function handleJoin() {
      const name = nameInput.trim()
      if (!name) { setJoinError('Please enter your name.'); return }
      setJoining(true)
      setJoinError('')
      try {
        const currentUser = user ?? await signIn()
        setDisplayName(name)
        await joinGame(gameId!, currentUser.uid, name)
      } catch (e) {
        setJoinError(e instanceof Error ? e.message : 'Failed to join game.')
      } finally {
        setJoining(false)
      }
    }

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-3">
              <Sparkles className="h-10 w-10 text-yellow-400" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-1 tracking-tight">Hanabi</h1>
            <p className="text-slate-400 text-sm">You've been invited to a game</p>
          </div>

          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Your name</label>
              <input
                type="text"
                maxLength={20}
                placeholder="Enter your name"
                value={nameInput}
                onChange={e => { setNameInput(e.target.value); setJoinError('') }}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                autoFocus
                className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {(joinError || authError) && (
              <div className="flex items-center gap-2 rounded-md bg-red-950 border border-red-800 px-3 py-2 text-sm text-red-300">
                <Info className="h-4 w-4 shrink-0" />
                <span>{joinError || authError}</span>
              </div>
            )}

            <Button onClick={handleJoin} disabled={joining} className="w-full" size="lg">
              {joining ? 'Joining…' : 'Join Game'}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  async function handleLeave() {
    await leaveGame()
    navigate('/')
  }

  if (gameState.status === 'lobby') {
    return (
      <GameRoom
        gameState={gameState}
        myPlayerId={myPlayerId}
        onStart={startGame}
        onAddBot={addBot}
        onRemoveBot={removeBot}
        onLeave={handleLeave}
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
      onLeave={handleLeave}
      error={error}
      clearError={clearError}
    />
  )
}
