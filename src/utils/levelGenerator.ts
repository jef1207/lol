export function getValidMovesFrom(idx: number): number[] {
  const moves: number[] = [];
  const row = Math.floor(idx / 3);
  const col = idx % 3;
  
  if (row > 0) moves.push(idx - 3);
  if (row < 2) moves.push(idx + 3);
  if (col > 0) moves.push(idx - 1);
  if (col < 2) moves.push(idx + 1);
  
  return moves;
}

export function generateAllLevels(maxLevel: number = 100): { [key: number]: (number | null)[] } {
  const LEVEL_CACHE: { [key: number]: (number | null)[] } = {};
  const winState: (number | null)[] = [1, 2, 3, 4, 5, 6, 7, 8, null];
  const queue: [(number | null)[], number][] = [[winState, 0]];
  const visited = new Map<string, number>();
  visited.set(winState.join(','), 0);
  
  const levelsToGenerate = Array.from({ length: maxLevel }, (_, i) => i + 1);
  const neededDepths = new Set(levelsToGenerate.map(l => 5 + l));

  while (queue.length && neededDepths.size > 0) {
    const current = queue.shift();
    if (!current) break;
    
    const [state, depth] = current;
    
    if (neededDepths.has(depth)) {
      for (let lvl = 1; lvl <= maxLevel; lvl++) {
        if (!LEVEL_CACHE[lvl] && 5 + lvl === depth) {
          LEVEL_CACHE[lvl] = state.slice();
          neededDepths.delete(depth);
        }
      }
    }
    
    if (neededDepths.size === 0) break;

    const emptyIndex = state.indexOf(null);
    const moves = getValidMovesFrom(emptyIndex);
    
    for (const idx of moves) {
      const newState = state.slice();
      [newState[emptyIndex], newState[idx]] = [newState[idx], newState[emptyIndex]];
      const key = newState.join(',');
      
      if (!visited.has(key)) {
        visited.set(key, depth + 1);
        if (depth + 1 <= 105) {
          queue.push([newState, depth + 1]);
        }
      }
    }
  }

  console.log(`✅ Generated ${Object.keys(LEVEL_CACHE).length} levels`);
  return LEVEL_CACHE;
}
