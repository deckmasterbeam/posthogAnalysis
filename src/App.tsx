import { useState } from "react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { computeRankings } from "src/scoring";
import type { EngineerMetrics } from "src/types";
import { DIMENSION_COLORS, DIMENSION_LABELS, RANK_COLORS, RANK_LABELS } from "src/constants";
import { formatHours, formatDateTime } from "src/utils";
import rawData from "src/data/github-data.json";

const top5 = computeRankings();

const DimensionBar = ({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) => (
  <div className="flex items-center gap-2 text-sm">
    <span className="w-24 shrink-0 text-xs text-right opacity-60">{label}</span>
    <div className="flex-1 h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${value}%`, backgroundColor: color }}
      />
    </div>
    <span className="w-8 text-xs font-mono opacity-80">{value}</span>
  </div>
);

const StatPill = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col items-center px-3 py-1.5 rounded-lg bg-black/5 dark:bg-white/5 min-w-[72px]">
    <span className="text-xs opacity-50 leading-tight">{label}</span>
    <span className="text-sm font-semibold leading-tight mt-0.5">{value}</span>
  </div>
);

const EngineerCard = ({ eng, rank }: { eng: EngineerMetrics; rank: number }) => {
  const [expanded, setExpanded] = useState(false);

  const radarData = Object.entries(DIMENSION_LABELS).map(([key, name]) => ({
    dimension: name,
    score: eng.scores[key as keyof typeof eng.scores],
  }));

  return (
    <div
      className={`rounded-2xl border transition-all ${
        rank === 0
          ? "border-amber-400/40 bg-amber-50/60 dark:bg-amber-950/20 shadow-lg"
          : "border-black/10 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm"
      }`}
    >
      <div className="flex items-center gap-4 p-4">
        <div
          className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-white font-bold text-sm shadow"
          style={{ backgroundColor: RANK_COLORS[rank] }}
        >
          {rank + 1}
        </div>

        <img
          src={eng.avatarUrl}
          alt={eng.login}
          className="w-10 h-10 rounded-full shrink-0 ring-2 ring-black/10 dark:ring-white/10"
        />

        <div className="flex-1 min-w-0">
          <a
            href={`https://github.com/${eng.login}`}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-base hover:underline truncate block"
          >
            {eng.login}
          </a>
          <span className="text-xs opacity-50">{RANK_LABELS[rank]} most impactful</span>
        </div>

        <div className="text-right shrink-0">
          <div className="text-2xl font-bold tabular-nums">{eng.scores.composite}</div>
          <div className="text-xs opacity-50">SPACE score</div>
        </div>

        <button
          onClick={() => setExpanded((v) => !v)}
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-lg opacity-60"
          aria-label="Toggle details"
        >
          {expanded ? "▲" : "▼"}
        </button>
      </div>

      <div className="px-4 pb-3 flex flex-col gap-1.5">
        {Object.entries(DIMENSION_LABELS).map(([key, label]) => (
          <DimensionBar
            key={key}
            label={label}
            value={eng.scores[key as keyof typeof eng.scores]}
            color={DIMENSION_COLORS[key]}
          />
        ))}
      </div>

      <div className="px-4 pb-4 flex gap-2 flex-wrap">
        <StatPill label="PRs merged" value={String(eng.prsAuthored)} />
        <StatPill label="PRs reviewed" value={String(eng.prsReviewed)} />
        <StatPill label="Authors helped" value={String(eng.uniqueAuthorsReviewed)} />
        <StatPill label="Cycle time" value={formatHours(eng.medianCycleTimeHours)} />
        <StatPill label="Clean merges" value={`${Math.round(eng.cleanMergeRate * 100)}%`} />
        {eng.prsReviewed > 0 && (
          <StatPill label="Review speed" value={formatHours(eng.medianReviewTurnaroundHours)} />
        )}
      </div>

      {expanded && (
        <div className="border-t border-black/10 dark:border-white/10 px-4 py-4 flex flex-col sm:flex-row gap-4 items-center">
          <div className="w-full sm:w-48 h-44 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                <PolarGrid stroke="currentColor" strokeOpacity={0.15} />
                <PolarAngleAxis
                  dataKey="dimension"
                  tick={{ fontSize: 10, fill: "currentColor", opacity: 0.6 }}
                />
                <Radar
                  dataKey="score"
                  stroke={RANK_COLORS[rank]}
                  fill={RANK_COLORS[rank]}
                  fillOpacity={0.25}
                />
                <Tooltip
                  formatter={(v) => [v, "Score"]}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex-1 text-sm space-y-2 opacity-80">
            <p>
              <strong>Activity ({eng.scores.activity}/100)</strong>
              {` — merged ${eng.prsAuthored} PR${eng.prsAuthored !== 1 ? "s" : ""} and reviewed ${eng.prsReviewed} PR${eng.prsReviewed !== 1 ? "s" : ""} in the last 90 days.`}
            </p>
            <p>
              <strong>Performance ({eng.scores.performance}/100)</strong>
              {` — ${Math.round(eng.cleanMergeRate * 100)}% of their PRs were merged without a reviewer requesting changes.`}
            </p>
            <p>
              <strong>Collaboration ({eng.scores.collaboration}/100)</strong>
              {` — reviewed PRs from ${eng.uniqueAuthorsReviewed} unique author${eng.uniqueAuthorsReviewed !== 1 ? "s" : ""}, contributing to team throughput beyond their own work.`}
            </p>
            <p>
              <strong>Efficiency ({eng.scores.efficiency}/100)</strong>
              {` — median PR cycle time of ${formatHours(eng.medianCycleTimeHours)}${eng.prsReviewed > 0 ? `, median review turnaround of ${formatHours(eng.medianReviewTurnaroundHours)}` : ""}.`}
            </p>
            <p>
              <strong>Satisfaction ({eng.scores.satisfaction}/100)</strong>
              {` — ${Math.round(eng.weeklyConsistency * 100)}% of weeks active across the 90-day window (proxy for sustained engagement).`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const MethodologyPanel = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left font-medium text-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
      >
        <span>How scores are calculated</span>
        <span className="opacity-50">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm space-y-2 opacity-70 border-t border-black/10 dark:border-white/10 pt-3">
          <p>
            Scores use the <strong>SPACE framework</strong> (Microsoft Research, 2021), which
            measures impact across five dimensions to avoid any single metric being gamed.
          </p>
          <p>
            Each dimension is computed from raw GitHub data, normalized to 0–100 via min-max scaling
            across all active engineers in the window, then averaged into a composite score. All 41
            engineers in the dataset are scored; only the top 5 are shown.
          </p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>
              <strong>Satisfaction</strong> — weekly contribution consistency
            </li>
            <li>
              <strong>Performance</strong> — clean merge rate (no rework requested)
            </li>
            <li>
              <strong>Activity</strong> — PRs authored + PRs reviewed
            </li>
            <li>
              <strong>Collaboration</strong> — unique authors helped × review depth
            </li>
            <li>
              <strong>Efficiency</strong> — PR cycle time + review turnaround speed
            </li>
          </ul>
          <p className="mt-2">
            <strong>Limitations:</strong> GitHub activity only. Mentorship, architecture work,
            on-call, and team-level influence are not captured.
          </p>
        </div>
      )}
    </div>
  );
};

const App = () => {
  const since = new Date(rawData.since);
  const fetched = new Date(rawData.fetchedAt);

  return (
    <div className="min-h-screen px-4 py-6 max-w-3xl mx-auto flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight leading-tight">
            PostHog Engineering Impact
          </h1>
          <p className="text-sm opacity-50 mt-0.5">
            Top 5 engineers · {rawData.prDetails.length} PRs analyzed
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs opacity-40">
              {formatDateTime(since)} – {formatDateTime(fetched)}
            </p>
            <button
              disabled
              title="Re-fetches GitHub data from the last analysis date to now and refreshes scores. Not yet available in this build."
              className="text-xs px-2 py-0.5 rounded border border-black/10 dark:border-white/10 opacity-30 cursor-not-allowed"
            >
              ↻ Update
            </button>
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

      <div className="flex flex-col gap-3">
        {top5.map((eng, i) => (
          <EngineerCard key={eng.login} eng={eng} rank={i} />
        ))}
      </div>

      <MethodologyPanel />

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
