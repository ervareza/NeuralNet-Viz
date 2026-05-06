// Simulation Scenarios for organic, story-driven data flow
// Each scenario defines target values for all 9 inputs and runs for ~8s before transitioning

export interface Scenario {
  name: string;
  icon: string;
  color: string;
  description: string;
  // Target values for each of the 9 inputs (0-1 range)
  // Order: Hunger, FoodDist, SmellFox, FoxDist, Thirst, BuddyDist, WaterDist, Health, DayTime
  targets: number[];
  // Expected dominant output for validation
  expectedOutput: string;
}

export const SCENARIOS: Scenario[] = [
  {
    name: 'HUNTING',
    icon: 'crosshair',
    color: '#f97316',
    description: 'Hungry creature searching for food',
    targets: [0.95, 0.3, 0.05, 0.9, 0.2, 0.6, 0.7, 0.8, 0.7],
    expectedOutput: 'Go Towards Food',
  },
  {
    name: 'FEEDING',
    icon: 'utensils',
    color: '#22c55e',
    description: 'Food found — eating now',
    targets: [0.8, 0.05, 0.0, 0.95, 0.3, 0.5, 0.6, 0.85, 0.6],
    expectedOutput: 'Eat',
  },
  {
    name: 'DANGER',
    icon: 'alert-triangle',
    color: '#ef4444',
    description: 'Fox detected nearby — fight or flight',
    targets: [0.3, 0.7, 0.95, 0.1, 0.2, 0.8, 0.5, 0.6, 0.5],
    expectedOutput: 'Flee',
  },
  {
    name: 'HIDING',
    icon: 'eye-off',
    color: '#a855f7',
    description: 'Taking cover from predator',
    targets: [0.4, 0.8, 0.7, 0.25, 0.3, 0.9, 0.6, 0.5, 0.3],
    expectedOutput: 'Hide',
  },
  {
    name: 'THIRSTY',
    icon: 'droplets',
    color: '#38bdf8',
    description: 'Seeking water source',
    targets: [0.2, 0.7, 0.0, 0.95, 0.95, 0.5, 0.3, 0.7, 0.8],
    expectedOutput: 'Go Towards Water',
  },
  {
    name: 'RESTING',
    icon: 'moon',
    color: '#6366f1',
    description: 'Night time — going to sleep',
    targets: [0.15, 0.8, 0.0, 0.95, 0.1, 0.4, 0.8, 0.9, 0.05],
    expectedOutput: 'Sleep',
  },
  {
    name: 'SOCIAL',
    icon: 'heart',
    color: '#ec4899',
    description: 'Buddy nearby — socializing',
    targets: [0.2, 0.6, 0.0, 0.9, 0.15, 0.05, 0.7, 0.95, 0.6],
    expectedOutput: 'Sex',
  },
  {
    name: 'ROAMING',
    icon: 'compass',
    color: '#14b8a6',
    description: 'Exploring the environment',
    targets: [0.3, 0.5, 0.0, 0.85, 0.3, 0.7, 0.5, 0.85, 0.7],
    expectedOutput: 'Roaming',
  },
];

// Smooth interpolation between current values and target values
export function interpolateToTarget(
  current: number,
  target: number,
  speed: number, // 0-1, how fast to converge
  noise: number  // 0-1, random fluctuation
): number {
  // Exponential smoothing toward target
  const smoothed = current + (target - current) * speed;
  // Add subtle noise for organic feel
  const jitter = (Math.random() - 0.5) * noise;
  return Math.max(0, Math.min(1, smoothed + jitter));
}

// Get the current scenario index based on elapsed time
export function getScenarioIndex(elapsed: number, durationPerScenario: number = 8): number {
  return Math.floor(elapsed / durationPerScenario) % SCENARIOS.length;
}

// Get interpolation progress within current scenario (0-1)
export function getScenarioProgress(elapsed: number, durationPerScenario: number = 8): number {
  return (elapsed % durationPerScenario) / durationPerScenario;
}
