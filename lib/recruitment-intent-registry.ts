export type RecruitmentQuestionId =
  | 'applications-by-job'
  | 'time-to-hire'
  | 'engineering-funnel'
  | 'applications-trend'
  | 'candidates-by-source'
  | 'source-hire-rate'
  | 'hires-by-department'
  | 'offer-acceptance'
  | 'pipeline-by-location'
  | 'department-demand'
  | 'hiring-trend'
  | 'pipeline-health';

export type RecruitmentIntent =
  | 'metric_breakdown'
  | 'funnel_analysis'
  | 'time_trend'
  | 'mix_analysis'
  | 'rate_breakdown';

export type SemanticCatalogStatus = 'declared' | 'review-required';

export type GovernedMetricRef = {
  metricId: string;
  semanticCatalogStatus: SemanticCatalogStatus;
};

/**
 * `exact` compares the whole normalized question with the single term.
 * `includes` requires every term to appear as a substring.
 * Lower precedence is tried first. Exact rules all use 0 and are tried before includes rules.
 */
export type AcceptedTerminology = {
  allOf: readonly string[];
  match: 'exact' | 'includes';
  precedence: number;
};

export type RecruitmentIntentDefinition = {
  questionId: RecruitmentQuestionId;
  intent: RecruitmentIntent;
  approvedMetricIds: readonly GovernedMetricRef[];
  acceptedTerminology: readonly AcceptedTerminology[];
};

const declared = (metricId: string): GovernedMetricRef => ({ metricId, semanticCatalogStatus: 'declared' });
const exact = (term: string): AcceptedTerminology => ({ allOf: [term], match: 'exact', precedence: 0 });
const includes = (precedence: number, ...allOf: string[]): AcceptedTerminology => ({ allOf, match: 'includes', precedence });

/**
 * Governed mapping for the 12 approved Recruitment analyses.
 * `matchRecruitmentQuestion()` is the only Recruitment router.
 * Precedence numbers follow the previous keyword-chain order, including the
 * early "time to hire" rule and the later hiring-duration rule.
 */
