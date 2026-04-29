// Core Entities - fonte da verdade para todo o sistema
// Match Status (derived from game_time - now)
export function getCourtStatus(game) {
    const now = new Date();
    const gameTime = new Date(game.gameTime);
    const diffMs = gameTime.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    if (game.status === 'In Progress')
        return 'LIVE';
    if (game.status === 'Final')
        return 'FINISHED';
    if (diffHours <= 2)
        return 'SOON';
    return 'FUTURE';
}
// Prop line color logic: >= 3 points to beat line = GREEN, >3 and <=5 = YELLOW, >5 = RED
export function getPropLineStatus(currentPoints, lineValue) {
    const diff = lineValue - currentPoints;
    if (diff <= 3)
        return 'GREEN'; // can beat or already beat
    if (diff <= 5)
        return 'YELLOW'; // attention needed
    return 'RED'; // far from beating
}
export function getPointsToBeatLine(currentPoints, lineValue) {
    return Math.max(0, lineValue - currentPoints);
}
