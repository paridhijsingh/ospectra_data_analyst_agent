# PLAN.md — master Cursor prompt
Saved Nov 3, 2026. Paste at the start of a Cursor session in the ospectra_data_analyst_agent repo; Cursor then works PLAN.md item by item in order and maintains the file (checkboxes + Log explainers). Item-specific prompts (G1 patch, G2 sliders) are used for the actual build of each item; this prompt is the session driver.

---
PROMPT (paste into Cursor):

Read PLAN.md at the repo root first — it is the single source of truth for what we build, in what order, and why. Follow it exactly:

1. Work ONE item at a time, in plan order, starting with the first unfinished item in the earliest phase that is not gated. Right now that means: first land item G1 (the cash receipt timeline fix — I will give you the verified patch/brief for it), then G2 (growth-target sliders — I will give you a detailed prompt for it). After that, continue in order: G3, E1, E2, S1, U1, U2.

2. Never start a gated item (marked 🔒, or in Phase 3, or depending on a Phase 0 decision D1–D5) — those wait for Murali's or Jags' input. If the next item is gated, stop and tell me which decision it is waiting on instead of building it.

3. For each item, follow its Why / How / Done-when exactly as written in PLAN.md. If my detailed prompt for an item conflicts with PLAN.md, ask me — do not silently choose. Do not change any calculation lib or canonical number unless the item explicitly says to; numbers in the UI must always derive from lib/fixtures, never be typed into components.

4. When an item meets its "Done when" test: run npm test (all tests must pass — currently 131), then update PLAN.md in the same change: check the item's box, add today's date, and append a Log entry at the bottom of PLAN.md in the existing format — What / Why / How / Evidence (tests, screenshot, or behaviour I can verify). An item without its Log entry is not done.

5. Show me the full diff (code + the PLAN.md update) and stop for my review before I commit. Do not commit anything yourself, do not start the next item until I say so, and do not edit PLAN.md's Phase 0 decisions or guardrails — those only change when I tell you a decision was made.

Start now by confirming which item you are beginning with and restating its Done-when test back to me.
