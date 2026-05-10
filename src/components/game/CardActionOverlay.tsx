import { useEffect, useRef, useState } from 'react'
import type { Action } from '@/lib/types'
import { cn } from '@/lib/utils'
import CardComponent, { toCardInHand } from './CardComponent'

type AnimPhase = 'enter' | 'exit-played' | 'exit-discard'

interface AnimState {
  action: Extract<Action, { type: 'play' | 'discard' }>
  phase: AnimPhase
  animKey: number
}

interface Props {
  lastAction: Action | null
}

export default function CardActionOverlay({ lastAction }: Props) {
  const [anim, setAnim] = useState<AnimState | null>(null)
  const seenKeyRef = useRef<string | null>(null)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    if (!lastAction || (lastAction.type !== 'play' && lastAction.type !== 'discard')) return

    const key = `${lastAction.type}-${lastAction.actorId}-${lastAction.cardId}`
    if (key === seenKeyRef.current) return
    seenKeyRef.current = key

    timersRef.current.forEach(clearTimeout)

    const action = lastAction as Extract<Action, { type: 'play' | 'discard' }>
    const exitPhase: AnimPhase =
      action.type === 'play' && action.success ? 'exit-played' : 'exit-discard'

    setAnim(prev => ({ action, phase: 'enter', animKey: (prev?.animKey ?? 0) + 1 }))

    timersRef.current = [
      setTimeout(() => setAnim(a => a ? { ...a, phase: exitPhase } : null), 1100),
      setTimeout(() => setAnim(null), 1700),
    ]

    return () => timersRef.current.forEach(clearTimeout)
  }, [lastAction])

  if (!anim) return null

  const { action, phase, animKey } = anim
  const isPlay = action.type === 'play'
  const isSuccess = isPlay && (action as Extract<Action, { type: 'play' }>).success

  const cardClass =
    phase === 'enter' ? 'card-overlay-enter' :
    phase === 'exit-played' ? 'card-overlay-exit-played' :
    'card-overlay-exit-discard'

  const labelStyle = isSuccess
    ? 'bg-green-500/20 text-green-300 border border-green-500/40'
    : isPlay
    ? 'bg-red-500/20 text-red-300 border border-red-500/40'
    : 'bg-slate-700/60 text-slate-300 border border-slate-600'

  const labelText = isSuccess ? '✓ Played!' : isPlay ? '💥 Missed!' : '✕ Discarded'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div key={animKey} className={cn('flex flex-col items-center gap-3', cardClass)}>
        <CardComponent card={toCardInHand(action.card)} mode="front" size="lg" />
        <div className={cn('label-overlay-enter text-base font-bold px-4 py-1.5 rounded-full', labelStyle)}>
          {labelText}
        </div>
      </div>
    </div>
  )
}
