# G2 sliders — what it is, how it works, and the meeting demo script
For Paridhi · Nov 3, 2026 meeting · Pairs with docs/plan/g2-sliders-prompt.md

## The one-liner (say this first)
"The Growth Target page used to *print* its assumptions. Now you can move them — and the chart, the cards, and the $5M date all move together, because they all come from the same calculation."

## What changed
- The four model dials — admissions/week, client lifetime (weeks), service hours, billing rate — are now sliders instead of static text.
- Lifetime, hours, and rate drive the existing 1/2/3-per-week comparison. A fourth slider adds a dashed **Custom** admissions series, defaulting to 2.5/week.
- A labelled dot now marks where the baseline crosses the $5M line ("reaches $5M — week 110" at defaults) instead of making the viewer eyeball it.

## How it works (if anyone asks "but what's actually happening?")
1. A slider sets one input value in the page (nothing else changes).
2. The page re-runs the **same, untouched** model functions it always used — `projectRevenueRunRate` then `analyzeRunRateTarget` — with the new input.
3. Everything on screen (three case cards, chart series, required-admissions number, crossing dot, state labels like "Unreachable under assumptions") is derived from that one recomputation. No number is typed into the UI, and no calculation code changed — which is why the defaults still reproduce the verified numbers exactly.

## The math in one breath
Weekly revenue at plateau = admissions × lifetime × hours × rate. At defaults (2/wk × 52 wks × 30 hrs × $35) that's $109,200/week ≈ $5.68M/year. Census grows toward its plateau exponentially — clients(w) = n × L × (1 − e^(−w/L)) — which is why the curve bends and why reaching $5M takes 110 weeks even though the plateau is above $5M. Required pace to reach $5M at defaults ≈ **1.76 admissions/week**.

## 90-second demo script
1. **Start at defaults.** "Nothing has changed yet — same verified numbers: 2 a week plateaus at $5.68M and crosses $5M at week 110. The dot on the chart now says so, so nobody has to eyeball it."
2. **Point at the dashed line.** "This is the Custom series at 2.5 admissions a week — the comparison case we couldn't show in October's Present Data. Now it's just a slider position."
3. **Drag lifetime 52 → 26 weeks.** "If clients stay half as long, every plateau halves — 2 a week now tops out at $2.84M, and watch the state label: the target becomes *unreachable under these assumptions*. That's the model being honest, not broken."
4. **Drag rate $35 → $50 (lifetime back at 52).** "Rate is a lever too — plateau rises proportionally. Same engine, no code change, just inputs."
5. **Reset to defaults and close.** "Branch expansion and additional revenue streams are still listed as not modeled — that part hasn't changed. And the $5M definition is still your decision, Murali — the sliders move the levers, not the target's meaning."

## If pressed
- **"Is this new math?"** No. Same lib functions, same tests — the sliders only feed inputs to calculations that were already verified. Defaults reproduce the old page exactly; that's the acceptance check.
- **"Why keep 1/2/3 if there's a custom slider?"** The three cases are the verified control everyone has seen; Custom is for exploration. Both run through the identical path.
- **"Can it do 2.5 with different hours?"** Yes — that's the point of wiring all four dials: any combination recomputes live.
- **Anything you can't verify:** "I'll confirm and send it today."
