// Main server entry point - Fastify + WebSocket + ESPN real data
import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import cors from '@fastify/cors';
import { gameStateService } from './services/gameState.js';
import { setupWebSocket } from './services/websocket.js';
import { ESPNPoller, fetchESPNscoreboard, buildLiveStateFromESPN, fetchGameSummary } from './services/espnApi.js';
import { gameRoutes } from './routes/games.js';
import { healthCheck } from './routes/health.js';
import { playersOnCourtEngine } from './services/playersOnCourt.js';

const PORT = Number(process.env.PORT) || 3001;

const app = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: { translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
    },
  },
});

await app.register(cors, { origin: true });
await app.register(websocket);

// Routes
app.get('/health', healthCheck);
app.register(gameRoutes, { prefix: '/api/games' });

// WebSocket endpoint
app.get('/ws/live', { websocket: true }, (socket) => {
  const ws = socket.socket;
  setupWebSocket(socket);

  // Send initial state after a tiny delay to ensure socket is ready
  setTimeout(() => {
    try {
      if (ws.readyState === 1) { // OPEN
        const games = gameStateService.getGames();
        if (games.length > 0) {
          const liveState = gameStateService.getLiveState(games[0].id);
          if (liveState) {
            ws.send(JSON.stringify({ type: 'INIT', payload: liveState }));
          }
        }
      }
    } catch (err) {
      console.error('[WS] Failed to send INIT:', err);
    }
  }, 100);
});

// Update players on court and points from summary (called periodically for live games)
async function updatePlayersFromSummary(gameId: string, game: Game): Promise<void> {
  const summary = await fetchGameSummary(gameId);
  if (!summary) return;

  const liveState = gameStateService.getLiveState(gameId);
  if (!liveState) return;

  // IMPORTANT: Don't reprocess all events - just update points from current boxscore
  // The court state was already correctly initialized from starters + events

  // Update points from boxscore
  const courtState = playersOnCourtEngine.getPlayersOnCourt(gameId);
  if (courtState) {
    liveState.playersOnCourt.home = summary.homePlayers
      .filter(p => courtState.home.includes(p.id))
      .map(p => ({ gameId, playerId: p.id, player: p, points: summary.playerPoints[p.id] || 0, minutes: 0, seconds: 0, isOnCourt: true }));

    liveState.playersOnCourt.away = summary.awayPlayers
      .filter(p => courtState.away.includes(p.id))
      .map(p => ({ gameId, playerId: p.id, player: p, points: summary.playerPoints[p.id] || 0, minutes: 0, seconds: 0, isOnCourt: true }));

    // Broadcast update to WebSocket clients
    gameStateService.broadcast({ type: 'PLAYERS_UPDATE', payload: { gameId, playersOnCourt: liveState.playersOnCourt } });
  }
}

