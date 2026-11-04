# Financial Data Analyst — question verification (Nov 3, 2026)

**Scope:** Verification only. No product fixes in this file.  
**Source of truth:** `lib/financial-metrics.ts` → `financialQuestions` (25), answered via `answerFinancialQuestion` → `matchFinancialIntent` (`lib/financial-intent-registry.ts`) → static `templates` → `runOrchestrator('financial', …)` (`lib/orchestrator.ts`) / Financial Agent UI (`app/page.tsx`).  
**Count check:** Found **25** questions — matches the expected set size.

**Summary:** 25 questions · **Answered 17 · Partial 8 · Blocked 0** (within the 25-question set) · Source among the 25: **Static template 25 · Governed 0 · Synthetic 0** as answer-source label. (UI still paints “Synthetic data” on every card; that is presentation chrome, not a governed calc.)

Separate no-metric check (not in the 25): LTV → **Blocked — no governed metric** (pass).

Method notes:
- **Source:** Finance has no governed semantic catalog (`financial-intent-registry.ts` states this). Every supported answer is a **Static template**. None are labeled Governed here.
- **Chart:** Main Financial Agent renders `ResultChart` when `answer.supported` and `data.length > 0`.
- **Explainer:** Main Financial Agent has **no** `ExplainerCard`. Explainer / v2-slot checks for Murali’s demo are in Step 3 (scenario + ontology pages).

---

## Full question table

| # | Question (exact) | Type | Status | Source | Chart | Explainer |
|---|------------------|------|--------|--------|-------|-----------|
| 1 | Why is cash collection lagging behind earned revenue this month? | why it happened | Answered | Static template | yes | no — main Financial Agent has no ExplainerCard |
| 2 | What is the projected cash position over the next 30–60 days based on outstanding claims? | what will happen | Answered | Static template | yes | no — main Financial Agent has no ExplainerCard |
| 3 | Which payers have the longest payment delays between claim submission and cash receipt? | what happened | Answered | Static template | yes | no — main Financial Agent has no ExplainerCard |
| 4 | How much revenue is currently trapped in denied claims, and what are the primary denial drivers? | what happened | Answered | Static template | yes | no — main Financial Agent has no ExplainerCard |
| 5 | What is the financial exposure from rejected claims compared with denied claims? | what happened | Partial | Static template | yes | no — main Financial Agent has no ExplainerCard |
| 6 | Which AR aging buckets present the highest collection risk? | what happened | Answered | Static template | yes | no — main Financial Agent has no ExplainerCard |
| 7 | How much revenue is potentially unbillable due to care provided outside valid authorization periods? | what happened | Answered | Static template | yes | no — main Financial Agent has no ExplainerCard |
| 8 | What is the dollar exposure from unused authorization hours across active client care plans? | what happened | Answered | Static template | yes | no — main Financial Agent has no ExplainerCard |
| 9 | Which client accounts have authorizations expiring within the next 14 days? | what happened | Partial | Static template | yes | no — main Financial Agent has no ExplainerCard |
| 10 | What is the total dollar value of unbilled visits associated with documentation or EVV exceptions? | what happened | Answered | Static template | yes | no — main Financial Agent has no ExplainerCard |
| 11 | How do missing visit records or EVV discrepancies relate to billing delays? | why it happened | Answered | Static template | yes | no — main Financial Agent has no ExplainerCard |
| 12 | What is the variance between expected reimbursement rates and actual payer payments? | what happened | Partial | Static template | yes | no — main Financial Agent has no ExplainerCard |
| 13 | How much revenue was recovered or protected following intervention on denied claims? | what happened | Partial | Static template | yes | no — main Financial Agent has no ExplainerCard |
| 14 | How is spending tracking against departmental operating budget? | what happened | Answered | Static template | yes | no — main Financial Agent has no ExplainerCard |
| 15 | What is caregiver payroll cost relative to billed revenue, and how does overtime affect gross margin? | what happened | Answered | Static template | yes | no — main Financial Agent has no ExplainerCard |
| 16 | How does current bank cash compare with short-term payroll and vendor commitments? | what happened | Answered | Static template | yes | no — main Financial Agent has no ExplainerCard |
| 17 | What is the operational cost of manual billing and denial-management workflows? | what happened | Answered | Static template | yes | no — main Financial Agent has no ExplainerCard |
| 18 | Where are manual intervention bottlenecks in the RCM cycle? | what happened | Answered | Static template | yes | no — main Financial Agent has no ExplainerCard |
| 19 | What happens to the 60-day cash forecast if the denial rate decreases from 8% to 4%? | scenario | Partial | Static template | yes | no — main Financial Agent has no ExplainerCard |
| 20 | How would a 10% improvement in authorization utilization affect revenue and collections? | scenario | Partial | Static template | yes | no — main Financial Agent has no ExplainerCard |
| 21 | Why did insurance collections decrease despite billable hours remaining flat? | why it happened | Answered | Static template | yes | no — main Financial Agent has no ExplainerCard |
| 22 | Which operational divisions have the largest budget variance alongside operational issues? | what happened | Partial | Static template | yes | no — main Financial Agent has no ExplainerCard |
| 23 | What operational care records explain an outstanding AR balance? | why it happened | Partial | Static template | yes | no — main Financial Agent has no ExplainerCard |
| 24 | What is the combined exposure from unbilled visits, denials, unused authorizations, and underpayments? | what happened | Answered | Static template | yes | no — main Financial Agent has no ExplainerCard |
| 25 | What is the current cash position by branch? | what happened | Answered | Static template | yes | no — main Financial Agent has no ExplainerCard |

