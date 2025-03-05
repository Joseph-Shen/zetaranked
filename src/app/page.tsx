'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateInviteCode, validateInviteCode } from '@/utils/inviteCode';

export default function Home() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');

  // Create a new game lobby
  const createLobby = () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    const code = generateInviteCode();
    router.push(`/lobby/${code}?name=${encodeURIComponent(playerName)}`);
  };

  // Join an existing lobby
  const joinLobby = () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!inviteCode.trim()) {
      setError('Please enter an invite code');
      return;
    }

    if (!validateInviteCode(inviteCode)) {
      setError('Invalid invite code format');
      return;
    }

    router.push(`/lobby/${inviteCode}?name=${encodeURIComponent(playerName)}`);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <main className="flex flex-col items-center justify-center w-full max-w-md">
        <h1 className="text-4xl font-bold text-center mb-2 text-blue-600 dark:text-blue-400">ZetaRanked</h1>
        <h2 className="text-xl text-center mb-8 text-gray-600 dark:text-gray-300">1v1 Arithmetic Battle</h2>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full">
          <div className="mb-4">
            <label htmlFor="playerName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Your Name
            </label>
            <input
              type="text"
              id="playerName"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
            />
          </div>
          
          <div className="flex flex-col gap-4 mt-6">
            <button
              onClick={createLobby}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
            >
              Create New Game
            </button>
            
            <div className="relative flex items-center">
              <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
              <span className="flex-shrink mx-4 text-gray-500 dark:text-gray-400">or</span>
              <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Invite Code
              </label>
              <input
                type="text"
                id="inviteCode"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white uppercase"
                placeholder="Enter invite code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                maxLength={6}
              />
            </div>
            
            <button
              onClick={joinLobby}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
            >
              Join Game
            </button>
          </div>
          
          {error && (
            <p className="mt-4 text-red-500 text-center">{error}</p>
          )}
        </div>
        
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Solve arithmetic problems faster than your opponent!</p>
          <p className="mt-1">Addition, subtraction, multiplication, and division.</p>
        </div>
      </main>
    </div>
  );
}
