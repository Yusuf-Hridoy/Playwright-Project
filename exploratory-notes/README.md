# Exploratory session notes

One file per session, named `<date>-<mission>.md`, for example
`2026-11-25-wallet-payments.md`.

A session writes notes and nothing else. No test file, no page object, no
change to anything else in this repository. [The exploratory testing
guide](../docs/exploratory-testing-guide.md) has the three ready missions and
how to start one.

## The format

Copy this.

```markdown
# <Mission> — <date>

- **Who / what:** Claude Code with the Playwright MCP server, or a person
- **Time box:** 20 minutes, 14:05–14:25 Dhaka
- **App:** https://practiceapp-six.vercel.app/wallet?slow=3000&seed=42
- **Logged in as:** newbie@tradeloom.test

## What was tried

A list, in the order it happened. One line each, plain words.

- Pressed Add twice in under a second.
- Cancelled while "Processing…" was on screen.
- Reloaded mid-payment.

## What was found

One heading per finding. Say what you did, what you expected, what happened.
Anything that is only a hunch, say so.

### Add can be pressed twice before the card step opens

Steps: pick $1,000, press Add, press Add again within a second.
Expected: one card step.
Happened: the card step opened and the amount line said "Paying $1,000" twice.
Seen: 3 times out of 3.

## What should become something

Say which of the findings is worth more work, and what kind.

| Finding                     | Bug note or test? | Why                                   |
| --------------------------- | ----------------- | ------------------------------------- |
| Add pressed twice           | Bug note          | Real money path, happens every time   |
| Focus ring on the drag grip | Test              | Keyboard path, cheap to cover         |
| Emoji in the display name   | Neither           | Works; the menu falls back to letters |

## Not looked at

What the time box cut off, so the next session knows where to start.
```

## What the three columns mean

- **Bug note** — the app looks wrong. Write it up for the app's own
  repository. Nothing in this repo changes.
- **Test** — the app looks right, but nothing here would have noticed if it
  stopped being right. Write the test later, as ordinary work, following
  [AGENTS.md](../AGENTS.md).
- **Neither** — surprising, not wrong. Worth having written down anyway.
