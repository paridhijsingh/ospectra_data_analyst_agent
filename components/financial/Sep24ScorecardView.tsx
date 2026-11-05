'use client';

import {
  SEP24_SCORECARD_HEADER,
  sep24ScorecardOpenItems,
  sep24ScorecardQuestions,
  sep24ScorecardReports,
} from '@/lib/sep24-scorecard-data';

type Sep24ScorecardViewProps = {
  onAskQuestion: (prompt: string) => void;
  onOpenReports: () => void;
};

export function Sep24ScorecardView({ onAskQuestion, onOpenReports }: Sep24ScorecardViewProps) {
  return (
    <div className="os-scorecard">
      <div className="os-scorecard-head">
        <div>
          <strong>Sep 24 Scorecard</strong>
          <p>Murali&apos;s Sep 24 set — honest status against the Financial Agent wiring.</p>
        </div>
        <span className="os-scorecard-badge">{SEP24_SCORECARD_HEADER}</span>
      </div>
      <p className="os-scorecard-header-line">{SEP24_SCORECARD_HEADER}</p>

      <section className="os-scorecard-section" aria-labelledby="os-scorecard-questions">
        <h3 id="os-scorecard-questions">Questions</h3>
        <ul className="os-scorecard-list">
          {sep24ScorecardQuestions.map((item) => (
            <li key={item.id}>
              <div className="os-scorecard-row">
                <span className="os-scorecard-code">{item.code}</span>
                <div className="os-scorecard-body">
                  <strong>{item.prompt}</strong>
                  <span className="os-scorecard-chip">{item.status}</span>
                </div>
                <button type="button" className="os-scorecard-link" onClick={() => onAskQuestion(item.prompt)}>
                  Ask in chat
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="os-scorecard-section" aria-labelledby="os-scorecard-reports">
        <h3 id="os-scorecard-reports">Reports</h3>
        <ul className="os-scorecard-list">
          {sep24ScorecardReports.map((item) => (
            <li key={item.id}>
              <div className="os-scorecard-row">
                <span className="os-scorecard-code">{item.code}</span>
                <div className="os-scorecard-body">
                  <strong>{item.title}</strong>
                  <span className="os-scorecard-chip">{item.status}</span>
                </div>
                <button type="button" className="os-scorecard-link" onClick={onOpenReports}>
                  Open Reports
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="os-scorecard-section" aria-labelledby="os-scorecard-open">
        <h3 id="os-scorecard-open">Still open</h3>
        <ol className="os-scorecard-open">
          {sep24ScorecardOpenItems.map((item) => (
            <li key={item.id}>
              <strong>{item.title}</strong>
              <span>{item.detail}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
