'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { LiveState } from '@/types';

interface UseWebSocketOptions {
  url: string;
  onMessage?: (data: unknown) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  reconnectInterval?: number;
}

export function useWebSocket({
  url,
  onMessage,
  onConnect,
  onDisconnect,
  reconnectInterval = 3000,
}: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<unknown>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        setIsConnected(true);
        onConnect?.();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
          onMessage?.(data);
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        onDisconnect?.();
        // Attempt reconnect
        reconnectTimeoutRef.current = setTimeout(connect, reconnectInterval);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        ws.close();
      };

      wsRef.current = ws;
    } catch (e) {
      console.error('Failed to connect WebSocket:', e);
      reconnectTimeoutRef.current = setTimeout(connect, reconnectInterval);
    }
  }, [url, onMessage, onConnect, onDisconnect, reconnectInterval]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const sendMessage = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return { isConnected, lastMessage, sendMessage, disconnect, connect };
}

// Hook for subscribing to live game updates
export function useGameSubscription(gameId?: string) {
  const [liveState, setLiveState] = useState<LiveState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleMessage = useCallback((data: unknown) => {
    const msg = data as { type: string; payload?: LiveState };
    if (msg.type === 'LIVE_UPDATE' || msg.type === 'INIT') {
      if (msg.payload) setLiveState(msg.payload);
    }
  }, []);

  const { isConnected, lastMessage } = useWebSocket({
    url: `ws://localhost:3001/ws/live`,
    onMessage: handleMessage,
    onConnect: () => console.log('Connected to live game feed'),
    onDisconnect: () => console.log('Disconnected from live game feed'),
  });

  // Update state when receiving new messages
  useEffect(() => {
    if (lastMessage) {
      handleMessage(lastMessage);
    }
  }, [lastMessage, handleMessage]);

  return { liveState, isConnected, error };
}