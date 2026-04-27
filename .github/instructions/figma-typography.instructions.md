---
description: "Use when implementing or refining typography from Figma in TechBubble pages/components. Covers exact matching of font size, weight, line-height, letter-spacing, casing, and color for pixel-accurate replicas. Trigger on: figma typography, exact text style, must be identical, font mismatch, heading mismatch."
---

# Figma Typography Rules

## Mandatory Fidelity

- Match Figma text styles exactly for:
  - `fontSize`
  - `fontWeight`
  - `lineHeightPx`
  - `letterSpacing`
  - text color from `fills`
  - casing (uppercase/lowercase/title)
- Do not substitute approximate Tailwind presets when exact values are known.

## Tailwind Mapping

- Use arbitrary values for exact fidelity:
  - `text-[56px]`
  - `leading-[64px]`
  - `tracking-[-0.02em]`
- Weight mapping:
  - 400 -> `font-normal`
  - 500 -> `font-medium`
  - 600 -> `font-semibold`
  - 700 -> `font-bold`

## Color and Contrast

- Use exact hex colors from Figma fills/strokes for text.
- If a heading/subheading uses subtle grays (for example `#666666`, `#838383`, `#e5e5e5`), keep those exact values.
- Avoid replacing exact text colors with generic Tailwind neutrals unless explicitly required.

## Spacing and Wrapping

- Reproduce line breaks if Figma heading is intentionally split.
- Respect measured text block width when heading wraps are part of the design.
- Match label/badge spacing around text using measured frame padding.

## Component-Level Consistency

- In the same selected section, keep consistent style tokens across sibling labels or stat items when Figma uses repeated styles.
- If one item is highlighted/active in Figma, only that item should receive the active text weight/color.

## Common Mistakes to Avoid

- Using `text-4xl`/`text-5xl` when Figma specifies an exact non-scale size.
- Using default `tracking-tight` when explicit letter spacing is provided.
- Using a fully different emphasis hierarchy than the selected Figma node.
- Changing copy text unless the user requested content edits.

## Validation Checklist

- Confirm heading and body text match Figma size and line height.
- Confirm uppercase labels have matching letter spacing.
- Confirm active/inactive text contrast matches the selected node.
- Confirm no typography changes were made outside the selected section.