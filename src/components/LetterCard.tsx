import { useState, useEffect } from 'react'
import type { Letter } from '../types'

interface LetterCardProps {
  letter: Letter
  onDelete: (id: string) => void
}

function getTimeRemaining(unlockDate: string): string {
  const now = new Date()
  const unlock = new Date(unlockDate)
  const diff = unlock.getTime() - now.getTime()

  if (diff <= 0) return ''

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (days > 0) return `${days}d ${hours}h remaining`
  if (hours > 0) return `${hours}h ${minutes}m remaining`
  return `${minutes}m remaining`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

export function LetterCard({ letter, onDelete }: LetterCardProps) {
  const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining(letter.unlockDate))
  const isUnlocked = new Date() >= new Date(letter.unlockDate)

  useEffect(() => {
    if (isUnlocked) return
    const interval = setInterval(() => {
      const remaining = getTimeRemaining(letter.unlockDate)
      setTimeRemaining(remaining)
      if (!remaining) clearInterval(interval)
    }, 60000)
    return () => clearInterval(interval)
  }, [letter.unlockDate, isUnlocked])

  return (
    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow animate-fadeIn">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-bold text-lg text-gray-800">{letter.title}</h3>
        <span className="text-2xl">{isUnlocked ? '🔓' : '🔒'}</span>
      </div>

      <p className="text-sm text-gray-500 mb-2">
        To: <span className="font-medium text-gray-700">{letter.recipient}</span>
      </p>

      {isUnlocked ? (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <p className="text-gray-700 whitespace-pre-wrap">{letter.content}</p>
        </div>
      ) : (
        <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-amber-700 text-sm font-medium">
            🔐 Locked until {formatDate(letter.unlockDate)}
          </p>
          {timeRemaining && (
            <p className="text-amber-600 text-xs mt-1">{timeRemaining}</p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-400">Created {formatDate(letter.createdAt)}</p>
        <button
          onClick={() => onDelete(letter.id)}
          className="text-red-400 hover:text-red-600 text-sm font-medium transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  )
}
