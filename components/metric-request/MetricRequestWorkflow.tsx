'use client';

import { FormEvent, useEffect, useId, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  appendPendingMetricRequest,
  canRequestMetric,
  createEmptyMetricRequestDraft,
  createPendingMetricRequest,
  METRIC_REQUEST_ACTION_LABEL,
  METRIC_REQUEST_FORM_TITLE,
  METRIC_REQUEST_PROTOTYPE_NOTE,
  PENDING_METRIC_REQUESTS_TITLE,
  PENDING_METRIC_REQUEST_STATUS,
  WORKFLOW_PROTOTYPE_LABEL,
  type MetricRequestDraft,
  type PendingMetricRequest,
} from '@/lib/metric-request-workflow';

type MetricRequestWorkflowProps = {
  supported: boolean;
  blockedQuestion: string;
};

export function MetricRequestWorkflow({ supported, blockedQuestion }: MetricRequestWorkflowProps) {
  const formId = useId();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<PendingMetricRequest[]>([]);
  const [draft, setDraft] = useState<MetricRequestDraft>(() =>
    createEmptyMetricRequestDraft(blockedQuestion),
  );
  const showAction = canRequestMetric({ supported });

  useEffect(() => {
    if (!open) return;
    setDraft(createEmptyMetricRequestDraft(blockedQuestion));
  }, [open, blockedQuestion]);

  function updateField<K extends keyof MetricRequestDraft>(key: K, value: MetricRequestDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!draft.question.trim() || !draft.owner.trim()) return;
    const request = createPendingMetricRequest(
      draft,
      `metric-req-${Date.now()}-${pending.length + 1}`,
    );
    setPending((current) => appendPendingMetricRequest(current, request));
    setOpen(false);
  }

  return (
    <div className="os-metric-request">
      {showAction ? (
        <div className="os-metric-request-action">
          <button type="button" className="os-metric-request-trigger" onClick={() => setOpen(true)}>
            {METRIC_REQUEST_ACTION_LABEL}
          </button>
        </div>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="os-metric-request-dialog" showCloseButton>
          <DialogHeader>
            <div className="os-metric-request-dialog-head">
              <DialogTitle>{METRIC_REQUEST_FORM_TITLE}</DialogTitle>
              <span className="os-workflow-prototype-chip">{WORKFLOW_PROTOTYPE_LABEL}</span>
            </div>
            <DialogDescription>{METRIC_REQUEST_PROTOTYPE_NOTE}</DialogDescription>
          </DialogHeader>

          <form id={formId} className="os-metric-request-form" onSubmit={submit}>
            <div className="os-metric-request-field">
              <Label htmlFor={`${formId}-question`}>Question</Label>
              <Textarea
                id={`${formId}-question`}
                value={draft.question}
                onChange={(event) => updateField('question', event.target.value)}
                rows={2}
                required
              />
            </div>

            <div className="os-metric-request-field">
              <Label htmlFor={`${formId}-owner`}>Suggested metric owner</Label>
              <Input
                id={`${formId}-owner`}
                value={draft.owner}
                onChange={(event) => updateField('owner', event.target.value)}
                placeholder="Who should own this definition?"
                required
              />
            </div>

            <div className="os-metric-request-field">
              <Label htmlFor={`${formId}-sources`}>Likely data sources</Label>
              <Textarea
                id={`${formId}-sources`}
                value={draft.sources}
                onChange={(event) => updateField('sources', event.target.value)}
                rows={2}
                placeholder="Systems or tables that could feed this metric"
              />
            </div>

            <div className="os-metric-request-field">
              <Label htmlFor={`${formId}-purpose`}>
                What decision this metric would support
              </Label>
              <Textarea
                id={`${formId}-purpose`}
                value={draft.purpose}
                onChange={(event) => updateField('purpose', event.target.value)}
                rows={2}
                placeholder="Purpose / decision supported"
              />
            </div>

            <div className="os-metric-request-field">
              <Label htmlFor={`${formId}-formula`}>Draft formula (optional)</Label>
              <Textarea
                id={`${formId}-formula`}
                value={draft.formula}
                onChange={(event) => updateField('formula', event.target.value)}
                rows={2}
                placeholder="Optional draft formula"
              />
            </div>
          </form>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form={formId}>
              Add to pending requests
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {pending.length > 0 ? (
        <section className="os-metric-request-pending" aria-label={PENDING_METRIC_REQUESTS_TITLE}>
          <div className="os-metric-request-pending-head">
            <div>
              <ClipboardList size={14} />
              <strong>{PENDING_METRIC_REQUESTS_TITLE}</strong>
            </div>
            <span className="os-workflow-prototype-chip">{WORKFLOW_PROTOTYPE_LABEL}</span>
          </div>
          <ul>
            {pending.map((item) => (
              <li key={item.id}>
                <div>
                  <strong>{item.question}</strong>
                  <small>Owner: {item.owner || '—'}</small>
                </div>
                <span className="os-metric-request-status">{PENDING_METRIC_REQUEST_STATUS}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
