# PLAN — Data Analyst Coworker: graphs, ontologies, explainers, scenarios

**Owner:** Paridhi · **Started:** Nov 2, 2026 · **Source of direction:** Murali's asks from the Oct 26–28 meeting notes + Candid Health / RCM research (Nov 1)
**Supporting material:** everything for this plan lives in this repo under `docs/plan/` — Candid/RCM meeting prep · capabilities-gaps-improvements inventory · graphs-ontologies-explainers improvement plan · RCM View mocks (v1 + v2) · Nov 2 deck + speaker notes · pair-coding plan · Step 1 brief + patch · G2 sliders prompt · PLAN.md master prompt

## How we work this file
- Build order is top to bottom within each phase. **Do not skip the gates** (Phase 0 / Phase 3 items need Murali's or Jags' input first).
- When an item is finished: check its box `[x]`, add its date, and **add an explainer entry in the Log at the bottom** — what we did, *why* we did it, *how* it works, and the evidence (tests / screenshot). No log entry = not done.
- Pair mode: the approach is agreed first, the code is written in Cursor, and the diff is reviewed before anything is committed.
- Guardrails: no new chart without its one-line conclusion on screen · no new explainer without the action/follow-up slots filled · no new metric without a governed definition · numbers come from fixtures/lib, never typed into components.

Status key: `[ ]` todo · `[~]` in progress / prototyped · `[x]` done + logged · 🔒 gated

---

## Phase 0 — Decisions (🔒 Murali, blocks Phase 3)
- [ ] **D1. $5M definition** — Is $5M annual gross revenue? All growth-target math assumes it.
- [ ] **D2. Canonical metric list** — 11 governed names (Drive) vs 8 declared in code; name the 12th metric.
- [ ] **D3. Undeclared metrics** — Declare or cut `application_share` + `active_pipeline_rate` (engine answers both, neither is governed).
- [ ] **D4. Finance / RCM scope** — Is the finance half in scope for Paridhi now? Is Candid a reference model only, or an evaluation?
- [ ] **D5. DE ranking (Jags)** — Rank the data integrations (proposal: claims lifecycle + remittance + payroll obligations first).

## Phase 1 — This week, no decisions needed

### Graphs
- [x] **G1. Fix cash receipt timeline overlap** — *Why:* Murali's Oct 26 ask; the equal-column grid made 1 day look like 13, and the "+14 DAYS" pill was obscured by the Oct 6 obligation dot. *How:* points positioned by date on an Oct 2–19 axis (0% / 17.6% / 23.5% / 100%), Oct 5 label staggered above the rail, delay bridge redrawn above the rail; layout only, lib untouched. Files: `components/scenario-demo/CashTimingScenarioDemo.tsx`, `app/globals.css`. *Done when:* no overlap at demo zoom + 131 tests pass + committed. **Status: landed Nov 3, 2026 (verified patch applied in Cursor; awaiting your commit).**
- [x] **G2. Growth-target sliders + chart annotations** — *Why:* Murali's ask; dials are static text today, so the model can't be explored live. *How:* v0.6 shipped with n/L inputs, costs, branches; completed Nov 3 by unfreezing h/p, adding the crossing annotation and the census plateau line. *Done when:* dragging a slider updates chart + crossing label + explainer in one render; verified 1/2/3-per-week cases still reproduce. **Status: landed Nov 3, 2026 (awaiting your commit).**
- [ ] **G3. Cash-timing step chart** — *Why:* the scenario doc's baseline-vs-delayed story is currently two numbers; a step chart makes the shortfall visible in one glance (Kornacki standard, Oct 28). *How:* cumulative step lines for baseline vs delayed receipts from `compareCashTimingScenario` output + $70K obligation reference line. *Done when:* both series render from lib output, no hard-coded numbers in the component.

### Explainers
- [x] **E1. Explainer schema v2** — *Why:* current explainers describe the model, not the decision — the exact gap Murali flagged ("actionable, not purely descriptive"; plus comparative insights + drill follow-ups, Oct 26). *How:* extend `GovernedExplainer` (`lib/visualization-explainer.ts`) with optional `comparativeInsight`, `nextAction`, `followUps {drillDown, drillUp, drillAcross}`; render in `ExplainerCard` only when present; tests assert presence + single-sentence action for backfilled explainers. *Done when:* schema + card + tests land and the other 5 explainers render unchanged. **Status: landed Nov 3, 2026 (awaiting your commit).**
- [x] **E2. Backfill cash-timing + growth-target explainers** — *Why:* these two are the demoed wedge stories; they set the standard. *How:* fill the three new slots (prompt also backfills ontology graph); slot text from `docs/plan/e1-explainer-v2-prompt.md` is final. *Done when:* both read at the Oct 27 approved rewrite standard (brief / plain / actionable). **Status: landed Nov 3, 2026 with E1 (awaiting your commit).**

