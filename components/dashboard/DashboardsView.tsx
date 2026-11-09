'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, Grid2X2 } from 'lucide-react';
import {
  buildDashboard,
  type DashboardCard,
} from '@/lib/dashboard-catalog';
import type { AgentId } from '@/lib/orchestrator';

type DashboardsViewProps = {
  agentId: AgentId;
  onSwitchAgent: (agentId: AgentId) => void;
  onOpenAsk: () => void;
  onOpenReports?: () => void;
  onOpenScorecard?: () => void;
};

function DashboardCardView({ card }: { card: DashboardCard }) {
  const [lineageOpen, setLineageOpen] = useState(false);
  return (
    <article className="os-dash-card" data-available={card.available ? 'true' : 'false'}>
      <h3>{card.title}</h3>
      <strong className="os-dash-card-value">{card.value}</strong>
      <p className="os-dash-card-period">{card.period}</p>
      <span className="os-source-chip">{card.honestyChip}</span>
      <div className="os-dash-card-foot">
        <span>
          Sources: {card.lineage.sources.join(', ') || 'none'} · Data as of {card.period}
        </span>
        <button type="button" onClick={() => setLineageOpen((open) => !open)}>
          {lineageOpen ? 'Hide lineage' : 'View lineage'}
        </button>
      </div>
      {lineageOpen ? (
        <div className="os-lineage os-dash-lineage">
          <div>
            <span>Source</span>
            <code>{card.lineage.honesty}</code>
          </div>
          <div>
            <span>Metric</span>
            <code>{card.lineage.metricIds.join(', ') || 'No approved metric'}</code>
          </div>
          <div>
            <span>Definition</span>
            <code>{card.lineage.definition}</code>
          </div>
          <div>
            <span>Query plan</span>
            <code>{card.lineage.queryPlan}</code>
          </div>
        </div>
      ) : null}
    </article>
  );
}

export function DashboardsView({
  agentId,
  onSwitchAgent,
  onOpenAsk,
  onOpenReports,
  onOpenScorecard,
}: DashboardsViewProps) {
  const [supportingOpen, setSupportingOpen] = useState(false);
  const dashboard = useMemo(() => buildDashboard(agentId), [agentId]);

  return (
    <div className="os-dash">
      <div className="os-dash-toolbar">
        <div className="os-dash-title">
          <Grid2X2 size={16} />
          <strong>Dashboards</strong>
        </div>
        <div className="os-dash-switch" role="group" aria-label="Dashboard agent">
          <button
            type="button"
            className={agentId === 'recruitment' ? 'active' : ''}
            onClick={() => onSwitchAgent('recruitment')}
          >
            Recruitment
          </button>
          <button
            type="button"
            className={agentId === 'financial' ? 'active' : ''}
            onClick={() => onSwitchAgent('financial')}
          >
            Finance
          </button>
        </div>
      </div>

      <section className="os-dash-goal" aria-label="Dashboard goal">
        <p>{dashboard.goalBanner}</p>
        <small>{dashboard.typeLabel}</small>
      </section>

      <div className="os-dash-grid">
        {dashboard.cards.map((card) => (
          <DashboardCardView key={card.id} card={card} />
        ))}
      </div>

      <section className="os-dash-supporting">
        <button
          type="button"
          className="os-dash-supporting-trigger"
          aria-expanded={supportingOpen}
          onClick={() => setSupportingOpen((open) => !open)}
        >
          <span>Supporting detail</span>
          <ChevronDown size={14} data-open={supportingOpen ? 'true' : 'false'} />
        </button>
        {supportingOpen ? (
          <div className="os-dash-supporting-body">
            {agentId === 'financial' ? (
              <>
                <p>Open the existing Finance views that carry the rest of the detail.</p>
                <div className="os-dash-supporting-links">
                  {onOpenReports ? (
                    <button type="button" onClick={onOpenReports}>
                      Reports
                    </button>
                  ) : null}
                  {onOpenScorecard ? (
                    <button type="button" onClick={onOpenScorecard}>
                      Scorecard
                    </button>
                  ) : null}
                </div>
              </>
            ) : (
              <>
                <p>Open Ask to use the recruitment question picker for the full governed answers.</p>
                <div className="os-dash-supporting-links">
                  <button type="button" onClick={onOpenAsk}>
                    Ask Recruitment Analyst
                  </button>
                </div>
              </>
            )}
          </div>
        ) : null}
      </section>
    </div>
  );
}
