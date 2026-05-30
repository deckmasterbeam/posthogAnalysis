import { readFileSync } from "fs";
import { join } from "path";

const dataPath = join(new URL(".", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"), "../src/data/github-data.json");

let data: unknown;
try {
  data = JSON.parse(readFileSync(dataPath, "utf8"));
} catch {
  console.error(`FAIL  Could not read or parse ${dataPath}`);
  process.exit(1);
}

type Check = { label: string; pass: boolean; detail?: string };
const checks: Check[] = [];

const check = (label: string, condition: boolean, detail?: string) => {
  checks.push({ label, pass: condition, detail });
};

const d = data as Record<string, unknown>;

// Top-level shape
check("has fetchedAt field", typeof d.fetchedAt === "string");
check("has since field", typeof d.since === "string");
check("has prDetails array", Array.isArray(d.prDetails));
check("has issuesByCloser object", typeof d.issuesByCloser === "object" && !Array.isArray(d.issuesByCloser));

const fetchedAt = new Date(d.fetchedAt as string);
const since = new Date(d.since as string);
check("fetchedAt is valid date", !isNaN(fetchedAt.getTime()));
check("since is valid date", !isNaN(since.getTime()));
check("since is before fetchedAt", since.getTime() < fetchedAt.getTime());

const windowDays = (fetchedAt.getTime() - since.getTime()) / (1000 * 60 * 60 * 24);
check("analysis window is ~90 days", windowDays >= 85 && windowDays <= 95, `${windowDays.toFixed(1)} days`);

if (Array.isArray(d.prDetails)) {
  const prs = d.prDetails as Record<string, unknown>[];

  check("prDetails is non-empty", prs.length > 0, `${prs.length} PRs`);

  const requiredPRFields = ["number", "author", "authorAvatar", "title", "mergedAt", "createdAt", "additions", "deletions", "changedFiles", "labels", "reviews", "reviewCommentCount", "requestChangesCount"];
  const missingFields = new Set<string>();
  let badDates = 0;
  let selfReviews = 0;
  let outOfWindow = 0;

  for (const pr of prs) {
    for (const field of requiredPRFields) {
      if (!(field in pr)) missingFields.add(field);
    }
    if (typeof pr.mergedAt === "string" && typeof pr.createdAt === "string") {
      if (new Date(pr.mergedAt).getTime() <= new Date(pr.createdAt).getTime()) badDates++;
    }
    if (typeof pr.mergedAt === "string") {
      const merged = new Date(pr.mergedAt).getTime();
      if (merged < since.getTime() || merged > fetchedAt.getTime()) outOfWindow++;
    }
    if (Array.isArray(pr.reviews)) {
      for (const review of pr.reviews as Record<string, unknown>[]) {
        if (review.reviewer === pr.author) selfReviews++;
      }
    }
  }

  check("all PRs have required fields", missingFields.size === 0, missingFields.size > 0 ? `missing: ${[...missingFields].join(", ")}` : undefined);
  check("all PRs have mergedAt > createdAt", badDates === 0, badDates > 0 ? `${badDates} violations` : undefined);
  check("all PRs are within the analysis window", outOfWindow === 0, outOfWindow > 0 ? `${outOfWindow} out of window` : undefined);
  check("no PR author appears as their own reviewer", selfReviews === 0, selfReviews > 0 ? `${selfReviews} self-reviews` : undefined);

  const uniqueAuthors = new Set(prs.map((p) => p.author as string));
  check("at least 10 unique PR authors", uniqueAuthors.size >= 10, `${uniqueAuthors.size} authors`);
}

if (typeof d.issuesByCloser === "object" && d.issuesByCloser !== null) {
  const badEntries = Object.entries(d.issuesByCloser as Record<string, unknown>).filter(([, v]) => typeof v !== "number" || (v as number) <= 0);
  check("issuesByCloser values are positive numbers", badEntries.length === 0, badEntries.length > 0 ? `${badEntries.length} bad entries` : undefined);
}

// Print results
const passed = checks.filter((c) => c.pass);
const failed = checks.filter((c) => !c.pass);

for (const c of checks) {
  const icon = c.pass ? "✓" : "✗";
  const detail = c.detail ? `  (${c.detail})` : "";
  console.log(`  ${icon}  ${c.label}${detail}`);
}

console.log(`\n${passed.length}/${checks.length} checks passed`);

if (failed.length > 0) {
  console.error(`\nFailed checks:`);
  for (const c of failed) {
    console.error(`  ✗  ${c.label}${c.detail ? `  (${c.detail})` : ""}`);
  }
  process.exit(1);
}
