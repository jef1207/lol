import { useState, useEffect } from 'react';
import { GameBoard } from './components/GameBoard';
import { GameHeader } from './components/GameHeader';
import { WinModal } from './components/WinModal';
import { generateAllLevels, getValidMovesFrom } from './utils/levelGenerator';

export default function App() {
  const [state, setState] = useState<(number | null)[]>([]);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [movesCount, setMovesCount] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [showWinModal, setShowWinModal] = useState(false);
  const [levelCache, setLevelCache] = useState<{ [key: number]: (number | null)[] }>({});
  const [cacheReady, setCacheReady] = useState(false);

  // Generate all levels on mount
  useEffect(() => {
    const cache = generateAllLevels(100);
    setLevelCache(cache);
    setCacheReady(true);
  }, []);

  // Initialize level
  useEffect(() => {
    if (cacheReady && levelCache[currentLevel]) {
      initLevel(currentLevel);
    }
  }, [currentLevel, cacheReady, levelCache]);

  // Timer
  useEffect(() => {
    let interval: number | undefined;
    if (gameActive && startTime) {
      interval = window.setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameActive, startTime]);

  const initLevel = (level: number) => {
    if (!levelCache[level]) return;
    
    setState([...levelCache[level]]);
    setMovesCount(0);
    setElapsedTime(0);
    setStartTime(null);
    setGameActive(false);
    setShowWinModal(false);
  };

  const move = (index: number) => {
    const emptyIndex = state.indexOf(null);
    const row1 = Math.floor(index / 3);
    const col1 = index % 3;
    const row2 = Math.floor(emptyIndex / 3);
    const col2 = emptyIndex % 3;
    const isAdjacent = Math.abs(row1 - row2) + Math.abs(col1 - col2) === 1;

    if (isAdjacent) {
      if (!gameActive) {
        setGameActive(true);
        setStartTime(Date.now());
      }

      const newState = [...state];
      [newState[index], newState[emptyIndex]] = [newState[emptyIndex], newState[index]];
      setState(newState);
      setMovesCount(movesCount + 1);

      // Check win
      const winState = [1, 2, 3, 4, 5, 6, 7, 8, null];
      const isWin = newState.every((val, i) => val === winState[i]);
      
      if (isWin) {
        setGameActive(false);
        setTimeout(() => setShowWinModal(true), 300);
      }
    }
  };

  const handleNextLevel = () => {
    if (currentLevel < 100) {
      setCurrentLevel(currentLevel + 1);
    }
  };

  const handleRestart = () => {
    initLevel(currentLevel);
  };

  const minMoves = 5 + currentLevel;

  return (
    <div className="app-container">
      <div className="game-wrapper">
        <GameHeader
          level={currentLevel}
          totalLevels={100}
          movesCount={movesCount}
          minMoves={minMoves}
          elapsedTime={elapsedTime}
          onRestart={handleRestart}
        />

        <GameBoard
          state={state}
          onMove={move}
          hintIndex={null}
        />
      </div>

      {showWinModal && (
        <WinModal
          level={currentLevel}
          moves={movesCount}
          minMoves={minMoves}
          time={elapsedTime}
          isLastLevel={currentLevel === 100}
          onNextLevel={handleNextLevel}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}