# E1+E2 — Cursor prompt: explainer schema v2 + backfill (both agent halves + how-it-works)
Written Nov 3, 2026 for today's meeting. PLAN.md items E1 + E2. Run AFTER the G2 completion lands.
Design rule: every explainer gains three optional slots — comparativeInsight (vs baseline/other case), nextAction (one sentence, with a number/date), followUps {drillDown, drillUp, drillAcross}. Optional = the other explainers render exactly as today.

---
PROMPT (paste into Cursor):

Implement PLAN.md items E1 and E2: extend the explainer schema and backfill three explainers. Work in lib/visualization-explainer.ts, components/explainers/ExplainerCard.tsx, and lib/research-explainers.ts. Adapt to the code as it exists on main — if signatures differ from what's described, keep the same slot names, semantics, and text.

1. Schema: add three OPTIONAL fields to the GovernedExplainer type:
   comparativeInsight?: string
   nextAction?: string
   followUps?: { drillDown: string; drillUp: string; drillAcross: string }

2. Rendering: in ExplainerCard, render each new slot only when present, after the existing slots and before limitations, with these labels: comparativeInsight → "Compared to baseline", nextAction → "Next action", followUps → "Ask next" with the three questions listed as "Drill down: …", "Drill up: …", "Drill across: …". Style them consistently with the existing slots; nextAction should be visually distinct (it is the action).

3. Backfill these three explainer functions with the exact slot text below (do not rewrite it):

   a) explainCashTimingComparison (finance half):
   comparativeInsight: "Baseline: $105K available before the Oct 6 obligation. Delayed: $65K. The $40K timing difference is the entire risk — the amounts never change."
   nextAction: "Chase Receipt B's payer before Oct 5; every day it slips past the cutoff leaves the $70K obligation uncovered."
   followUps: drillDown "Which payer owes Receipt B?", drillUp "What is the total cash-timing risk this quarter?", drillAcross "Which payroll dates does this pattern threaten next?"

   b) explainGrowthTargetChart (recruitment/growth half):
   comparativeInsight: "At the reference dials, 2 admissions/week plateaus at $5.68M annualized and crosses $5M at week 111; 1/week plateaus at $2.84M and never reaches it; 3/week crosses at week 46."
   nextAction: "Hold admissions at or above about 1.76/week — below that pace the $5M run-rate is unreachable at the current lifetime, hours, and rate."
   followUps: drillDown "Which lever — admissions, lifetime, hours, or rate — moves the crossing week most?", drillUp "What pace does the $10M target require?", drillAcross "What does the growth path do to contribution margin once costs are applied?"

   c) explainOntologyGraph (how the agent works):
   comparativeInsight: "Recruitment questions run on a governed semantic model with declared metrics; the finance concepts on this graph are connected, but finance has no governed metric catalog yet — that difference is exactly what this page makes visible."
   nextAction: "Treat the graph as the agent's map: if a relationship is not on it, the agent should not claim it — it should say what evidence is missing instead."
   followUps: drillDown "What evidence supports the Claim to Payment relationship?", drillUp "Which investigation plans walk this graph?", drillAcross "Where does CashCollections connect back to the cash-timing scenario?"

4. Tests: extend the existing research-explainers tests — for these three functions assert all three slots are present, followUps has all three keys, and nextAction is a single sentence. Assert the other explainer functions still return undefined for the new slots (back-compat).

Acceptance checks — verify and report:
- npm test: full suite passes (167 + the new assertions). npm run build: green.
- On /scenario-demo: the Cash Timing comparison card and the Growth Target card now show "Compared to baseline", "Next action", and "Ask next" sections; on /ontology-demo the graph explainer shows them too; a non-backfilled explainer (e.g. census) renders exactly as before.
- Update PLAN.md: check E1 and E2 with today's date (Nov 3, 2026) and add ONE Log entry covering both (What / Why / How / Evidence).
- Show me the full diff and stop. Do not commit.
