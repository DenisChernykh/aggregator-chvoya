# Agent Instructions

## Project Family Workflow

This project belongs to a family of very similar landing projects, including
`edges` and `needles`. Do not treat each new project or Figma section as a
from-scratch implementation.

When the user asks to implement or adapt a Figma block/section, first compare it
with the current project structure and only then choose the smallest fitting
change.

## Required Preflight For Sections

Before editing a section, do this analysis:

1. Identify the matching existing section, component, or shared pattern in:
   - `templates/sections/`
   - `templates/components/`
   - `assets/scss/sections/`
   - `assets/scss/components/`
   - `assets/js/modules/`
2. Compare the Figma block with the current implementation:
   - DOM structure and content slots
   - section grid and responsive behavior
   - reusable controls: buttons, slider arrows, pagination, links, social icons
   - typography scale and semantic tokens
   - JS behavior and existing `data-*` hooks
3. Classify each difference as one of:
   - token/theme update
   - shared component variant
   - section modifier
   - new section or component
4. Tell the user the conclusion briefly before or while making changes.

## Decision Rules

- Do not rewrite a section when the existing markup and behavior are still the
  same.
- Prefer Figma tokens and semantic CSS variables for colors and global visual
  language.
- Put repeated control styling into shared component classes, such as `.button`,
  `.slider-arrow`, `.link-action`, or `.social-link`.
- Use classes for styling variants. Reserve `data-*` attributes for behavior and
  JS hooks.
- Prefer semantic variant names over project names. For example, use a name that
  describes the visual or structural difference, not `--hvoya` or `--grani`,
  unless the difference is truly brand-specific.
- Add a section modifier only when the same section needs a small layout or
  visual variant.
- Create a new section/component only when the DOM structure, content model, or
  behavior is materially different.
- Keep generated token artifacts generated. Do not hand-edit generated token CSS
  or JSON unless the user explicitly asks for emergency local repair.
- Preserve existing contextual copy unless the user explicitly asks to rewrite
  texts or rename the brand.

## Verification

For UI changes, run the narrowest meaningful checks:

- `npm run build`
- browser or Playwright smoke-check for the changed section on desktop and
  mobile
- no horizontal overflow on mobile
- controls still work with the existing `data-*` hooks

If Figma context is required but unavailable, stop and report the blocker instead
of approximating the design.