export const recruitmentIntentRegistry: readonly RecruitmentIntentDefinition[] = [
  {
    questionId: 'applications-by-job',
    intent: 'metric_breakdown',
    approvedMetricIds: [declared('application_count')],
    acceptedTerminology: [
      exact('applications-by-job'),
      exact('how many candidates applied for each job this month?'),
      includes(14, 'job', 'appl'),
      includes(14, 'job', 'candidate'),
      includes(14, 'role', 'appl'),
      includes(14, 'role', 'candidate'),
    ],
  },
  {
    questionId: 'time-to-hire',
    intent: 'metric_breakdown',
    approvedMetricIds: [declared('average_time_to_hire')],
    acceptedTerminology: [
      exact('time-to-hire'),
      exact('what is the average time to hire by department in the last 90 days?'),
      includes(1, 'time to hire'),
      includes(12, 'hiring duration'),
      includes(12, 'hiring time'),
      includes(12, 'how long', 'hire'),
    ],
  },
  {
    questionId: 'engineering-funnel',
    intent: 'funnel_analysis',
    approvedMetricIds: [declared('candidate_count'), declared('stage_conversion_rate')],
    acceptedTerminology: [
      exact('engineering-funnel'),
      exact('where is the biggest drop-off in the recruitment funnel for engineering roles?'),
      includes(2, 'funnel'),
      includes(2, 'drop-off'),
      includes(2, 'dropoff'),
      includes(2, 'engineering', 'candidate', 'losing'),
      includes(2, 'engineering', 'candidate', 'loss'),
      includes(2, 'weakest stage', 'engineering'),
      includes(2, 'weakest stage', 'stage'),
      includes(2, 'weakest stage', 'recruit'),
      includes(2, 'biggest loss', 'engineering'),
      includes(2, 'biggest loss', 'stage'),
      includes(2, 'biggest loss', 'recruit'),
    ],
  },
  {
    questionId: 'applications-trend',
    intent: 'time_trend',
    approvedMetricIds: [declared('application_count')],
    acceptedTerminology: [
      exact('applications-trend'),
      exact('how are applications trending month over month?'),
      includes(8, 'trend'),
      includes(8, 'applications', 'over time'),
      includes(8, 'applications', 'increasing'),
      includes(8, 'applications', 'decreasing'),
      includes(8, 'applications', 'month over month'),
    ],
  },
  {
    questionId: 'candidates-by-source',
    intent: 'mix_analysis',
    approvedMetricIds: [declared('candidate_count')],
    acceptedTerminology: [
      exact('candidates-by-source'),
      exact('which recruiting sources bring in the most candidates?'),
      includes(5, 'source'),
      includes(6, 'channel', 'applicant'),
      includes(6, 'channel', 'candidate'),
      includes(6, 'channel', 'volume'),
    ],
  },
  {
    questionId: 'source-hire-rate',
    intent: 'rate_breakdown',
    approvedMetricIds: [declared('candidate_to_hire_rate')],
    acceptedTerminology: [
      exact('source-hire-rate'),
      exact('which source has the highest candidate-to-hire conversion rate?'),
      includes(4, 'source', 'conversion'),
      includes(4, 'source', 'hire rate'),
      includes(4, 'source', 'highest'),
      includes(4, 'recruiting', 'source', 'perform'),
    ],
  },
  {
    questionId: 'hires-by-department',
    intent: 'metric_breakdown',
    approvedMetricIds: [declared('hire_count')],
    acceptedTerminology: [
      exact('hires-by-department'),
      exact('how many hires did each department make in the last 90 days?'),
      includes(13, 'hire', 'department'),
      includes(13, 'hiring', 'department'),
    ],
  },
  {
    questionId: 'offer-acceptance',
    intent: 'rate_breakdown',
    approvedMetricIds: [declared('offer_acceptance_rate')],
    acceptedTerminology: [
      exact('offer-acceptance'),
      exact('what is the offer acceptance rate by department?'),
      includes(3, 'offer', 'accept'),
    ],
  },
  {
    questionId: 'pipeline-by-location',
    intent: 'mix_analysis',
    approvedMetricIds: [declared('active_pipeline_count')],
    acceptedTerminology: [
      exact('pipeline-by-location'),
      exact('how many active candidates are in the pipeline by location?'),
      includes(10, 'pipeline', 'location'),
      includes(10, 'where', 'active', 'candidate'),
      includes(10, 'active', 'candidate', 'location'),
    ],
  },
  {
    questionId: 'department-demand',
    intent: 'mix_analysis',
    approvedMetricIds: [
      declared('application_count'),
      // TODO: semantic-catalog alignment needs review. application_share is used by department-demand but is not declared in semantic/recruitment-model.yaml.
      { metricId: 'application_share', semanticCatalogStatus: 'review-required' },
    ],
    acceptedTerminology: [
      exact('department-demand'),
      exact('which departments account for the largest share of application demand?'),
      includes(11, 'department', 'demand'),
      includes(11, 'department', 'share', 'application'),
    ],
  },
  {
    questionId: 'hiring-trend',
    intent: 'time_trend',
    approvedMetricIds: [declared('hire_count')],
    acceptedTerminology: [
      exact('hiring-trend'),
      exact('how are completed hires trending over the last six months?'),
      includes(7, 'trend', 'hire'),
      includes(7, 'hire', 'increasing'),
      includes(7, 'hire', 'decreasing'),
    ],
  },
  {
    questionId: 'pipeline-health',
    intent: 'rate_breakdown',
    approvedMetricIds: [
      // TODO: semantic-catalog alignment needs review. active_pipeline_rate is used by pipeline-health but is not declared in semantic/recruitment-model.yaml.
      { metricId: 'active_pipeline_rate', semanticCatalogStatus: 'review-required' },
    ],
    acceptedTerminology: [
      exact('pipeline-health'),
      exact('which departments have the healthiest active recruiting pipeline?'),
      includes(9, 'pipeline', 'health'),
      includes(9, 'recruiting', 'pipeline', 'strongest'),
    ],
  },
];

const routingRules = recruitmentIntentRegistry.flatMap((entry) =>
  entry.acceptedTerminology.map((rule) => ({ questionId: entry.questionId, ...rule })),
);

function matchesRule(normalized: string, rule: AcceptedTerminology): boolean {
  if (rule.match === 'exact') return rule.allOf.length === 1 && normalized === rule.allOf[0];
  return rule.allOf.every((term) => normalized.includes(term));
}

export function matchRecruitmentQuestion(question: string): RecruitmentQuestionId | undefined {
  const normalized = question.toLowerCase();
  const exactMatch = routingRules.find((rule) => rule.match === 'exact' && matchesRule(normalized, rule));
  if (exactMatch) return exactMatch.questionId;
  return [...routingRules]
    .filter((rule) => rule.match === 'includes')
    .sort((left, right) => left.precedence - right.precedence)
    .find((rule) => matchesRule(normalized, rule))?.questionId;
}
