/** Shared result shape for Scope A compute functions. */

export const COMPUTE_SCOPE = 'Scope A — synthetic dataset, computed, not governed' as const;

export type ComputeMeta = {
  definition: string;
  sources: readonly string[];
  scope: typeof COMPUTE_SCOPE;
};

export type SeriesPoint = {
  month: string;
  value: number;
};
