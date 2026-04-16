---
name: design-tokens
description: "Reference documentation for three-layer design token architecture (primitive, semantic, component). Educational context for the token system used in src/styles/theme.css."
metadata:
  author: claudekit
  version: "1.0.0"
---

# Design Tokens - Token Architecture Reference

Reference documentation for design token architecture patterns. This project's actual tokens live in `src/styles/theme.css` and are consumed via Tailwind CSS 4's `@theme inline` directive.

These references provide educational context on the three-layer token pattern (primitive, semantic, component) used in the project's CSS variable system.

## When to Use

- Understanding the project's existing token architecture
- Adding new design tokens to `src/styles/theme.css`
- Reviewing token naming conventions and hierarchy
- Extending the design system with new component tokens

This project's tokens are in `src/styles/theme.css`. See `DESIGN.md` Section 2 for values.

## References

| Topic | File |
|-------|------|
| Token Architecture | `references/token-architecture.md` |
| Primitive Tokens | `references/primitive-tokens.md` |
| Semantic Tokens | `references/semantic-tokens.md` |
| Component Tokens | `references/component-tokens.md` |
| States & Variants | `references/states-and-variants.md` |
| Tailwind Integration | `references/tailwind-integration.md` |
