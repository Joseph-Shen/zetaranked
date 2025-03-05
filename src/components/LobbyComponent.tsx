'use client';

import { useSocket } from '@/hooks/useSocket';

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

interface LobbyComponentProps {
  gameState: GameState | null;
  code: string;
  setReady: (code: string) => void;
  copyInviteCode: () => void;
  copied: boolean;
  goToHome: () => void;
}

export default function LobbyComponent({
  gameState,
  code,
  setReady,
  copyInviteCode,
  copied,
  goToHome,
}: LobbyComponentProps) {
  const { socket } = useSocket();
  
  // Get current player
  const currentPlayer = socket && socket.id && gameState?.players ? gameState.players[socket.id] : null;
  
  // Check if all players are ready
  const allPlayersReady = gameState 
    ? Object.values(gameState.players).every(player => player.isReady)
    : false;
  
  // Check if we have enough players (at least 2)
  const enoughPlayers = gameState 
    ? Object.keys(gameState.players).length >= 2
    : false;
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-2 text-gray-800 dark:text-white">
          Game Lobby
        </h1>
        
        <div className="flex items-center justify-center mb-6">
          <div className="bg-gray-100 dark:bg-gray-700 rounded-md px-3 py-2 flex items-center">
            <span className="text-gray-700 dark:text-gray-300 mr-2">Invite Code:</span>
            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{code}</span>
            <button
              onClick={copyInviteCode}
              className="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              title="Copy to clipboard"
            >
              {copied ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                  <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                </svg>
              )}
            </button>
          </div>
        </div>
        
        <div className="mb-6">
          <h2 className="text-lg font-medium mb-2 text-gray-700 dark:text-gray-300">Players:</h2>
          <div className="space-y-2">
            {gameState && Object.values(gameState.players).map((player) => (
              <div 
                key={player.id} 
                className={`flex justify-between items-center p-3 rounded-md ${
                  player.id === socket?.id 
                    ? 'bg-blue-100 dark:bg-blue-900' 
                    : 'bg-gray-100 dark:bg-gray-700'
                }`}
              >
                <span className="font-medium">{player.name}</span>
                <span 
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    player.isReady 
                      ? 'bg-green-500 text-white' 
                      : 'bg-yellow-500 text-white'
                  }`}
                >
                  {player.isReady ? 'Ready' : 'Not Ready'}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex flex-col gap-3">
          {!currentPlayer?.isReady ? (
            <button
              onClick={() => setReady(code)}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
            >
              I&apos;m Ready
            </button>
          ) : (
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md text-center">
              <p className="text-gray-700 dark:text-gray-300">
                {enoughPlayers 
                  ? allPlayersReady 
                    ? 'Starting game...' 
                    : 'Waiting for other players to be ready...'
                  : 'Waiting for at least one more player to join...'}
              </p>
            </div>
          )}
          
          <button
            onClick={goToHome}
            className="bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-md transition-colors"
          >
            Leave Lobby
          </button>
        </div>
        
        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Game will start when all players are ready.</p>
          <p className="mt-1">You need at least 2 players to start.</p>
        </div>
      </div>
    </div>
  );
} 