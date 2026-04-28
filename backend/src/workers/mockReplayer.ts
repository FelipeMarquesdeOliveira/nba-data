// Mock Replayer - simulates a live NBA game for development
// replays a past game by updating scores and PBP events every N seconds

import type { GameStateService } from '../services/gameState.js';

interface ScoreUpdate {
  homeScore: number;
  awayScore: number;
  minute: number;
  description: string;
  playerId?: string;
}

// Simulated scoring sequence (would come from real PBP in production)
const scoringSequence: ScoreUpdate[] = [
  { homeScore: 89, awayScore: 82, minute: 1, description: 'Jayson Tatum 3pt Shot (31 pts)', playerId: '1628369' },
  { homeScore: 89, awayScore: 84, minute: 2, description: 'Anthony Davis Driving Dunk (33 pts)', playerId: '203999' },
  { homeScore: 91, awayScore: 84, minute: 3, description: 'Jayson Tatum Free Throw (32 pts)', playerId: '1628369' },
  { homeScore: 91, awayScore: 86, minute: 4, description: 'Austin Reaves 3pt Shot (15 pts)', playerId: '1629029' },
  { homeScore: 93, awayScore: 86, minute: 5, description: 'Jaylen Brown Jump Shot (24 pts)', playerId: '1629573' },
  { homeScore: 93, awayScore: 89, minute: 6, description: 'LeBron James 3pt Shot (27 pts)', playerId: '2544' },
  { homeScore: 95, awayScore: 89, minute: 7, description: 'Kristaps Porzingis Dunk (16 pts)', playerId: '1627741' },
  { homeScore: 95, awayScore: 91, minute: 8, description: 'D\'Angelo Russell Jump Shot (11 pts)', playerId: '1627813' },
  { homeScore: 97, awayScore: 91, minute: 9, description: 'Jrue Holiday 3pt Shot (14 pts)', playerId: '203481' },
  { homeScore: 97, awayScore: 93, minute: 10, description: 'Anthony Davis Layup (35 pts)', playerId: '203999' },
  // ... continues
];

export class MockReplayer {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private currentStep = 0;
  private gameId: string;
  private updateIntervalMs: number;
  private gameStateService: GameStateService;

  constructor(gameStateService: GameStateService, gameId: string = '0022300123', updateIntervalMs: number = 5000) {
    this.gameStateService = gameStateService;
    this.gameId = gameId;
    this.updateIntervalMs = updateIntervalMs;
  }

  start(): void {
    if (this.intervalId) return;

    this.intervalId = setInterval(() => {
      this.tick();
    }, this.updateIntervalMs);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private tick(): void {
    if (this.currentStep >= scoringSequence.length) {
      // Loop back for continuous demo
      this.currentStep = 0;
    }

    const update = scoringSequence[this.currentStep];
    const clock = `5:${String(42 - (this.currentStep % 12) * 5).padStart(2, '0')}`;
    const quarter = 3 + Math.floor(this.currentStep / 12);

    // Update game state
    this.gameStateService.updateGameScore(
      this.gameId,
      update.homeScore,
      update.awayScore,
      Math.min(quarter, 4),
      clock
    );

    // Add PBP event
    this.gameStateService.addPlayByPlayEvent({
      gameId: this.gameId,
      description: update.description,
      playerId: update.playerId,
    });

    // Update player points
    if (update.playerId) {
      const team = update.homeScore > 87 ? 'home' : 'away'; // simplified
      const pointsGained = update.homeScore > this.getLastHomeScore() ? 2 : 2; // simplified
      // In real impl, would parse actual points from description
      this.gameStateService.updatePlayerStats(this.gameId, team, update.playerId, {
        points: this.estimatePlayerPoints(update),
      });
    }

    this.currentStep++;
  }

  private getLastHomeScore(): number {
    return scoringSequence[this.currentStep - 1]?.homeScore ?? 87;
  }

  private estimatePlayerPoints(update: ScoreUpdate): number {
    // Simplified - in real impl would parse from description
    const desc = update.description.toLowerCase();
    if (desc.includes('3pt')) return 3;
    if (desc.includes('free throw')) return 1;
    return 2;
  }
}