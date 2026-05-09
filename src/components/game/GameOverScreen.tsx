import { useNavigate } from 'react-router-dom'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { getScoreRating, COLOR_DISPLAY } from '@/lib/utils'
import { getActiveColors } from '@/lib/gameEngine'
import type { Color, GameConfig } from '@/lib/types'
import { cn } from '@/lib/utils'

interface Props {
  score: number
  winner: boolean
  fireworks: Record<Color, number>
  config: GameConfig
}

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

export default function GameOverScreen({ score, winner, fireworks, config }: Props) {
  const navigate = useNavigate()
  const colors = getActiveColors(config)
  const maxScore = colors.length * 5
  const isPerfect = score === maxScore

  return (
    <>
      {isPerfect && <Confetti />}
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
                  return (
                    <div key={color} className="flex flex-col items-center">
                      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold', c.bg, c.text)}>
                        {v}
                      </div>
                      <span className="text-[9px] text-slate-500 mt-0.5">{c.label}</span>
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
