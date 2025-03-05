import { Server } from 'socket.io';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Game state interface
interface GameState {
  players: {
    [socketId: string]: {
      id: string;
      name: string;
      score: number;
      answers: number;
      isReady: boolean;
    };
  };
  status: 'waiting' | 'playing' | 'finished';
  startTime?: number;
  endTime?: number;
  duration: number; // in seconds
}

// Game lobbies
const lobbies: {
  [code: string]: {
    gameState: GameState;
    sockets: Set<string>;
  };
} = {};

// Socket.IO server instance
let io: Server;

export async function GET(request: NextRequest) {
  if (!io) {
    // Create a new Socket.IO server if it doesn't exist
    io = new Server({
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
      path: '/api/socket',
      addTrailingSlash: false,
    });

    io.on('connection', (socket) => {
      console.log('New client connected:', socket.id);
      
      // Join a lobby
      socket.on('join-lobby', ({ code, playerName }) => {
        // Create lobby if it doesn't exist
        if (!lobbies[code]) {
          lobbies[code] = {
            gameState: {
              players: {},
              status: 'waiting',
              duration: 60, // Default game duration: 60 seconds
            },
            sockets: new Set(),
          };
        }
        
        // Add player to lobby
        const lobby = lobbies[code];
        lobby.sockets.add(socket.id);
        
        // Add player to game state
        lobby.gameState.players[socket.id] = {
          id: socket.id,
          name: playerName,
          score: 0,
          answers: 0,
          isReady: false,
        };
        
        // Join socket room
        socket.join(code);
        
        // Notify all clients in the lobby
        io.to(code).emit('lobby-update', lobby.gameState);
      });
      
      // Player ready
      socket.on('player-ready', ({ code }) => {
        const lobby = lobbies[code];
        if (!lobby) return;
        
        lobby.gameState.players[socket.id].isReady = true;
        
        // Check if all players are ready
        const allReady = Object.values(lobby.gameState.players).every(
          (player) => player.isReady
        );
        
        // Start game if all players are ready and there are at least 2 players
        if (allReady && Object.keys(lobby.gameState.players).length >= 2) {
          lobby.gameState.status = 'playing';
          lobby.gameState.startTime = Date.now();
          lobby.gameState.endTime = Date.now() + lobby.gameState.duration * 1000;
          
          io.to(code).emit('game-start', lobby.gameState);
          
          // Set timer to end game
          setTimeout(() => {
            if (lobbies[code]) {
              lobbies[code].gameState.status = 'finished';
              io.to(code).emit('game-end', lobbies[code].gameState);
            }
          }, lobby.gameState.duration * 1000);
        }
        
        io.to(code).emit('lobby-update', lobby.gameState);
      });
      
      // Submit answer
      socket.on('submit-answer', ({ code, isCorrect }) => {
        const lobby = lobbies[code];
        if (!lobby || lobby.gameState.status !== 'playing') return;
        
        const player = lobby.gameState.players[socket.id];
        if (!player) return;
        
        player.answers++;
        if (isCorrect) {
          player.score++;
        }
        
        io.to(code).emit('score-update', lobby.gameState);
      });
      
      // Leave lobby
      socket.on('leave-lobby', ({ code }) => {
        leaveGame(socket.id, code);
      });
      
      // Disconnect
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        
        // Remove player from all lobbies
        Object.keys(lobbies).forEach((code) => {
          leaveGame(socket.id, code);
        });
      });
    });
    
    // Helper function to handle a player leaving
    function leaveGame(socketId: string, code: string) {
      const lobby = lobbies[code];
      if (!lobby) return;
      
      // Remove player from game state
      delete lobby.gameState.players[socketId];
      lobby.sockets.delete(socketId);
      
      // Delete lobby if empty
      if (lobby.sockets.size === 0) {
        delete lobbies[code];
        return;
      }
      
      // Notify remaining clients
      io.to(code).emit('lobby-update', lobby.gameState);
    }
  }

  // Handle WebSocket upgrade
  if (request.headers.get('upgrade') === 'websocket') {
    return new NextResponse('WebSocket upgrade', { status: 101 });
  }

  return new NextResponse('Socket.IO server is running', {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; 