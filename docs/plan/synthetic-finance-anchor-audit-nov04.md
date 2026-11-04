# Synthetic finance dataset — Phase 0 anchor audit (Nov 4, 2026)

Read-only inventory of hardcoded / fixture financial numbers on the demo path. **No dataset generated. No product code changed. G3 not started.**

Sources searched: `lib/financial-metrics.ts` (Financial Agent templates), cash-timing / revenue-run-rate / growth-target scenario libs + demos + cost/branch overlays, `lib/research-explainers.ts`, ontology research (no dollar literals), and `docs/plan/*` / scenario docs that restate those numbers.

Period/scope marked **implied** when the code or copy does not declare it explicitly.

---

## Step 1 — Anchor table

### A. Financial Agent static templates (`lib/financial-metrics.ts`)

| # | Value | Where | Claims to measure | Period / scope |
|---|-------|--------|-------------------|----------------|
| A1 | **$1,438K** earned (display **$1.44M**) | `collections` template · Q `collections-gap` / `insurance-bridge` · series “Earned revenue” | Earned revenue | **Implied:** current month · company |
| A2 | **$1,254K** collected (display **$1.25M**) | same · “Cash collections” | Posted cash collections | **Implied:** current month · company |
| A3 | **$184K** gap (title: “Collections are $184K below earned revenue”) | same title; data `1438 − 1254` | Earned − collected | **Implied:** current month · company |
| A4 | Insight: payment timing **$91K** of the gap | same · `insight` | Portion of gap attributed to payment timing | **Implied:** same month · company |
| A5 | Prior month **$1,381K** (display $1.38M); 90-day avg **$1,342K** (display $1.34M) | same · comparison bars | Prior / trailing collections context | Prior month; trailing ~90 days · company |
| A6 | Cash today **$3,860K** → 15d **$3,720K** → 30d **$4,080K** → 45d **$4,215K** → 60d **$4,420K** (title **$4.42M** in 60 days) | `forecast` · Q `cash-forecast` / `denial-scenario` / `auth-scenario` | Projected cash balance | Point-in-time “Today” + 60-day forward · company (**implied**) |
| A7 | Seven-day delay sensitivity ≈ **$310K** on 30-day position | same · `insight` | Forecast sensitivity | 30-day horizon · company (**implied**) |
| A8 | Payer lags (days): State Medicaid **58**, Horizon **51**, Evergreen **43**, Blue Horizon **38**, UnitedCare **35**, Aetna **31**, Medicare **27**, Self-pay **12**; “two payers exceed **45**-day target” | `payer` · Q `payer-delays` / `reimbursement` | Avg days clean claim → cash | Trailing average (**implied**) · by payer |
| A9 | Combined exposure total title **$1.03M**; parts Unused auth **$418K**, Denied **$312K**, Unbilled **$227K**, Underpayments **$73K** | `exposure` · Q `combined-exposure` | Deduplicated potential exposure | Point-in-time open exposure · company (**implied**) |
| A10 | Denied claims **$312K**; drivers Missing auth **$96K**, Coding **$78K**, Timely filing **$63K**, Eligibility **$41K**, Medical necessity **$34K**; “top three = **76%**” | `claims` · Q `denied-exposure` / `claim-status` / `recovery` | Denied claim dollars by cause | Point-in-time denied status · company (**implied**) |
| A11 | AR buckets: 0–30 **$1,018K**, 31–60 **$744K**, 61–90 **$392K**, 91–120 **$178K**, 120+ **$114K** | `ar` · Q `ar-risk` / `ar-lineage` | Open AR by age from claim submission | Point-in-time open AR · company (**implied**) |
| A12 | Title: **$684K** of AR older than 60 days; summary “**28%** of total AR” | same | Sum 61–90+91–120+120+ (=684); 684/2446 ≈ 28% | Point-in-time · company |
| A13 | Auth by service line: Skilled Nursing **$174K**, Personal Care **$139K**, Therapy **$71K**, Respite **$34K** (sum **$418K**) | `authorization` · Q `unused-auth` / `unauthorized-care` / `expiring-auth` | Unused / invalid auth exposure | Point-in-time · company · by service line (**implied**) |
| A14 | Unbilled visits **$227K**; Missing EVV **$91K**, Unsigned note **$68K**, Schedule mismatch **$39K**, Rate missing **$18K**, Other **$11K**; clearing top two ≈ **$159K** | `visits` · Q `unbilled-visits` / `evv-delays` | Completed visits blocked from billing | Point-in-time queue · company (**implied**) |
| A15 | OpEx actual **$2.14M** vs budget **$2.04M** (**4.7%** over); variance bars Care delivery **+$68K**, Contract labor **+$31K**, Technology **+$14K**, Supplies **+$8K**, Admin **−$11K**, Facilities **−$14K** | `budget` · Q `budget` / `division-risk` | Operating expense vs budget | Month-to-date · company / by division |
| A16 | Available cash title **$5.18M** across **six** branches: South **$1.21M**, North **$1.04M**, West **$920K**, East **$810K**, Central **$690K**, Atlanta **$510K** (data sum **$5,180K**) | `cash` · Q `cash-coverage` / `cash-by-branch` | Cleared bank balance less restricted / outstanding disbursements | Point-in-time · **6 branches** (named) |
| A17 | Gross margin trend Apr–Sep 2026: **31.8 → 31.5 → 31.9 → 31.4 → 30.2 → 29.1%**; fell **2.3** points; OT up **17%** in Skilled Nursing | `margin` · Q `margin` | (Billed revenue − direct caregiver payroll) / billed revenue | Monthly Apr–Sep **2026** · company |
| A18 | Manual RCM cost **$286K** monthly; Billing review **$96K**, Denial follow-up **$82K**, Doc rework **$64K**, Auth checks **$27K**, Supervision **$17K** | `workflow` · Q `workflow-cost` / `rcm-bottleneck` | Staff hours × loaded rate + rework | Monthly · company RCM ops (**implied**) |
| A19 | Question text only (not modeled): denial rate **8% → 4%**; auth utilization **+10%** | `financialQuestions` prompts for `denial-scenario` / `auth-scenario` | Scenario ask; answer is unmodified forecast template A6 | N/A (prompt literals) |

