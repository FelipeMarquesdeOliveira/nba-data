// Types shared between frontend and backend
export type GameStatus = 'In Progress' | 'Final' | 'Scheduled';
export type CourtStatus = 'LIVE' | 'SOON' | 'FUTURE' | 'FINISHED';
export type PropLineStatus = 'GREEN' | 'YELLOW' | 'RED';

export interface Team {
  id: string;
  abbreviation: string;
  name: string;
  city: string;
}

export interface Player {
  id: string;
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
  gameTime: string;
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
  minutes: number;
  seconds: number;
  isOnCourt: boolean;
  rebounds?: number;
  assists?: number;
  lineValue?: number;
  lineProvider?: string;
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
  lastEventTime?: string;
  possession?: 'home' | 'away';
}

// Status functions
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

export function getPropLineStatus(currentPoints: number, lineValue: number): PropLineStatus {
  const diff = lineValue - currentPoints;
  if (diff <= 3) return 'GREEN';
  if (diff <= 5) return 'YELLOW';
  return 'RED';
}

export function getPointsToBeatLine(currentPoints: number, lineValue: number): number {
  return Math.max(0, lineValue - currentPoints);
}

export function formatGameTime(gameTime: string): string {
  return new Date(gameTime).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
}