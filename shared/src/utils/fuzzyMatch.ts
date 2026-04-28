// Levenshtein distance for fuzzy matching player names from OCR
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Normalize string for comparison: lowercase, remove accents, trim
export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove accents
    .replace(/[^a-z0-9\s]/g, '') // remove special chars
    .trim();
}

// Calculate similarity ratio (0-1)
export function similarity(a: string, b: string): number {
  const normA = normalizeString(a);
  const normB = normalizeString(b);

  if (normA === normB) return 1;
  if (normA.length === 0 || normB.length === 0) return 0;

  const distance = levenshteinDistance(normA, normB);
  const maxLen = Math.max(normA.length, normB.length);

  return 1 - distance / maxLen;
}

// Match OCR'd name to player using fuzzy matching + alias dictionary
export interface FuzzyMatchResult {
  playerId: string | null;
  playerName: string | null;
  confidence: number;
  matchedVia: 'alias' | 'fuzzy' | 'none';
}

export function matchPlayerName(
  ocrName: string,
  players: { id: string; fullName: string; firstName: string; lastName: string }[],
  aliases: Map<string, string> // name -> playerId
): FuzzyMatchResult {
  const normalizedOcr = normalizeString(ocrName);

  // 1. Check alias dictionary first (highest priority)
  const aliasMatch = aliases.get(normalizedOcr);
  if (aliasMatch) {
    const player = players.find(p => p.id === aliasMatch);
    if (player) {
      return { playerId: aliasMatch, playerName: player.fullName, confidence: 1, matchedVia: 'alias' };
    }
  }

  // 2. Direct fuzzy match on full name
  let bestMatch: typeof players[0] | null = null;
  let bestScore = 0;

  for (const player of players) {
    const scores = [
      similarity(ocrName, player.fullName),
      similarity(ocrName, player.firstName),
      similarity(ocrName, player.lastName),
      similarity(ocrName, player.firstName + ' ' + player.lastName),
    ];

    const maxScore = Math.max(...scores);
    if (maxScore > bestScore) {
      bestScore = maxScore;
      bestMatch = player;
    }
  }

  // Threshold: 0.7 for fuzzy match
  if (bestMatch && bestScore >= 0.7) {
    return { playerId: bestMatch.id, playerName: bestMatch.fullName, confidence: bestScore, matchedVia: 'fuzzy' };
  }

  return { playerId: null, playerName: null, confidence: 0, matchedVia: 'none' };
}

// Build alias dictionary for common OCR variations
export function buildAliasDictionary(): Map<string, string> {
  const aliases = new Map<string, string>();

  // Common OCR variations / nicknames
  const aliasEntries: [string, string][] = [
    ['lebron james', '2544'],
    ['lebron', '2544'],
    ['anthony davis', '203999'],
    ['a davis', '203999'],
    ['davison', '203999'], // OCR might misread
    ['d\'angelo russell', '1627813'],
    ['dangelo russell', '1627813'],
    ['d russell', '1627813'],
    ['russell', '1627813'],
    ['austin reaves', '1629029'],
    ['reaves', '1629029'],
    ['rui hachimura', '203496'],
    ['hachimura', '203496'],
    ['jayson tatum', '1628369'],
    ['tatum', '1628369'],
    ['jaylen brown', '1629573'],
    ['brown', '1629573'],
    ['jb', '1629573'],
    ['kristaps porzingis', '1627741'],
    ['porzingis', '1627741'],
    ['kp', '1627741'],
    ['derrick white', '1627854'],
    ['dwhite', '1627854'],
    ['jrue holiday', '203481'],
    ['holiday', '203481'],
    ['al horford', '1628401'],
    ['horford', '1628401'],
    ['robert williams', '1628436'],
    ['rob williams', '1628436'],
    ['gabe vincent', '1626150'],
    ['vincent', '1626150'],
    ['taurean prince', '203112'],
    ['prince', '203112'],
    ['jarred vanderbilt', '2738'],
    ['vanderbilt', '2738'],
    ['max christie', '1628968'],
    ['christie', '1628968'],
    ['colin castleton', '204030'],
    ['castleton', '204030'],
    ['peyton watson', '204025'],
    ['watson', '204025'],
    ['sam hauser', '1628439'],
    ['hauser', '1628439'],
    ['dalano banton', '1629719'],
    ['banton', '1629719'],
  ];

  for (const [name, playerId] of aliasEntries) {
    aliases.set(normalizeString(name), playerId);
  }

  return aliases;
}