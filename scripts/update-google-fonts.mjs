// Refreshes app/assets/google-fonts.json, the Google Fonts catalogue the
// storefront font picker searches. Run with `pnpm fonts:update`.
//
// fonts.google.com/metadata/fonts is the keyless feed fonts.google.com itself
// uses; it isn't a documented API. If it changes shape, switch to the Google
// Fonts Developer API (needs a key) — only `family` + `category` are needed.
import { writeFile } from 'node:fs/promises';

const SOURCE = 'https://fonts.google.com/metadata/fonts';
const OUTPUT = new URL('../app/assets/google-fonts.json', import.meta.url);

const CATEGORIES = {
  'Sans Serif': 'sans-serif',
  Serif: 'serif',
  Display: 'display',
  Handwriting: 'handwriting',
  Monospace: 'monospace',
};

const res = await fetch(SOURCE);
if (!res.ok) throw new Error(`${SOURCE} answered ${res.status}`);
const text = await res.text();
// The feed may start with an XSSI guard (`)]}'`) before the JSON.
const { familyMetadataList } = JSON.parse(text.slice(text.indexOf('{')));

const unknown = new Set();
const fonts = familyMetadataList
  // A bare `css2?family=X` URL asks for weight 400 and answers 400 Bad
  // Request for a family without that face (e.g. Sunflower, Buda) — skip them.
  .filter(({ fonts }) => fonts?.['400'])
  .toSorted((a, b) => a.popularity - b.popularity)
  .map(({ family, category }) => {
    if (!CATEGORIES[category]) unknown.add(category);
    return { family, category: CATEGORIES[category] ?? 'sans-serif' };
  });

if (unknown.size) {
  process.stderr.write(
    `Unknown categories mapped to sans-serif: ${[...unknown].join(', ')}\n`,
  );
}

// One entry per line, in Prettier's style, so refreshes diff cleanly.
const lines = fonts.map((font) => `  ${JSON.stringify(font)}`);
const json = `[\n${lines.join(',\n')}\n]\n`
  .replaceAll('{"family":', '{ "family": ')
  .replaceAll(',"category":', ', "category": ')
  .replaceAll('"}', '" }');
await writeFile(OUTPUT, json);
process.stdout.write(`Wrote ${fonts.length} fonts to ${OUTPUT.pathname}\n`);
