'use client';

import {
  explainerSlotLabels,
  explainerSlotOrder,
  type GovernedExplainer,
} from '@/lib/visualization-explainer';

export function ExplainerCard({ explainer }: { explainer: GovernedExplainer }) {
  const labels = explainerSlotLabels[explainer.mode];
  return (
    <section className="ex-card" aria-labelledby={`ex-${explainer.id}-title`}>
      <strong id={`ex-${explainer.id}-title`} className="ex-card-title">
        {explainer.title}
      </strong>
      <dl className="ex-card-slots">
        {explainerSlotOrder.map((key) => (
          <div key={key}>
            <dt>{labels[key]}</dt>
            <dd>{explainer[key]}</dd>
          </div>
        ))}
      </dl>
      <p className="ex-card-limits">{explainer.limitations.join(' · ')}</p>
    </section>
  );
}
