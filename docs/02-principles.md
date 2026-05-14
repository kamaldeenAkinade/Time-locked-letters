# Principles at Work

> Every design principle in this codebase, with the exact lines and an explanation of why it matters.

---

## 1. Single Source of Truth

**The idea:** Every piece of data should live in exactly one canonical place. Everything else is a copy or a derivation.

**Where:** `storage.ts:3`

```tsx
const STORAGE_KEY = 'time-locked-letters'
```

localStorage is the **one true record** of all letters. There is no database, no server, no second cache. The entire app revolves around this single key.

**Evidence elsewhere:**

- `App.tsx:8` — React state `letters` is initialized as empty `[]`, then immediately populated from localStorage on mount (`App.tsx:15`). It never holds data that isn't in localStorage.
- `App.tsx:24-27` — On write: `addLetter(letter)` writes to localStorage **first**, then `setLetters` syncs React state to match. localStorage is always the authoritative write target.
- `App.tsx:30-32` — On delete: `deleteLetter(id)` removes from localStorage first, then filters React state.

**Why it matters:** If localStorage and React state ever disagree, localStorage wins on the next refresh. The app recovers from any React state corruption automatically.

---

## 2. Persistence

**The idea:** Data survives page reloads, browser closes, and computer restarts.

**Where:** `storage.ts:7-8`

```tsx
const stored = localStorage.getItem(STORAGE_KEY)
return stored ? JSON.parse(stored) : []
```

`localStorage` is a key-value store built into every browser. Data written to it stays until explicitly deleted. It's like a notebook that doesn't get thrown away when you close the browser.

**Supporting lines:**

- `storage.ts:17` — `localStorage.setItem(STORAGE_KEY, JSON.stringify(letters))` in `addLetter`
- `storage.ts:22` — Same pattern in `deleteLetter`
- `storage.ts:27` — Same pattern in `updateLetter`
- `App.tsx:15` — `getLetters()` called on every mount and every 60-second interval to re-read from persistent storage

**Why it matters:** Without persistence, refreshing the page would delete every letter. Users expect their data to still be there tomorrow.

---

## 3. Derived State

**The idea:** Never store a value that can be **computed** from existing data. Calculate it on the fly.

### Locked / unlocked split

**Where:** `App.tsx:35-36`

```tsx
const locked = letters.filter(l => new Date() < new Date(l.unlockDate))
const unlocked = letters.filter(l => new Date() >= new Date(l.unlockDate))
```

`locked` and `unlocked` are not stored in state. They are recalculated every render from `letters` and the current clock time. If we stored them separately, we'd have to keep them in sync — a common source of bugs.

### isUnlocked per card

**Where:** `LetterCard.tsx:33`

```tsx
const isUnlocked = new Date() >= new Date(letter.unlockDate)
```

Computed directly from the letter's `unlockDate`. Not stored in state.

### Countdown text (initial value)

**Where:** `LetterCard.tsx:32`

```tsx
const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining(letter.unlockDate))
```

The initial countdown text is derived from `letter.unlockDate` at render time. The `useState` only exists because the countdown needs to **tick** (a side effect), not because the data itself is separate.

### minimum date for the form

**Where:** `WriteLetterForm.tsx:15-17`

```tsx
const minDate = new Date()
minDate.setDate(minDate.getDate() + 1)
const minDateStr = minDate.toISOString().slice(0, 10)
```

Not stored in state. Recalculated every render from the current date.

### Formatted dates

**Where:** `LetterCard.tsx:25-29`

```tsx
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}
```

Display strings like "May 13, 2026" are derived from ISO date strings at render time. Never stored.

**Why it matters:** Derived state eliminates synchronization bugs. If we stored `locked` and `unlocked` in state, we'd need to update them whenever `letters` changed or the clock ticked. That's fragile. Computing them is both simpler and more reliable.

---

## 4. Side Effects Management