### Partial rationale (verification notes, not fixes)

| id | Returned template / title | Why Partial |
|----|---------------------------|-------------|
| claim-status | claims / Denied claims carry $312K… | Asks rejected **vs** denied exposure; template is denial drivers only. |
| expiring-auth | authorization / Authorization exposure… | Asks accounts expiring in 14 days; template is service-line exposure donut. |
| reimbursement | payer / Two payers exceed the 45-day… | Asks expected vs actual rate variance; template is payment-delay days. |
| recovery | claims / Denied claims carry $312K… | Asks recovered/protected dollars; template is denial drivers. |
| denial-scenario | forecast / Cash is projected to reach $4.42M… | Scenario (8%→4% denial) not modeled; same static forecast card. |
| auth-scenario | forecast / Cash is projected to reach $4.42M… | Scenario (10% auth utilization) not modeled; same static forecast card. |
| division-risk | budget / Operating expense is 4.7% over… | Asks budget variance **alongside operational issues**; template is budget variance only. |
| ar-lineage | ar / $684K of AR is older than 60 days | Asks care-record lineage for AR; template is aging buckets. |

### Extra no-metric check (demo)

| Question | Status | Source | Chart | Explainer | Result |
|----------|--------|--------|-------|-----------|--------|
| What is our LTV? | Blocked — no governed metric | n/a | no | no | **Pass** — `supported: false`, title “Question is outside the governed financial analyses”, empty summary/insight/metricIds; orchestrator semantic step: “No approved metric matched the request.” No LTV/CAC answer returned. |

---

## Step 3 — Demo-dependent checks

| Check | Result |
|-------|--------|
| a) Cash-timing comparison explainer has all three v2 slots | **Pass** — `explainCashTimingComparison` has comparativeInsight, nextAction, followUps |
| b) Growth-target explainer has all three v2 slots (branch expansion OFF) | **Pass** — `explainGrowthTargetChart` has all three slots; UI only mounts the card when branch expansion is off (pre-existing v0.6) |
| c) Growth-target demo path uses fixed $5M consistently | **Risk flagged** — default / reference is `$5,000,000`, and backfilled comparativeInsight / nextAction text use $5M; **but** Growth Target UI also offers a **$10M** pill and a custom target number input, so the live demo can leave the $5M example |
| d) Ontology graph explainer has all three v2 slots | **Pass** — `explainOntologyGraph` has all three slots |
| e) Non-backfilled explainers have no v2 slots | **Pass** — timeline, revenue run-rate, census, investigation-plan: all three slots absent |
| f) LTV blocked refusal | **Pass** — see table above |

---

## Demo risks

Listed in required order: every Partial · every template answer that looks governed on screen · every failed / flagged Step 3 check.

### Partials
1. **claim-status** — rejected-vs-denied question returns denial-driver template only.
2. **expiring-auth** — 14-day expiring accounts question returns service-line authorization exposure donut.
3. **reimbursement** — rate-variance question returns payer payment-delay template.
4. **recovery** — recovery dollars question returns denial-driver template.
5. **denial-scenario** — 8%→4% denial scenario returns unmodified 60-day cash forecast template.
6. **auth-scenario** — 10% authorization-utilization scenario returns unmodified 60-day cash forecast template.
7. **division-risk** — budget + operational-issues question returns budget-variance template only.
8. **ar-lineage** — care-record lineage question returns AR aging template.

