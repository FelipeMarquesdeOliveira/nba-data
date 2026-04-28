// WebSocket setup and management
import type { Socket } from 'socket.io';
import { gameStateService } from './gameState.js';

export function setupWebSocket(socket: Socket): void {
  gameStateService.subscribe(socket);

  socket.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case 'SUBSCRIBE_GAME':
          // Could filter by game ID
          socket.send(JSON.stringify({
            type: 'SUBSCRIBED',
            payload: { gameId: message.payload?.gameId },
          }));
          break;

        case 'PING':
          socket.send(JSON.stringify({ type: 'PONG' }));
          break;

        default:
          socket.send(JSON.stringify({
            type: 'ERROR',
            payload: { message: 'Unknown message type' },
          }));
      }
    } catch {
      socket.send(JSON.stringify({
        type: 'ERROR',
        payload: { message: 'Invalid JSON' },
      }));
    }
  });

  socket.on('close', () => {
    // Cleanup handled in gameStateService
  });
}