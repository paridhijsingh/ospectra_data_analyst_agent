/**
 * Presentation helpers for per-answer source chip, quality indicator, and feedback.
 * Reuses orchestrator honesty / quality-guard wording — does not rename labels.
 */
import type { RecruitmentAnswer } from './metric-engine';
import { semanticHonestyLabel, type AgentId, type ProcessStep } from './orchestrator';

export type AnswerFeedback = 'up' | 'down' | null;

/** Source chip label for a supported answer; null for refusals (no chip). */
export function answerSourceChipLabel(agentId: AgentId, answer: RecruitmentAnswer): string | null {
  if (!answer.supported) return null;
  return semanticHonestyLabel(agentId, answer);
}

/**
 * Compact quality indicator from the quality-guard trace step.
 * Uses the existing answer-meta wording ("Quality checks passed") when the guard completed.
 * Returns null when unsupported or when no quality step is present.
 */
export function answerQualityIndicatorLabel(
  answer: RecruitmentAnswer,
  trace: readonly ProcessStep[],
): string | null {
  if (!answer.supported) return null;
  const quality = trace.find((step) => step.id === 'quality');
  if (!quality) return null;
  if (quality.status === 'complete') return 'Quality checks passed';
  return null;
}

/** Toggle thumbs selection; clicking the active thumb clears it. Independent per answer. */
export function toggleAnswerFeedback(current: AnswerFeedback, clicked: 'up' | 'down'): AnswerFeedback {
  return current === clicked ? null : clicked;
}
