'use client';

import { useState } from 'react';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import { toggleAnswerFeedback, type AnswerFeedback } from '@/lib/answer-card-ui';

type AnswerFeedbackControlsProps = {
  /** Isolates local feedback state per answer identity when the parent remounts via key. */
  'aria-label'?: string;
};

export function AnswerFeedbackControls({ 'aria-label': ariaLabel = 'Answer feedback' }: AnswerFeedbackControlsProps) {
  const [feedback, setFeedback] = useState<AnswerFeedback>(null);

  return (
    <div className="os-answer-feedback" role="group" aria-label={ariaLabel}>
      <button
        type="button"
        className={feedback === 'up' ? 'active' : ''}
        aria-pressed={feedback === 'up'}
        aria-label="Thumbs up"
        onClick={() => setFeedback((current) => toggleAnswerFeedback(current, 'up'))}
      >
        <ThumbsUp size={13} />
      </button>
      <button
        type="button"
        className={feedback === 'down' ? 'active' : ''}
        aria-pressed={feedback === 'down'}
        aria-label="Thumbs down"
        onClick={() => setFeedback((current) => toggleAnswerFeedback(current, 'down'))}
      >
        <ThumbsDown size={13} />
      </button>
    </div>
  );
}
