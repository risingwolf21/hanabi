import { useState } from 'react'
import { Copy, Check, Users, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { GameState } from '@/lib/types'

interface Props {
  gameState: GameState
  myPlayerId: string | null
  onStart: () => Promise<void>
  error: string | null
}

const VARIANT_LABELS: Record<number, string> = {
  0: 'Standard (5 colors)',
  1: 'Variant 1 – 6th suit (separate firework)',
  2: 'Variant 2 – 6th suit (1 of each value)',
  3: 'Variant 3 – 6th suit (wild)',
}

export default function GameRoom({ gameState, myPlayerId, onStart, error }: Props) {
  const [copied, setCopied] = useState(false)
  const [starting, setStarting] = useState(false)

  const isHost = myPlayerId === gameState.hostId
  const canStart = gameState.players.length >= 2

  async function handleStart() {
    setStarting(true)
    try { await onStart() } finally { setStarting(false) }
  }

  function copyCode() {
    navigator.clipboard.writeText(gameState.id).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
      <div className="w-full max-w-md space-y-4">
        {/* Header */}
        <div className="text-center">
          <Sparkles className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
          <h1 className="text-2xl font-bold text-white">Waiting Room</h1>
          <p className="text-slate-400 text-sm mt-1">Share the code and wait for friends to join</p>
        </div>

        {/* Room code */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
          <p className="text-xs text-slate-500 text-center mb-2 uppercase tracking-wider">Room Code</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-4xl font-mono font-bold tracking-[0.3em] text-white">
              {gameState.id}
            </span>
            <button
              onClick={copyCode}
              className="p-2 rounded-md hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Copy code"
            >
              {copied ? <Check className="h-5 w-5 text-green-400" /> : <Copy className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Game config */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-1.5">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Game Settings</p>
          <p className="text-sm text-slate-300">
            <span className="text-slate-500">Mode: </span>
            {VARIANT_LABELS[gameState.config.multicolorVariant]}
          </p>
          {gameState.config.perfectionist && (
            <p className="text-sm text-slate-300">
              <span className="text-slate-500">+ </span>
              Perfectionist Mode (Variant 4)
            </p>
          )}
        </div>

        {/* Players */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-slate-400" />
            <p className="text-sm font-medium text-slate-300">
              Players ({gameState.players.length}/5)
            </p>
          </div>
          <ul className="space-y-2">
            {gameState.players.map(player => (
              <li key={player.id} className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-400" />
                <span className="text-sm text-slate-200 flex-1">{player.name}</span>
                {player.id === gameState.hostId && (
                  <Badge variant="secondary" className="text-xs">Host</Badge>
                )}
                {player.id === myPlayerId && (
                  <Badge variant="default" className="text-xs">You</Badge>
                )}
              </li>
            ))}
            {gameState.players.length < 2 && (
              <li className="text-xs text-slate-600 italic">Need at least 2 players to start…</li>
            )}
          </ul>
        </div>

        {error && (
          <div className="rounded-md bg-red-950 border border-red-800 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        {isHost ? (
          <Button
            size="lg"
            className="w-full"
            disabled={!canStart || starting}
            onClick={handleStart}
          >
            {starting ? 'Starting…' : canStart ? 'Start Game' : 'Waiting for more players…'}
          </Button>
        ) : (
          <p className="text-center text-sm text-slate-500">Waiting for the host to start the game…</p>
        )}
      </div>
    </div>
  )
}
