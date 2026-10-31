export const WEEKS = 13; // ~3 months
export const DAYS_PER_WEEK = 7;
export const TOTAL_DAYS = WEEKS * DAYS_PER_WEEK;
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

/** YYYY-MM-DD in the visitor's time zone, so a cell's key matches its label. */
export function localDayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function shortDay(d: Date): string {
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export interface DayCell {
  date: string; // YYYY-MM-DD, local
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
  label: string; // "MAR 14"
  future: boolean;
}

/** 13 weeks of days, Sunday-first columns, ending on the Saturday of this week.
 *  Days after today are kept as `future` so the columns stay whole. */
export function buildCalendar(events: Array<{ created_at: string }>, now = new Date()): DayCell[] {
  const counts = new Map<string, number>();
  for (const event of events) {
    const key = localDayKey(new Date(event.created_at));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const last = new Date(today);
  last.setDate(last.getDate() + (DAYS_PER_WEEK - 1 - today.getDay()));

  const cells: DayCell[] = [];
  for (let i = TOTAL_DAYS - 1; i >= 0; i--) {
    const d = new Date(last);
    d.setDate(d.getDate() - i);
    const date = localDayKey(d);
    cells.push({
      date,
      count: counts.get(date) ?? 0,
      level: 0,
      label: shortDay(d),
      future: d > today,
    });
  }

  const max = Math.max(1, ...cells.map((c) => c.count));
  for (const cell of cells) {
    if (cell.count === 0) cell.level = 0;
    else if (cell.count <= max * 0.25) cell.level = 1;
    else if (cell.count <= max * 0.5) cell.level = 2;
    else if (cell.count <= max * 0.75) cell.level = 3;
    else cell.level = 4;
  }
  return cells;
}
