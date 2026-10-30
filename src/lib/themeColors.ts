// Page background per theme, for <meta name="theme-color">. Must equal
// --background in src/styles/theme.css (checked by tokens.test.ts).
export const THEME_COLORS = { dark: "#0b0b0c", light: "#f5f3ee" } as const;

/**
 * BaseHead's two theme-color tags follow the OS scheme through `media`. An
 * explicit light/dark choice needs its own non-media tag, kept in step here.
 */
export function setThemeColor(resolved: "dark" | "light"): void {
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]:not([media])');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }
  meta.content = THEME_COLORS[resolved];
}
