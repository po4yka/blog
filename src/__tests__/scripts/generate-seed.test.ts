import { describe, expect, it } from "vitest";
import { CONTENT_TABLES, generateSeedSource } from "../../../scripts/generate-seed";

describe("generateSeedSource", () => {
  const sql = generateSeedSource();

  it("deletes every content table before the first insert", () => {
    const firstInsert = sql.indexOf("INSERT INTO");
    for (const table of CONTENT_TABLES) {
      const at = sql.indexOf(`DELETE FROM ${table};`);
      expect(at, table).toBeGreaterThan(-1);
      expect(at, table).toBeLessThan(firstInsert);
    }
  });

  it("does not touch auth tables", () => {
    expect(sql).not.toMatch(/DELETE FROM (admin_|login_|passkey)/);
  });
});
