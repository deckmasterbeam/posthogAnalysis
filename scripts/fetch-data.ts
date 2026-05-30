import { Octokit } from "octokit";
import { writeFileSync } from "fs";
import { join } from "path";
import { config } from "dotenv";

config({ path: new URL("../.env", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1") });

const OWNER = "PostHog";
const REPO = "posthog";
const DAYS = 90;
const SINCE = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000).toISOString();

const token = process.env.GITHUB_TOKEN;
if (!token) {
  console.error("GITHUB_TOKEN is not set — add it to .env");
  process.exit(1);
}

const octokit = new Octokit({ auth: token });

const paginate = async <T>(fn: (page: number) => Promise<T[]>): Promise<T[]> => {
  const results: T[] = [];
  let page = 1;
  while (true) {
    const batch = await fn(page);
    results.push(...batch);
    if (batch.length < 100) break;
    page++;
  }
  return results;
};

const main = async () => {
  console.log(`Fetching data since ${SINCE} ...`);

  // 1. Fetch all merged PRs in the window
  console.log("Fetching merged PRs...");
  // Sort by created desc so we can stop once created_at falls before SINCE.
  // Sorting by "updated" is unreliable — old PRs resurface when bots comment on them.
  const allPRs = await paginate(async (page) => {
    const { data } = await octokit.rest.pulls.list({
      owner: OWNER,
      repo: REPO,
      state: "closed",
      sort: "created",
      direction: "desc",
      per_page: 100,
      page,
    });
    const inWindow = data.filter((pr) => pr.merged_at && pr.merged_at >= SINCE);
    // Stop once the oldest PR on this page was created before our window
    const oldest = data[data.length - 1];
    if (oldest && oldest.created_at < SINCE) return inWindow;
    return inWindow;
  });

  console.log(`Found ${allPRs.length} merged PRs`);

  // 2. For each PR fetch reviews + full stats
  const prDetails: {
    number: number;
    author: string;
    authorAvatar: string;
    title: string;
    mergedAt: string;
    createdAt: string;
    additions: number;
    deletions: number;
    changedFiles: number;
    labels: string[];
    reviews: { reviewer: string; state: string; submittedAt: string }[];
    reviewCommentCount: number;
    requestChangesCount: number;
  }[] = [];

  for (let i = 0; i < allPRs.length; i++) {
    const pr = allPRs[i];
    if (!pr.user || pr.user.type === "Bot") continue;

    if (i % 20 === 0) console.log(`  Processing PR ${i + 1}/${allPRs.length}...`);

    const [{ data: reviews }, { data: prFull }] = await Promise.all([
      octokit.rest.pulls.listReviews({ owner: OWNER, repo: REPO, pull_number: pr.number }),
      octokit.rest.pulls.get({ owner: OWNER, repo: REPO, pull_number: pr.number }),
    ]);

    const filteredReviews = reviews
      .filter((r) => r.user && r.user.type !== "Bot" && r.user.login !== pr.user!.login)
      .map((r) => ({
        reviewer: r.user!.login,
        state: r.state,
        submittedAt: r.submitted_at ?? "",
      }));

    prDetails.push({
      number: pr.number,
      author: pr.user.login,
      authorAvatar: pr.user.avatar_url,
      title: pr.title,
      mergedAt: pr.merged_at!,
      createdAt: pr.created_at,
      additions: prFull.additions,
      deletions: prFull.deletions,
      changedFiles: prFull.changed_files,
      labels: pr.labels.map((l) => l.name),
      reviews: filteredReviews,
      reviewCommentCount: prFull.review_comments,
      requestChangesCount: filteredReviews.filter((r) => r.state === "CHANGES_REQUESTED").length,
    });
  }

  // 3. Fetch closed issues in window (assignee as proxy for closer)
  console.log("Fetching closed issues...");
  const issues = await paginate(async (page) => {
    const { data } = await octokit.rest.issues.listForRepo({
      owner: OWNER,
      repo: REPO,
      state: "closed",
      since: SINCE,
      per_page: 100,
      page,
    });
    return data.filter(
      (issue) =>
        !issue.pull_request &&
        issue.user?.type !== "Bot" &&
        issue.closed_at &&
        issue.closed_at >= SINCE
    );
  });

  const issuesByCloser: Record<string, number> = {};
  for (const issue of issues) {
    if (issue.assignee && issue.assignee.type !== "Bot") {
      issuesByCloser[issue.assignee.login] = (issuesByCloser[issue.assignee.login] ?? 0) + 1;
    }
  }

  const output = {
    fetchedAt: new Date().toISOString(),
    since: SINCE,
    prDetails,
    issuesByCloser,
  };

  const outPath = join(
    new URL(".", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"),
    "../src/data/github-data.json"
  );
  writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`\nDone. Wrote ${prDetails.length} PRs to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
