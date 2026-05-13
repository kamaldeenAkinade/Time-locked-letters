import { useState, useEffect } from 'react'
import { LetterCard, WriteLetterForm } from './components'
import type { Letter } from './types'
import { getLetters, addLetter, deleteLetter } from './storage'
import './App.css'

function App() {
  const [letters, setLetters] = useState<Letter[]>([])
  const [showForm, setShowForm] = useState(false)
  const [updateTrigger] = useState(0)

  // Load letters on mount and set up interval for countdown updates
  useEffect(() => {
    const loadLetters = () => {
      setLetters(getLetters())
    }
    
    loadLetters()
    const interval = setInterval(loadLetters, 60000) // Update every minute
    
    return () => clearInterval(interval)
  }, [updateTrigger])

  const handleWriteLetter = (letter: Letter) => {
    addLetter(letter)
    setLetters([...letters, letter])
    setShowForm(false)
  }

  const handleDeleteLetter = (id: string) => {
    deleteLetter(id)
    setLetters(letters.filter(letter => letter.id !== id))
  }

  const locked = letters.filter(l => new Date() < new Date(l.unlockDate))
  const unlocked = letters.filter(l => new Date() >= new Date(l.unlockDate))

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-50 via-blue-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-purple-600">⏰ Time-Locked Letters</h1>
              <p className="text-gray-600 text-sm mt-1">Write to your future self</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-md"
            >
              + Write Letter
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {letters.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg mb-4">No letters yet</p>
            <button
              onClick={() => setShowForm(true)}
              className="text-purple-600 hover:text-purple-700 font-semibold underline"
            >
              Write your first letter
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Locked Letters */}
            {locked.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  🔒 Locked ({locked.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {locked.map(letter => (
                    <LetterCard
                      key={letter.id}
                      letter={letter}
                      onDelete={handleDeleteLetter}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Unlocked Letters */}
            {unlocked.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  🔓 Unlocked ({unlocked.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {unlocked.map(letter => (
                    <LetterCard
                      key={letter.id}
                      letter={letter}
                      onDelete={handleDeleteLetter}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {/* Write Letter Form Modal */}
      {showForm && (
        <WriteLetterForm
          onSubmit={handleWriteLetter}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  )
}

export default App

