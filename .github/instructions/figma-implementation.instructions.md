---
description: "Use when implementing a selected Figma section, node, or design. Covers pixel-perfect replication, image usage, layout fidelity, colors, typography, spacing, and interactive states. Apply whenever the user says 'implement selected section', 'must be identical', 'implement from Figma', or 'exact replica'."
---

# Figma Section Implementation Rules

## Mandatory Workflow

1. **Always call `mcp_talktofigma_get_selection` first** to identify the selected node.
2. **Always call `mcp_talktofigma_read_my_design`** to get the full node tree — children, fills, strokes, typography, bounds, cornerRadius.
3. **Read the current file** before editing — never write over unseen code.
4. **Implement only the selected section** — never modify unrelated sections.
5. **Clean build** (`rm -rf .next` + `pnpm --filter @techbubble/web build`) after every implementation to validate.

## Pixel-Perfect Fidelity

- Match `absoluteBoundingBox` dimensions (width, height) exactly where layout allows.
- Match `cornerRadius` exactly: use `rounded-[{n}px]` Tailwind values.
- Match colors exactly from `fills[].color` and `strokes[].color` using hex literals (e.g. `bg-[#111111]`, `border-[#e5e5e5]`).
- Match `fontSize`, `fontWeight`, `lineHeightPx`, `letterSpacing` exactly:
  - Use `text-[{n}px]`, `leading-[{n}px]`, `tracking-[{n}em]` Tailwind arbitrary values.
  - Map `fontWeight` numbers to Tailwind: 400→`font-normal`, 500→`font-medium`, 600→`font-semibold`, 700→`font-bold`.
- Match padding from bounding box differences between parent and child nodes.
- Match gap between siblings from the difference in `absoluteBoundingBox.x` or `.y` values.

## Images

- **Every image node in Figma must use a real exported image asset** — never use colored placeholder divs or background colors as substitutes.
- Image assets live at `@image/techbubble_-_home_{n}.png` or `.jpg` (alias `@image/` → `apps/web/src/image/`).
- Use Next.js `<Image>` with exact `width` and `height` from `absoluteBoundingBox`.
- Add `object-contain` and `h-auto w-auto max-h-full max-w-full` for safe scaling inside fixed containers.
- If the correct image number is unknown, check existing imports in `MarketingHome.tsx` before guessing.

## Interactive / State Elements

- For nav items: match exact active state from Figma strokes/fills (e.g. bordered box, bottom border, underline) — do not invent a pattern.
- For tab/accordion/toggle: preserve existing `useState` wiring; only update the visual treatment to match Figma.
- Active item styling must match the Figma node with `strokes` or differing `fills` vs inactive siblings.

## Animations & Motion

- If a section contains a repeating row of items (logo strip, card carousel): implement as an **infinite CSS marquee** using duplicated array + `translateX(-50%)` keyframe — not a scrollable overflow container.
- Keyframe: `"0%": { transform: "translateX(0)" }`, `"100%": { transform: "translateX(-50%)" }` registered in `tailwind.config.ts` under `theme.extend.keyframes`.

## Typography Mapping

| Figma fontStyle | Tailwind class     |
|-----------------|--------------------|
| Regular         | `font-normal`      |
| Medium          | `font-medium`      |
| SemiBold        | `font-semibold`    |
| Bold            | `font-bold`        |
| uppercase text  | `uppercase tracking-[0.08em]` (check letterSpacing in Figma) |

## Layout Patterns

- Use `tb-container` for the max-width wrapper (already defined globally).
- Use `grid` with exact column counts matching Figma child count.
- Dividers between columns: use `before:` pseudo-element with `before:absolute before:w-px` and color from Figma stroke, positioned using `before:-left-[{gap/2}px]`.
- Section background: always match `fills[0].color` on the section frame exactly.

## Anti-Patterns — Never Do

- Never use placeholder text colors or background blocks where Figma shows an image.
- Never add features, sections, or copy not present in the selected Figma node.
- Never use `rounded-full` when Figma specifies a numeric `cornerRadius` — use `rounded-[{n}px]`.
- Never use `overflow-x-auto` for a logo/card strip — use infinite marquee animation.
- Never change sections outside the currently selected Figma node.
