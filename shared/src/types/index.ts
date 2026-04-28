// Core Entities - fonte da verdade para todo o sistema

export type GameStatus = 'In Progress' | 'Final' | 'Scheduled';

export type CourtStatus = 'LIVE' | 'SOON' | 'FUTURE' | 'FINISHED';

export type PropLineStatus = 'GREEN' | 'YELLOW' | 'RED';

export interface Team {
  id: string;
  abbreviation: string; // LAL, BOS, GSW
  name: string;
  city: string;
  logo?: string; // URL to team logo
}

export interface Player {
  id: string; // NBA official player ID - fonte da verdade
  fullName: string;
  firstName: string;
  lastName: string;
  jerseyNumber: string;
  teamId: string;
  position: string;
}

export interface Game {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  gameTime: Date; // UTC
  status: GameStatus;
  homeScore: number;
  awayScore: number;
  quarter?: number;
  clock?: string;
}

export interface PlayerGameStats {
  gameId: string;
  playerId: string;
  player: Player;
  points: number;
  minutes: number; // current minutes played
  seconds: number; // seconds in current minute
  isOnCourt: boolean; // inferred from PBP parsing
  rebounds?: number;
  assists?: number;
  // line comparison
  lineValue?: number;
  lineProvider?: string;
}

export interface PlayerLine {
  playerId: string;
  gameId: string;
  lineValue: number; // e.g., 25.5
  provider: string; // Parimatch, etc.
  timestamp: Date;
  isAvailable: boolean;
}

export interface LiveState {
  gameId: string;
  homeScore: number;
  awayScore: number;
  quarter: number;
  clock: string;
  playersOnCourt: {
    home: PlayerGameStats[];
    away: PlayerGameStats[];
  };
  lastEvent?: string;
  lastEventTime?: Date;
  possession?: 'home' | 'away';
}

// Play-by-Play events for SUB IN/SUB OUT parsing
export interface PlayByPlayEvent {
  gameId: string;
  eventId: number;
  clock: string;
  eventType: string; // 'SUB IN', 'SUB OUT', 'SCORE', etc.
  playerId?: string;
  teamId?: string;
  description: string;
  timestamp: Date;
}

// Match Status (derived from game_time - now)
export function getCourtStatus(game: Game): CourtStatus {
  const now = new Date();
  const gameTime = new Date(game.gameTime);
  const diffMs = gameTime.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (game.status === 'In Progress') return 'LIVE';
  if (game.status === 'Final') return 'FINISHED';
  if (diffHours <= 2) return 'SOON';
  return 'FUTURE';
}

// Prop line color logic: >= 3 points to beat line = GREEN, >3 and <=5 = YELLOW, >5 = RED
export function getPropLineStatus(currentPoints: number, lineValue: number): PropLineStatus {
  const diff = lineValue - currentPoints;

  if (diff <= 3) return 'GREEN'; // can beat or already beat
  if (diff <= 5) return 'YELLOW'; // attention needed
  return 'RED'; // far from beating
}

export function getPointsToBeatLine(currentPoints: number, lineValue: number): number {
  return Math.max(0, lineValue - currentPoints);
}