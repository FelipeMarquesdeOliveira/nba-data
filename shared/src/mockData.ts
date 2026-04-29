import type { Game, Team, Player, PlayerGameStats, PlayByPlayEvent, LiveState } from './types/index.js';

// Teams
export const LAL: Team = {
  id: '1610612747',
  abbreviation: 'LAL',
  name: 'Lakers',
  city: 'Los Angeles',
};

export const BOS: Team = {
  id: '1610612738',
  abbreviation: 'BOS',
  name: 'Celtics',
  city: 'Boston',
};

// Players - Lakers
export const lakersPlayers: Player[] = [
  { id: '2544', fullName: 'LeBron James', firstName: 'LeBron', lastName: 'James', jerseyNumber: '23', teamId: '1610612747', position: 'F' },
  { id: '1629029', fullName: 'Austin Reaves', firstName: 'Austin', lastName: 'Reaves', jerseyNumber: '15', teamId: '1610612747', position: 'G' },
  { id: '203999', fullName: 'Anthony Davis', firstName: 'Anthony', lastName: 'Davis', jerseyNumber: '3', teamId: '1610612747', position: 'F' },
  { id: '1627813', fullName: 'D\'Angelo Russell', firstName: 'D\'Angelo', lastName: 'Russell', jerseyNumber: '1', teamId: '1610612747', position: 'G' },
  { id: '203496', fullName: 'Rui Hachimura', firstName: 'Rui', lastName: 'Hachimura', jerseyNumber: '28', teamId: '1610612747', position: 'F' },
  { id: '1626150', fullName: 'Gabe Vincent', firstName: 'Gabe', lastName: 'Vincent', jerseyNumber: '7', teamId: '1610612747', position: 'G' },
  { id: '203112', fullName: 'Taurean Prince', firstName: 'Taurean', lastName: 'Prince', jerseyNumber: '12', teamId: '1610612747', position: 'F' },
  { id: '2738', fullName: 'Jarred Vanderbilt', firstName: 'Jarred', lastName: 'Vanderbilt', jerseyNumber: '8', teamId: '1610612747', position: 'F' },
  { id: '1628968', fullName: 'Max Christie', firstName: 'Max', lastName: 'Christie', jerseyNumber: '10', teamId: '1610612747', position: 'G' },
  { id: '204030', fullName: 'Colin Castleton', firstName: 'Colin', lastName: 'Castleton', jerseyNumber: '31', teamId: '1610612747', position: 'C' },
];

// Players - Celtics
export const celticsPlayers: Player[] = [
  { id: '1628369', fullName: 'Jayson Tatum', firstName: 'Jayson', lastName: 'Tatum', jerseyNumber: '0', teamId: '1610612738', position: 'F' },
  { id: '1629573', fullName: 'Jaylen Brown', firstName: 'Jaylen', lastName: 'Brown', jerseyNumber: '7', teamId: '1610612738', position: 'G' },
  { id: '1627741', fullName: 'Kristaps Porzingis', firstName: 'Kristaps', lastName: 'Porzingis', jerseyNumber: '8', teamId: '1610612738', position: 'C' },
  { id: '1627854', fullName: 'Derrick White', firstName: 'Derrick', lastName: 'White', jerseyNumber: '9', teamId: '1610612738', position: 'G' },
  { id: '203481', fullName: 'Jrue Holiday', firstName: 'Jrue', lastName: 'Holiday', jerseyNumber: '4', teamId: '1610612738', position: 'G' },
  { id: '1628401', fullName: 'Al Horford', firstName: 'Al', lastName: 'Horford', jerseyNumber: '42', teamId: '1610612738', position: 'C' },
  { id: '1628436', fullName: 'Robert Williams III', firstName: 'Robert', lastName: 'Williams', jerseyNumber: '44', teamId: '1610612738', position: 'C' },
  { id: '204025', fullName: 'Peyton Watson', firstName: 'Peyton', lastName: 'Watson', jerseyNumber: '54', teamId: '1610612738', position: 'G' },
  { id: '1628439', fullName: 'Sam Hauser', firstName: 'Sam', lastName: 'Hauser', jerseyNumber: '30', teamId: '1610612738', position: 'F' },
  { id: '1629719', fullName: 'Dalano Banton', firstName: 'Dalano', lastName: 'Banton', jerseyNumber: '45', teamId: '1610612738', position: 'G' },
];

