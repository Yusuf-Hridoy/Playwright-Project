/**
 * Playwright Test Command Center — Vanilla JS frontend (Phase 2).
 *
 * Handles tab navigation, test discovery, browser selection, execution mode
 * toggling, and real-time test run log streaming over WebSocket.
 */

(function () {
  "use strict";

  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------
  const state = {
    selectedFolder: null,
    isHeaded: false,
    browsers: [],
    testGroups: {},
    websocket: null,
    activeRunId: null,
    isRunning: false,
  };

  // -------------------------------------------------------------------------
  // DOM references
  // -------------------------------------------------------------------------
  const els = {
    folderList: document.getElementById("folder-list"),
    browserList: document.getElementById("browser-list"),
    modeToggle: document.getElementById("mode-toggle"),
    modeLabel: document.getElementById("mode-label"),
    runButton: document.getElementById("run-button"),
    stopButton: document.getElementById("stop-button"),
    runStatus: document.getElementById("run-status"),
    liveConsole: document.getElementById("live-console"),
    clearConsole: document.getElementById("clear-console"),
    copyConsole: document.getElementById("copy-console"),
    tabs: document.querySelectorAll(".nav-tab"),
    tabContents: document.querySelectorAll(".tab-content"),
  };

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------
  function formatTimestamp() {
    const now = new Date();
    return now.toLocaleTimeString(undefined, { hour12: false });
  }

  function inferLineType(text) {
    if (!text) return "info";
    const lower = text.toLowerCase();
    if (
      lower.includes("fail") ||
      lower.includes("error") ||
      lower.includes("✗") ||
      lower.includes("✘") ||
      lower.includes("could not") ||
      lower.includes("unable to")
    ) {
      return "error";
    }
    if (lower.includes("pass") || lower.includes("✓") || lower.includes("✔") || lower.includes("ok ")) {
      return "success";
    }
    if (lower.includes("timeout") || lower.includes("warning") || lower.includes("warn")) {
      return "warning";
    }
    return "info";
  }

  function appendToConsole(text, type) {
    if (!els.liveConsole) return;

    const lineType = type || inferLineType(text);
    const line = document.createElement("div");
    line.className = `console-line ${lineType}`;
    line.textContent = `[${formatTimestamp()}] ${text}`;
    els.liveConsole.appendChild(line);
    els.liveConsole.scrollTop = els.liveConsole.scrollHeight;
  }

  function clearConsole() {
    if (!els.liveConsole) return;
    els.liveConsole.innerHTML = "";
    appendToConsole("Console cleared.", "system");
  }

  async function copyLogs() {
    if (!els.liveConsole) return;
    const text = Array.from(els.liveConsole.querySelectorAll(".console-line"))
      .map((line) => line.textContent)
      .join("\n");

    try {
      await navigator.clipboard.writeText(text);
      appendToConsole("Logs copied to clipboard.", "success");
    } catch (err) {
      appendToConsole(`Failed to copy logs: ${err.message}`, "error");
    }
  }

  function setLoading(element, message) {
    element.innerHTML = `<div class="loading-state">${message}</div>`;
  }

  function setEmpty(element, message) {
    element.innerHTML = `<div class="empty-state">${message}</div>`;
  }

  function setError(element, message) {
    element.innerHTML = `<div class="empty-state" style="color: var(--accent-red)">${message}</div>`;
  }

  function setRunStatus(status, message) {
    if (!els.runStatus) return;

    const statusMap = {
      idle: { className: "status-badge status-idle", label: message || "Idle" },
      running: { className: "status-badge status-running", label: message || "Running" },
      completed: { className: "status-badge status-completed", label: message || "Completed" },
      failed: { className: "status-badge status-failed", label: message || "Failed" },
      error: { className: "status-badge status-failed", label: message || "Error" },
      cancelled: { className: "status-badge status-failed", label: message || "Cancelled" },
    };

    const config = statusMap[status] || statusMap.idle;
    els.runStatus.className = config.className;
    els.runStatus.textContent = config.label;
  }

  function setControlsRunning(isRunning) {
    state.isRunning = isRunning;
    if (els.runButton) {
      els.runButton.disabled = isRunning || !state.selectedFolder;
    }
    if (els.stopButton) {
      els.stopButton.disabled = !isRunning;
    }
  }

  // -------------------------------------------------------------------------
  // API calls
  // -------------------------------------------------------------------------
  async function fetchTests() {
    setLoading(els.folderList, "Loading test folders…");
    try {
      const response = await fetch("/api/tests");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      state.testGroups = payload?.data?.groups || {};
      renderFolders();
    } catch (error) {
      console.error("Failed to fetch tests:", error);
      setError(els.folderList, "Failed to load test folders.");
      appendToConsole(`Error loading test folders: ${error.message}`, "error");
    }
  }

  async function fetchBrowsers() {
    setLoading(els.browserList, "Loading browsers…");
    try {
      const response = await fetch("/api/browsers");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      const detected = payload?.data?.browsers || [];
      state.browsers = detected.length ? detected : ["chromium"];
      renderBrowsers();
    } catch (error) {
      console.error("Failed to fetch browsers:", error);
      state.browsers = ["chromium", "firefox", "webkit"];
      renderBrowsers();
      appendToConsole(`Error loading browsers: ${error.message}`, "error");
    }
  }

  async function startRun() {
    if (!state.selectedFolder) {
      appendToConsole("No folder selected. Please select a test folder first.", "error");
      return;
    }

    const checkedBoxes = els.browserList.querySelectorAll('input[type="checkbox"]:checked');
    const selectedBrowsers = Array.from(checkedBoxes).map((box) => box.value);

    if (!selectedBrowsers.length) {
      appendToConsole("Please select at least one browser.", "error");
      return;
    }

    setControlsRunning(true);
    setRunStatus("running");
    appendToConsole(
      `Starting run: folder="${state.selectedFolder}", browsers=[${selectedBrowsers.join(", ")}], headed=${state.isHeaded}`,
      "info"
    );

    try {
      const response = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folder: state.selectedFolder,
          browsers: selectedBrowsers,
          headed: state.isHeaded,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = payload?.message || `HTTP ${response.status}`;
        throw new Error(message);
      }

      const runId = payload?.data?.run_id;
      const status = payload?.data?.status;
      appendToConsole(`Run created: run_id=${runId}, status=${status}`, "success");
      console.log("Run created:", payload?.data);

      state.activeRunId = runId;
      connectWebSocket(runId);
    } catch (error) {
      console.error("Failed to start run:", error);
      appendToConsole(`Failed to start run: ${error.message}`, "error");
      setRunStatus("error");
      setControlsRunning(false);
    }
  }

  async function stopRun() {
    if (!state.activeRunId) {
      appendToConsole("No active run to stop.", "error");
      return;
    }

    appendToConsole(`Stopping run_id=${state.activeRunId}…`, "warning");

    try {
      const response = await fetch(`/api/run/${state.activeRunId}`, { method: "DELETE" });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = payload?.message || `HTTP ${response.status}`;
        throw new Error(message);
      }

      appendToConsole(`Run id=${state.activeRunId} cancelled.`, "warning");
      setRunStatus("cancelled");
    } catch (error) {
      console.error("Failed to stop run:", error);
      appendToConsole(`Failed to stop run: ${error.message}`, "error");
    } finally {
      closeWebSocket();
      setControlsRunning(false);
    }
  }

  // -------------------------------------------------------------------------
  // WebSocket
  // -------------------------------------------------------------------------
  function connectWebSocket(runId) {
    closeWebSocket();

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const host = window.location.host || "localhost:8000";
    const url = `${protocol}://${host}/ws/run/${runId}`;

    appendToConsole(`Connecting to WebSocket: ${url}`, "info");

    try {
      const ws = new WebSocket(url);
      state.websocket = ws;

      ws.onopen = () => {
        appendToConsole("WebSocket connected.", "success");
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (err) {
          appendToConsole(`Raw: ${event.data}`, "info");
        }
      };

      ws.onerror = () => {
        appendToConsole("WebSocket error occurred.", "error");
        setRunStatus("error");
      };

      ws.onclose = () => {
        appendToConsole("--- Connection closed ---", "system");
        state.websocket = null;
        if (state.isRunning) {
          setControlsRunning(false);
        }
      };
    } catch (err) {
      appendToConsole(`WebSocket connection failed: ${err.message}`, "error");
      setControlsRunning(false);
      setRunStatus("error");
    }
  }

  function handleWebSocketMessage(message) {
    switch (message.type) {
      case "log":
        appendToConsole(message.data, null);
        break;
      case "system":
        appendToConsole(message.data, "system");
        break;
      case "status":
        appendToConsole(`Status: ${message.status}`, "info");
        break;
      case "completed":
        {
          const stats = message.stats || {};
          appendToConsole(
            `Run completed (${message.status}). Total: ${stats.total_tests}, Passed: ${stats.passed}, Failed: ${stats.failed}, Skipped: ${stats.skipped}`,
            message.status === "completed" ? "success" : "error"
          );
          setRunStatus(message.status, `${message.status} — ${stats.passed}/${stats.total_tests} passed`);
          setControlsRunning(false);
          closeWebSocket();
        }
        break;
      case "error":
        appendToConsole(`Run error: ${message.data}`, "error");
        setRunStatus("error");
        setControlsRunning(false);
        closeWebSocket();
        break;
      case "cancelled":
        appendToConsole(`Run cancelled: ${message.data}`, "warning");
        setRunStatus("cancelled");
        setControlsRunning(false);
        closeWebSocket();
        break;
      default:
        appendToConsole(JSON.stringify(message), "info");
    }
  }

  function closeWebSocket() {
    if (state.websocket) {
      try {
        state.websocket.close();
      } catch (err) {
        // Ignore close errors.
      }
      state.websocket = null;
    }
  }

  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------
  function renderFolders() {
    if (!els.folderList) return;
    els.folderList.innerHTML = "";

    const groupNames = Object.keys(state.testGroups).sort((a, b) => {
      if (a === "uncategorized") return 1;
      if (b === "uncategorized") return -1;
      return a.localeCompare(b);
    });

    if (!groupNames.length) {
      setEmpty(els.folderList, "No test files discovered.");
      return;
    }

    groupNames.forEach((folderName) => {
      const files = state.testGroups[folderName] || [];
      const card = document.createElement("div");
      card.className = "folder-card";
      card.dataset.folder = folderName;
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");
      card.setAttribute("aria-pressed", "false");

      const header = document.createElement("div");
      header.className = "folder-name";
      header.innerHTML = `<span>${escapeHtml(folderName)}</span><span class="folder-count">${files.length}</span>`;
      card.appendChild(header);

      const fileList = document.createElement("div");
      fileList.className = "folder-files";
      files.forEach((filePath) => {
        const fileItem = document.createElement("div");
        fileItem.className = "folder-file";
        fileItem.textContent = escapeHtml(filePath);
        fileList.appendChild(fileItem);
      });
      card.appendChild(fileList);

      card.addEventListener("click", () => selectFolder(folderName));
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectFolder(folderName);
        }
      });

      els.folderList.appendChild(card);
    });
  }

  function renderBrowsers() {
    if (!els.browserList) return;
    els.browserList.innerHTML = "";

    if (!state.browsers.length) {
      setEmpty(els.browserList, "No browsers detected.");
      return;
    }

    state.browsers.forEach((browserName) => {
      const label = document.createElement("label");
      label.className = "browser-pill active";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = browserName;
      checkbox.checked = true;
      checkbox.addEventListener("change", () => {
        label.classList.toggle("active", checkbox.checked);
      });

      const span = document.createElement("span");
      span.className = "browser-name";
      span.textContent = browserName;

      label.appendChild(checkbox);
      label.appendChild(span);
      els.browserList.appendChild(label);
    });
  }

  // -------------------------------------------------------------------------
  // State updates
  // -------------------------------------------------------------------------
  function selectFolder(folderName) {
    state.selectedFolder = folderName;

    const cards = els.folderList.querySelectorAll(".folder-card");
    cards.forEach((card) => {
      const isSelected = card.dataset.folder === folderName;
      card.classList.toggle("selected", isSelected);
      card.setAttribute("aria-pressed", isSelected ? "true" : "false");
    });

    appendToConsole(`Selected folder: ${folderName}`, "info");
    updateRunButton();
  }

  function updateRunButton() {
    if (!els.runButton) return;
    els.runButton.disabled = state.isRunning || !state.selectedFolder;
  }

  function setHeaded(isHeaded) {
    state.isHeaded = isHeaded;
    appendToConsole(`Execution mode: ${isHeaded ? "Headed" : "Headless"}`, "info");
  }

  // -------------------------------------------------------------------------
  // Tabs
  // -------------------------------------------------------------------------
  function switchTab(tabName) {
    els.tabs.forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.tab === tabName);
    });

    els.tabContents.forEach((content) => {
      content.classList.toggle("active", content.id === `${tabName}-tab`);
    });
  }

  // -------------------------------------------------------------------------
  // Utilities
  // -------------------------------------------------------------------------
  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // -------------------------------------------------------------------------
  // Event bindings
  // -------------------------------------------------------------------------
  function bindEvents() {
    els.tabs.forEach((tab) => {
      tab.addEventListener("click", () => switchTab(tab.dataset.tab));
    });

    if (els.modeToggle) {
      els.modeToggle.addEventListener("change", (event) => {
        setHeaded(event.target.checked);
      });
    }

    if (els.runButton) {
      els.runButton.addEventListener("click", startRun);
    }

    if (els.stopButton) {
      els.stopButton.addEventListener("click", stopRun);
    }

    if (els.clearConsole) {
      els.clearConsole.addEventListener("click", clearConsole);
    }

    if (els.copyConsole) {
      els.copyConsole.addEventListener("click", copyLogs);
    }
  }

  // -------------------------------------------------------------------------
  // Initialization
  // -------------------------------------------------------------------------
  function init() {
    bindEvents();
    updateRunButton();
    setRunStatus("idle");
    appendToConsole("Dashboard loaded.", "system");

    fetchTests();
    fetchBrowsers();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
