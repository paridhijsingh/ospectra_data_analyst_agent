/**
 * Deterministic nearest-concept lookup for BLOCKED refusals.
 * Keyword touch (router-style includes) only; no LLM / embeddings.
 *
 * Precedence: the first touched defined concept in graph.concepts order.
 * If the question touches no defined concept, returns null.
 */
import { financeOntology, financeOntologyConceptIds, type OntologyEdge } from './finance-ontology';

export type ConceptNode = {
  id: string;
  label: string;
  /** Lowercase phrases matched with String.includes on the normalized question. */
  aliases: readonly string[];
};

export type ConceptGraph = {
  concepts: readonly ConceptNode[];
  edges: readonly { from: string; to: string }[];
};

export type NearestConcept = {
  id: string;
  label: string;
};

const FINANCE_LABELS: Readonly<Record<string, string>> = {
  CashCollections: 'Cash Collections',
  AccountsReceivable: 'Accounts Receivable',
  PayerRule: 'Payer Rule',
  PayrollObligation: 'Payroll Obligation',
  Authorization: 'Authorization',
  Payment: 'Payment',
  Claim: 'Claim',
  Denial: 'Denial',
  Appeal: 'Appeal',
  Remittance: 'Remittance',
  Visit: 'Visit',
  Service: 'Service',
  Payer: 'Payer',
  Branch: 'Branch',
  Client: 'Client',
};

/** Aliases kept short / phrase-like so matching mirrors financial intent `includes` style. */
const FINANCE_ALIASES: Readonly<Record<string, readonly string[]>> = {
  Client: ['client', 'customer', 'member', 'ltv', 'lifetime value', 'lifetime'],
  Service: ['service', 'care hour', 'productive care', 'service line'],
  Visit: ['visit', 'encounter'],
  Authorization: ['authorization', 'auth'],
  Claim: ['claim'],
  Payer: ['payer', 'insurer'],
  Denial: ['denial', 'denied'],
  Appeal: ['appeal'],
  Payment: ['payment', 'paid'],
  Remittance: ['remittance', '835'],
  AccountsReceivable: ['accounts receivable', 'receivable', 'a/r'],
  CashCollections: ['cash collections', 'collections', 'cash collection'],
  PayrollObligation: ['payroll', 'payroll obligation'],
  PayerRule: ['payer rule', 'adjudication rule'],
  Branch: ['branch', 'location'],
};

/**
 * Recruitment entity graph mirrored from semantic/recruitment-model.yaml
 * (entities + relationship endpoints). Kept in TS so the client bundle needs no YAML parser.
 */
export const recruitmentConceptGraph: ConceptGraph = {
  concepts: [
    { id: 'candidate', label: 'Candidate', aliases: ['candidate', 'applicant', 'person'] },
    { id: 'application', label: 'Application', aliases: ['application', 'submission'] },
    { id: 'job', label: 'Job', aliases: ['job', 'role', 'position', 'opening'] },
    {
      id: 'interview_offer',
      label: 'Interview / Offer',
      aliases: ['interview', 'offer', 'hire'],
    },
  ],
  edges: [
    { from: 'application', to: 'candidate' },
    { from: 'application', to: 'job' },
    { from: 'interview_offer', to: 'application' },
  ],
};

export function buildFinanceConceptGraph(edges: readonly OntologyEdge[] = financeOntology): ConceptGraph {
  const ids = financeOntologyConceptIds(edges);
  return {
    concepts: ids.map((id) => ({
      id,
      label: FINANCE_LABELS[id] ?? id,
      aliases: FINANCE_ALIASES[id] ?? [id.toLowerCase()],
    })),
    edges: edges.map((edge) => ({ from: edge.from, to: edge.to })),
  };
}

export const financeConceptGraph: ConceptGraph = buildFinanceConceptGraph();

function normalizeQuestion(question: string): string {
  return question.toLowerCase().replace(/[^\p{L}\p{N}\s/.-]+/gu, ' ').replace(/\s+/g, ' ').trim();
}

/** Concepts whose alias/label/id phrase appears in the question (includes-style). */
export function touchedConcepts(question: string, graph: ConceptGraph): ConceptNode[] {
  const normalized = normalizeQuestion(question);
  const touched: ConceptNode[] = [];
  for (const concept of graph.concepts) {
    const phrases = [concept.label.toLowerCase(), concept.id.toLowerCase().replaceAll('_', ' '), ...concept.aliases];
    if (phrases.some((phrase) => phrase.length > 0 && normalized.includes(phrase))) {
      touched.push(concept);
    }
  }
  return touched;
}

/**
 * Nearest defined concept for a blocked question.
 * First touched concept in graph.concepts order; null when nothing is touched.
 */
export function findNearestConcept(question: string, graph: ConceptGraph): NearestConcept | null {
  const touched = touchedConcepts(question, graph);
  if (touched.length === 0) return null;
  const touchedIds = new Set(touched.map((concept) => concept.id));
  for (const concept of graph.concepts) {
    if (touchedIds.has(concept.id)) return { id: concept.id, label: concept.label };
  }
  return null;
}

export function findNearestFinanceConcept(question: string): NearestConcept | null {
  return findNearestConcept(question, financeConceptGraph);
}

export function findNearestRecruitmentConcept(question: string): NearestConcept | null {
  return findNearestConcept(question, recruitmentConceptGraph);
}

export const NEAREST_CONCEPT_REFUSAL_PREFIX = (label: string) =>
  `I don't have an answer for your question yet. The closest defined concept is ${label}.`;
