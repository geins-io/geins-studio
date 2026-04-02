---
name: chrome-debug
description: Launch Google Chrome with remote debugging enabled for Chrome DevTools MCP integration. Use when you need to inspect the browser console, take screenshots, interact with pages, or use any chrome-devtools MCP tools. Trigger on: open chrome, launch chrome, start chrome, chrome debug, devtools, inspect browser, console errors, browser console, check console.
---

# Chrome Remote Debugging

Launch a **separate** Chrome instance with remote debugging so the `chrome-devtools` MCP server can connect. This runs alongside the user's regular Chrome cleanly.

## Prerequisites

- Google Chrome installed at `/Applications/Google Chrome.app`
- The `chrome-devtools` MCP server configured to connect on port `9222`

## Steps

### 1. Check if the debug port is already active

```bash
curl -s http://127.0.0.1:9222/json/version 2>/dev/null || echo "NOT_RUNNING"
```

// turbo

If you get a JSON response, the debug Chrome is already running — skip to step 3. If you see `NOT_RUNNING`, continue to step 2.

### 2. Launch Chrome with extreme isolation

To avoid crashes and MacOS Dock binding issues, we heavily isolate the debug instance. Because we use `--user-data-dir`, this behaves as a parallel process completely disjoint from the user's normal Chrome profile.

**Do NOT kill regular Chrome.** Leave their main browser running untouched.

```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=$HOME/.chrome-debug-profile \
  --disk-cache-dir=$HOME/.chrome-debug-cache \
  --use-mock-keychain \
  --disable-extensions \
  --no-first-run \
  --no-default-browser-check \
  --disable-background-networking &
```

### 3. Verify the debug port is available

Wait a few seconds for Chrome to start, then confirm the port is listening:

```bash
sleep 3 && curl -s http://127.0.0.1:9222/json/version
```

// turbo

You should see a JSON response with `Browser`, `Protocol-Version`, and `webSocketDebuggerUrl` fields.

### 4. Navigate to the app

Use `mcp_chrome-devtools_new_page` to open the dev app (usually `http://localhost:3000`).

## Closing Debug Chrome Only

To close **only** the debug instance without affecting regular Chrome, find and kill its PID based on the port:

```bash
lsof -ti :9222 | xargs kill 2>/dev/null
```

## Notes

- The debug Chrome uses a **separate permanent profile** (`~/.chrome-debug-profile`) — logins and history made here will persist across reboots, but your regular extensions and bookmarks won't be present.
- By not killing the user's normal Chrome beforehand, the MacOS Dock icon remains bound correctly to their primary instance.
- The isolated cache flags prevent `Error code: 10` crashes on websites like Google/Gmail auth redirects.
