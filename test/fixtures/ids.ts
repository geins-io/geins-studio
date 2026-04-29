let counter = 0;

/**
 * Generates a unique ID string for test fixtures.
 * Use `resetIdCounter()` in `beforeEach` if deterministic IDs are needed.
 */
export function nextId(prefix = 'test') {
  return `${prefix}-${++counter}`;
}

/**
 * Resets the ID counter. Call in `beforeEach` for deterministic fixture IDs.
 */
export function resetIdCounter() {
  counter = 0;
}
