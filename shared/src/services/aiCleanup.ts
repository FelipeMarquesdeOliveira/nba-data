// AI Cleanup Service - integrates with LLM (MiniMax/Gemini) for OCR text cleaning
// MANDATORY: All data from LLM MUST be validated with Zod before writing to Redis/DB

import { z } from 'zod';
import { validateOrThrow, AICleanedResultSchema } from '../types/schemas.js';

// Raw OCR line before cleanup
export const RawOCRLineSchema = z.object({
  playerName: z.string(),
  lineValue: z.string(),
  confidence: z.number().min(0).max(1),
  coordinates: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
  }).optional(),
});
export type RawOCRLine = z.infer<typeof RawOCRLineSchema>;

// Cleaned line after AI processing
export const CleanedLineSchema = z.object({
  playerId: z.string(),
  lineValue: z.number(),
  confidence: z.number().min(0).max(1),
  matchedVia: z.enum(['alias', 'fuzzy', 'direct']),
  originalName: z.string(),
});
export type CleanedLine = z.infer<typeof CleanedLineSchema>;

// AI Cleanup Request
export const AICleanupRequestSchema = z.object({
  gameId: z.string(),
  provider: z.string(),
  rawLines: z.array(RawOCRLineSchema),
  model: z.enum(['minimax', 'gemini']).optional(),
});
export type AICleanupRequest = z.infer<typeof AICleanupRequestSchema>;

// AI Cleanup Response
export const AICleanupResponseSchema = z.object({
  cleanedLines: z.array(CleanedLineSchema),
  errors: z.array(z.object({
    originalName: z.string(),
    reason: z.string(),
  })).optional(),
  modelUsed: z.string(),
  processingTimeMs: z.number(),
});
export type AICleanupResponse = z.infer<typeof AICleanupResponseSchema>;

// Validation failure result
export interface ValidationResult {
  success: boolean;
  errors: string[];
  data: unknown;
}

// AI Cleanup Service
export class AICleanupService {
  private minimaxApiKey: string | undefined;
  private geminiApiKey: string | undefined;

  constructor() {
    this.minimaxApiKey = process.env.MINIMAX_API_KEY;
    this.geminiApiKey = process.env.GEMINI_API_KEY;
  }

  // Main entry point - clean OCR results
  async cleanup(request: AICleanupRequest): Promise<AICleanupResponse> {
    const startTime = Date.now();

    // Call LLM
    const llmResponse = await this.callLLM(request);

    // MANDATORY Zod validation - fail if doesn't match schema
    const result = this.validateLLMResponse(llmResponse, request.rawLines);

    if (!result.success) {
      // If validation fails, job should fail and retry per BullMQ config
      throw new Error(`AI Cleanup validation failed: ${result.errors.join(', ')}`);
    }

    return {
      cleanedLines: result.data as CleanedLine[],
      modelUsed: request.model || 'minimax',
      processingTimeMs: Date.now() - startTime,
    };
  }

  // Call LLM API (MiniMax or Gemini)
  private async callLLM(request: AICleanupRequest): Promise<unknown> {
    const { rawLines, gameId, provider, model } = request;

    // Prepare prompt
    const prompt = this.buildPrompt(rawLines);

    // Try MiniMax first, then Gemini
    if (model !== 'gemini' && this.minimaxApiKey) {
      try {
        return await this.callMiniMax(prompt, gameId, provider);
      } catch (error) {
        console.error('[AI Cleanup] MiniMax failed, trying Gemini:', error);
      }
    }

    if (this.geminiApiKey) {
      return await this.callGemini(prompt, gameId, provider);
    }

    throw new Error('No AI API key configured');
  }

  // Build prompt for LLM
  private buildPrompt(rawLines: RawOCRLine[]): string {
    const linesText = rawLines
      .map((l, i) => `${i + 1}. "${l.playerName}" -> ${l.lineValue}`)
      .join('\n');

    return `You are an NBA data normalization assistant. Given OCR-extracted player names and betting lines, you need to:

1. Match each player name to the correct NBA player ID
2. Normalize line values (handle "25½" -> 25.5, etc.)
3. Flag any uncertain matches

Player dictionary (id -> name):
- 2544: LeBron James
- 203999: Anthony Davis
- 1627813: D'Angelo Russell
- 1629029: Austin Reaves
- 203496: Rui Hachimura
- 1628369: Jayson Tatum
- 1629573: Jaylen Brown
- 1627741: Kristaps Porzingis
- 1627854: Derrick White
- 203481: Jrue Holiday

Return JSON:
{
  "cleanedLines": [
    {"playerId": "2544", "lineValue": 25.5, "confidence": 0.95, "matchedVia": "direct", "originalName": "LeBron James"}
  ],
  "errors": [{"originalName": "Lebron", "reason": "No match found"}]
}

OCR Results:
${linesText}

Return ONLY valid JSON.`;;
  }

  // Call MiniMax API
  private async callMiniMax(prompt: string, gameId: string, provider: string): Promise<unknown> {
    const response = await fetch('https://api.minimax.chat/v1/text/chatcompletion_v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.minimaxApiKey}`,
      },
      body: JSON.stringify({
        model: 'MiniMax-Text-01',
        messages: [
          { role: 'system', content: 'You are an NBA data normalization assistant.' },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`MiniMax API error: ${response.status}`);
    }

    const data = await response.json() as { choices?: { message?: { content?: string } }[] };
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Empty response from MiniMax');
    }

    // Parse JSON from response
    try {
      return JSON.parse(content);
    } catch {
      throw new Error('Invalid JSON from MiniMax');
    }
  }

  // Call Gemini API
  private async callGemini(prompt: string, gameId: string, provider: string): Promise<unknown> {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error('Empty response from Gemini');
    }

    try {
      return JSON.parse(content);
    } catch {
      throw new Error('Invalid JSON from Gemini');
    }
  }

  // MANDATORY Zod validation - this is the last line of defense
  private validateLLMResponse(
    llmData: unknown,
    rawLines: RawOCRLine[]
  ): ValidationResult {
    try {
      // Validate the entire structure
      const validated = validateOrThrow(AICleanedResultSchema, llmData);

      // Additional checks: ensure all original lines are accounted for
      const cleanedPlayerIds = new Set(validated.cleanedLines.map((l: { playerId: string }) => l.playerId));
      const unmatched = rawLines.filter(
        (l: RawOCRLine) => !cleanedPlayerIds.has(l.playerName) && // by originalName check would need mapping
        !validated.cleanedLines.some((c: CleanedLine) => c.originalName === l.playerName)
      );

      if (unmatched.length > 0) {
        // Warn about unmatched but don't fail - LLM may have valid reasons
        console.warn(`[AI Cleanup] ${unmatched.length} lines unmatched:`, unmatched.map((u: RawOCRLine) => u.playerName));
      }

      return { success: true, errors: [], data: validated };
    } catch (error: unknown) {
      const errors = error instanceof z.ZodError
        ? error.errors.map((e: { path: { join: (separator: string) => string }; message: string }) => `${e.path.join('.')}: ${e.message}`)
        : [String(error)];

      return { success: false, errors, data: llmData };
    }
  }

  // Check if service is configured
  isConfigured(): boolean {
    return !!(this.minimaxApiKey || this.geminiApiKey);
  }
}

// Singleton
export const aiCleanupService = new AICleanupService();