'use client';

import { useState } from 'react';
import { CashTimingScenarioDemo } from './CashTimingScenarioDemo';
import { GrowthTargetScenarioDemo } from './GrowthTargetScenarioDemo';
import { RevenueRunRateScenarioDemo } from './RevenueRunRateScenarioDemo';

type ScenarioFamily = 'cash-timing' | 'revenue-run-rate' | 'growth-target';

const families: { id: ScenarioFamily; label: string }[] = [
  { id: 'cash-timing', label: 'Cash Timing' },
  { id: 'revenue-run-rate', label: 'Revenue Run-Rate' },
  { id: 'growth-target', label: 'Growth Target' },
];

export function ScenarioResearchView() {
  const [family, setFamily] = useState<ScenarioFamily>('cash-timing');

  return (
    <>
      <div className="sd-family-switch" role="tablist" aria-label="Scenario family">
        {families.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={family === item.id}
            className={family === item.id ? 'active' : ''}
            onClick={() => setFamily(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {family === 'cash-timing' ? <CashTimingScenarioDemo /> : null}
      {family === 'revenue-run-rate' ? <RevenueRunRateScenarioDemo /> : null}
      {family === 'growth-target' ? <GrowthTargetScenarioDemo /> : null}
    </>
  );
}
