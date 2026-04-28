'use client';

import type { Game, CourtStatus } from '@/types';
import { getCourtStatus, formatGameTime } from '@/types';

interface GameCardProps {
  game: Game;
  isSelected: boolean;
  onClick: () => void;
}

export default function GameCard({ game, isSelected, onClick }: GameCardProps) {
  const status = getCourtStatus(game);

  const statusConfig = {
    LIVE: { label: 'LIVE', class: 'status-live', dotClass: 'bg-red-500 animate-pulse-live' },
    SOON: { label: 'SOON', class: 'status-soon', dotClass: 'bg-yellow-500' },
    FUTURE: { label: 'FUTURE', class: 'status-future', dotClass: 'bg-blue-500' },
    FINISHED: { label: 'FINISHED', class: 'status-finished', dotClass: 'bg-gray-500' },
  };

  const config = statusConfig[status];

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl transition-all ${
        isSelected
          ? 'bg-[#262626] ring-1 ring-[#404040]'
          : 'bg-[#1A1A1A] hover:bg-[#262626]'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${config.class}`}>
          <span className={`w-1 h-1 rounded-full ${config.dotClass} inline-block mr-1`} />
          {config.label}
        </span>
        <span className="text-xs text-gray-400">
          {status === 'LIVE' ? (
            <span className="font-mono">{game.clock}</span>
          ) : (
            formatGameTime(game.gameTime)
          )}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#333333] flex items-center justify-center text-xs font-bold">
            {game.awayTeam.abbreviation}
          </div>
          <span className="text-sm font-medium">{game.awayTeam.abbreviation}</span>
        </div>

        {game.status !== 'Scheduled' ? (
          <div className="text-center">
            <span className="font-mono text-lg font-bold">{game.awayScore}</span>
            <span className="text-gray-500 mx-1">-</span>
            <span className="font-mono text-lg font-bold">{game.homeScore}</span>
          </div>
        ) : (
          <span className="text-xs text-gray-500">vs</span>
        )}

        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">{game.homeTeam.abbreviation}</span>
          <div className="w-8 h-8 rounded-full bg-[#333333] flex items-center justify-center text-xs font-bold">
            {game.homeTeam.abbreviation}
          </div>
        </div>
      </div>

      {status === 'LIVE' && game.quarter && (
        <div className="mt-2 text-xs text-gray-400">
          Q{game.quarter} • Last event: J. Tatum 3pt
        </div>
      )}
    </button>
  );
}