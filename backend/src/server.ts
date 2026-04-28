// Main server entry point - Fastify + WebSocket + Redis
import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import cors from '@fastify/cors';
import { gameStateService } from './services/gameState.js';
import { setupWebSocket } from './services/websocket.js';
import { MockReplayer } from './workers/mockReplayer.js';
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
  socket.send(JSON.stringify({
    type: 'INIT',
    payload: gameStateService.getLiveState(),
  }));
});

// Start mock replayer for development
const replayer = new MockReplayer(gameStateService);
replayer.start();

async function start() {
  try {
    await app.listen({ port: PORT, host: '0.0.0.0' });
    app.log.info(`🚀 NBA Backend running on http://localhost:${PORT}`);
    app.log.info(`📡 WebSocket available at ws://localhost:${PORT}/ws/live`);
    app.log.info(`🔄 Mock Replayer started (simulating live game)`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();

export { app };