# Financial Ontology + Knowledge Graph Demo v0.1

This is a design prototype for one Financial Data Analyst question. It is not a production knowledge graph, and it is not connected to routing, calculations, or a graph database.

## 1. Purpose

The ontology defines business concepts and the relationships that are valid between them.

A future knowledge graph could store actual instances of those entities and relationships, such as a particular client, visit, claim, or payment.

Deterministic systems remain responsible for calculating financial metrics. The ontology and a future graph may guide which governed metrics to inspect. They must not invent a calculation or a causal explanation.

Conceptual flow:

User Question → Intent → Ontology Entities and Relationships → Governed Metrics → Data Retrieval → Deterministic Calculation → Quality Check → Explanation

These layers stay separate:

- Ontology: concepts, meanings, and valid relationships.
- Knowledge graph: instances of those concepts and relationships, not built in this demo.
- Metrics and calculations: deterministic.
- Narrative: an explanation of validated results.
- Scenario planning: an explicit assumption change, followed by a recalculation of governed metrics. This is not implemented.

## 2. Primary Use Case

Research question: "Why did cash collections fall?"

This wording is not a registered Financial question. It is used here only to design an investigation path across collection gap, payment timing, receivables, denials, and authorization exposure. The path is a shared vocabulary. It is not a cause.

## 3. Core Entities

Definitions are limited to home-care financial analytics.

- Client: the person receiving home-care services.
- Service: a type of care, such as skilled nursing or personal care.
- Visit: one delivered instance of a service.
- Authorization: the payer approval that covers units or time for a client's care.
- Claim: the bill submitted for one or more visits.
- Payer: the organization expected to pay the claim.
- Denial: a payer decision that a claim, or part of a claim, is not payable as submitted.
- Payment: cash posted for a claim.
- CashCollections: posted cash from payments in a period. This is the concept behind the existing `cash_collections` metric.
- Branch: the operating location associated with the work.

## 4. Core Relationships

The machine-readable copy of these edges is `lib/finance-ontology.ts`.

- Client → receives → Service
- Service → delivered_as → Visit
- Visit → generates → Claim
- Visit → covered_by → Authorization
- Claim → submitted_to → Payer
- Claim → may_have → Denial
- Claim → may_result_in → Payment
- Payment → contributes_to → CashCollections
- Claim → associated_with → Branch

`may_have` and `may_result_in` are possibilities, not causes. A claim can exist without a denial, and a claim can exist without a payment.

This demo does not encode unsupported causal edges. In particular, it does not encode DocumentationIssue → causes → Denial, or an EVV exception → causes → Denial. Documentation, EVV, and authorization problems can be investigation leads only through a cautious relationship such as may_be_related_to, and only when a later model has evidence for that link. Those leads are not edges in v0.1.

## 5. Investigation Path

Cash Collections → Payments → Claims → Payers / Denials → Authorization or process issues → Branch / Service

This is a valid order of inspection. It is not a causal conclusion. Reaching a denial, an authorization gap, or a branch does not by itself explain why collections fell.

## 6. Existing Governed Metrics

These metric IDs already exist on the current Financial templates. No new metric IDs are introduced.

- `cash_collections`: posted cash for the period. This is the quantity the question says fell. The current collections template also shows it beside earned revenue.
- `collection_gap`: earned revenue less posted cash collections. It shows whether collections lagged revenue. It does not name a cause.
- `days_to_payment`: average days from clean-claim submission to posted receipt, by payer. It is the timing check.
- `open_ar`: open receivable balance. It shows claims that have not become payments.
- `ar_age`: how that open balance is distributed across aging buckets.
- `denied_claim_value`: submitted claim value currently in denied status.
- `denial_rate`: the denial measure paired with denied claim value on the current claims template.
- `authorization_exposure`: potential value tied to unused or invalid authorization coverage.

`denied_claim_value` and `authorization_exposure` are exposure measures. They are not confirmed loss.

