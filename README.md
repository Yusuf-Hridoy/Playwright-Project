# 🎭 Swag Labs E2E Automation

[![Smoke Tests](https://github.com/Yusuf-Hridoy/Playwright-Project/actions/workflows/smoke.yml/badge.svg)](https://github.com/Yusuf-Hridoy/Playwright-Project/actions/workflows/smoke.yml)
[![Full Regression](https://github.com/Yusuf-Hridoy/Playwright-Project/actions/workflows/regression.yml/badge.svg)](https://github.com/Yusuf-Hridoy/Playwright-Project/actions/workflows/regression.yml)
[![Nightly Full Regression](https://github.com/Yusuf-Hridoy/Playwright-Project/actions/workflows/nightly.yml/badge.svg)](https://github.com/Yusuf-Hridoy/Playwright-Project/actions/workflows/nightly.yml)

End-to-end test automation framework for [Sauce Demo](https://www.saucedemo.com/) built with **Playwright**, **Page Object Model**, and **Allure Reporting**.

---

## 🚀 Tech Stack

| Tool | Purpose |
|------|---------|
| [Playwright](https://playwright.dev/) | Cross-browser E2E testing |
| [Allure](https://qameta.io/allure-report/) | Rich test reporting & analytics |
| [Percy](https://percy.io/) | Visual regression testing |
| [GitHub Actions](https://github.com/features/actions) | CI/CD pipeline |

---

## 📁 Project Structure

```
├── .github/workflows/       # CI/CD configuration
├── fixtures/                # Playwright custom fixtures
├── Pages/                   # Page Object Models
│   ├── Loginpage.js
│   ├── Homepage.js
│   ├── Cart.js
│   ├── checkout.js
│   └── checkoutoverview.js
├── tests/                   # Test suites
│   ├── LoginTest.spec.js
│   ├── Homepage.spec.js
│   ├── FilterCheck.spec.js
│   ├── e2e.spec.js
│   └── demo.spec.js
├── TestData/                # JSON test data
│   ├── LoginData.json
│   └── CheckoutData.json
├── utils/                   # Utilities & config helpers
│   └── Testoption.js
├── playwright.config.js     # Playwright configuration
└── README.md
```

---

## ⚡ Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) LTS
- npm (comes with Node.js)

### Installation

```bash
# Clone the repository
git clone https://github.com/Yusuf-Hridoy/Playwright-Project.git
cd swag-labs-playwright

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

---

## 🧪 Running Tests

### Run all tests
```bash
npx playwright test
```

### Run a specific test file
```bash
npx playwright test LoginTest.spec.js
```

### Run in headed mode (see the browser)
```bash
npx playwright test --headed
```

### Run in a specific browser
```bash
npx playwright test --project=chromium
```

### Run with UI mode (great for debugging)
```bash
npx playwright test --ui
```

---

## 📊 Test Reporting

### HTML Report (Built-in)
```bash
npx playwright test
npx playwright show-report
```

### Allure Report
```bash
# Run tests to generate allure-results
npx playwright test

# Generate and open Allure report
npx allure generate allure-results --clean -o allure-report
npx allure open allure-report
```

### Artifacts on Failure
- 📸 **Screenshots** — captured automatically on test failure
- 🎥 **Video recordings** — retained only for failed tests
- 📋 **Traces** — interactive timeline for debugging

---

## 🏗️ Architecture Highlights

- **Page Object Model (POM)** — maintainable, reusable page classes
- **Custom Fixtures** — auto-instantiated page objects via `fixtures/base.fixture.js`
- **Data-Driven Testing** — credentials and checkout data stored in JSON
- **Cross-Browser** — Chromium, Firefox, WebKit, and Mobile (Pixel 5)
- **Visual Testing** — Percy snapshots for critical UI states

---

## 🔄 CI/CD

Tests run automatically via **GitHub Actions**:

| Workflow | Trigger | What it runs |
|----------|---------|--------------|
| [Smoke Tests](.github/workflows/smoke.yml) | Pull request to `main`/`master` | `@smoke` tests (fast feedback) |
| [Full Regression](.github/workflows/regression.yml) | Push to `main`/`master` | Full `@regression` suite, sharded across 4 runners (`--shard=1/4`) with merged reports |
| [Nightly Full Regression](.github/workflows/nightly.yml) | Daily cron (02:00 UTC) + manual | Full suite against a chosen environment |
| [Compatibility Matrix](.github/workflows/matrix.yml) | Push to `main`/`master` | `@smoke` suite across Ubuntu/Windows/macOS × Node 20/22 |
| [Environment Tests](.github/workflows/env-tests.yml) | Manual / `repository_dispatch` | `smoke` or `regression` suite against `dev` / `staging` / `prod` |

**Reliability features:**
- 🔁 **Retries on CI** — failed tests retry up to 2 times
- 🍥 **Flaky test tracking** — tests that pass on retry are logged to `flaky-tests.txt` and uploaded as an artifact (`utils/flaky-reporter.js`)
- 🧩 **Blob report merging** — sharded runs merge into a single HTML report via `npx playwright merge-reports`

**Artifacts uploaded:**
- `playwright-report/` — merged HTML test report
- `allure-report/` — Rich Allure dashboard
- `flaky-tests.txt` — flaky test log for root-cause analysis

---

## 🐳 Docker

Run tests in a container with pinned Node.js + browsers (identical local and CI environments):

```bash
# Build the image
docker build -t playwright-tests .

# Run the full suite
docker run --rm playwright-tests

# Run only smoke tests
docker run --rm playwright-tests npm run test:smoke
```

---

## 🏷️ Test Tags

Suites are tagged for selective execution:

| Tag | Suites | Command |
|-----|--------|---------|
| `@smoke` | Login, Homepage, End-to-End Checkout | `npm run test:smoke` |
| `@regression` | All suites | `npm run test:regression` |

---

## 🛡️ Environment Variables

Create a `.env` file in the project root:

```env
ENV=dev
```

Supported environments: `dev`, `staging`, `prod` (configured in `utils/Testoption.js`)

> ⚠️ **Never commit `.env` to version control.**

---

## 📝 Test Coverage

| Feature | Status |
|---------|--------|
| Login (valid & invalid) | ✅ |
| Product sorting / filtering | ✅ |
| Add to cart | ✅ |
| Cart verification | ✅ |
| Checkout end-to-end flow | ✅ |
| Visual regression (Percy) | ✅ |
| Cross-browser testing | ✅ |

---
