// Players on Court Engine - infers who is on court by parsing PBP substitution events
// This is the SOURCE OF TRUTH for court status when official APIs don't provide it

import type { PlayerGameStats, PlayByPlayEvent } from '../../../shared/src/types/index.js';

// Track which players are on court for each team in a game
interface CourtState {
  home: Set<string>; // player IDs on court for home team
  away: Set<string>; // player IDs on court for away team
}

export class PlayersOnCourtEngine {
  private gameStates: Map<string, CourtState> = new Map();
  private eventHistory: Map<string, PlayByPlayEvent[]> = new Map();

  // Initialize court state with starting 5 for each team
  initializeGame(
    gameId: string,
    homeStartingIds: string[],
    awayStartingIds: string[]
  ): void {
    this.gameStates.set(gameId, {
      home: new Set(homeStartingIds),
      away: new Set(awayStartingIds),
    });
    this.eventHistory.set(gameId, []);
  }

  // Process a play-by-play event and update court state
  processEvent(event: PlayByPlayEvent): void {
    const state = this.gameStates.get(event.gameId);
    if (!state) return;

    // Store event
    const history = this.eventHistory.get(event.gameId) || [];
    history.push(event);
    this.eventHistory.set(event.gameId, history);

    // Handle substitutions
    if (event.eventType === 'SUB OUT') {
      this.handleSubOut(event.gameId, event.playerId!, event.teamId!);
    } else if (event.eventType === 'SUB IN') {
      this.handleSubIn(event.gameId, event.playerId!, event.teamId!);
    }
  }

  // Process batch of events (for replay/initial load)
  processEvents(events: PlayByPlayEvent[]): void {
    // Sort by timestamp to ensure correct order
    const sorted = [...events].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    for (const event of sorted) {
      this.processEvent(event);
    }
  }

  private handleSubOut(gameId: string, playerId: string, teamId: string): void {
    const state = this.gameStates.get(gameId);
    if (!state) return;

    const teamKey = this.getTeamKey(gameId, teamId);
    if (teamKey) {
      state[teamKey].delete(playerId);
    }
  }

  private handleSubIn(gameId: string, playerId: string, teamId: string): void {
    const state = this.gameStates.get(gameId);
    if (!state) return;

    const teamKey = this.getTeamKey(gameId, teamId);
    if (teamKey) {
      state[teamKey].add(playerId);
    }
  }

  private getTeamKey(gameId: string, teamId: string): 'home' | 'away' | null {
    const state = this.gameStates.get(gameId);
    if (!state) return null;

    // We don't have team mapping here, so we track by player team
    // This method would need to be enhanced with team info
    // For now, we'll infer from which set the player was in
    return null;
  }

  // Get players currently on court
  getPlayersOnCourt(gameId: string): { home: string[]; away: string[] } | null {
    const state = this.gameStates.get(gameId);
    if (!state) return null;

    return {
      home: Array.from(state.home),
      away: Array.from(state.away),
    };
  }

  // Check if a specific player is on court
  isOnCourt(gameId: string, playerId: string): boolean {
    const state = this.gameStates.get(gameId);
    if (!state) return false;

    return state.home.has(playerId) || state.away.has(playerId);
  }

  // Get the team a player is on court for
  getPlayerTeam(gameId: string, playerId: string): 'home' | 'away' | null {
    const state = this.gameStates.get(gameId);
    if (!state) return null;

    if (state.home.has(playerId)) return 'home';
    if (state.away.has(playerId)) return 'away';
    return null;
  }

  // Replay events up to a specific time to get historical court state
  getCourtStateAtTime(gameId: string, targetTime: Date): CourtState | null {
    const history = this.eventHistory.get(gameId);
    if (!history) return null;

    // Reset and replay up to target time
    const eventsBeforeTarget = history
      .filter(e => new Date(e.timestamp) <= targetTime)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Create a temporary engine to replay
    const tempEngine = new PlayersOnCourtEngine();
    const initialState = this.gameStates.get(gameId);
    if (!initialState) return null;

    // We need to know starting lineups - would be passed in or tracked
    // For now, just replay events
    tempEngine.processEvents(eventsBeforeTarget);

    return tempEngine.gameStates.get(gameId) || null;
  }

  // Merge court info into player stats
  mergeWithPlayerStats(
    gameId: string,
    homePlayers: PlayerGameStats[],
    awayPlayers: PlayerGameStats[]
  ): { home: PlayerGameStats[]; away: PlayerGameStats[] } {
    const state = this.gameStates.get(gameId);
    if (!state) return { home: homePlayers, away: awayPlayers };

    const updateStats = (players: PlayerGameStats[], onCourt: Set<string>): PlayerGameStats[] => {
      return players.map(p => ({
        ...p,
        isOnCourt: onCourt.has(p.playerId),
      }));
    };

    return {
      home: updateStats(homePlayers, state.home),
      away: updateStats(awayPlayers, state.away),
    };
  }

  // Export event history for debugging/analysis
  getEventHistory(gameId: string): PlayByPlayEvent[] {
    return this.eventHistory.get(gameId) || [];
  }
}

// Singleton instance
export const playersOnCourtEngine = new PlayersOnCourtEngine();

// Helper to identify starting lineup from PBP (first SUB OUT = bench player)
export function inferStartingLineup(
  events: PlayByPlayEvent[],
  allPlayerIds: string[]
): { home: string[]; away: string[] } {
  const homeOnCourt = new Set<string>();
  const awayOnCourt = new Set<string>();

  // Everyone starts on court
  for (const id of allPlayerIds) {
    // Would need team mapping - simplified for now
  }

  // Process events in order
  for (const event of events) {
    if (event.eventType === 'SUB OUT' && event.playerId && event.teamId) {
      // Player came out - they were starting
      // In real impl, would track which team
    }
  }

  return { home: Array.from(homeOnCourt), away: Array.from(awayOnCourt) };
}