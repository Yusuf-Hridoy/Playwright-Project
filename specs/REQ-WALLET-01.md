# REQ-WALLET-01 — every account starts with $10,000

> **Requirement:** Every account starts with $10,000.
>
> Explored on the live app at <https://practiceapp-six.vercel.app> with the
> Playwright MCP browser on 2026-11-25. See
> [docs/ai-agents-walkthrough.md](../docs/ai-agents-walkthrough.md) for how
> this plan was produced and what was changed in it by hand.

## What the app actually does

Found by clearing storage and logging in as the newbie:

- The Wallet's cash figure (`wallet-cash`) and the top menu's cash
  (`menu-cash`) both read `$10,000.00` with `data-cents="1000000"`.
- The history has exactly one row, `data-type="start"`, whose What column reads
  **Starting money** and whose amount cell carries `data-cents="1000000"`.
- The top-up meter is a `<progress data-testid="add-progress" max="5000000"
value="1000000">`, labelled **Added so far $10,000.00 of $50,000**. So the
  starting money counts against the $50,000 add limit, which is what makes this
  requirement and REQ-WALLET-02 two halves of the same figure.
- The log in page says the same thing in its own words: _"Start with $10,000 of
  fake money"_, and the newbie's demo card reads _"$10,000 cash, owns nothing
  yet"_.

### 1. A brand new account

**Seed:** `tests/seed.spec.ts`

#### 1.1 A brand new account has $10,000 and one starting row

**Steps:**

1. Log in as the newbie, who has never traded. Write no state of our own, so
   the app seeds the account itself.
2. Open the Wallet page.
3. Read the cash figure and the cash in the top menu.
4. Read the history table.
5. Read the top-up meter.

**Expected Results:**

- The Wallet cash and the menu cash are both $10,000.00, and both carry
  `data-cents="1000000"`.
- There is exactly one history row, and it is a `start` row.
- Its What column reads **Starting money** and its amount is $10,000.00 exactly.
- The meter's `max` is the $50,000 add limit and its `value` is the $10,000 the
  account started with.
- The Portfolio shows nothing owned, so the whole $10,000 is still cash.

#### 1.2 The other two accounts also started with $10,000 (dropped)

Dropped by hand. The trader and the busy account have traded and topped up, so
the only trace of their start is the first row of their history — which is
`data/demo-accounts.ts` copied back out of the app, not the app computing
anything. Asserting it would be a test of our own test data.

#### 1.3 Start over puts the $10,000 back (dropped)

Dropped by hand: that is REQ-WALLET-03, already covered by
`tests/wallet/wallet.spec.ts`.
