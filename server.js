const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Game state interface
const lobbies = {};

// Track last answer submission time for each player to prevent duplicates
const lastSubmissionTimes = {};

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Initialize Socket.IO
  const io = new Server(server, {
    path: '/api/socket',
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Socket.IO connection handler
  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    
    // Join a lobby
    socket.on('join-lobby', ({ code, playerName }) => {
      console.log(`Player ${socket.id} joining lobby ${code} as ${playerName}`);
      
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
        isReady: false,
      };
      
      // Join socket room
      socket.join(code);
      
      // Log all players in the lobby
      console.log(`Players in lobby ${code}:`, Object.keys(lobby.gameState.players));
      
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
      console.log(`Received answer submission: code=${code}, isCorrect=${isCorrect}, socketId=${socket.id}`);
      
      try {
        // Check if the lobby exists
        if (!lobbies[code]) {
          console.log(`Lobby with code ${code} not found`);
          return;
        }
        
        const lobby = lobbies[code];
        
        // Log all players in the lobby
        console.log(`Players in lobby ${code}:`, Object.keys(lobby.gameState.players));
        
        // Check if the game is in progress
        if (lobby.gameState.status !== 'playing') {
          console.log(`Game not in playing state: ${lobby.gameState.status}`);
          return;
        }
        
        // Check if the player exists in the lobby
        let playerId = socket.id;
        let player = lobby.gameState.players[playerId];
        
        if (!player) {
          console.log(`Player ${socket.id} not found in lobby ${code}`);
          
          // Try to find the player by matching the socket ID prefix
          const matchingPlayerId = Object.keys(lobby.gameState.players).find(id => 
            socket.id.startsWith(id) || id.startsWith(socket.id)
          );
          
          if (matchingPlayerId) {
            console.log(`Found matching player ID: ${matchingPlayerId}`);
            playerId = matchingPlayerId;
            player = lobby.gameState.players[matchingPlayerId];
          } else {
            console.log('No matching player ID found');
            return;
          }
        }
        
        // Prevent duplicate submissions (debounce)
        const now = Date.now();
        const lastSubmissionTime = lastSubmissionTimes[playerId] || 0;
        
        if (now - lastSubmissionTime < 1) { // 10 ms debounce
          console.log(`Ignoring duplicate submission from ${playerId} (too soon)`);
          return;
        }
        
        lastSubmissionTimes[playerId] = now;
        
        console.log(`Before update: player.score=${player.score}, isCorrect=${isCorrect}`);
        
        // Only increment score if the answer is correct
        if (isCorrect === true) {
          player.score++;
          console.log(`Incremented score for player ${playerId} to ${player.score}`);
        } else {
          console.log(`Answer was incorrect, score remains ${player.score}`);
        }
        
        // Make sure to emit the updated game state to all clients
        io.to(code).emit('score-update', JSON.parse(JSON.stringify(lobby.gameState)));
        
        console.log('Score update emitted to all clients in lobby');
      } catch (error) {
        console.error('Error processing answer submission:', error);
      }
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
  function leaveGame(socketId, code) {
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

  // Start the server
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
  });
}); 