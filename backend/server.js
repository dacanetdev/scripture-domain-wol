const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
require('dotenv').config();

// Game scenarios based on scripture cases
const scenarios = [
  "📘 José Smith—Historia 1:15–20 - Estás enseñando a alguien que duda de que Dios y Jesucristo sean reales o distintos. Le compartes la experiencia de la Primera Visión, testificando que Dios sigue hablando hoy y que tiene un plan para nosotros.",
  "📘 DyC 1:30 - Una amiga te pregunta por qué insistes en tu religión si 'todas enseñan a ser buenas personas'. Le explicas que el Señor mismo restauró Su Iglesia y autoridad por medio de un profeta.",
  "📘 DyC 1:37–38 - Un joven investigando la Iglesia se pregunta por qué los miembros siguen tanto al presidente de la Iglesia. Le enseñas que cuando los profetas hablan, es como si Dios mismo hablara.",
  "📘 DyC 6:36 - Un joven con ansiedad por el futuro te pregunta cómo mantenerse positivo. Le compartes cómo mirar a Cristo ha traído paz a tu vida, y que la fe en Él reemplaza el miedo.",
  "📘 DyC 8:2–3 - Estás enseñando sobre la oración, y una persona dice que no ha 'sentido nada' al orar. Le compartes esta escritura para explicarle que la revelación puede venir como claridad mental.",
  "📘 DyC 13:1 - Un joven te pregunta por qué necesita bautizarse de nuevo si ya fue bautizado en otra iglesia. Le enseñas que el sacerdocio con la autoridad de Dios fue restaurado.",
  "📘 DyC 18:10–11 - Una joven investigadora se siente inútil por errores pasados. Le compartes esta escritura para enseñarle que para Dios su alma tiene valor eterno.",
  "📘 DyC 18:15–16 - Un amigo miembro no quiere ir a la misión. Le compartes esta escritura y tu testimonio de cómo ayudar a otros a conocer el evangelio trae gozo real.",
  "📘 DyC 19:16–19 - Estás hablando con alguien que cree que Dios no entiende su sufrimiento. Le enseñas sobre la Expiación de Cristo, y cómo Él ya sufrió todo lo que sentimos.",
  "📘 DyC 21:4–6 - Una joven dice que los profetas 'sólo dan su opinión'. Le enseñas este versículo para mostrar que los profetas verdaderos hablan en nombre de Dios.",
  "📘 DyC 29:10–11 - Un amigo teme que el mundo va de mal en peor. Le compartes esta escritura para mostrarle que Cristo vendrá de nuevo y traerá paz y justicia.",
  "📘 DyC 49:15–17 - Un joven dice que ya no cree en el matrimonio por todo lo que ha visto. Le enseñas que el matrimonio es un mandamiento divino y parte del plan eterno de Dios."
];

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
const gameTimers = new Map(); // Store active timers for each game

