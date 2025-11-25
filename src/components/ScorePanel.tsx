import './ScorePanel.css';

interface ScorePanelProps {
  score: number;
  total: number;
}

export function ScorePanel({ score, total }: ScorePanelProps) {
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  return (
    <div className="score-panel">
      <div className="score-item">
        <span className="score-label">Pisteet:</span>
        <span className="score-value">{score}</span>
      </div>
      <div className="score-item">
        <span className="score-label">Kysymykset:</span>
        <span className="score-value">{total}</span>
      </div>
      <div className="score-item">
        <span className="score-label">Tarkkuus:</span>
        <span className="score-value">{percentage}%</span>
      </div>
    </div>
  );
}


