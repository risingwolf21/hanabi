import { ref, set, get, runTransaction, onValue } from 'firebase/database'
import { db } from './firebase'
import type {
  GameState, GameConfig, Action, ClueType,
  Color, Value, Player, Card, CardInHand,
} from './types'
import {
  createDeck, shuffleDeck, dealCards,
  giveClue, discardCard, playCard,
  initialFireworks, checkEndCondition, applyEndCondition,
} from './gameEngine'
import { generateGameId } from './utils'

// ---------------------------------------------------------------------------
// Path helper
// ---------------------------------------------------------------------------

function gameRef(gameId: string) {
  return ref(db, `games/${gameId}`)
}

// ---------------------------------------------------------------------------
// RTDB normaliser
//
// RTDB strips null values on write and may return dense arrays as plain objects
// with numeric-string keys. This function restores the canonical GameState shape
// so the rest of the app never has to think about RTDB quirks.
// ---------------------------------------------------------------------------

function toArr<T>(val: unknown): T[] {
  if (!val) return []
  if (Array.isArray(val)) return val as T[]
  // RTDB returned an object with numeric keys — convert back to array
  return Object.values(val) as T[]
}

function normaliseCard(c: Record<string, unknown>): CardInHand {
  return {
    id: c.id as string,
    color: c.color as Color,
    value: c.value as Value,
    colorHints: toArr<Color>(c.colorHints),
    valueHints: toArr<Value>(c.valueHints),
    colorNotHints: toArr<Color>(c.colorNotHints),
    valueNotHints: toArr<Value>(c.valueNotHints),
  }
}

function normaliseAction(a: unknown): Action | null {
  if (!a || typeof a !== 'object') return null
  const action = a as Record<string, unknown>
  if (action.type === 'clue') {
    return { ...action, cardIds: toArr<string>(action.cardIds) } as Action
  }
  return action as Action
}

function normalise(raw: unknown): GameState {
  const d = raw as Record<string, unknown>

  const hands: Record<string, CardInHand[]> = {}
  if (d.hands && typeof d.hands === 'object') {
    for (const [pid, hand] of Object.entries(d.hands as Record<string, unknown>)) {
      hands[pid] = toArr<Record<string, unknown>>(hand).map(normaliseCard)
    }
  }

  const simpleCard = (c: Record<string, unknown>): Card =>
    ({ id: c.id, color: c.color, value: c.value }) as Card

  return {
    ...(d as object),
    players: toArr<Player>(d.players),
    botIds: toArr<string>(d.botIds),
    deck: toArr<Record<string, unknown>>(d.deck).map(simpleCard),
    discardPile: toArr<Record<string, unknown>>(d.discardPile).map(simpleCard),
    hands,
    // RTDB strips null fields; restore them with ?? null
    lastRoundStarterIndex: (d.lastRoundStarterIndex as number) ?? null,
    lastRoundTurnsLeft: (d.lastRoundTurnsLeft as number) ?? null,
    score: (d.score as number) ?? null,
    winner: (d.winner as boolean) ?? null,
    lastAction: normaliseAction(d.lastAction),
  } as GameState
}

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

export async function createGame(
  hostId: string,
  hostName: string,
  config: GameConfig,
): Promise<string> {
  let gameId = generateGameId()

  for (let i = 0; i < 5; i++) {
    const snap = await get(gameRef(gameId))
    if (!snap.exists()) break
    gameId = generateGameId()
  }

  const initial: GameState = {
    id: gameId,
    status: 'lobby',
    createdAt: Date.now(),
    hostId,
    config,
    players: [{ id: hostId, name: hostName, joinedAt: Date.now() }],
    botIds: [],
    currentPlayerIndex: 0,
    deck: [],
    hands: {},
    fireworks: initialFireworks(config),
    discardPile: [],
    clocks: 8,
    fuses: 0,
    lastRoundStarted: false,
    lastRoundStarterIndex: null,
    lastRoundTurnsLeft: null,
    score: null,
    winner: null,
    lastAction: null,
  }

  // Writing an object containing null values is fine — RTDB silently drops those
  // fields, and the normaliser restores them as null on every read.
  await set(gameRef(gameId), initial)
  return gameId
}

