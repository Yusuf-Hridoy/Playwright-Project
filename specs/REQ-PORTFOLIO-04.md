# REQ-PORTFOLIO-04 — average cost of a stock bought more than once

> **Requirement:** Buying the same stock more than once values it at the
> average of what you paid.
>
> Explored on the live app at <https://practiceapp-six.vercel.app> with the
> Playwright MCP browser on 2026-11-25. See
> [docs/ai-agents-walkthrough.md](../docs/ai-agents-walkthrough.md) for how
> this plan was produced and what was changed in it by hand.

## What the app actually does

Found by buying 5 more KRYL on top of the 5 the trader already owns:

- The Stock page has a **Today** panel with `You own` (`fact-owned`),
  `You paid on average` (`fact-avg-paid`) and `Your gain on KRYL`
  (`fact-gain`). Each money figure carries the exact amount in `data-cents`.
- Before the second buy: 5 shares, `fact-avg-paid` = `14072`
  (= 70360 ÷ 5, the trader's starting KRYL holding).
- After buying 5 more at $136.65: the stored holding became
  `{ shares: 10, totalPaidCents: 138685 }` and `fact-avg-paid` read `13869`,
  which is `Math.round(138685 / 10)`. So the average is recomputed from the
  running total, not kept as a mean of means, and it rounds to the nearest
  cent.
- The app re-quotes the price between pressing Buy and confirming. On the live
  app the price moved; under the suite's frozen clock it cannot, so the
  quoted total and the charged total are the same figure.

### 1. Average cost after a second buy

**Seed:** `tests/seed.spec.ts`

#### 1.1 A second buy values the holding at the average of both prices

**Steps:**

1. Start as the trader, owning only KRYL: 5 shares for $703.60 in all.
2. Open the KRYL stock page.
3. Read `You own` and `You paid on average`.
4. Enter 5 shares on the Buy tab and read the quoted total cost.
5. Press Buy and confirm.
6. Read `You own` and `You paid on average` again.
7. Open the Portfolio page and read the KRYL row.

**Expected Results:**

- Before the buy, `You own` reads `5 shares` and `You paid on average` is
  $703.60 ÷ 5 to the nearest cent.
- After the buy, `You own` reads `10 shares`.
- `You paid on average` is `(70360 + the total that was charged) ÷ 10`, to the
  nearest cent — not the price of either buy on its own.
- The Portfolio's KRYL gain is `10 × today's price − (70360 + the total
charged)`, which is the same average seen from the other side.
- The cash left is the cash before minus the total charged.

#### 1.2 Buying at a lower price pulls the average down (dropped)

Dropped by hand. Under the frozen clock both buys are at the same price, so
there is no second price to average in, and unfreezing the clock to get one
would make the figures different on every run. 1.1 already proves the average
is computed from the running total rather than from the last price paid.

#### 1.3 Selling leaves the average alone (dropped)

Dropped by hand: that is REQ-TRADE-04's ground, and `tests/trading/sell.spec.ts`
already covers selling.
