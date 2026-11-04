# Candid Health + RCM exploration — and what to show tomorrow
**For:** Paridhi — meeting Mon Nov 2, 2026, with Jags (and Murali's direction behind it)
**Question Murali set:** Explore Candid Health while exploring RCM
**Your existing anchor:** Oct 27 Murali next steps — (1) briefer/plain/actionable explanations, (2) fix cash receipt timeline overlap, (3) growth-target dials as working sliders, (4) out-of-scope workflow guiding users to governance

> Honest framing to use in the room: "I explored Candid as an RCM reference model, not as a recommendation to buy it. What matters for us is what its design teaches our analyst agent — and what data we'd need, with Jags, to answer RCM questions for real."

---

## 1. Candid Health in 60 seconds — say this

"Candid Health is the billing / practice-management system of record — the financial counterpart to the EHR. The EHR holds clinical notes; Candid holds registration, eligibility, claims, remittances, denials, A/R and reporting, so the whole revenue cycle can run through it."

- **Core idea:** Don't layer automation on top of a legacy billing system. Rebuild it around a **configurable, payer-aware rules engine** that checks and corrects a claim *before* submission, using payer rules reverse-engineered from how payers actually adjudicate.
- **The two metrics it runs on:**
  - **Payer net collection rate** — % of collectible revenue owed by payers that a provider actually receives
  - **Touchless Claim Rate (TCR)** — % of claims submitted and finalized without human intervention
- **How it works:** encounter / charge data in (API-first, EHR integrations) → rules engine validates against payer-specific rules → submit → track status → post remittance → work rejections/denials → reporting on payer performance, denial trends, cash-flow visibility. It is now adding an agentic layer on top of Candid *and* legacy billing systems for the work that still lands in billing queues.
- **Scale / stage (company-reported):** 200+ provider orgs, ~$12B claim volume expected this year, $120M Series D in July 2026. Customers named on its site are mostly medical groups / digital health / MSOs — Talkiatry, Tia, Bridge, Brave Health, Nourish.
- **Pricing:** not published; quote based on volume. Third-party benchmarks cite ~% of collections — do **not** quote a price in the meeting as fact.

**Sources:** candidhealth.com (homepage definitions of net collection rate + TCR), Healthcare AI Guy deep dive interview with CEO Nick Perry, Pulse2 Series D report.

## 2. RCM in one map — and where OSpectra's wedge sits

Revenue Cycle Management = every financial step from intake to cash:

1. **Intake / registration + eligibility** — is the client covered, by which payer, for what?
2. **Authorization** — is this service / hours authorized? (For home care: HCBA / waiver authorizations, recertifications)
3. **Documentation + coding** — visit notes, EVV, OASIS where applicable; errors here are the #1 preventable denial source in home health
4. **Claim scrub + submission** — pre-submission check against payer rules, timely filing windows
5. **Payer adjudication** — paid, rejected, or denied
6. **Remittance + payment posting** — what was actually paid vs. earned, and when
7. **Denials + A/R follow-up** — root-cause by payer + reason, appeal / resubmit inside the window, A/R aging
8. **Cash timing decision** — earned ≠ collected. This is *your* wedge: a late reimbursement threatens a dated payroll obligation.

**Your line connecting it to your Oct work:** "Our demo already has the earned-not-collected story — $1,438K earned − $1,254K collected = $184K, and one $40k reimbursement 14 days late leaves us $40k short against $105k pre-obligation cash. Candid's whole product is trying to shrink that gap at steps 4–7. Our agent's job is to *make that gap visible early enough to act* — chase before the due date, hold a buffer above obligations."

### Fit gap — say it before Murali asks
Candid is built for medical groups / digital health billing on medical claims. I found **no public evidence** it handles home-care-specific RCM: HCBA waiver billing, EVV reconciliation, OASIS-driven reimbursement, per-diem / hourly home-care claims. Questions to verify before anyone treats it as a fit:
- Does it support our payer mix and claim types, or only standard medical (CMS-1500 / institutional) claims?
- Can its rules engine encode *our* authorization-to-cash rules, or only payer adjudication rules?
- Does it export claim-level data (there is a claims data export API reported) in a form Jags can land in a warehouse — grain, fields, refresh?

## 3. What to borrow from Candid — without buying it

This is the strongest part to show. Each Candid pattern maps to a gap you already named Oct 27:

| Candid pattern | Our equivalent | What it fixes in our agent |
|---|---|---|
| Payer rules engine checks claim *before* submission | Semantic validator + quality guard checks question *before* answering | Pre-answer scrub: is the metric governed, is data complete, is the period valid? Show the check, don't hide it |
| Touchless Claim Rate as the headline metric | **"Touchless answer rate"** — % of executive questions answered end-to-end governed, with evidence, no manual fix | Gives Murali one number for agent autonomy, same logic as TCR |
| Net collection rate as outcome metric | **Earned-not-collected + days-to-cash** as the finance headline, not just revenue | Puts the payroll wedge on the home screen |
| Denial root-cause loop feeds rules back upstream | Feedback loop you flagged as missing (no thumbs up/down in code) | A wrong / unhelpful answer creates a governance task, same as a denial creates a rule fix |
| Unified data model: provider + fee schedule + charge + payer data in one place | Finance semantic catalog — recruitment has YAML, finance has none | This is the #1 finance gap. Candid proves the catalog is the product, not the chat |
| Claims export API to customer's warehouse | The DE handoff Jags owns (Section 5) | Agent should read a governed warehouse layer, never raw source systems |

## 4. What to show tomorrow — 12-minute flow

Don't show everything. Show in this order:

1. **(2 min) Governed answer, live** — a recruitment question with answer + table + chart + lineage panel. Then the LTV refusal: "BLOCKED by semantic policy." Line: *"Governance is built. The live-data layer is not — that's today's agenda."*
2. **(2 min) Candid / RCM map** — the 8-step map above on one view, with the earned-not-collected gap highlighted. Line: *"This is where a Candid-style system acts, and where our agent should warn."*
3. **(3 min) The 4 Murali improvements, as before → after** (Section 5A — don't claim built what is only mocked)
4. **(3 min) New RCM / finance prototype view** (Section 5B) — even as a spreadsheet-backed mock: A/R aging, denial reasons by payer, expected cash by week vs payroll obligation date
5. **(2 min) Decisions + Jags plan** — close with owners, not a list. See Section 6.

## 5. Improvements + UI changes you can implement

### 5A. Directly from Murali's Oct 27 list — prioritise these first
1. **Fix cash receipt timeline overlap** — rendering fix on scenario page; numbers underneath already verified. *Quick win, do first.*
2. **Growth-target dials as working sliders** — admissions/week, lifetime weeks, hours, rate ($35). Today only admissions varies in effect; wire all four so 1 / 2 / 3 admissions cases update live.
3. **Plain / actionable explanation standard everywhere** — every answer gets: **What happened → So what (dollars + date) → Next action + owner.** You already rewrote cash-timing and growth-target; apply the template to the rest, don't invent new prose each time.
4. **Out-of-scope / define-a-metric workflow UI** — when a question is blocked, don't dead-end. Form: metric name, owner, formula, source tables, purpose → "Pending governance" queue → notify when tested and available. This is the workflow Murali asked for.

### 5B. UI changes that are cheap and make the demo feel like a product
5. **Clean the header persona** — UI still says "Vasu Rao — Manager Access" from the transferred POC. Change to a neutral demo persona before any external demo.
6. **Synthetic-data + governed badge on every answer** — a visible chip: `Synthetic data` / `Governed` / `Template — not computed`. Fixes Gap 5: today a user can't tell the governed recruitment half from the templated finance half.
7. **Quarter filter + time-to-fill** — quarter is a core longitudinal domain in the User Journey doc but the repo answers only over the whole 6-month window; time-to-fill is governed on paper, not answerable in code (grouping is by department, not role family). Add the filter UI + wire time-to-fill next.
8. **Feedback on every response** — thumbs up/down + "what was wrong?" — stored locally in Research Preview. PRD requires it; code doesn't have it.
9. **Wire scenario / ontology into the agent** — today `/scenario-demo` and `/ontology-demo` are separate pages; a run-rate question asked in chat gets nothing. At minimum: deep-link card from chat to the scenario page with parameters carried over.
10. **Home screen redesign (one screen, Kornacki standard)** — top row: Earned, Collected, Earned-not-collected, Next payroll obligation + coverage, A/R >30 days. Below: What → Where → Why → Next. No chart without a "so what" line.

### 5C. New RCM view to prototype (spreadsheet-backed, Research Preview scope)
One page: **Authorization → Claim → Cash**
- A/R aging buckets (0–30 / 31–60 / 61–90 / 90+) by payer
- Denial / rejection reasons by payer, root-cause grouped (documentation, authorization, eligibility, coding, timely filing)
- Expected-cash timeline by week overlaid on payroll obligation dates — this is the visual form of your payroll-readiness wedge
- "At-risk cash" list: claims that, if delayed 14 days, break a payroll date

Keep the Murali scope rule explicit on the slide: *Research Preview = spreadsheet / abstraction prototype. Warehouse, QuickBooks and live Candid/EHR data = Phase 1 / engineering handover.*

## 6. Data Engineering integrations — what to propose with Jags

Frame it as: **"Jags, I can prototype the abstractions. I need you to tell me which of these survives real data, and in what order we land them."**

### Proposed pipeline (target, not built)
```
Sources                    Ingestion (Jags)       Governed layer            Agent (Paridhi)
─────────────────────────  ────────────────────   ───────────────────────   ──────────────────
Spreadsheets (now)         CSV / file landing  →  Staging (raw, dated)   →  Semantic catalog (YAML)
QuickBooks (Phase 1)       API / export           Warehouse tables:         - finance catalog (new)
EHR / EVV / scheduling     API / export             claims_lifecycle        - recruitment catalog
Payer remittance (835)     File / clearinghouse     remittance_posting      Intent router →
Claims system / Candid*    Export API*              denial_events           validator → executor
Payroll obligations        QuickBooks / sheet       authorization           → narrative
                                                    ar_aging_snapshot
                                                    payroll_obligations
* Candid only if OSpectra ever adopts it — treat as a possible source, not a plan.
```

### Integration candidates — ask Jags to rank these
| # | Table / integration | Grain + key fields | Research Preview version | Phase 1 version | Owner split |
|---|---|---|---|---|---|
| 1 | **Claims lifecycle** | 1 row / claim / status change: claim_id, client (de-identified), payer, service dates, billed $, status, status_date | Spreadsheet mock with your synthetic claims | EHR/billing export or Candid export API → warehouse | Jags: schema + landing. You: metric definitions |
| 2 | **Remittance / posting** | 1 row / payment: claim_id, paid $, adjustment $, paid_date, payer | Mock from the $1.44M/$1.25M story, expanded | 835 remittance files / QuickBooks posting | Jags: parsing + reconciliation keys |
| 3 | **Denial events** | 1 row / denial: claim_id, payer, reason code, category, appeal deadline, outcome | Denial taxonomy spreadsheet (5 categories above) | Clearinghouse / billing system feed | You: taxonomy. Jags: feed |
| 4 | **Authorization** | 1 row / authorization: client, payer, authorized hours, used hours, start/end, recert due | Sheet prototype — ties to admissions/run-rate work | EHR / HCBA source | Joint: where does truth live? |
| 5 | **Payroll obligations** | 1 row / pay date: pay_date, obligation $, pre-obligation cash | Already prototyped in payroll_readiness.py | QuickBooks — Krishna was already on QB data-maintenance issues (Oct 2) | Jags + Krishna: QB reality check |
| 6 | **Payer rules table** | 1 row / rule: payer, claim type, rule, source, last verified date | The Candid lesson: rules as data, not code | Maintained catalog, versioned | You: structure. Jags: versioning/storage |

**Specific asks for Jags (use these verbatim if helpful):**
1. Where does a spreadsheet prototype break first — ontology, metric definitions, memory, or visualisation?
2. For claims lifecycle: what grain and keys would you insist on so we don't rebuild it at handover?
3. QuickBooks: what's actually extractable today, and what's the data-maintenance issue Krishna found?
4. What must the engineering handover package contain so engineering doesn't have to re-decide the metric list and ontology?
5. Rank integrations 1–6 — which one unblocks the RCM view first? My proposal: **1 + 2 + 5** (claims + remittance + payroll = the earned-not-collected story end-to-end).

## 7. Decisions to try to close tomorrow — in order
1. Is $5M annual gross revenue? (Still unconfirmed — all growth math assumes it)
2. Canonical metric list: the 11 governed names or the 8 the repo declares? What is the 12th?
3. Declare or cut `application_share` + `active_pipeline_rate`?
4. Is the finance / RCM half in scope for you now — and is the RCM view in 5C the right first finance prototype?
5. Does OSpectra want a Candid evaluation (discovery call / fit check on home-care claim types), or is Candid only a reference model for our own build? **Don't let this stay ambiguous.**
6. Jags' ranking of the DE integrations + owner + date for the first spreadsheet schema.

## 8. Don't claim
- Don't claim Candid fits home care / HCBA — unverified.
- Don't quote Candid pricing as fact — not published.
- Don't present the finance templates ($1.44M / $1.25M) as computed answers — they're static templates until a finance catalog exists.
- Don't claim sliders / workflow / RCM view are built if you only mock them tonight — label them `Prototype` on screen. That honesty is what worked Oct 26–27.
