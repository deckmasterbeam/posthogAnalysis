# PostHog Engineering Impact Dashboard

Start time: 5:44pm 5/29/2026

End time: TODO

Elapse: TODO min

## Considerations

### Why SPACE Framework (Microsoft Research, 2021)

Every naive approach to measuring engineering impact ends up measuring the wrong thing — commits, lines of code, and PRs merged all incentivize volume over value. The SPACE framework was specifically designed by researchers at Microsoft and GitHub to address this. It defines impact across five dimensions so that no single gaming-able proxy can dominate the score.

I'm choosing to use the SPACE model partially out of niave lack of knowledge for the model space, I'm not sure the best analysis to do, or the best way to combine different analytical frameworks in the time permitted. But, this framework comes from Microsoft, and as an ex Microsoft employee, that makes me partial to this model.

| Dimension | What it captures | GitHub proxy used |
|---|---|---|
| **S**atisfaction | Engagement, retention signals | Review participation depth, comment responsiveness |
| **P**erformance | Outcomes, not output | PR merge rate, % merged without rework (no re-request-changes) |
| **A**ctivity | Meaningful actions | PRs authored & merged, issues resolved, reviews given |
| **C**ommunication & Collaboration | Helping others ship | Reviews given, review comment depth, # unique authors reviewed |
| **E**fficiency & Flow | Unblocked work, fast cycles | PR cycle time (open → merge), review turnaround time |

Each dimension is normalized 0–100 across the author pool, then combined into a weighted composite score. Every number shown in the UI traces back to a named dimension — a score is never shown without explanation.

**Limitations:** All signal comes from GitHub activity. Qualities like mentorship, architectural influence, and on-call reliability are not captured. The dashboard notes this explicitly so the audience can calibrate.

---

### Why Pre-fetched Data (Static JSON)

Two options were considered:

**Option A — Pre-fetch at dev time, commit JSON, ship static site.**
The fetch script runs locally once, writes `src/data/github-data.json`, and that file is committed and bundled by Vite. The deployed site has zero runtime API dependencies and loads instantly. No GitHub token is ever exposed to the browser.

**Option B — Fetch from GitHub API at runtime in the browser.**
Simpler in theory, but: rate limits (60 req/hr unauthenticated), slow load times, and no safe way to include a token client-side.

We chose Option A. The data is a snapshot frozen at fetch time, which is acceptable for a take-home assignment. For a production product, a scheduled backend job would periodically re-run the fetch and redeploy (see Phase 6).

---

### Data Window

90 days — matches the assignment requirement. Long enough to smooth out vacation/on-call variance while staying recent enough to reflect the current team composition.

---

## Architecture

```
scripts/fetch-data.ts     ← Node script, run once locally, writes JSON
src/data/github-data.json ← Committed static artifact, bundled by Vite
src/scoring.ts            ← SPACE scoring model
src/App.tsx               ← Dashboard UI
```

---

## TODO List

### Phase 1 — Data Fetching
- [x] Install `octokit`, `tsx`, and `dotenv` as dev deps
- [x] Write `scripts/fetch-data.ts` — paginate `/repos/PostHog/posthog/pulls` (closed, last 90 days), collect PR authors, reviewers, review comments, cycle times
- [x] Add `package.json` script: `"fetch": "tsx scripts/fetch-data.ts"`
- [x] Run with a GitHub PAT (read-only `public_repo`), validate output shape
- [x] Confirm `src/data/github-data.json` is written correctly (77 PRs, 41 authors, 39 reviewers)

### Phase 2 — Scoring Model (est. ~15 min)
- [ ] Write `src/scoring.ts` — compute per-engineer metrics from raw data
  - Activity: PRs merged, issues closed, reviews given
  - Performance: PR merge rate, % merged without re-request-changes cycles
  - Collaboration: # unique authors whose PRs they reviewed, review comment count
  - Efficiency: median cycle time (open → merge), median review turnaround
  - Satisfaction proxy: consistency of activity (not bursty), self-review avoidance
- [ ] Normalize each sub-metric to 0–100 (min-max scaling across the author pool)
- [ ] Compute weighted composite score (equal weight per dimension initially)
- [ ] Export top-5 ranked list with per-dimension breakdown

### Phase 3 — Dashboard UI (est. ~35 min)
- [ ] Install `recharts` for charts, `tailwindcss` for styling
- [ ] Replace `App.tsx` with dashboard layout:
  - Header: title, 90-day window label, methodology link
  - Top 5 engineer cards (ranked), each showing:
    - Rank badge + GitHub avatar + login
    - Composite score + labeled dimension bars (so score is never unexplained)
    - 3 key highlight stats in plain English ("Reviewed 42 PRs, median review in 4h")
  - Expandable detail drawer per engineer (more stat breakdown)
  - Footer: SPACE framework citation + data freshness timestamp

### Phase 4 — Polish (est. ~10 min)
- [ ] Verify single-page fit on a 1366×768 viewport
- [ ] Confirm no score is shown without an explanation
- [ ] Add a "How scores are calculated" collapsible section
- [ ] Test loading time < 10s (should be instant — static JSON)

### Phase 5 — Deploy (deferred to end)
- [ ] `vercel` CLI deploy from root
- [ ] Verify public URL works

### Phase 6 — Live Data Backend (stretch, time permitting)
- [ ] Add a Vercel serverless function (`api/refresh.ts`) that runs the GitHub fetch on demand and returns fresh data
- [ ] On the client, check `fetchedAt` in the bundled JSON and if it's stale (e.g. >24h), hit the endpoint to top-up data from `fetchedAt` → now and merge with the static snapshot
- [ ] Store the refreshed data in `localStorage` so repeat visitors don't re-fetch
- [ ] Add a "Last updated" indicator + manual refresh button to the UI
- [ ] Requires `GITHUB_TOKEN` set as a Vercel environment variable (never exposed to the client)
