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
    LIVE: { label: 'LIVE', class: 'bg-red-900/30 text-red-500 border border-red-900/50', dotClass: 'bg-red-500 animate-pulse-live' },
    SOON: { label: 'PRE', class: 'bg-blue-900/30 text-blue-500 border border-blue-900/50', dotClass: '' },
    FUTURE: { label: 'PRE', class: 'bg-blue-900/30 text-blue-500 border border-blue-900/50', dotClass: '' },
    FINISHED: { label: 'FINAL', class: 'bg-[#262626] text-gray-400 border border-[#333]', dotClass: '' },
  };

  const config = statusConfig[status];

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg transition-all border ${
        isSelected
          ? 'bg-[#1A1A1A] border-[#333]'
          : 'bg-transparent border-transparent hover:bg-[#1A1A1A]/50'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className={`px-1.5 py-0.5 rounded flex items-center gap-1.5 text-[10px] font-bold ${config.class}`}>
          {config.dotClass && <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />}
          {config.label}
        </span>
        <span className="text-[11px] text-gray-500 font-mono">
          {status === 'LIVE' ? (
             `${game.quarter}Q - ${game.clock}`
          ) : status === 'FINISHED' ? (
             ''
          ) : (
            formatGameTime(game.gameTime)
          )}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-2">
             <span className="text-[10px] text-gray-600 font-mono w-4">@</span>
             <span className="text-sm font-bold text-gray-200">{game.awayTeam.abbreviation}</span>
           </div>
           <span className={`font-mono font-bold text-sm ${status === 'LIVE' ? 'text-white' : 'text-gray-300'}`}>
             {game.status !== 'Scheduled' ? game.awayScore : ''}
           </span>
        </div>
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-2">
             <span className="text-[10px] text-gray-600 font-mono w-4">vs</span>
             <span className="text-sm font-bold text-gray-200">{game.homeTeam.abbreviation}</span>
           </div>
           <span className={`font-mono font-bold text-sm ${status === 'LIVE' ? 'text-white' : 'text-gray-300'}`}>
             {game.status !== 'Scheduled' ? game.homeScore : ''}
           </span>
        </div>
      </div>
    </button>
  );
}