// Game management functions
const createGame = (gameId) => {
  const gameCode = gameId.slice(-6); // Last 6 digits as the game code
  const game = {
    id: gameId,
    gameCode: gameCode, // Add short game code for easy lookup
    state: 'lobby',
    currentRound: 0,
    teams: [],
    responses: [],
    scores: {},
    currentScenario: '',
    roundTimer: 150,
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
  console.log('Getting game for ID/code:', gameId);
  console.log('Available games:', Array.from(games.keys()));
  
  // First try exact match by gameId
  let game = games.get(gameId);
  
  // If not found, try to find by gameCode
  if (!game) {
    console.log('Trying to find game by gameCode:', gameId);
    for (const [fullGameId, gameData] of games.entries()) {
      if (gameData.gameCode === gameId) {
        console.log('Found game by gameCode:', { gameCode: gameId, fullId: fullGameId });
        game = gameData;
        break;
      }
    }
  }
  
  if (game) {
    console.log('Retrieved game:', { 
      gameId: game.id, 
      gameCode: game.gameCode,
      state: game.state, 
      currentRound: game.currentRound, 
      currentScenario: game.currentScenario ? 'Set' : 'Not set' 
    });
  } else {
    console.log('Game not found for retrieval:', gameId);
  }
  return game;
};

const updateGame = (gameId, updates) => {
  console.log('Updating game:', { gameId, updates });
  
  // First try exact match by gameId
  let game = games.get(gameId);
  let actualGameId = gameId;
  
  // If not found, try to find by gameCode
  if (!game) {
    console.log('Trying to find game by gameCode for update:', gameId);
    for (const [fullGameId, gameData] of games.entries()) {
      if (gameData.gameCode === gameId) {
        console.log('Found game by gameCode for update:', { gameCode: gameId, fullId: fullGameId });
        game = gameData;
        actualGameId = fullGameId;
        break;
      }
    }
  }
  
  if (game) {
    Object.assign(game, updates, { lastUpdate: Date.now() });
    games.set(actualGameId, game);
    console.log('Game updated successfully:', { 
      gameId: actualGameId, 
      gameCode: game.gameCode,
      state: game.state, 
      currentRound: game.currentRound, 
      currentScenario: game.currentScenario ? 'Set' : 'Not set' 
    });
  } else {
    console.log('Game not found for update:', gameId);
  }
  return game;
};

// Timer management functions
const startGameTimer = (gameId, duration = 150) => {
  // Clear any existing timer for this game
  if (gameTimers.has(gameId)) {
    clearInterval(gameTimers.get(gameId).interval);
  }
  
  const game = getGame(gameId);
  if (!game) return;
  
  // Use the actual game ID for timer operations
  const actualGameId = game.id;
  
  // Update game with initial timer state
  updateGame(gameId, {
    roundTimer: duration,
    lastTimerUpdate: Date.now()
  });
  
  // Create timer that updates every second
  const interval = setInterval(() => {
    const currentGame = getGame(gameId);
    if (!currentGame || currentGame.state !== 'round') {
      // Game ended or state changed, stop timer
      clearInterval(interval);
      gameTimers.delete(gameId);
      return;
    }
    
    const newTimer = currentGame.roundTimer - 1;
    
    if (newTimer <= 0) {
      // Timer finished
      updateGame(gameId, {
        roundTimer: 0,
        lastTimerUpdate: Date.now()
      });
      clearInterval(interval);
      gameTimers.delete(gameId);
      
      // Emit final timer update
      io.to(actualGameId).emit('gameState', getGame(gameId));
      
      // Optionally auto-end round when timer reaches 0
      // api.socket.endGame(gameId);
    } else {
      // Update timer
      updateGame(gameId, {
        roundTimer: newTimer,
        lastTimerUpdate: Date.now()
      });
      
      // Emit timer update to all clients
      io.to(actualGameId).emit('gameState', getGame(gameId));
    }
  }, 1000);
  
  // Store timer reference
  gameTimers.set(gameId, { interval, startTime: Date.now() });
  
  // Emit initial timer state
  io.to(actualGameId).emit('gameState', getGame(gameId));
};

const stopGameTimer = (gameId) => {
  if (gameTimers.has(gameId)) {
    clearInterval(gameTimers.get(gameId).interval);
    gameTimers.delete(gameId);
  }
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
    console.log('Player joining game:', { gameId, playerName, teamId, emoji, isAdmin });
    
    // Get or create game first to determine the actual game ID
    let game = getGame(gameId);
    let actualGameId = gameId;
    
    if (!game) {
      game = createGame(gameId);
    } else {
      // If game was found by gameCode, use the full game ID
      actualGameId = game.id;
    }
    
    // Join the room using the actual game ID
    socket.join(actualGameId);
    
    // Store player info with the actual game ID
    players.set(socket.id, { gameId: actualGameId, playerName, teamId, emoji, isAdmin });

    // Add team if it doesn't exist (but not for admin or viewer)
    if (teamId && !isAdmin && teamId !== 'viewer' && !game.teams.find(t => t.id === teamId)) {
      game.teams.push({
        id: teamId,
        name: teamId,
        color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
        players: [playerName],
        totalScore: 0,
        emoji: emoji || '❓'
      });
      updateGame(actualGameId, { teams: game.teams });
    } else if (teamId && !isAdmin && teamId !== 'viewer') {
      // Add player to existing team (but not for admin or viewer)
      const team = game.teams.find(t => t.id === teamId);
      if (team && !team.players.includes(playerName)) {
        team.players.push(playerName);
        updateGame(actualGameId, { teams: game.teams });
      }
    }

    // Send current game state to the player
    console.log('Sending game state to player:', game);
    socket.emit('gameState', game);
    
    // Notify other players in the game
    socket.to(actualGameId).emit('playerJoined', { playerName, teamId, emoji });
  });

  // Request current game state (for new tabs/sessions)
  socket.on('requestGameState', ({ gameId }) => {
    console.log('Requesting game state for:', gameId);
    const game = getGame(gameId);
    if (game) {
      console.log('Sending current game state:', { 
        id: game.id,
        gameCode: game.gameCode,
        state: game.state, 
        currentRound: game.currentRound, 
        currentScenario: game.currentScenario ? 'Set' : 'Not set',
        teamsCount: game.teams?.length || 0,
        responsesCount: game.responses?.length || 0
      });
      console.log('Full game state being sent:', game);
      socket.emit('gameState', game);
    } else {
      console.log('Game not found for state request:', gameId);
      const newGame = createGame(gameId);
      console.log('Created new game for state request:', newGame);
      socket.emit('gameState', newGame);
    }
  });

  // Start game
  socket.on('startGame', ({ gameId }) => {
    console.log('startGame event received:', { gameId });
    console.log('Available games before startGame:', Array.from(games.keys()));
    const game = getGame(gameId);
    if (game) {
      console.log('Starting game:', { currentState: game.state, currentRound: game.currentRound });
      const updatedGame = updateGame(gameId, {
        state: 'playing',
        currentRound: 1,
        currentScenario: scenarios[0], // Use the first scenario from the array
        roundTimer: 150,
        lastTimerUpdate: Date.now()
      });
      console.log('Game started:', { newState: updatedGame.state, newRound: updatedGame.currentRound });
      console.log('Available games after startGame:', Array.from(games.keys()));
      console.log('Emitting gameState to room:', updatedGame.id);
      io.to(updatedGame.id).emit('gameState', updatedGame);
      console.log('gameState emitted successfully');
    } else {
      console.log('Game not found for startGame:', gameId);
    }
  });

  // Start round
  socket.on('startRound', ({ gameId }) => {
    console.log('startRound event received:', { gameId });
    const game = getGame(gameId);
    if (game) {
      console.log('Starting round:', { currentState: game.state, currentRound: game.currentRound });
      const updatedGame = updateGame(gameId, {
        state: 'round',
        roundTimer: 150,
        lastTimerUpdate: Date.now(),
        responses: [],
        playerSelections: {}
        // Keep the currentScenario as is - it should already be set for this round
      });
      console.log('Round started:', { newState: updatedGame.state, newRound: updatedGame.currentRound });
      console.log('Emitting gameState to room:', updatedGame.id);
      io.to(updatedGame.id).emit('gameState', updatedGame);
      console.log('gameState emitted successfully');
      
      // Start the server-side timer
      startGameTimer(gameId, 150);
    } else {
      console.log('Game not found for startRound:', gameId);
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
      
      io.to(updatedGame.id).emit('gameState', updatedGame);
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
      io.to(updatedGame.id).emit('gameState', updatedGame);
    }
  });

  // Next round
  socket.on('nextRound', ({ gameId }) => {
    const game = getGame(gameId);
    if (game) {
      // Stop any existing timer
      stopGameTimer(gameId);
      
      const nextRound = game.currentRound + 1;
      // Get the scenario for this round (array index is round number - 1)
      const scenarioIndex = nextRound - 1;
      const nextScenario = scenarios[scenarioIndex] || 'No scenario available for this round';
      
      const updatedGame = updateGame(gameId, {
        currentRound: nextRound,
        currentScenario: nextScenario,
        state: 'playing',
        responses: [],
        playerSelections: {},
        roundResults: [],
        roundTimer: 150, // Reset timer for next round
        lastTimerUpdate: Date.now()
      });
      io.to(updatedGame.id).emit('gameState', updatedGame);
    }
  });

  // End game
  socket.on('endGame', ({ gameId }) => {
    const game = getGame(gameId);
    if (game) {
      // Stop any active timer
      stopGameTimer(gameId);
      
      const updatedGame = updateGame(gameId, { state: 'results' });
      io.to(updatedGame.id).emit('gameState', updatedGame);
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
      io.to(updatedGame.id).emit('gameState', updatedGame);
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
      io.to(updatedGame.id).emit('gameState', updatedGame);
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