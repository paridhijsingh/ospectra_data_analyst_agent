import Link from 'next/link';
import { ArrowLeft, CalendarClock, Network } from 'lucide-react';
import { OntologyInvestigationDemo } from '@/components/ontology-demo/OntologyInvestigationDemo';

export default function OntologyDemoPage() {
  return (
    <div className="os-shell">
      <aside className="os-sidebar">
        <div className="os-brand">
          <span>O</span>
          <div>
            <strong>OSpectra</strong>
            <small>Data Analyst Platform</small>
          </div>
        </div>
        <nav>
          <Link href="/" className="os-nav">
            <ArrowLeft size={17} />
            <span>Back to Talent Lens</span>
          </Link>
          <Link href="/ontology-demo" className="os-nav active">
            <Network size={17} />
            <span>Ontology Research</span>
          </Link>
          <Link href="/scenario-demo" className="os-nav">
            <CalendarClock size={17} />
            <span>Scenario Research</span>
          </Link>
        </nav>
        <div className="os-sidebar-foot">
          <span>Research prototype</span>
          <small>Financial Ontology v0.1</small>
        </div>
      </aside>
      <div className="os-stage">
        <header className="os-header">
          <div className="os-header-title">
            <div>
              <strong>Financial Ontology v0.1</strong>
              <span className="od-badge">Research prototype</span>
            </div>
            <small>Governed relationships that guide investigation</small>
          </div>
          <div className="os-header-actions">
            <Link href="/" className="od-back-link">
              <ArrowLeft size={14} />
              Return to Talent Lens
            </Link>
          </div>
        </header>
        <main className="os-main od-main">
          <OntologyInvestigationDemo />
        </main>
      </div>
    </div>
  );
}
