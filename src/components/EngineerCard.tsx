import { useState } from "react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { EngineerMetrics } from "src/types";
import { DIMENSION_COLORS, DIMENSION_LABELS, RANK_COLORS, RANK_LABELS } from "src/constants";
import { formatHours } from "src/utils";
import { DimensionBar } from "src/components/DimensionBar";
import { StatPill } from "src/components/StatPill";

export const EngineerCard = ({ eng, rank }: { eng: EngineerMetrics; rank: number }) => {
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
          {RANK_LABELS[rank] && (
            <span className="text-xs opacity-50">{RANK_LABELS[rank]} most impactful</span>
          )}
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
