import { describe, expect, it } from 'vitest';
import {
  QUESTION_STATUS,
  REPORT_STATUS,
  SEP24_SCORECARD_HEADER,
  renderSep24ScorecardContent,
  sep24ScorecardBoardItems,
  sep24ScorecardOpenItems,
  sep24ScorecardQuestions,
  sep24ScorecardReports,
} from './sep24-scorecard-data';

describe('Scorecard content (the questions Murali gave)', () => {
  it('lists all 16 board items plus 5 still-open items', () => {
    expect(sep24ScorecardQuestions).toHaveLength(10);
    expect(sep24ScorecardReports).toHaveLength(6);
    expect(sep24ScorecardBoardItems).toHaveLength(16);
    expect(sep24ScorecardOpenItems).toHaveLength(5);
  });

  it('renders every board and open item with the honesty header', () => {
    const content = renderSep24ScorecardContent();

    expect(content).toContain('Scorecard — the questions Murali gave');
    expect(content).toContain(SEP24_SCORECARD_HEADER);
    expect(content).toContain('Still open');

    for (const item of sep24ScorecardQuestions) {
      expect(content).toContain(item.code);
      expect(content).toContain(item.prompt);
      expect(content).toContain(QUESTION_STATUS);
      expect(item.status).toBe(QUESTION_STATUS);
      expect(item.destination).toBe('chat');
    }

    for (const item of sep24ScorecardReports) {
      expect(content).toContain(item.code);
      expect(content).toContain(item.title);
      expect(content).toContain(REPORT_STATUS);
      expect(item.status).toBe(REPORT_STATUS);
      expect(item.destination).toBe('reports');
    }

    for (const [index, item] of sep24ScorecardOpenItems.entries()) {
      expect(content).toContain(`${index + 1}. ${item.title}`);
      expect(content).toContain(item.detail);
    }
  });

  it('does not import or invoke synthetic-finance compute', async () => {
    const source = await import('node:fs').then((fs) =>
      fs.promises.readFile(new URL('./sep24-scorecard-data.ts', import.meta.url), 'utf8'),
    );
    expect(source).not.toMatch(/synthetic-finance|getBreakEven|buildIncomeStatement|financial-compute/);
  });
});
