/**
 * Design-only ontology for the cash-collections / RCM investigation demos.
 * Not imported by routing, calculations, or the UI.
 * A relationship here is a valid concept link, not a causal claim and not an instance graph.
 * Concepts are identified by the string endpoints of these edges (no separate concept table).
 */
export type OntologyEdge = {
  from: string;
  relationship: string;
  to: string;
};

export const financeOntology: OntologyEdge[] = [
  { from: "Client", relationship: "receives", to: "Service" },
  { from: "Service", relationship: "delivered_as", to: "Visit" },
  { from: "Visit", relationship: "generates", to: "Claim" },
  { from: "Visit", relationship: "covered_by", to: "Authorization" },
  { from: "Authorization", relationship: "authorizes", to: "Claim" },
  { from: "Claim", relationship: "submitted_to", to: "Payer" },
  { from: "Claim", relationship: "may_have", to: "Denial" },
  { from: "Denial", relationship: "may_be_appealed_via", to: "Appeal" },
  { from: "Claim", relationship: "may_result_in", to: "Payment" },
  { from: "Claim", relationship: "may_produce", to: "Remittance" },
  { from: "Remittance", relationship: "posts_to", to: "AccountsReceivable" },
  { from: "Payment", relationship: "contributes_to", to: "CashCollections" },
  { from: "CashCollections", relationship: "funds", to: "PayrollObligation" },
  { from: "Payer", relationship: "applies", to: "PayerRule" },
  { from: "PayerRule", relationship: "governs", to: "Claim" },
  { from: "Claim", relationship: "associated_with", to: "Branch" },
];

/** Distinct concept ids implied by the ontology edge list. */
export function financeOntologyConceptIds(edges: readonly OntologyEdge[] = financeOntology): string[] {
  return [...new Set(edges.flatMap((edge) => [edge.from, edge.to]))].sort();
}