### Scenario research
- [ ] **S1. Delay sensitivity sweep** — *Why:* "what if it's 7 days late, or 30?" is the natural next question after the 14-day scenario; one assumption changes at a time (the demo's own rule). *How:* sweep wrapper around `compareCashTimingScenario` for delays 0/7/14/21/30 + tests; table in the demo under the timeline. *Done when:* sweep table values match the lib for all five delays.

### UI / workflow
- [ ] **U1. Header persona cleanup** — *Why:* UI still says "Vasu Rao — Manager Access" from the transferred POC. *How:* replace with a neutral demo persona. *Done when:* no POC persona in any screenshare view.
- [ ] **U2. Status chips + feedback** — *Why:* users can't tell governed answers from finance templates on screen; PRD requires feedback on every response and the code has none. *How:* chip per answer (Governed / Template–not computed / Synthetic) driven by answer source; thumbs up/down + reason, local state. *Done when:* a finance template and a recruitment governed answer are distinguishable at a glance.

## Phase 2 — With Jags (data engineering)
- [ ] **O1. Extend finance ontology with the RCM chain** — *Why:* ontology stops at Payment → CashCollections; the RCM research supplies the missing half, and rules-as-concepts is Candid's core lesson. *How:* add edges in `lib/finance-ontology.ts` — Claim→Denial→DenialReason, Denial→Appeal→Payment, Payment→Remittance→CashCollections, Claim→AccountsReceivable, CashCollections→PayrollObligation, Payer→PayerRule→Claim, Authorization→limits→Visit; all refs guarded by `assertRelationshipRefsExist` tests. *Done when:* a "Why is cash late?" investigation plan walks the new edges using only asserted relationships.
- [ ] **O2. Ontology graph: drawn edges + path highlighting** — *Why:* edges are currently a text list; a path you can't follow visually can't teach. *How:* SVG edges between node positions in `OntologyInvestigationDemo`; selecting a plan highlights its edges/nodes, rest dims; keep text list as fallback. *Done when:* selecting the cash-collections investigation lights exactly its path.
- [ ] **G4. Comparative charts in the main agent** — *Why:* Murali asked for comparative insights (Oct 26); the metric strip shows a delta the chart doesn't show. *How:* optional previous-period series (grey) in `app/page.tsx` `ResultChart` + reference-line support for governed thresholds. *Done when:* one governed question renders current vs previous with legend, matching its explainer's comparative line.
- [ ] **E3. Clickable follow-ups + nearest-concept refusals** — *Why:* Murali: the agent should not be strictly deterministic — a missing metric should guide, not dead-end (Oct 26). *How:* render `followUps` as chips that submit the question; on BLOCKED answers, use the ontology to offer the nearest governed concept + open the define-a-metric workflow (U3). *Done when:* the LTV refusal offers a nearest-concept path and the workflow, in under a minute live.
- [ ] **U3. Define-a-metric workflow** — *Why:* Murali's Oct 26 ask #4; governance is how new metrics are born, not a rejection. *How:* form (name, owner, formula, sources, purpose) → pending-governance list, local state; workflow shape is the deliverable. *Done when:* a blocked question flows refusal → form → pending queue live.
- [ ] **DE1. Spreadsheet schemas with Jags** — claims lifecycle, remittance/posting, payroll obligations (grain + keys agreed with Jags). *Done when:* one typed data file in the repo mirrors the agreed schema and the RCM view (Phase 3) can consume it.

## Phase 3 — Gated on Phase 0 decisions 🔒
- [ ] **O3. Finance semantic model** 🔒D2/D4 — `semantic/finance-model.yaml` mirroring recruitment's; metrics only once the canonical list + finance scope are decided.
- [ ] **G5. Quarter filter** 🔒D2 — period parameter on the executor; powers G4's previous-period series for real; closes the Q2 partial.
- [ ] **G6. Time-to-fill** 🔒D2 — governed definition written *first*, then code; grouped by role family; closes the Q1 partial.
- [ ] **S2–S4. More scenarios** — denial scenario (uses O1's Appeal path), authorization shortfall, payroll buffer sizing (output: "buffer ≥ largest single expected receipt").
- [ ] **R1. RCM View page in the repo** 🔒D4 — v2 mock's six visuals, data from DE1's file, not hard-coded numbers.
- [ ] **P1. Phase 1 handover package** — finance catalog draft + schemas + this plan's log, so engineering doesn't re-decide metrics or ontology.

---

## Log — explainers (add an entry per finished item)
*Template:*
> ### [ID] Title — date
> **What:** one line. **Why:** the note/decision behind it. **How:** approach + files. **Evidence:** tests / screenshot / commit.

### [Prep] Candid Health + RCM research, capabilities/gaps inventory, RCM View v1+v2, 11-slide deck — Nov 1–2, 2026
**What:** Research and design artifacts prepared outside the repo for the Nov 2 meeting. **Why:** Murali asked for a Candid Health exploration while exploring RCM, and for improvements/UI/DE direction with Jags. **How:** Candid framed as a reference model (payer rules engine; net collection rate; Touchless Claim Rate), home-care/HCBA fit explicitly unverified, pricing not published so never quoted; RCM view mocks reconcile all splits to the $190K earned-not-collected template story and are labelled Prototype / Synthetic / Not governed. **Evidence:** prep + inventory + plan docs and HTML/PNG mocks in `docs/plan/`.

### [G1] Timeline fix — Nov 3, 2026
**What:** Date-proportional receipt timeline replacing the equal-column grid. **Why:** the old grid made Oct 5→6 (1 day) the same width as Oct 6→19 (13 days), and the +14 DAYS pill rendered obscured behind the obligation dot ("+14 ●'S" in the before screenshot). **How:** absolute positioning on an Oct 2–19 axis, staggered baseline label, bridge above the rail; layout-only, calculation lib untouched. **Evidence:** `npm test` — 167/167 passed; `npm run build` green; verified patch/brief in `docs/plan/step1-timeline-fix.patch` + `docs/plan/step1-timeline-fix-brief.md`; open `/scenario-demo` Cash Timing tab to verify no label/pill/point overlap and Oct 5→6 vs Oct 6→19 spacing.

### [G2] Growth-target h/p dials + crossing + census plateau — Nov 3, 2026
**What:** Completed G2 on the v0.6 Growth Target page and added the census plateau line on Revenue Run-Rate. **Why:** PLAN.md G2 still needed live h/p controls, a labelled target-crossing annotation, and a census plateau reference. **How:** Unfroze h (10–40) and p ($25–50) as range inputs wired into every projection/cost/branch path; ReferenceDot + label when analysis state is REACHED; census chart ReferenceLine at baseline `censusPlateau`. Libs' math untouched. Spec: `docs/plan/g2-completion-prompt-v06.md`. **Evidence:** defaults regression (h=30, p=35, $5M, 4y) — same lib inputs/outputs as before at defaults; `npm test` 167/167; `npm run build` green; verify on `/scenario-demo` Growth Target (h/p dials + crossing dot) and Revenue Run-Rate (census plateau line).

### [E1+E2] Explainer schema v2 + backfill — Nov 3, 2026
**What:** Optional `comparativeInsight` / `nextAction` / `followUps` on `GovernedExplainer`, rendered in `ExplainerCard` when present; backfilled cash-timing comparison, growth-target chart, and ontology graph with the approved slot text. **Why:** Murali asked for actionable, comparative explainers with drill follow-ups — not description-only cards. **How:** Schema + card + CSS in `lib/visualization-explainer.ts`, `components/explainers/ExplainerCard.tsx`, `app/globals.css`; exact copy in `lib/research-explainers.ts`; tests in `lib/research-explainers.test.ts`. Spec: `docs/plan/e1-explainer-v2-prompt.md`. Non-backfilled explainers leave the new slots undefined. **Evidence:** `npm test` 169/169; `npm run build` green; verify Compared to baseline / Next action / Ask next on `/scenario-demo` Cash Timing comparison card, Growth Target (turn off branch expansion to show the chart explainer), and `/ontology-demo` graph explainer; census explainer unchanged.
