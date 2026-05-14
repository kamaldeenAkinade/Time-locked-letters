# Audit: Edge Cases, Security, and Principle Violations

---

## 1. localStorage Is Full

### The problem

`storage.ts:17` — `addLetter` has **no try/catch** on `setItem`:

```tsx
export function addLetter(letter: Letter): void {
  const letters = getLetters()
  letters.push(letter)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(letters))  // ← throws if full
}
```

Same gap in `deleteLetter` (`storage.ts:22`) and `updateLetter` (`storage.ts:27`).

When the 5–10 MB quota is exceeded, `setItem` throws a `QuotaExceededError` (DOMException). This propagates to `App.tsx:25`:

```tsx
const handleWriteLetter = (letter: Letter) => {
    addLetter(letter)       // ← throws → lines 26-27 never execute
    setLetters([...letters, letter])
    setShowForm(false)
}
```

### What the user sees

The form stays open. Nothing happens. No feedback. The error is only in the console.

### Contrast with read path

`getLetters` (`storage.ts:6-11`) has a try/catch and gracefully returns `[]`. The write path has no such protection.

### Severity

**Medium.** Only hits when storage is full. But the user is left helpless — they can keep clicking "Lock & Save" with no idea it's failing.

### Fix

Wrap all `setItem` calls in try/catch, and surface the error to the user (toast, inline message, or disable the save button).

---

## 2. localStorage Is Disabled

### The problem

Some browsers block localStorage entirely:
- Safari private browsing (older versions)
- Strict privacy extensions
- `file://` protocol in some browsers
- `document.cookie`-based restrictions in iframes with `sandbox` attribute

`getItem` and `setItem` throw a `SecurityError` or `AccessDenied` when localStorage is unavailable.

### What survives

- `getLetters` (`storage.ts:6-11`) has try/catch → returns `[]` → app shows "No letters yet." The app is **read-resilient**.
- `addLetter` (`storage.ts:17`) has no try/catch → the error surfaces to the user as an unhandled exception.

### Severity

**Medium.** The app is partially usable (reads degrade gracefully) but writes silently fail. Same fix as #1.

---

## 3. User Changes the System Clock

### The problem

Every date comparison in the app uses `new Date()` which reads the **system clock**. The user can change it.

### All affected lines

| File | Line | Expression | Effect if clock goes back | Effect if clock goes forward |
|------|------|------------|--------------------------|------------------------------|
| `App.tsx:35` | `new Date() < new Date(l.unlockDate)` | Letters that should be locked appear unlocked | Letters unlock early |
| `App.tsx:36` | `new Date() >= new Date(l.unlockDate)` | Unlocked letters appear locked | Letters unlock even earlier |
| `LetterCard.tsx:10` | `const now = new Date()` | Countdown increases (diff gets larger) | Countdown accelerates or skips to zero |
| `LetterCard.tsx:33` | `new Date() >= new Date(letter.unlockDate)` | Locked shown as unlocked | Unlocked even earlier |
| `WriteLetterForm.tsx:15-17` | `new Date()` + `minDate.setDate(...)` | Min date is wrong | Min date is wrong |
| `WriteLetterForm.tsx:28` | `new Date(unlockDate + 'T23:59:59')` | N/A (parsing input, not clock) | N/A |
| `WriteLetterForm.tsx:29` | `new Date().toISOString()` | createdAt timestamp is wrong | createdAt timestamp is wrong |

### Concrete scenarios

**User sets clock back 1 hour:**
- A letter unlocking at 12:00 appears unlocked at 11:00.
- Countdown for a letter unlocking in 2 hours shows 3 hours remaining.

**User sets clock forward 1 day:**
- Every letter with `unlockDate` ≤ today appears unlocked immediately.
- Countdown for a letter unlocking in 2 days shows -1 day (and disappears, since `diff <= 0` → return `""`).

**User sets clock back 1 year:**
- Every letter appears locked.
- Countdown shows absurdly large numbers (365 days × letter count).

### The root cause

The app **trusts the client clock implicitly**. There is no server-side time authority. This is a fundamental limitation of a purely client-side app — there's no way to prevent clock manipulation.

### Severity