**The idea:** Code that interacts with the outside world (timers, localStorage, network) must be carefully started, tracked, and cleaned up to prevent leaks and bugs.

### App-level interval — polling for date changes

**Where:** `App.tsx:13-22`

```tsx
useEffect(() => {
    const loadLetters = () => {
      setLetters(getLetters())
    }
    
    loadLetters()
    const interval = setInterval(loadLetters, 60000)
    
    return () => clearInterval(interval)
  }, [updateTrigger])
```

| Part | Role |
|------|------|
| `loadLetters()` called immediately (line 18) | Hydrate React state from persisted storage on mount |
| `setInterval(loadLetters, 60000)` (line 19) | Poll localStorage every 60s so locked/unlocked sections re-sort as time passes |
| `return () => clearInterval(interval)` (line 21) | **Cleanup:** kill the timer when the component unmounts |
| `[updateTrigger]` (line 22) | Dependency array — effect re-runs only when this changes (never does, so it runs once) |

### Card-level interval — countdown ticker

**Where:** `LetterCard.tsx:35-43`

```tsx
useEffect(() => {
    if (isUnlocked) return
    const interval = setInterval(() => {
      const remaining = getTimeRemaining(letter.unlockDate)
      setTimeRemaining(remaining)
      if (!remaining) clearInterval(interval)
    }, 60000)
    return () => clearInterval(interval)
  }, [letter.unlockDate, isUnlocked])
```

| Part | Role |
|------|------|
| `if (isUnlocked) return` (line 36) | **Early exit** — no timer needed if the letter is already readable |
| `setInterval` callback (lines 37-41) | Recalculate remaining time every minute, update state, self-cancel when countdown hits zero |
| `return () => clearInterval(interval)` (line 42) | Cleanup on unmount or re-render |
| `[letter.unlockDate, isUnlocked]` (line 43) | Re-create timer if the letter data changes |

**Self-cancellation pattern** at `LetterCard.tsx:40`:

```tsx
if (!remaining) clearInterval(interval)
```

When `getTimeRemaining` returns `""` (the unlock date arrived mid-interval), the timer kills itself. No more unnecessary ticks.

**Why it matters:** Every `setInterval` must have a matching `clearInterval`. Forgetting cleanup causes:
- Timers that call `setState` on unmounted components (React warning + memory leak)
- Multiple timers stacking up if the component re-renders (deps changed)
- Battery drain on mobile from running timers forever

---

## 5. Unidirectional Data Flow

**The idea:** Data flows **down** the component tree via props. Events flow **up** via callbacks. No child component ever directly modifies a parent's state.

### Props down

**Where:** `App.tsx:80-84`

```tsx
<LetterCard
    key={letter.id}
    letter={letter}
    onDelete={handleDeleteLetter}
/>
```

`letter` (data) and `onDelete` (callback) are passed **into** `LetterCard`. The card receives them as read-only props.

### Events up

**Where:** `LetterCard.tsx:74`

```tsx
onClick={() => onDelete(letter.id)}
```

The card doesn't delete anything itself. It calls `onDelete` (the callback it received) and lets the parent decide what to do.

### Same pattern for the form

**Where:** `App.tsx:113-116`

```tsx
<WriteLetterForm
    onSubmit={handleWriteLetter}
    onCancel={() => setShowForm(false)}
/>
```

**Where:** `WriteLetterForm.tsx:32`

```tsx
onSubmit(letter)
```

The form assembles the `Letter` object and passes it **up**. It has no knowledge of localStorage or the parent's state.

**Why it matters:** This makes data flow predictable. You can trace where every piece of data came from and where every action goes. Debugging becomes "follow the props up and down."

---

## 6. Immutability

**The idea:** Never mutate existing state. Create new objects/arrays instead.

### Adding a letter (new array via spread)

**Where:** `App.tsx:26`

```tsx
setLetters([...letters, letter])
```

