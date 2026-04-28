// ESPN NBA API Integration Service
// Fetches real games, scores, play-by-play, and substitution events

import type { Game, LiveState, PlayerGameStats, PlayByPlayEvent, Team, Player } from '../../shared/src/types/index.js';

const ESPN_NBA_SCOREBOARD = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard';
const ESPN_NBA_SUMMARY = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary';

// Map ESPN team abbreviations to our format
const ESPN_TEAM_MAP: Record<string, { id: string; name: string; city: string }> = {
  'LAL': { id: '1610612747', name: 'Lakers', city: 'Los Angeles' },
  'BOS': { id: '1610612738', name: 'Celtics', city: 'Boston' },
  'GSW': { id: '1610612744', name: 'Warriors', city: 'Golden State' },
  'MIA': { id: '1610612748', name: 'Heat', city: 'Miami' },
  'DEN': { id: '1610612743', name: 'Nuggets', city: 'Denver' },
  'BKN': { id: '1610612751', name: 'Nets', city: 'Brooklyn' },
  'DAL': { id: '1610612742', name: 'Mavericks', city: 'Dallas' },
  'PHX': { id: '1610612755', name: 'Suns', city: 'Phoenix' },
  'MIL': { id: '1610612749', name: 'Bucks', city: 'Milwaukee' },
  'CLE': { id: '1610612739', name: 'Cavaliers', city: 'Cleveland' },
  'ORL': { id: '1610612753', name: 'Magic', city: 'Orlando' },
  'DET': { id: '1610612765', name: 'Pistons', city: 'Detroit' },
  'OKC': { id: '1610612760', name: 'Thunder', city: 'Oklahoma City' },
  'MIN': { id: '1610612750', name: 'Timberwolves', city: 'Minnesota' },
  'LAC': { id: '1610612746', name: 'Clippers', city: 'Los Angeles' },
  'NOP': { id: '1610612740', name: 'Pelicans', city: 'New Orleans' },
  'SAC': { id: '1610612758', name: 'Kings', city: 'Sacramento' },
  'NYK': { id: '1610612752', name: 'Knicks', city: 'New York' },
  'ATL': { id: '1610612737', name: 'Hawks', city: 'Atlanta' },
  'HOU': { id: '1610612745', name: 'Rockets', city: 'Houston' },
  'IND': { id: '1610612754', name: 'Pacers', city: 'Indiana' },
  'CHI': { id: '1610612741', name: 'Bulls', city: 'Chicago' },
  'PHI': { id: '1610612755', name: '76ers', city: 'Philadelphia' },
  'TOR': { id: '1610612761', name: 'Raptors', city: 'Toronto' },
  'POR': { id: '1610612757', name: 'Trail Blazers', city: 'Portland' },
  'SAS': { id: '1610612759', name: 'Spurs', city: 'San Antonio' },
  'MEM': { id: '1610612763', name: 'Grizzlies', city: 'Memphis' },
  'CHA': { id: '1610612766', name: 'Hornets', city: 'Charlotte' },
  'WAS': { id: '1610612764', name: 'Wizards', city: 'Washington' },
  'UTA': { id: '1610612762', name: 'Jazz', city: 'Utah' },
};

interface ESPNTeam {
  id: string;
  abbreviation: string;
  displayName: string;
  location: string;
  logo: string;
}

interface ESPNCompetitor {
  id: string;
  homeAway: 'home' | 'away';
  team: ESPNTeam;
  score: string;
  linescores?: { value: number; period: number }[];
  record?: { summary: string }[];
}

interface ESPNEvent {
  id: string;
  date: string;
  name: string;
  shortName: string;
  status: {
    clock: number;
    displayClock: string;
    period: number;
    type: { id: string; state: string; description: string; detail: string };
  };
  competitions: {
    id: string;
    playByPlayAvailable: boolean;
    competitors: ESPNCompetitor[];
    situation?: {
      lastPlay?: {
        id: string;
        type: { id: string; text: string };
        text: string;
        team?: { id: string };
        athletesInvolved?: { id: string; fullName: string; jersey: string; position: string }[];
      };
    };
  }[];
}

