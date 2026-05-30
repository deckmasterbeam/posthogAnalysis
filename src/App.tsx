import { useState } from "react";
import { computeRankings } from "src/scoring";
import { formatDateTime } from "src/utils";
import { DEFAULT_VISIBLE_COUNT, EXPAND_NEXT_N_COUNT } from "src/constants";
import { useHasNewCommits } from "src/hooks/useHasNewCommits";
import { EngineerCard } from "src/components/EngineerCard";
import { MethodologyPanel } from "src/components/MethodologyPanel";
import rawData from "src/data/github-data.json";

const allEngineers = computeRankings();

const App = () => {
  const since = new Date(rawData.since);
  const fetched = new Date(rawData.fetchedAt);
  const [visibleCount, setVisibleCount] = useState(DEFAULT_VISIBLE_COUNT);
  const hasNewCommits = useHasNewCommits(rawData.fetchedAt);

  const visible = allEngineers.slice(0, visibleCount);
  const hasMore = visibleCount < allEngineers.length;

  return (
    <div className="min-h-screen px-4 py-6 max-w-3xl mx-auto flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight leading-tight">
            PostHog Engineering Impact
          </h1>
          <p className="text-sm opacity-50 mt-0.5">
            {`${allEngineers.length} engineers · ${rawData.prDetails.length} PRs analyzed`}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs opacity-40">
              {formatDateTime(since)} – {formatDateTime(fetched)}
            </p>
            {hasNewCommits && (
              <div className="flex items-center gap-1.5">
                <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  new commits
                </span>
                <button
                  disabled
                  title="Re-fetches GitHub data from the last analysis date to now and refreshes scores. Not yet available in this build."
                  className="text-xs px-2 py-0.5 rounded border border-black/10 dark:border-white/10 opacity-30 cursor-not-allowed"
                >
                  ↻ Update
                </button>
              </div>
            )}
          </div>
        </div>
        <a
          href="https://github.com/PostHog/posthog"
          target="_blank"
          rel="noreferrer"
          className="text-xs opacity-40 hover:opacity-70 transition-opacity mt-1 shrink-0"
        >
          posthog/posthog ↗
        </a>
      </div>

      <MethodologyPanel />

      <div className="flex flex-col gap-3">
        {visible.map((eng, i) => (
          <EngineerCard key={eng.login} eng={eng} rank={i} />
        ))}
      </div>

      {hasMore && (
        <div className="flex gap-2">
          <button
            onClick={() => setVisibleCount((n) => n + EXPAND_NEXT_N_COUNT)}
            className="flex-1 text-sm px-4 py-2 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors opacity-70"
          >
            {`Show next ${Math.min(EXPAND_NEXT_N_COUNT, allEngineers.length - visibleCount)} engineers`}
          </button>
          <button
            onClick={() => setVisibleCount(allEngineers.length)}
            className="text-sm px-4 py-2 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors opacity-70"
          >
            Show all
          </button>
        </div>
      )}

      <footer className="text-center text-xs opacity-30 pb-2">
        {`Scored with the `}
        <a
          href="https://queue.acm.org/detail.cfm?id=3454124"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          SPACE framework
        </a>
        {` · Data fetched ${formatDateTime(fetched)}`}
      </footer>
    </div>
  );
};

export default App;
