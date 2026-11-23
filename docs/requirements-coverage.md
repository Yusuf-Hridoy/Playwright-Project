# Which tests cover which requirement

<!-- Written by scripts/requirements-coverage.mjs. Do not edit by hand. -->

**47 of 50 requirements covered**, by 130 tests.

Every requirement is in [requirements.md](requirements.md). Regenerate this page
with `npm run coverage:requirements`.

## REQ-AUTH

| ID | Tests | Covered by |
| --- | --- | --- |
| REQ-AUTH-01 | 3 | Logging in > trader logs in and lands on the market with their cash in the menu<br>Logging in > Use fills in a demo account without logging anyone in<br>A signed-out visitor, on a drifted app > logs in and lands on the Market page |
| REQ-AUTH-02 | 2 | Logging in > a wrong password is refused and the log in page stays put<br>Logging in > empty fields are refused before anything is sent |
| REQ-AUTH-03 | 3 | Sessions > the portfolio asks for a log in first, then opens by itself<br>Sessions > after logging out > log out returns to the log in page and the market needs a log in again<br>A trader on a drifted app > logs out and lands back on the log in page |

## REQ-MARKET

| ID | Tests | Covered by |
| --- | --- | --- |
| REQ-MARKET-01 | 3 | The market, seen by someone who owns stocks > lists all eight stocks and the shares the trader owns<br>When the server sends a shorter list > the Market page shows exactly the stocks it was sent<br>An app that takes three seconds over everything > the Market page shows it is loading, then shows all eight stocks |
| REQ-MARKET-02 | 4 | The market, seen by someone who owns stocks > searching for "robot" leaves only Kryl Robotics<br>The market, seen by someone who owns nothing > the "I own" filter says there is nothing to show<br>bug=search: the search box insists on the exact letter case > searching "kryl" in lower case is caught by the search check<br>A trader on a drifted app > searches for a stock and opens its page |
| REQ-MARKET-03 | 1 | The market, seen by someone who owns stocks > the same seed and the same time give the same prices after a reload |
| REQ-MARKET-04 | 4 | When the price list will not load > the Market page says so, and Try again brings the stocks back<br>When the price list will not load > the Stock page shows the same load error<br>While the price list is on its way > the grey loading rows show first, and the real rows take their place<br>An app that drops the odd request > a load that fails says so, and "Try again" brings the stocks back |

## REQ-TRADE

| ID | Tests | Covered by |
| --- | --- | --- |
| REQ-TRADE-01 | 5 | Buying while the market is open > buying 5 KRYL takes the same cash in the summary, the message and the menu<br>Trading on a phone > logging in and buying one KRYL works at phone size<br>bug=cost: the total charges for one share too many > buying 2 KRYL is caught by the buy total check<br>A trader on a drifted app > buys one KRYL and the menu cash drops by the price<br>An app that takes three seconds over everything > buying one KRYL still works from end to end |
| REQ-TRADE-02 | 1 | Buying while the market is open > a trader with $500 is told the most they can buy |
| REQ-TRADE-03 | 1 | Buying while the market is open > half a share is refused with the whole number rule |
| REQ-TRADE-04 | 3 | Selling > selling more shares than you own is refused<br>Selling > selling every LUMA share takes the stock off the portfolio<br>A trader on a drifted app > sells one LUMA and the menu cash goes up by the price |
| REQ-TRADE-05 | 2 | The market with the closed switch on the link > a closed market says so in the banner and in the menu<br>Buying with the closed switch on the link > a closed market blocks the trade and leaves the cash alone |

## REQ-PORTFOLIO

| ID | Tests | Covered by |
| --- | --- | --- |
| REQ-PORTFOLIO-01 | 5 | A portfolio with stocks in it > total worth is the cash plus every holding at today price<br>Selling > selling every LUMA share takes the stock off the portfolio<br>A trader on a drifted app > walks to Portfolio and Wallet through the top menu<br>A trader on a drifted app > sees LUMA in the portfolio with the right number of shares<br>An app that takes three seconds over everything > the Portfolio page shows the trader's holdings |
| REQ-PORTFOLIO-02 | 3 | Sorting a portfolio > "Sort by gain" puts the biggest gain at the top<br>bug=gain: every gain is shown with the sign turned round > the trader's holdings are caught by the gain check<br>bug=sort: Sort by gain puts the smallest gain first > the upside-down order is caught by the sort check |
| REQ-PORTFOLIO-03 | 1 | A portfolio with nothing in it > a newbie is told there is nothing to show yet |
| REQ-PORTFOLIO-04 | 0 | _nothing yet_ |

## REQ-WALLET

| ID | Tests | Covered by |
| --- | --- | --- |
| REQ-WALLET-01 | 0 | _nothing yet_ |
| REQ-WALLET-02 | 3 | When a top-up is refused before the card form > an amount over the $50,000 limit never opens the card form<br>Adding practice money > top-ups stop once the account has added $50,000 in all<br>bug=limit: top-ups run on past $50,000 > the extra top-up is caught by the add limit check |
| REQ-WALLET-03 | 2 | Start over and the profile > starting over puts the display name and the theme back<br>The wallet of a trader who has been trading > start over puts the account back to the money it began with |
| REQ-WALLET-04 | 1 | The wallet of a trader who has been trading > the history downloads as a CSV named after today in Dhaka |

