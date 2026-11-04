# Graphs, Ontologies & Explainers — improvement plan from the meeting notes
**Built Nov 2, 2026** · Notes used: Oct 26 Research Preview (Gemini notes), Oct 27 follow-up, Oct 28 Research Preview
**Every item below names the note it comes from, the file it lives in, and a "done when" test.**
Repo state verified from the clone (in sync with GitHub HEAD): 131 tests passing.

## What the meeting notes actually demand (the source list)
| # | Murali's direction (from notes) | Where it lands |
|---|---|---|
| N1 | Explanations briefer, plain, actionable — not purely descriptive (Oct 26) | Explainers §3 |
| N2 | Fix cash receipt timeline overlap (Oct 26) | Graphs §1.1 — prototyped + verified Nov 2 |
| N3 | Growth dials as working sliders wired to calculations (Oct 26) | Graphs §1.2 / F2 |
| N4 | Out-of-scope = guidance to define/add a metric via workflow, not a dead-end reject; agent should not be strictly deterministic (Oct 26) | Ontologies §2.3 / F8 |
| N5 | Add data-science comparative + actionable insights (Oct 26) | Explainers §3.2 / F7 |
| N6 | LLM-suggested follow-up questions: drill-down / drill-up / drill-across (Oct 26) | Explainers §3.3 / F7 |
| N7 | Finance agent must answer core finance questions, do scenario planning + cash-flow projections, Kornacki standard — complex data made consumable (Oct 28) | Graphs §1.4, Explainers §3.1 |
| N8 | Research Preview scope: abstractions + spreadsheets; warehouse/QuickBooks/live = Phase 1 (Oct 27) | Gates in §5 |

---

## 1. GRAPHS — current state, then improvements

### Current state (verified in code)
- **Main agent** (`app/page.tsx`, `ResultChart`): recharts bar (incl. vertical "funnel" layout), single-series line, donut. Value labels + tooltips; **no** comparison series, reference lines, annotations, or click-to-drill.
- **Scenario demos**: Revenue Run-Rate and Growth Target use `LineChart` (Growth adds a target `ReferenceLine`); Cash Timing's timeline is a hand-built CSS rail.
- **Ontology demo**: nodes are positioned HTML (`od-node`), edges are *also printed as a text list* (`from → relationship → to`) — the graph's connections are not drawn as paths you can follow, and the investigation path is not highlighted on the graph.

### 1.1 Cash Timing timeline (N2) — DONE as verified prototype, land it today
Date-proportional points, staggered Oct 5 label, bridge above the rail. 131/131 tests pass. Patch: `step1-timeline-fix.patch`.

### 1.2 Growth Target + Run-Rate charts (N3, N7)
- Wire the four dials (admissions `n`, lifetime `L`, hours `h`, rate `p`) as sliders — engine already accepts them: `analyzeRunRateTarget(input)`, `lib/revenue-run-rate-target.ts:58`; Slider component exists at `components/ui/slider.tsx`. Chart + $5M date recompute from state.
- **Annotate the crossing**: a labelled dot where the selected series crosses the $5M `ReferenceLine` ("reaches $5M run-rate — week 110" at defaults), instead of making the viewer eyeball it. This is the Kornacki move: the chart states its own conclusion.
- Add the **2.5 admissions/week comparison case** (closes the Q3 "partial" from Present Data) as a toggleable series once sliders land.
- Census chart: add a plateau `ReferenceLine` + label (104 clients at 2/wk) — plateau is currently invisible.
- **Done when:** dragging admissions 2 → 3 updates the chart, the crossing label, and the explainer in the same render; the three verified cases (1/2/3 per week) still reproduce.

### 1.3 Cash Timing — add the step chart the scenario research calls for (N7)
The scenario doc (`docs/scenario-planning-delayed-reimbursement-v0.1.md`) defines baseline vs scenario shortfall, but the demo shows it as two numbers. Add a **cumulative step chart**: cash-before-obligation building receipt by receipt (Oct 2 +$15K → Oct 5 +$40K), with the $70K obligation as a horizontal line; the delayed series as a second step line that stays under the obligation line at Oct 6. One glance = the whole story.
- **Done when:** both series + obligation line render from `compareCashTimingScenario` output — no new numbers hard-coded in the component.

