import { useState } from "react";

export const MethodologyPanel = () => {
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
            across all active engineers in the window, then averaged into a composite score.
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