interface ESPSNScoreboardResponse {
  events: ESPNEvent[];
  day: { date: string };
}

interface ESPSNSummaryResponse {
  boxscore?: {
    teams: {
      team: ESPNTeam;
      players: {
        athlete: {
          id: string;
          fullName: string;
          displayName: string;
          jersey: string;
          position: string;
        };
        stats?: string[];
      }[];
    }[];
  };
  plays?: {
    id: string;
    text: string;
    clock: string;
    period: number;
    type: { id: string; text: string };
    athlete?: { id: string; fullName: string; displayName: string; jersey: string; position: string };
    team?: { id: string; abbreviation: string };
    scoreValue?: number;
  }[];
  header?: {
    gameId: string;
  };
}

// Parse ESPN game to our Game format
function parseESPGameToGame(event: ESPNEvent): Game {
  const comp = event.competitions[0];
  const homeCompetitor = comp.competitors.find(c => c.homeAway === 'home')!;
  const awayCompetitor = comp.competitors.find(c => c.homeAway === 'away')!;

  const homeAbbr = homeCompetitor.team.abbreviation;
  const awayAbbr = awayCompetitor.team.abbreviation;
  const mappedHome = ESPN_TEAM_MAP[homeAbbr] || { id: homeCompetitor.id, name: homeCompetitor.team.location, city: homeCompetitor.team.location };
  const mappedAway = ESPN_TEAM_MAP[awayAbbr] || { id: awayCompetitor.id, name: awayCompetitor.team.location, city: awayCompetitor.team.location };

  const isInProgress = event.status.type.state === 'in';

  return {
    id: event.id,
    homeTeam: {
      id: mappedHome.id,
      abbreviation: homeAbbr,
      name: mappedHome.name,
      city: mappedHome.city,
    },
    awayTeam: {
      id: mappedAway.id,
      abbreviation: awayAbbr,
      name: mappedAway.name,
      city: mappedAway.city,
    },
    gameTime: event.date,
    status: isInProgress ? 'In Progress' : event.status.type.description === 'Final' ? 'Final' : 'Scheduled',
    homeScore: parseInt(homeCompetitor.score) || 0,
    awayScore: parseInt(awayCompetitor.score) || 0,
    quarter: isInProgress ? event.status.period : undefined,
    clock: isInProgress ? event.status.displayClock : undefined,
  };
}

// Fetch scoreboard from ESPN
export async function fetchESPNscoreboard(): Promise<Game[]> {
  try {
    const response = await fetch(ESPN_NBA_SCOREBOARD);
    if (!response.ok) throw new Error(`ESPN API error: ${response.status}`);

    const data: ESPSNScoreboardResponse = await response.json() as ESPSNScoreboardResponse;

    return data.events.map(parseESPGameToGame);
  } catch (error) {
    console.error('[ESPN] Failed to fetch scoreboard:', error);
    return [];
  }
}

