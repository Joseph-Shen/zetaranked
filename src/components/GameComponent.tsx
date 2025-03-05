'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useArithmeticGame } from '@/hooks/useArithmeticGame';
import { formatProblem } from '@/utils/arithmetic';

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

interface GameComponentProps {
  gameState: GameState;
  code: string;
  playerName: string;
}

export default function GameComponent({ gameState, code, playerName }: GameComponentProps) {
  const { socket, submitAnswer } = useSocket();
  const [timeLeft, setTimeLeft] = useState(gameState.duration);
  
  // Handle correct/incorrect answers
  const handleCorrectAnswer = useCallback(() => {
    console.log(`Handling correct answer for code: ${code}`);
    submitAnswer(code, true);
  }, [submitAnswer, code]);
  
  const handleIncorrectAnswer = useCallback(() => {
    console.log(`Handling incorrect answer for code: ${code}`);
    submitAnswer(code, false);
  }, [submitAnswer, code]);
  
  // Initialize the arithmetic game
  const {
    problem,
    userAnswer,
    setUserAnswer,
    submitAnswer: submitGameAnswer,
  } = useArithmeticGame({
    isPlaying: gameState.status === 'playing',
    onCorrectAnswer: handleCorrectAnswer,
    onIncorrectAnswer: handleIncorrectAnswer,
  });
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and negative sign
    const value = e.target.value;
    setUserAnswer(value);
  };
  
  // We no longer need the form submission handler since we auto-advance
  // But we'll keep it for keyboard accessibility
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // The submitAnswer function will only advance if the answer is correct
    submitGameAnswer();
  };
  
  
  // Update timer
  useEffect(() => {
    if (gameState.status !== 'playing' || !gameState.endTime) return;
    
    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((gameState.endTime! - now) / 1000));
      
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [gameState.status, gameState.endTime]);
  
  // Get current player
  const currentPlayer = socket && socket.id ? gameState.players[socket.id] : null;
  
  // Get opponent player(s)
  const opponents = Object.values(gameState.players).filter(
    (player) => player.id !== (socket?.id || '')
  );
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">
            {playerName}'s Game
          </h1>
          <div className="text-xl font-bold text-red-600 dark:text-red-400">
            {timeLeft}s
          </div>
        </div>
        
        {/* Timer */}
        <div className="mb-6 flex justify-center">
          <div className="bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            <span className="font-mono font-bold text-xl text-gray-800 dark:text-white">
              {timeLeft}s
            </span>
          </div>
        </div>
        
        {/* Scores */}
        <div className="mb-6 grid grid-cols-2 gap-4">
          {/* Current player */}
          <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-md text-center">
            <div className="font-bold text-blue-800 dark:text-blue-200">You</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-300">
              {currentPlayer?.score || 0}
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-400">
              problems solved
            </div>
          </div>
          
          {/* Opponent */}
          <div className="bg-red-100 dark:bg-red-900 p-3 rounded-md text-center">
            <div className="font-bold text-red-800 dark:text-red-200">
              {opponents[0]?.name || 'Opponent'}
            </div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-300">
              {opponents[0]?.score || 0}
            </div>
            <div className="text-sm text-red-600 dark:text-red-400">
              problems solved
            </div>
          </div>
        </div>
        
        {/* Problem */}
        <div className="mb-6">
          <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md flex items-center justify-center">
            <span className="text-3xl font-bold text-gray-800 dark:text-white">
              {problem ? formatProblem(problem) : '...'}
            </span>
          </div>
        </div>
        
        {/* Answer input */}
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="flex items-center">
            <input
              type="text"
              className="w-full px-4 py-3 text-xl font-bold text-center border-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white border-gray-300 dark:border-gray-600"
              placeholder="Enter answer"
              value={userAnswer}
              onChange={handleInputChange}
              autoFocus
            />
          </div>
        </form>
        
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Type the correct answer to automatically advance to the next problem.</p>
          <p className="mt-1">You must answer correctly to proceed!</p>
        </div>
      </div>
    </div>
  );
} 