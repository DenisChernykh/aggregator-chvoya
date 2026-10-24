# Section Migration Workflow

Use this workflow when adapting a section from one project in the family to
another, for example from `edges` / `Грани` to `needles` / `Хвоя`.

The goal is not to rebuild every section. The goal is to compare, classify the
differences, and make the smallest durable change that will still work for the
next similar project.

## Preflight Checklist

Before writing code, inspect the current project:

- Existing markup in `templates/sections/` and `templates/components/`
- Existing section styles in `assets/scss/sections/`
- Shared UI styles in `assets/scss/components/`
- Existing behavior in `assets/js/modules/`
- Current token pipeline in `assets/tokens*.json`,
  `assets/tokens/`, and `assets/scss/generated-tokens.scss`

Then compare the target Figma block with the existing implementation:

- Is the section order and DOM structure the same?
- Are the same content slots present?
- Are the same sliders, modals, tabs, accordions, or forms used?
- Do buttons, arrows, pagination, links, and social icons already have a shared
  component class?
- Are differences mostly colors, fonts, radii, spacing, or responsive values?
- Does the difference affect only this section, or many sections?

## Decision Matrix

### Token Or Theme Update

Use this when the difference is global or semantic:

- brand color
- text color
- background color
- border color
- base typography family
- common radius or surface language

Prefer semantic CSS variables such as `--brand-solid`, `--bg-default`,
`--text-fg_default`, and `--border-default`.

Do not solve a token-level difference by hardcoding values inside a section.

### Shared Component Variant

Use this when the same visual pattern appears in multiple places:

- primary buttons
- outline buttons
- CTA arrows
- slider arrows
- pagination bullets
- social links
- icon buttons

Shared component styling belongs in `assets/scss/components/`. Sections should
keep only placement and local layout.

Use classes for visual variants. Keep `data-*` attributes for behavior.

### Section Modifier

Use this when the section is structurally the same but has a bounded visual or
layout difference:

- slightly different header alignment
- different card density
- additional badge or label
- different media ratio
- different mobile order while keeping the same content model

Prefer semantic modifier names that describe the variant:

```html
<section class="rooms rooms--compact">
```

Avoid project-name modifiers unless the variant cannot be described otherwise.

### New Section Or Component

Create a new section or component only when the difference is material:

- different DOM hierarchy
- different content model
- different interaction behavior
- different slider/modal/form contract
- existing markup would need awkward conditionals to fit

If a new section is needed, still reuse shared controls and existing JS helpers
where possible.

## Analysis Format

For Figma-to-project section tasks, provide a short analysis before the final
implementation decision:

```md
Analysis:
- Existing match: `templates/sections/section-rooms.html`
- Same: slider behavior, card content slots, modal trigger contract
- Different: button icon, card radius, title scale, mobile spacing
- Decision: shared `.button` variant + section modifier; no new section
```

## Guardrails

- Do not rewrite sections just to match a new brand.
- Do not duplicate modal shells or slider logic when existing contracts already
  fit.
- Do not introduce brand-specific class names for generic visual differences.
- Do not change content or brand text unless that is part of the task.
- Do not hand-edit generated token files as normal workflow.
- Do not remove existing `data-*` behavior hooks unless the JS contract is being
  intentionally changed.

## Verification

After implementation, run:

```bash
npm run build
```

For visual changes, also check the changed section in a browser or Playwright:

- desktop viewport
- mobile viewport
- no horizontal overflow
- controls still work
- no obvious text overflow after font or spacing changes
