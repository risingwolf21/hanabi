import {
  doc, getDoc, setDoc, onSnapshot, runTransaction,
} from 'firebase/firestore'
import { db } from './firebase'
import type { GameState, GameConfig, Action, ClueType, Color, Value } from './types'
import {
  createDeck, shuffleDeck, dealCards, giveClue, discardCard,
  playCard, initialFireworks, checkEndCondition, applyEndCondition,
} from './gameEngine'
import { generateGameId } from './utils'

function gameRef(gameId: string) {
  return doc(db, 'games', gameId)
}

export async function createGame(
  hostId: string,
  hostName: string,
  config: GameConfig,
): Promise<string> {
  let gameId = generateGameId()

  // Retry on collision (very unlikely)
  for (let i = 0; i < 5; i++) {
    const snap = await getDoc(gameRef(gameId))
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

  await setDoc(gameRef(gameId), initial)
  return gameId
}

export async function joinGame(
  gameId: string,
  playerId: string,
  playerName: string,
): Promise<void> {
  await runTransaction(db, async tx => {
    const snap = await tx.get(gameRef(gameId))
    if (!snap.exists()) throw new Error('Game not found. Check the code and try again.')

    const state = snap.data() as GameState
    if (state.status !== 'lobby') throw new Error('Game has already started.')
    if (state.players.length >= 5) throw new Error('Game is full (max 5 players).')
    if (state.players.some(p => p.id === playerId)) return // already joined

    const updated: GameState = {
      ...state,
      players: [...state.players, { id: playerId, name: playerName, joinedAt: Date.now() }],
    }
    tx.set(gameRef(gameId), updated)
  })
}

export async function startGame(gameId: string): Promise<void> {
  await runTransaction(db, async tx => {
    const snap = await tx.get(gameRef(gameId))
    if (!snap.exists()) throw new Error('Game not found.')

    const state = snap.data() as GameState
    if (state.status !== 'lobby') throw new Error('Game already started.')
    if (state.players.length < 2) throw new Error('Need at least 2 players.')

    const deck = shuffleDeck(createDeck(state.config))
    const playerIds = state.players.map(p => p.id)
    const { hands, remainingDeck } = dealCards(deck, playerIds, playerIds.length)

    const updated: GameState = {
      ...state,
      status: 'playing',
      deck: remainingDeck,
      hands,
      currentPlayerIndex: 0,
    }
    tx.set(gameRef(gameId), updated)
  })
}

export async function performAction(
  gameId: string,
  action: Action,
): Promise<void> {
  await runTransaction(db, async tx => {
    const snap = await tx.get(gameRef(gameId))
    if (!snap.exists()) throw new Error('Game not found.')

    let state = snap.data() as GameState
    if (state.status !== 'playing') throw new Error('Game is not in progress.')

    const currentPlayer = state.players[state.currentPlayerIndex]
    if (currentPlayer.id !== action.actorId) throw new Error("It's not your turn.")

    if (action.type === 'clue') {
      state = giveClue(
        state,
        action.actorId,
        action.targetPlayerId,
        action.clueType as ClueType,
        action.clueValue as Color | Value,
      )
    } else if (action.type === 'discard') {
      state = discardCard(state, action.actorId, action.cardId)
    } else if (action.type === 'play') {
      state = playCard(state, action.actorId, action.cardId)
    }

    if (state.status !== 'ended') {
      const condition = checkEndCondition(state)
      state = applyEndCondition(state, condition)
    }

    tx.set(gameRef(gameId), state)
  })
}

export function subscribeToGame(
  gameId: string,
  callback: (state: GameState | null) => void,
): () => void {
  return onSnapshot(gameRef(gameId), snap => {
    callback(snap.exists() ? (snap.data() as GameState) : null)
  })
}
