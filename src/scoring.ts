import rawData from "src/data/github-data.json";
import type { PRDetail, EngineerMetrics } from "src/types";
import { median, hoursBetween, normalize } from "src/utils";

export const computeRankings = (): EngineerMetrics[] => {
  const prs = rawData.prDetails as PRDetail[];

  const reviewedPRs: Record<string, PRDetail[]> = {};
  for (const pr of prs) {
    for (const review of pr.reviews) {
      if (!reviewedPRs[review.reviewer]) reviewedPRs[review.reviewer] = [];
      reviewedPRs[review.reviewer].push(pr);
    }
  }

  const allLogins = new Set([...prs.map((p) => p.author), ...Object.keys(reviewedPRs)]);

  const avatarMap: Record<string, string> = {};
  for (const pr of prs) avatarMap[pr.author] = pr.authorAvatar;

  const since = new Date(rawData.since);
  const now = new Date(rawData.fetchedAt);
  const totalWeeks = Math.ceil((now.getTime() - since.getTime()) / (7 * 24 * 3_600_000));

  const rawMetrics: Omit<EngineerMetrics, "scores">[] = [];

  for (const login of allLogins) {
    const authored = prs.filter((p) => p.author === login);
    const reviewed = reviewedPRs[login] ?? [];

    const prsAuthored = authored.length;
    const prsReviewed = reviewed.length;

    const uniqueAuthorsReviewed = new Set(reviewed.map((p) => p.author)).size;
    const reviewCommentsGiven = reviewed.reduce(
      (sum, pr) => sum + pr.reviews.filter((r) => r.reviewer === login).length,
      0
    );

    const medianCycleTimeHours = median(authored.map((p) => hoursBetween(p.createdAt, p.mergedAt)));

    const turnaroundTimes: number[] = [];
    for (const pr of reviewed) {
      const theirReview = pr.reviews.find((r) => r.reviewer === login);
      if (theirReview?.submittedAt) {
        const hours = hoursBetween(pr.createdAt, theirReview.submittedAt);
        if (hours >= 0) turnaroundTimes.push(hours);
      }
    }
    const medianReviewTurnaroundHours = median(turnaroundTimes);

    const cleanMergeRate =
      prsAuthored === 0
        ? 0
        : authored.filter((p) => p.requestChangesCount === 0).length / prsAuthored;

    const activeWeeks = new Set<number>();
    for (const pr of authored) {
      activeWeeks.add(
        Math.floor((new Date(pr.mergedAt).getTime() - since.getTime()) / (7 * 24 * 3_600_000))
      );
    }
    for (const pr of reviewed) {
      const review = pr.reviews.find((r) => r.reviewer === login);
      if (review?.submittedAt) {
        activeWeeks.add(
          Math.floor(
            (new Date(review.submittedAt).getTime() - since.getTime()) / (7 * 24 * 3_600_000)
          )
        );
      }
    }
    const weeklyConsistency = activeWeeks.size / totalWeeks;

    rawMetrics.push({
      login,
      avatarUrl: avatarMap[login] ?? `https://github.com/${login}.png`,
      prsAuthored,
      prsReviewed,
      uniqueAuthorsReviewed,
      reviewCommentsGiven,
      medianCycleTimeHours,
      medianReviewTurnaroundHours,
      cleanMergeRate,
      weeklyConsistency,
    });
  }

  const get = <K extends keyof Omit<EngineerMetrics, "scores" | "login" | "avatarUrl">>(key: K) =>
    rawMetrics.map((m) => m[key] as number);

  const normActivity = normalize(rawMetrics.map((m) => m.prsAuthored + m.prsReviewed));
  const normPerformance = normalize(get("cleanMergeRate"));
  const normCollaboration = normalize(
    rawMetrics.map((m) => m.uniqueAuthorsReviewed + m.reviewCommentsGiven * 0.5)
  );
  const normEfficiencyCycle = normalize(get("medianCycleTimeHours"), true);
  const normEfficiencyTurnaround = normalize(
    get("medianReviewTurnaroundHours").map((v, i) => (rawMetrics[i].prsReviewed === 0 ? 0 : v)),
    true
  );
  const normEfficiency = normEfficiencyCycle.map((v, i) => (v + normEfficiencyTurnaround[i]) / 2);
  const normSatisfaction = normalize(get("weeklyConsistency"));

  const results: EngineerMetrics[] = rawMetrics.map((m, i) => ({
    ...m,
    scores: {
      satisfaction: Math.round(normSatisfaction[i]),
      performance: Math.round(normPerformance[i]),
      activity: Math.round(normActivity[i]),
      collaboration: Math.round(normCollaboration[i]),
      efficiency: Math.round(normEfficiency[i]),
      composite: Math.round(
        (normSatisfaction[i] +
          normPerformance[i] +
          normActivity[i] +
          normCollaboration[i] +
          normEfficiency[i]) /
          5
      ),
    },
  }));

  return results.sort((a, b) => b.scores.composite - a.scores.composite);
};
