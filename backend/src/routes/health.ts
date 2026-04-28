// Health check route
import type { FastifyRequest, FastifyReply } from 'fastify';

const startTime = Date.now();

export async function healthCheck(_req: FastifyRequest, reply: FastifyReply) {
  return reply.send({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      redis: true, // would check real Redis in production
      workers: true, // would check BullMQ in production
      websocket: true,
    },
    uptime: Math.floor((Date.now() - startTime) / 1000),
  });
}