// Zod schemas for validating data from external sources (OCR, LLM, API)
import { z } from 'zod';

// Team schema
export const TeamSchema = z.object({
  id: z.string(),
  abbreviation: z.string().min(2).max(5),
  name: z.string(),
  city: z.string(),
});

// Player schema
export const PlayerSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  jerseyNumber: z.string(),
  teamId: z.string(),
  position: z.string().optional(),
});

// Game schema
export const GameSchema = z.object({
  id: z.string(),
  homeTeam: TeamSchema,
  awayTeam: TeamSchema,
  gameTime: z.string().datetime(), // ISO string stored in Redis
  status: z.enum(['In Progress', 'Final', 'Scheduled']),
  homeScore: z.number().int().min(0),
  awayScore: z.number().int().min(0),
  quarter: z.number().int().min(1).max(5).optional(),
  clock: z.string().optional(),
});

// PlayerGameStats schema
export const PlayerGameStatsSchema = z.object({
  gameId: z.string(),
  playerId: z.string(),
  player: PlayerSchema,
  points: z.number().int().min(0),
  minutes: z.number().int().min(0).max(60),
  seconds: z.number().int().min(0).max(59),
  isOnCourt: z.boolean(),
  rebounds: z.number().int().min(0).optional(),
  assists: z.number().int().min(0).optional(),
  lineValue: z.number().optional(),
  lineProvider: z.string().optional(),
});

// PlayerLine schema
export const PlayerLineSchema = z.object({
  playerId: z.string(),
  gameId: z.string(),
  lineValue: z.number(),
  provider: z.string(),
  timestamp: z.string().datetime(),
  isAvailable: z.boolean(),
});

// LiveState schema
export const LiveStateSchema = z.object({
  gameId: z.string(),
  homeScore: z.number().int().min(0),
  awayScore: z.number().int().min(0),
  quarter: z.number().int().min(1).max(5),
  clock: z.string(),
  playersOnCourt: z.object({
    home: z.array(PlayerGameStatsSchema),
    away: z.array(PlayerGameStatsSchema),
  }),
  lastEvent: z.string().optional(),
  lastEventTime: z.string().datetime().optional(),
  possession: z.enum(['home', 'away']).optional(),
});

// PlayByPlayEvent schema
export const PlayByPlayEventSchema = z.object({
  gameId: z.string(),
  eventId: z.number().int(),
  clock: z.string(),
  eventType: z.string(),
  playerId: z.string().optional(),
  teamId: z.string().optional(),
  description: z.string(),
  timestamp: z.string().datetime(),
});

// OCR result from scraper (before AI cleanup)
export const OCRRawResultSchema = z.object({
  gameId: z.string(),
  provider: z.string(),
  rawText: z.string(),
  lines: z.array(z.object({
    playerName: z.string(),
    lineValue: z.string(), // might be "25.5" or "25½"
    confidence: z.number().min(0).max(1),
    coordinates: z.object({
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
    }).optional(),
  })),
  timestamp: z.string().datetime(),
  success: z.boolean(),
  retryCount: z.number().int().min(0).max(3).default(0),
});

// AI cleaned result (output of LLM cleanup)
export const AICleanedResultSchema = z.object({
  gameId: z.string(),
  provider: z.string(),
  cleanedLines: z.array(z.object({ // Support both naming conventions
    playerId: z.string(),
    lineValue: z.number(),
    confidence: z.number().min(0).max(1),
    matchedVia: z.enum(['alias', 'fuzzy', 'direct']),
    originalName: z.string(), // name from OCR
  })),
  timestamp: z.string().datetime(),
  modelUsed: z.string(),
});

// Job types for BullMQ
export const JobTypesSchema = z.enum(['scrape', 'ocr', 'ai-cleanup', 'persist']);
export type JobType = z.infer<typeof JobTypesSchema>;

// Health check response
export const HealthCheckSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  timestamp: z.string().datetime(),
  services: z.object({
    redis: z.boolean(),
    workers: z.boolean(),
    websocket: z.boolean(),
  }),
  uptime: z.number(),
});

// Validation helper - throws if invalid
export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}