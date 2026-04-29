# NBA Data Analyzer

Real-time NBA game analysis platform with live scores, player tracking, and betting line scraping.

## Tech Stack

- **Backend**: Fastify + TypeScript + WebSocket + BullMQ
- **Frontend**: Next.js 14 + React + Tailwind CSS
- **Scraper**: Playwright + Tesseract.js (OCR)
- **Shared**: Zod schemas, TypeScript types

## Commit Rules

**ALWAYS read and follow these rules before every commit:**

### Format
`<type>(<scope>): <description>` — all lowercase, imperative mood, no period

**Types:** feat, fix, docs, style, refactor, perf, test, chore, ci, build

### Rules
1. Write commit messages in **English only**
2. NEVER add "Co-authored-by" lines
3. NEVER mention Claude, AI, or any tool in the message
4. Subject line max 72 chars
5. Body (optional): explain *why*, not *what*, wrapped at 72 chars

### Before Committing
1. Run `git status` and `git diff` to understand changes
2. If tests exist and fail: **STOP**, do not commit
3. Only commit if all tests pass

### Examples
- `feat(websocket): add SCORE_UPDATE real-time messages`
- `fix(players-on-court): reset court state from starters`
- `docs(readme): update installation instructions`
- `chore(deps): upgrade react to v19`

## Project Structure

```
nba-data/
├── backend/       # Fastify API + ESPN poller
├── frontend/      # Next.js dashboard
├── scraper/       # BullMQ worker (Playwright + OCR)
└── shared/        # Types + Zod schemas + utils
```
