# What Tradeloom promises

Every rule the app says it follows, one short sentence each, with an ID.

The source is the app's own [Rules page](https://practiceapp-six.vercel.app/rules),
the pages themselves, and the test switches the Rules page lists.

Every test in this repo carries at least one of these IDs as a tag, like
`@REQ-TRADE-01`. `npm run coverage:requirements` turns those tags into
[the coverage table](requirements-coverage.md), and `npm run check:tags` fails
when a test uses an ID that is not on this page.

A requirement with no test yet is allowed. It shows up under "Not covered yet"
in the coverage table, which is the point of writing it down.

## Logging in and sessions

| ID          | Requirement                                                                                                      | Area     |
| ----------- | ---------------------------------------------------------------------------------------------------------------- | -------- |
| REQ-AUTH-01 | A demo account with the right email and password logs in and lands on the Market page with its cash in the menu. | REQ-AUTH |
| REQ-AUTH-02 | A log in that is wrong or incomplete is refused, and the log in page stays put.                                  | REQ-AUTH |
| REQ-AUTH-03 | Pages that need a session send you to log in, then back.                                                         | REQ-AUTH |

## The market

| ID            | Requirement                                                                                        | Area       |
| ------------- | -------------------------------------------------------------------------------------------------- | ---------- |
| REQ-MARKET-01 | The Market page lists exactly the stocks the server sent, with the shares you own beside each one. | REQ-MARKET |
| REQ-MARKET-02 | Search and the filters leave only the stocks that match, and say so when none do.                  | REQ-MARKET |
| REQ-MARKET-03 | The same seed and the same moment give the same prices after a reload.                             | REQ-MARKET |
| REQ-MARKET-04 | Prices that will not load say so, and Try again brings them back.                                  | REQ-MARKET |

## Buying and selling

| ID           | Requirement                                                                  | Area      |
| ------------ | ---------------------------------------------------------------------------- | --------- |
| REQ-TRADE-01 | Buying takes shares x price from cash.                                       | REQ-TRADE |
| REQ-TRADE-02 | A buy you cannot afford is refused, and the app says the most you can buy.   | REQ-TRADE |
| REQ-TRADE-03 | Shares are whole numbers, 1 or more.                                         | REQ-TRADE |
| REQ-TRADE-04 | Selling gives shares x today's price, and you cannot sell more than you own. | REQ-TRADE |
| REQ-TRADE-05 | A closed market blocks buying and selling and leaves the cash alone.         | REQ-TRADE |

## The portfolio

| ID               | Requirement                                                                     | Area          |
| ---------------- | ------------------------------------------------------------------------------- | ------------- |
| REQ-PORTFOLIO-01 | Total worth is the cash plus every holding at today's price.                    | REQ-PORTFOLIO |
| REQ-PORTFOLIO-02 | Gain is worth now minus what you paid, and Sort by gain puts the biggest first. | REQ-PORTFOLIO |
| REQ-PORTFOLIO-03 | An account that owns nothing is told there is nothing to show yet.              | REQ-PORTFOLIO |
| REQ-PORTFOLIO-04 | Buying the same stock more than once values it at the average of what you paid. | REQ-PORTFOLIO |

## The wallet

| ID            | Requirement                                                  | Area       |
| ------------- | ------------------------------------------------------------ | ---------- |
| REQ-WALLET-01 | Every account starts with $10,000.                           | REQ-WALLET |
| REQ-WALLET-02 | Top-ups stop at $50,000 in total.                            | REQ-WALLET |
| REQ-WALLET-03 | Start over puts the account back to the money it began with. | REQ-WALLET |
| REQ-WALLET-04 | The history downloads as a CSV named after today in Dhaka.   | REQ-WALLET |

## Paying by card

| ID         | Requirement                                                                                                            | Area    |
| ---------- | ---------------------------------------------------------------------------------------------------------------------- | ------- |
| REQ-PAY-01 | Adding money needs a test card in the payment frame, and two seconds later the money shows everywhere.                 | REQ-PAY |
| REQ-PAY-02 | A declined card, a card with no funds, and a card the app does not know each add nothing and say why.                  | REQ-PAY |
| REQ-PAY-03 | Every card field is checked before the payment is sent.                                                                | REQ-PAY |
| REQ-PAY-04 | An amount over the limit never opens the card form, Cancel adds nothing, and the Wallet listens only to its own frame. | REQ-PAY |

## The history and receipts

