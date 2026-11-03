# Cursor pair-coding plan — after the Nov 2 meeting
**Mode (your rule):** you write the code in Cursor; the approach is agreed first, then the diff is reviewed after. No step starts until the one above it demos clean.
**Gate:** Steps 6–7 wait for the Bucket-1 decisions (canonical metric list, finance scope). Steps 1–5 don't.

## Step 1 — Fix the cash receipt timeline overlap (~smallest win)
- **Approach first:** find the scenario page's timeline component; the overlap is a layout problem (two series sharing one axis/scale), not a data problem — numbers are verified. Fix = separate the series (bars = weekly, line = cumulative, own axis) exactly like RCM View v2 chart 4.
- **Cursor prompt to start:** "Show me the component that renders the cash receipt timeline on the scenario page and explain how each series is positioned."
- **Done when:** renders clean at demo zoom; before/after screenshots saved.

## Step 2 — Growth dials as working sliders
- **Approach:** admissions/week, lifetime weeks, hours, rate become state; every derived number (weekly revenue, plateau, $5M date) recomputes from state — no hard-coded cases. Keep the verified cases as tests: 1/wk → ~$54.6k/wk plateau; 2/wk → ~$109.2k/wk; 3/wk → $5M run-rate wk 46.
- **Done when:** moving any slider updates the chart + the $5M date live, and the three known cases still reproduce.

## Step 3 — Chips + feedback on every answer
- **Approach:** every answer card gets a status chip — Governed / Template–not computed / Synthetic — driven by the answer's source, not typed by hand. Thumbs up/down + optional reason, stored in local state for Research Preview (no backend yet).
- **Done when:** a finance template answer and a recruitment governed answer are visually distinguishable at a glance, and a thumbs-down is recorded somewhere you can show.

## Step 4 — Define-a-metric (out-of-scope) workflow
- **Approach:** on a BLOCKED answer, replace the dead end with a form: metric name, owner, formula, source tables, purpose → submit → appears in a "Pending governance" list with status. Local state only; the workflow shape is the deliverable.
- **Done when:** asking for LTV live in the demo flows: refusal → form → pending queue, in under a minute.

## Step 5 — Header cleanup + scenario deep-link
- **Approach:** replace "Vasu Rao — Manager Access" with a neutral demo persona; add a card in chat answers that deep-links to /scenario-demo carrying the question's parameters.
- **Done when:** no POC persona remains in a screenshare, and a run-rate question in chat reaches the right scenario view in one click.

## Step 6 — RCM View page in the repo (spreadsheet-backed)
- **Approach:** new page implementing v2's six visuals, but data comes from one typed data file (claims / remittance / payroll rows as a local spreadsheet-shaped fixture), not hard-coded JSX numbers — so swapping in Jags' real schema later is a data change, not a rewrite. Charts: bridge, funnel, A/R donut, bars+cumulative, denials, at-risk table; each with its "so what" line from the mock.
- **Done when:** changing a number in the data file changes every derived chart + the banner consistently (totals still reconcile to the gap).

## Step 7 — Quarter filter + time-to-fill
- **Approach:** only after the canonical list decision. Quarter filter = a period parameter on the executor, applied to existing governed questions first (Q2). Time-to-fill = new governed metric, grouped by role family, definition written *before* code (your governance guardrail).
- **Done when:** Q2 answers per quarter and Q1 answers time-to-fill, both with lineage showing the new definition.