`[...letters, letter]` creates a **brand new array** containing all old elements plus the new one. The original `letters` array is untouched.

### Deleting a letter (new array via filter)

**Where:** `App.tsx:32`

```tsx
setLetters(letters.filter(letter => letter.id !== id))
```

`.filter()` never mutates — it returns a new array.

### Updating a letter (new array via map with spread)

**Where:** `storage.ts:26`

```tsx
const letters = getLetters().map(l => l.id === id ? { ...l, ...updates } : l)
```

`{ ...l, ...updates }` creates a new object with the old letter's fields copied over and then the updates applied on top. The original letter object in the old array is never changed.

**Why it matters:** React detects state changes by reference equality (`===`). If you mutate an array and pass the same reference to `setLetters`, React skips the re-render. Immutable updates guarantee a new reference, which guarantees a re-render. It also prevents subtle bugs where two pieces of code share the same array reference and accidentally affect each other.

---

## 7. Separation of Concerns

**The idea:** Each file has one job and knows as little as possible about other files.

| File | Responsibility | Knows about |
|------|---------------|-------------|
| `types.ts` | Defines the Letter data shape | Nothing |
| `storage.ts` | Reading/writing localStorage | `types.ts` only |
| `components/LetterCard.tsx` | Rendering one letter card | `types.ts` only |
| `components/WriteLetterForm.tsx` | Collecting user input for a new letter | `types.ts` only |
| `App.tsx` | Orchestrating everything, managing top-level state | All of the above |

**Evidence:**

- `storage.ts` has zero JSX. It doesn't know React exists.
- `LetterCard.tsx` doesn't know localStorage exists. It gets its data via props.
- `WriteLetterForm.tsx` doesn't know how data is saved. It calls `onSubmit` and trusts the parent.
- `App.tsx` doesn't know how time calculations work. It delegates to `getTimeRemaining` inside `LetterCard`.

**Why it matters:** You can change `storage.ts` from localStorage to a server API without touching a single component. You can redesign `LetterCard` without worrying about breaking the save logic. Each piece is independently testable and replaceable.

---

## 8. Component Composition

**The idea:** Build complex UIs by nesting simple components.

**Where:** `App.tsx:79-85` and `App.tsx:97-103`

```tsx
{locked.map(letter => (
    <LetterCard
        key={letter.id}
        letter={letter}
        onDelete={handleDeleteLetter}
    />
))}
```

`App` doesn't re-implement card layout six times. It maps over data and renders `LetterCard` for each item. The card component is **reused** for both locked and unlocked sections.

**Where:** `App.tsx:112-116`

```tsx
{showForm && (
    <WriteLetterForm
        onSubmit={handleWriteLetter}
        onCancel={() => setShowForm(false)}
    />
)}
```

The form is a self-contained piece of UI. `App` shows or hides it with a simple conditional. The form manages its own internal state (title, content, recipient, date).

**Why it matters:** Composition lets you build complex screens from simple, testable pieces. Each component can be developed, tested, and understood in isolation.

---

## 9. Controlled Components

**The idea:** React state, not the DOM, drives form input values.

**Where:** `WriteLetterForm.tsx:54-61`

```tsx
<input
    type="text"
    value={title}
    onChange={e => setTitle(e.target.value)}
    ...
/>
```

- **`value={title}`** — The input displays whatever `title` contains.
- **`onChange={e => setTitle(e.target.value)}`** — When the user types, update state.

The pattern repeats for `content` (line 96-103), `recipient` (line 68-76), and `unlockDate` (line 82-90).

**Why it matters:** With uncontrolled inputs (the browser manages its own state), React has no way to validate, transform, or reset the input. With controlled inputs, React always knows the exact value. You can:
- Trim spaces on input
- Show character counts
- Reset the form by setting all state back to `""`
- Validate before submission

---

## 10. Type Safety

**The idea:** Use TypeScript to catch data-shape errors at compile time instead of runtime.

### Interface as contract

