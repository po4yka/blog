const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const LABEL = new RegExp(`^(${MONTHS.join("|")}) (\\d{4})$`);

/** Parses the "Mon YYYY" display label into [year, month index], or null when it has another form. */
export function parseDateLabel(label: string): [number, number] | null {
  const match = LABEL.exec(label);
  return match ? [Number(match[2]), MONTHS.indexOf(match[1]!)] : null;
}

/**
 * The publication day as YYYY-MM-DD: `publishedAt` when the frontmatter has one, else the first day
 * of the "Mon YYYY" label (a `date` already in YYYY-MM-DD form is used as is). Sort and date by
 * this, never by the label: `new Date("Jun 2026")` parses in local time, and the label alone cannot
 * order two posts of one month.
 */
export function postIsoDate(data: { date: string; publishedAt?: Date | string }): string | null {
  const { publishedAt } = data;
  if (publishedAt) {
    const parsed = publishedAt instanceof Date ? publishedAt : new Date(publishedAt);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(data.date)) return data.date;
  const parts = parseDateLabel(data.date);
  if (!parts) return null;
  return `${parts[0]}-${String(parts[1] + 1).padStart(2, "0")}-01`;
}

/** Newest first; posts of one day keep a stable order by slug. */
export function compareNewestFirst(a: { isoDate: string; slug: string }, b: { isoDate: string; slug: string }): number {
  return b.isoDate.localeCompare(a.isoDate) || a.slug.localeCompare(b.slug);
}
