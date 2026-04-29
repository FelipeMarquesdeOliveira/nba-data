'use client';

import type { Player, PlayerStatus } from '@/types';

interface ExpectedLineupProps {
  players: Player[];
  teamAbbr: string;
  label: string;
}

const POSITION_ORDER = ['PG', 'SG', 'SF', 'PF', 'C'];

function StatusBadge({ status }: { status: PlayerStatus }) {
  if (status === 'OUT') {
    return (
      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400">
        OUT
      </span>
    );
  }
  if (status === 'QUESTIONABLE') {
    return (
      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-yellow-500/20 text-yellow-400">
        QUES
      </span>
    );
  }
  if (status === 'PROBABLE') {
    return (
      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-500/20 text-green-400">
        PROB
      </span>
    );
  }
  if (status === 'DOUBTFUL') {
    return (
      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-400">
        DOUBT
      </span>
    );
  }
  return null;
}

export default function ExpectedLineup({ players, teamAbbr, label }: ExpectedLineupProps) {
  // Filter starters (players with status that is not OUT)
  const starters = players.filter(p => p.status !== 'OUT');
  // Sort by position order
  const sortedStarters = [...starters].sort((a, b) => {
    const posA = POSITION_ORDER.indexOf(a.position.toUpperCase());
    const posB = POSITION_ORDER.indexOf(b.position.toUpperCase());
    return (posA === -1 ? 99 : posA) - (posB === -1 ? 99 : posB);
  });

  // Players not playing (OUT or QUESTIONABLE)
  const mayNotPlay = players.filter(p => p.status === 'OUT' || p.status === 'QUESTIONABLE');

  return (
    <div className="bg-[#0A0A0A] rounded-lg p-6 border border-[#1A1A1A]">
      <div className="flex items-center gap-2 mb-4">
        {teamAbbr && (
          <div className="w-8 h-8 rounded-full bg-[#333333] flex items-center justify-center text-xs font-bold">
            {teamAbbr}
          </div>
        )}
        <span className="text-xs text-gray-500 uppercase tracking-widest">{label}</span>
      </div>

      {/* Starters */}
      <div className="space-y-3">
        {sortedStarters.map(player => (
          <div key={player.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-8 text-center text-gray-600 font-mono text-xs">{player.jerseyNumber}</span>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{player.fullName}</p>
                {player.status && player.status !== 'ACTIVE' && (
                  <StatusBadge status={player.status} />
                )}
              </div>
            </div>
            <span className="text-xs text-gray-500 font-mono">{player.position}</span>
          </div>
        ))}
      </div>

      {/* May Not Play */}
      {mayNotPlay.length > 0 && (
        <div className="mt-6 pt-4 border-t border-[#1A1A1A]">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-3">May Not Play</p>
          <div className="space-y-2">
            {mayNotPlay.map(player => (
              <div key={player.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-8 text-center text-gray-600 font-mono text-xs">{player.jerseyNumber}</span>
                  <p className="text-sm text-gray-400">{player.fullName}</p>
                </div>
                {player.status && (
                  <StatusBadge status={player.status} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
