interface GameHeaderProps {
  level: number;
  totalLevels: number;
  movesCount: number;
  minMoves: number;
  elapsedTime: number;
  onRestart: () => void;
}

export function GameHeader({ level, totalLevels, movesCount, minMoves, elapsedTime, onRestart }: GameHeaderProps) {
  const progress = (level / totalLevels) * 100;
  const mins = Math.floor(elapsedTime / 60);
  const secs = elapsedTime % 60;
  const timeString = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

  return (
    <div className="game-header">
      <div className="header-title">
        <h1>Камушки</h1>
        <div className="level-badge">
          Уровень {level} / {totalLevels}
        </div>
      </div>

      <div className="progress-bar-container">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="progress-text">{level}%</div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Время</div>
          <div className="stat-value">{timeString}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Ходы</div>
          <div className="stat-value">{movesCount}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Мин.</div>
          <div className="stat-value highlight">{minMoves}</div>
        </div>

        <button className="restart-button" onClick={onRestart}>
          Сначала
        </button>
      </div>
    </div>
  );
}