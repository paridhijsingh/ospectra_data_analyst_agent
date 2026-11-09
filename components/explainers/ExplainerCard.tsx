'use client';

import {
  explainerActionSlotLabels,
  explainerSlotLabels,
  explainerSlotOrder,
  type GovernedExplainer,
} from '@/lib/visualization-explainer';

type ExplainerCardProps = {
  explainer: GovernedExplainer;
  /** When set, Ask-next follow-ups render as clickable chips that submit the question text. */
  onAskNext?: (question: string) => void;
};

export function ExplainerCard({ explainer, onAskNext }: ExplainerCardProps) {
  const labels = explainerSlotLabels[explainer.mode];
  const askNextQuestions = explainer.followUps
    ? [explainer.followUps.drillDown, explainer.followUps.drillUp, explainer.followUps.drillAcross]
    : [];

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
        {explainer.comparativeInsight ? (
          <div>
            <dt>{explainerActionSlotLabels.comparativeInsight}</dt>
            <dd>{explainer.comparativeInsight}</dd>
          </div>
        ) : null}
        {explainer.nextAction ? (
          <div className="ex-card-next-action">
            <dt>{explainerActionSlotLabels.nextAction}</dt>
            <dd>{explainer.nextAction}</dd>
          </div>
        ) : null}
        {explainer.followUps ? (
          <div>
            <dt>{explainerActionSlotLabels.followUps}</dt>
            <dd>
              {onAskNext ? (
                <div className="ex-card-ask-chips" role="group" aria-label="Ask next">
                  {askNextQuestions.map((question) => (
                    <button key={question} type="button" onClick={() => onAskNext(question)}>
                      {question}
                    </button>
                  ))}
                </div>
              ) : (
                <ul className="ex-card-followups">
                  <li>
                    <span>Drill down:</span> {explainer.followUps.drillDown}
                  </li>
                  <li>
                    <span>Drill up:</span> {explainer.followUps.drillUp}
                  </li>
                  <li>
                    <span>Drill across:</span> {explainer.followUps.drillAcross}
                  </li>
                </ul>
              )}
            </dd>
          </div>
        ) : null}
      </dl>
      <p className="ex-card-limits">{explainer.limitations.join(' · ')}</p>
    </section>
  );
}