### 1.4 Main-agent charts — comparison is the missing dimension (N5)
- Add an optional **previous-period series** to line/bar charts (grey) behind the current series (purple). The metric strip already shows a delta (`metric.delta` in `app/page.tsx`) — the chart should show what the delta describes.
- Add `ReferenceLine` support for governed thresholds/averages where a metric defines one.
- This pairs with the quarter filter (gated on the canonical-metric decision) — chart work can be built against the synthetic data now.
- **Done when:** one governed question (e.g. offer acceptance by month) renders current vs previous period with a legend, and its explainer's comparative line (F7) matches the chart.

### 1.5 Ontology graph visual (supports §2)
- Draw the edges: SVG lines between node positions, so a path (Claim → Denial → Appeal) can be *followed*, not read off a list. Keep the text edge list as the accessible fallback.
- **Highlight the investigation path**: when a plan is selected, its edges/nodes get the active colour; everything else dims. The plan data already exists (`InvestigationPlan` steps carry `OntologyRelationshipRef`s).
- **Done when:** selecting the cash-collections investigation lights exactly its path on the graph, and clicking a node still opens its concept details (`getConceptInvestigationDetails`).

---

## 2. ONTOLOGIES — current state, then improvements

### Current state (verified in code)
- `lib/finance-ontology.ts`: **9 edges, 10 concepts** — Client → Service → Visit → Claim → Payer, Claim → Denial, Claim → Payment → CashCollections, Visit → Authorization, Claim → Branch. Header says design-only.
- `lib/finance-ontology-investigation.ts` (283 lines, tested): investigation plans with evidence states (`AVAILABLE / MISSING_EVIDENCE / UNSUPPORTED / INVESTIGATE`) and bounded conclusions; `relationshipExists` / `assertRelationshipRefsExist` guard every referenced edge.
- Recruitment has a real semantic model (`semantic/recruitment-model.yaml`); **finance has no YAML model** — the TS edge list is all there is.
- Design doc: `docs/financial-ontology-kg-demo-v0.1.md` (entities, relationships, governance rules, scenario connection).

### 2.1 Extend the finance ontology with the RCM cycle (the scenario research, made structural)
Candid/RCM research gives the missing half of the chain. Add concepts + edges, each guarded by the existing assert in tests:
- `Claim → denied_as → Denial`, `Denial → categorized_by → DenialReason`, `Denial → may_be_appealed_via → Appeal`, `Appeal → may_restore → Payment`
- `Payment → posted_as → Remittance`, `Remittance → reconciles_to → CashCollections`
- `Claim → ages_in → AccountsReceivable`, `CashCollections → funds → PayrollObligation`
- `Payer → applies → PayerRule`, `PayerRule → governs → Claim` (the Candid lesson: rules as first-class concepts, not code)
- `Authorization → limits → Visit` (already implied by `covered_by`; make the limit explicit)
- **Done when:** `financeOntology` covers the full Authorization → Claim → Cash chain, all investigation tests still pass, and a new investigation plan "Why is cash late?" can walk Claim → Denial → Appeal and Claim → A/R → PayrollObligation using only asserted edges.

### 2.2 Give finance a semantic model file (parity with recruitment)
Create `semantic/finance-model.yaml` mirroring `recruitment-model.yaml`'s structure: concepts from §2.1, metrics (once Bucket-1 decides finance scope), sources marked `synthetic` today. This is the file Jags' warehouse tables will eventually map to — it's the DE handover seam.
- **Gated:** metric entries wait for the finance-scope decision; concepts/edges can be written now.

### 2.3 Ontology powers the out-of-scope workflow (N4)
When a question is BLOCKED, the agent should point at the *nearest governed concept* on the graph ("LTV isn't defined; the closest governed concept is Cost per Productive Care Hour via Client → Service → Visit") and open the define-a-metric form pre-filled with that concept. The ontology stops being a demo page and becomes the router's map.
- **Done when:** the LTV refusal offers the nearest-concept path + the definition workflow, instead of a dead end.

---

## 3. EXPLAINERS — current state, then improvements

