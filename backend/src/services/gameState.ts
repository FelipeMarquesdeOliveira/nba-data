// Game state service - manages live state and broadcasts
import type { Game, LiveState, PlayerGameStats } from '../../../shared/src/types/index.js';

class GameStateService {
  private games: Map<string, Game> = new Map();
  private liveStates: Map<string, LiveState> = new Map();
  private subscribers: Set<import('@fastify/websocket').Socket> = new Set();

  constructor() {
    // Empty - games populated by ESPN poller or API
  }

  // Subscribe to updates
  subscribe(socket: import('@fastify/websocket').Socket): void {
    this.subscribers.add(socket);
    socket.on('close', () => this.subscribers.delete(socket));
  }

  // Broadcast to all subscribers
  broadcast(data: unknown): void {
    const message = JSON.stringify(data);
    for (const socket of this.subscribers) {
      if (socket.readyState === 1) { // OPEN
        socket.send(message);
      }
    }
  }

  // Get all games
  getGames(): Game[] {
    return Array.from(this.games.values());
  }

  // Get games by date window (D-1, D0, D+1)
  getGamesByWindow(): { past: Game[]; today: Game[]; future: Game[] } {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const games = this.getGames();
    return {
      past: games.filter(g => g.gameTime < todayStart),
      today: games.filter(g => g.gameTime >= todayStart && g.gameTime < todayEnd),
      future: games.filter(g => g.gameTime >= todayEnd),
    };
  }

  // Get live state for a game
  getLiveState(gameId: string): LiveState | undefined {
    return this.liveStates.get(gameId);
  }

  // Update live state
  updateLiveState(gameId: string, state: Partial<LiveState>): void {
    const current = this.liveStates.get(gameId);
    if (current) {
      const updated = { ...current, ...state };
      this.liveStates.set(gameId, updated);
      this.broadcast({ type: 'LIVE_UPDATE', payload: updated });
    }
  }

  // Update game (score, quarter, clock)
  updateGameScore(gameId: string, homeScore: number, awayScore: number, quarter?: number, clock?: string): void {
    const game = this.games.get(gameId);
    if (game) {
      game.homeScore = homeScore;
      game.awayScore = awayScore;
      if (quarter) game.quarter = quarter;
      if (clock) game.clock = clock;
      this.games.set(gameId, game);
    }

    // Also update live state
    const live = this.liveStates.get(gameId);
    if (live) {
      live.homeScore = homeScore;
      live.awayScore = awayScore;
      if (quarter) live.quarter = quarter;
      if (clock) live.clock = clock;
    }

    this.broadcast({
      type: 'SCORE_UPDATE',
      payload: { gameId, homeScore, awayScore, quarter, clock },
    });
  }

  // Update player stats
  updatePlayerStats(gameId: string, team: 'home' | 'away', playerId: string, stats: Partial<PlayerGameStats>): void {
    const live = this.liveStates.get(gameId);
    if (!live) return;

    const players = team === 'home' ? live.playersOnCourt.home : live.playersOnCourt.away;
    const idx = players.findIndex(p => p.playerId === playerId);
    if (idx >= 0) {
      players[idx] = { ...players[idx], ...stats };
      this.broadcast({ type: 'PLAYER_UPDATE', payload: { gameId, team, playerId, stats } });
    }
  }

  // Add PBP event
  addPlayByPlayEvent(event: { gameId: string; description: string; playerId?: string; teamId?: string }): void {
    const live = this.liveStates.get(event.gameId);
    if (live) {
      live.lastEvent = event.description;
      live.lastEventTime = new Date();
      if (event.teamId) {
        live.possession = event.teamId === this.games.get(event.gameId)?.homeTeam.id ? 'home' : 'away';
      }
      this.broadcast({ type: 'PBP_EVENT', payload: event });
    }
  }

  // Get bench players for a game (not on court)
  getBenchPlayers(_gameId: string): PlayerGameStats[] {
    return [];
  }
}

// Singleton
export const gameStateService = new GameStateService();