import type { Letter } from './types'

const STORAGE_KEY = 'time-locked-letters'

export function getLetters(): Letter[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function addLetter(letter: Letter): void {
  const letters = getLetters()
  letters.push(letter)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(letters))
}

export function deleteLetter(id: string): void {
  const letters = getLetters().filter(l => l.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(letters))
}

export function updateLetter(id: string, updates: Partial<Letter>): void {
  const letters = getLetters().map(l => l.id === id ? { ...l, ...updates } : l)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(letters))
}
