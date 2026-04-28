// Scraper Worker - handles OCR and data extraction from betting sites
// Runs as separate process, communicates via BullMQ

import { Worker, Queue, Job } from 'bullmq';
import IORedis from 'ioredis';
import { Browser, chromium } from 'playwright';
import Tesseract from 'tesseract.js';
import { validateOrThrow, OCRRawResultSchema } from '@nba-shared/types/schemas';
import { buildAliasDictionary, matchPlayerName } from '@nba-shared/utils/fuzzyMatch';
import { allPlayers } from '@nba-shared/mockData';

// Redis connection for BullMQ and caching
const redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

// Queue names
const SCRAPE_QUEUE = 'nba:scrape';
const OCR_QUEUE = 'nba:ocr';
const AI_CLEANUP_QUEUE = 'nba:ai-cleanup';

// Create queues
const scrapeQueue = new Queue(SCRAPE_QUEUE, { connection: redis });
const ocrQueue = new Queue(OCR_QUEUE, { connection: redis });
const aiCleanupQueue = new Queue(AI_CLEANUP_QUEUE, { connection: redis });

// Browser instance (shared)
let browser: Browser | null = null;

// Retry configuration
const RETRY_ATTEMPTS = 3;
const RETRY_DELAYS = [10, 30, 60]; // seconds

