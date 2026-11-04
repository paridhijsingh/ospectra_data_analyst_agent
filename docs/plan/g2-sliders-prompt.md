# G2 — Cursor prompt: growth-target dials as working sliders
Saved Nov 2, 2026. Companion to PLAN.md item G2 in the repo.
Verified reference numbers (defaults L=52, h=30, p=35): plateaus — 1/wk $2,839,200 · 2/wk $5,678,400 (first reaches $5M at week 110) · 3/wk $8,517,600 (week 46) · required admissions ≈ 1.76/week.

---
PROMPT (paste into Cursor):

Make the Growth Target scenario demo's model dials interactive sliders. Work in components/scenario-demo/GrowthTargetScenarioDemo.tsx and lib/revenue-run-rate-target-demo.ts. Do not change the underlying math in lib/revenue-run-rate-target.ts or lib/revenue-run-rate-scenario.ts — reuse projectRevenueRunRate, analyzeRunRateTarget, and requiredSteadyStateAdmissions as they are.

Current state: the page compares three fixed cases (1, 2, 3 admissions/week) with L=52 weeks, h=30 hrs/client/week, p=$35/hr frozen from growthTargetReference, and the "Current model dials" panel prints those values as static text. There is no state and no input anywhere in the component.

Changes:

1. Parameterize the demo lib. In lib/revenue-run-rate-target-demo.ts, let getGrowthTargetScenarios and getGrowthTargetRequiredAdmissions accept optional overrides { L, h, p } that default to growthTargetReference values, so existing callers and tests are unaffected. Add a way to build one custom scenario for an arbitrary admissions rate n (reusing the same project + analyze calls), returning the same GrowthTargetScenario shape with key 'custom'.

2. Add state to the component: L (default 52, range 26–104, step 1, unit weeks), h (default 30, range 10–40, step 1, unit hrs/client/week), p (default 35, range 25–50, step 1, unit $/hr), and customN (default 2.5, range 1–4, step 0.5, unit admissions/week). Use the existing Slider component from components/ui/slider.tsx (it wraps @base-ui/react/slider; value is an array). Recompute scenarios, required admissions, and chart points from state with useMemo — every displayed number must derive from the recomputed scenarios, never from growthTargetReference directly.

3. Turn the "Current model dials" panel into the controls panel: one slider per dial, each showing its current value formatted like the current static text (e.g. "2.5/week", "52 weeks", "30 hrs/client/week", "$35/hour"). Rename the panel heading to "Model dials" and its note to say the chart and cards update live. In the "Future business scenarios" list, remove Retention / average lifetime, Service intensity, and Billing rate (they are now modeled by the L, h, p sliders); keep Branch expansion and Additional revenue streams.

4. Chart: keep the existing three series (n1/n2/n3) and the $5M target ReferenceLine exactly as they are at default dial values. Add a fourth Line for the custom scenario (dataKey customAnnualized, name "Custom (slider)", a distinct colour, strokeWidth 2, dashed) and extend toGrowthTargetChartPoints (or build the points in the component) to include it from the custom scenario's trajectory, annualized the same way. Add a ReferenceDot on the BASELINE (n2) series at its first-reached point — x = firstReachedWeek / weeksPerYear, y = targetAnnualizedRunRate — with a small label "reaches $5M — week {firstReachedWeek}", shown only when the baseline analysis state is REACHED.

5. Result cards: keep the three existing case cards (they recompute from state). Do not add a card for the custom scenario in this change.

6. Explainer: keep passing the three standard scenarios to explainGrowthTargetChart, unchanged.

Acceptance checks — verify all of these and report the results:
- At default dial values the page is numerically identical to today: plateaus $2,839,200 / $5,678,400 / $8,517,600, baseline first reached week 110, 3/week week 46, required admissions ≈ 1.76/week.
- Moving the L slider to 26 halves the plateaus; moving p to $50 raises them proportionally; the custom series and the ReferenceDot move accordingly and disappear/relabel correctly when the baseline becomes UNREACHABLE.
- npm test: all existing tests still pass. Add tests for the parameterized lib functions (e.g. scenarios built with L=26 have half the plateau of L=52 at the same n, h, p).
- Show me the full diff before I commit.
