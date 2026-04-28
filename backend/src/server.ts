// Main server entry point - Fastify + WebSocket + ESPN real data
import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import cors from '@fastify/cors';
import { gameStateService } from './services/gameState.js';
import { setupWebSocket } from './services/websocket.js';
import { ESPNPoller, fetchESPNscoreboard, buildLiveStateFromESPN } from './services/espnApi.js';
import { gameRoutes } from './routes/games.js';
import { healthCheck } from './routes/health.js';

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
  setupWebSocket(socket);

  // Send initial state
  const liveState = gameStateService.getLiveState();
  if (liveState) {
    socket.send(JSON.stringify({ type: 'INIT', payload: liveState }));
  }
});

// Start ESPN poller for real games
const espnPoller = new ESPNPoller(async (games) => {
  // Update games in state service
  for (const game of games) {
    const existing = gameStateService.getLiveState(game.id);

    if (existing) {
      // Update existing live game
      gameStateService.updateGameScore(
        game.id,
        game.homeScore,
        game.awayScore,
        game.quarter,
        game.clock
      );
    } else {
      // New live game - create live state
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