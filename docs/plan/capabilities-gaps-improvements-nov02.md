# Data Analyst Coworker — Capabilities, Gaps & Improvements
**Canonical list for Mon Nov 2, 2026** · Sources: firsthand repo review (Oct 25), Present Data + Compare PRD (Oct 26), gap analysis (Oct 27), handover to Jags (Oct 30), Candid Health + RCM research (Nov 1)
**Repo:** github.com/paridhijsingh/ospectra_data_analyst_agent — Next.js + TypeScript, 131 tests passing, build passing, all data synthetic

---

## A. Current capabilities — what it can actually do today

### Architecture (proven on synthetic data)
1. **Governed answering pipeline:** Intent router → Semantic validator → Metric executor → Quality guard → Narrative composer
2. **Lineage on every answer:** metric, definition, query plan, policy pass/block — visible to the user
3. **Refusal that works:** asking for LTV returns `supported: false`, "BLOCKED by semantic policy" — zero LTV/CAC code paths. The refusal is the feature.
4. **Answer shape matches the User Journey doc:** answer + table + chart + interpretation, with drilldown

### Recruitment half (stronger half)
5. **12 governed questions** over 1,019 synthetic applications (Apr–Sep 2026)
6. Present Data record, honestly graded:
   - Q4 / Q5: **Yes** — on `/scenario-demo` (run-rate / growth target; $5M hardcoded, unconfirmed)
   - Q1: Partial — time-to-hire **by department**; no time-to-fill
   - Q2: Partial — no quarter filter
   - Q3: Partial — scenario page only; no 2.5-admissions comparison case
   - Q8: No as asked — volume + conversion by source only; no fill speed
   - Q6: No — no LTV/CAC · Q7: No — no second-branch parameter
7. **Scenario planning exists** as a separate page: admissions → census → revenue over time, growth-target math verified (1/wk plateaus ~$54.6k/wk; 2/wk → ~$109.2k/wk, ~$5.68M/yr by wk 111; 3/wk reaches $5M run-rate wk 46; ~1.76/wk is the break-even pace)

### Finance half (exists, but templated)
8. **25 financial questions** — answered from **static templates** (e.g. $1.44M earned / $1.25M collected), not computed. Looks governed, is not.
9. **Two explanations rewritten to Murali's standard** (Oct 27) and re-demoed: cash timing and growth target — brief, plain, actionable

