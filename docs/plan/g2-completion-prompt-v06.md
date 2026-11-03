# G2 completion prompt — layer onto v0.6 (supersedes g2-sliders-prompt.md)
Written Nov 3, 2026, after Cursor flagged that main (HEAD eef0e17 "Fixed Sliders") already ships a v0.6 interactive Growth Target page: costs, branch expansion, target/horizon pills, range inputs for admissions and lifetime. The original G2 prompt was written against the older v0.3 page and is superseded — do NOT restore v0.3.

What v0.6 still lacks vs PLAN.md item G2:
1. h (service hours) and p (billing rate) are frozen as FIXED constants from growthTargetReference.
2. No labelled crossing point where the primary series reaches the selected target.
3. Census chart has no plateau reference line (PLAN G2 includes it; the old prompt omitted it).

---
PROMPT (paste into Cursor):

Context: the Growth Target demo on main is v0.6 — interactive, with costs, branch expansion, target/horizon pills, and range inputs for admissions (n) and lifetime (L). Keep ALL of that. This change only completes PLAN.md item G2 on top of v0.6. Do not restore any older page shape, and do not change any calculation lib's math.

Change 1 — unfreeze h and p. In components/scenario-demo/GrowthTargetScenarioDemo.tsx, h and p are currently FIXED constants (from growthTargetReference: h=30, p=35). Convert them to state-driven range inputs following the same pattern this page already uses for n and L: h range 10–40, step 1, default 30, unit hrs/client/week; p range 25–50, step 1, default 35, unit $/hour. Every projection, cost, and branch computation that currently reads the FIXED h/p must read the state values instead. The FIXED weeksPerYear stays fixed.

Change 2 — crossing annotation. On the growth chart, add a ReferenceDot on the primary series at the point where analyzeRunRateTarget reports firstReachedWeek for the currently selected target, with a label "reaches $5M — week {firstReachedWeek}" (use the selected target's label). Convert week to the chart's existing x-axis units the same way the existing series do. Render the dot + label only when the analysis state is REACHED; hide it for NOT_REACHED_WITHIN_HORIZON and UNREACHABLE_UNDER_ASSUMPTIONS.

Change 3 — census plateau line. In the Revenue Run-Rate demo's census chart (components/scenario-demo/RevenueRunRateScenarioDemo.tsx), if it does not already have one, add a ReferenceLine at the plateau census (the result's derived plateau, n × L clients) with a label "plateau — {value} clients". If it already has one, skip this change and say so.

Acceptance checks — verify and report:
- With h=30 and p=35 (defaults), target $5M, horizon 4 years: every number displayed is identical to before this change (this is a pure regression check — the change must not move any default output).
- Moving h to 40 or p to $50 raises the plateaus and pulls the crossing week earlier; moving h to 20 can flip the state to UNREACHABLE and the crossing dot disappears.
- npm test: full suite passes (167 on main). npm run build: green.
- Update PLAN.md item G2: revise its How text to "v0.6 shipped with n/L inputs, costs, branches; completed Nov 3 by unfreezing h/p, adding the crossing annotation and the census plateau line", check its box with today's date (Nov 3, 2026), and add the Log entry (What / Why / How / Evidence).
- Show me the full diff and stop. Do not commit.
