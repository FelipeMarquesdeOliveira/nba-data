'use client';

import { useEffect, useRef, useState } from 'react';

interface ScoreDisplayProps {
  homeScore: number;
  awayScore: number;
  quarter?: number;
  clock?: string;
}

function AnimatedNumber({ value, prevValue }: { value: number; prevValue?: number }) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevValueRef = useRef<number | undefined>(prevValue);

  useEffect(() => {
    if (prevValueRef.current !== undefined && prevValueRef.current !== value) {
      setIsAnimating(true);
      setDisplayValue(prevValueRef.current);

      setTimeout(() => {
        setDisplayValue(value);
      }, 50);
    } else {
      setDisplayValue(value);
    }
    prevValueRef.current = value;
  }, [value]);

  return (
    <span
      className={`inline-block text-5xl font-bold font-mono tracking-wider transition-all duration-300 ${
        isAnimating
          ? 'text-yellow-400 scale-110 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]'
          : 'text-white'
      }`}
      style={{
        minWidth: '1.5ch',
        textAlign: 'center',
      }}
    >
      {displayValue}
    </span>
  );
}

function ScoreSection({
  label,
  score,
  prevScore,
  isHome,
}: {
  label: string;
  score: number;
  prevScore?: number;
  isHome: boolean;
}) {
  return (
    <div className={`flex flex-col items-center ${isHome ? 'order-3' : 'order-1'}`}>
      <span className="text-xs text-gray-500 uppercase tracking-widest mb-3">{label}</span>
      <AnimatedNumber value={score} prevValue={prevScore} />
    </div>
  );
}

export default function ScoreDisplay({ homeScore, awayScore, quarter, clock }: ScoreDisplayProps) {
  const prevScoresRef = useRef<{ home: number; away: number } | null>(null);
  const [prevScores, setPrevScores] = useState<{ home: number; away: number } | null>(null);

  useEffect(() => {
    if (prevScoresRef.current === null) {
      prevScoresRef.current = { home: homeScore, away: awayScore };
      return;
    }

    if (
      prevScoresRef.current.home !== homeScore ||
      prevScoresRef.current.away !== awayScore
    ) {
      setPrevScores({ ...prevScoresRef.current });
      prevScoresRef.current = { home: homeScore, away: awayScore };
    }
  }, [homeScore, awayScore]);

  return (
    <div className="text-center">
      {/* Score Display */}
      <div className="flex items-center justify-center gap-6">
        <ScoreSection
          label="Away"
          score={awayScore}
          prevScore={prevScores?.away}
          isHome={false}
        />

        <div className="flex flex-col items-center self-center -mt-6">
          <span className="text-4xl font-bold font-mono text-gray-600">-</span>
        </div>

        <ScoreSection
          label="Home"
          score={homeScore}
          prevScore={prevScores?.home}
          isHome={true}
        />
      </div>

      {/* Quarter & Clock */}
      {(quarter || clock) && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {quarter && (
            <span className="px-2 py-0.5 bg-[#262626] rounded text-xs font-mono text-gray-300 border border-[#333]">
              Q{quarter}
            </span>
          )}
          {clock && (
            <span className="text-sm font-mono text-gray-400">
              {clock}
            </span>
          )}
        </div>
      )}

      <p className="text-xs text-gray-500 mt-3 uppercase tracking-widest">Current Score</p>
    </div>
  );
}
