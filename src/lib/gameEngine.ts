import type {
  Card, CardInHand, Color, Value, ClueType,
  GameConfig, GameState, Action, EndCondition,
} from './types'
import { COLORS_BASE, COLORS_ALL, MAX_CLOCKS, MAX_FUSES, getHandSize } from './types'
import { getCardDistribution } from './utils'

// ---------------------------------------------------------------------------
// Deck creation
// ---------------------------------------------------------------------------

function cardId(color: Color, value: Value, idx: number): string {
  return `${color[0]}${color === 'multicolor' ? 'm' : ''}${value}${String.fromCharCode(97 + idx)}`
}

export function createDeck(config: GameConfig): Card[] {
  const distribution = getCardDistribution() as [Value, number][]
  const deck: Card[] = []

  const colors: Color[] = config.multicolorVariant === 0 ? COLORS_BASE : COLORS_ALL

  for (const color of colors) {
    const dist = color === 'multicolor' && config.multicolorVariant === 2
      ? [[1, 1], [2, 1], [3, 1], [4, 1], [5, 1]] as [Value, number][]
      : distribution
    for (const [value, count] of dist) {
      for (let i = 0; i < count; i++) {
        deck.push({ id: cardId(color, value, i), color, value })
      }
    }
  }

  return deck
}

