/**
 * Shared presentation schema for governed visualization explainers.
 * Research UI only. Contains no scenario-specific numbers.
 */

export type ExplainerMode = 'visualization' | 'investigation';

export type GovernedExplainer = {
  id: string;
  title: string;
  mode: ExplainerMode;
  whatYouAreLookingAt: string;
  whatItShows: string;
  whyItMatters: string;
  boundedConclusion: string;
  limitations: readonly string[];
};

export type ExplainerSlotKey =
  | 'whatYouAreLookingAt'
  | 'whatItShows'
  | 'whyItMatters'
  | 'boundedConclusion';

export const explainerSlotLabels: Record<ExplainerMode, Record<ExplainerSlotKey, string>> = {
  visualization: {
    whatYouAreLookingAt: 'What you are looking at',
    whatItShows: 'What it shows',
    whyItMatters: 'Why it matters',
    boundedConclusion: 'What you can conclude',
  },
  investigation: {
    whatYouAreLookingAt: 'How to read this',
    whatItShows: 'Why this path is relevant',
    whyItMatters: 'Evidence status',
    boundedConclusion: 'What you can conclude',
  },
};

export const explainerSlotOrder: readonly ExplainerSlotKey[] = [
  'whatYouAreLookingAt',
  'whatItShows',
  'whyItMatters',
  'boundedConclusion',
];
