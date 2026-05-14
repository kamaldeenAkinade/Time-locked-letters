import { useState, useEffect, useCallback } from 'react'
import { LetterCard, WriteLetterForm, Toast } from './components'
import type { ToastMessage } from './components'
import type { Letter } from './types'
import { getLetters, addLetter, deleteLetter } from './storage'

function App() {
  const [letters, setLetters] = useState<Letter[]>([])
  const [showForm, setShowForm] = useState(false)
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = crypto.randomUUID()
    setToasts(prev => [...prev, { id, type, message }])
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  useEffect(() => {
    const loadLetters = () => setLetters(getLetters())
    loadLetters()

    const interval = setInterval(loadLetters, 60000)
    window.addEventListener('storage', loadLetters)

    return () => {
      clearInterval(interval)
      window.removeEventListener('storage', loadLetters)
    }
  }, [])

  const handleWriteLetter = (letter: Letter) => {
    const saved = addLetter(letter)
    if (saved) {
      setLetters(getLetters())
      setShowForm(false)
      addToast('success', 'Letter locked and saved!')
    } else {
      addToast('error', 'Failed to save — storage may be full or unavailable.')
    }
  }

  const handleDeleteLetter = (id: string) => {
    const deleted = deleteLetter(id)
    if (deleted) {
      setLetters(prev => prev.filter(letter => letter.id !== id))
    } else {
      addToast('error', 'Failed to delete letter.')
    }
  }

  const locked   = letters.filter(l => new Date() < new Date(l.unlockDate))
  const unlocked = letters.filter(l => new Date() >= new Date(l.unlockDate))

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 bg-rose-800 rounded-xl flex items-center justify-center text-white text-base shrink-0">
                ✉
              </div>
              <div className="min-w-0">
                <h1 className="text-base font-bold text-stone-900 leading-none truncate">Time-Locked Letters</h1>
                <p className="text-xs text-stone-400 mt-0.5">Write to your future self</p>
              </div>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="shrink-0 flex items-center gap-1.5 bg-rose-800 hover:bg-rose-900 text-white font-semibold py-2.5 px-4 sm:px-5 rounded-xl transition-colors text-sm"
            >
              <span className="text-base leading-none">+</span>
              <span className="hidden sm:inline">Write Letter</span>
              <span className="sm:hidden">Write</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {letters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 sm:py-32 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-3xl shadow-sm border border-stone-100 flex items-center justify-center text-3xl sm:text-4xl mb-6">
              ✉️
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-800 mb-2">No letters yet</h2>
            <p className="text-stone-400 max-w-xs mb-8 text-sm leading-relaxed">
              Write a letter to your future self. It stays sealed until the moment you choose.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-rose-800 hover:bg-rose-900 text-white font-semibold py-3 px-8 rounded-xl transition-colors text-sm"
            >
              Write your first letter
            </button>
          </div>
        ) : (
          <div className="space-y-12">
            {locked.length > 0 && (
              <section>
                <div className="flex items-center gap-2.5 mb-6">
                  <span className="w-1.5 h-4 bg-amber-500 rounded-full" />
                  <h2 className="text-xs font-bold text-stone-400 uppercase tracking-widest">
                    Sealed — {locked.length}
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                  {locked.map(letter => (
                    <LetterCard key={letter.id} letter={letter} onDelete={handleDeleteLetter} />
                  ))}
                </div>
              </section>
            )}

            {unlocked.length > 0 && (
              <section>
                <div className="flex items-center gap-2.5 mb-6">
                  <span className="w-1.5 h-4 bg-emerald-500 rounded-full" />
                  <h2 className="text-xs font-bold text-stone-400 uppercase tracking-widest">
                    Opened — {unlocked.length}
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                  {unlocked.map(letter => (
                    <LetterCard key={letter.id} letter={letter} onDelete={handleDeleteLetter} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {showForm && (
        <WriteLetterForm onSubmit={handleWriteLetter} onCancel={() => setShowForm(false)} />
      )}

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}

export default App
