// Mock data for initial state (development)
import type { Game, LiveState, PlayerGameStats } from '@/types';
import { lakersPlayers, celticsPlayers } from './mockPlayers';

const LAL = { id: '1610612747', abbreviation: 'LAL', name: 'Lakers', city: 'Los Angeles' };
const BOS = { id: '1610612738', abbreviation: 'BOS', name: 'Celtics', city: 'Boston' };

export const mockGame: Game = {
  id: '0022300123',
  homeTeam: BOS,
  awayTeam: LAL,
  gameTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  status: 'In Progress',
  homeScore: 87,
  awayScore: 82,
  quarter: 3,
  clock: '5:42',
};

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
  lastEvent: 'Jayson Tatum 3pt Shot (28 pts)',
  lastEventTime: new Date().toISOString(),
  possession: 'home',
};

export const mockBenchPlayers: PlayerGameStats[] = [
  { gameId: '0022300123', playerId: '1626150', player: lakersPlayers[5], points: 3, minutes: 12, seconds: 30, isOnCourt: false, lineValue: 8.5, lineProvider: 'Parimatch' },
  { gameId: '0022300123', playerId: '203112', player: lakersPlayers[6], points: 5, minutes: 18, seconds: 45, isOnCourt: false, lineValue: 9.5, lineProvider: 'Parimatch' },
  { gameId: '0022300123', playerId: '2738', player: lakersPlayers[7], points: 2, minutes: 10, seconds: 15, isOnCourt: false, lineValue: 6.5, lineProvider: 'Parimatch' },
  { gameId: '0022300123', playerId: '1628968', player: lakersPlayers[8], points: 0, minutes: 5, seconds: 0, isOnCourt: false, lineValue: 5.5, lineProvider: 'Parimatch' },
  { gameId: '0022300123', playerId: '1628401', player: celticsPlayers[5], points: 8, minutes: 20, seconds: 30, isOnCourt: false, lineValue: 11.5, lineProvider: 'Parimatch' },
  { gameId: '0022300123', playerId: '1628436', player: celticsPlayers[6], points: 4, minutes: 15, seconds: 20, isOnCourt: false, lineValue: 8.5, lineProvider: 'Parimatch' },
];

const GSW = { id: '1610612744', abbreviation: 'GSW', name: 'Warriors', city: 'Golden State' };

export const mockGamesList: Game[] = [
  mockGame, // LIVE
  { ...mockGame, id: '0022300124', homeTeam: LAL, awayTeam: BOS, gameTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(), status: 'Scheduled', homeScore: 0, awayScore: 0, quarter: undefined, clock: undefined },
  { ...mockGame, id: '0022300125', homeTeam: LAL, awayTeam: GSW, gameTime: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(), status: 'Scheduled', homeScore: 0, awayScore: 0, quarter: undefined, clock: undefined },
  { ...mockGame, id: '0022300126', homeTeam: BOS, awayTeam: LAL, gameTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), status: 'Final', homeScore: 112, awayScore: 108, quarter: 4, clock: '0:00' },
];

export default {
  mockGame,
  mockLiveState,
  mockBenchPlayers,
  mockGamesList,
};