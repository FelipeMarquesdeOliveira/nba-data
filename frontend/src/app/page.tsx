'use client';

import { useState, useEffect, useRef } from 'react';
import type { Game, CourtStatus, PlayerGameStats, Player } from '@/types';
import { getCourtStatus, formatGameTime } from '@/types';
import GameCard from '@/components/GameCard';
import ScoreDisplay from '@/components/ScoreDisplay';
import ExpectedLineup from '@/components/ExpectedLineup';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function Home() {
  const [games, setGames] = useState<Game[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'live' | 'soon' | 'final'>('all');
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchGames() {
      try {
        const res = await fetch(`${API_URL}/api/games`);
        const data = await res.json();
        setGames(data.data || []);
      } catch (error) {
        console.error('Failed to fetch games:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchGames();
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

  if (isLoading) {
    return (
      <div className="flex h-screen bg-[#0A0A0A] text-white items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">🏀</div>
          <p className="text-sm text-gray-400">Loading games...</p>
        </div>
      </div>
    );
  }

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
  const [playersData, setPlayersData] = useState<{ home: PlayerGameStats[]; away: PlayerGameStats[] } | null>(null);
  const [lineupData, setLineupData] = useState<{ home: Player[]; away: Player[] } | null>(null);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);
  const previousPlayersRef = useRef<{ home: string[]; away: string[] } | null>(null);

  // WebSocket for real-time updates
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: NodeJS.Timeout | null = null;
    let isMounted = true;
    const gameId = game.id;

    function connect() {
      if (!isMounted || !gameId) return;
      if (ws?.readyState === WebSocket.OPEN) return;

      try {
        ws = new WebSocket('ws://localhost:3001/ws/live');

        ws.onopen = () => {
          if (!isMounted) return;
          console.log('[WS] Connected, listening for updates on game:', gameId);
          setWsConnected(true);
        };

        ws.onclose = () => {
          if (!isMounted) return;
          console.log('[WS] Disconnected from game:', gameId);
          setWsConnected(false);
          ws = null;
        };

        ws.onerror = (error) => {
          if (!isMounted) return;
          console.error('[WS] Error:', error);
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const msg = JSON.parse(event.data);

            // Handle PLAYERS_UPDATE - real-time substitutions and points
            if (msg.type === 'PLAYERS_UPDATE' && msg.payload?.gameId === gameId) {
              const newData = msg.payload.playersOnCourt;

              // Detect substitutions - prev.home/away are string[] (playerIds), newData.home/away are PlayerGameStats[]
              const prev = previousPlayersRef.current;
              if (prev) {
                const homeIn = newData.home.filter(p => !prev.home.includes(p.playerId));
                const homeOut = prev.home.filter(id => !newData.home.some(p => p.playerId === id));
                const awayIn = newData.away.filter(p => !prev.away.includes(p.playerId));
                const awayOut = prev.away.filter(id => !newData.away.some(p => p.playerId === id));

                if (homeIn.length > 0 || homeOut.length > 0) {
                  const team = game.homeTeam.abbreviation;
                  if (homeIn.length > 0) setNotifications(n => [...n, `⬆️ ${homeIn.map(p => p.player.fullName).join(', ')} entered for ${team}`]);
                  if (homeOut.length > 0) setNotifications(n => [...n, `⬇️ ${awayOut.map(id => findPlayerName(id, prev.home) || id).join(', ')} left ${team}`]);
                }
                if (awayIn.length > 0 || awayOut.length > 0) {
                  const team = game.awayTeam.abbreviation;
                  if (awayIn.length > 0) setNotifications(n => [...n, `⬆️ ${awayIn.map(p => p.player.fullName).join(', ')} entered for ${team}`]);
                  if (awayOut.length > 0) setNotifications(n => [...n, `⬇️ ${awayOut.map(id => findPlayerName(id, prev.away) || id).join(', ')} left ${team}`]);
                }
              }

              previousPlayersRef.current = {
                home: newData.home.map(p => p.playerId),
                away: newData.away.map(p => p.playerId),
              };
              setPlayersData(newData);
            }

            // Handle SCORE_UPDATE - real-time score changes
            if (msg.type === 'SCORE_UPDATE' && msg.payload?.gameId === gameId) {
              console.log('[WS] SCORE_UPDATE received:', msg.payload);
              // Update game state with new score
              setSelectedGame(prev => prev ? {
                ...prev,
                homeScore: msg.payload.homeScore,
                awayScore: msg.payload.awayScore,
                quarter: msg.payload.quarter,
                clock: msg.payload.clock,
              } : prev);
            } else if (msg.type === 'SCORE_UPDATE') {
              console.log('[WS] SCORE_UPDATE for different game:', msg.payload?.gameId, 'expected:', gameId);
            }
          } catch {
            // ignore parse errors
          }
        };
      } catch (e) {
        console.error('[WS] Connection error:', e);
      }
    }

    reconnectTimer = setTimeout(connect, 500);

    return () => {
      isMounted = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) {
        ws.onclose = null;
        ws.close();
        ws = null;
      }
    };
  }, [game.id]);

  // Helper to find player name by ID
  function findPlayerName(playerId: string, players: PlayerGameStats[]): string | undefined {
    return players.find(p => p.playerId === playerId)?.player.fullName;
  }

  // Initial fetch + periodic refresh
  useEffect(() => {
    if (game.status === 'In Progress' || game.status === 'Final') {
      setLoadingPlayers(true);
      fetch(`${API_URL}/api/games/${game.id}/players`)
        .then(res => res.json())
        .then(data => {
          const onCourt = data.data?.onCourt || { home: [], away: [] };
          setPlayersData(onCourt);
          previousPlayersRef.current = {
            home: onCourt.home.map(p => p.playerId),
            away: onCourt.away.map(p => p.playerId),
          };
        })
        .catch(err => console.error('Failed to fetch players:', err))
        .finally(() => setLoadingPlayers(false));

      // Also fetch lineup with status
      fetch(`${API_URL}/api/games/${game.id}/lineup`)
        .then(res => res.json())
        .then(data => {
          if (data.data) {
            setLineupData(data.data);
          }
        })
        .catch(err => console.error('Failed to fetch lineup:', err));
    } else if (game.status === 'Scheduled') {
      // For scheduled games, only fetch lineup (no on-court players yet)
      fetch(`${API_URL}/api/games/${game.id}/lineup`)
        .then(res => res.json())
        .then(data => {
          if (data.data) {
            setLineupData(data.data);
          }
        })
        .catch(err => console.error('Failed to fetch lineup:', err));
    }
  }, [game]);

  const statusConfig = {
    LIVE: { label: 'LIVE', class: 'status-live', dotClass: 'bg-red-500 animate-pulse-live' },
    SOON: { label: 'SOON', class: 'status-soon', dotClass: 'bg-yellow-500' },
    FUTURE: { label: 'FUTURE', class: 'status-future', dotClass: 'bg-blue-500' },
    FINISHED: { label: 'FINISHED', class: 'status-finished', dotClass: 'bg-gray-500' },
  };

  const config = statusConfig[status];

  return (
    <div className="bg-[#121212] border border-[#1A1A1A] rounded-xl p-8 max-w-4xl mx-auto mt-8">
      {/* Substitution Notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2 max-w-xs">
          {notifications.slice(-3).map((notif, i) => (
            <div key={i} className="bg-[#1A1A1A] border border-[#333] rounded-lg px-4 py-3 text-sm animate-pulse">
              {notif}
            </div>
          ))}
        </div>
      )}

      {/* WebSocket Status */}
      <div className="absolute top-4 right-4 flex items-center gap-2 text-xs">
        <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-gray-500">{wsConnected ? 'Live' : 'Disconnected'}</span>
      </div>

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
          {game.awayTeam.logo ? (
            <img src={game.awayTeam.logo} alt={game.awayTeam.abbreviation} className="w-16 h-16 rounded-full object-contain" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-[#1A1A1A] border border-[#262626] flex items-center justify-center text-xl font-bold">
              {game.awayTeam.abbreviation}
            </div>
          )}
          <div>
            <p className="text-xl font-bold">{game.awayTeam.city} {game.awayTeam.name}</p>
            <p className="text-sm text-gray-500">Away</p>
          </div>
        </div>
        <div className="text-center w-1/3">
          <ScoreDisplay
            homeScore={game.homeScore}
            awayScore={game.awayScore}
            quarter={game.quarter}
            clock={game.clock}
          />
        </div>
        <div className="flex items-center justify-end gap-6 w-1/3">
          <div className="text-right">
            <p className="text-xl font-bold">{game.homeTeam.city} {game.homeTeam.name}</p>
            <p className="text-sm text-gray-500">Home</p>
          </div>
          {game.homeTeam.logo ? (
            <img src={game.homeTeam.logo} alt={game.homeTeam.abbreviation} className="w-16 h-16 rounded-full object-contain" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-[#1A1A1A] border border-[#262626] flex items-center justify-center text-xl font-bold">
              {game.homeTeam.abbreviation}
            </div>
          )}
        </div>
      </div>

      {/* Players on Court / Expected Lineup */}
      <div className="border-t border-[#1A1A1A] pt-8">
        <h3 className="text-xs font-bold tracking-widest text-gray-500 uppercase mb-6">
          {game.status === 'Scheduled' ? 'Expected Lineup' : 'Players on Court'}
        </h3>
        {game.status === 'Scheduled' ? (
          // Show Expected Lineup for scheduled games
          lineupData ? (
            <div className="grid grid-cols-2 gap-8">
              <ExpectedLineup
                players={lineupData.away}
                teamAbbr={game.awayTeam.abbreviation}
                label={`${game.awayTeam.abbreviation} (Away)`}
              />
              <ExpectedLineup
                players={lineupData.home}
                teamAbbr={game.homeTeam.abbreviation}
                label={`${game.homeTeam.abbreviation} (Home)`}
              />
            </div>
          ) : (
            <div className="bg-[#0A0A0A] rounded-lg p-12 text-center border border-[#1A1A1A] border-dashed">
              <p className="text-gray-500 text-sm">Loading lineup...</p>
            </div>
          )
        ) : loadingPlayers ? (
          <div className="bg-[#0A0A0A] rounded-lg p-12 text-center border border-[#1A1A1A] border-dashed">
            <p className="text-gray-500 text-sm">Loading players...</p>
          </div>
        ) : playersData && (playersData.home.length > 0 || playersData.away.length > 0) ? (
          <div className="grid grid-cols-2 gap-8">
            <div className="bg-[#0A0A0A] rounded-lg p-6 border border-[#1A1A1A]">
              <p className="text-xs text-gray-500 uppercase mb-4">{game.awayTeam.abbreviation} (Away)</p>
              <div className="space-y-3">
                {playersData.away.map((p, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-8 text-center text-gray-600 font-mono text-xs">{p.player.jerseyNumber}</span>
                      <div>
                        <p className="text-sm font-medium">{p.player.fullName}</p>
                        <p className="text-xs text-gray-500">{p.player.position}</p>
                      </div>
                    </div>
                    <span className="font-mono text-sm text-white">{p.points} pts</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[#0A0A0A] rounded-lg p-6 border border-[#1A1A1A]">
              <p className="text-xs text-gray-500 uppercase mb-4">{game.homeTeam.abbreviation} (Home)</p>
              <div className="space-y-3">
                {playersData.home.map((p, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-8 text-center text-gray-600 font-mono text-xs">{p.player.jerseyNumber}</span>
                      <div>
                        <p className="text-sm font-medium">{p.player.fullName}</p>
                        <p className="text-xs text-gray-500">{p.player.position}</p>
                      </div>
                    </div>
                    <span className="font-mono text-sm text-white">{p.points} pts</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#0A0A0A] rounded-lg p-12 text-center border border-[#1A1A1A] border-dashed">
            <p className="text-gray-500 text-sm">Player tracking data will be updated during live games</p>
          </div>
        )}
      </div>
    </div>
  );
}