import type { Letter } from './types'

const KEY = 'time-locked-letters'

function readAll(): Letter[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Letter[]) : []
  } catch {
    return []
  }
}

function writeAll(letters: Letter[]): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(letters))
    return true
  } catch (e) {
    console.error('localStorage write failed:', e)
    return false
  }
}

export const getLetters = readAll

export function addLetter(letter: Letter): boolean {
  return writeAll([...readAll(), letter])
}

export function deleteLetter(id: string): boolean {
  return writeAll(readAll().filter(l => l.id !== id))
}
