export type Color = 'red' | 'yellow' | 'green' | 'blue' | 'white' | 'multicolor'
export type Value = 1 | 2 | 3 | 4 | 5
export type ClueType = 'color' | 'value'

export const COLORS_BASE: Color[] = ['red', 'yellow', 'green', 'blue', 'white']
export const COLORS_ALL: Color[] = [...COLORS_BASE, 'multicolor']
export const MAX_CLOCKS = 8
export const MAX_FUSES = 3

export function getHandSize(playerCount: number): number {
  return playerCount <= 3 ? 5 : 4
}

export interface GameConfig {
  multicolorVariant: 0 | 1 | 2 | 3
  perfectionist: boolean
  hideOwnHints: boolean
}

export interface Card {
  id: string
  color: Color
  value: Value
}

export interface CardInHand extends Card {
  colorHints: Color[]
  valueHints: Value[]
  colorNotHints: Color[]
  valueNotHints: Value[]
}

export interface Player {
  id: string
  name: string
  joinedAt: number
}

export type Action =
  | { type: 'clue'; actorId: string; targetPlayerId: string; clueType: ClueType; clueValue: Color | Value; cardIds: string[] }
  | { type: 'discard'; actorId: string; cardId: string; card: Card }
  | { type: 'play'; actorId: string; cardId: string; card: Card; success: boolean }

export interface GameState {
  id: string
  status: 'lobby' | 'playing' | 'ended'
  createdAt: number
  hostId: string
  config: GameConfig
  players: Player[]
  botIds: string[]
  currentPlayerIndex: number
  deck: Card[]
  hands: Record<string, CardInHand[]>
  fireworks: Record<Color, number>
  discardPile: Card[]
  clocks: number
  fuses: number
  lastRoundStarted: boolean
  lastRoundStarterIndex: number | null
  lastRoundTurnsLeft: number | null
  score: number | null
  winner: boolean | null
  lastAction: Action | null
}

export type EndCondition = 'continue' | 'win' | 'lose' | 'end'
