# REQ-PROFILE-05 — details are saved in this browser only

> **Requirement:** Your details are saved in this browser only, so a new
> browser starts fresh.
>
> Explored on the live app at <https://practiceapp-six.vercel.app> with the
> Playwright MCP browser on 2026-11-25. See
> [docs/ai-agents-walkthrough.md](../docs/ai-agents-walkthrough.md) for how
> this plan was produced and what was changed in it by hand.

## What the app actually does

Found by reading the Profile page and the browser's own storage:

- The Profile page says so itself, under the details form:
  _"Your details stay in this browser only."_ It is a plain paragraph with no
  test id.
- The saved details live in `localStorage` under
  `tradeloom.profile.<email>` — one key per account, per browser.
- With no such key, the Profile page falls back to the account's demo details:
  the newbie opens with the display name **Newbie**, no date of birth, no
  country, no sectors, every email box clear and the dark theme.
- Nothing is sent anywhere. There is no network request when Save is pressed,
  so a second browser cannot learn what the first one saved.

### 1. A second browser

**Seed:** `tests/seed.spec.ts`

#### 1.1 Details saved in one browser do not reach another

**Steps:**

1. In the first browser, log in as the trader and open the Profile page.
2. Change the display name and pick the Light theme. Save.
3. Check it saved: the message shows, the menu initials change, the page is
   painted light.
4. Open a **second browser** with its own storage, log in as the same trader
   and open the Profile page.
5. Read the display name, the theme and the page the second browser is painted.
6. Go back to the first browser and read the Profile page again.

**Expected Results:**

- The second browser shows the display name the account starts with, not the
  saved one.
- The second browser is painted with the theme the account starts with.
- The Profile page says, in both, that the details stay in this browser only.
- The first browser still shows what it saved, so the second browser's fresh
  start did not undo it.

#### 1.2 A different account in the same browser also starts fresh (dropped)

Dropped by hand. It is true, and the key name shows why, but it is about one
account not seeing another's details, which is not what this requirement
promises. The requirement is about the browser, not the account.

#### 1.3 Clearing site data resets the profile (dropped)

Dropped by hand: it is the same mechanism as 1.1 with a worse way of showing
it, and it tests the browser rather than the app.
