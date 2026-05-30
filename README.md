# PostHog Engineering Impact Dashboard

Start time: 5:44pm 5/29/2026

End time: 7:10pm 5/29/2026

Elapse: 96 min

(Please excuse the overage, I was tracking based on a timer on my phone and I didn't realize I started it late)

Site: https://posthog-analysis-six.vercel.app/

Session logs exported to `session-logs/` (two files — conversation hit context limit mid-session)

![Dashboard screenshot](https://github.com/deckmasterbeam/posthogAnalysis/raw/main/Screenshot%202026-05-29%20190542.png)

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

I was curious to see the analysis of other engineers outside of the top 5, we analyzed their data too. Added buttons to show more than just the top 5, but default to the top 5.

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

### Phase 2 — Scoring Model
- [x] Write `src/scoring.ts` — compute per-engineer metrics from raw data
  - Activity: PRs merged + reviews given
  - Performance: % merged without re-request-changes cycles
  - Collaboration: # unique authors reviewed + review engagement
  - Efficiency: median cycle time (open → merge) + median review turnaround
  - Satisfaction proxy: weekly consistency (fraction of weeks active)
- [x] Normalize each sub-metric to 0–100 (min-max scaling across the author pool)
- [x] Compute weighted composite score (equal weight per dimension)
- [x] Export top-5 ranked list with per-dimension breakdown

### Phase 3 — Dashboard UI
- [x] Install `recharts` for charts, `tailwindcss` for styling
- [x] Replace `App.tsx` with dashboard layout:
  - Header: title, 90-day window label, methodology link
  - Top 5 engineer cards (ranked), each showing:
    - Rank badge + GitHub avatar + login
    - Composite score + labeled dimension bars (so score is never unexplained)
    - Key stats in plain English (PRs merged, reviewed, cycle time, clean merge rate)
  - Expandable detail drawer per engineer (radar chart + plain-English dimension breakdown)
  - Collapsible "How scores are calculated" methodology panel
  - Footer: SPACE framework citation + data freshness timestamp

### Phase 4 — Polish
- [x] Verify single-page fit on a 1366×768 viewport (confirmed — no horizontal overflow, light and dark mode both clean)
- [x] Confirm no score is shown without an explanation (composite always accompanied by 5 dimension bars; expand drawer adds plain-English breakdown per dimension)
- [x] Add a "How scores are calculated" collapsible section
- [x] Test loading time < 10s (163KB gzipped, no runtime API calls — instant)
- [x] Add ability to show analysis beyond the top 5. "Show next 5 engineers" and "show all" 
- [x] Check if the data can be updated, if theres new commits not yet part of the data
- [x] Add UI tests, add data validation tests

### Phase 5 — Deploy (deferred to end)
- [x] `vercel` CLI deploy from root
- [x] Verify public URL works — https://posthog-analysis-six.vercel.app/

### Phase 6 — Live Data Backend (stretch, time permitting)
- [ ] Add a Vercel serverless function (`api/refresh.ts`) that runs the GitHub fetch on demand and returns fresh data
- [ ] On the client, check `fetchedAt` in the bundled JSON and if it's stale (e.g. >24h), hit the endpoint to top-up data from `fetchedAt` → now and merge with the static snapshot
- [ ] Store the refreshed data in `localStorage` so repeat visitors don't re-fetch
- [ ] Add a "Last updated" indicator + manual refresh button to the UI
- [ ] Requires `GITHUB_TOKEN` set as a Vercel environment variable (never exposed to the client)


## Future work

- it would be cool to be able to do this analysis on any arbitrary repo. Could add a list of analyzed repos and the ability at the end of the list to input a new repo link to look at

- never got to phase 6, but exposed some logic to know if the data does need updating. A backend service could be made to try and look at 90 day blocks going into the past and look at blocks of data between today and the most recent analyzed commit