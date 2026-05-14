import { useState, useEffect } from 'react'
import type { Letter } from '../types'
import { getTimeRemaining, formatDate, formatDateTime } from '../utils/time'

interface LetterCardProps {
  letter: Letter
  onDelete: (id: string) => void
}

export function LetterCard({ letter, onDelete }: LetterCardProps) {
  const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining(letter.unlockDate))
  const [confirmDelete, setConfirmDelete] = useState(false)

  const unlockMs = new Date(letter.unlockDate).getTime()
  const remainingMs = unlockMs - Date.now()
  const isUnlocked = remainingMs <= 0
  const isUrgent = !isUnlocked && remainingMs < 60_000

  useEffect(() => {
    const ms = new Date(letter.unlockDate).getTime()
    const interval = setInterval(() => {
      if (Date.now() >= ms) {
        setTimeRemaining('')
        clearInterval(interval)
        return
      }
      setTimeRemaining(getTimeRemaining(letter.unlockDate))
    }, 1000)
    return () => clearInterval(interval)
  }, [letter.unlockDate])

  return (
    <div className={`group relative rounded-2xl overflow-hidden border transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md animate-fadeIn ${
      isUnlocked ? 'bg-white border-stone-100' : 'bg-amber-50 border-amber-200/80'
    }`}>
      <div className={`h-0.5 w-full ${
        isUnlocked ? 'bg-emerald-400' : isUrgent ? 'bg-red-500 animate-pulse' : 'bg-amber-400'
      }`} />

      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
            isUnlocked ? 'bg-emerald-100' : 'bg-amber-100'
          }`}>
            {isUnlocked ? '🔓' : '🔒'}
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <h3 className="font-semibold text-stone-900 text-sm leading-snug truncate">{letter.title}</h3>
            <p className="text-xs text-stone-400 mt-0.5">
              To <span className="font-medium text-stone-600">{letter.recipient}</span>
            </p>
          </div>
        </div>

        {isUnlocked ? (
          <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-100">
            <p className="text-stone-700 text-sm whitespace-pre-wrap leading-relaxed max-h-44 overflow-y-auto">
              {letter.content}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-start gap-2.5 p-3 bg-amber-100/50 rounded-xl">
              <span className="text-sm shrink-0 mt-0.5">🔐</span>
              <div>
                <p className="text-amber-700 text-xs font-semibold uppercase tracking-wide">Sealed until</p>
                <p className="text-amber-900 text-sm font-medium mt-0.5">{formatDateTime(letter.unlockDate)}</p>
              </div>
            </div>
            {timeRemaining && (
              <div className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium ${
                isUrgent ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-amber-200 text-amber-700'
              }`}>
                <span>{isUrgent ? '⚡' : '⏱'}</span>
                {timeRemaining}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-stone-100">
          <p className="text-xs text-stone-400">Written {formatDate(letter.createdAt)}</p>
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-400">Delete?</span>
              <button
                onClick={() => onDelete(letter.id)}
                className="text-xs text-white bg-red-500 hover:bg-red-600 px-2.5 py-1 rounded-lg transition-colors font-medium"
              >
                Yes
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs text-stone-600 bg-stone-100 hover:bg-stone-200 px-2.5 py-1 rounded-lg transition-colors font-medium"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-xs text-stone-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 font-medium"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
