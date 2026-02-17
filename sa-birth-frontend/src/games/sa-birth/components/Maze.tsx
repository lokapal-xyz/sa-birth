import { useState, useEffect, useCallback } from 'react';
import type { Sense, Character } from '../SaBirthGame';
import { getMazeLayout } from './characterMazeLayouts';
import { colors, typography, spacing, borderRadius } from '../../../design-system';
import { Shield, Star, Sparkles, AlertTriangle } from 'lucide-react';
import { playSound } from '../../../utils/sound';
import { useSound } from '../../../utils/useSound';

interface MazeProps {
  sense: Sense;
  character: Character;
  onComplete: (score: number, points: number, time_ms: number) => void;
  onBack: () => void;
}

type Position = { x: number; y: number };

const CELL_SIZE = 32;
const MOVE_DELAY = 150;

// Character-specific shield colors
const CHARACTER_SHIELD_COLORS = {
  ALICE: '#3b82f6',
  ROBERT: '#10b981',
  CAROL: '#a855f7',
};

export function Maze({ sense, character, onComplete, onBack }: MazeProps) {
  const { play } = useSound();
  const layout = getMazeLayout(character, sense);
  const [playerPos, setPlayerPos] = useState<Position>(layout.start);
  const [lastMoveTime, setLastMoveTime] = useState(0);
  const [visitedCells, setVisitedCells] = useState<Set<string>>(new Set([`${layout.start.x},${layout.start.y}`]));
  
  const [startTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timePenalty, setTimePenalty] = useState(0); // For Robert's hazards

  // Character-specific challenge state
  const [collectedItems, setCollectedItems] = useState<Set<string>>(new Set()); // Alice
  const [hitHazards, setHitHazards] = useState<Set<string>>(new Set()); // Robert
  const [flashEffect, setFlashEffect] = useState<{ type: 'collect' | 'hazard' | null; position: Position | null }>({ 
    type: null, 
    position: null 
  });

  // Define collectible/hazard positions (strategically placed in mazes)
  const collectiblePositions: Position[] = character === 'ALICE' ? [
    { x: 7, y: 5 },
    { x: 15, y: 9 },
    { x: 11, y: 14 },
  ] : [];

  const hazardPositions: Position[] = character === 'ROBERT' ? [
    { x: 5, y: 7 },
    { x: 13, y: 11 },
    { x: 9, y: 15 },
  ] : [];

  const totalWalkableCells = layout.grid.flat().filter(c => c === 0).length;
  const explorationPoints = visitedCells.size;

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Date.now() - startTime);
    }, 100);
    return () => clearInterval(interval);
  }, [startTime]);

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const deciseconds = Math.floor((ms % 1000) / 100);
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${deciseconds}`;
  };

  // Check for collectibles and hazards when player moves
  useEffect(() => {
    const posKey = `${playerPos.x},${playerPos.y}`;
    
    // Alice: Check for collectibles
    if (character === 'ALICE') {
      const collectible = collectiblePositions.find(p => p.x === playerPos.x && p.y === playerPos.y);
      if (collectible && !collectedItems.has(posKey)) {
        setCollectedItems(prev => new Set([...prev, posKey]));
        play('senseIntegrated'); // Positive sound
        setFlashEffect({ type: 'collect', position: playerPos });
        setTimeout(() => setFlashEffect({ type: null, position: null }), 500);
      }
    }
    
    // Robert: Check for hazards
    if (character === 'ROBERT') {
      const hazard = hazardPositions.find(p => p.x === playerPos.x && p.y === playerPos.y);
      if (hazard && !hitHazards.has(posKey)) {
        setHitHazards(prev => new Set([...prev, posKey]));
        setTimePenalty(prev => prev + 20000); // Add 20 seconds in milliseconds
        play('warning'); // Negative sound
        setFlashEffect({ type: 'hazard', position: playerPos });
        setTimeout(() => setFlashEffect({ type: null, position: null }), 500);
      }
    }
  }, [playerPos, character, collectedItems, hitHazards, collectiblePositions, hazardPositions, play]);

  // Goal detection with Alice collectible requirement
  useEffect(() => {
    if (playerPos.x === layout.goal.x && playerPos.y === layout.goal.y) {
      // Alice: Must collect all items before completing
      if (character === 'ALICE' && collectedItems.size < collectiblePositions.length) {
        return; // Can't complete yet - need more collectibles
      }
      
      playSound('mazeComplete');
      setTimeout(() => {
        const points = explorationPoints;
        const actualTime = Date.now() - startTime + timePenalty; // Add penalty time for Robert
        const time_ms = actualTime;
        const score = points * time_ms;
        onComplete(score, points, time_ms);
      }, 300);
    }
  }, [playerPos, layout.goal, onComplete, explorationPoints, startTime, character, collectedItems, collectiblePositions.length, timePenalty]);

  const isValidMove = useCallback((x: number, y: number): boolean => {
    if (x < 0 || x >= layout.width || y < 0 || y >= layout.height) {
      return false;
    }
    return layout.grid[y][x] === 0;
  }, [layout]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }

      const now = Date.now();
      if (now - lastMoveTime < MOVE_DELAY) return;

      let newX = playerPos.x;
      let newY = playerPos.y;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          newY -= 1;
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          newY += 1;
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          newX -= 1;
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          newX += 1;
          break;
        case 'Escape':
          onBack();
          return;
        default:
          return;
      }

      if (isValidMove(newX, newY)) {
        setPlayerPos({ x: newX, y: newY });
        setVisitedCells(prev => new Set([...prev, `${newX},${newY}`]));
        setLastMoveTime(now);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playerPos, lastMoveTime, isValidMove, onBack]);

  // Fog of war for Carol: dual radius visibility
  const isVisibleForCarol = (x: number, y: number): boolean => {
    if (character !== 'CAROL') return true; // No fog for Alice/Robert
    
    const FOG_RADIUS = 6;
    
    // Check if near player
    const distToPlayer = Math.abs(x - playerPos.x) + Math.abs(y - playerPos.y); // Manhattan distance
    if (distToPlayer <= FOG_RADIUS) return true;
    
    // Check if near goal
    const distToGoal = Math.abs(x - layout.goal.x) + Math.abs(y - layout.goal.y);
    if (distToGoal <= FOG_RADIUS) return true;
    
    return false;
  };

  const getCellColor = (x: number, y: number): string => {
    const cellType = layout.grid[y][x];
    const isPlayer = playerPos.x === x && playerPos.y === y;
    const isGoal = layout.goal.x === x && layout.goal.y === y;
    const isVisited = visitedCells.has(`${x},${y}`);
    
    // Carol's fog of war
    if (!isVisibleForCarol(x, y)) {
      return '#0a0a0f'; // Complete darkness
    }

    if (isPlayer) return layout.colors.player;
    if (isGoal) return layout.colors.goal;
    if (cellType === 1) return layout.colors.wall;
    if (isVisited) return layout.colors.visited;
    return layout.colors.floor;
  };

  const getCellContent = (x: number, y: number) => {
    const isPlayer = playerPos.x === x && playerPos.y === y;
    const isGoal = layout.goal.x === x && layout.goal.y === y;
    const posKey = `${x},${y}`;
    
    // Carol: Don't show collectibles in fog
    if (!isVisibleForCarol(x, y)) return null;

    if (isPlayer) {
      return <Shield size={18} color="white" strokeWidth={2.5} />;
    }
    if (isGoal) {
      // Alice: Show if goal is locked (not all collectibles)
      const goalLocked = character === 'ALICE' && collectedItems.size < collectiblePositions.length;
      return <Star size={18} color={goalLocked ? "#64748b" : "#fbbf24"} strokeWidth={2.5} fill={goalLocked ? "none" : "#fbbf24"} />;
    }
    
    // Alice collectibles
    if (character === 'ALICE') {
      const isCollectible = collectiblePositions.some(p => p.x === x && p.y === y);
      const isCollected = collectedItems.has(posKey);
      if (isCollectible && !isCollected) {
        return <Sparkles size={16} color="#10b981" strokeWidth={2} />;
      }
    }
    
    // Robert hazards
    if (character === 'ROBERT') {
      const isHazard = hazardPositions.some(p => p.x === x && p.y === y);
      const isHit = hitHazards.has(posKey);
      if (isHazard && !isHit) {
        return <AlertTriangle size={16} color="#ef4444" strokeWidth={2} />;
      }
    }
    
    return null;
  };

  return (
    <div style={{
      background: colors.bg.primary,
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing['2xl'],
      animation: 'slideInUp 0.4s ease-out',
    }}>
      <div style={{
        maxWidth: '60rem',
        width: '100%',
        background: colors.bg.secondary,
        border: `1px solid ${colors.border.default}`,
        borderRadius: borderRadius.lg,
        padding: spacing['3xl'],
        boxShadow: `0 0 30px ${colors.glow.primary}`,
      }}>
        <div style={{ marginBottom: spacing.xl }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing.lg,
          }}>
            <div>
              <h3 style={{
                fontSize: typography.size['2xl'],
                margin: 0,
                color: colors.text.accent,
                fontFamily: typography.fontFamily.mono,
                fontWeight: typography.weight.bold,
              }}>
                {layout.title}
              </h3>
              <p style={{
                color: colors.text.secondary,
                fontSize: typography.size.sm,
                margin: `${spacing.sm} 0 0 0`,
              }}>
                {layout.description}
              </p>
              {layout.characterFlavor && (
                <p style={{
                  color: colors.text.accent,
                  fontSize: typography.size.sm,
                  margin: `${spacing.sm} 0 0 0`,
                  fontStyle: 'italic',
                }}>
                  {layout.characterFlavor}
                </p>
              )}
            </div>
            <div style={{ animation: 'slideInDown 0.4s ease-out' }}>
              <button
                onClick={() => { play("click"); onBack(); }}
                className="btn-interactive"
                style={{
                  background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                  border: 'none',
                  borderRadius: borderRadius.md,
                  padding: `${spacing.sm} ${spacing.lg}`,
                  cursor: 'pointer',
                  fontSize: typography.size.sm,
                  color: '#0a0a0f',
                  fontFamily: typography.fontFamily.mono,
                  fontWeight: typography.weight.bold,
                  boxShadow: '0 0 15px rgba(251, 191, 36, 0.3)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #fcd34d 0%, #fbbf24 100%)';
                  e.currentTarget.style.boxShadow = '0 0 25px rgba(251, 191, 36, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)';
                  e.currentTarget.style.boxShadow = '0 0 15px rgba(251, 191, 36, 0.3)';
                }}
              >
                ← Return to Hub
              </button>
            </div>
          </div>

          <div style={{
            background: `${colors.state.info}10`,
            border: `1px solid ${colors.border.active}`,
            borderRadius: borderRadius.md,
            padding: spacing.md,
            fontSize: typography.size.sm,
            color: colors.text.secondary,
            fontFamily: typography.fontFamily.mono,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>Use Arrow Keys or WASD to move</div>
            <div> Reach the ★ to complete</div>
            <div style={{ display: 'flex', gap: spacing.lg }}>
              <div style={{ color: colors.text.accent, fontWeight: typography.weight.bold }}>
                Cells: {explorationPoints}
              </div>
              <div style={{ color: colors.state.info, fontWeight: typography.weight.bold }}>
                Time: {formatTime(elapsedTime)}
              </div>
            </div>
          </div>
        </div>

        {/* Maze Grid */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: spacing.lg,
        }}>
          <div
            style={{
              display: 'inline-grid',
              gridTemplateColumns: `repeat(${layout.width}, ${CELL_SIZE}px)`,
              gap: '1px',
              background: colors.border.default,
              padding: '1px',
              borderRadius: borderRadius.md,
              boxShadow: `0 4px 12px ${colors.glow.primary}`,
            }}
          >
            {layout.grid.map((row, y) =>
              row.map((cell, x) => {
                const color = getCellColor(x, y);
                const content = getCellContent(x, y);
                const isPlayer = playerPos.x === x && playerPos.y === y;
                const isGoal = layout.goal.x === x && layout.goal.y === y;

                return (
                  <div
                    key={`${x}-${y}`}
                    style={{
                      width: `${CELL_SIZE}px`,
                      height: `${CELL_SIZE}px`,
                      background: color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: isPlayer ? `0 0 8px ${CHARACTER_SHIELD_COLORS[character]}` : 'none',
                    }}
                  >
                    {content}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Flash Effect Overlay */}
        {flashEffect.type && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: flashEffect.type === 'collect' 
                ? 'rgba(16, 185, 129, 0.3)' // Green for collectibles
                : 'rgba(239, 68, 68, 0.3)', // Red for hazards
              pointerEvents: 'none',
              animation: 'fadeIn 0.2s ease-out',
              zIndex: 1000,
            }}
          />
        )}

        {/* Progress Info */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: typography.size.sm,
          color: colors.text.secondary,
          fontFamily: typography.fontFamily.mono,
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: spacing.sm,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
            <Shield size={16} color={CHARACTER_SHIELD_COLORS[character]} strokeWidth={2} /> You •
            <Star size={16} color="#fbbf24" strokeWidth={2} fill="#fbbf24" /> Goal
          </div>
          
          {/* Character-specific indicators */}
          {character === 'ALICE' && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: spacing.xs,
              color: collectedItems.size === collectiblePositions.length ? colors.state.success : colors.text.secondary,
            }}>
              <Sparkles size={16} color="#10b981" strokeWidth={2} />
              Items: {collectedItems.size}/{collectiblePositions.length}
            </div>
          )}
          
          {character === 'ROBERT' && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: spacing.xs,
              color: hitHazards.size === 0 ? colors.state.success : colors.state.warning,
            }}>
              <AlertTriangle size={16} color="#ef4444" strokeWidth={2} />
              Hazards hit: {hitHazards.size}
              {timePenalty > 0 && ` (+${(timePenalty / 1000).toFixed(0)}s)`}
            </div>
          )}
          
          {character === 'CAROL' && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: spacing.xs,
              color: colors.text.tertiary,
              fontStyle: 'italic',
            }}>
              Limited vision • Trust your memory
            </div>
          )}
          
          <div>
            Exploration: {visitedCells.size}/{totalWalkableCells} cells ({Math.round((visitedCells.size / totalWalkableCells) * 100)}%)
          </div>
        </div>
      </div>
    </div>
  );
}