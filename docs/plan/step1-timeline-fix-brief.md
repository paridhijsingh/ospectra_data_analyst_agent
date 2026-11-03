# Step 1 — Fix the cash receipt timeline overlap (start here)
**Verified Nov 1 against GitHub HEAD** (local clone in sync with origin/main; only package-lock.json modified, from the Oct review install)

## Diagnosis — why it overlaps (found in the code, not guessed)
- **Component:** `components/scenario-demo/CashTimingScenarioDemo.tsx` — the "Receipt timeline" panel (`.sd-rail`)
- **CSS:** `app/globals.css` lines ~243–259
- **Root cause 1:** `.sd-rail-points` is `grid-template-columns: repeat(4, 1fr)` — the four points (Oct 2, Oct 5, Oct 6, Oct 19) are spaced **equally**, not by date. Oct 5 → Oct 6 (1 day) gets the same visual distance as Oct 6 → Oct 19 (13 days). The timeline is lying about time.
- **Root cause 2:** `.sd-delay-bridge` is absolutely positioned at `left:37%; width:50%; top:8px` — its "+14 DAYS" pill sits on top of the rail, crowding the Oct 6 cutoff point. That's the visible overlap Murali flagged.
- **The numbers are fine.** `lib/cash-timing-scenario.ts` computes correctly and has tests. This is a layout-only fix — do not touch the lib.

## The fix (your code, in Cursor)
1. **Position points by date, not by column.** Axis = Oct 2 → Oct 19 (17 days). Each point gets an inline `left: X%`:
   - Oct 2 → 0% · Oct 5 → 17.6% · Oct 6 → 23.5% · Oct 19 → 100%
   - Points become absolutely positioned on the rail; the rail line spans the full width.
2. **Stagger the two close labels.** Oct 5 (baseline) and Oct 6 (cutoff) are only ~6% apart, so their labels *will* collide on one level. Put the baseline point's label **above** the rail and the cutoff's label **below** it (or vice versa) — the 1-day gap becomes readable instead of hidden.
3. **Re-draw the delay bridge between the real positions:** a line/arc from Oct 5 (17.6%) to Oct 19 (100%) *above* the rail, with the "+14 DAYS" pill centred on it — clear of every point and label.
4. Keep all copy, colours and the ExplainerCard as they are.

## Paste this into Cursor to start
> In components/scenario-demo/CashTimingScenarioDemo.tsx, the Receipt timeline (.sd-rail in app/globals.css) spaces its four points in an equal 4-column grid, which misrepresents the dates and crowds the Oct 5 / Oct 6 labels, and the .sd-delay-bridge pill overlaps the rail. Change the timeline so points are positioned proportionally by date on an Oct 2–Oct 19 axis (Oct 2 = 0%, Oct 5 ≈ 17.6%, Oct 6 ≈ 23.5%, Oct 19 = 100%), stagger the Oct 5 baseline label above the rail and the Oct 6 obligation label below it, and redraw the +14 DAYS bridge between the Oct 5 and Oct 19 positions above the rail. Do not change lib/cash-timing-scenario.ts, any numbers, or the explainer copy. Show me the diff before committing.

## Acceptance checks (we verify together after)
- [ ] At demo zoom, no label, pill or point overlaps anything else
- [ ] Oct 5 → Oct 6 *looks* like 1 day; Oct 6 → Oct 19 *looks* like ~2 weeks
- [ ] `npm test` still 131+ passing, build green (lib untouched, so this should be automatic)
- [ ] Before/after screenshot saved for slide 9 of the deck ("Murali's four" evidence)

## Next, already scouted — Step 2 sliders
- `GrowthTargetScenarioDemo.tsx` has **no state and no inputs** — scenarios are fixed (`getGrowthTargetScenarios()`, hard-coded 1/2/3-per-week series); inputs (n, L, h, p) render as static text at lines ~178–191.
- The engine is ready for sliders: `analyzeRunRateTarget(input)` at `lib/revenue-run-rate-target.ts:58` takes a typed input object.
- A Slider component already exists at `components/ui/slider.tsx` — no new dependency, no hand-rolled slider.