interface ScrapeJob {
  gameId: string;
  provider: string;
  url: string;
  coordinates: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface OCRJob {
  imagePath: string;
  gameId: string;
  provider: string;
}

interface AICleanupJob {
  rawOCR: {
    playerName: string;
    lineValue: string;
    confidence: number;
  }[];
  gameId: string;
  provider: string;
}

// Initialize browser
async function initBrowser(): Promise<Browser> {
  if (!browser) {
    browser = await chromium.launch({ headless: true });
  }
  return browser;
}

// Close browser on shutdown
async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

// Scrape worker - navigates to site and captures screenshot for OCR
const scrapeWorker = new Worker<ScrapeJob>(
  SCRAPE_QUEUE,
  async (job: Job<ScrapeJob>) => {
    console.log(`[Scrape] Starting job ${job.id} for game ${job.data.gameId}`);

    const { gameId, provider, url, coordinates } = job.data;

    try {
      const browser = await initBrowser();
      const page = await browser.newPage();

      // Navigate with retry logic
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

      // Wait for dynamic content
      await page.waitForTimeout(2000);

      // Capture screenshot of ROI (Region of Interest)
      const screenshot = await page.screenshot({
        type: 'png',
        clip: {
          x: coordinates.x,
          y: coordinates.y,
          width: coordinates.width,
          height: coordinates.height,
        },
      });

      await page.close();

      // Save screenshot for next step
      const screenshotPath = `/tmp/ocr-${gameId}-${provider}.png`;
      // In production, would save to disk or object storage

      // Enqueue OCR job
      await ocrQueue.add('ocr', {
        imagePath: screenshotPath,
        gameId,
        provider,
      } as OCRJob, {
        attempts: RETRY_ATTEMPTS,
        backoff: {
          type: 'exponential',
          delay: RETRY_DELAYS[0] * 1000,
        },
      });

      console.log(`[Scrape] Job ${job.id} completed, queued for OCR`);
      return { success: true, screenshotPath };
    } catch (error) {
      console.error(`[Scrape] Job ${job.id} failed:`, error);

      // Check retry count
      if (job.attemptsMade < RETRY_ATTEMPTS) {
        throw new Error(`Retry attempt ${job.attemptsMade + 1}/${RETRY_ATTEMPTS}`);
      }

      // Mark as failed, going to DLQ after max retries
      return { success: false, error: String(error) };
    }
  },
  {
    connection: redis,
    concurrency: 2, // Run 2 scrape jobs at a time
    limiter: {
      max: 10,
      duration: 60000, // 10 per minute
    },
  }
);

// OCR worker - extracts text from screenshot using Tesseract
const ocrWorker = new Worker<OCRJob>(
  OCR_QUEUE,
  async (job: Job<OCRJob>) => {
    console.log(`[OCR] Starting job ${job.id}`);

    const { imagePath, gameId, provider } = job.data;

    try {
      // Load image for OCR (in production, would read from imagePath)
      // For now, simulating OCR result
      const result = await Tesseract.recognize(imagePath, 'eng', {
        logger: (m) => console.log(`[OCR] ${m.status}: ${m.progress}`),
      });

      const rawText = result.data.text;

      // Parse lines into structured data
      const lines = parseLinesFromOCR(rawText);

      const ocrResult = {
        gameId,
        provider,
        rawText,
        lines,
        timestamp: new Date().toISOString(),
        success: true,
        retryCount: 0,
      };

      // Validate with Zod
      const validated = validateOrThrow(OCRRawResultSchema, ocrResult);

      // Cache last valid result in Redis
      await redis.setex(
        `ocr:last:${gameId}:${provider}`,
        3600, // 1 hour TTL
        JSON.stringify(validated)
      );

      // Enqueue AI cleanup
      await aiCleanupQueue.add('ai-cleanup', {
        rawOCR: lines.map(l => ({
          playerName: l.playerName,
          lineValue: l.lineValue,
          confidence: l.confidence,
        })),
        gameId,
        provider,
      } as AICleanupJob);

      console.log(`[OCR] Job ${job.id} completed, ${lines.length} lines extracted`);
      return validated;
    } catch (error) {
      console.error(`[OCR] Job ${job.id} failed:`, error);

      // Fallback: get last valid result from cache
      const lastValid = await redis.get(`ocr:last:${gameId}:${provider}`);
      if (lastValid) {
        console.log(`[OCR] Using cached result for ${gameId}:${provider}`);
        return JSON.parse(lastValid);
      }

      // Mark as unavailable
      return {
        gameId,
        provider,
        success: false,
        error: String(error),
      };
    }
  },
  {
    connection: redis,
    concurrency: 4, // Run 4 OCR jobs at a time
  }
);

// AI Cleanup worker - uses LLM to clean OCR results
const aiCleanupWorker = new Worker<AICleanupJob>(
  AI_CLEANUP_QUEUE,
  async (job: Job<AICleanupJob>) => {
    console.log(`[AI Cleanup] Starting job ${job.id}`);

    const { rawOCR, gameId, provider } = job.data;

    try {
      // In production, call MiniMax/Gemini here
      const cleanedLines = await callAICleanup(rawOCR);

      // Store result in Redis
      await redis.setex(
        `lines:${gameId}:${provider}`,
        300, // 5 minute TTL for live games
        JSON.stringify(cleanedLines)
      );

      console.log(`[AI Cleanup] Job ${job.id} completed, ${cleanedLines.length} lines cleaned`);
      return { success: true, cleanedLines };
    } catch (error) {
      console.error(`[AI Cleanup] Job ${job.id} failed:`, error);
      throw error; // Will retry
    }
  },
  {
    connection: redis,
    concurrency: 2,
  }
);

// Parse raw OCR text into structured lines
function parseLinesFromOCR(text: string): { playerName: string; lineValue: string; confidence: number; coordinates?: { x: number; y: number; width: number; height: number } }[] {
  const lines: ReturnType<typeof parseLinesFromOCR> = [];

  // OCR often produces messy output - this is simplified
  const rows = text.split('\n').filter(l => l.trim());

  for (const row of rows) {
    // Try to extract player name and line value
    // Format often looks like: "LeBron James 25.5"
    const match = row.match(/([A-Za-z\s\.\']+)\s+(\d+\.?\d*)/);
    if (match) {
      const [, name, value] = match;
      const trimmedName = name.trim();

      if (trimmedName.length > 2) {
        lines.push({
          playerName: trimmedName,
          lineValue: value,
          confidence: 0.8, // Would use actual OCR confidence
        });
      }
    }
  }

  return lines;
}

// Call AI to clean and normalize OCR results
async function callAICleanup(rawLines: { playerName: string; lineValue: string; confidence: number }[]): Promise<{
  playerId: string;
  lineValue: number;
  confidence: number;
  matchedVia: 'alias' | 'fuzzy' | 'direct';
  originalName: string;
}[]> {
  const aliases = buildAliasDictionary();

  const cleaned = rawLines.map(line => {
    const result = matchPlayerName(line.playerName, allPlayers, aliases);

    if (result.playerId) {
      return {
        playerId: result.playerId,
        lineValue: parseFloat(line.lineValue),
        confidence: line.confidence * result.confidence, // Combined confidence
        matchedVia: result.matchedVia,
        originalName: line.playerName,
      };
    }

    // No match found - line is unavailable
    return null;
  }).filter(Boolean) as {
    playerId: string;
    lineValue: number;
    confidence: number;
    matchedVia: 'alias' | 'fuzzy' | 'direct';
    originalName: string;
  }[];

  return cleaned;
}

// Queue health check
async function checkQueueHealth(): Promise<{ [key: string]: unknown }> {
  const [scrape, ocr, aiCleanup] = await Promise.all([
    scrapeQueue.getJobCounts(),
    ocrQueue.getJobCounts(),
    aiCleanupQueue.getJobCounts(),
  ]);

  return { scrape, ocr, aiCleanup };
}

// Graceful shutdown
async function shutdown(): Promise<void> {
  console.log('[Shutdown] Closing workers and connections...');

  await Promise.all([
    scrapeWorker.close(),
    ocrWorker.close(),
    aiCleanupWorker.close(),
    redis.quit(),
    closeBrowser(),
  ]);

  console.log('[Shutdown] Complete');
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start
console.log('[Scraper] NBA Scraper Worker started');
console.log('[Scraper] Queues:', { SCRAPE_QUEUE, OCR_QUEUE, AI_CLEANUP_QUEUE });

export { scrapeQueue, ocrQueue, aiCleanupQueue, checkQueueHealth };