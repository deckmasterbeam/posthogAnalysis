import { describe, it, expect } from "vitest";
import rawData from "src/data/github-data.json";

// Validates the structure of the committed github-data.json produced by scripts/fetch-data.ts

describe("fetch-data output (github-data.json)", () => {
  it("has required top-level fields", () => {
    expect(rawData).toHaveProperty("fetchedAt");
    expect(rawData).toHaveProperty("since");
    expect(rawData).toHaveProperty("prDetails");
    expect(rawData).toHaveProperty("issuesByCloser");
  });

  it("fetchedAt and since are valid ISO date strings", () => {
    expect(isNaN(new Date(rawData.fetchedAt).getTime())).toBe(false);
    expect(isNaN(new Date(rawData.since).getTime())).toBe(false);
  });

  it("since is before fetchedAt", () => {
    expect(new Date(rawData.since).getTime()).toBeLessThan(new Date(rawData.fetchedAt).getTime());
  });

  it("prDetails is a non-empty array", () => {
    expect(Array.isArray(rawData.prDetails)).toBe(true);
    expect(rawData.prDetails.length).toBeGreaterThan(0);
  });

  it("every PR has required fields with correct types", () => {
    for (const pr of rawData.prDetails) {
      expect(typeof pr.number).toBe("number");
      expect(typeof pr.author).toBe("string");
      expect(pr.author).toBeTruthy();
      expect(typeof pr.authorAvatar).toBe("string");
      expect(typeof pr.title).toBe("string");
      expect(typeof pr.mergedAt).toBe("string");
      expect(typeof pr.createdAt).toBe("string");
      expect(typeof pr.additions).toBe("number");
      expect(typeof pr.deletions).toBe("number");
      expect(typeof pr.changedFiles).toBe("number");
      expect(Array.isArray(pr.labels)).toBe(true);
      expect(Array.isArray(pr.reviews)).toBe(true);
      expect(typeof pr.reviewCommentCount).toBe("number");
      expect(typeof pr.requestChangesCount).toBe("number");
    }
  });

  it("every PR has mergedAt after createdAt", () => {
    for (const pr of rawData.prDetails) {
      expect(new Date(pr.mergedAt).getTime()).toBeGreaterThan(new Date(pr.createdAt).getTime());
    }
  });

  it("every PR's mergedAt is within the analysis window", () => {
    const since = new Date(rawData.since).getTime();
    const fetchedAt = new Date(rawData.fetchedAt).getTime();
    for (const pr of rawData.prDetails) {
      const merged = new Date(pr.mergedAt).getTime();
      expect(merged).toBeGreaterThanOrEqual(since);
      expect(merged).toBeLessThanOrEqual(fetchedAt);
    }
  });

  it("every review has required fields", () => {
    for (const pr of rawData.prDetails) {
      for (const review of pr.reviews) {
        expect(typeof review.reviewer).toBe("string");
        expect(review.reviewer).toBeTruthy();
        expect(typeof review.state).toBe("string");
        expect(typeof review.submittedAt).toBe("string");
      }
    }
  });

  it("no PR author is a reviewer on their own PR", () => {
    for (const pr of rawData.prDetails) {
      for (const review of pr.reviews) {
        expect(review.reviewer).not.toBe(pr.author);
      }
    }
  });

  it("issuesByCloser maps strings to numbers", () => {
    for (const [login, count] of Object.entries(rawData.issuesByCloser)) {
      expect(typeof login).toBe("string");
      expect(typeof count).toBe("number");
      expect(count).toBeGreaterThan(0);
    }
  });
});
