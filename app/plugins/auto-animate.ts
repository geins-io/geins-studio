import { vAutoAnimate } from '@formkit/auto-animate/vue';

// Registered here rather than via `@formkit/auto-animate/nuxt`: that module's
// plugin is a `.mjs` with only a `.d.ts`, which Nuxt ≥ 4.6 imports as untyped
// `any` in its generated plugin types — erasing every plugin's injections
// (`$geinsApi`, `$geinsApiFetchInstance`, …) from `useNuxtApp()`.
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('auto-animate', vAutoAnimate);
});