**High for intent, low for impact.** A user who wants to cheat the system can trivially bypass time locks. But there's no sensitive data at risk — it's their own letters. The more serious risk is accidental clock drift (NTP sync, daylight saving, timezone travel) causing temporary confusion.

### Mitigation options

1. **Use `Date.now()` consistently** instead of `new Date()` — same result, but slightly more explicit. (Doesn't fix the problem.)
2. **Store a server-side timestamp** on unlock attempts — requires a backend.
3. **Use the `Performance` API** — `performance.timeOrigin` gives the page-load time, but it's also tied to the system clock.
4. **Accept it as a client-app limitation** and document that time-locks are relative to the device clock.

---

## 4. Two Letters Share the Same Unlock Minute

### The scenario

Letters A and B both have `unlockDate` = `"2026-05-13T23:59:59.000Z"`. The minute rolls over from 12:00 to 12:01 on May 14.

### What happens

**At the App level** (`App.tsx:35-36`):

```tsx
const locked = letters.filter(l => new Date() < new Date(l.unlockDate))
const unlocked = letters.filter(l => new Date() >= new Date(l.unlockDate))
```

On the next render (triggered by the 60-second interval at line 19), both letters cross the threshold simultaneously and move from `locked` to `unlocked`.

**At the Card level** (`LetterCard.tsx:35-43`):

Each card has its own `setInterval`. Both timers have been ticking independently. When both expire:

1. Each timer calls `getTimeRemaining(letter.unlockDate)` which returns `""`.
2. `setTimeRemaining("")` causes a re-render.
3. On re-render, `isUnlocked` (`LetterCard.tsx:33`) becomes `true` for both.
4. Both cards show their content simultaneously.

**The self-cancellation pattern** at `LetterCard.tsx:40`:

```tsx
if (!remaining) clearInterval(interval)
```

The interval is cancelled on the first tick that returns `""`. No extra work.

### A subtle timing issue

The two cards' intervals are **not synchronized**. If both intervals were created at different times (cards rendered at different moments), they fire at different 60-second offsets. Card A's interval fires at :02, Card B's at :47. When the unlock moment arrives at :00:

- Card A's timer fires at :02 → sees remaining is `""` → cancels → re-render → shows unlocked.
- Card B's timer fires at :47 → sees remaining is `""` → cancels → re-render → shows unlocked.

Both show unlocked within 60 seconds of each other. Card A shows unlocked 47 seconds before Card B. Not ideal, but functionally harmless — the user sees "unlocked" content from the first card that ticks.

### The real gap

**There's no immediate unlock check.** Neither the App interval nor the card intervals trigger exactly at the unlock moment. The transition happens on the next periodic tick. Worst case: nearly 60 seconds of delay.

### Severity

**Low.** Two letters unlocking together works correctly, with at most 60 seconds of delay.

---

## 5. XSS (Cross-Site Scripting)

### The question

User-controlled text (title, content, recipient) is rendered into the DOM. Can injected HTML or JavaScript execute?

### React's built-in protection

React **escapes all JSX string content** by default. `{letter.content}` at `LetterCard.tsx:58`:

```tsx
<p className="text-gray-700 whitespace-pre-wrap">{letter.content}</p>
```

If `letter.content` is `"<script>alert('xss')</script>"`, React renders the literal text:

```html
<p>&lt;script&gt;alert('xss')&lt;/script&gt;</p>
```

The angle brackets are HTML-escaped. The script does not execute.

### All rendered user-data locations

| File | Line | Expression | Escaped by React? |
|------|------|------------|-------------------|
| `LetterCard.tsx:48` | `{letter.title}` | Yes |
| `LetterCard.tsx:53` | `{letter.recipient}` | Yes |
| `LetterCard.tsx:58` | `{letter.content}` | Yes |
| `LetterCard.tsx:63` | `{formatDate(letter.unlockDate)}` | Yes (output is a formatted string) |
| `LetterCard.tsx:66` | `{timeRemaining}` | Yes |
| `LetterCard.tsx:72` | `{formatDate(letter.createdAt)}` | Yes |

### What about `whitespace-pre-wrap`?

`LetterCard.tsx:58` uses `whitespace-pre-wrap` on the content paragraph. This is a CSS property that preserves whitespace and line breaks. It does NOT affect HTML parsing — React still escapes the content before inserting it as a text node. No XSS vector.

### What about `dangerouslySetInnerHTML`?

Not used anywhere in the codebase. Searched: zero matches.

### What about CSS injection?

Tailwind classes are hardcoded in JSX. User input never becomes a class name, style property, or CSS value. No vector.

### What about URLs?

No user-controlled URLs are rendered (`<a href>`, `<img src>`, etc.). No vector.

### What about localStorage manipulation?

A user could open devtools and write malicious data directly to localStorage:

```js
localStorage.setItem('time-locked-letters', JSON.stringify([{
  id: 'bad',
  title: '<img src=x onerror=alert(1)>',
  ...
}]))
```

But when this data is rendered by React, it's still escaped. React escapes the rendered output regardless of data origin (state, props, localStorage, API). **React's escaping is based on the rendering context, not the data source.**

### Edge case: corrupted JSON

If a user manually writes non-JSON to localStorage:

```
localStorage.setItem('time-locked-letters', 'not json')
```

`getLetters` (`storage.ts:6-11`) catches the `JSON.parse` error and returns `[]`. Graceful fallback.

### Edge case: prototype pollution

`JSON.parse` can create objects with `__proto__` keys, but since the parsed data is only rendered as text (never copied or merged unsafely), prototype pollution is not a vector here.

### Severity

**Low.** React's default escaping makes XSS from rendered content effectively impossible. No `dangerouslySetInnerHTML`, no URL injection, no CSS injection. The attack surface is limited to devtools access, which requires physical or already-compromised access.

### XSS summary

| Attack vector | Exploitable? | Reason |
|---------------|-------------|--------|
| `<script>` in title/content | No | React JSX escapes all text content |
| `onerror` / event handlers | No | Can't inject HTML attributes via text nodes |
| CSS injection | No | No user-controlled class/style values |
| URL injection | No | No user-controlled href/src rendered |
| `dangerouslySetInnerHTML` | N/A | Not used anywhere |

---

## 6. Principle Violations

### 6a. Single Source of Truth — Violated by optimistic updates

**Where:** `App.tsx:24-27`

```tsx
const handleWriteLetter = (letter: Letter) => {
    addLetter(letter)
    setLetters([...letters, letter])   // ← uses stale closure, doesn't re-read
    setShowForm(false)
}
```

**The violation:** After writing to localStorage, the code updates React state by appending to the **locally captured** `letters` array (the closure from the current render). It does not re-read from localStorage to confirm.

**Why it's wrong:** If another tab or effect modified localStorage between the last `getLetters()` call and this write, the local `letters` array is stale. The `setLetters` call overwrites the authoritative state with stale data.

**Concrete bug:**
1. Tab A loads: `getLetters()` → `[L1, L2]`
2. Tab B deletes L1: localStorage → `[L2]`
3. Tab A adds L3: `setLetters([L1, L2, L3])` — L1 reappears in Tab A's state
4. Tab A's next interval poll (up to 60s later): `getLetters()` → `[L2, L3]` — L1 disappears

For up to 60 seconds, Tab A shows a letter that was already deleted.

**Same pattern in delete handler** (`App.tsx:30-33`):

```tsx
const handleDeleteLetter = (id: string) => {
    deleteLetter(id)
    setLetters(letters.filter(letter => letter.id !== id))  // ← stale closure
}
```

**The fix:** Re-read after every write:

```tsx
const handleWriteLetter = (letter: Letter) => {
    addLetter(letter)
    setLetters(getLetters())    // ← read authoritative source
    setShowForm(false)
}
```

Or use the functional updater + cross-tab sync:

```tsx
// Add a 'storage' event listener for cross-tab sync
useEffect(() => {
    const onStorage = () => setLetters(getLetters())
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
}, [])
```

**Severity:** **Medium.** Bug only manifests with concurrent tab access. But the app already has a 60-second polling interval that eventually corrects the state.

---

### 6b. Single Source of Truth — Reaction to broken write

`App.tsx:25` calls `addLetter(letter)` which can throw (storage full, disabled). If it throws, `setLetters` and `setShowForm` on lines 26-27 never execute. The React state is never updated with the phantom letter. The form stays open.

This is **accidentally correct** — the exception prevents state divergence. But it's not intentional design. A future refactor that wraps `addLetter` in try/catch could introduce the divergence bug if the state update isn't also guarded.

---

### 6c. Lifting State Up — Unnecessary state variable

**Where:** `App.tsx:10`

```tsx
const [updateTrigger] = useState(0)
```

This state variable is never updated (no setter is destructured). It exists solely to provide a stable dependency for the `useEffect` at line 22:

```tsx
}, [updateTrigger])
```

Since `updateTrigger` never changes value (stays `0` forever), this is functionally identical to `[]`. The effect runs once on mount and never re-runs — exactly as intended.

**The violation:** An unnecessary state variable. `useState` is called but its setter is discarded. This creates a misleading impression that something can trigger re-runs.

**The fix:**

```tsx
useEffect(() => {
    const loadLetters = () => { setLetters(getLetters()) }
    loadLetters()
    const interval = setInterval(loadLetters, 60000)
    return () => clearInterval(interval)
}, [])
```

**Severity:** **Low.** No runtime bug. Code smell only.

---

### 6d. Side Effects Management — Unnecessary effect dependency on derived value

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

**The subtlety:** `isUnlocked` (line 33) is a **derived value** computed during render:

```tsx
const isUnlocked = new Date() >= new Date(letter.unlockDate)
```

It's listed as a dependency of the effect. But `isUnlocked` itself depends on `new Date()`, which isn't reactive. The only way `isUnlocked` changes between renders is if something else triggers a re-render (like `setTimeRemaining` from the interval callback).

**The circular flow:**
1. Effect starts interval
2. Interval fires → `setTimeRemaining` → re-render
3. On re-render, `isUnlocked` is recomputed
4. If unlock date passed, `isUnlocked` becomes `true`
5. Effect sees dep changed → cleanup old interval → early return new interval (no new interval)

**This works** but is fragile. If the interval never fires (e.g., component unmounts before the first tick), the effect's cleanup handles it. But the dependency on a non-reactive derived value is a conceptual flaw.

**A cleaner approach:** Check `isUnlocked` inside the interval callback instead:

```tsx
useEffect(() => {
    const interval = setInterval(() => {
        if (new Date() >= new Date(letter.unlockDate)) {
            setTimeRemaining('')
            clearInterval(interval)
            return
        }
        setTimeRemaining(getTimeRemaining(letter.unlockDate))
    }, 60000)
    return () => clearInterval(interval)
}, [letter.unlockDate])
```

Now the effect only depends on `letter.unlockDate` (the actual data), not on a derived value.

**Severity:** **Low.** Works in practice, but fragile and confusing.

---

### 6e. Immutability — Mutation in storage layer

**Where:** `storage.ts:16`

```tsx
export function addLetter(letter: Letter): void {
    const letters = getLetters()       // returns Letter[]
    letters.push(letter)               // ← mutates the array
    localStorage.setItem(STORAGE_KEY, JSON.stringify(letters))
}
```

`getLetters()` returns an array. `letters.push(letter)` mutates that array in place. The mutation is harmless because:
- The array is immediately serialized and stored.
- No other code holds a reference to that specific array instance.
- React state is not involved here.

**But** it violates the immutability principle that the rest of the codebase follows (see App.tsx line 26 `[...letters, letter]` and line 32 `letters.filter(...)`). If anyone later refactors `getLetters` to return a shared reference (e.g., a cache), this mutation would cause bugs.

**The fix:**

```tsx
export function addLetter(letter: Letter): void {
    const letters = getLetters()
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...letters, letter]))
}
```

**Severity:** **Low.** Not a bug now, but a future maintenance risk.

---

### 6f. Separation of Concerns — Business logic mixed into presentational component

**Where:** `LetterCard.tsx:9-43`

`LetterCard` contains:
- **Presentational logic:** The JSX card layout (lines 45-81)
- **Business logic:** `getTimeRemaining` (lines 9-23), `formatDate` (lines 25-29)
- **Side effect management:** The countdown interval `useEffect` (lines 35-43)

A purer separation would extract the time logic into a custom hook:

```tsx
// hooks/useCountdown.ts
function useCountdown(unlockDate: string) {
    const [remaining, setRemaining] = useState(getTimeRemaining(unlockDate))
    useEffect(() => {
        if (new Date() >= new Date(unlockDate)) return
        const interval = setInterval(() => {
            const r = getTimeRemaining(unlockDate)
            setRemaining(r)
            if (!r) clearInterval(interval)
        }, 60000)
        return () => clearInterval(interval)
    }, [unlockDate])
    return remaining
}
```

Then `LetterCard` becomes purely presentational:

```tsx
export function LetterCard({ letter, onDelete }: LetterCardProps) {
    const timeRemaining = useCountdown(letter.unlockDate)
    const isUnlocked = new Date() >= new Date(letter.unlockDate)
    // JSX only below
}
```

**Severity:** **Low.** Code works fine as-is. Violation is about testability and reusability.

---

### 6g. Unidirectional Data Flow — Ambient dependency on `new Date()`

**Where:** `LetterCard.tsx:33`

```tsx
const isUnlocked = new Date() >= new Date(letter.unlockDate)
```

This is computed during render and depends on the system clock — a global, mutable ambient value. Every render can produce a different result without any prop or state changing. This violates the principle that a component's output should be purely a function of its props and state.

**Why it matters:** React's `React.memo` optimization would fail here — the component could return different JSX for the same props because `new Date()` changed.

**Severity:** **Low.** No React.memo is used, so no concrete bug. But it's a conceptual impurity.

---

### 6h. Missing Cross-Tab Synchronization

**Where:** `App.tsx:13-22`

The app polls localStorage every 60 seconds for updates. But the browser provides a `storage` event that fires instantly when another tab modifies localStorage.

No `storage` event listener is registered. Cross-tab changes are only picked up after up to 60 seconds.

**The fix:**

```tsx
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
```

**Severity:** **Low-Medium.** The polling eventually catches up. But the delay is noticeable and the fix is trivial.

---

### 6i. No Content Validation

**Where:** `WriteLetterForm.tsx:19-21`

```tsx
const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim() || !recipient.trim() || !unlockDate) return
```

Only checks that fields are non-empty. No:
- **Max length** — content could be megabytes, causing localStorage quota issues
- **Character restrictions** — nothing prevents malicious or abusive input
- **Date sanity** — relies on HTML `min` attribute (bypassable via devtools)

**Severity:** **Low.** No direct security impact (React escapes output). But a user could fill localStorage with a single huge letter, then be unable to add more or delete it (delete also uses `setItem` which could fail if storage is full).

---

### 6j. Race Condition in Delete Handler

**Where:** `App.tsx:30-33`

```tsx
const handleDeleteLetter = (id: string) => {
    deleteLetter(id)
    setLetters(letters.filter(letter => letter.id !== id))
}
```

Uses the closure variable `letters`. If two deletes fire rapidly (unlikely but possible), the second delete uses the stale `letters` from the render where the first delete had not yet been applied.

**The fix — functional updater:**

```tsx
const handleDeleteLetter = (id: string) => {
    deleteLetter(id)
    setLetters(prev => prev.filter(letter => letter.id !== id))
}
```

Same for `handleWriteLetter`:

```tsx
const handleWriteLetter = (letter: Letter) => {
    addLetter(letter)
    setLetters(prev => [...prev, letter])
    setShowForm(false)
}
```

**Severity:** **Low.** Requires rapid clicks to trigger. But the functional updater is the idiomatic React pattern for exactly this reason.

---

## 7. Additional Edge Cases

### 7a. Timezone Off-by-One in `minDate`

**Where:** `WriteLetterForm.tsx:15-17`

```tsx
const minDate = new Date()
minDate.setDate(minDate.getDate() + 1)
const minDateStr = minDate.toISOString().slice(0, 10)
```

**The bug:** `toISOString()` returns the date in **UTC**. The `min` attribute of `<input type="date">` is interpreted in the **local timezone**. Near midnight, this causes a mismatch:

| Local time (UTC+5) | Local date | `minDate + 1 day` local | `toISOString()` (UTC) | Browser interprets `min` as local | User can pick today? |
|---|---|---|---|---|---|
| May 13, 11:30 PM | May 13 | May 14 | `2026-05-13T18:30:00Z` → `"2026-05-13"` | May 13 | YES — bug! |
| May 13, 12:30 AM | May 13 | May 14 | `2026-05-13T19:30:00Z` → `"2026-05-13"` | May 13 | YES — bug! |

In both cases, the user can pick "today" because the UTC date is a day behind the local date.

**The fix:** Format the date using local timezone methods:

```tsx
const minDate = new Date()
minDate.setDate(minDate.getDate() + 1)
const minDateStr = [
    minDate.getFullYear(),
    String(minDate.getMonth() + 1).padStart(2, '0'),
    String(minDate.getDate()).padStart(2, '0'),
].join('-')
```

**Severity:** **Medium.** A user near midnight UTC- can set an unlock date of "today" instead of "tomorrow."

---

### 7b. No `crypto.randomUUID()` Fallback

**Where:** `WriteLetterForm.tsx:24`

```tsx
id: crypto.randomUUID(),
```

`crypto.randomUUID()` is available in:
- Chrome 92+ (August 2021)
- Firefox 95+ (December 2021)
- Safari 15.4+ (March 2022)

Older browsers will throw `TypeError: crypto.randomUUID is not a function`. No fallback is provided.

**The fix:**

```tsx
id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
```

Or install a polyfill. Or rely on the Vite build target to handle it (check `tsconfig` — target is `es2023`, which implies modern browser support).

**Severity:** **Low.** The `tsconfig.app.json` target is `es2023`, and Vite's default build target expects modern browsers. Users on truly old browsers will have other issues.

---

### 7c. No Error Boundary

If any component throws during render (e.g., from a corrupted letter object with missing fields), the entire React tree unmounts and the user sees a blank white page.

**The fix:** Wrap the app in an error boundary:

```tsx
class ErrorBoundary extends React.Component {
    state = { hasError: false }
    static getDerivedStateFromError() { return { hasError: true } }
    render() {
        return this.state.hasError
            ? <div className="...">Something went wrong. Reload the page.</div>
            : this.props.children
    }
}
```

**Severity:** **Low.** Requires corrupt data to trigger. But the recovery UX is terrible (blank page).

---

## Summary

### Security

| Issue | Severity | Exploitable? |
|-------|----------|-------------|
| XSS via rendered content | Low | No — React JSX escapes all text |
| XSS via dangerouslySetInnerHTML | None | Not used |
| XSS via URL injection | None | No user-controlled URLs rendered |
| localStorage manipulation | Low | Requires devtools access |

### Edge Cases

| Issue | Severity | Fix exists? |
|-------|----------|------------|
| localStorage full — write fails silently | Medium | Add try/catch + user feedback |
| localStorage disabled — write fails silently | Medium | Same fix |
| System clock manipulation | High (intent) / Low (impact) | Cannot fix without server |
| Same-minute unlock transition delay | Low | Acceptable (max 60s delay) |
| Timezone bug in `minDate` | Medium | Use local-time formatting |
| No `crypto.randomUUID()` fallback | Low | Add fallback or accept modern-browser-only |
| No error boundary | Low | Add one |

### Principle Violations

| Principle | Violation | Severity |
|-----------|-----------|----------|
| Single Source of Truth | Optimistic updates don't re-read from localStorage | Medium |
| Lifting State Up | Unnecessary `useState(0)` for effect dependency | Low |
| Side Effects Management | Effect depends on non-reactive derived value | Low |
| Immutability | `push()` mutation in `storage.ts:16` | Low |
| Separation of Concerns | Business logic mixed into presentational component | Low |
| Unidirectional Data Flow | Component output depends on `new Date()` (ambient global) | Low |
| Cross-Tab Sync | No `storage` event listener, relies solely on polling | Low-Medium |
| Content Validation | No max lengths, no server-side validation | Low |
| Race Condition | Delete/write handlers use stale closures | Low |