### Template-sourced answers that look governed on screen
All **25** Financial Agent answers are Static templates, but the UI presents them as governed:
- Header chip (pre-honesty fix): “Governed semantic layer · 25 approved questions · 13 source domains” — **updated:** finance now shows “Static template — not computed, not governed”.
- Question dialog (pre-honesty fix): “Select an approved question from the finance semantic layer.” — **updated:** finance dialog no longer claims a semantic layer.
- Orchestrator semantic step (pre-honesty fix): “Matched approved metric(s): …” — **updated:** finance supported answers show “Static template — not computed, not governed”.
- Answer meta: “Quality checks passed” alongside “Synthetic data”.
- Registry comment in code: “There is no Financial semantic catalog” — contradicts on-screen framing.

Highest-demo-risk examples (template mismatch **and** governed framing): **denial-scenario**, **auth-scenario**, **reimbursement**, **recovery**, **claim-status**, **ar-lineage**.

### Step 3 failures / flags
- **c) Growth-target $5M consistency:** default path is $5M, but `/scenario-demo` Growth Target dials include **$10M** and a **custom target** control — demo can show a non-$5M target and a crossing label that is no longer the $5M story. Explainer comparativeInsight / nextAction text remain hard-coded to the $5M reference story even if the dial target changes (card only visible with branch expansion off).
- Checks **a, b, d, e, f:** no failures.

---

## Harness evidence
- Enumerated `financialQuestions.length === 25`.
- Each prompt run through `answerFinancialQuestion` + `runOrchestrator('financial', prompt)`.
- Explainer slots inspected via `lib/research-explainers.ts` builders (same objects `ExplainerCard` consumes).

---

## Murali Sep 24 set

**Scope:** Verification only of Murali’s Sep 24, 2026 demo ask (10 questions + 6 reports). Exact wording tested. No new metrics built or defined in this run.  
**Paths tested:** Financial Agent chat (`runOrchestrator('financial', …)` / `answerFinancialQuestion`); recruitment path checked only to detect false routing; scenario pages (`/scenario-demo` Cash Timing, Revenue Run-Rate, Growth Target); ontology/RCM mocks under `docs/plan/`; Design Studio export `OSpectra Data Analyst Agent.dc (5).html` (outside the agent app).  
**Debt check:** Repo-wide search found **no** `debt` / `debt service` data or templates. Q2, Q3, and debt ratios in Q10 all return `supported: false` on the Financial Agent — matches expectation; no unexpected debt answer found.

### Summary
- **Questions (10):** Answered **0** · Partial **0** · Blocked **10**
- **Reports (6):** Answered **0** · Partial **2** · Blocked **4**
- **Sources among answered/partial items:** Static template (AR aging bars only) · Synthetic scenario models (adjacent, not answers) · Prototype mocks outside agent · **Governed 0** · **None** for all Blocked chat questions

Grading rules applied: (a) adjacent ≠ answer; (b) $5M growth-target crossing is revenue, not P&L break-even; (c) mock/prototype-only reports = Partial, not Answered.

### Questions (10)

| # | Question (exact) | Status | Where tested | Source | Adjacent capability (not an answer) |
|---|------------------|--------|--------------|--------|-------------------------------------|
| 1 | Is the company breaking even? If not, when is it projected to break even? | Blocked | chat (Financial Agent) → unsupported; scenario page inspected for adjacency only | None | Growth Target `/scenario-demo`: `requiredSteadyStateAdmissions` ≈ **1.76/week** and the **$5M annualized billed run-rate** crossing (week 110 at defaults). The ~1.76/week figure is the **required pace to reach $5M** (revenue-target), not P&L break-even (rule b). |
| 2 | What is the debt service cost, and how much is it impacting our revenue and profit? | Blocked | chat → unsupported | None | None in product. No debt fields/templates in codebase. |
| 3 | Is the debt growing, and what is the current trend? | Blocked | chat → unsupported | None | None. (Recruitment agent can false-match “trend” phrasing to applications-trend if the wrong agent is selected — not a finance answer.) |
| 4 | Is there a genuine cash-flow problem? If so, what is the current gap and how is it trending? | Blocked | chat → unsupported | None | Cash Timing scenario shortfall ($40K timing / $5K scenario shortfall on synthetic fixture); Financial templates `collections-gap` / `cash-forecast` / `cash-coverage` answer **different** wordings, not this exact question. |
| 5 | What is the cost of service per member per month? | Blocked | chat → unsupported | None | Docs-only nearest-concept mention: **Cost per Productive Care Hour** (`docs/plan/graphs-ontologies-explainers-improvement-plan-nov02.md`) — not implemented as a metric. Growth Target cost dials (direct/variable/fixed) are not PMPM. |
| 6 | Is the caregivers' available time being fully utilized? | Blocked | chat → unsupported | None | None implemented. Plan docs name **Care Coverage Rate** / **Capacity Coverage Ratio** as examples of nearby concepts — not present as product metrics (rule a). |
| 7 | How much revenue is unrealized due to clients being on a waitlist or unserved? | Blocked | chat → unsupported | None | Nowhere in product (no waitlist/unserved data). |
| 8 | What is the revenue per member per month and per caregiver per month? | Blocked | chat → unsupported | None | Revenue Run-Rate / Growth Target: weekly billed `R = C × h × p` and annualized run-rate — not PMPM or revenue per caregiver per month. |
| 9 | Is every service hour/session profitable? | Blocked | chat → unsupported | None | Growth Target **modeled contribution** / contribution margin (scenario costs) — not per-hour or per-session profitability, and not accounting profit. |
| 10 | Ratios: Revenue:Expenses (excluding Labor cost); Revenue:Back-Office Staff cost; Debt ratios; and Churn (both customers & caregivers). | Blocked | chat → unsupported | None | **Debt ratios:** none (blocked as expected). **Back-office:** Growth Target variable operating-cost **ratio of billed revenue** dial — not Revenue:Back-Office Staff cost. **Churn:** Growth Target weekly attrition `δ = 1/L` (client census model) — not customer & caregiver churn (rule a vs 90-Day Productive Retention, which is also not in code). |

