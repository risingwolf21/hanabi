import { useNavigate } from 'react-router-dom'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { getScoreRating, COLOR_DISPLAY, RAINBOW_GRADIENT } from '@/lib/utils'
import { getActiveColors } from '@/lib/gameEngine'
import type { Color, GameConfig } from '@/lib/types'
import { cn } from '@/lib/utils'

interface Props {
  score: number
  winner: boolean
  fireworks: Record<Color, number>
  config: GameConfig
}

const WIN_COLORS = ['#ef4444', '#eab308', '#22c55e', '#3b82f6', '#f1f5f9', '#a855f7']
const LOSS_COLORS = ['#ef4444', '#dc2626', '#6b7280', '#4b5563']

const CONFETTI_COLORS = ['bg-yellow-400', 'bg-red-400', 'bg-blue-400', 'bg-green-400', 'bg-purple-400']

function Confetti() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-[60]">
      {Array.from({ length: 40 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'confetti-piece absolute w-2 h-2 rounded-sm',
            CONFETTI_COLORS[i % CONFETTI_COLORS.length],
          )}
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
          }}
        />
      ))}
    </div>
  )
}

function FireworkBurst({
  x, y, colors, delay, loop,
}: {
  x: number; y: number; colors: string[]; delay: number; loop: boolean
}) {
  return (
    <div
      className="pointer-events-none fixed z-[60]"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="firework-spark absolute w-2 h-2 rounded-full"
          style={{
            '--angle': `${i * 30}deg`,
            background: colors[i % colors.length],
            animationDelay: `${delay}s`,
            animationIterationCount: loop ? 'infinite' : 1,
            animationDuration: loop ? '1.2s' : '0.9s',
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}

// Fixed positions so they don't shift on re-render
const WIN_BURSTS = [
  { x: 20, y: 25, delay: 0 },
  { x: 75, y: 20, delay: 0.4 },
  { x: 50, y: 60, delay: 0.8 },
  { x: 15, y: 70, delay: 1.2 },
  { x: 82, y: 65, delay: 0.2 },
]
const LOSS_BURSTS = [
  { x: 25, y: 30, delay: 0 },
  { x: 70, y: 55, delay: 0.5 },
]

export default function GameOverScreen({ score, winner, fireworks, config }: Props) {
  const navigate = useNavigate()
  const colors = getActiveColors(config)
  const maxScore = colors.length * 5
  const isPerfect = score === maxScore

  const bursts = winner ? WIN_BURSTS : LOSS_BURSTS
  const burstColors = winner ? WIN_COLORS : LOSS_COLORS

  return (
    <>
      {isPerfect && <Confetti />}
      {bursts.map((b, i) => (
        <FireworkBurst
          key={i}
          x={b.x}
          y={b.y}
          colors={burstColors}
          delay={b.delay}
          loop={winner}
        />
      ))}
      <Dialog open>
        <DialogContent className="max-w-lg" onPointerDownOutside={e => e.preventDefault()}>
          <div className="text-center space-y-4">
            {/* Title */}
            <div>
              {winner ? (
                <>
                  <div className="text-4xl mb-1">🎆</div>
                  <h2 className="text-2xl font-bold text-yellow-300">Perfect!</h2>
                  <p className="text-slate-400 text-sm mt-1">A legendary performance!</p>
                </>
              ) : (
                <>
                  <div className="text-4xl mb-1">💥</div>
                  <h2 className="text-2xl font-bold text-red-300">
                    {config.perfectionist && score < maxScore ? 'Show Cancelled' : 'Fireworks Fizzled'}
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">Better luck next time</p>
                </>
              )}
            </div>

            {/* Score */}
            {!config.perfectionist && (
              <div className="bg-slate-800 rounded-lg px-6 py-4">
                <p className="text-sm text-slate-400 mb-1">Final Score</p>
                <p className="text-5xl font-bold text-white">
                  {score}
                  <span className="text-2xl text-slate-500">/{maxScore}</span>
                </p>
                <p className="text-sm text-slate-400 mt-2 italic">{getScoreRating(score)}</p>
              </div>
            )}

            {/* Firework results */}
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Fireworks Achieved</p>
              <div className="flex justify-center gap-2 flex-wrap">
                {colors.map(color => {
                  const v = fireworks[color] ?? 0
                  const c = COLOR_DISPLAY[color]
                  const isMulti = color === 'multicolor'
                  return (
                    <div
                      key={color}
                      className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold', !isMulti && c.bg, isMulti ? 'text-white' : c.text)}
                      style={isMulti ? { background: RAINBOW_GRADIENT } : undefined}
                    >
                      {v}
                    </div>
                  )
                })}
              </div>
            </div>

            <Button size="lg" className="w-full" onClick={() => navigate('/')}>
              Return to Lobby
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
