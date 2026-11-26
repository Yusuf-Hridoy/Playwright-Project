# AI exploratory testing

A scripted test only ever finds the thing it was written to find. An
exploratory session is the other half: a person, or an agent with a browser,
goes looking for the things nobody thought to write down.

This page is how to run one against Tradeloom using the Playwright MCP server
and Claude Code.

## What an exploratory session is

You pick one small area of the app, give yourself a time box, and poke at it
with a goal in mind. You are not following steps. You are asking "what happens
if…" and writing down the answers.

Three rules, and they matter:

- **A session writes notes, never code.** No test file, no page object, no edit
  to anything in this repo. The output is one Markdown file.
- **A session is time boxed.** Twenty minutes. When the timer is up, write the
  notes and stop, even mid-thought.
- **A finding is not a bug yet.** It is something surprising. Deciding whether
  it is a bug, a test gap or working-as-intended is a separate, slower job.

## How to start one in Claude Code

1. The Playwright MCP server is already configured in
   [`.mcp.json`](../.mcp.json), pinned to an exact version. Claude Code starts
   it for you.
2. Open Claude Code in this repository and check the server is there:

   ```
   /mcp
   ```

   You should see `playwright` in the list. If it says it needs approving,
   approve it.

3. Give Claude the mission. Paste one of the three below, as it is written.
4. Watch. The browser opens, Claude navigates, and it reports what it sees.
   Interrupt it whenever you want to send it somewhere else.
5. When the time box is up, ask it to write the notes:

   ```
   Write the notes for this session to exploratory-notes/<today>-<mission>.md,
   in the format in exploratory-notes/README.md. Do not change any other file.
   ```

Logging in: the demo accounts are on the log in page itself, and the
**Use** button fills the form for you. `trader@tradeloom.test` owns stock and
has money; `newbie@tradeloom.test` owns nothing and has $10,000. The password
for all three is `Play123!`.

---

## Mission 1 — Wallet and payments, on a slow app

**Goal:** find out what the Wallet and the card form do while the app is still
thinking. Double submits, a cancel mid-payment, a figure that updates twice, a
button that stays enabled when it should not.

**Time box:** 20 minutes.

**Open:** <https://practiceapp-six.vercel.app/wallet?slow=3000&seed=42>

`slow=3000` makes every data load in the app wait three seconds, which is long
enough to click things you were never meant to be able to click.

**Log in as:** `newbie@tradeloom.test` — $10,000 and no history, so the
numbers are easy to follow.

**Look for:**

- Press **Add** twice quickly. Does the card step open twice? Does the money
  arrive twice?
- Open the card step, then press **Cancel** while "Processing…" is on screen.
- Pay with `4242 4242 4242 4242`, and while it processes, use the top menu to
  leave for the Portfolio and come back.
- Reload the page in the middle of a payment.
- Does the cash in the top menu ever disagree with the cash on the page?
- Does anything show a figure before the prices have loaded, other than `-`?
- The browser Back button, from the card step.

---

## Mission 2 — Watchlist drag, alerts and the keyboard, on a moved layout

**Goal:** find out whether the watchlist can be used without a mouse, and
whether anything breaks when the page is laid out differently.

**Time box:** 20 minutes.

**Open:** <https://practiceapp-six.vercel.app/watchlist?drift=layout&seed=42>

`drift=layout` moves three parts of the page, the way a redesign would. The
alert editor ends up somewhere else.

**Log in as:** `trader@tradeloom.test` — four stocks watched and a NOVA alert
already waiting at $55.00.

**Look for:**

- Tab through the whole page. Can you reach every control? Does the focus ring
  ever disappear? Does the order make sense after the layout moved?
- Move a row with **ArrowUp** and **ArrowDown** on its drag handle. Does the
  announcement say the right position? Does the order survive a reload?
- Drag a row with the mouse, and drop it outside the list.
- Press **/** — does it jump to the stock picker? And while you are typing in a
  field, does it stay out of the way?
- Open the alert editor, then press **Esc**. Then open it and reload instead.
- Set an alert on a stock that already has one. What happens to the old one?
- Add a seventh stock to a full list.

---

## Mission 3 — The profile form, with unusual input

**Goal:** find out where the details form and the photo upload give way.

**Time box:** 20 minutes.

**Open:** <https://practiceapp-six.vercel.app/profile?seed=42>

**Log in as:** `trader@tradeloom.test`.

**Look for:**

- A display name of 500 characters. Then one of exactly 30, and exactly 31.
- A name that is only spaces. A name that is only emoji. A name with an emoji
  in the middle of ordinary letters. Where does the menu put the initials?
- A date of birth of `1900-01-01`. Then today's date. Then today minus exactly
  18 years, and one day short of it. Then `0001-01-01`, and a year with five
  digits.
- Pick four sectors when three is the limit.
- Upload a 5 MB photo. Then a `.png` that is really a text file. Then a real
  photo renamed to `.txt`. Then an SVG.
- Drop two photos at once. Drop a folder.
- Change one field, then use the top menu to leave. Does it warn? Does **Undo**
  put back exactly what was saved?
- Save, then reload. Save, then open the page in a second tab.

---

## Writing the notes

One file per session, at
`exploratory-notes/<date>-<mission>.md`, for example
`exploratory-notes/2026-11-25-wallet-payments.md`. The format is in
[`exploratory-notes/README.md`](../exploratory-notes/README.md).

Nothing else in the repository changes during a session. A finding that turns
out to be worth a test becomes a test later, as ordinary work, following
[AGENTS.md](../AGENTS.md).