| ID             | Requirement                                                                              | Area        |
| -------------- | ---------------------------------------------------------------------------------------- | ----------- |
| REQ-HISTORY-01 | The history shows ten rows a page, and the type and date filters narrow it.              | REQ-HISTORY |
| REQ-HISTORY-02 | The filter and the page are in the link, and Back walks back through them.               | REQ-HISTORY |
| REQ-HISTORY-03 | The CSV holds every filtered row, not just the page on screen.                           | REQ-HISTORY |
| REQ-HISTORY-04 | Open on a row opens its receipt in a new tab, and a receipt that does not exist says so. | REQ-HISTORY |

## The watchlist and price alerts

| ID           | Requirement                                                                                                                          | Area      |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| REQ-WATCH-01 | A watchlist holds up to six stocks, and a seventh is refused.                                                                        | REQ-WATCH |
| REQ-WATCH-02 | The saved order survives a reload, and the mouse, the keyboard and the / shortcut all work on it.                                    | REQ-WATCH |
| REQ-WATCH-03 | One alert per stock: it fires once when the price crosses it, then shows Hit, and the editor refuses an alert that could never fire. | REQ-WATCH |
| REQ-WATCH-04 | The star on the Market page adds and removes a stock, and browser alerts say whether they are on, off or blocked.                    | REQ-WATCH |

## The profile

| ID             | Requirement                                                                                                                                   | Area        |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| REQ-PROFILE-01 | A profile photo is PNG, JPG or WebP, up to 1 MB, and one at a time.                                                                           | REQ-PROFILE |
| REQ-PROFILE-02 | The details form checks the display name, the date of birth and the sectors, you must be 18 or older, and leaving with unsaved changes warns. | REQ-PROFILE |
| REQ-PROFILE-03 | The theme is saved for the account, and Match my device follows the device.                                                                   | REQ-PROFILE |
| REQ-PROFILE-04 | Copy account ID puts the ID on the clipboard, and offers it another way when it cannot.                                                       | REQ-PROFILE |
| REQ-PROFILE-05 | Your details are saved in this browser only, so a new browser starts fresh.                                                                   | REQ-PROFILE |

## News

| ID          | Requirement                                                                                                                         | Area     |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------- | -------- |
| REQ-NEWS-01 | The news box shows the three newest headlines, Hide and Show are remembered, and a headline opens its own item on the News page.    | REQ-NEWS |
| REQ-NEWS-02 | The News page loads ten headlines at a time until all 60 are shown, then says so, and the stock filter writes itself into the link. | REQ-NEWS |
| REQ-NEWS-03 | The same seed gives the same headlines in the same order.                                                                           | REQ-NEWS |

## The chart, going offline and sitting idle

| ID          | Requirement                                                                                         | Area     |
| ----------- | --------------------------------------------------------------------------------------------------- | -------- |
| REQ-LIVE-01 | The price chart shows a time and a price under the pointer, and the arrow keys walk the same point. | REQ-LIVE |
| REQ-LIVE-02 | Going offline shows a banner and blocks a buy; coming back online says so.                          | REQ-LIVE |
| REQ-LIVE-03 | Fourteen idle minutes warns with a countdown, and fifteen logs you out.                             | REQ-LIVE |

## Reachable and unchanged

| ID          | Requirement                                                                      | Area     |
| ----------- | -------------------------------------------------------------------------------- | -------- |
| REQ-A11Y-01 | No page has a serious accessibility problem.                                     | REQ-A11Y |
| REQ-A11Y-02 | No page scrolls sideways on a phone, and the main journeys work at phone size.   | REQ-A11Y |
| REQ-A11Y-03 | The log in, Rules and Market pages look the way their baseline says they should. | REQ-A11Y |

## The test switches

| ID            | Requirement                                                                                                 | Area       |
| ------------- | ----------------------------------------------------------------------------------------------------------- | ---------- |
| REQ-SWITCH-01 | `?bug=` turns the app's five known bugs on, and the everyday checks catch each one.                         | REQ-SWITCH |
| REQ-SWITCH-02 | `?drift=` renames labels, changes test ids, moves parts and shows popups, and the main journeys still pass. | REQ-SWITCH |
| REQ-SWITCH-03 | `?slow=` makes every data load wait, and the tests wait for it instead of failing.                          | REQ-SWITCH |
| REQ-SWITCH-04 | `?flaky=on` drops some loads, decided by the seed, so the same seed gives the same failures.                | REQ-SWITCH |