**Where:** `types.ts:1-8`

```tsx
export interface Letter {
    id: string
    title: string
    content: string
    recipient: string
    unlockDate: string
    createdAt: string
}
```

Every letter in the app must have exactly these 6 string fields. TypeScript enforces this everywhere `Letter` is used.

### Type-only imports

**Where:** `App.tsx:3`, `storage.ts:1`, `LetterCard.tsx:2`, `WriteLetterForm.tsx:2`

```tsx
import type { Letter } from './types'
```

The `type` keyword means this import **disappears at runtime**. It's a compile-time check only — zero bytes in the production bundle.

### Props interfaces

**Where:** `LetterCard.tsx:4-7`

```tsx
interface LetterCardProps {
    letter: Letter
    onDelete: (id: string) => void
}
```

**Where:** `WriteLetterForm.tsx:4-7`

```tsx
interface WriteLetterFormProps {
    onSubmit: (letter: Letter) => void
    onCancel: () => void
}
```

Every component's API is documented in code. If you pass the wrong type of `onDelete`, TypeScript catches it before you ever run the app.

### Generic state

**Where:** `App.tsx:8`

```tsx
const [letters, setLetters] = useState<Letter[]>([])
```

The `useState<Letter[]>` type parameter tells TypeScript "this array can only hold Letter objects." Any attempt to push a non-Letter into it is a compile error.

**Why it matters:** Runtime type errors (like accessing `letter.title` when `letter` is `undefined`) are the hardest bugs to find. TypeScript catches them as you type, with the exact file and line number.

---

## 11. Defensive Programming / Fail-Safe Design

**The idea:** Assume things will go wrong and handle failures gracefully instead of crashing.

### try/catch on localStorage

**Where:** `storage.ts:5-12`

```tsx
export function getLetters(): Letter[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        return stored ? JSON.parse(stored) : []
    } catch {
        return []
    }
}
```

- If `localStorage` is full, disabled (private browsing in some browsers), or corrupted, `getItem` or `JSON.parse` could throw.
- Instead of crashing the entire app, we catch the error and return `[]` — an empty state. The user sees "No letters yet" instead of a blank white screen.

### Guard clause on unlocked letters

**Where:** `LetterCard.tsx:36`

```tsx
if (isUnlocked) return
```

No point starting a countdown timer for a letter that's already unlocked. Exit immediately.

### Empty state check

**Where:** `WriteLetterForm.tsx:21`

```tsx
if (!title.trim() || !content.trim() || !recipient.trim() || !unlockDate) return
```

If any field is empty (after trimming), `handleSubmit` does nothing. The HTML `required` attribute should catch this first, but JavaScript double-checks because `required` can be bypassed (e.g., by editing the DOM in devtools).

### Empty sections not rendered

**Where:** `App.tsx:73` and `App.tsx:91`

```tsx
{locked.length > 0 && (
```

```tsx
{unlocked.length > 0 && (
```

If there are 0 locked letters, the "Locked" heading and section aren't rendered at all. No empty sections cluttering the UI.

**Why it matters:** Users would rather see "No letters yet" than a crash screen. Defensive programming turns potential crashes into minor inconveniences.

---

## 12. Lifting State Up

**The idea:** Shared state lives in the closest common ancestor of the components that need it.

**Where:** `App.tsx:8`

```tsx
const [letters, setLetters] = useState<Letter[]>([])
```

Both `LetterCard` (displays letters) and `WriteLetterForm` (creates letters) need access to the letters array. The common ancestor is `App`, so that's where the state lives.

- `WriteLetterForm` receives `onSubmit` — it doesn't get the letters array directly, but it contributes to it.
- `LetterCard` receives individual `letter` objects via props — it only sees what it needs.

**Where:** `App.tsx:9`

```tsx
const [showForm, setShowForm] = useState(false)
```

The "Write Letter" button (in `App`) needs to open the form, and the form's Cancel button needs to close it. The `showForm` boolean lives in `App` and gets passed down as a callback.

