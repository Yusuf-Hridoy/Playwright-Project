# Docker-based test runner (imple.md 3.4)
# Uses the official Playwright image with pinned Node.js + browser versions
# so local and CI environments are identical.
#
# Build:  docker build -t playwright-tests .
# Run:    docker run --rm playwright-tests
# Smoke:  docker run --rm playwright-tests npm run test:smoke
# Shell:  docker run --rm -it playwright-tests /bin/bash
FROM mcr.microsoft.com/playwright:v1.59.1-jammy

WORKDIR /app

# Mark runs inside the container as CI (enables retries, blob reporter, etc.)
ENV CI=true

# Install dependencies first for better layer caching
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the project (see .dockerignore)
COPY . .

# Default: run the full suite. Override with: docker run <image> npm run test:smoke
CMD ["npx", "playwright", "test"]