export async function joinGame(
  gameId: string,
  playerId: string,
  playerName: string,
): Promise<void> {
  let errorMsg: string | null = null

  await runTransaction(gameRef(gameId), (current: unknown) => {
    if (!current) { errorMsg = 'Game not found. Check the code and try again.'; return }
    const state = normalise(current)

    if (state.status !== 'lobby') { errorMsg = 'Game has already started.'; return }
    if (state.players.length >= 5) { errorMsg = 'Game is full (max 5 players).'; return }
    if (state.players.some(p => p.id === playerId)) return state // already joined

    return { ...state, players: [...state.players, { id: playerId, name: playerName, joinedAt: Date.now() }] }
  }, { applyLocally: false })

  if (errorMsg) throw new Error(errorMsg)
}

export async function addBot(gameId: string, hostId: string): Promise<void> {
  let errorMsg: string | null = null

  await runTransaction(gameRef(gameId), (current: unknown) => {
    if (!current) { errorMsg = 'Game not found.'; return }
    const state = normalise(current)

    if (state.hostId !== hostId) { errorMsg = 'Only the host can add bots.'; return }
    if (state.status !== 'lobby') { errorMsg = 'Game has already started.'; return }
    if (state.players.length >= 5) { errorMsg = 'Game is full (max 5 players).'; return }

    const botCount = state.botIds.length
    const botId = `bot_${generateGameId()}`
    const botName = `Bot ${botCount + 1}`
    return {
      ...state,
      players: [...state.players, { id: botId, name: botName, joinedAt: Date.now() }],
      botIds: [...state.botIds, botId],
    }
  }, { applyLocally: false })

  if (errorMsg) throw new Error(errorMsg)
}

export async function removeBot(gameId: string, hostId: string, botId: string): Promise<void> {
  let errorMsg: string | null = null

  await runTransaction(gameRef(gameId), (current: unknown) => {
    if (!current) { errorMsg = 'Game not found.'; return }
    const state = normalise(current)

    if (state.hostId !== hostId) { errorMsg = 'Only the host can remove bots.'; return }
    if (state.status !== 'lobby') { errorMsg = 'Game has already started.'; return }

    return {
      ...state,
      players: state.players.filter(p => p.id !== botId),
      botIds: state.botIds.filter(id => id !== botId),
    }
  }, { applyLocally: false })

  if (errorMsg) throw new Error(errorMsg)
}

export async function startGame(gameId: string): Promise<void> {
  let errorMsg: string | null = null

  await runTransaction(gameRef(gameId), (current: unknown) => {
    if (!current) { errorMsg = 'Game not found.'; return }
    const state = normalise(current)

    if (state.status !== 'lobby') { errorMsg = 'Game already started.'; return }
    if (state.players.length < 2) { errorMsg = 'Need at least 2 players.'; return }

    const deck = shuffleDeck(createDeck(state.config))
    const playerIds = state.players.map(p => p.id)
    const { hands, remainingDeck } = dealCards(deck, playerIds, playerIds.length)

    return { ...state, status: 'playing', deck: remainingDeck, hands }
  }, { applyLocally: false })

  if (errorMsg) throw new Error(errorMsg)
}

export async function performAction(
  gameId: string,
  action: Action,
): Promise<void> {
  let errorMsg: string | null = null

  await runTransaction(gameRef(gameId), (current: unknown) => {
    if (!current) { errorMsg = 'Game not found.'; return }
    let state = normalise(current)

    if (state.status !== 'playing') { errorMsg = 'Game is not in progress.'; return }

    const currentPlayer = state.players[state.currentPlayerIndex]
    if (currentPlayer.id !== action.actorId) { errorMsg = "It's not your turn."; return }

    try {
      if (action.type === 'clue') {
        state = giveClue(state, action.actorId, action.targetPlayerId, action.clueType as ClueType, action.clueValue as Color | Value)
      } else if (action.type === 'discard') {
        state = discardCard(state, action.actorId, action.cardId)
      } else if (action.type === 'play') {
        state = playCard(state, action.actorId, action.cardId)
      }
    } catch (e) {
      errorMsg = e instanceof Error ? e.message : 'Invalid action.'
      return
    }

    if (state.status !== 'ended') {
      const condition = checkEndCondition(state)
      state = applyEndCondition(state, condition)
    }

    return state
  }, { applyLocally: false })

  if (errorMsg) throw new Error(errorMsg)
}

export function subscribeToGame(
  gameId: string,
  callback: (state: GameState | null) => void,
): () => void {
  return onValue(gameRef(gameId), snapshot => {
    callback(snapshot.exists() ? normalise(snapshot.val()) : null)
  })
}