Derived consistency within templates (not separate demo claims): A9 parts sum to 1030; A10 drivers sum to 312; A11 buckets sum to **$2,446K**; A13 sum = A9 unused auth; A14 sum = A9 unbilled; A16 sum = 5180.

---

### B. Cash-timing scenario (fixture + derived + explainer)

| # | Value | Where | Claims to measure | Period / scope |
|---|-------|--------|-------------------|----------------|
| B1 | Opening cash **$50,000** | `lib/cash-timing-scenario-demo.ts` `delayedReimbursementFixture` · UI copy · `docs/scenario-planning-delayed-reimbursement-v0.1.md` | Starting cash before receipts | Scenario window **2026-10-02 → 2026-10-19** · synthetic entity (**implied** single cash pool) |
| B2 | Receipt A **$15,000** expected **2026-10-02**, delay **0** days | same | Reimbursement amount / date | Same scenario window |
| B3 | Receipt B **$40,000** expected **2026-10-05**, delayed **+14** days → arrives **2026-10-19** | same | Reimbursement amount / delay | Same |
| B4 | Obligation **$70,000** on **2026-10-06** | same | Cash obligation (payroll-like) | Same · measured **before** obligation |
| B5 | Baseline cash before obligation **$105,000**; delayed **$65,000**; timing difference **−$40,000**; baseline shortfall **$0**; scenario shortfall **$5,000** | `compareCashTimingScenario(fixture)` · explainers `whatItShows` (formatted) · docs | Cash available before obligation under two timing assumptions | Same Oct 2026 scenario · not company ledger |
| B6 | Hardcoded explainer slots: “Baseline: **$105K** … Delayed: **$65K**. The **$40K** timing difference…”; nextAction cites **$70K** obligation / Oct 5 chase | `lib/research-explainers.ts` `explainCashTimingComparison` · `docs/plan/e1-explainer-v2-prompt.md` | Same story as B5 in fixed copy | Same scenario |

---

### C. Revenue run-rate / growth-target parameters, plateaus, $5M target

