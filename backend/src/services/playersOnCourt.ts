// Players on Court Engine - infers who is on court by parsing PBP substitution events
// This is the SOURCE OF TRUTH for court status when official APIs don't provide it

import type { PlayByPlayEvent } from '../../../shared/src/types/index.js';

// Track which players are on court for each team in a game
interface CourtState {
  home: Set<string>; // player IDs on court for home team
  away: Set<string>; // player IDs on court for away team
}

// Store team mappings for a game
interface GameTeamInfo {
  homeAbbr: string;
  awayAbbr: string;
  homeId: string;
  awayId: string;
}

export class PlayersOnCourtEngine {
  private gameStates: Map<string, CourtState> = new Map();
  private teamInfo: Map<string, GameTeamInfo> = new Map();
  private playerNameToId: Map<string, Map<string, string>> = new Map();

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
  }

  // Store team mappings
  setTeamMapping(gameId: string, homeAbbr: string, awayAbbr: string): void {
    const info = this.teamInfo.get(gameId) || { homeAbbr: '', awayAbbr: '', homeId: '', awayId: '' };
    info.homeAbbr = homeAbbr;
    info.awayAbbr = awayAbbr;
    this.teamInfo.set(gameId, info);
  }

  setTeamIdMapping(gameId: string, homeId: string, awayId: string): void {
    const info = this.teamInfo.get(gameId) || { homeAbbr: '', awayAbbr: '', homeId: '', awayId: '' };
    info.homeId = homeId;
    info.awayId = awayId;
    this.teamInfo.set(gameId, info);
  }

  // Register player names for name resolution
  registerPlayers(gameId: string, players: { id: string; fullName: string; teamAbbr: string }[]): void {
    const nameMap = new Map<string, string>();
    for (const p of players) {
      nameMap.set(p.fullName.toLowerCase(), p.id);
      const lastName = p.fullName.split(' ').pop()?.toLowerCase() || '';
      if (lastName) nameMap.set(lastName, p.id);
    }
    this.playerNameToId.set(gameId, nameMap);
  }

  // Resolve player ID from name
  resolvePlayerId(gameId: string, playerName: string): string | undefined {
    const nameMap = this.playerNameToId.get(gameId);
    if (!nameMap) return undefined;
    // Try full name first, then last name
    return nameMap.get(playerName.toLowerCase()) ||
           nameMap.get(playerName.split(' ').pop()?.toLowerCase() || '');
  }

  // Process events - resets state and recalculates from scratch based on starters + events
  processEvents(gameId: string, starters: { home: string[]; away: string[] }, events: PlayByPlayEvent[]): void {
    // Reset to starters only
    this.gameStates.set(gameId, {
      home: new Set(starters.home),
      away: new Set(starters.away),
    });

    // Sort events by timestamp
    const sorted = [...events].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Process each event in order
    for (const event of sorted) {
      this.processEvent(event);
    }
  }

  private processEvent(event: PlayByPlayEvent): void {
    const state = this.gameStates.get(event.gameId);
    if (!state || !event.teamId) return;

    const teamKey = this.getTeamKey(event.gameId, event.teamId);
    if (!teamKey) return;

    if (event.eventType === 'SUB OUT') {
      let playerId = event.playerId;
      // Resolve from description if needed
      if (!playerId && event.description) {
        const match = event.description.match(/^([A-Za-z\s\.'-]+)\s+SUB\s+OUT$/);
        if (match) {
          playerId = this.resolvePlayerId(event.gameId, match[1].trim());
        }
      }
      if (playerId) state[teamKey].delete(playerId);
    } else if (event.eventType === 'SUB IN') {
      if (event.playerId) state[teamKey].add(event.playerId);
    }
  }

  private getTeamKey(gameId: string, teamIdOrAbbr: string): 'home' | 'away' | null {
    const info = this.teamInfo.get(gameId);
    if (!info) return null;

    if (teamIdOrAbbr === info.homeAbbr || teamIdOrAbbr === info.homeId) return 'home';
    if (teamIdOrAbbr === info.awayAbbr || teamIdOrAbbr === info.awayId) return 'away';

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
}

// Singleton instance
export const playersOnCourtEngine = new PlayersOnCourtEngine();