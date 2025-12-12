interface GameControlsProps {
  onHint: () => void;
  onRestart: () => void;
}

export function GameControls({ onHint, onRestart }: GameControlsProps) {
  return (
    <div className="game-controls">
      <button className="control-button hint" onClick={onHint}>
        <span className="button-icon">💡</span>
        <span className="button-text">Подсказка</span>
      </button>
      
      <button className="control-button restart" onClick={onRestart}>
        <span className="button-icon">🔄</span>
        <span className="button-text">Сначала</span>
      </button>
    </div>
  );
}
