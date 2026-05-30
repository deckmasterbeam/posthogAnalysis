import { describe, it, expect } from "vitest";
import { computeRankings } from "src/scoring";

const rankings = computeRankings();

describe("computeRankings", () => {
  it("returns a non-empty ranked list", () => {
    expect(rankings.length).toBeGreaterThan(0);
  });

  it("is sorted by composite score descending", () => {
    for (let i = 1; i < rankings.length; i++) {
      expect(rankings[i].scores.composite).toBeLessThanOrEqual(rankings[i - 1].scores.composite);
    }
  });

  it("all scores are in 0–100 range", () => {
    const dimensions = [
      "satisfaction",
      "performance",
      "activity",
      "collaboration",
      "efficiency",
      "composite",
    ] as const;
    for (const eng of rankings) {
      for (const dim of dimensions) {
        expect(eng.scores[dim], `${eng.login}.${dim}`).toBeGreaterThanOrEqual(0);
        expect(eng.scores[dim], `${eng.login}.${dim}`).toBeLessThanOrEqual(100);
      }
    }
  });

  it("no duplicate logins", () => {
    const logins = rankings.map((e) => e.login);
    expect(new Set(logins).size).toBe(logins.length);
  });

  it("top 5 logins and composite scores match snapshot", () => {
    const top5 = rankings
      .slice(0, 5)
      .map((e) => ({ login: e.login, composite: e.scores.composite }));
    expect(top5).toMatchSnapshot();
  });

  it("each engineer has a non-empty login and avatarUrl", () => {
    for (const eng of rankings) {
      expect(eng.login).toBeTruthy();
      expect(eng.avatarUrl).toMatch(/^https:\/\//);
    }
  });
});
