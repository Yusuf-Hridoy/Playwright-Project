# 🎭 Swag Labs E2E Automation

[![Playwright Tests](https://github.com/Yusuf-Hridoy/Playwright-Project/actions/workflows/playwright.yml/badge.svg)](https://github.com/Yusuf-Hridoy/Playwright-Project/actions/workflows/playwright.yml)

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

Tests run automatically via **GitHub Actions** on every push and pull request to `main`/`master`.

**Artifacts uploaded:**
- `playwright-report/` — HTML test report
- `allure-report/` — Rich Allure dashboard

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