## 7. Example Governed Investigation

1. Confirm that `cash_collections` actually declined. Compare it with `collection_gap` so a revenue change is not mistaken for a collections change.
2. Check reimbursement timing with `days_to_payment`, `open_ar`, and `ar_age`.
3. Check denial patterns with `denial_rate` and `denied_claim_value`.
4. Check `authorization_exposure`.
5. If the data supports it, segment by payer, service, or claim status. There is no governed collections-by-branch metric. `cash-by-branch` is available cash, not collections.

Limits that stay in force:

- Exposure is not confirmed loss.
- Denied value is not guaranteed loss.
- Correlation is not causation.
- Missing evidence should produce a limitation, not a guessed explanation.

The current collections, payer, claims, receivables, and authorization answers are static synthetic templates. This investigation sequence is a design for how those existing metrics could be read together. It does not run that sequence.

## 8. Governance Rules

- Do not guess unsupported relationships.
- Do not make a causal claim without traceable evidence.
- Exposure is not the same as loss.
- Denied value is not automatically permanent loss.
- Missing data should result in a limitation.
- Deterministic analytics calculate metrics.
- The ontology defines meaning and relationships.
- Narrative explains validated results.

## 9. Scenario Planning Connection

Future example, not implemented: "What if reimbursements arrive 14 days later than expected?"

That 14-day example is not the current `cash-forecast` route. See Current POC vs. Ontology Prototype.

Conceptual comparison:

Baseline payment timing → Payment → CashCollections → AvailableCash

versus:

Payment timing + 14 days → Recalculate payment timing → Recalculate collection timing → Recalculate available cash → Compare with baseline

`AvailableCash` here means the existing `available_cash` metric. A future timing scenario would also need an explicit dependency on `cash_collections` and `cash_forecast`. Those dependencies are not defined in code today.

Rules for a later implementation:

- This scenario is not implemented yet.
- The changed assumption must be explicit.
- Unrelated metrics should not change unless the model defines a dependency.
- A scenario is not a prediction.
- Outputs should be phrased as "Under this assumption..." rather than as guaranteed future outcomes.

## Current POC vs. Ontology Prototype

Existing approved question: "Why is cash collection lagging behind earned revenue this month?"

- Route: `collections-gap`.
- It uses the existing fixed synthetic collections template.
- `insurance-bridge` reuses that same template.

Ontology research use case: "Why did cash collections fall?"

- This is not a registered Financial question.
- It is used only to design and test a possible ontology-guided investigation path.

Existing approved question: "What if reimbursements arrive later than expected?"

- It currently routes to `cash-forecast`.
- It uses the existing static forecast template.
- That route is not an implemented scenario-planning engine.
- The 14-day reimbursement-delay example in this document is a future conceptual scenario. It is not the implementation behind `cash-forecast`.

Current implementation and design gaps, for later alignment rather than as defects in the POC:

- The collections template already attributes synthetic amounts to payment timing, denials, and unbilled claims.
- The ontology prototype treats payment timing, denials, authorization or process issues, payer, branch, and service as investigation paths, not as automatically established causes.
- The static narrative and this evidence-governed approach are not yet fully aligned.
- Branch has an `available_cash` analysis. There is no governed collections-by-branch metric.
- There is no Financial semantic catalog or YAML. Financial metric IDs live in the templates and the intent registry.

## 10. Current Status

Implemented as a design artifact:

- Initial ontology concepts.
- Initial relationships in this document and in `lib/finance-ontology.ts`.
- The cash-collections investigation path.
- A mapping to existing governed metric IDs.
- Governance rules.
- A conceptual scenario-planning connection.

Not implemented:

- A graph database.
- A production knowledge graph.
- A graph traversal engine.
- New financial calculations.
- New metric IDs.
- An expanded Financial registry.
- A scenario-planning engine.
- QuickBooks integration.

`lib/finance-ontology.ts` is not imported by the router, the Financial registry, the orchestrator, or the UI.
