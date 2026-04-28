'use client';

import { useState, useEffect } from 'react';
import type { Game, CourtStatus } from '@/types';
import { getCourtStatus, formatGameTime } from '@/types';
import { mockGamesList } from '@/lib/mockData';
import GameCard from '@/components/GameCard';

export default function Home() {
  const [games, setGames] = useState<Game[]>(mockGamesList);
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'live' | 'soon' | 'final'>('all');
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  useEffect(() => {
    // In production, would fetch from API:
    // fetch('http://localhost:3001/api/games')
    //   .then(res => res.json())
    //   .then(data => setGames(data.data));
  }, []);

  const filteredGames = games.filter(game => {
    const status = getCourtStatus(game);
    if (selectedPeriod === 'all') return true;
    if (selectedPeriod === 'live') return status === 'LIVE';
    if (selectedPeriod === 'soon') return status === 'SOON' || status === 'FUTURE';
    if (selectedPeriod === 'final') return status === 'FINISHED';
    return true;
  });

  const statusCounts = {
    all: games.length,
    live: games.filter(g => getCourtStatus(g) === 'LIVE').length,
    soon: games.filter(g => getCourtStatus(g) === 'SOON' || getCourtStatus(g) === 'FUTURE').length,
    finished: games.filter(g => getCourtStatus(g) === 'FINISHED').length,
  };

  return (
    <div className="flex h-screen bg-[#0A0A0A] text-white overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-72 flex-shrink-0 border-r border-[#1A1A1A] bg-[#0F0F0F] flex flex-col h-full">
        {/* Sidebar Header */}
        <div className="p-5 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[#F56600] text-xl">🏀</span>
            <h1 className="text-base font-bold tracking-wide">NBA Analyzer</h1>
          </div>
          <p className="text-[11px] text-gray-500">Real-time game analysis</p>
        </div>

        {/* Date Selector */}
        <div className="p-4 border-b border-[#1A1A1A]">
          <div className="flex gap-2 mb-4">
            <button className="flex-1 py-1.5 bg-[#1A1A1A] text-xs font-medium rounded text-gray-400 hover:text-white transition-colors">-1d</button>
            <button className="flex-1 py-1.5 bg-blue-600 text-xs font-medium rounded text-white transition-colors">Today</button>
            <button className="flex-1 py-1.5 bg-[#1A1A1A] text-xs font-medium rounded text-gray-400 hover:text-white transition-colors">+1d</button>
          </div>
          <div className="relative">
            <input 
              type="text" 
              value="27/04/2026" 
              className="w-full bg-[#1A1A1A] border border-[#262626] text-xs text-gray-300 rounded px-3 py-2.5 outline-none" 
              readOnly 
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">📅</span>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-[#1A1A1A]">
          <div className="grid grid-cols-4 gap-2">
            <FilterButton label="All" count={statusCounts.all} active={selectedPeriod === 'all'} onClick={() => setSelectedPeriod('all')} />
            <FilterButton label="Live" count={statusCounts.live} active={selectedPeriod === 'live'} onClick={() => setSelectedPeriod('live')} />
            <FilterButton label="Soon" count={statusCounts.soon} active={selectedPeriod === 'soon'} onClick={() => setSelectedPeriod('soon')} />
            <FilterButton label="Final" count={statusCounts.finished} active={selectedPeriod === 'final'} onClick={() => setSelectedPeriod('final')} />
          </div>
        </div>

        {/* Games List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {filteredGames.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-xs text-gray-500">No games in this period</p>
            </div>
          ) : (
            filteredGames.map(game => (
              <GameCard
                key={game.id}
                game={game}
                isSelected={selectedGame?.id === game.id}
                onClick={() => setSelectedGame(game)}
              />
            ))
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto">
        {selectedGame ? (
          <div className="p-8">
            <GameDetail game={selectedGame} />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 h-full">
            <div className="text-4xl mb-4 animate-bounce">👆</div>
            <p className="text-sm">Select a game to view live stats</p>
          </div>
        )}
      </main>
    </div>
  );
}

function FilterButton({ label, count, active, onClick }: { label: string, count: number, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center py-2.5 rounded transition-colors ${
        active ? 'bg-[#262626] border border-[#333]' : 'bg-transparent hover:bg-[#1A1A1A] border border-transparent'
      }`}
    >
      <span className={`text-[13px] font-bold mb-0.5 ${active ? 'text-white' : 'text-gray-400'}`}>{count}</span>
      <span className={`text-[9px] uppercase ${active ? 'text-gray-300' : 'text-gray-500'}`}>{label}</span>
    </button>
  );
}

function GameDetail({ game }: { game: Game }) {
  const status = getCourtStatus(game);

  const statusConfig = {
    LIVE: { label: 'LIVE', class: 'status-live', dotClass: 'bg-red-500 animate-pulse-live' },
    SOON: { label: 'SOON', class: 'status-soon', dotClass: 'bg-yellow-500' },
    FUTURE: { label: 'FUTURE', class: 'status-future', dotClass: 'bg-blue-500' },
    FINISHED: { label: 'FINISHED', class: 'status-finished', dotClass: 'bg-gray-500' },
  };

  const config = statusConfig[status];

  return (
    <div className="bg-[#121212] border border-[#1A1A1A] rounded-xl p-8 max-w-4xl mx-auto mt-8">
      {/* Game Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${config.class}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass} inline-block mr-1.5`} />
            {config.label}
          </span>
          {game.quarter && (
            <span className="text-sm text-gray-400 font-mono">
              Q{game.quarter} {game.clock}
            </span>
          )}
        </div>
        <span className="text-sm text-gray-500 font-mono">
          {formatGameTime(game.gameTime)}
        </span>
      </div>

      {/* Teams & Score */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-6 w-1/3">
          <div className="w-16 h-16 rounded-full bg-[#1A1A1A] border border-[#262626] flex items-center justify-center text-xl font-bold">
            {game.awayTeam.abbreviation}
          </div>
          <div>
            <p className="text-xl font-bold">{game.awayTeam.city} {game.awayTeam.name}</p>
            <p className="text-sm text-gray-500">Away</p>
          </div>
        </div>
        <div className="text-center w-1/3">
          <div className="text-5xl font-bold font-mono tracking-wider">
            {game.awayScore} - {game.homeScore}
          </div>
          <p className="text-xs text-gray-500 mt-2 uppercase tracking-widest">Current Score</p>
        </div>
        <div className="flex items-center justify-end gap-6 w-1/3">
          <div className="text-right">
            <p className="text-xl font-bold">{game.homeTeam.city} {game.homeTeam.name}</p>
            <p className="text-sm text-gray-500">Home</p>
          </div>
          <div className="w-16 h-16 rounded-full bg-[#1A1A1A] border border-[#262626] flex items-center justify-center text-xl font-bold">
            {game.homeTeam.abbreviation}
          </div>
        </div>
      </div>

      {/* Players Placeholder */}
      <div className="border-t border-[#1A1A1A] pt-8">
        <h3 className="text-xs font-bold tracking-widest text-gray-500 uppercase mb-6">Players on Court</h3>
        <div className="bg-[#0A0A0A] rounded-lg p-12 text-center border border-[#1A1A1A] border-dashed">
          <p className="text-gray-500 text-sm">Player tracking data and props will be displayed here</p>
        </div>
      </div>
    </div>
  );
}