'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import GameComponent from '@/components/GameComponent';
import LobbyComponent from '@/components/LobbyComponent';

export default function LobbyPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const code = params.code as string;
  const playerName = searchParams.get('name') || 'Player';
  
  const { socket, gameState, joinLobby, leaveLobby, setReady, isConnected } = useSocket();
  const [copied, setCopied] = useState(false);
  
  // Join the lobby when the component mounts
  useEffect(() => {
    if (isConnected) {
      joinLobby(code, playerName);
    }
    
    // Leave the lobby when the component unmounts
    return () => {
      if (isConnected) {
        leaveLobby(code);
      }
    };
  }, [isConnected, joinLobby, leaveLobby, code, playerName]);
  
  // Handle copying the invite code to clipboard
  const copyInviteCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  // Handle going back to home
  const goToHome = () => {
    router.push('/');
  };
  
  // If not connected to socket yet, show loading
  if (!isConnected) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">Connecting to server...</h2>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    );
  }
  
  // If game is in progress, show the game component
  if (gameState?.status === 'playing') {
    return <GameComponent gameState={gameState} code={code} playerName={playerName} />;
  }
  
  // If game is finished, show the results
  if (gameState?.status === 'finished') {
    // Calculate the winner
    const players = Object.values(gameState.players);
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    const winner = sortedPlayers[0];
    const isWinner = winner?.id === socket?.id;
    const isTie = sortedPlayers.length > 1 && sortedPlayers[0].score === sortedPlayers[1].score;
    
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
          <h1 className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-white">
            Game Over!
          </h1>
          
          {isTie ? (
            <h2 className="text-xl font-semibold text-center mb-4 text-yellow-500">It's a tie!</h2>
          ) : (
            <h2 className="text-xl font-semibold text-center mb-4 text-green-500">
              {isWinner ? 'You won!' : `${winner?.name} won!`}
            </h2>
          )}
          
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2 text-gray-700 dark:text-gray-300">Final Scores:</h3>
            <div className="space-y-2">
              {sortedPlayers.map((player) => (
                <div 
                  key={player.id} 
                  className={`flex justify-between items-center p-3 rounded-md ${
                    player.id === socket?.id 
                      ? 'bg-blue-100 dark:bg-blue-900' 
                      : 'bg-gray-100 dark:bg-gray-700'
                  }`}
                >
                  <span className="font-medium">{player.name}</span>
                  <span className="font-bold">{player.score} problems solved</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-8 flex justify-center">
            <button
              onClick={goToHome}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Otherwise, show the lobby component
  return (
    <LobbyComponent 
      gameState={gameState} 
      code={code} 
      setReady={setReady} 
      copyInviteCode={copyInviteCode} 
      copied={copied} 
      goToHome={goToHome}
    />
  );
} 