export const allPlayers = [...lakersPlayers, ...celticsPlayers];

// Mock Game in progress
export const mockGame: Game = {
  id: '0022300123',
  homeTeam: BOS,
  awayTeam: LAL,
  gameTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // started 2h ago
  status: 'In Progress',
  homeScore: 87,
  awayScore: 82,
  quarter: 3,
  clock: '5:42',
};

// Mock Live State
export const mockLiveState: LiveState = {
  gameId: '0022300123',
  homeScore: 87,
  awayScore: 82,
  quarter: 3,
  clock: '5:42',
  playersOnCourt: {
    home: [
      { gameId: '0022300123', playerId: '1628369', player: celticsPlayers[0], points: 28, minutes: 32, seconds: 18, isOnCourt: true, rebounds: 7, assists: 4, lineValue: 29.5, lineProvider: 'Parimatch' },
      { gameId: '0022300123', playerId: '1629573', player: celticsPlayers[1], points: 22, minutes: 31, seconds: 45, isOnCourt: true, rebounds: 5, assists: 3, lineValue: 26.5, lineProvider: 'Parimatch' },
      { gameId: '0022300123', playerId: '1627741', player: celticsPlayers[2], points: 14, minutes: 28, seconds: 12, isOnCourt: true, rebounds: 8, assists: 1, lineValue: 22.5, lineProvider: 'Parimatch' },
      { gameId: '0022300123', playerId: '1627854', player: celticsPlayers[3], points: 8, minutes: 30, seconds: 55, isOnCourt: true, rebounds: 3, assists: 6, lineValue: 14.5, lineProvider: 'Parimatch' },
      { gameId: '0022300123', playerId: '203481', player: celticsPlayers[4], points: 11, minutes: 29, seconds: 33, isOnCourt: true, rebounds: 2, assists: 5, lineValue: 13.5, lineProvider: 'Parimatch' },
    ],
    away: [
      { gameId: '0022300123', playerId: '2544', player: lakersPlayers[0], points: 24, minutes: 33, seconds: 10, isOnCourt: true, rebounds: 6, assists: 8, lineValue: 26.5, lineProvider: 'Parimatch' },
      { gameId: '0022300123', playerId: '203999', player: lakersPlayers[2], points: 31, minutes: 32, seconds: 45, isOnCourt: true, rebounds: 12, assists: 2, lineValue: 32.5, lineProvider: 'Parimatch' },
      { gameId: '0022300123', playerId: '1629029', player: lakersPlayers[1], points: 12, minutes: 28, seconds: 22, isOnCourt: true, rebounds: 2, assists: 5, lineValue: 14.5, lineProvider: 'Parimatch' },
      { gameId: '0022300123', playerId: '1627813', player: lakersPlayers[3], points: 9, minutes: 26, seconds: 18, isOnCourt: true, rebounds: 1, assists: 7, lineValue: 16.5, lineProvider: 'Parimatch' },
      { gameId: '0022300123', playerId: '203496', player: lakersPlayers[4], points: 6, minutes: 24, seconds: 55, isOnCourt: true, rebounds: 3, assists: 1, lineValue: 12.5, lineProvider: 'Parimatch' },
    ],
  },
  players: {
    home: celticsPlayers,
    away: lakersPlayers,
  },
  lastEvent: 'Jayson Tatum 3pt Shot (28 pts)',
  lastEventTime: new Date(),
  possession: 'home',
};

