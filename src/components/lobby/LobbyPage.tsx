import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { createGame, joinGame } from '@/lib/firestore'
import type { GameConfig } from '@/lib/types'

type Mode = 'home' | 'create' | 'join'

const MULTICOLOR_OPTIONS: { value: 0 | 1 | 2 | 3; label: string; description: string }[] = [
  { value: 0, label: 'None', description: '5-color game, 50 cards. Standard rules.' },
  {
    value: 1,
    label: 'Variant 1',
    description: '6th multicolor suit as a separate firework. Normal distribution (60 cards). Clue multicolor normally.',
  },
  {
    value: 2,
    label: 'Variant 2',
    description: 'Same as Variant 1 but multicolor has only one of each value (55 cards total).',
  },
  {
    value: 3,
    label: 'Variant 3',
    description: 'Multicolor tiles are wild — respond to any color clue, but you cannot give a "multicolor" clue. Build the 6th firework when played (60 cards).',
  },
]

export default function LobbyPage() {
  const navigate = useNavigate()
  const { user, displayName, setDisplayName } = useAuth()

  const [mode, setMode] = useState<Mode>('home')
  const [nameInput, setNameInput] = useState(displayName)
  const [joinCode, setJoinCode] = useState('')
  const [config, setConfig] = useState<GameConfig>({ multicolorVariant: 0, perfectionist: false })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate() {
    const name = nameInput.trim()
    if (!name) { setError('Please enter your name.'); return }
    if (!user) { setError('Still signing in… try again.'); return }
    setLoading(true)
    setError('')
    try {
      setDisplayName(name)
      const gameId = await createGame(user.uid, name, config)
      navigate(`/game/${gameId}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create game.')
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin() {
    const name = nameInput.trim()
    const code = joinCode.trim().toUpperCase()
    if (!name) { setError('Please enter your name.'); return }
    if (code.length !== 6) { setError('Game code must be 6 characters.'); return }
    if (!user) { setError('Still signing in… try again.'); return }
    setLoading(true)
    setError('')
    try {
      setDisplayName(name)
      await joinGame(code, user.uid, name)
      navigate(`/game/${code}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to join game.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <Sparkles className="h-10 w-10 text-yellow-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-1 tracking-tight">Hanabi</h1>
          <p className="text-slate-400 text-sm">The cooperative fireworks card game</p>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 space-y-4">
          {/* Name input */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Your name</label>
            <input
              type="text"
              maxLength={20}
              placeholder="Enter your name"
              value={nameInput}
              onChange={e => { setNameInput(e.target.value); setError('') }}
              onKeyDown={e => { if (e.key === 'Enter') { if (mode === 'create') handleCreate(); else if (mode === 'join') handleJoin() } }}
              className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {mode === 'home' && (
            <div className="flex flex-col gap-3 pt-2">
              <Button size="lg" onClick={() => setMode('create')} className="w-full">
                Create Game
              </Button>
              <Button size="lg" variant="outline" onClick={() => setMode('join')} className="w-full">
                Join Game
              </Button>
            </div>
          )}

          {mode === 'create' && (
            <div className="space-y-4">
              {/* Multicolor variant */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <label className="text-sm font-medium text-slate-300">Multicolor Suit</label>
                </div>
                <div className="space-y-2">
                  {MULTICOLOR_OPTIONS.map(opt => (
                    <label key={opt.value} className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="multicolor"
                        checked={config.multicolorVariant === opt.value}
                        onChange={() => setConfig(c => ({ ...c, multicolorVariant: opt.value }))}
                        className="mt-0.5 accent-indigo-500"
                      />
                      <span className="flex-1">
                        <span className="block text-sm font-medium text-slate-200">{opt.label}</span>
                        <span className="text-xs text-slate-500">{opt.description}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Perfectionist mode */}
              <div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.perfectionist}
                    onChange={e => setConfig(c => ({ ...c, perfectionist: e.target.checked }))}
                    className="mt-0.5 accent-indigo-500"
                  />
                  <span>
                    <span className="block text-sm font-medium text-slate-200">
                      Perfectionist Mode <span className="text-slate-500 font-normal">(Variant 4)</span>
                    </span>
                    <span className="text-xs text-slate-500">
                      Game never ends after the last tile round. Continue until loss (3 fuses or indispensable tile discarded) or perfect win. No score scale — must be flawless.
                    </span>
                  </span>
                </label>
              </div>

              <div className="flex gap-2 pt-1">
                <Button variant="ghost" onClick={() => { setMode('home'); setError('') }} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleCreate} disabled={loading} className="flex-1">
                  {loading ? 'Creating…' : 'Create Room'}
                </Button>
              </div>
            </div>
          )}

          {mode === 'join' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Room code</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="e.g. AB3X7K"
                  value={joinCode}
                  onChange={e => { setJoinCode(e.target.value.toUpperCase()); setError('') }}
                  onKeyDown={e => e.key === 'Enter' && handleJoin()}
                  className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono tracking-widest uppercase"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => { setMode('home'); setError('') }} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleJoin} disabled={loading} className="flex-1">
                  {loading ? 'Joining…' : 'Join Room'}
                </Button>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-md bg-red-950 border border-red-800 px-3 py-2 text-sm text-red-300">
              <Info className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Rules hint */}
        <p className="text-center text-xs text-slate-600 mt-6">
          2–5 players · Cooperative · No accounts needed
        </p>
      </div>
    </div>
  )
}