| # | Value | Where | Claims to measure | Period / scope |
|---|-------|--------|-------------------|----------------|
| C1 | **p = $35** / hour (default; UI range $25–$50) | `paperReferenceParameters` / `growthTargetReference` · Growth Target dials | Billing rate per care hour | Scenario model · constant |
| C2 | **h = 30** hours/client/week (default; UI 10–40) | same | Service intensity | Scenario model · constant |
| C3 | **L = 52** weeks client lifetime (default) | same | Mean client lifetime → attrition δ = 1/L | Scenario model · constant |
| C4 | **horizonWeeks = 208** (4 years); **weeksPerYear = 52** | same | Projection window / annualization | Scenario window |
| C5 | Admissions cases **n = 1, 2, 3** / week (baseline **n = 2**) | `paperAdmissionsCases` / `growthTargetAdmissionsCases` | Weekly admissions rate | Scenario · inception census 0 |
| C6 | Derived weekly revenue plateaus: n=1 **$54,600**/wk; n=2 **$109,200**/wk; n=3 **$163,800**/wk | `projectRevenueRunRate` · run-rate explainers | Long-run weekly **billed** run-rate = n·h·p·L | Steady-state under assumptions · not cash |
| C7 | Derived census plateaus: n=1 **52**; n=2 **104**; n=3 **156** clients | same · census explainer / Revenue Run-Rate ReferenceLine | Long-run active clients C\* = n·L | Same |
| C8 | Annualized plateaus: n=1 **$2,839,200** (~**$2.84M**); n=2 **$5,678,400** (~**$5.68M**); n=3 **$8,517,600** (~**$8.52M**) | ×52 · growth explainer / docs | Annualized billed run-rate | Steady-state annualized · scenario company |
| C9 | **$5,000,000** target annualized billed run-rate (UI also offers **$10M** + custom) | `growthTargetReference.targetAnnualizedRunRate` · research question wording · TARGET_PRESETS | Caller-defined annualized **billed run-rate** threshold — **not** defined as P&L break-even; PLAN **D1** still open | Annualized · scenario · definition unresolved |
| C10 | Engine first reach of $5M at defaults: **week 110** (n=2); n=3 **week 46**; n=1 unreachable | `analyzeRunRateTarget` · Growth Target UI crossing label uses `firstReachedWeek` | First week weekly billed ≥ $5M/52 | Scenario trajectory from t=0 |
| C11 | Crossing week in narrative | Explainer comparativeInsight is now generated from engine `firstReachedWeek` (**110** at defaults); docs/plan updated off hardcoded **111** | Same as C10 | Docs / explainer (resolved Nov 4 honesty pass) |
| C12 | Required steady-state admissions **≈ 1.761…/week** (~**1.76**/week) for $5M at L,h,p defaults | `requiredSteadyStateAdmissions` · nextAction copy | Minimum n so plateau ≥ $5M | Steady-state · same levers |
| C13 | Cost defaults: direct **65%** of billed; variable back-office **8%**; fixed **$25,000**/week | `defaultRunRateCostAssumptions` · Growth Target dials | Modeled cost overlay (not accounting P&L) | Weekly · scenario |
| C14 | At n=2 plateau with C13: direct **$70,980**; variable **$8,736**; fixed **$25,000**; total cost **$104,716**; contribution **$4,484**; margin ≈ **4.11%** | `applyRunRateCosts` at plateau | Modeled weekly contribution | Steady-state week · scenario |
| C15 | Branch defaults: Branch1 open wk **0**, n=2, L=52, max **100** clients; Branch2 open wk **52**, n=2, L=52, max **100** | `defaultBranchScenarios` · Growth Target UI | Capped multi-branch expansion | Scenario · company aggregate |
| C16 | Company plateau under C15 + h/p defaults: census **200**; weekly rev **$210,000**; annualized **$10,920,000**; each branch capped plateau **$5,460,000** annualized | `projectCompanyBranches` | Company total billed run-rate with capacity caps | Steady-state · 2-branch scenario |

---

### D. Docs / RCM mocks / presentation (outside agent; still on demo narrative path)

