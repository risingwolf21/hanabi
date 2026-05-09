import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Color } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const GAME_ID_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateGameId(): string {
  let id = ''
  for (let i = 0; i < 6; i++) {
    id += GAME_ID_CHARS[Math.floor(Math.random() * GAME_ID_CHARS.length)]
  }
  return id
}

export const COLOR_DISPLAY: Record<Color, { label: string; bg: string; border: string; text: string; dot: string }> = {
  red: {
    label: 'Red',
    bg: 'bg-red-500',
    border: 'border-red-600',
    text: 'text-white',
    dot: 'bg-red-500',
  },
  yellow: {
    label: 'Yellow',
    bg: 'bg-yellow-400',
    border: 'border-yellow-500',
    text: 'text-gray-900',
    dot: 'bg-yellow-400',
  },
  green: {
    label: 'Green',
    bg: 'bg-green-500',
    border: 'border-green-600',
    text: 'text-white',
    dot: 'bg-green-500',
  },
  blue: {
    label: 'Blue',
    bg: 'bg-blue-500',
    border: 'border-blue-600',
    text: 'text-white',
    dot: 'bg-blue-500',
  },
  white: {
    label: 'White',
    bg: 'bg-slate-100',
    border: 'border-slate-300',
    text: 'text-slate-800',
    dot: 'bg-slate-200',
  },
  multicolor: {
    label: 'Multi',
    bg: 'bg-purple-500',
    border: 'border-purple-600',
    text: 'text-white',
    dot: 'bg-purple-500',
  },
}

export function getScoreRating(score: number): string {
  if (score <= 5) return 'Horrible, booed by the crowd...'
  if (score <= 10) return 'Mediocre, just a hint of scattered applause...'
  if (score <= 15) return 'Honorable attempt, but quickly forgotten...'
  if (score <= 20) return 'Excellent, crowd pleasing.'
  if (score <= 24) return 'Amazing, they will be talking about it for weeks!'
  return 'Legendary, everyone left speechless, stars in their eyes!'
}

export function getCardDistribution(): [number, number][] {
  return [[1, 3], [2, 2], [3, 2], [4, 2], [5, 1]]
}
