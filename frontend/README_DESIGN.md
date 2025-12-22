Design Tokens & Tailwind Guidance

Files added:
- `design-tokens.json` — canonical design tokens (colors, typography, spacing, elevation, motion).
- `tailwind.tokens.js` — example mapping showing how to extend Tailwind theme using tokens.

How to use
1. Wire tokens into `tailwind.config.js` by importing `tailwind.tokens.js` and merging its `theme.extend` values.

Example (in `tailwind.config.js`):

```js
const tokenExt = require('./tailwind.tokens.js').theme.extend;
module.exports = {
  // ... existing config
  theme: {
    extend: {
      ...tokenExt
    }
  }
}
```

Developer Handoff
- Provide `design-tokens.json` to frontend devs; they can generate CSS variables or directly map tokens into Tailwind.
- Use `globals.css` to expose CSS variables (already added).
- Motion tokens are expressed in `design-tokens.json`; use them for animation durations/eases.

Next steps I can take for you:
- Inject token mappings directly into `tailwind.config.js` and run a dev build to verify styles.
- Scaffold a polished `Diagnostic` page CSS using the tokens and add animations (capture → result reveal).

Which should I do next?