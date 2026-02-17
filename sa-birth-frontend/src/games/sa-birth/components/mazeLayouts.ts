import type { Sense } from '../SaBirthGame';

interface MazeLayout {
  title: string;
  description: string;
  width: number;
  height: number;
  grid: number[][]; // 0 = walkable, 1 = wall
  start: { x: number; y: number };
  goal: { x: number; y: number };
  colors: {
    floor: string;
    wall: string;
    visited: string;
    player: string;
    goal: string;
  };
}

// Helper function to create a maze grid
// 0 = walkable path, 1 = wall
const createGrid = (pattern: string[]): number[][] => {
  return pattern.map(row => 
    row.split('').map(char => char === '#' ? 1 : 0)
  );
};

export const mazeLayouts: Record<Sense, MazeLayout> = {
  hearing: {
    title: 'HEARING Calibration',
    description: 'Navigate by listening to the echoes. Sound waves reveal the path.',
    width: 11,
    height: 9,
    grid: createGrid([
      '###########',
      '#.........#',
      '#.###.###.#',
      '#.#.....#.#',
      '#.#.###.#.#',
      '#.#.#...#.#',
      '#.#.#.###.#',
      '#.........#',
      '###########',
    ]),
    start: { x: 1, y: 1 },
    goal: { x: 9, y: 7 },
    colors: {
      floor: '#1e1e2e',
      wall: '#45475a',
      visited: 'rgba(139, 92, 246, 0.2)',
      player: '#8b5cf6',
      goal: '#f9e2af',
    },
  },

  smell: {
    title: 'SMELL Calibration',
    description: 'Follow the chemical gradients. The scent grows stronger near the goal.',
    width: 13,
    height: 9,
    grid: createGrid([
      '#############',
      '#...#.......#',
      '#.#.#.#####.#',
      '#.#...#...#.#',
      '#.#####.#.#.#',
      '#.......#.#.#',
      '#.#######.#.#',
      '#.........#.#',
      '#############',
    ]),
    start: { x: 1, y: 1 },
    goal: { x: 11, y: 7 },
    colors: {
      floor: '#1e1e2e',
      wall: '#585b70',
      visited: 'rgba(249, 115, 22, 0.2)',
      player: '#f97316',
      goal: '#f9e2af',
    },
  },

  taste: {
    title: 'TASTE Calibration',
    description: 'Distinguish molecular structures. Sweet, sour, bitter, umami—learn them all.',
    width: 11,
    height: 11,
    grid: createGrid([
      '###########',
      '#.........#',
      '#.#######.#',
      '#.#.....#.#',
      '#.#.###.#.#',
      '#...#.#...#',
      '#.###.###.#',
      '#.#.....#.#',
      '#.#.###.#.#',
      '#.......#.#',
      '###########',
    ]),
    start: { x: 1, y: 1 },
    goal: { x: 9, y: 9 },
    colors: {
      floor: '#1e1e2e',
      wall: '#6c7086',
      visited: 'rgba(236, 72, 153, 0.2)',
      player: '#ec4899',
      goal: '#f9e2af',
    },
  },

  touch: {
    title: 'TOUCH Calibration',
    description: 'Feel pressure, temperature, texture. Your synthetic skin comes alive.',
    width: 13,
    height: 11,
    grid: createGrid([
      '#############',
      '#.....#.....#',
      '#.###.#.###.#',
      '#.#.#...#.#.#',
      '#.#.#####.#.#',
      '#.#.......#.#',
      '#.#########.#',
      '#.#.......#.#',
      '#.#.#####.#.#',
      '#...#.......#',
      '#############',
    ]),
    start: { x: 1, y: 1 },
    goal: { x: 11, y: 9 },
    colors: {
      floor: '#1e1e2e',
      wall: '#7f849c',
      visited: 'rgba(34, 197, 94, 0.2)',
      player: '#22c55e',
      goal: '#f9e2af',
    },
  },

  sight: {
    title: 'SIGHT Calibration',
    description: 'Process wavelengths. Light, shadow, color, depth—all must integrate.',
    width: 15,
    height: 11,
    grid: createGrid([
      '###############',
      '#.............#',
      '#.###.#.###.#.#',
      '#.#...#...#.#.#',
      '#.#.#####.#.#.#',
      '#.#.......#.#.#',
      '#.#.#######.#.#',
      '#.#.#.......#.#',
      '#.#.#.#######.#',
      '#.....#.......#',
      '###############',
    ]),
    start: { x: 1, y: 1 },
    goal: { x: 13, y: 9 },
    colors: {
      floor: '#1e1e2e',
      wall: '#9399b2',
      visited: 'rgba(59, 130, 246, 0.2)',
      player: '#3b82f6',
      goal: '#f9e2af',
    },
  },

  proprioception: {
    title: 'PROPRIOCEPTION Calibration',
    description: 'Know where your body is in space. Integration of all sensory data.',
    width: 15,
    height: 13,
    grid: createGrid([
      '###############',
      '#.............#',
      '#.###########.#',
      '#.#.........#.#',
      '#.#.#######.#.#',
      '#.#.#.....#.#.#',
      '#.#.#.###.#.#.#',
      '#.#.#.#.#.#.#.#',
      '#.#.#.#.#.#.#.#',
      '#.#...#...#...#',
      '#.#########.###',
      '#...........#.#',
      '###############',
    ]),
    start: { x: 1, y: 1 },
    goal: { x: 13, y: 11 },
    colors: {
      floor: '#1e1e2e',
      wall: '#a6adc8',
      visited: 'rgba(168, 85, 247, 0.2)',
      player: '#a855f7',
      goal: '#f9e2af',
    },
  },
};

// Export for use in other components
export type { MazeLayout };