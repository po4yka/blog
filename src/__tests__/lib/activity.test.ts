import { describe, expect, it } from "vitest";
import { buildCalendar, localDayKey, TOTAL_DAYS } from "@/lib/activity";

describe("buildCalendar", () => {
  // Wednesday 2026-10-28, local time.
  const now = new Date(2026, 9, 28, 15, 0);

  it("covers WEEKS whole Sunday-first weeks ending this Saturday, with later days marked future", () => {
    const cells = buildCalendar([], now);
    expect(cells).toHaveLength(TOTAL_DAYS);
    expect(new Date(`${cells[0]!.date}T12:00`).getDay()).toBe(0);
    expect(cells.at(-1)!.date).toBe("2026-10-31");
    expect(cells.filter((c) => c.future).map((c) => c.date)).toEqual(["2026-10-29", "2026-10-30", "2026-10-31"]);
    expect(cells.findLast((c) => !c.future)!.label).toBe("OCT 28");
  });

  it("places each day's count on its date and ranks levels against the busiest day", () => {
    const cells = buildCalendar([{ date: "2026-10-27", count: 2 }, { date: "2026-10-26", count: 4 }], now);
    const byDate = (date: string) => cells.find((c) => c.date === date)!;
    expect(byDate("2026-10-27")).toMatchObject({ count: 2, level: 2 });
    expect(byDate("2026-10-26")).toMatchObject({ count: 4, level: 4 });
    expect(byDate("2026-10-25")).toMatchObject({ count: 0, level: 0 });
  });

  it("formats local day keys with zero padding", () => {
    expect(localDayKey(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });
});
