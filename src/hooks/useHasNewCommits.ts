import { useEffect, useState } from "react";
import { GITHUB_OWNER, GITHUB_REPO } from "src/constants";

export const useHasNewCommits = (since: string): boolean | null => {
  const [hasNewCommits, setHasNewCommits] = useState<boolean | null>(null);

  useEffect(() => {
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/commits?since=${encodeURIComponent(since)}&per_page=1`;
    fetch(url)
      .then((r) => r.json())
      .then((data: unknown) => setHasNewCommits(Array.isArray(data) && data.length > 0))
      .catch(() => setHasNewCommits(null));
  }, [since]);

  return hasNewCommits;
};
