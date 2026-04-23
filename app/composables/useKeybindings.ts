type KeybindingHandler = (event: KeyboardEvent) => void

type MatchStrategy = 'code' | 'key'

interface ParsedCombo {
  matchStrategy: MatchStrategy
  matchTarget: string
  alt: boolean
  ctrl: boolean
  meta: boolean
  mod: boolean
  shift: boolean
}

// Aliases so users can write `esc` / `return` / `up` instead of the DOM's
// canonical names, plus word forms for symbols.
const KEY_ALIASES: Record<string, string> = {
  esc: 'escape',
  return: 'enter',
  up: 'arrowup',
  down: 'arrowdown',
  left: 'arrowleft',
  right: 'arrowright',
  space: ' ',
  plus: '+',
  minus: '-',
  equal: '=',
}

const isMacPlatform = (): boolean => (
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
)

// `+` is our separator but also a valid key (e.g. `shift++`). When the
// combo ends with `+`, peel off the trailing `+` as the key and treat the
// rest as modifiers so the modifier list parses cleanly.
const splitCombo = (combo: string): { key: string, modifiers: string[] } => {
  const lower = combo.toLowerCase()
  if (lower === '+') return { key: '+', modifiers: [] }
  if (lower.endsWith('+')) {
    const mods = lower.slice(0, -2).split('+').map(p => p.trim()).filter(Boolean)
    return { key: '+', modifiers: mods }
  }
  const parts = lower.split('+').map(p => p.trim())
  return { key: parts.pop() ?? '', modifiers: parts }
}

// Letters and digits match by `KeyboardEvent.code` — layout-independent and
// robust to Mac's Alt/Option dead-keys (Option+T produces '†' on `event.key`
// but stays 'KeyT' on `event.code`). Everything else matches by
// `KeyboardEvent.key`, so symbols like `+` match the produced character
// regardless of whether it required shift on the user's layout (a Swedish
// keyboard has `+` on the physical minus key, so `e.code` is wrong for it).
const parseCombo = (combo: string): ParsedCombo => {
  const { key, modifiers } = splitCombo(combo)
  const normalized = KEY_ALIASES[key] ?? key
  const isLetter = normalized.length === 1 && /[a-z]/.test(normalized)
  const isDigit = normalized.length === 1 && /[0-9]/.test(normalized)

  let matchStrategy: MatchStrategy
  let matchTarget: string
  if (isLetter) {
    matchStrategy = 'code'
    matchTarget = `Key${normalized.toUpperCase()}`
  }
  else if (isDigit) {
    matchStrategy = 'code'
    matchTarget = `Digit${normalized}`
  }
  else {
    matchStrategy = 'key'
    matchTarget = normalized
  }

  return {
    matchStrategy,
    matchTarget,
    alt: modifiers.includes('alt'),
    ctrl: modifiers.includes('ctrl'),
    meta: modifiers.includes('meta') || modifiers.includes('cmd'),
    mod: modifiers.includes('mod'),
    shift: modifiers.includes('shift'),
  }
}

const matches = (event: KeyboardEvent, combo: ParsedCombo): boolean => {
  const actual = combo.matchStrategy === 'code' ? event.code : event.key.toLowerCase()
  if (actual !== combo.matchTarget) return false
  if (event.altKey !== combo.alt) return false

  // For code matching (letters/digits) we enforce shift strictly. For key
  // matching, shift is often baked into the produced character already —
  // e.g. Shift+= produces `+` on US layouts, and a plain `+` key press on
  // Nordic layouts produces `+` without shift. Requiring combo.shift to
  // equal event.shiftKey would make a `+` binding miss one of those cases,
  // so we only enforce shift when the combo explicitly asks for it.
  if (combo.matchStrategy === 'code') {
    if (event.shiftKey !== combo.shift) return false
  }
  else if (combo.shift && !event.shiftKey) {
    return false
  }

  // `mod` means "platform-native cmd/ctrl": Cmd on Mac (metaKey), Ctrl
  // elsewhere. We forbid the other one so `mod+enter` doesn't fire on
  // Ctrl+Enter when a Mac user probably meant Cmd+Enter.
  if (combo.mod) {
    return isMacPlatform() ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey
  }
  return event.ctrlKey === combo.ctrl && event.metaKey === combo.meta
}

// Skip shortcuts while the user is typing — otherwise a `T`-keyed shortcut
// would fire every time someone types "t" in an input.
const isFromEditable = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false
  return target.matches('input, textarea, select, [contenteditable="true"], [contenteditable=""]')
}

/**
 * Register global keyboard shortcuts for the current component's lifetime.
 *
 * Accepts a map of "shift+alt+t"-style combos to handlers. Modifiers accepted:
 * `shift`, `alt`, `ctrl`, `meta`/`cmd`, and `mod` (Cmd on Mac, Ctrl elsewhere).
 * Letters/digits match the physical key (layout-independent); symbols and
 * named keys match the produced character (works across layouts).
 *
 * @example
 *   useKeybindings({ 'shift+alt+t': tidyUp, 'mod+s': save, '+': zoomIn })
 */
export const useKeybindings = (bindings: Record<string, KeybindingHandler>): void => {
  const parsed = Object.entries(bindings).map(([combo, handler]) => ({
    combo: parseCombo(combo),
    handler,
  }))

  const onKeyDown = (event: KeyboardEvent) => {
    if (isFromEditable(event.target)) return
    for (const { combo, handler } of parsed) {
      if (matches(event, combo)) {
        event.preventDefault()
        handler(event)
        return
      }
    }
  }

  onMounted(() => document.addEventListener('keydown', onKeyDown))
  onBeforeUnmount(() => document.removeEventListener('keydown', onKeyDown))
}
