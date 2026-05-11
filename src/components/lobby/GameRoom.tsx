import { useState } from 'react'
import { Copy, Check, Users, Sparkles, Bot, X, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { GameState } from '@/lib/types'

interface Props {
  gameState: GameState
  myPlayerId: string | null
  onStart: () => Promise<void>
  onAddBot: () => Promise<void>
  onRemoveBot: (botId: string) => Promise<void>
  error: string | null
}

const VARIANT_LABELS: Record<number, string> = {
  0: 'Standard (5 colors)',
  1: 'Variant 1 – 6th suit (separate firework)',
  2: 'Variant 2 – 6th suit (1 of each value)',
  3: 'Variant 3 – 6th suit (wild)',
}

export default function GameRoom({ gameState, myPlayerId, onStart, onAddBot, onRemoveBot, error }: Props) {
  const [copied, setCopied] = useState(false)
  const [starting, setStarting] = useState(false)
  const [addingBot, setAddingBot] = useState(false)

  const isHost = myPlayerId === gameState.hostId
  const canStart = gameState.players.length >= 2

  async function handleStart() {
    setStarting(true)
    try { await onStart() } finally { setStarting(false) }
  }

  async function handleAddBot() {
    setAddingBot(true)
    try { await onAddBot() } finally { setAddingBot(false) }
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
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
          <p className="text-slate-400 text-sm mt-1">Share the invite link and wait for friends to join</p>
        </div>

        {/* Invite link */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
          <p className="text-xs text-slate-500 text-center mb-3 uppercase tracking-wider">Invite Friends</p>
          <button
            onClick={copyLink}
            className="w-full flex items-center justify-center gap-2 rounded-md bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white transition-colors"
          >
            {copied ? <Check className="h-4 w-4 text-green-300" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Link Copied!' : 'Copy Invite Link'}
          </button>
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
          {gameState.config.hideOwnHints && (
            <p className="text-sm text-slate-300">
              <span className="text-slate-500">+ </span>
              Hide Own Hints
            </p>
          )}
        </div>

        {/* Players */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-400" />
              <p className="text-sm font-medium text-slate-300">
                Players ({gameState.players.length}/5)
              </p>
            </div>
            {isHost && gameState.players.length < 5 && (
              <button
                onClick={handleAddBot}
                disabled={addingBot}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-400 transition-colors disabled:opacity-50"
                title="Add a bot player"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Bot
              </button>
            )}
          </div>
          <ul className="space-y-2">
            {gameState.players.map(player => {
              const isBot = gameState.botIds.includes(player.id)
              return (
                <li key={player.id} className="flex items-center gap-2">
                  {isBot
                    ? <Bot className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                    : <div className="h-2 w-2 rounded-full bg-green-400 shrink-0" />
                  }
                  <span className="text-sm text-slate-200 flex-1">{player.name}</span>
                  {player.id === gameState.hostId && (
                    <Badge variant="secondary" className="text-xs">Host</Badge>
                  )}
                  {player.id === myPlayerId && (
                    <Badge variant="default" className="text-xs">You</Badge>
                  )}
                  {isBot && isHost && (
                    <button
                      onClick={() => onRemoveBot(player.id)}
                      className="text-slate-600 hover:text-red-400 transition-colors"
                      title="Remove bot"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </li>
              )
            })}
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