**Why it matters:** If `showForm` lived in `WriteLetterForm` itself, the "Write Letter" button in `App` couldn't set it to `true`. Shared state **must** be lifted to the parent. If two siblings need the same data, put it in the parent.

---

## 13. Keyed List Rendering

**The idea:** When rendering a list, give each element a stable, unique key so React can track changes efficiently.

**Where:** `App.tsx:81`, `App.tsx:99`

```tsx
key={letter.id}
```

`letter.id` is a UUID generated by `crypto.randomUUID()`. It is:
- **Unique** — no two letters share it.
- **Stable** — it never changes for the same letter.
- **Predictable** — it exists before the first render.

**Why it matters:** Without keys, React uses array indices. If you delete the first letter, all remaining letters shift indices, and React re-renders every card instead of just removing one. With stable keys, React knows exactly which card to remove and leaves the rest alone.

---

## 14. Co-location

**The idea:** Place code as close as possible to where it's used.

**Evidence:**

- `formatDate` is defined in `LetterCard.tsx` (line 25) because only `LetterCard` uses it.
- `getTimeRemaining` is defined in `LetterCard.tsx` (line 9) because only the card needs countdown logic.
- The countdown `useState` for remaining time lives in `LetterCard.tsx` (line 32), not in the parent `App`.

**Why it matters:** When you're reading `LetterCard.tsx`, everything you need to understand the card is in that file. You don't have to jump to five different files to trace a piece of logic. Co-location makes code locally understandable.

---

## 15. Hydration

**The idea:** On startup, read persisted data into React state so the UI matches what was saved.

**Where:** `App.tsx:13-18`

```tsx
useEffect(() => {
    const loadLetters = () => {
        setLetters(getLetters())
    }
    
    loadLetters()
```

On mount, `getLetters()` reads from localStorage and `setLetters` populates React state. The UI goes from empty to full in a single render cycle. The 60-second interval then keeps it fresh.

**Why it matters:** Without hydration, the user would see "No letters yet" for a split second before the data loads. Even worse — if the hydration happened at the wrong point, state and storage could diverge.

---

## Summary Table

| # | Principle | Key Location | In One Sentence |
|---|-----------|-------------|-----------------|
| 1 | Single Source of Truth | `storage.ts:3` | localStorage is the one true record of all letters |
| 2 | Persistence | `storage.ts:7-8` | Data stays when you close the browser |
| 3 | Derived State | `App.tsx:35-36` | Compute `locked`/`unlocked` from `letters`, don't store them |
| 4 | Side Effects Management | `App.tsx:13-22`, `LetterCard.tsx:35-43` | Every timer has a cleanup; every effect has deps |
| 5 | Unidirectional Data Flow | `App.tsx:80-84`, `LetterCard.tsx:74` | Props down, events up |
| 6 | Immutability | `App.tsx:26`, `App.tsx:32` | Never mutate state — make new arrays |
| 7 | Separation of Concerns | All files | Each file does one thing |
| 8 | Component Composition | `App.tsx:79-85` | Reuse `LetterCard` in both locked and unlocked sections |
| 9 | Controlled Components | `WriteLetterForm.tsx:54-61` | React state drives input values, not the DOM |
| 10 | Type Safety | `types.ts:1-8` | TypeScript catches data-shape errors at compile time |
| 11 | Defensive Programming | `storage.ts:6-11` | `try/catch` so corrupted localStorage doesn't crash the app |
| 12 | Lifting State Up | `App.tsx:8-9` | Shared state lives in the closest common ancestor |
| 13 | Keyed List Rendering | `App.tsx:81` | Stable UUID keys let React update lists efficiently |
| 14 | Co-location | `LetterCard.tsx:9,25,32` | Helper functions live in the file that uses them |
| 15 | Hydration | `App.tsx:15` | Read persisted data into React state on mount |
