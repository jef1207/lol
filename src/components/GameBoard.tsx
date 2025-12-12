interface GameBoardProps {
  state: (number | null)[];
  onMove: (index: number) => void;
  hintIndex: number | null;
}

export function GameBoard({ state, onMove, hintIndex }: GameBoardProps) {
  return (
    <div className="game-board">
      {state.map((value, index) => (
        <div
          key={index}
          className={`cell ${value === null ? 'empty' : ''} ${hintIndex === index ? 'hinted' : ''}`}
          onClick={() => value !== null && onMove(index)}
        >
          {value !== null && (
            <span className="cell-value">{value}</span>
          )}
        </div>
      ))}
    </div>
  );
}