### Current state (verified in code)
- Schema (`lib/visualization-explainer.ts`): `GovernedExplainer` = title + 4 slots (What you're looking at / What it shows / Why it matters / What you can conclude) + limitations. Rendered by `ExplainerCard`.
- 7 explainer functions in `lib/research-explainers.ts` (cash comparison, cash timeline, run-rate, census, growth target, ontology graph, investigation plan), with tests.
- **The weakness is visible in the text itself:** slots are descriptive and model-focused ("The model includes a reimbursement in cash-before-obligation based only on its arrival date…"). Limitations are strong; *actions are absent*. That is exactly N1/N5/N6.

### 3.1 Schema v2 — add the three missing slots (all optional, back-compatible)
Extend `GovernedExplainer` with:
- `comparativeInsight?: string` — vs baseline / previous period / the other scenario (N5)
- `nextAction?: string` — one action, with a number and a date where the data supports it (N1)
- `followUps?: { drillDown: string; drillUp: string; drillAcross: string }` — suggested follow-up questions (N6)
Render each in `ExplainerCard` only when present. Add tests: for the two backfilled explainers, assert all three slots are present and `nextAction` is a single sentence.
- **Done when:** schema + card + tests land without breaking the other 5 explainers (they render as today).

### 3.2 Backfill + plain-language pass (N1, N7)
- Backfill order: **cash-timing comparison first** (it's the wedge), then growth target, then run-rate/census; ontology/investigation explainers last.
- Rewrite rule for every `whyItMatters`: business consequence first ("Payroll on Oct 6 is short $40K"), model mechanics move to limitations or get cut. Headline test (Kornacki): if a viewer reads only the title + first slot, do they know the decision? 
- Worked example — cash timeline explainer, `nextAction`: "Chase Receipt B's payer before Oct 5; every day of delay after the cutoff is a day the $70K obligation is uncovered." `comparativeInsight`: "Baseline: $105K available before the obligation. Delayed: $65K. The $40K timing difference is the entire risk — amounts never change." `followUps`: down = "Which payer owes Receipt B?", up = "What is total cash timing risk this quarter?", across = "Which payroll dates does this pattern threaten next?"
- **Done when:** the two demoed explainers read at the Oct 27 rewrite standard (brief / plain / actionable), verified against the cash-timing + growth-target rewrites already approved.

### 3.3 Follow-ups become clickable (N6, with F7)
In the main agent, render `followUps` as three chips (Drill down / Drill up / Drill across) that submit the suggested question. On scenario pages, render them as text under the ExplainerCard (navigation between scenario families already exists via tabs).

---

## 4. Scenario research — the queue behind the graphs
From `docs/scenario-planning-delayed-reimbursement-v0.1.md` ("Business Assumptions Requiring Validation") + the RCM research. Each is a fixture + lib function + chart + explainer, following the cash-timing pattern that already works:
1. **Delay sensitivity sweep** — same claim delayed 0 / 7 / 14 / 21 / 30 days: table + step chart. Lib: a sweep wrapper around `compareCashTimingScenario` (one assumption changes at a time — the demo's own rule). *Smallest, do first.*
2. **Denial scenario** — claim denied, appealed, paid +30 days: uses ontology §2.1's Denial → Appeal path; shows why denial rate is a cash-timing variable, not just a billing metric.
3. **Authorization shortfall** — authorized hours cut mid-period: connects ontology (Authorization → Visit) to run-rate revenue.
4. **Payroll buffer sizing** — what buffer covers a 30-day delay on the largest expected receipt? Output = a policy number an operator can hold ("buffer ≥ largest single expected receipt").
Each scenario ships with its assumptions listed on screen, synthetic-labelled — the governance pattern the docs already set.

---

## 5. Next steps — sequence + gates
**Today (Nov 2, at/after the 11:30 call)**
- F1. Land the timeline patch in Cursor (verified prototype ready). Commit with before/after screenshots.

**This week (no decisions needed)**
- F2. Growth sliders (§1.2) — state + `analyzeRunRateTarget`, crossing annotation, plateau line.
- F3. Explainer schema v2 (§3.1) + backfill cash-timing & growth-target (§3.2).
- F4. Delay sensitivity sweep (§4.1) + cash step chart (§1.3).

**Next (needs Jags in the loop)**
- F5. RCM ontology extension (§2.1) + "Why is cash late?" investigation plan.
- F6. Ontology graph: drawn edges + path highlighting (§1.5).
- F7. Main-agent comparative series (§1.4) + clickable follow-up chips (§3.3) + nearest-concept refusal (§2.3).

**Gated on Bucket-1 decisions (Murali)**
- F8. Finance semantic YAML with metrics (§2.2) — waits on finance-scope + canonical list.
- F9. Quarter filter powering §1.4's previous-period series for real.
- F10. RCM scenario family in the repo (v2 charts, spreadsheet fixture) — waits on finance scope; DE schemas (claims/remittance/payroll) designed with Jags.

**Standing guardrails:** no new explainer without the three new slots filled · no new chart without its one-line conclusion on screen · no new metric without a governed definition · numbers always reconciled to source fixtures, never typed into components.