// Fetch play-by-play and boxscore from ESPN summary
export async function fetchGameSummary(gameId: string): Promise<{ plays: PlayByPlayEvent[]; homePlayers: Player[]; awayPlayers: Player[] } | null> {
  try {
    const response = await fetch(`${ESPN_NBA_SUMMARY}?event=${gameId}`);
    if (!response.ok) throw new Error(`ESPN Summary API error: ${response.status}`);

    const data: ESPSNSummaryResponse = await response.json() as ESPSNSummaryResponse;

    const plays: PlayByPlayEvent[] = [];
    const homePlayers: Player[] = [];
    const awayPlayers: Player[] = [];

    // Parse boxscore for players
    if (data.boxscore?.teams) {
      for (const teamData of data.boxscore.teams) {
        const teamAbbr = teamData.team.abbreviation;
        const isHome = !homePlayers.length; // First team is home

        if (teamData.players) {
          for (const playerData of teamData.players) {
            if (!playerData.athlete) continue;

            const player: Player = {
              id: playerData.athlete.id,
              fullName: playerData.athlete.fullName,
              firstName: playerData.athlete.displayName.split(' ')[0] || playerData.athlete.fullName.split(' ')[0],
              lastName: playerData.athlete.fullName.split(' ').slice(1).join(' ') || playerData.athlete.fullName,
              jerseyNumber: playerData.athlete.jersey || '0',
              teamId: ESPN_TEAM_MAP[teamAbbr]?.id || teamData.team.id,
              position: playerData.athlete.position || '',
            };

            if (isHome) {
              homePlayers.push(player);
            } else {
              awayPlayers.push(player);
            }
          }
        }
      }
    }

    // Parse plays for substitution events
    if (data.plays) {
      for (const play of data.plays) {
        const text = play.text || '';

        // Detect substitution patterns
        // Pattern: "Player X enters the game for Player Y"
        const entersMatch = text.match(/^([A-Za-z\s\.]+)\s+enters\s+the\s+game\s+for\s+([A-Za-z\s\.]+)$/);

        if (entersMatch) {
          const playerIn = entersMatch[1].trim();
          const playerOut = entersMatch[2].trim();

          plays.push({
            gameId,
            eventId: parseInt(play.id) || plays.length,
            clock: play.clock || '',
            eventType: 'SUB IN',
            playerId: play.athlete?.id,
            teamId: play.team?.id,
            description: text,
            timestamp: new Date(),
          });

          // Find the athlete who left (by name matching)
          // We don't have direct ID, so we track by description
          plays.push({
            gameId,
            eventId: parseInt(play.id) || plays.length + 1,
            clock: play.clock || '',
            eventType: 'SUB OUT',
            playerId: undefined, // Would need to resolve from playerOut name
            teamId: play.team?.id,
            description: `${playerOut} SUB OUT`,
            timestamp: new Date(),
          });
        }
      }
    }

    return { plays, homePlayers, awayPlayers };
  } catch (error) {
    console.error('[ESPN] Failed to fetch game summary for', gameId, error);
    return null;
  }
}

// Fetch play-by-play for substitutions only
export async function fetchPlayByPlay(gameId: string): Promise<PlayByPlayEvent[]> {
  const summary = await fetchGameSummary(gameId);
  return summary?.plays || [];
}

// Build LiveState from ESPN data
export async function buildLiveStateFromESPN(event: ESPNEvent): Promise<LiveState | null> {
  if (event.status.type.state !== 'in') return null;

  const comp = event.competitions[0];
  const homeCompetitor = comp.competitors.find(c => c.homeAway === 'home')!;
  const awayCompetitor = comp.competitors.find(c => c.homeAway === 'away')!;

  // Get last play for possession
  const lastPlay = comp.situation?.lastPlay;

  return {
    gameId: event.id,
    homeScore: parseInt(homeCompetitor.score) || 0,
    awayScore: parseInt(awayCompetitor.score) || 0,
    quarter: event.status.period,
    clock: event.status.displayClock,
    playersOnCourt: {
      home: [],
      away: [],
    },
    lastEvent: lastPlay?.text,
    lastEventTime: new Date().toISOString(),
    possession: lastPlay?.team?.id === homeCompetitor.id ? 'home' : 'away',
  };
}

// Poll ESPN for live games
export class ESPNPoller {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private callback: (games: Game[]) => void;
  private intervalMs: number;

  constructor(callback: (games: Game[]) => void, intervalMs = 10000) {
    this.callback = callback;
    this.intervalMs = intervalMs;
  }

  start(): void {
    if (this.intervalId) return;

    // Initial fetch
    this.tick();

    // Start polling
    this.intervalId = setInterval(() => this.tick(), this.intervalMs);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async tick(): Promise<void> {
    try {
      const games = await fetchESPNscoreboard();
      this.callback(games);
    } catch (error) {
      console.error('[ESPN Poller] Error:', error);
    }
  }
}