export function shuffleDeck(deck: Card[]): Card[] {
  const arr = [...deck]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function wrapCard(card: Card): CardInHand {
  return { ...card, colorHints: [], valueHints: [], colorNotHints: [], valueNotHints: [] }
}

export function dealCards(
  deck: Card[],
  playerIds: string[],
  playerCount: number,
): { hands: Record<string, CardInHand[]>; remainingDeck: Card[] } {
  const handSize = getHandSize(playerCount)
  const hands: Record<string, CardInHand[]> = {}
  let remaining = [...deck]

  for (const pid of playerIds) {
    hands[pid] = remaining.splice(0, handSize).map(wrapCard)
  }

  return { hands, remainingDeck: remaining }
}

// ---------------------------------------------------------------------------
// Predicates
// ---------------------------------------------------------------------------

export function canGiveClue(state: GameState): boolean {
  return state.clocks > 0
}

export function canDiscard(state: GameState): boolean {
  return state.clocks < MAX_CLOCKS
}

export function getActiveColors(config: GameConfig): Color[] {
  return config.multicolorVariant === 0 ? COLORS_BASE : COLORS_ALL
}

// ---------------------------------------------------------------------------
// Clue matching (respects variant 3 wild rule)
// ---------------------------------------------------------------------------

function cardMatchesClue(
  card: Card,
  clueType: ClueType,
  clueValue: Color | Value,
  config: GameConfig,
): boolean {
  if (clueType === 'color') {
    const color = clueValue as Color
    if (config.multicolorVariant === 3 && card.color === 'multicolor') {
      // Multicolor cards match every color clue (they are wild)
      return true
    }
    return card.color === color
  } else {
    return card.value === (clueValue as Value)
  }
}

// ---------------------------------------------------------------------------
// Indispensable-tile check (variant 4)
// ---------------------------------------------------------------------------

export function isIndispensable(
  card: Card,
  fireworks: Record<Color, number>,
  _discardPile: Card[],
  deck: Card[],
  hands: Record<string, CardInHand[]>,
  config: GameConfig,
): boolean {
  const activeColors = getActiveColors(config)
  if (!activeColors.includes(card.color)) return false
  const alreadyPlayed = fireworks[card.color] ?? 0
  if (card.value <= alreadyPlayed) return false // already safely passed

  // Count remaining copies of this card (after removing the one being discarded)
  const allRemaining = [
    ...deck,
    ...Object.values(hands).flat(),
  ]
  const remainingCopies = allRemaining.filter(
    c => c.color === card.color && c.value === card.value,
  ).length

  // If no copies remain anywhere, the firework can never be completed
  return remainingCopies === 0
}

// ---------------------------------------------------------------------------
// Draw helper
// ---------------------------------------------------------------------------

function drawCard(
  deck: Card[],
): { card: CardInHand | null; remainingDeck: Card[] } {
  if (deck.length === 0) return { card: null, remainingDeck: [] }
  const [top, ...rest] = deck
  return { card: wrapCard(top), remainingDeck: rest }
}

// ---------------------------------------------------------------------------
// Last-round logic
// ---------------------------------------------------------------------------

function handleLastRoundDraw(state: GameState): GameState {
  if (state.deck.length === 0 && !state.lastRoundStarted) {
    return {
      ...state,
      lastRoundStarted: true,
      lastRoundStarterIndex: state.currentPlayerIndex,
      lastRoundTurnsLeft: state.players.length,
    }
  }
  return state
}

function advanceTurn(state: GameState): GameState {
  const nextIndex = (state.currentPlayerIndex + 1) % state.players.length
  let turnsLeft = state.lastRoundTurnsLeft
  if (state.lastRoundStarted && turnsLeft !== null) {
    turnsLeft = turnsLeft - 1
  }
  return { ...state, currentPlayerIndex: nextIndex, lastRoundTurnsLeft: turnsLeft }
}

// ---------------------------------------------------------------------------
// End condition
// ---------------------------------------------------------------------------

export function checkEndCondition(state: GameState): EndCondition {
  if (state.fuses >= MAX_FUSES) return 'lose'

  const activeColors = getActiveColors(state.config)
  if (activeColors.every(c => (state.fireworks[c] ?? 0) === 5)) return 'win'

  if (!state.config.perfectionist) {
    if (state.lastRoundStarted && state.lastRoundTurnsLeft !== null && state.lastRoundTurnsLeft <= 0) {
      return 'end'
    }
  }

  return 'continue'
}

export function calculateScore(fireworks: Record<Color, number>, config: GameConfig): number {
  return getActiveColors(config).reduce((sum, c) => sum + (fireworks[c] ?? 0), 0)
}

export function applyEndCondition(state: GameState, condition: EndCondition): GameState {
  if (condition === 'continue') return state
  const score = calculateScore(state.fireworks, state.config)
  return {
    ...state,
    status: 'ended',
    score,
    winner: condition === 'win',
  }
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export function giveClue(
  state: GameState,
  actorId: string,
  targetPlayerId: string,
  clueType: ClueType,
  clueValue: Color | Value,
): GameState {
  if (!canGiveClue(state)) throw new Error('No hint tokens available')
  if (actorId === targetPlayerId) throw new Error('Cannot clue yourself')
  if (clueType === 'color' && clueValue === 'multicolor' && state.config.multicolorVariant === 3) {
    throw new Error('Cannot clue multicolor in Variant 3')
  }

  const targetHand = state.hands[targetPlayerId]
  if (!targetHand) throw new Error('Target player not found')

  const matchingIds: string[] = []

  const updatedHand = targetHand.map(card => {
    const matches = cardMatchesClue(card, clueType, clueValue, state.config)
    if (matches) {
      matchingIds.push(card.id)
      return clueType === 'color'
        ? { ...card, colorHints: [...card.colorHints, clueValue as Color] }
        : { ...card, valueHints: [...card.valueHints, clueValue as Value] }
    } else {
      return clueType === 'color'
        ? { ...card, colorNotHints: [...card.colorNotHints, clueValue as Color] }
        : { ...card, valueNotHints: [...card.valueNotHints, clueValue as Value] }
    }
  })

  if (matchingIds.length === 0) throw new Error('Clue must match at least one card')

  const action: Action = {
    type: 'clue',
    actorId,
    targetPlayerId,
    clueType,
    clueValue,
    cardIds: matchingIds,
  }

  const newState: GameState = {
    ...state,
    clocks: state.clocks - 1,
    hands: { ...state.hands, [targetPlayerId]: updatedHand },
    lastAction: action,
  }

  return advanceTurn(newState)
}

export function discardCard(
  state: GameState,
  playerId: string,
  cardId: string,
): GameState {
  if (!canDiscard(state)) throw new Error('Cannot discard when all hint tokens are available')

  const hand = state.hands[playerId]
  if (!hand) throw new Error('Player not found')

  const cardIndex = hand.findIndex(c => c.id === cardId)
  if (cardIndex === -1) throw new Error('Card not found in hand')

  const card = hand[cardIndex]
  const newHand = hand.filter(c => c.id !== cardId)

  const { card: drawn, remainingDeck } = drawCard(state.deck)
  const finalHand = drawn ? [...newHand, drawn] : newHand

  const action: Action = { type: 'discard', actorId: playerId, cardId, card }

  let newState: GameState = {
    ...state,
    clocks: Math.min(state.clocks + 1, MAX_CLOCKS),
    hands: { ...state.hands, [playerId]: finalHand },
    discardPile: [...state.discardPile, card],
    deck: remainingDeck,
    lastAction: action,
  }

  // Check indispensable tile (variant 4)
  if (state.config.perfectionist) {
    if (isIndispensable(card, state.fireworks, state.discardPile, remainingDeck, { ...state.hands, [playerId]: finalHand }, state.config)) {
      newState = applyEndCondition(advanceTurn(newState), 'lose')
      return newState
    }
  }

  newState = handleLastRoundDraw(newState)
  newState = advanceTurn(newState)

  const condition = checkEndCondition(newState)
  return applyEndCondition(newState, condition)
}

export function playCard(
  state: GameState,
  playerId: string,
  cardId: string,
): GameState {
  const hand = state.hands[playerId]
  if (!hand) throw new Error('Player not found')

  const cardIndex = hand.findIndex(c => c.id === cardId)
  if (cardIndex === -1) throw new Error('Card not found in hand')

  const card = hand[cardIndex]
  const newHand = hand.filter(c => c.id !== cardId)

  const currentTop = state.fireworks[card.color] ?? 0
  const success = currentTop === card.value - 1

  const { card: drawn, remainingDeck } = drawCard(state.deck)
  const finalHand = drawn ? [...newHand, drawn] : newHand

  let newFireworks = { ...state.fireworks }
  let newFuses = state.fuses
  let newClocks = state.clocks
  let newDiscardPile = [...state.discardPile]

  if (success) {
    newFireworks[card.color] = card.value
    if (card.value === 5) {
      newClocks = Math.min(newClocks + 1, MAX_CLOCKS)
    }
  } else {
    newFuses++
    newDiscardPile.push(card)
  }

  const action: Action = { type: 'play', actorId: playerId, cardId, card, success }

  let newState: GameState = {
    ...state,
    fireworks: newFireworks,
    fuses: newFuses,
    clocks: newClocks,
    hands: { ...state.hands, [playerId]: finalHand },
    discardPile: newDiscardPile,
    deck: remainingDeck,
    lastAction: action,
  }

  newState = handleLastRoundDraw(newState)
  newState = advanceTurn(newState)

  const condition = checkEndCondition(newState)
  return applyEndCondition(newState, condition)
}

// ---------------------------------------------------------------------------
// Initial fireworks state
// ---------------------------------------------------------------------------

export function initialFireworks(config: GameConfig): Record<Color, number> {
  const result: Partial<Record<Color, number>> = {}
  for (const color of getActiveColors(config)) {
    result[color] = 0
  }
  return result as Record<Color, number>
}

// ---------------------------------------------------------------------------
// Bot strategy
// ---------------------------------------------------------------------------

export function chooseBotAction(state: GameState, botId: string): Action {
  const hand = state.hands[botId] ?? []
  const config = state.config

  // 1. Play any card that is the next needed for its firework
  for (const card of hand) {
    if ((state.fireworks[card.color] ?? 0) === card.value - 1) {
      return { type: 'play', actorId: botId, cardId: card.id, card, success: false }
    }
  }

  // 2. Discard if clocks aren't full
  if (canDiscard(state) && hand.length > 0) {
    const card = hand[hand.length - 1]
    return { type: 'discard', actorId: botId, cardId: card.id, card }
  }

  // 3. Give any valid clue
  if (canGiveClue(state)) {
    for (const player of state.players) {
      if (player.id === botId) continue
      const playerHand = state.hands[player.id] ?? []
      for (const card of playerHand) {
        // Variant 3 forbids multicolor as a clue type
        if (config.multicolorVariant === 3 && card.color === 'multicolor') continue
        return {
          type: 'clue', actorId: botId, targetPlayerId: player.id,
          clueType: 'color', clueValue: card.color, cardIds: [],
        }
      }
      // Fallback: value clue on first card
      if (playerHand.length > 0) {
        return {
          type: 'clue', actorId: botId, targetPlayerId: player.id,
          clueType: 'value', clueValue: playerHand[0].value, cardIds: [],
        }
      }
    }
  }

  // 4. Last resort: play first card
  if (hand.length > 0) {
    return { type: 'play', actorId: botId, cardId: hand[0].id, card: hand[0], success: false }
  }

  throw new Error('Bot has no valid action')
}