| # | Value | Where | Claims to measure | Period / scope |
|---|-------|--------|-------------------|----------------|
| D1 | Earned **$1,438K** / collected **$1,254K** / gap **$184K**; net collection rate **86.8%** | `docs/plan/rcm-view-mock-nov02.html`, `rcm-view-v2-nov02.html`, `presentation-nov02.html` | Same template story as A1–A3 (exact pair; gap no longer rounded to $190k) | “This period” (**implied** month) · prototype |
| D2 | Aging of the earned-not-collected gap: 0–30 **$82k**, 31–60 **$54k**, 61–90 **$31k**, 90+ **$23k** (bucket $ unchanged; separate reconciliation from $184K gap); “**$108k** already over 30 days” | RCM mocks | Split of earned-not-collected, **not** full open AR | Same period as D1 · prototype |
| D3 | Funnel (v2): Authorized **$1.58M** → Submitted **$1.44M** (91%) → Accepted **$1.31M** (91%) → Paid **$1.25M** (95%) | `rcm-view-v2-nov02.html` | Stage conversion $ | Same period · prototype |
| D4 | Weekly expected collections bars: **62, 48, 71, 40, 55, 66** ($k); cum **$342k**; Wk4 = **$40k** risk claim | RCM v2 timeline | Near-term expected cash by week | **6-week** illustrative window · prototype |
| D5 | Denial % mix: Documentation **34%**, Authorization **26%**, Eligibility **18%**, Coding **12%**, Timely filing **10%** | RCM mocks | Denial root-cause mix | Synthetic mix · **not** $ drivers in A10 |
| D6 | Action-table claims **$40,000** / **$23,000** / **$31,000** tied to payroll vs **$105k** pre-obligation cash | RCM mocks | Bridges monthly gap story to cash-timing B\* | Mixed: period AR + Oct scenario cash |
| D7 | PLAN / meeting docs restate **$5M**, **1.76**/wk, plateaus, **$184K** earned-not-collected ($1,438K − $1,254K), G3 **$70K** obligation line | `PLAN.md`, g2/e1 prompts, capabilities docs | Narrative restatements of A/B/C | As cited |

Ontology research (`lib/finance-ontology*.ts`, ontology demo UI): **no dollar / % / count financial literals** — relationship/metric-id only.

---

## Step 2 — Conflicts (same period + company scope) and proposed reconciliations

Proposals only — **not applied**.

### Conflict 1 — Collections gap **$184K** (template data/title) vs **$190K** (RCM / presentation) — resolved Nov 4

- **Was:** Chart values 1438−1254 = **184**; rounded displays $1.44M − $1.25M = **$190K**.
- **Resolution:** Docs/plan + RCM mock gap headlines use **$184K** with the exact pair **$1,438K earned − $1,254K collected = $184K**. Aging bucket dollars left unchanged (separate reconciliation). Template data in `lib/financial-metrics.ts` untouched.

### Conflict 2 — “Available cash” **$5.18M** (6 branches) vs forecast **Today $3.86M** vs cash-timing opening **$50K**

- **Clash:** Three different cash stocks if read as one company on one as-of date.
- **Propose:**  
  - **Company bank cash (as-of demo month-end)** = **$5.18M** across the six named branches (A16).  
  - **Forecast series (A6)** = a **treasury projection view** that starts from a **different as-of** or a **restricted subset** (e.g. operating cash after commitments) — must be named explicitly (e.g. “unrestricted operating cash $3.86M on forecast day 0”) and derived from the same ledger in Phase 1.  
  - **Cash-timing $50K / $105K / $65K** = a **single-obligation vignette** (Oct 2–19, 2026) on a **branch or payroll pool**, not enterprise cash — keep linked to Receipt B $40K but **not** equal to company cash.

### Conflict 3 — Monthly earned **~$1.44M** (~**$17.3M** annualized if ×12) vs growth-target plateau **~$5.68M** annualized billed (n=2)

- **Clash:** Same “company” cannot both earn ~$1.44M in a single month and plateau at only $5.68M/year billed run-rate.
- **Propose:** Either (a) Financial Agent month is **multi-branch current operations** at a higher scale, and growth-target is an **illustrative single-configuration / paper model** with an explicit disclaimer that it is **not** the same census as the agent templates; or (b) **rescale** one family in a later phase so monthly earned ≈ annualized_run_rate/12 for the chosen steady state. Phase 0 recommendation: **(a) separate scopes in the dataset metadata** until D1 + scale decision land.

