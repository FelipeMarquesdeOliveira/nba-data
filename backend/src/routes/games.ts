// Game routes - REST API
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { gameStateService } from '../services/gameState.js';

export async function gameRoutes(app: FastifyInstance): Promise<void> {
  // Get all games (with optional date filter)
  app.get('/', async (req: FastifyRequest, reply: FastifyReply) => {
    const { window } = req.query as { window?: 'past' | 'today' | 'future' | 'all' };

    let games;
    if (!window || window === 'all') {
      games = gameStateService.getGames();
    } else {
      const { past, today, future } = gameStateService.getGamesByWindow();
      games = window === 'past' ? past : window === 'today' ? today : future;
    }

    return reply.send({ data: games, timestamp: new Date().toISOString() });
  });

  // Get single game
  app.get('/:gameId', async (req: FastifyRequest<{ Params: { gameId: string } }>, reply: FastifyReply) => {
    const games = gameStateService.getGames();
    const game = games.find(g => g.id === req.params.gameId);

    if (!game) {
      return reply.status(404).send({ error: 'Game not found' });
    }

    return reply.send({ data: game });
  });

  // Get live state for a game
  app.get('/:gameId/live', async (req: FastifyRequest<{ Params: { gameId: string } }>, reply: FastifyReply) => {
    const liveState = gameStateService.getLiveState(req.params.gameId);

    if (!liveState) {
      return reply.status(404).send({ error: 'No live state for this game' });
    }

    return reply.send({ data: liveState });
  });

  // Get players on court for a game
  app.get('/:gameId/players', async (req: FastifyRequest<{ Params: { gameId: string } }>, reply: FastifyReply) => {
    const liveState = gameStateService.getLiveState(req.params.gameId);
    const benchPlayers = gameStateService.getBenchPlayers(req.params.gameId);

    if (!liveState) {
      return reply.status(404).send({ error: 'No player data for this game' });
    }

    return reply.send({
      data: {
        onCourt: {
          home: liveState.playersOnCourt.home,
          away: liveState.playersOnCourt.away,
        },
        bench: benchPlayers,
      },
    });
  });

  // Get games by status window (D-1, D0, D+1)
  app.get('/window/:period', async (req: FastifyRequest<{ Params: { period: string } }>, reply: FastifyReply) => {
    const period = req.params.period as 'yesterday' | 'today' | 'tomorrow';
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    let startDate: Date;
    let endDate: Date;

    switch (period) {
      case 'yesterday':
        startDate = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
        endDate = todayStart;
        break;
      case 'today':
        startDate = todayStart;
        endDate = todayEnd;
        break;
      case 'tomorrow':
        startDate = todayEnd;
        endDate = new Date(todayEnd.getTime() + 24 * 60 * 60 * 1000);
        break;
      default:
        return reply.status(400).send({ error: 'Invalid period. Use: yesterday, today, tomorrow' });
    }

    const games = gameStateService.getGames().filter(g => {
      const gameTime = new Date(g.gameTime);
      return gameTime >= startDate && gameTime < endDate;
    });

    return reply.send({
      data: games,
      period,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
  });
}