// Start ESPN poller for real games
const espnPoller = new ESPNPoller(async (games) => {
  // Update games in state service
  for (const game of games) {
    const existing = gameStateService.getLiveState(game.id);

    if (existing) {
      // Update existing live game - just update score for speed
      gameStateService.updateGameScore(
        game.id,
        game.homeScore,
        game.awayScore,
        game.quarter,
        game.clock
      );
    } else {
      // New live game - create live state with full summary
      const liveState = await buildLiveStateFromESPN({
        id: game.id,
        date: game.gameTime,
        name: `${game.awayTeam.abbreviation} @ ${game.homeTeam.abbreviation}`,
        shortName: `${game.awayTeam.abbreviation} @ ${game.homeTeam.abbreviation}`,
        status: {
          clock: game.clock ? parseFloat(game.clock.split(':')[0]) * 60 : 0,
          displayClock: game.clock || '0:00',
          period: game.quarter || 1,
          type: { id: '2', state: game.status === 'In Progress' ? 'in' : 'pre', description: game.status, detail: '' },
        },
        competitions: [{
          id: game.id,
          playByPlayAvailable: true,
          competitors: [
            { id: game.homeTeam.id, homeAway: 'home', team: { id: game.homeTeam.id, abbreviation: game.homeTeam.abbreviation, displayName: game.homeTeam.name, location: game.homeTeam.city, logo: '' }, score: String(game.homeScore) },
            { id: game.awayTeam.id, homeAway: 'away', team: { id: game.awayTeam.id, abbreviation: game.awayTeam.abbreviation, displayName: game.awayTeam.name, location: game.awayTeam.city, logo: '' }, score: String(game.awayScore) },
          ],
        }],
      } as never);

      if (liveState) {
        // Initialize live state for new game
        gameStateService['liveStates'].set(game.id, liveState);
        gameStateService['games'].set(game.id, game);

        // Fetch full game summary to get players and substitutions
        const summary = await fetchGameSummary(game.id);
        if (summary) {
          // Initialize starting lineup with starters only (5 per team)
          playersOnCourtEngine.initializeGame(game.id, summary.homeStarters, summary.awayStarters);

          // Store team mapping for later resolution
          playersOnCourtEngine.setTeamMapping(game.id, game.homeTeam.abbreviation, game.awayTeam.abbreviation);
          playersOnCourtEngine.setTeamIdMapping(game.id, game.homeTeam.id, game.awayTeam.id);

          // Store full player list with status in live state
          gameStateService.setPlayers(game.id, {
            home: summary.homePlayers,
            away: summary.awayPlayers,
          });

          // Register player names for name resolution
          const allPlayers = [
            ...summary.homePlayers.map(p => ({ ...p, teamAbbr: game.homeTeam.abbreviation })),
            ...summary.awayPlayers.map(p => ({ ...p, teamAbbr: game.awayTeam.abbreviation })),
          ];
          playersOnCourtEngine.registerPlayers(game.id, allPlayers);

          // Process all substitution events to track who is on court
          const subEvents = summary.plays.filter(p => p.eventType === 'SUB IN' || p.eventType === 'SUB OUT');
          if (subEvents.length > 0) {
            playersOnCourtEngine.processEvents(game.id, { home: summary.homeStarters, away: summary.awayStarters }, subEvents);
          }

          // Update live state with players on court
          const courtState = playersOnCourtEngine.getPlayersOnCourt(game.id);
          if (courtState) {
            liveState.playersOnCourt.home = summary.homePlayers
              .filter(p => courtState.home.includes(p.id))
              .map(p => ({ gameId: game.id, playerId: p.id, player: p, points: summary.playerPoints[p.id] || 0, minutes: 0, seconds: 0, isOnCourt: true }));

            liveState.playersOnCourt.away = summary.awayPlayers
              .filter(p => courtState.away.includes(p.id))
              .map(p => ({ gameId: game.id, playerId: p.id, player: p, points: summary.playerPoints[p.id] || 0, minutes: 0, seconds: 0, isOnCourt: true }));
          }
        }
      }
    }
  }

  // Broadcast all games update
  gameStateService.broadcast({ type: 'GAMES_UPDATE', payload: games });

  app.log.info(`[ESPN] Updated ${games.filter(g => g.status === 'In Progress').length} live games`);
}, 10000); // Poll every 10 seconds for live data

// Also start a fallback mock replayer for development when no live games
let mockReplayer: { start: () => void; stop: () => void } | null = null;

async function start() {
  try {
    await app.listen({ port: PORT, host: '0.0.0.0' });
    app.log.info(`🚀 NBA Backend running on http://localhost:${PORT}`);
    app.log.info(`📡 WebSocket available at ws://localhost:${PORT}/ws/live`);

    // Fetch initial games from ESPN
    const initialGames = await fetchESPNscoreboard();
    const liveGames = initialGames.filter(g => g.status === 'In Progress');

    if (liveGames.length > 0) {
      app.log.info(`📺 Found ${liveGames.length} live game(s) from ESPN`);
      espnPoller.start();

      // Also start a player update interval for live games (every 10 seconds)
      setInterval(async () => {
        const liveGamesList = gameStateService.getGames().filter(g => g.status === 'In Progress');
        for (const game of liveGamesList) {
          try {
            await updatePlayersFromSummary(game.id, game);
          } catch (err) {
            app.log.error(`[ESPN] Failed to update players for game ${game.id}:`, err);
          }
        }
      }, 10000); // Update players every 10 seconds for near real-time data
    } else {
      app.log.info('📺 No live games found, starting mock replayer for development');
      // Import and start mock replayer only when needed
      const { MockReplayer } = await import('./workers/mockReplayer.js');
      mockReplayer = new MockReplayer(gameStateService);
      mockReplayer.start();
    }
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();

export { app };