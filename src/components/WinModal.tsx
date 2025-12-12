interface WinModalProps {
  level: number;
  moves: number;
  minMoves: number;
  time: number;
  isLastLevel: boolean;
  onNextLevel: () => void;
  onRestart: () => void;
}

export function WinModal({ level, moves, minMoves, time, isLastLevel, onNextLevel, onRestart }: WinModalProps) {
  const mins = Math.floor(time / 60);
  const secs = time % 60;
  const timeString = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  
  const efficiency = Math.round((minMoves / moves) * 100);

  return (
    <div className="modal-overlay">
      <div className="modal-content win-modal">
        <div className="modal-icon">
          {isLastLevel ? '🌟' : '🏆'}
        </div>
        
        <h2 className="modal-title">
          {isLastLevel ? 'ПОЗДРАВЛЯЕМ!' : `Уровень ${level} пройден!`}
        </h2>
        
        {isLastLevel && (
          <p className="modal-subtitle">
            Вы прошли все 100 уровней!
          </p>
        )}

        <div className="modal-stats">
          <div className="modal-stat">
            <div className="modal-stat-label">Время</div>
            <div className="modal-stat-value">{timeString}</div>
          </div>
          
          <div className="modal-stat">
            <div className="modal-stat-label">Ходов сделано</div>
            <div className="modal-stat-value">{moves}</div>
          </div>
          
          <div className="modal-stat">
            <div className="modal-stat-label">Минимум ходов</div>
            <div className="modal-stat-value">{minMoves}</div>
          </div>
          
          <div className="modal-stat">
            <div className="modal-stat-label">Эффективность</div>
            <div className={`modal-stat-value ${efficiency >= 90 ? 'excellent' : efficiency >= 70 ? 'good' : ''}`}>
              {efficiency}%
            </div>
          </div>
        </div>

        <div className="modal-actions">
          {!isLastLevel ? (
            <>
              <button className="modal-button primary" onClick={onNextLevel}>
                Следующий уровень →
              </button>
              <button className="modal-button secondary" onClick={onRestart}>
                Повторить
              </button>
            </>
          ) : (
            <button className="modal-button primary" onClick={onRestart}>
              Играть снова
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
