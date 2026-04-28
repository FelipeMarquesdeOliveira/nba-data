'use client';

import type { PlayerGameStats, PropLineStatus } from '@/types';
import { getPropLineStatus, getPointsToBeatLine } from '@/types';

interface PlayerRowProps {
  stats: PlayerGameStats;
  showOnCourt?: boolean;
}

export default function PlayerRow({ stats, showOnCourt = true }: PlayerRowProps) {
  const { player, points, minutes, seconds, isOnCourt, lineValue } = stats;
  const propStatus = lineValue ? getPropLineStatus(points, lineValue) : null;
  const pointsToBeat = lineValue ? getPointsToBeatLine(points, lineValue) : null;

  const statusColors = {
    GREEN: 'text-green-500 bg-green-500/10',
    YELLOW: 'text-yellow-500 bg-yellow-500/10',
    RED: 'text-red-500 bg-red-500/10',
  };

  const borderColors = {
    GREEN: 'border-green-500/30',
    YELLOW: 'border-yellow-500/30',
    RED: 'border-red-500/30',
  };

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border ${
        isOnCourt && showOnCourt
          ? 'bg-[#262626] border-[#404040]'
          : 'bg-[#1A1A1A] border-[#262626]'
      }`}
    >
      {/* Player Info */}
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
          isOnCourt ? 'bg-green-500/20 text-green-400' : 'bg-[#333333] text-gray-400'
        }`}>
          #{player.jerseyNumber}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{player.fullName}</span>
            {isOnCourt && showOnCourt && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-500/20 text-green-400">
                ON
              </span>
            )}
          </div>
          <span className="text-xs text-gray-400">
            {minutes}:{String(seconds).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Points */}
      <div className="text-center">
        <span className="text-xl font-bold font-mono">{points}</span>
        <p className="text-[10px] text-gray-500">PTS</p>
      </div>

      {/* Line & Status */}
      {lineValue && propStatus && (
        <div className={`flex items-center gap-3 px-3 py-2 rounded-lg ${statusColors[propStatus]}`}>
          <div className="text-right">
            <span className="font-mono font-bold">{lineValue}</span>
            <p className="text-[10px] opacity-70">{stats.lineProvider}</p>
          </div>
          <div className="text-right">
            {pointsToBeat === 0 ? (
              <span className="text-xs font-bold">BATEU</span>
            ) : (
              <span className="text-xs font-bold">-{pointsToBeat}</span>
            )}
            <p className="text-[10px] opacity-70">faltam</p>
          </div>
        </div>
      )}
    </div>
  );
}

interface TeamPlayersProps {
  players: PlayerGameStats[];
  teamName: string;
  teamAbbr: string;
}

export function TeamPlayers({ players, teamName, teamAbbr }: TeamPlayersProps) {
  const onCourt = players.filter(p => p.isOnCourt);
  const bench = players.filter(p => !p.isOnCourt);

  return (
    <div className="space-y-4">
      {/* On Court */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full bg-[#333333] flex items-center justify-center text-xs font-bold">
            {teamAbbr}
          </div>
          <span className="text-xs font-medium text-gray-400">ON COURT</span>
          <span className="text-xs text-gray-500">({onCourt.length})</span>
        </div>
        <div className="space-y-2">
          {onCourt.map(p => (
            <PlayerRow key={p.playerId} stats={p} />
          ))}
        </div>
      </div>

      {/* Bench */}
      {bench.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-gray-400">BENCH</span>
            <span className="text-xs text-gray-500">({bench.length})</span>
          </div>
          <div className="space-y-2">
            {bench.map(p => (
              <PlayerRow key={p.playerId} stats={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}