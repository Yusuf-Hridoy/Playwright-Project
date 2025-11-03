# Playwright-Project  
Automated End-to-End (E2E) Test Framework using Playwright  

---

## 📌 Table of Contents  
1. [Project Overview](#project-overview)  
2. [Key Features](#key-features)  
3. [Tech Stack & Prerequisites](#tech-stack--prerequisites)  
4. [Getting Started](#getting-started)  
   - Cloning the repo  
   - Installing dependencies  
   - Installing browser binaries  
5. [Project Structure](#project-structure)  
6. [Running Tests](#running-tests)  
   - Run all tests  
   - Run a specific browser/project  
   - Run a specific file  
7. [Reporting & Artifacts](#reporting--artifacts)  
8. [CI/CD & Docker](#cicd--docker)  

---

## Project Overview  
This project provides a robust, maintainable E2E test automation framework built with Playwright.  
It helps ensure the reliability and functionality of web applications through automated browser testing using the **Page Object Model (POM)** pattern.  

The framework is designed for real-world QA automation — integrating easily into **CI/CD pipelines via GitHub Actions** and soon to be **containerized using Docker** for consistent execution across environments.

---

## Key Features  
- ✅ Cross-browser testing (Chromium, Firefox, WebKit)  
- 🧩 Page Object Model (POM) architecture for better code reusability and maintenance  
- ⚙️ Centralized configuration via `playwright.config.js`  
- 🧠 Reusable utilities and helper functions under `utils/`  
- 📊 HTML reporting and trace debugging  
- 🚀 CI/CD integration using **GitHub Actions**  
- 🐳 **Docker support coming soon** for environment-independent test execution  

---

## Tech Stack & Prerequisites  
**Technologies Used:**  
- Node.js (v14+ recommended)  
- Playwright Test Framework  
- JavaScript (or TypeScript if extended)  
- Git & GitHub Actions (CI/CD)  
- Docker (planned for future integration)

**Prerequisites:**  
- Node.js & npm installed  
- Git installed and configured  
- Optional: Docker installed (for upcoming support)  

---

## Getting Started  

### 1. Clone the repository  
```bash
git clone https://github.com/Yusuf-Hridoy/Playwright-Project.git
cd Playwright-Project
```

### 2. Install dependencies  
```bash
npm install
```

### 3. Install Playwright supported browsers  
```bash
npx playwright install
```

---

## Project Structure  
```
Playwright-Project/
├── .github/
│   └── workflows/              # GitHub Actions CI workflows
├── tests/                      # Main test specifications
├── tests-examples/             # Example test cases
├── utils/                      # Utility and helper files
├── playwright.config.js        # Playwright configuration
├── package.json
├── package-lock.json
└── .gitignore
```

**Folder Descriptions:**  
- `tests/`: Contains all test cases (`*.spec.js`).  
- `tests-examples/`: Demo or sample tests.  
- `utils/`: Helper methods, page objects, and common utilities.  
- `.github/workflows/`: Defines CI pipelines (currently configured to run Playwright tests automatically on each push/pull).  
- `playwright.config.js`: Global configuration for browsers, retries, and reporting.  

---

## Running Tests  

### Run all tests  
```bash
npx playwright test
```

### Run tests in a specific browser  
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
```

### Run a specific test file  
```bash
npx playwright test tests/example.spec.js
```

### Headed (UI) mode for debugging  
```bash
npx playwright test --headed --project=chromium
```

---

## Reporting & Artifacts  

After test execution, you can generate and open Playwright’s built-in report:
```bash
npx playwright show-report
```

Reports typically include:  
- ✅ Test pass/fail summary  
- 🖼️ Screenshots for failed tests  
- 📹 Video recordings (if enabled)  
- 🧾 Trace viewer files for step-by-step debugging  

Artifacts (screenshots, traces, reports) are saved automatically in the output directory specified in `playwright.config.js`.

---

## CI/CD & Docker  

### 🔄 Continuous Integration (CI)  
This project includes a **GitHub Actions** workflow under `.github/workflows/` that:  
- Installs dependencies  
- Runs Playwright browser setup  
- Executes all tests in headless mode  
- Generates and uploads the test report as an artifact  

This ensures every code push or pull request triggers automated test runs, maintaining continuous quality checks.

### 🐳 Docker Integration (Coming Soon)  


---

**Maintained by:**  
👨‍💻 Md Yusuf Ahmed  
Software QA Engineer | Playwright, Cypress, Selenium, Postman, JMeter  
📍 [LinkedIn](https://www.linkedin.com/in/md-yusuf-ahmed/)  