### Conflict 4 — Full open AR **$2.446M** (template aging) vs RCM aging of the month gap

- **Clash:** Both are labelled “A/R aging” in demo materials; buckets and totals differ by an order of magnitude.
- **Propose:**  
  - **Open AR aging (agent)** = A11/A12 (**$2.446M** total; **$684K >60d**).  
  - **RCM mock buckets** = aging of **earned-not-collected for the current month only** (gap **$184K** = $1,438K − $1,254K), not open AR. Bucket dollar amounts still need a separate reconciliation to sum to $184K.

### Conflict 5 — Gross margin **~29.1%** (template) vs modeled contribution margin **~4.1%** (cost overlay at n=2 plateau)

- **Clash:** Both look like “margin on billed revenue” if scopes are ignored.
- **Propose:** Template margin = **(billed − direct caregiver payroll) / billed** for historical months (no fixed/$ back-office). Growth-target overlay = **scenario contribution after 65% + 8% + $25K/wk fixed**. Keep as **two metrics**; synthetic dataset must not present one number under both labels.

### Conflict 6 — Engine crossing **week 110** vs narrative / explainer **week 111** — resolved Nov 4

- **Was:** Live Growth Target UI / `analyzeRunRateTarget` report **110**; hardcoded comparativeInsight and several plan docs said **111**.
- **Resolution:** Explainer comparativeInsight is generated from engine `firstReachedWeek`; docs/plan crossing week copy updated to **110**.

### Conflict 7 — Denial dollars (A10) vs denial **percent** mix (D5)

- **Clash:** Different cause lists and units; cannot both be “the” denial breakdown for one period without mapping.
- **Propose:** Agent **$** drivers (A10) are the ledger-backed denial exposure. RCM **%** mix is a **prototype taxonomy sketch** — out of scope for the first synthetic dataset, or mapped later with an explicit transform.

### Conflict 8 — Insight “payment timing **$91K** of the gap” vs cash-timing **$40K** delayed receipt

- **Clash:** Easy to read as the same timing dollar.
- **Propose:** **$91K** = monthly template allocation inside the **$184K** earned-collected gap (company-month). **$40K** = one named reimbursement in the **Oct vignette**. Dataset may include the $40K claim as a **component** of timing pressure but must not equate $40K = $91K.

---

## Step 3 — Decisions needed (before Phase 1 generation)

1. **$5M definition (PLAN D1):** Is $5M annual gross revenue, annualized billed run-rate, or something else? All growth-target math currently treats it as **annualized billed run-rate**.
2. **One company scale:** Are Financial Agent monthly templates (A\*) and the Cespedes run-rate / growth-target model (C\*) the **same synthetic company**? If yes, which family’s scale wins; if no, name two scopes in the dataset.
3. **Canonical cash stock:** Which figure is enterprise available cash for the demo company — **$5.18M**, **$3.86M**, or neither until forecast is rebuilt from ledger?
4. **Collections headline:** ~~Publish $184K or $190K~~ — **decided:** **$184K** ($1,438K − $1,254K).
5. **AR story split:** Confirm open AR (**$2.446M**) vs month-gap aging (illustrative buckets vs **$184K** gap) as two distinct objects (Conflict 4); bucket $ still need reconciliation.
6. **Cash-timing vignette scope:** Confirm B\* is a **payroll-pool / single-obligation** story (linked by the $40K claim) and **not** enterprise cash.
7. **Crossing week:** ~~Confirm demo canon is engine week 110~~ — **decided:** engine **week 110**; explainer/docs updated.
8. **Margin dualism:** Confirm template gross margin vs scenario contribution margin remain separate metrics (Conflict 5).
9. **$10M / custom target in UI:** Is the default demo path locked to **$5M** only for dataset consistency, with $10M treated as interactive what-if only?

---

## Counts

- **Distinct anchors inventoried:** **58** rows in the tables above (A1–A19, B1–B6, C1–C16, D1–D7), covering every required known class (earned/collected/gap; AR aging; total exposure; available cash + branch count; p, h, L, admissions cases, plateaus, $5M definition).
- **Conflicts listed:** **8**
- **Decisions needed:** **9**

Phase 1 generation starts only after these decisions are approved.
