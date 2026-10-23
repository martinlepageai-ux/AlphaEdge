import type { DataProvider, Opportunity, Pick } from "./types";
import { SEED_OPPORTUNITIES, SEED_PICKS, SEED_SNAPSHOT_AT, assertSeedIntegrity } from "~/lib/data/seed";

/**
 * Mock adapter. Reads the static fixtures and returns deep copies so no caller
 * can mutate the shared dataset.
 *
 * To go live: implement `DataProvider` against Sportradar / The Odds API /
 * Postgres and change `activeProvider` in `./index.ts`. Nothing else moves.
 */
export const mockProvider: DataProvider = {
  id: "mock-fixtures",
  label: "Sample dataset",
  isDemonstration: true,
  async getSnapshotAt() {
    return SEED_SNAPSHOT_AT;
  },
  async getOpportunities(): Promise<Opportunity[]> {
    assertSeedIntegrity();
    return SEED_OPPORTUNITIES.map((o) => ({ ...o, lineHistory: [...o.lineHistory] }));
  },
  async getPicks(): Promise<Pick[]> {
    assertSeedIntegrity();
    return SEED_PICKS.map((p) => ({ ...p }));
  },
};