### Documentation / process assets
10. Seven-folder Drive library + PRD v1.0 comparison done line-by-line; 13 paste-ready PRD comments prepared (not yet pasted, holding for Murali's agreement in the room)
11. Wedge prototypes (separate, Streamlit): payroll funding-readiness + admissions run-rate planner, tests passing, synthetic disclaimers

---

## B. Gaps — in the three buckets from Oct 27

### B1. Decisions needed first (not code — these unblock everything)
1. Is **$5M** annual gross revenue? All growth math assumes it.
2. **Canonical metric list:** 11 governed names (Drive) vs 8 declared in repo — only 3 overlap (offer acceptance rate, stage conversion, average time to hire). What is the 12th metric? ("12 approved metrics" exists nowhere as a list; the registry's 12 = question IDs.)
3. Declare or cut **`application_share`** + **`active_pipeline_rate`** — engine answers both, flagged review-required, not declared. They break the registry's own rule.
4. Is the **financial / RCM half in scope** for Paridhi now, or recruitment only?
5. Is **LTV/CAC** in scope? If yes, cost per client-week + CAC must be defined first (gross LTV on reference numbers = $54,600; net cannot be computed without costs).
6. Scope Compare PRD to **Phase 1 / MVP only** (recommendation: yes).

### B2. Build gaps — Research Preview scope (spreadsheet / abstraction level)
1. **No out-of-scope / define-a-metric workflow** — blocked questions dead-end instead of guiding: owner → formula → sources → purpose → governance queue → notify when available *(Murali ask #4)*
2. **"Why" and "Next" are thin** — one-line insights; User Journey requires What → Where → Why → What next. Murali also asked (Oct 26) for comparative/actionable data-science insights and **LLM-suggested follow-up questions (drill-down / drill-up / drill-across)**
3. **No quarter filter** — longitudinal questions are a core domain; repo answers only over the whole 6-month window
4. **No time-to-fill** — governed on paper, not answerable; grouping is by department, not role family
5. **Finance ungoverned, no semantic catalog** — recruitment has a YAML model, finance has none; user can't tell governed from template on screen
6. **Scenario + ontology pages not wired into the agent** — ask a run-rate question in chat, get nothing
7. **Cash receipt timeline overlap** — rendering bug on scenario page; numbers verified underneath *(Murali ask #2)*
8. **Growth dials are fixed inputs, not controls** — only admissions effectively varies; lifetime / hours / rate are constants; future levers (retention, intensity, rate, branch) listed, not modelled *(Murali ask #3)*
9. **No feedback loop** — PRD requires data-quality indicators + thumbs up/down on every response; quality guard exists in trace, feedback not found in code
10. **Header still says "Vasu Rao — Manager Access"** — transferred POC persona in the UI

### B3. Phase 1 / engineering handover (list, don't build now — Murali's Oct 27 scope rule)
Warehouse connector + financial semantic model · QuickBooks connection (blocks real reimbursement/cash tracking; Krishna on QB data issues since Oct 2) · wire scenario/ontology into agent properly · export to slides/spreadsheets · role-based onboarding · auto-generated catalog · analysts publishing metrics without engineering · admin revoke with immediate effect · reconcile repo to canonical metric list once B1.2 lands

**Not a gap:** judging against the full 4-phase PRD (predictive, streaming, mobile, Slack/Teams). Out of scope for Research Preview.

---

## C. Improvements — prioritised, with the research integrated

### C1. Murali's four (do first, in this order)
| # | Improvement | Done when |
|---|---|---|
| 1 | Fix cash receipt timeline overlap | Scenario page renders clean at demo zoom; before/after screenshot in deck |
| 2 | Growth dials as working sliders (admissions, lifetime, hours, rate) | Moving any slider recomputes run-rate + $5M date live |
| 3 | Plain/actionable explanations everywhere | Every answer follows What → So what ($ + date) → Next action + owner |
| 4 | Out-of-scope → governance workflow UI | Blocked question opens define-a-metric form; submission lands in a visible pending queue |

### C2. Visualisation improvements (the upgrade in RCM View v2)
Chart choice is an explanation choice — each chart below answers one question and carries a "so what" line on screen:
| Visual | Question it answers | Why this chart |
|---|---|---|
| **Waterfall: Earned → Collected** | Where did the $190k go between earning and collecting? | A bar total hides the leak; a waterfall *is* the leak |
| **Claim funnel: Authorized → Submitted → Accepted → Paid** | Where do claims fall out of the cycle? | Mirrors recruitment stage conversion — same mental model, finance edition |
| **Donut: A/R aging composition** | How old is the uncollected money? | Composition at a glance; pairs with the aging bars for exact $ |
| **Cumulative cash curve vs payroll obligations** | Will cash stay above obligations, week by week? | Fixes the timeline-overlap problem by design: two lines, crossing point is the story |
| **Denial root-cause bars + upstream fix** | What do we fix at intake, not at appeal? | Candid's core lesson, visualised |
| **At-risk cash table** | What do we act on Monday morning? | Every row: owner + chase-by date. No chart replaces a worklist |

Explanation upgrades that ship with the charts:
- Every visual gets a **one-line takeaway printed under it** — no chart ships without its "so what"
- **Governed / Template / Synthetic chips** on every number (fixes B2.5's invisible-template problem)
- **LLM-suggested follow-ups** under each answer: drill-down (by payer), drill-up (quarter), drill-across (payroll impact) — Murali's Oct 26 ask

### C3. Research integrated — Candid Health + RCM
- **RCM map (8 steps):** Intake/eligibility → Authorization → Documentation/coding → Claim scrub/submit → Adjudication → Remittance/posting → Denials/A/R → Cash-timing decision. Our wedge lives at step 8; our agent should warn at steps 4–7.
- **Candid patterns borrowed (not bought):** payer rules engine → our pre-answer semantic scrub · Touchless Claim Rate → propose **"touchless answer rate"** for the agent · net collection rate (86.8% on our template numbers) as finance headline · denial root-cause loop → our missing feedback loop · unified data model → finance semantic catalog · claims export API → the DE handover pattern
- **Fit gap stated openly:** no public evidence Candid handles HCBA / EVV / OASIS home-care billing; its customers are medical groups / digital health. Decision needed: evaluation or reference model only (B1 + deck slide 10).

### C4. UI improvements (quick, demo-visible)
Header persona cleanup · quarter filter UI · time-to-fill wired · feedback thumbs on every response · scenario deep-link card from chat (parameters carried over) · home screen = Earned / Collected / Earned-not-collected / Next payroll coverage / A/R >30d

---

## D. Next steps — sequenced

**Before / at the Nov 2 meeting**
1. Show: governed answer + refusal → RCM View v2 → improvements roadmap → DE asks. Close decisions B1.1, B1.2, B1.4, and the Candid question (evaluation vs reference).
2. Get Jags' ranking of the 6 DE integrations (proposal: claims lifecycle + remittance + payroll obligations first).

**Coding together in Cursor (Paridhi writes the code in Cursor — order matters)**
3. Timeline overlap fix (smallest, visible win)
4. Sliders wired to calculations
5. Chips (Governed/Template/Synthetic) + feedback thumbs (local state)
6. Define-a-metric workflow form + pending queue (local state)
7. RCM View as a new page in the repo, spreadsheet-backed data file, charts from C2
8. Quarter filter + time-to-fill (only after B1.2 canonical list lands)

**Phase 1 handover package (with Jags)**
9. Finance semantic catalog draft · claims/remittance/payroll schemas · handover doc so engineering doesn't re-decide metrics or ontology
