# Time-Locked Letters — Codebase Walkthrough (Explained Like I'm 7)

> Every line explained. No jargon. No shortcuts.

---

## Table of Contents

1. [index.html — The Skeleton](#1-indexhtml--the-skeleton)
2. [src/main.tsx — The Front Door](#2-srcmaintsx--the-front-door)
3. [src/index.css — The Paint & Wallpaper](#3-srcindexcss--the-paint--wallpaper)
4. [src/App.css — The Empty Frame](#4-srcappcss--the-empty-frame)
5. [src/types.ts — The Blueprint](#5-srctypests--the-blueprint)
6. [src/storage.ts — The Filing Cabinet](#6-srcstoragets--the-filing-cabinet)
7. [src/components/WriteLetterForm.tsx — The Letter-Writing Desk](#7-srccomponentswriteletterformtsx--the-letter-writing-desk)
8. [src/components/LetterCard.tsx — The Mailbox](#8-srccomponentslettercardtsx--the-mailbox)
9. [src/components/index.ts — The Mailroom Sign](#9-srccomponentsindexts--the-mailroom-sign)
10. [src/App.tsx — The Main Living Room](#10-srcapptsx--the-main-living-room)
11. [vite.config.ts — The Toolbox](#11-viteconfigts--the-toolbox)
12. [package.json — The Shopping List](#12-packagejson--the-shopping-list)

---

## 1. index.html — The Skeleton

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>time-locked-letters</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

This is the **blank page** your browser loads. It's like the empty stage before a play starts.

- **`<!doctype html>`** — Tells the browser: "Hey, this is an HTML page!"
- **`<html lang="en">`** — Says the page is in English.
- **`<meta charset="UTF-8" />`** — Lets the page show any letter from any language (emojis, accents, etc.).
- **`<link rel="icon" ...>`** — The little icon you see in the browser tab.
- **`<meta name="viewport" ...>`** — Tells phones and tablets: "Don't zoom out, this page is designed for your screen size."
- **`<title>time-locked-letters</title>`** — The text that appears on the browser tab.
- **`<div id="root"></div>`** — An **empty div**. Think of it as a picture frame. React will paint everything inside this frame. We give it the id `"root"` so React can find it.
- **`<script type="module" src="/src/main.tsx"></script>`** — This loads our React app. `type="module"` means "this script can import other files." It points to `main.tsx`, which is the first React file that runs.

---

## 2. src/main.tsx — The Front Door

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

This is the **first React file that runs**. It's like unlocking the front door and turning on the lights.

- **`import { StrictMode } from 'react'`** — Brings in React's "strict mode." This is like a teacher who watches over your code during development and points out mistakes. It only runs in development, not when users visit the live site.
- **`import { createRoot } from 'react-dom/client'`** — Brings in the tool that connects React to the browser's DOM (the webpage). `createRoot` is like a plant pot — you put React into it, and then it grows into the webpage.
- **`import './index.css'`** — Loads the CSS file so all the colors and fonts apply to the page.
- **`import App from './App.tsx'`** — Imports our main `App` component (the big boss component).
- **`createRoot(document.getElementById('root')!)`** — Finds the empty `<div id="root"></div>` from `index.html` and turns it into a React root. The `!` (called "non-null assertion") is like telling TypeScript: "Trust me, there IS a div with id 'root'. I saw it in index.html."
- **`.render(...)`** — Paints the React component tree into that div.
- **`<StrictMode><App /></StrictMode>`** — Wraps our App in StrictMode so React double-checks everything. In development, `useEffect` runs **twice** on purpose to help you catch bugs. This surprises a lot of beginners! It does NOT run twice in production.

---

## 3. src/index.css — The Paint & Wallpaper

```css
@import "tailwindcss";

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@utility animate-fadeIn {
  animation: fadeIn 0.5s ease-out;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, ...;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#root {
  width: 100%;
  min-height: 100vh;
}
```

- **`@import "tailwindcss"`** — Tailwind is a CSS tool that gives you hundreds of ready-made styles like `bg-purple-600`, `text-lg`, `rounded-lg`. This one line loads all of them. In Tailwind v4, you use this instead of the old `@tailwind base/components/utilities`.
- **`@keyframes fadeIn`** — Defines a **cartoon animation**. When a card appears, it starts invisible (`opacity: 0`) and slightly lower (`translateY(10px)`), then smoothly becomes visible and slides up to where it belongs. Like a toast popping up from a toaster.
- **`@utility animate-fadeIn`** — Tailwind v4 way of saying: "create a custom utility class called `animate-fadeIn` that plays the fadeIn animation over half a second." Now any HTML element can use `className="animate-fadeIn"`.
- **`* { margin: 0; padding: 0; box-sizing: border-box; }`** — A "reset" that removes the tiny gaps browsers add by default. `box-sizing: border-box` makes sure padding doesn't make a box bigger — the box stays the size you set.
- **`body { font-family: ... }`** — Sets the font to system fonts (San Francisco on Mac, Segoe UI on Windows) for a clean, native look.
- **`-webkit-font-smoothing: antialiased`** — Makes text look smoother on Mac browsers.
- **`#root { min-height: 100vh; }`** — Makes the root div at least as tall as the whole window (`100vh` = 100% of the "viewport height"). Without this, a short page would leave white space at the bottom.

---

## 4. src/App.css — The Empty Frame

```css
/* App styles are handled by Tailwind CSS */
```

Just a comment saying "we don't need custom CSS here because Tailwind handles everything." It's imported by `App.tsx` but does nothing.

---

## 5. src/types.ts — The Blueprint

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

An **interface** is a blueprint. It says: "Every letter in this app MUST have these 6 things."

- **`id: string`** — A unique name for each letter. We use `crypto.randomUUID()` which generates something like `"a1b2c3d4-e5f6-..."`. This is how we tell letters apart (like a license plate).
- **`title: string`** — The letter's subject line, e.g. "My goals for next year."
- **`content: string`** — The actual body of the letter.
- **`recipient: string`** — Who the letter is addressed to, e.g. "Future me" or "My younger brother."
- **`unlockDate: string`** — The date when the letter becomes readable. Stored as a **string** (not a Date object) because `localStorage` can only save text.
- **`createdAt: string`** — When the letter was written. Also a string.

> **Why are dates stored as strings?** Because `localStorage` is like a notebook that can only hold words and numbers. It cannot hold Date objects. So we convert dates to strings using `.toISOString()` (which produces something like `"2026-05-13T12:00:00.000Z"`) and convert them back with `new Date(string)` when we need to compare.

---

## 6. src/storage.ts — The Filing Cabinet

```tsx
import type { Letter } from './types'

const STORAGE_KEY = 'time-locked-letters'
```

- **`import type { Letter }`** — Brings in the Letter blueprint but ONLY for TypeScript checking. The `type` keyword means this import disappears entirely when the code runs in the browser. It's like bringing a blueprint to a meeting — you only look at it, you don't build with it.
- **`STORAGE_KEY`** — The name of the folder in the filing cabinet. When we save letters, they go into a slot called `"time-locked-letters"` inside `localStorage`.

### getLetters() — Reading from the filing cabinet

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

- **`localStorage.getItem(STORAGE_KEY)`** — Opens the filing cabinet, looks in the folder called `"time-locked-letters"`, and pulls out whatever is written there. If nothing is there, it returns `null`.
- **`JSON.parse(stored)`** — The filing cabinet stores everything as text (a string). But we stored an array of letter objects. `JSON.parse` converts that text back into real JavaScript objects. It's like reading a recipe written in plain English and turning it into actual ingredients on the counter.
- **`stored ? ... : []`** — If `stored` is `null` (nothing saved yet), return an empty array `[]`. Otherwise parse the text.
- **`try { ... } catch { return [] }`** — A safety net. If something goes wrong (e.g., someone manually corrupted the data in localStorage), instead of crashing the whole app, we just return an empty array. Like a robot that says "I couldn't read that file, so I'll start fresh."
- **Return type `Letter[]`** — Says "this function returns an array of Letter objects."

### addLetter() — Adding to the filing cabinet

```tsx
export function addLetter(letter: Letter): void {
  const letters = getLetters()
  letters.push(letter)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(letters))
}
```

- **`getLetters()`** — First, we read everything currently in the cabinet.
- **`letters.push(letter)`** — Push the new letter onto the end of the array.
- **`JSON.stringify(letters)`** — Convert the array into a text string (like writing a shopping list on paper).
- **`localStorage.setItem(STORAGE_KEY, ...)`** — Put that text string back into the filing cabinet, overwriting the old version.

### deleteLetter() — Removing from the filing cabinet

```tsx
export function deleteLetter(id: string): void {
  const letters = getLetters().filter(l => l.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(letters))
}
```

- **`.filter(l => l.id !== id)`** — Go through every letter. Keep only the ones whose `id` does NOT match the one we want to delete. `filter` is like a bouncer at a club: "If your ID is not this one, you can stay. If it is, you're out."
- Then we save the shorter array back.

### updateLetter() — Editing in the filing cabinet

```tsx
export function updateLetter(id: string, updates: Partial<Letter>): void {
  const letters = getLetters().map(l => l.id === id ? { ...l, ...updates } : l)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(letters))
}
```

- **`Partial<Letter>`** — Means "you don't have to provide ALL the letter fields, just the ones you want to change."
- **`.map(...)`** — Go through every letter. If the letter's id matches, spread the old letter `...l` and then overwrite with `...updates`. If it doesn't match, leave it as is.
- **`{ ...l, ...updates }`** — The spread operator `...` copies all properties from `l`, then `updates` overwrites any that overlap. Like making a photocopy of a document and then writing corrections on the copy.

---

## 7. src/components/WriteLetterForm.tsx — The Letter-Writing Desk

```tsx
import { useState } from 'react'
import type { Letter } from '../types'

interface WriteLetterFormProps {
  onSubmit: (letter: Letter) => void
  onCancel: () => void
}
```

- **`useState`** — A React hook that remembers things. Each text field has its own `useState` to remember what the user typed.
- **`WriteLetterFormProps`** — Describes what this component needs to work: an `onSubmit` function (called when the user hits save) and an `onCancel` function (called when the user closes the form).

### State variables — the form's memory

```tsx
export function WriteLetterForm({ onSubmit, onCancel }: WriteLetterFormProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [recipient, setRecipient] = useState('')
  const [unlockDate, setUnlockDate] = useState('')
```

Each `useState('')` creates a variable and a setter:
- **`title`** starts as `""` (empty). When the user types, `setTitle` updates it.
- Same for `content`, `recipient`, and `unlockDate`.

Think of `useState` like a sticky note. The user writes on the note, and React looks at the note whenever it needs to know what to show.

### Minimum date — preventing time travel

```tsx
  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 1)
  const minDateStr = minDate.toISOString().slice(0, 10)
```

- **`new Date()`** — Gets the current time, right now.
- **`minDate.setDate(minDate.getDate() + 1)`** — Adds 1 day to today. You can't set the unlock date to yesterday or today — you must pick at least tomorrow. This prevents someone from writing a letter that's unlocked instantly.
- **`.toISOString().slice(0, 10)`** — Converts to `"2026-05-13T..."` then keeps only the first 10 characters: `"2026-05-13"`. HTML date inputs require the `YYYY-MM-DD` format, so this is exactly what the `min` attribute needs.

### handleSubmit — Sending the letter

```tsx
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim() || !recipient.trim() || !unlockDate) return
```

- **`e.preventDefault()`** — When you submit a form in a browser, the browser normally **reloads the page**. That would destroy our React app! `preventDefault()` stops that from happening. Like putting a hand in front of someone's face and saying "No, don't do that."
- **`.trim()`** — Removes extra spaces from the beginning and end. `"  hello  ".trim()` becomes `"hello"`.
- **`if (!title.trim() || ...)`** — If any field is empty after trimming, `return` stops the function. The form won't submit. This is our last line of defense — the HTML `required` attribute on inputs should catch this first, but we double-check in JavaScript.

```tsx
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
```

- **`crypto.randomUUID()`** — Generates a unique ID like `"550e8400-e29b-41d4-a716-446655440000"`. This is built into modern browsers. No two letters will ever have the same ID.
- **`new Date(unlockDate + 'T23:59:59')`** — The date input gives us `"2026-05-13"`. We append `T23:59:59` to make it `"2026-05-13T23:59:59"` — meaning the letter unlocks at **11:59:59 PM** on that day. Without this, the unlock time would be midnight (00:00:00), which means it unlocks a full day earlier than expected!
- **`.toISOString()`** — Converts the JavaScript Date object into a standardized string like `"2026-05-13T23:59:59.000Z"`. This is the format we store in localStorage.
- **`new Date().toISOString()`** — Records the current timestamp as the creation date.
- **`onSubmit(letter)`** — Passes the finished letter object up to the parent component (App). This is like putting the letter in an envelope and handing it to your parent to mail.

### The JSX — The visual form

```tsx
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
```

- **`fixed inset-0`** — Covers the ENTIRE screen (like a bedsheet thrown over the whole room).
- **`bg-black/50`** — A semi-transparent black background. That's the "dim the lights" effect you see behind modals.
- **`z-50`** — Stacking order. A higher number means it sits on top of everything else.
- **`items-center justify-center`** — Centers the white form box in the middle of the screen.

```tsx
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
```

- **`max-w-lg`** — The form can't be wider than 512 pixels. On a phone, it shrinks to fit.
- **`max-h-[90vh]`** — The form can't be taller than 90% of the window height. If the content is too tall, `overflow-y-auto` lets you scroll inside the form without scrolling the page behind it.

The rest of the JSX is just labeled inputs and a submit button. Each input connects to its `useState` via `value` and `onChange`:

```tsx
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
```

- **`value={title}`** — The input shows whatever `title` currently is.
- **`onChange={e => setTitle(e.target.value)}`** — Whenever the user types, update `title` to match. This is called a **controlled input**: React is "in control" of what the input shows, not the browser.
- **`required`** — A built-in HTML check: the browser won't let you submit the form if this field is empty.

The date input:

```tsx
              <input
                type="date"
                value={unlockDate}
                onChange={e => setUnlockDate(e.target.value)}
                min={minDateStr}
                required
              />
```

- **`type="date"`** — Shows a native date picker (calendar popup).
- **`min={minDateStr}`** — Greyed-out dates before tomorrow can't be selected.

---

## 8. src/components/LetterCard.tsx — The Mailbox

### Props — What this component needs

```tsx
interface LetterCardProps {
  letter: Letter
  onDelete: (id: string) => void
}
```

This component receives a single `letter` object and an `onDelete` function to call when the user clicks Delete.

### getTimeRemaining() — The countdown clock

```tsx
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
```

This is the **heart of the countdown**. Let's break it down:

- **`new Date()`** — Right now, this precise millisecond.
- **`new Date(unlockDate)`** — The unlock moment, converted from the stored ISO string back into a Date object.
- **`unlock.getTime() - now.getTime()`** — Date subtraction. `.getTime()` returns the number of **milliseconds** since January 1, 1970. So `diff` is the gap between now and unlock time, measured in milliseconds.

> **Why milliseconds?** Dates stored as `"2026-05-13T23:59:59.000Z"` are hard to subtract. `.getTime()` converts them to simple numbers (like `1778702399000`), and subtracting numbers is easy math.

- **`if (diff <= 0) return ''`** — If the difference is zero or negative, the letter is unlocked. Return an empty string (no countdown to show).
- **`1000 * 60 * 60 * 24`** — Milliseconds in one day: 1000 ms/sec × 60 sec/min × 60 min/hr × 24 hr/day = 86,400,000 ms.
- **`Math.floor(diff / ...)`** — Division gives a decimal (like `2.5` days). `Math.floor` rounds DOWN (2 days, not 3). We always round down because we want "2 full days have passed, plus some extra hours."
- **`diff % (1000 * 60 * 60 * 24)`** — The `%` (modulo) operator gives the **remainder after division**. If `diff` is 2.5 days worth of milliseconds, the remainder is the half-day that's left after removing full days. We then divide that remainder to get hours.
- **`${days}d ${hours}h remaining`** — Template literals (backticks) let us insert variables into strings.

### formatDate() — Making dates pretty

```tsx
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}
```

Converts `"2026-05-13T23:59:59.000Z"` into `"May 13, 2026"`. `toLocaleDateString` formats a date according to a locale. We pass `'en-US'` and options to get a human-friendly format.

### isUnlocked — The big check

```tsx
export function LetterCard({ letter, onDelete }: LetterCardProps) {
  const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining(letter.unlockDate))
  const isUnlocked = new Date() >= new Date(letter.unlockDate)
```

- **`useState(getTimeRemaining(...))`** — The initial countdown text is calculated immediately when the card appears. We save it in state so it can update later.
- **`new Date() >= new Date(letter.unlockDate)`** — **Date comparison using `>=`**. This is a trick: JavaScript's `>=` and `<` work on Date objects by converting them to numbers internally (same as `.getTime()`). So `new Date() >= new Date(unlockDate)` is the same as `now.getTime() >= unlock.getTime()`. If `isUnlocked` is `true`, the letter's content is visible.

> **⚠️ Beginner trap:** You CANNOT use `===` to compare dates! `new Date("2026-05-13") === new Date("2026-05-13")` is `false` because they are two different objects. Always use `<`, `>`, `<=`, `>=`, or `.getTime()` for comparison.

### useEffect — The auto-updating timer

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

**`useEffect`** is a React hook that lets you run code **after** the component appears on screen. Think of it like a "side effect" — something that happens outside of just showing the UI.

Let's trace through this line by line:

1. **`useEffect(() => { ... }, [letter.unlockDate, isUnlocked])`** — The function inside runs when the component first appears, and again whenever `letter.unlockDate` or `isUnlocked` changes. The array at the end is called the "dependency array" — it lists what the effect depends on.

2. **`if (isUnlocked) return`** — If the letter is already unlocked, we don't need a countdown timer. Exit early.

3. **`const interval = setInterval(() => { ... }, 60000)`** — `setInterval` is a browser timer. It runs the function inside every 60,000 milliseconds (60 seconds = 1 minute). It returns an `interval` ID that we can use to stop it later.

4. **Inside the interval:**
   - `getTimeRemaining(letter.unlockDate)` — Recalculate the remaining time (1 minute has passed, so it's less than before).
   - `setTimeRemaining(remaining)` — Update the state, which makes React re-render the card with the new time.
   - `if (!remaining) clearInterval(interval)` — If the remaining time is empty (meaning the unlock date has arrived), stop the timer. No point ticking anymore.

5. **`return () => clearInterval(interval)`** — This is the **cleanup function**. React calls this when:
   - The component is removed from the screen (user deleted the letter).
   - The effect needs to re-run because dependencies changed.
   
   Without cleanup, the old timer would keep running even after the card is gone, calling `setTimeRemaining` on a component that doesn't exist anymore. React would warn: "Can't perform a React state update on an unmounted component."

> **⚠️ Beginner trap #1:** In development with StrictMode, `useEffect` runs **twice** (setup → cleanup → setup). This is intentional — it helps you catch missing cleanup code. The timer is created, immediately destroyed, then created again. Your final code works fine because the cleanup correctly stops the first timer.

> **⚠️ Beginner trap #2:** If you forget the dependency array `[]`, the effect runs after EVERY render, creating a new timer every time. You'd have hundreds of timers! Always think: "What does this effect depend on?"

### The JSX — The card display

```tsx
  return (
    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow animate-fadeIn">
```

- **`hover:shadow-lg`** — When you mouse over the card, the shadow grows bigger. Like the card lifts up slightly.
- **`transition-shadow`** — Makes that shadow change smooth instead of sudden.
- **`animate-fadeIn`** — Our custom animation from index.css. The card fades in and slides up when it appears.

```tsx
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-bold text-lg text-gray-800">{letter.title}</h3>
        <span className="text-2xl">{isUnlocked ? '🔓' : '🔒'}</span>
      </div>
```

- **`{isUnlocked ? '🔓' : '🔒'}`** — This is a **ternary operator**. It says: "If `isUnlocked` is true, show the unlocked emoji. Otherwise show the locked emoji." The `?` means "then" and the `:` means "else."

### Locked vs. unlocked content

```tsx
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
```

- **Locked state** (else): Shows a yellow box with "Locked until May 13, 2026" and the countdown timer below it.
- **Unlocked state** (if): Shows a gray box with the actual letter content.
- **`whitespace-pre-wrap`** — Preserves line breaks and spaces the user typed. Without this, all newlines would disappear and the letter would be one big paragraph.
- **`{timeRemaining && (...)}`** — A common React pattern. If `timeRemaining` is truthy (not empty string), show the element. If it's falsy (empty string — meaning the letter just unlocked), hide it. This is called **short-circuit evaluation**.

### Delete button

```tsx
        <button
          onClick={() => onDelete(letter.id)}
          className="text-red-400 hover:text-red-600 text-sm font-medium transition-colors"
        >
          Delete
        </button>
```

- **`onClick={() => onDelete(letter.id)}`** — When clicked, call the `onDelete` function (passed in from App) with this letter's ID. The arrow function `() => ...` is needed so we don't call `onDelete` immediately when the component renders — we only call it when the user clicks.

---

## 9. src/components/index.ts — The Mailroom Sign

```tsx
export { LetterCard } from './LetterCard'
export { WriteLetterForm } from './WriteLetterForm'
```

This is a **barrel file** — it imports components from their individual files and re-exports them from one place. Now `App.tsx` can do:

```tsx
import { LetterCard, WriteLetterForm } from './components'
```

Instead of:

```tsx
import { LetterCard } from './components/LetterCard'
import { WriteLetterForm } from './components/WriteLetterForm'
```

It's like putting all your toy boxes in one closet instead of having them scattered across the house.

---

## 10. src/App.tsx — The Main Living Room

This is the **boss component**. It connects everything together.

### Imports

```tsx
import { useState, useEffect } from 'react'
import { LetterCard, WriteLetterForm } from './components'
import type { Letter } from './types'
import { getLetters, addLetter, deleteLetter } from './storage'
import './App.css'
```

- `useState` and `useEffect` from React.
- Our two components from the barrel file.
- The `Letter` type for TypeScript checking (notice `import type` — it disappears at runtime).
- Three storage functions.
- The (empty) CSS file.

### State — The app's memory

```tsx
function App() {
  const [letters, setLetters] = useState<Letter[]>([])
  const [showForm, setShowForm] = useState(false)
  const [updateTrigger] = useState(0)
```

- **`letters`** — The full array of all saved letters. Starts as `[]`. `<Letter[]>` tells TypeScript "this array contains Letter objects."
- **`showForm`** — A simple boolean. `true` = show the WriteLetterForm modal, `false` = hide it.
- **`updateTrigger`** — A number that never changes (stays `0`). It's used only in the dependency array of `useEffect`. This is a bit of a code quirk — since it never changes, the effect only runs once on mount. We could use `[]` instead.

### useEffect — Loading letters from the filing cabinet

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

This does **two things**:

1. **Load letters immediately** when the app starts: `loadLetters()` calls `getLetters()` (from storage.ts) which reads localStorage, then `setLetters(...)` updates the `letters` state, which makes React re-render and show all the saved letters.

2. **Refresh every 60 seconds**: `setInterval(loadLetters, 60000)` calls `loadLetters` again every minute. Why? Because a letter might have reached its unlock date. Without this, the app would only check the date when the user manually refreshed the page. With this, the list of "locked" vs "unlocked" updates automatically every minute.

**The cleanup**: `return () => clearInterval(interval)` — When the component is removed from the screen, stop the interval timer. Prevents memory leaks.

> **Why not every second?** Once a minute is plenty for a countdown. Checking every second would waste battery and CPU for no real benefit.

> **Why `updateTrigger` in the deps?** Since `updateTrigger` never changes value (always `0`), the effect only runs once on mount. Using `[]` would be more straightforward — this is just a stylistic choice.

### handleWriteLetter — Adding a new letter

```tsx
  const handleWriteLetter = (letter: Letter) => {
    addLetter(letter)
    setLetters([...letters, letter])
    setShowForm(false)
  }
```

When the WriteLetterForm submits a letter:
1. **`addLetter(letter)`** — Save it to localStorage (the filing cabinet).
2. **`setLetters([...letters, letter])`** — Update the React state. `[...letters, letter]` creates a **brand new array** containing all the old letters plus the new one. We don't use `.push()` because React needs a new array reference to know the state changed.
3. **`setShowForm(false)`** — Close the modal.

### handleDeleteLetter — Removing a letter

```tsx
  const handleDeleteLetter = (id: string) => {
    deleteLetter(id)
    setLetters(letters.filter(letter => letter.id !== id))
  }
```

1. **`deleteLetter(id)`** — Remove from localStorage.
2. **`setLetters(letters.filter(letter => letter.id !== id))`** — Create a new array without the deleted letter. Same principle: new array = React knows to re-render.

### locked vs. unlocked — The date comparison

```tsx
  const locked = letters.filter(l => new Date() < new Date(l.unlockDate))
  const unlocked = letters.filter(l => new Date() >= new Date(l.unlockDate))
```

**This is THE most important date logic in the app.** Let's really understand it:

- **`new Date()`** — Creates a Date object representing RIGHT NOW.
- **`new Date(l.unlockDate)`** — Creates a Date object representing the unlock moment. Remember, `l.unlockDate` is an ISO string like `"2026-05-13T23:59:59.000Z"`. Wrapping it in `new Date(...)` converts it back into a Date object.
- **`new Date() < new Date(l.unlockDate)`** — Is "right now" BEFORE the unlock moment? If yes, the letter is still locked.
- **`new Date() >= new Date(l.unlockDate)`** — Is "right now" AT or AFTER the unlock moment? If yes, the letter is unlocked.

**Why `>=` for unlocked?** If we used just `>`, a letter that unlocks at exactly this millisecond would be neither locked nor unlocked. `>=` catches that edge case.

**Why not use `getTime()`?** JavaScript's `<`, `>`, `<=`, `>=` automatically convert Date objects to milliseconds when comparing. It's just shorter to write `new Date() < new Date(unlockDate)` than `new Date().getTime() < new Date(unlockDate).getTime()`. Both produce the same result.

### The JSX — The full page layout

```tsx
  return (
    <div className="min-h-screen bg-linear-to-br from-purple-50 via-blue-50 to-pink-50">
```

- **`bg-linear-to-br`** — A gradient that goes from top-left to bottom-right. `from-purple-50` (light purple) through `via-blue-50` (light blue) to `pink-50` (light pink). Creates that pretty pastel background.

#### Header

```tsx
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
```

- **`shadow-sm`** — A subtle shadow under the header, separating it from the content below.
- **`max-w-6xl mx-auto`** — The content inside the header is centered and max 1152px wide on big screens.

#### Empty state — No letters yet

```tsx
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
```

If there are no letters (`letters.length === 0`), show a friendly message with a link to write the first one. This is called an "empty state" — don't just show a blank page, guide the user.

#### Locked and Unlocked sections

```tsx
          <div className="space-y-8">
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
```

- **`{locked.length > 0 && (...)}`** — Only show the "Locked" section if there are locked letters. If it's empty, don't render anything.
- **`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`** — A responsive grid:
  - On phones: 1 column (cards stack vertically).
  - On medium screens (tablets): 2 columns.
  - On large screens (desktops): 3 columns.
  - `gap-4`: 16px gap between cards.
- **`{locked.map(letter => (...))}`** — Go through each locked letter and render a LetterCard for it. `map` transforms an array into another array (objects → React elements).
- **`key={letter.id}`** — React needs a unique `key` for each item in a list. This helps React figure out which items changed, were added, or were removed. Using `letter.id` (our UUID) is perfect. **Never use array index as a key** if the list can be reordered.

#### WriteLetterForm modal

```tsx
      {showForm && (
        <WriteLetterForm
          onSubmit={handleWriteLetter}
          onCancel={() => setShowForm(false)}
        />
      )}
```

- **`{showForm && (...)}`** — Only show the form modal when `showForm` is `true`. When false, the `<WriteLetterForm>` component doesn't exist in the DOM at all — it's completely removed.

### export default App

```tsx
export default App
```

Makes `App` available to `main.tsx` so `createRoot` can render it.

---

## 11. vite.config.ts — The Toolbox

```tsx
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

- **`defineConfig`** — A helper function that gives you autocomplete hints when writing the config.
- **`@vitejs/plugin-react`** — Tells Vite how to handle React JSX files. Without this, `.tsx` files wouldn't work.
- **`@tailwindcss/vite`** — Tells Vite to process Tailwind CSS. When Vite sees `@import "tailwindcss"` in the CSS, this plugin knows to expand it into all the Tailwind utility classes.

---

## 12. package.json — The Shopping List

```json
{
  "name": "time-locked-letters",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "@tailwindcss/vite": "^4.3.0",
    "react": "^19.2.6",
    "react-dom": "^19.2.6"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^6.0.1",
    "tailwindcss": "^4.3.0",
    "typescript": "~6.0.2",
    "vite": "^8.0.12",
    ...
  }
}
```

- **`scripts`** — Commands you can run:
  - `npm run dev` — Starts a dev server with hot-reload (changes appear instantly).
  - `npm run build` — First checks TypeScript errors (`tsc -b`), then bundles everything for production (`vite build`).
  - `npm run preview` — Preview the production build locally.
  - `npm run lint` — Check for code quality issues.
- **`dependencies`** — Packages the app needs to RUN (included in the final bundle).
- **`devDependencies`** — Packages only needed during DEVELOPMENT (TypeScript, build tools, linter). Not included in the final bundle sent to users.

---

## Summary: How It All Fits Together

```
User opens browser → index.html loads → main.tsx runs
  → React creates root in <div id="root">
  → App.tsx renders (the whole page)
  → useEffect in App runs:
      → getLetters() reads from localStorage
      → setLetters(...) fills the state
      → setInterval starts (rechecks every 60s)
  → Letters are split into locked/unlocked
  → LetterCard renders for each letter
  → Each LetterCard shows content or countdown
  → User clicks "+ Write Letter" → WriteLetterForm appears
  → User fills form and submits:
      → new Letter object created with crypto.randomUUID()
      → addLetter() saves to localStorage
      → App state updates → card appears on screen
  → User clicks Delete:
      → deleteLetter() removes from localStorage
      → App state updates → card disappears
```

**The flow of data:**

```
User types → useState remembers → form submits → localStorage saves
  → App reads from localStorage → setLetters updates state
  → React re-renders with new data
  → useEffect runs → interval checks time → setTimeRemaining updates
  → Card shows countdown ticking down
```

---

## Appendix: Common Beginner Mistakes to Watch For

### 1. Forgetting `e.preventDefault()` on forms
Without it, submitting a form reloads the page and your React app dies.

### 2. Mutating state directly
❌ `letters.push(newLetter)` — React won't know the array changed.
✅ `setLetters([...letters, newLetter])` — Creates a new array.

### 3. Using array index as `key`
❌ `letters.map((l, i) => <Card key={i} />)` — If items are deleted/reordered, React gets confused.
✅ `letters.map(l => <Card key={l.id} />)` — Stable, unique key.

### 4. Comparing Date objects with `===`
❌ `new Date(a) === new Date(b)` — Always `false` (different objects).
✅ `new Date(a).getTime() === new Date(b).getTime()` — Compares the numbers.

### 5. Forgetting useEffect cleanup
Without `clearInterval(interval)`, timers keep running even after the component is gone. This causes bugs and memory leaks.

### 6. Accidentally calling a function in onClick
❌ `onClick={onDelete(letter.id)}` — Runs immediately when rendering.
✅ `onClick={() => onDelete(letter.id)}` — Runs only when clicked.

### 7. Missing dependencies in useEffect
❌ `useEffect(() => { ... }, [])` — If the effect uses `letter.unlockDate`, but it's not in the deps array, the effect won't re-run when the date changes. React's `react-hooks/exhaustive-deps` lint rule catches this.
