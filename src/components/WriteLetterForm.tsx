import { useState } from 'react'
import type { Letter } from '../types'

interface WriteLetterFormProps {
  onSubmit: (letter: Letter) => void
  onCancel: () => void
}

export function WriteLetterForm({ onSubmit, onCancel }: WriteLetterFormProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [recipient, setRecipient] = useState('')
  const [unlockDate, setUnlockDate] = useState('')

  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 1)
  const minDateStr = minDate.toISOString().slice(0, 10)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim() || !recipient.trim() || !unlockDate) return

    const letter: Letter = {
      id: crypto.randomUUID(),
      title: title.trim(),
      content: content.trim(),
      recipient: recipient.trim(),
      unlockDate: new Date(unlockDate + 'T23:59:59').toISOString(),
      createdAt: new Date().toISOString(),
    }

    onSubmit(letter)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Write a Letter</h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              &times;
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="What's this letter about?"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To (recipient name)
              </label>
              <input
                type="text"
                value={recipient}
                onChange={e => setRecipient(e.target.value)}
                placeholder="Future me"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unlock Date
              </label>
              <input
                type="date"
                value={unlockDate}
                onChange={e => setUnlockDate(e.target.value)}
                min={minDateStr}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Letter
              </label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Dear future me..."
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
                required
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors shadow-md"
              >
                Lock &amp; Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
