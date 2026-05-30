export interface Review {
  reviewer: string;
  state: string;
  submittedAt: string;
}

export interface PRDetail {
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
  reviews: Review[];
  reviewCommentCount: number;
  requestChangesCount: number;
}

export interface SpaceScores {
  satisfaction: number;
  performance: number;
  activity: number;
  collaboration: number;
  efficiency: number;
  composite: number;
}

export interface EngineerMetrics {
  login: string;
  avatarUrl: string;

  // Raw metrics (shown in UI for transparency)
  prsAuthored: number;
  prsReviewed: number;
  uniqueAuthorsReviewed: number;
  reviewCommentsGiven: number;
  medianCycleTimeHours: number; // open → merge
  medianReviewTurnaroundHours: number; // PR open → first review from this engineer
  cleanMergeRate: number; // fraction of own PRs with zero CHANGES_REQUESTED
  weeklyConsistency: number; // 0–1, fraction of active weeks with at least one contribution

  scores: SpaceScores;
}