## REQ-PAY

| ID | Tests | Covered by |
| --- | --- | --- |
| REQ-PAY-01 | 3 | Paying for a top-up by card > the card that works adds the money everywhere it is shown<br>While a card is being processed > "Processing…" lasts exactly two seconds, and only then does the money arrive<br>A newbie topping up on a drifted app > adds $1,000 with card 4242 through the payment frame |
| REQ-PAY-02 | 3 | Paying for a top-up by card > the declined card says so and adds nothing<br>Paying for a top-up by card > the card with no funds says so and adds nothing<br>Paying for a top-up by card > a 16-digit card the app has never heard of is turned away |
| REQ-PAY-03 | 4 | The card form checks every field > no name on the card stops the payment<br>The card form checks every field > a card number that is too short stops the payment<br>The card form checks every field > a month that does not exist stops the payment<br>The card form checks every field > a two-digit CVC stops the payment |
| REQ-PAY-04 | 3 | When a top-up is refused before the card form > an amount over the $50,000 limit never opens the card form<br>When a top-up is refused before the card form > Cancel closes the card step and adds nothing<br>The Wallet only listens to its own payment frame > a message from another origin, or of another kind, adds nothing |

## REQ-HISTORY

| ID | Tests | Covered by |
| --- | --- | --- |
| REQ-HISTORY-01 | 3 | Paging through a long history > shows ten rows at a time, and Next moves on<br>Paging through a long history > "Buys" leaves twelve rows across two pages<br>Filtering the history by date > a From date after the To date is refused, and the table stays as it was |
| REQ-HISTORY-02 | 2 | The history in the link > the filter and the page are in the URL, and Back walks back through them<br>The history in the link > values the app does not understand in the link fall back without a fuss |
| REQ-HISTORY-03 | 2 | Downloading the history > the CSV holds every filtered row, not just the page on screen<br>The wallet of a trader who has been trading > the history downloads as a CSV named after today in Dhaka |
| REQ-HISTORY-04 | 4 | Opening a receipt from the history > Open on a buy opens a tab with what was bought and what it cost<br>A receipt for money that was added > says which card paid for it<br>Printing a receipt > the Print button asks the browser to print, once<br>A receipt that does not exist > says so instead of showing an empty receipt |

## REQ-WATCH

| ID | Tests | Covered by |
| --- | --- | --- |
| REQ-WATCH-01 | 2 | Remove all > the browser asks first: saying no keeps the list, saying yes empties it<br>A full watchlist > a seventh stock is refused, and the list stays at six |
| REQ-WATCH-02 | 4 | Moving rows from the keyboard > ArrowUp on a drag handle moves that row up and keeps the focus on it<br>The / shortcut > / jumps to the stock picker, and does nothing while a field is being typed in<br>The watchlist > starts in the saved order, with the NOVA alert waiting at $55.00<br>The watchlist > dragging a row changes the order, and the new order survives a reload |
| REQ-WATCH-03 | 7 | What the alert editor refuses > the editor refuses a price above the top of the slider<br>What the alert editor refuses > the editor refuses an Above alert that is not above the price<br>What the alert editor refuses > the editor refuses a Below alert that is not below the price<br>What the alert editor refuses > the editor refuses an alert with no way of telling you<br>Esc on the watchlist > Esc closes the alert editor and any pop-up that is open<br>Price alerts > an alert a cent above the price fires once and clears itself after five seconds<br>The watchlist > starts in the saved order, with the NOVA alert waiting at $55.00 |
| REQ-WATCH-04 | 3 | The star on the Market page > the star turns on, renames itself, and the Watchlist agrees after a reload<br>Browser alerts, with permission > turning them on says they are on<br>Browser alerts, without permission > the status line says the browser blocked them and the editor says to turn them on |

## REQ-PROFILE

| ID | Tests | Covered by |
| --- | --- | --- |
| REQ-PROFILE-01 | 4 | The profile photo > a small photo is saved at once, shows in the menu and survives a reload<br>The profile photo > a text file is refused as the wrong kind of file<br>The profile photo > a photo over 1 MB is refused as too big<br>The profile photo > dropping two photos at once is refused |
| REQ-PROFILE-02 | 6 | The details form > it opens with the saved details, and Select all is half ticked<br>The details form > three bad fields give three errors, a summary and the focus<br>The details form > turning 18 today is allowed, and a day short of it is not<br>The details form > Select all ticks the three email choices, then clears them<br>The details form > saving a new display name changes the initials in the menu with no reload<br>The details form > leaving with unsaved changes warns, and Undo puts the saved details back |
| REQ-PROFILE-03 | 3 | The theme > Light stays light on the next page<br>The theme > Match my device follows the device both ways<br>Start over and the profile > starting over puts the display name and the theme back |
| REQ-PROFILE-04 | 2 | Copying the account ID > the button says Copied!, the clipboard holds the ID, and the label comes back<br>Copying the account ID > a clipboard that refuses says so and offers the ID instead |
| REQ-PROFILE-05 | 0 | _nothing yet_ |