// Mock bench players (not on court)
export const mockBenchPlayers: PlayerGameStats[] = [
  // Lakers bench
  { gameId: '0022300123', playerId: '1626150', player: lakersPlayers[5], points: 3, minutes: 12, seconds: 30, isOnCourt: false, lineValue: 8.5, lineProvider: 'Parimatch' },
  { gameId: '0022300123', playerId: '203112', player: lakersPlayers[6], points: 5, minutes: 18, seconds: 45, isOnCourt: false, lineValue: 9.5, lineProvider: 'Parimatch' },
  { gameId: '0022300123', playerId: '2738', player: lakersPlayers[7], points: 2, minutes: 10, seconds: 15, isOnCourt: false, lineValue: 6.5, lineProvider: 'Parimatch' },
  { gameId: '0022300123', playerId: '1628968', player: lakersPlayers[8], points: 0, minutes: 5, seconds: 0, isOnCourt: false, lineValue: 5.5, lineProvider: 'Parimatch' },
  // Celtics bench
  { gameId: '0022300123', playerId: '1628401', player: celticsPlayers[5], points: 8, minutes: 20, seconds: 30, isOnCourt: false, lineValue: 11.5, lineProvider: 'Parimatch' },
  { gameId: '0022300123', playerId: '1628436', player: celticsPlayers[6], points: 4, minutes: 15, seconds: 20, isOnCourt: false, lineValue: 8.5, lineProvider: 'Parimatch' },
];

// Sample Play-by-Play events for SUB IN/SUB OUT parsing
export const mockPlayByPlay: PlayByPlayEvent[] = [
  { gameId: '0022300123', eventId: 1, clock: '12:00', eventType: 'SUB OUT', playerId: '2738', teamId: '1610612747', description: 'Jarred Vanderbilt SUB OUT', timestamp: new Date(Date.now() - 90 * 60 * 1000) },
  { gameId: '0022300123', eventId: 2, clock: '12:00', eventType: 'SUB IN', playerId: '203496', teamId: '1610612747', description: 'Rui Hachimura SUB IN', timestamp: new Date(Date.now() - 90 * 60 * 1000) },
  { gameId: '0022300123', eventId: 3, clock: '6:45', eventType: 'SUB OUT', playerId: '1626150', teamId: '1610612747', description: 'Gabe Vincent SUB OUT', timestamp: new Date(Date.now() - 45 * 60 * 1000) },
  { gameId: '0022300123', eventId: 4, clock: '6:45', eventType: 'SUB IN', playerId: '2544', teamId: '1610612747', description: 'LeBron James SUB IN', timestamp: new Date(Date.now() - 45 * 60 * 1000) },
  { gameId: '0022300123', eventId: 5, clock: '5:42', eventType: 'SCORE', playerId: '1628369', teamId: '1610612738', description: 'Jayson Tatum 3pt Shot (28 pts)', timestamp: new Date() },
];

// Games in different states for UI testing
const GSW: Team = { id: '1610612744', abbreviation: 'GSW', name: 'Warriors', city: 'Golden State' };

export const mockGamesList: Game[] = [
  mockGame, // LIVE
  { ...mockGame, id: '0022300124', homeTeam: LAL, awayTeam: BOS, gameTime: new Date(Date.now() + 30 * 60 * 1000), status: 'Scheduled', homeScore: 0, awayScore: 0, quarter: undefined, clock: undefined }, // SOON (30 min)
  { ...mockGame, id: '0022300125', homeTeam: LAL, awayTeam: GSW, gameTime: new Date(Date.now() + 5 * 60 * 60 * 1000), status: 'Scheduled', homeScore: 0, awayScore: 0, quarter: undefined, clock: undefined }, // FUTURE
  { ...mockGame, id: '0022300126', homeTeam: BOS, awayTeam: LAL, gameTime: new Date(Date.now() - 24 * 60 * 60 * 1000), status: 'Final', homeScore: 112, awayScore: 108, quarter: 4, clock: '0:00' }, // FINISHED
];

export default {
  teams: { LAL, BOS },
  players: { lakers: lakersPlayers, celtics: celticsPlayers, all: allPlayers },
  game: mockGame,
  liveState: mockLiveState,
  benchPlayers: mockBenchPlayers,
  playByPlay: mockPlayByPlay,
  gamesList: mockGamesList,
};