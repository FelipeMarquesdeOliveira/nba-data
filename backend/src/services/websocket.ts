// WebSocket setup and management
import type { WebSocket } from 'ws';
import { gameStateService } from './gameState.js';

// @fastify/websocket wraps WebSocket, actual socket is at .socket
interface FastifyWebSocketWrapper {
  socket: WebSocket;
  on(event: string, handler: (...args: unknown[]) => void): void;
}

export function setupWebSocket(socket: FastifyWebSocketWrapper): void {
  const ws = socket.socket;

  gameStateService.subscribe(ws);

  ws.on('message', (data: unknown) => {
    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case 'SUBSCRIBE_GAME':
          ws.send(JSON.stringify({
            type: 'SUBSCRIBED',
            payload: { gameId: message.payload?.gameId },
          }));
          break;

        case 'PING':
          ws.send(JSON.stringify({ type: 'PONG' }));
          break;

        default:
          ws.send(JSON.stringify({
            type: 'ERROR',
            payload: { message: 'Unknown message type' },
          }));
      }
    } catch {
      ws.send(JSON.stringify({
        type: 'ERROR',
        payload: { message: 'Invalid JSON' },
      }));
    }
  });

  ws.on('close', () => {
    // Cleanup handled in gameStateService
  });
}