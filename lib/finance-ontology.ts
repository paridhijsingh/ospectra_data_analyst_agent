/**
 * Design-only ontology for the cash-collections investigation demo.
 * Not imported by routing, calculations, or the UI.
 * A relationship here is a valid concept link, not a causal claim and not an instance graph.
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
  { from: "Claim", relationship: "submitted_to", to: "Payer" },
  { from: "Claim", relationship: "may_have", to: "Denial" },
  { from: "Claim", relationship: "may_result_in", to: "Payment" },
  { from: "Payment", relationship: "contributes_to", to: "CashCollections" },
  { from: "Claim", relationship: "associated_with", to: "Branch" },
];
