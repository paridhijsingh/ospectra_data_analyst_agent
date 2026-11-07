/**
 * Local-only metric-owner request workflow (prototype).
 * Does not touch answers, routing, compute, or nearest-concept refusals.
 */

import type { RecruitmentAnswer } from './metric-engine';

export const METRIC_REQUEST_ACTION_LABEL = 'Request this metric';
export const METRIC_REQUEST_FORM_TITLE = 'Request a metric — prototype';
export const METRIC_REQUEST_PROTOTYPE_NOTE =
  'Prototype — the metric-owner workflow is planned; this form demonstrates the intended flow and does not submit anywhere.';
export const WORKFLOW_PROTOTYPE_LABEL = 'Workflow prototype';
export const PENDING_METRIC_REQUEST_STATUS = 'Pending definition';
export const PENDING_METRIC_REQUESTS_TITLE = 'Pending metric requests';

export type MetricRequestDraft = {
  question: string;
  owner: string;
  sources: string;
  purpose: string;
  formula: string;
};

export type PendingMetricRequest = {
  id: string;
  question: string;
  owner: string;
  sources: string;
  purpose: string;
  formula: string;
  status: typeof PENDING_METRIC_REQUEST_STATUS;
};

/** Show the request action only on blocked / refused answers. */
export function canRequestMetric(answer: Pick<RecruitmentAnswer, 'supported'>): boolean {
  return !answer.supported;
}

export function createEmptyMetricRequestDraft(question = ''): MetricRequestDraft {
  return {
    question,
    owner: '',
    sources: '',
    purpose: '',
    formula: '',
  };
}

/**
 * Build a pending request from form values.
 * Metric-definition field order: owner → sources → purpose → formula (question is the blocked prompt).
 */
export function createPendingMetricRequest(
  draft: MetricRequestDraft,
  id: string,
): PendingMetricRequest {
  return {
    id,
    question: draft.question.trim(),
    owner: draft.owner.trim(),
    sources: draft.sources.trim(),
    purpose: draft.purpose.trim(),
    formula: draft.formula.trim(),
    status: PENDING_METRIC_REQUEST_STATUS,
  };
}

export function appendPendingMetricRequest(
  current: readonly PendingMetricRequest[],
  request: PendingMetricRequest,
): PendingMetricRequest[] {
  return [...current, request];
}
