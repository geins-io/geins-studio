import * as z from 'zod';

// Zod compiles object validators with `new Function`, which a CSP without
// 'unsafe-eval' forbids (and reports while report-only). Its interpreter is
// plenty for Studio's forms. Schemas are built in component setup, after
// plugins run; Zod reads this flag when a schema is created.
export default defineNuxtPlugin(() => {
  z.config({ jitless: true });
});
