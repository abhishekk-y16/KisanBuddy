Design system & implementation notes

Overview

This project uses a compact design system optimized for clarity, accessibility, and quick implementation with Tailwind CSS and React components. The deliverables added/updated in this change set:

- `tailwind.tokens.js`: small token file consumed by `tailwind.config.js`.
- `ResultHeaderCard.tsx`: updated for improved hierarchy, responsive layout, and accessibility.

Design Tokens

- Spacing: 8pt baseline scale (tokens map to px in `tailwind.tokens.js`)
- Typography: base 16px, H2/H3 stacks, use `font-extrabold` for major headings
- Colors: `interactive` (primary), `surface`, `danger`, `success`, `warn` tokens

Component guidance

- Buttons: use `variant` prop to select visual style (`primary`, `secondary`, `ghost`, `danger`). Provide `loading` and `disabled` states.
- Card: `variant` prop for subtle elevation and `padding` control.
- ResultHeaderCard: prominent summary that surfaces `crop`, `diagnosis`, `confidence`, and CTAs.

Developer notes

- Environment: use `NEXT_PUBLIC_API_URL` for backend calls.
- Accessibility: use `role` and `aria-label` for dynamic regions; ensure focus-visible rules are present.
- Motion: respect `prefers-reduced-motion`.

Next steps (recommended)

1. Wire tokens into `tailwind.config.js` further as necessary (colors, radii, shadows).
2. Update `DiagnosticModal` to use the bold heading styles and expose clear section headings: Symptoms, Treatment, Immediate Actions, Organic Remedies, Future Prevention.
3. Add `ServiceWarning` and `ImageUploader` component improvements (progress & accessibility).

If you want, I can now:
- Update `DiagnosticModal.tsx` headings to the bold/large styles and make sections collapsible.
- Add a `ServiceWarning` component and wire it into `chat.tsx` and `DiagnosticModal`.
- Generate a small Figma token sheet (JSON) for handoff.

Tell me which of those you'd like next and I'll implement it.
