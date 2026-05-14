import { useState } from 'react'
import type { Letter } from '../types'
import { formatLocalDateTime, getMinDateTime, QUICK_PRESETS } from '../utils/time'

interface WriteLetterFormProps {
  onSubmit: (letter: Letter) => void
  onCancel: () => void
}

const LIMITS = { title: 100, recipient: 50, content: 10000 }

const INPUT_CLS =
  'w-full px-4 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-rose-300 focus:border-rose-400 outline-none text-stone-900 placeholder-stone-400 transition text-sm bg-white'

export function WriteLetterForm({ onSubmit, onCancel }: WriteLetterFormProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [recipient, setRecipient] = useState('')
  const [unlockDate, setUnlockDate] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = () => {
    setError('')

    if (!title.trim() || !content.trim() || !recipient.trim() || !unlockDate) {
      setError('All fields are required.')
      return
    }
    if (title.trim().length > LIMITS.title) {
      setError(`Title must be under ${LIMITS.title} characters.`)
      return
    }
    if (recipient.trim().length > LIMITS.recipient) {
      setError(`Recipient must be under ${LIMITS.recipient} characters.`)
      return
    }
    if (content.trim().length > LIMITS.content) {
      setError(`Letter must be under ${LIMITS.content.toLocaleString()} characters.`)
      return
    }
    const unlockTime = new Date(unlockDate)
    if (unlockTime <= new Date()) {
      setError('Unlock time must be in the future.')
      return
    }

    const letter: Letter = {
      id: crypto.randomUUID(),
      title: title.trim(),
      content: content.trim(),
      recipient: recipient.trim(),
      unlockDate: unlockTime.toISOString(),
      createdAt: new Date().toISOString(),
    }

    onSubmit(letter)
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      onClick={e => e.target === e.currentTarget && onCancel()}
    >
      <div className="bg-white w-full sm:rounded-3xl sm:max-w-lg max-h-[96dvh] sm:max-h-[92vh] overflow-y-auto rounded-t-3xl shadow-2xl">
        <div className="h-1 bg-rose-800 sm:rounded-t-3xl" />

        <div className="px-5 sm:px-7 py-6 sm:py-7">
          <div className="flex items-start justify-between mb-7">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900">Write a Letter</h2>
              <p className="text-sm text-stone-400 mt-1">Sealed until the moment you choose</p>
            </div>
            <button
              onClick={onCancel}
              className="w-8 h-8 flex items-center justify-center rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100 text-xl transition-colors mt-0.5"
            >
              ×
            </button>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2.5">
              <span className="shrink-0 mt-0.5">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={e => { e.preventDefault(); handleSubmit() }} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="A note to my future self"
                maxLength={LIMITS.title}
                className={INPUT_CLS}
              />
              <p className="text-right text-xs text-stone-400 mt-1.5">{title.length}/{LIMITS.title}</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">To</label>
              <input
                type="text"
                value={recipient}
                onChange={e => setRecipient(e.target.value)}
                placeholder="Future me"
                maxLength={LIMITS.recipient}
                className={INPUT_CLS}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">Unlock at</label>
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {QUICK_PRESETS.map(preset => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setUnlockDate(formatLocalDateTime(preset.offset()))}
                    className="text-xs px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-full border border-rose-200 transition-colors font-medium"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <input
                type="datetime-local"
                value={unlockDate}
                onChange={e => setUnlockDate(e.target.value)}
                min={getMinDateTime()}
                className={INPUT_CLS}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">Your letter</label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Dear future me..."
                rows={6}
                maxLength={LIMITS.content}
                className={`${INPUT_CLS} resize-none`}
              />
              <p className="text-right text-xs text-stone-400 mt-1.5">
                {content.length.toLocaleString()}/{LIMITS.content.toLocaleString()}
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-3 border border-stone-200 text-stone-600 rounded-xl hover:bg-stone-50 font-medium transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-rose-800 hover:bg-rose-900 text-white rounded-xl font-semibold transition-colors text-sm"
              >
                Lock & Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
