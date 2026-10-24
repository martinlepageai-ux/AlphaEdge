import { describe, expect, test } from "bun:test";
import { averageDecimalOdds, breakevenWinRateForPicks, summarizePicks, pickProfitUnits, americanToDecimal } from "../src/lib/odds";
import { assertSeedIntegrity, SEED_PICKS } from "../src/lib/data/seed";

describe("stake-weighted implied probability", () => {
  test("weights each implied probability, not the reciprocal of an average price", () => {
    const rows = [{ odds: -200, units: 3 }, { odds: 200, units: 1 }];
    expect(breakevenWinRateForPicks(rows)).toBeCloseTo(7 / 12, 12);
    expect(breakevenWinRateForPicks(rows)).not.toBeCloseTo(1 / averageDecimalOdds(rows.map(r => r.odds)), 6);
    expect(breakevenWinRateForPicks(rows.map(r => ({ ...r, units: r.units * 7 })))).toBeCloseTo(7 / 12, 12);
  });
  test("equal odds keep their implied probability and an empty set is undefined", () => {
    expect(breakevenWinRateForPicks([{ odds: -110, units: 1 }, { odds: -110, units: 4 }])).toBeCloseTo(11 / 21, 12);
    expect(breakevenWinRateForPicks([])).toBeNaN();
  });
  test("summary preserves push grading and computes actual profit separately", () => {
    const result = summarizePicks([
      { grade: "win", odds: -200, units: 3 },
      { grade: "loss", odds: 200, units: 1 },
      { grade: "push", odds: -110, units: 2 },
    ]);
    expect(result.winRate).toBe(0.5);
    expect(result.unitsNet).toBeCloseTo(0.5, 12);
    expect(result.roi).toBeCloseTo(0.5 / 6, 12);
    expect(result.breakevenWinRate).toBeCloseTo((2 + 1 / 3 + 22 / 21) / 6, 12);
    expect(pickProfitUnits("push", -110, 2)).toBe(0);
    expect(americanToDecimal(0)).toBeNaN();
  });
  test("demonstration fixtures still satisfy their invariants", () => {
    expect(() => assertSeedIntegrity()).not.toThrow();
    expect(summarizePicks(SEED_PICKS).picks).toBe(SEED_PICKS.length);
  });
});
