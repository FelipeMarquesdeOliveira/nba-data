'use client';

import { useState, useEffect } from 'react';
import type { Game, CourtStatus } from '@/types';
import { getCourtStatus, formatGameTime } from '@/types';
import { mockGamesList } from '@/lib/mockData';
import GameCard from '@/components/GameCard';

export default function Home() {
  const [games, setGames] = useState<Game[]>(mockGamesList);
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'past' | 'today' | 'future'>('all');
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
    if (selectedPeriod === 'past') return status === 'FINISHED';
    if (selectedPeriod === 'today') return status === 'LIVE' || status === 'SOON';
    if (selectedPeriod === 'future') return status === 'FUTURE';
    return true;
  });

  const statusCounts = {
    live: games.filter(g => getCourtStatus(g) === 'LIVE').length,
    soon: games.filter(g => getCourtStatus(g) === 'SOON').length,
    future: games.filter(g => getCourtStatus(g) === 'FUTURE').length,
    finished: games.filter(g => getCourtStatus(g) === 'FINISHED').length,
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F]">
      {/* Header */}
      <header className="border-b border-[#262626] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">NBA Live Analyzer</h1>
            <p className="text-sm text-gray-400">Real-time player props & game analysis</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse-live" />
              <span className="text-sm text-gray-400">{statusCounts.live} Live</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-sm text-gray-400">{statusCounts.soon} Soon</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-sm text-gray-400">{statusCounts.future} Future</span>
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="border-b border-[#262626] px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <button
            onClick={() => setSelectedPeriod('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedPeriod === 'all'
                ? 'bg-[#333333] text-white'
                : 'bg-[#1A1A1A] text-gray-400 hover:text-white'
            }`}
          >
            All Games
          </button>
          <button
            onClick={() => setSelectedPeriod('today')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedPeriod === 'today'
                ? 'bg-[#333333] text-white'
                : 'bg-[#1A1A1A] text-gray-400 hover:text-white'
            }`}
          >
            Today (D0)
          </button>
          <button
            onClick={() => setSelectedPeriod('past')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedPeriod === 'past'
                ? 'bg-[#333333] text-white'
                : 'bg-[#1A1A1A] text-gray-400 hover:text-white'
            }`}
          >
            Yesterday (D-1)
          </button>
          <button
            onClick={() => setSelectedPeriod('future')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedPeriod === 'future'
                ? 'bg-[#333333] text-white'
                : 'bg-[#1A1A1A] text-gray-400 hover:text-white'
            }`}
          >
            Tomorrow (D+1)
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Games List */}
          <div className="lg:col-span-1 space-y-4">
            {filteredGames.length === 0 ? (
              <div className="bg-[#1A1A1A] rounded-xl p-8 text-center">
                <p className="text-gray-400">No games in this period</p>
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

          {/* Game Detail / Player Props */}
          <div className="lg:col-span-2">
            {selectedGame ? (
              <GameDetail game={selectedGame} />
            ) : (
              <div className="bg-[#1A1A1A] rounded-xl p-12 text-center">
                <p className="text-gray-400">Select a game to view player props</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
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
    <div className="bg-[#1A1A1A] rounded-xl p-6">
      {/* Game Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${config.class}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass} inline-block mr-1.5`} />
            {config.label}
          </span>
          {game.quarter && (
            <span className="text-sm text-gray-400">
              Q{game.quarter} {game.clock}
            </span>
          )}
        </div>
        <span className="text-sm text-gray-400">
          {formatGameTime(game.gameTime)}
        </span>
      </div>

      {/* Teams & Score */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#333333] flex items-center justify-center text-lg font-bold">
            {game.awayTeam.abbreviation}
          </div>
          <div>
            <p className="text-lg font-semibold">{game.awayTeam.city} {game.awayTeam.name}</p>
            <p className="text-xs text-gray-400">Away</p>
          </div>
        </div>
        <div className="text-center">
          <div className="text-4xl font-bold font-mono">
            {game.awayScore} - {game.homeScore}
          </div>
          <p className="text-xs text-gray-400 mt-1">Current Score</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-lg font-semibold">{game.homeTeam.city} {game.homeTeam.name}</p>
            <p className="text-xs text-gray-400">Home</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-[#333333] flex items-center justify-center text-lg font-bold">
            {game.homeTeam.abbreviation}
          </div>
        </div>
      </div>

      {/* Players would be shown here - simplified for now */}
      <div className="border-t border-[#262626] pt-6">
        <h3 className="text-sm font-medium text-gray-400 mb-4">PLAYERS ON COURT</h3>
        <p className="text-gray-500 text-sm">Player list component will render here with court status and prop colors</p>
      </div>
    </div>
  );
}