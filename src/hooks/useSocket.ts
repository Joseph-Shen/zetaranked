import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface Player {
  id: string;
  name: string;
  score: number;
  isReady: boolean;
}

interface GameState {
  players: {
    [socketId: string]: Player;
  };
  status: 'waiting' | 'playing' | 'finished';
  startTime?: number;
  endTime?: number;
  duration: number;
}

interface UseSocketReturn {
  socket: Socket | null;
  gameState: GameState | null;
  joinLobby: (code: string, playerName: string) => void;
  leaveLobby: (code: string) => void;
  setReady: (code: string) => void;
  submitAnswer: (code: string, isCorrect: boolean) => void;
  isConnected: boolean;
}

// Create a singleton socket instance to prevent multiple connections
let socketInstance: Socket | null = null;
// Track connection state globally
let isSocketConnected = false;

export function useSocket(): UseSocketReturn {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(isSocketConnected);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const socketIdRef = useRef<string | null>(null);
  const currentLobbyRef = useRef<string | null>(null);
  const playerNameRef = useRef<string | null>(null);
  
  // Initialize socket connection
  useEffect(() => {
    // Create socket connection if it doesn't exist
    if (!socketInstance) {
      socketInstance = io({
        path: '/api/socket',
        autoConnect: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        transports: ['websocket', 'polling'],
      });
    }
    
    // Set initial connected state
    setIsConnected(socketInstance.connected);
    isSocketConnected = socketInstance.connected;
    
    // Set up event listeners
    const handleConnect = () => {
      console.log('Connected to socket server with ID:', socketInstance?.id);
      setIsConnected(true);
      isSocketConnected = true;
      socketIdRef.current = socketInstance?.id || null;
      
      // Rejoin lobby if we were in one before reconnecting
      if (currentLobbyRef.current && playerNameRef.current) {
        console.log(`Rejoining lobby ${currentLobbyRef.current} as ${playerNameRef.current}`);
        socketInstance?.emit('join-lobby', { 
          code: currentLobbyRef.current, 
          playerName: playerNameRef.current 
        });
      }
    };
    
    const handleDisconnect = () => {
      console.log('Disconnected from socket server');
      setIsConnected(false);
      isSocketConnected = false;
    };
    
    const handleConnectError = (err: Error) => {
      console.error('Connection error:', err);
      setIsConnected(false);
      isSocketConnected = false;
    };
    
    const handleLobbyUpdate = (updatedGameState: GameState) => {
      console.log('Lobby update received:', updatedGameState);
      setGameState(updatedGameState);
    };
    
    const handleGameStart = (updatedGameState: GameState) => {
      console.log('Game start received:', updatedGameState);
      setGameState(updatedGameState);
    };
    
    const handleScoreUpdate = (updatedGameState: GameState) => {
      console.log('Score update received:', updatedGameState);
      setGameState(updatedGameState);
    };
    
    const handleGameEnd = (updatedGameState: GameState) => {
      console.log('Game end received:', updatedGameState);
      setGameState(updatedGameState);
    };
    
    // Add event listeners
    socketInstance.on('connect', handleConnect);
    socketInstance.on('disconnect', handleDisconnect);
    socketInstance.on('connect_error', handleConnectError);
    socketInstance.on('lobby-update', handleLobbyUpdate);
    socketInstance.on('game-start', handleGameStart);
    socketInstance.on('score-update', handleScoreUpdate);
    socketInstance.on('game-end', handleGameEnd);
    
    // If already connected, trigger the connect handler
    if (socketInstance.connected) {
      handleConnect();
    }
    
    // Set socket instance
    setSocket(socketInstance);
    
    // Clean up on unmount
    return () => {
      // Remove event listeners but don't disconnect
      socketInstance?.off('connect', handleConnect);
      socketInstance?.off('disconnect', handleDisconnect);
      socketInstance?.off('connect_error', handleConnectError);
      socketInstance?.off('lobby-update', handleLobbyUpdate);
      socketInstance?.off('game-start', handleGameStart);
      socketInstance?.off('score-update', handleScoreUpdate);
      socketInstance?.off('game-end', handleGameEnd);
    };
  }, []);
  
  // Join a lobby
  const joinLobby = useCallback((code: string, playerName: string) => {
    if (socketInstance && (socketInstance.connected || isSocketConnected)) {
      console.log('Joining lobby:', code, playerName, 'Connected:', socketInstance.connected);
      currentLobbyRef.current = code;
      playerNameRef.current = playerName;
      socketInstance.emit('join-lobby', { code, playerName });
    } else {
      console.warn('Cannot join lobby: socket not connected');
    }
  }, []);
  
  // Leave a lobby
  const leaveLobby = useCallback((code: string) => {
    if (socketInstance && (socketInstance.connected || isSocketConnected)) {
      socketInstance.emit('leave-lobby', { code });
      currentLobbyRef.current = null;
      playerNameRef.current = null;
      setGameState(null);
    }
  }, []);
  
  // Set player as ready
  const setReady = useCallback((code: string) => {
    if (socketInstance && (socketInstance.connected || isSocketConnected)) {
      console.log('Setting ready for code:', code);
      socketInstance.emit('player-ready', { code });
    } else {
      console.warn('Cannot set ready: socket not connected');
    }
  }, []);
  
  // Submit an answer
  const submitAnswer = useCallback((code: string, isCorrect: boolean) => {
    if (socketInstance && (socketInstance.connected || isSocketConnected)) {
      console.log(`Submitting answer: code=${code}, isCorrect=${isCorrect}, socketId=${socketInstance.id}, connected=${socketInstance.connected}`);
      // Ensure isCorrect is a boolean
      socketInstance.emit('submit-answer', { code, isCorrect: Boolean(isCorrect) });
    } else {
      console.warn(`Cannot submit answer: socket=${!!socketInstance}, isConnected=${isConnected}, socketConnected=${socketInstance?.connected}, gameStatus=${gameState?.status}`);
    }
  }, [isConnected, gameState]);
  
  return {
    socket,
    gameState,
    joinLobby,
    leaveLobby,
    setReady,
    submitAnswer,
    isConnected,
  };
} 