## REQ-NEWS

| ID | Tests | Covered by |
| --- | --- | --- |
| REQ-NEWS-01 | 3 | The news box on the Market page > shows the three newest headlines, inside an open shadow root<br>The news box on the Market page > Hide and Show move aria-expanded, and the choice survives a reload<br>The news box on the Market page > a headline opens its own item on the News page, open, in view and focused |
| REQ-NEWS-02 | 6 | The News page > opens with ten headlines, and says so above them<br>The News page > scrolling loads ten more a second later, and leaves the first one alone<br>The News page > keeps loading until all 60 are shown, then stops and says so<br>The News page > the KRYL filter shows only KRYL, writes it into the link, and Back undoes it<br>The News page > "Read more" opens one summary, and "Show less" puts it away<br>The News page > "Back to top" shows up once the page is long, and hands focus to the heading |
| REQ-NEWS-03 | 1 | The News page > the same seed gives the same ten headlines, and another seed a different order |

## REQ-LIVE

| ID | Tests | Covered by |
| --- | --- | --- |
| REQ-LIVE-01 | 3 | The price chart hover point > hovering the middle of the chart shows a time and a price, and leaving hides them<br>The price chart hover point > Home, End and the arrow keys walk the point, and the announcer says where it went<br>The price chart hover point > the last point is not shown twice at an exact five minute mark |
| REQ-LIVE-02 | 2 | Going offline > shows the banner and blocks a buy with the offline message<br>Going offline > coming back online hides the banner and says so for three seconds |
| REQ-LIVE-03 | 2 | The idle log out > with a session > warns after fourteen minutes, counts down, and "Stay logged in" resets it<br>The idle log out > with a session > logs out after fifteen minutes, and the same cash is there on the way back in |

## REQ-A11Y

| ID | Tests | Covered by |
| --- | --- | --- |
| REQ-A11Y-01 | 9 | The log in page > has no serious accessibility problems<br>Every signed-in page > the Market page has no serious accessibility problems<br>Every signed-in page > a Stock page has no serious accessibility problems<br>Every signed-in page > the Portfolio page has no serious accessibility problems<br>Every signed-in page > the Wallet page has no serious accessibility problems<br>Every signed-in page > the Watchlist page has no serious accessibility problems<br>Every signed-in page > the News page has no serious accessibility problems<br>Every signed-in page > the Profile page has no serious accessibility problems<br>Every signed-in page > the Rules page has no serious accessibility problems |
| REQ-A11Y-02 | 3 | Trading on a phone > logging in and buying one KRYL works at phone size<br>Phone layout > no page scrolls sideways on a phone<br>Phone layout > the alert editor sits under the watchlist, not beside it |
| REQ-A11Y-03 | 3 | How the pages look > the log in page<br>How the pages look > the Rules page<br>How the Market looks to a trader > the Market page |

## REQ-SWITCH

| ID | Tests | Covered by |
| --- | --- | --- |
| REQ-SWITCH-01 | 5 | bug=cost: the total charges for one share too many > buying 2 KRYL is caught by the buy total check<br>bug=gain: every gain is shown with the sign turned round > the trader's holdings are caught by the gain check<br>bug=limit: top-ups run on past $50,000 > the extra top-up is caught by the add limit check<br>bug=sort: Sort by gain puts the smallest gain first > the upside-down order is caught by the sort check<br>bug=search: the search box insists on the exact letter case > searching "kryl" in lower case is caught by the search check |
| REQ-SWITCH-02 | 9 | A signed-out visitor, on a drifted app > logs in and lands on the Market page<br>A trader on a drifted app > searches for a stock and opens its page<br>A trader on a drifted app > buys one KRYL and the menu cash drops by the price<br>A trader on a drifted app > sells one LUMA and the menu cash goes up by the price<br>A trader on a drifted app > walks to Portfolio and Wallet through the top menu<br>A trader on a drifted app > sees LUMA in the portfolio with the right number of shares<br>A trader on a drifted app > logs out and lands back on the log in page<br>A newbie topping up on a drifted app > adds $1,000 with card 4242 through the payment frame<br>The everyday app, for comparison > needs no healing at all when nothing has drifted |
| REQ-SWITCH-03 | 3 | An app that takes three seconds over everything > the Market page shows it is loading, then shows all eight stocks<br>An app that takes three seconds over everything > buying one KRYL still works from end to end<br>An app that takes three seconds over everything > the Portfolio page shows the trader's holdings |
| REQ-SWITCH-04 | 2 | An app that drops the odd request > a load that fails says so, and "Try again" brings the stocks back<br>An app that drops the odd request > the same seed gives the same run of failures on a second page |

## Not covered yet

| ID | Requirement |
| --- | --- |
| REQ-PORTFOLIO-04 | Buying the same stock more than once values it at the average of what you paid. |
| REQ-WALLET-01 | Every account starts with $10,000. |
| REQ-PROFILE-05 | Your details are saved in this browser only, so a new browser starts fresh. |
