# Tinker Log — 1-Minute Unlock

**Date:** 2026-05-14  
**Task:** Create a letter that unlocks 1 minute from now. Predict what the code does. Watch it happen. Document any gap.

---

## The Prediction

> "The code will check if the current date is greater than or equal to the unlock date set and it will unlock."

Correct — but it turns out "unlock" happens in two steps, not one.

---

## What Was Predicted

Imagine the letter card has a little watchman sitting inside it. Every second, the watchman checks his watch and asks: *"Is it time yet?"* The moment the answer is yes, he opens the envelope — the lock icon flips to 🔓, the countdown disappears, and the letter becomes readable.

That part was predicted correctly.

What the prediction missed: the **section header** — the bit that says "SEALED" or "OPENED" at the top — has a *different* watchman. This one is lazier. He only checks every 60 seconds. So even after the first watchman has already opened the envelope, the lazy one hasn't noticed yet. The card sits there looking fully open, but the heading above it still says "SEALED."

---

## What Actually Happened (Timeline)

| Time | What you see |
|---|---|
| 0s | Letter created, countdown starts (e.g. `59s remaining`) |
| ~55s | Card goes red and starts pulsing — almost time |
| ~60s | Card unlocks: 🔓, letter body visible, countdown gone |
| 60s – 110s | Card looks open. Section header still says **SEALED**. Both are on screen at the same time. |
| ~110s | Section header updates. Card moves to **OPENED**. Everything agrees now. |

---

## The Gap

The prediction said it would unlock. It did.

What it didn't say: the card and the section header use different clocks. The card checks every second. The section header checks every 60 seconds. So for up to a minute, the card has already opened but the heading hasn't caught up yet.

It's like a referee who blows the final whistle — the players know the game is over, but the scoreboard operator is on a coffee break and updates it a minute later. The result is the same. Just not at the same time.

---

## Does It Matter?

Not really. You can read the letter the moment it unlocks. The section reorganisation is just cosmetic. But if it bothered you, the fix is simple: make the section header check more often — every few seconds instead of every 60.
