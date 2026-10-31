/** Ids of elements inside `main` on the current page (headings only), without duplicates, in document order. */
export function getSectionIds(root: ParentNode = document): string[] {
  const ids = Array.from(root.querySelectorAll<HTMLElement>("main :is(h1,h2,h3,h4,h5,h6)[id]"), (el) => el.id);
  return [...new Set(ids)];
}
