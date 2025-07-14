const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: "*",
  credentials: true
}));
app.use(express.json());

// In-memory storage (in production, use a database like MongoDB or PostgreSQL)
const games = new Map();
const players = new Map();

// Game management functions
const createGame = (gameId) => {
  const game = {
    id: gameId,
    state: 'lobby',
    currentRound: 0,
    teams: [],
    responses: [],
    scores: {},
    currentScenario: '',
    roundTimer: 180,
    lastTimerUpdate: Date.now(),
    roundResults: [],
    teamRoundScores: [],
    gameResults: null,
    lastUpdate: Date.now(),
    playerSelections: {},
    createdAt: Date.now()
  };
  games.set(gameId, game);
  return game;
};

const getGame = (gameId) => {
  return games.get(gameId);
};

const updateGame = (gameId, updates) => {
  const game = games.get(gameId);
  if (game) {
    Object.assign(game, updates, { lastUpdate: Date.now() });
    games.set(gameId, game);
  }
  return game;
};

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  console.log('Socket transport:', socket.conn.transport.name);
  
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
  
  socket.on('disconnect', (reason) => {
    console.log('User disconnected:', socket.id, 'Reason:', reason);
    players.delete(socket.id);
  });

  // Join a game room
  socket.on('joinGame', ({ gameId, playerName, teamId, emoji, isAdmin }) => {
    socket.join(gameId);
    
    // Store player info
    players.set(socket.id, { gameId, playerName, teamId, emoji, isAdmin });
    
    // Get or create game
    let game = getGame(gameId);
    if (!game) {
      game = createGame(gameId);
    }

    // Add team if it doesn't exist
    if (teamId && !game.teams.find(t => t.id === teamId)) {
      game.teams.push({
        id: teamId,
        name: teamId,
        color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
        players: [playerName],
        totalScore: 0,
        emoji: emoji || '❓'
      });
      updateGame(gameId, { teams: game.teams });
    } else if (teamId) {
      // Add player to existing team
      const team = game.teams.find(t => t.id === teamId);
      if (team && !team.players.includes(playerName)) {
        team.players.push(playerName);
        updateGame(gameId, { teams: game.teams });
      }
    }

    // Send current game state to the player
    socket.emit('gameState', game);
    
    // Notify other players in the game
    socket.to(gameId).emit('playerJoined', { playerName, teamId, emoji });
  });

  // Start game
  socket.on('startGame', ({ gameId }) => {
    const game = getGame(gameId);
    if (game) {
      const updatedGame = updateGame(gameId, {
        state: 'playing',
        currentRound: 1,
        currentScenario: 'Your first scenario here', // This should come from scenarios array
        roundTimer: 180,
        lastTimerUpdate: Date.now()
      });
      io.to(gameId).emit('gameState', updatedGame);
    }
  });

  // Start round
  socket.on('startRound', ({ gameId }) => {
    const game = getGame(gameId);
    if (game) {
      const updatedGame = updateGame(gameId, {
        state: 'round',
        roundTimer: 180,
        lastTimerUpdate: Date.now(),
        responses: [],
        playerSelections: {}
      });
      io.to(gameId).emit('gameState', updatedGame);
    }
  });

  // Submit response
  socket.on('submitResponse', ({ gameId, teamId, playerId, scriptureId, response }) => {
    const game = getGame(gameId);
    if (game) {
      const newResponse = {
        teamId,
        scriptureId,
        response,
        timestamp: Date.now(),
        speedScore: 0,
        qualityScore: 0
      };
      
      const updatedResponses = [...game.responses, newResponse];
      const updatedGame = updateGame(gameId, { responses: updatedResponses });
      
      io.to(gameId).emit('gameState', updatedGame);
    }
  });

  // Set team round score
  socket.on('setTeamRoundScore', ({ gameId, teamId, roundNumber, speedScore, qualityScore }) => {
    const game = getGame(gameId);
    if (game) {
      const newScore = {
        teamId,
        roundNumber,
        speedScore,
        qualityScore,
        totalScore: speedScore + qualityScore
      };
      
      const existingIndex = game.teamRoundScores.findIndex(
        s => s.teamId === teamId && s.roundNumber === roundNumber
      );
      
      let updatedScores;
      if (existingIndex >= 0) {
        updatedScores = [...game.teamRoundScores];
        updatedScores[existingIndex] = newScore;
      } else {
        updatedScores = [...game.teamRoundScores, newScore];
      }
      
      const updatedGame = updateGame(gameId, { teamRoundScores: updatedScores });
      io.to(gameId).emit('gameState', updatedGame);
    }
  });

  // Next round
  socket.on('nextRound', ({ gameId }) => {
    const game = getGame(gameId);
    if (game) {
      const nextRound = game.currentRound + 1;
      const updatedGame = updateGame(gameId, {
        currentRound: nextRound,
        state: 'playing',
        responses: [],
        playerSelections: {},
        roundResults: []
      });
      io.to(gameId).emit('gameState', updatedGame);
    }
  });

  // End game
  socket.on('endGame', ({ gameId }) => {
    const game = getGame(gameId);
    if (game) {
      const updatedGame = updateGame(gameId, { state: 'results' });
      io.to(gameId).emit('gameState', updatedGame);
    }
  });

  // Player selection update
  socket.on('updatePlayerSelection', ({ gameId, playerId, selectedScripture, teamResponse }) => {
    const game = getGame(gameId);
    if (game) {
      const updatedSelections = {
        ...game.playerSelections,
        [playerId]: { selectedScripture, teamResponse }
      };
      const updatedGame = updateGame(gameId, { playerSelections: updatedSelections });
      io.to(gameId).emit('gameState', updatedGame);
    }
  });

  // Timer update
  socket.on('updateTimer', ({ gameId, timer }) => {
    const game = getGame(gameId);
    if (game) {
      const updatedGame = updateGame(gameId, {
        roundTimer: timer,
        lastTimerUpdate: Date.now()
      });
      io.to(gameId).emit('gameState', updatedGame);
    }
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    players.delete(socket.id);
  });
});

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: Date.now() });
});

app.get('/api/games/:gameId', (req, res) => {
  const game = getGame(req.params.gameId);
  if (game) {
    res.json(game);
  } else {
    res.status(404).json({ error: 'Game not found' });
  }
});

app.get('/api/games', (req, res) => {
  const gameList = Array.from(games.values()).map(game => ({
    id: game.id,
    state: game.state,
    currentRound: game.currentRound,
    teams: game.teams,
    createdAt: game.createdAt
  }));
  res.json(gameList);
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../build', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}); 