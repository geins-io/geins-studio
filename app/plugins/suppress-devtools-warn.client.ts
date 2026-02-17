export default defineNuxtPlugin({
  name: 'suppress-devtools-warn',
  enforce: 'pre',
  setup() {
    if (import.meta.dev) {
      const originalWarn = console.warn;
      console.warn = (...args: unknown[]) => {
        if (
          typeof args[0] === 'string' &&
          args[0].includes('Extraneous non-props attributes')
        ) {
          return;
        }
        originalWarn.apply(console, args);
      };
    }
  },
});
