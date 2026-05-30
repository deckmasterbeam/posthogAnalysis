import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import App from "src/App";
import { DEFAULT_VISIBLE_COUNT, EXPAND_NEXT_N_COUNT } from "src/constants";
import { computeRankings } from "src/scoring";

// RadarChart uses ResizeObserver which isn't available in jsdom
vi.mock("recharts", () => ({
  RadarChart: () => null,
  Radar: () => null,
  PolarGrid: () => null,
  PolarAngleAxis: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Tooltip: () => null,
}));

const totalEngineers = computeRankings().length;

const mockFetch = (commits: unknown[]) =>
  vi.fn().mockResolvedValue({ json: () => Promise.resolve(commits) });

beforeEach(() => {
  // Default: no new commits — keeps button hidden in unrelated tests
  vi.stubGlobal("fetch", mockFetch([]));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("App – engineer list", () => {
  it(`shows ${DEFAULT_VISIBLE_COUNT} cards by default`, () => {
    render(<App />);
    expect(screen.getAllByText("PRs merged")).toHaveLength(DEFAULT_VISIBLE_COUNT);
  });

  it(`"show next" button increments by ${EXPAND_NEXT_N_COUNT}`, () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /show next/i }));
    expect(screen.getAllByText("PRs merged")).toHaveLength(
      DEFAULT_VISIBLE_COUNT + EXPAND_NEXT_N_COUNT
    );
  });

  it(`"show all" button reveals all ${totalEngineers} engineers`, () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /show all/i }));
    expect(screen.getAllByText("PRs merged")).toHaveLength(totalEngineers);
  });

  it("pagination buttons disappear once all engineers are shown", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /show all/i }));
    expect(screen.queryByRole("button", { name: /show next/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /show all/i })).toBeNull();
  });

  it("header reflects total engineer count", () => {
    render(<App />);
    expect(screen.getByText(new RegExp(`${totalEngineers} engineers`))).toBeInTheDocument();
  });
});

describe("App – Update button", () => {
  it("is shown when GitHub has new commits since last fetch", async () => {
    vi.stubGlobal("fetch", mockFetch([{ sha: "abc123" }]));
    render(<App />);
    expect(await screen.findByRole("button", { name: /↻ Update/i })).toBeInTheDocument();
  });

  it("is hidden when no new commits exist", async () => {
    vi.stubGlobal("fetch", mockFetch([]));
    render(<App />);
    await act(async () => {});
    expect(screen.queryByRole("button", { name: /↻ Update/i })).toBeNull();
  });

  it("is hidden when the commit check fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network error")));
    render(<App />);
    await act(async () => {});
    expect(screen.queryByRole("button", { name: /↻ Update/i })).toBeNull();
  });

  it("calls the GitHub commits endpoint with the fetchedAt date as since", async () => {
    const fetchSpy = mockFetch([]);
    vi.stubGlobal("fetch", fetchSpy);
    render(<App />);
    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toMatch(/api\.github\.com\/repos\/PostHog\/posthog\/commits/);
    expect(calledUrl).toMatch(/since=/);
    expect(calledUrl).toMatch(/per_page=1/);
  });
});