### Reports (6)

| Report | Status | Where tested | Source | Adjacent / notes |
|--------|--------|--------------|--------|------------------|
| Income Statement (P&L) | Blocked | nowhere in the agent app | None | Design Studio HTML has a finance dashboard mock with spend/forecast chips — not a standard P&L. |
| Balance Sheet | Blocked | nowhere | None | No BS view in agent, scenario, or RCM mocks. |
| Cash Flow Statement | Blocked | nowhere as a CFS | None | Cash Timing is an isolated receipt-timing scenario, not a cash-flow statement. |
| Accounts Receivable | Partial | chat (`ar-risk` aging bars for a different catalog question); RCM HTML mocks | Static template (aging bars) + prototype mock outside agent | Standard interactive AR report not in agent. `docs/plan/rcm-view-mock-nov02.html` / `rcm-view-v2-nov02.html` show A/R aging prototypes (rule c → Partial). |
| Accounts Payable | Blocked | nowhere | None | Template source lists mention `accounts_payable` as a domain string only; no AP report UI. |
| 12-month Forecasts | Partial | chat (`cash-forecast` = **60-day** template for other questions); Growth Target multi-year run-rate chart; DS HTML forecast comparison | Static template (60-day) + Synthetic scenario chart + prototype outside agent | No standard 12-month forecast report in agent. Closest: 60-day cash template; Growth Target trajectory (billed run-rate, not forecast statements). |

### Demo risks (Sep 24 set only)

1. **All 10 Sep 24 questions are Blocked** in Financial Agent chat as worded — the live demo cannot answer Murali’s Sep 24 finance ask from the 25-question catalog.
2. **Q1 confusion risk:** Growth Target / docs label ~1.76/week as the **required pace to reach $5M** (revenue run-rate), not P&L break-even — using that chart to answer Q1 would be incorrect (rule b). Product correctly blocks the chat wording today.
3. **Q2 / Q3 / Q10 debt:** correctly Blocked; no debt data. Demo must not invent debt answers.
4. **Wrong-agent false match:** on Recruitment Agent, “debt growing… trend” / “cash-flow… trending” can route to **applications-trend** — keep Financial Agent selected.
5. **Q5/Q6 vocabulary risk:** plan docs mention Cost per Productive Care Hour / Care Coverage / Capacity Coverage as nearby concepts; none are shipped — do not present them as answers.
6. **Reports:** no standard IS / BS / CFS / AP / 12-month forecast in the agent. AR aging exists only as a **catalog template** (different question) plus **outside-agent RCM mocks** (Partial). Presenting mocks as the agent’s reports would oversell.
7. **Catalog vs Sep 24 gap:** existing Partial catalog items (e.g. denial-scenario, auth-scenario) still do not cover these 10 questions.

### Harness evidence (Sep 24)
- Each of the 10 exact prompts → `runOrchestrator('financial', prompt)` → `supported: false`, `questionId: unsupported`.
- Debt search: no `debt` / `debt service` matches under app/lib/components (excluding this verification narrative).
- Q2, Q3, Q10 debt portions: Blocked with source None (expected).
