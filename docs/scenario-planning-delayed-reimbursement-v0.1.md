# Scenario Planning v0.1 — Delayed Reimbursement Impact on Cash

This is an isolated deterministic scenario prototype. It is not a prediction, and it is not the Financial Agent forecast.

It answers: "What happens to cash available before an obligation if one or more expected reimbursements arrive later?"

A scenario is not a prediction. The result is the arithmetic consequence of caller-supplied dates and amounts.

## Inputs

Each call supplies:

- Opening cash.
- One or more reimbursements, each with an amount, an expected date, and its own delay in calendar days.
- Obligation amount.
- Obligation date.

Dates are `YYYY-MM-DD` calendar dates, read as UTC dates. Adding days uses UTC calendar arithmetic, so the machine's local timezone cannot move a date onto another day. Delay days must be a whole number.

## Baseline Calculation

Baseline cash before the obligation is opening cash plus reimbursements whose expected date is on or before the obligation date.

The obligation is not subtracted from this amount. The field is cash immediately before the obligation is funded.

## Scenario Calculation

For each reimbursement, the scenario date is the expected date plus that reimbursement's delay in calendar days.

Scenario cash before the obligation is opening cash plus reimbursements whose scenario date is on or before the obligation date.

Amounts are not changed. Only dates move.

## Shortfall

Shortfall is `max(0, obligation amount - cash before the obligation)`.

Baseline and scenario each have their own shortfall.

## Timing Impact

Timing impact is scenario cash minus baseline cash.

A negative result means less cash is available before the obligation because one or more receipts moved past that date.

## Worked Synthetic Example

These figures are synthetic. They are not current OSpectra values, and they are not the numbers in the Financial forecast template.

- Opening cash: $50,000.
- Receipt A: $15,000 expected on 2 October 2026, no delay.
- Receipt B: $40,000 expected on 5 October 2026, delayed 14 days.
- Obligation: $70,000 on 6 October 2026.

Baseline includes both receipts, because 2 October and 5 October are on or before 6 October.

$50,000 + $15,000 + $40,000 = $105,000.

Baseline shortfall is $0.

Scenario: Receipt A stays on 2 October. Receipt B moves to 19 October, after 6 October, so it is excluded.

$50,000 + $15,000 = $65,000.

Scenario shortfall is $70,000 - $65,000 = $5,000.

Timing impact is $65,000 - $105,000 = -$40,000.

## Governance

- Only reimbursement timing changes.
- Reimbursement amounts stay constant.
- Opening cash stays constant.
- The obligation amount and date stay constant.
- Unrelated Financial metrics do not change, because this function does not read or write them.
- The result depends entirely on the assumptions passed by the caller.
- This does not estimate probability.
- This does not learn from historical data.
- This is not the existing `cash-forecast` route.
- This is not a calibrated forecast.

## Relationship to Existing POC

The approved question "What if reimbursements arrive later than expected?" routes to `cash-forecast` and returns the existing static synthetic forecast template.

This prototype is separate. It does not replace or modify that route.

## Relationship to Ontology

The design ontology already allows Claim → may_result_in → Payment → contributes_to → CashCollections.

This scenario changes when a Payment is counted toward cash before an obligation. It does not add a causal claim, and it does not change `lib/finance-ontology.ts`.

## Business Assumptions Requiring Validation

- Whether a receipt that arrives on the obligation date should count. This prototype includes it.
- Whether delays should use calendar days or business days. This prototype uses calendar days.
- Which cash balance should be used as opening cash. The live templates do not agree on a single cash figure, and this function does not choose one.
- Which obligations should be modeled. This prototype accepts one obligation per call.
- Whether a delay applies to selected reimbursements or to a whole class of reimbursements. Each receipt carries its own `delayedByDays`.
- Whether partial reimbursements need to be modeled later. This prototype treats each receipt as one amount that either is included or is not.
