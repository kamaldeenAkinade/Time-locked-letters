# Lie Detector

Five statements about the codebase. Four are true. One is a lie. Find it.

---

1. The countdown timer in `LetterCard.tsx` runs on a 1-second `setInterval`, and its `useEffect` lists only `letter.unlockDate` as a dependency — not the derived `isUnlocked` value that caused fragility in the original code.

2. The content field in `WriteLetterForm` enforces a 50,000-character limit, matching the audit's recommendation to prevent localStorage quota exhaustion.

3. When `addLetter` returns `false`, `handleWriteLetter` in `App.tsx` never calls `setLetters` — the form stays open, a toast error fires, and React state remains in sync with what's actually in localStorage.

4. The `storage` event listener registered on `window` in `App.tsx` means a write or delete in one browser tab is reflected immediately in any other open tab, without waiting for the 60-second polling interval.

5. A locked card enters a visually distinct urgent state — a red accent bar with an animated pulse and a ⚡ icon — when the countdown drops below 60 seconds, specifically when the display string contains only seconds and no minutes component.

---

## Your Answer

> The lie is #2. The character limit set on content is 10,000 and not 50,000.

**Correct.** 🎯

## Explanation

Statement #2 is the lie — and it was crafted to be plausible because the audit document (`04-cross-check.md`) *does* recommend 50,000 characters:

> "Letter must be ≤50,000 chars"

But the actual implementation in `WriteLetterForm.tsx` sets:

```ts
const LIMITS = { title: 100, recipient: 50, content: 10000 }
```

The lie was designed to trap someone who read the audit but didn't cross-check the code. The recommendation and the implementation diverge — the code went with 10,000 (10KB), not the 50,000 the audit suggested.

**The other four statements are all verifiable truths:**

- **#1** — `useEffect` in `LetterCard.tsx` has `[letter.unlockDate]` as its sole dependency and a `setInterval` of `1000`ms.
- **#3** — `handleWriteLetter` only calls `setLetters(getLetters())` and `setShowForm(false)` inside the `if (saved)` branch.
- **#4** — `window.addEventListener('storage', loadLetters)` is registered in the `useEffect` in `App.tsx` alongside the 60-second interval.
- **#5** — `isUrgent` is true when `remainingMs < 60_000`, and the card renders a red pulsing bar and `⚡` icon when that flag is set. *(Note: statement #5 described the old string-parsing implementation — the bloat cleanup replaced it with a direct timestamp comparison, but the visible behaviour is identical.)*
