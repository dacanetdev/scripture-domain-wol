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
  {
    scripture: "José Smith—Historia 1:15–20",
    key: "José Smith vio “a dos Personajes, cuyo fulgor y gloria no admiten descripción”.",
    apply: "Estás enseñando a alguien que duda de que Dios y Jesucristo sean reales o distintos. Le compartes la experiencia de la Primera Visión, testificando que Dios sigue hablando hoy y que tiene un plan para nosotros. Explicas que José buscó con fe, y recibió respuesta. Invitas a tu amigo a orar con fe también."
  },
  {
    scripture: "DyC 1:30",
    key: "La Iglesia de Jesucristo es “la única iglesia verdadera y viviente”.",
    apply: "Una amiga te pregunta por qué insistes en tu religión si 'todas enseñan a ser buenas personas'. Le explicas que el Señor mismo restauró Su Iglesia y autoridad por medio de un profeta, y que eso hace la diferencia eterna: convenios, profetas y revelación continua."
  },
  {
    scripture: "DyC 1:37–38",
    key: "“Sea por mi propia voz o por la voz de mis siervos, es lo mismo”.",
    apply: "Un joven investigando la Iglesia se pregunta por qué los miembros siguen tanto al presidente de la Iglesia. Le enseñas que cuando los profetas hablan, es como si Dios mismo hablara. Le compartes un discurso reciente que te ayudó personalmente y lo invitas a orar para saber si el profeta es guiado por Dios."
  },
  {
    scripture: "DyC 6:36",
    key: "“Mirad hacia mí en todo pensamiento; no dudéis; no temáis”.",
    apply: "Un joven con ansiedad por el futuro te pregunta cómo mantenerse positivo. Le compartes cómo mirar a Cristo ha traído paz a tu vida, y que la fe en Él reemplaza el miedo. Le invitas a orar y leer sobre Cristo en el Libro de Mormón."
  },
  {
    scripture: "DyC 8:2–3",
    key: "“Hablaré a tu mente y a tu corazón por medio del Espíritu Santo”.",
    apply: "Estás enseñando sobre la oración, y una persona dice que no ha 'sentido nada' al orar. Le compartes esta escritura para explicarle que la revelación puede venir como claridad mental o paz interior. Le invitas a seguir intentándolo con fe."
  },
  {
    scripture: "DyC 13:1",
    key: "El Sacerdocio Aarónico “tiene las llaves del ministerio de ángeles…”",
    apply: "Un joven te pregunta por qué necesita bautizarse de nuevo si ya fue bautizado en otra iglesia. Le enseñas que el sacerdocio con la autoridad de Dios fue restaurado por medio de Juan el Bautista y que el bautismo válido requiere esa autoridad."
  },
  {
    scripture: "DyC 18:10–11",
    key: "“El valor de las almas es grande a la vista de Dios”.",
    apply: "Una joven investigadora se siente inútil por errores pasados. Le compartes esta escritura para enseñarle que para Dios su alma tiene valor eterno, y que Cristo ya pagó el precio por ella. Le invitas a acercarse a Él mediante el arrepentimiento."
  },
  {
    scripture: "DyC 18:15–16",
    key: "“¡Cuán grande no será vuestro gozo si me trajereis muchas almas!”",
    apply: "Un amigo miembro no quiere ir a la misión. Le compartes esta escritura y tu testimonio de cómo ayudar a otros a conocer el evangelio trae gozo real. Le animas a orar y a considerar cómo podría ser instrumento en manos del Señor."
  },
  {
    scripture: "DyC 19:16–19",
    key: "“Yo, [Jesucristo], he padecido estas cosas por todos”.",
    apply: "Estás hablando con alguien que cree que Dios no entiende su sufrimiento. Le enseñas sobre la Expiación de Cristo, y cómo Él ya sufrió todo lo que sentimos. Le testificas que puede encontrar consuelo y sanación en Cristo."
  },
  {
    scripture: "DyC 21:4–6",
    key: "“Recibiréis [la] palabra [del profeta] como si viniera de mi propia boca”.",
    apply: "Una joven dice que los profetas “sólo dan su opinión”. Le enseñas este versículo para mostrar que los profetas verdaderos hablan en nombre de Dios. Le compartes cómo un consejo profético reciente te ayudó en una decisión personal."
  },
  {
    scripture: "DyC 29:10–11",
    key: "“Con poder y gran gloria me revelaré desde los cielos…”",
    apply: "Un amigo teme que el mundo va de mal en peor. Le compartes esta escritura para mostrarle que Cristo vendrá de nuevo y traerá paz y justicia. Le invitas a prepararse por medio del arrepentimiento y los convenios."
  },
  {
    scripture: "DyC 49:15–17",
    key: "“… el matrimonio lo decretó Dios”.",
    apply: "Un joven dice que ya no cree en el matrimonio por todo lo que ha visto. Le enseñas que el matrimonio es un mandamiento divino y parte del plan eterno de Dios, y que cuando se vive conforme al evangelio, puede traer felicidad duradera."
  }
];

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

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
  const shuffledScenarios = shuffle(scenarios);
  const game = {
    id: gameId,
    gameCode: gameCode, // Add short game code for easy lookup
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
    createdAt: Date.now(),
    shuffledScenarios,
    rounds: [], // Only played rounds will be added
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
const startGameTimer = (gameId, duration = 180) => {
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
    
    try {
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
        // Always emit the latest game state to the socket, even if player is already present
        socket.emit('gameState', getGame(actualGameId));
      }

      // Send current game state to the player
      console.log('Sending game state to player:', game);
      socket.emit('gameState', game);
      
      // Notify other players in the game
      socket.to(actualGameId).emit('playerJoined', { playerName, teamId, emoji });
    } catch (error) {
      console.error('Error in joinGame:', error);
      socket.emit('error', { message: 'Failed to join game' });
    }
  });

  // Request current game state (for new tabs/sessions)
  socket.on('requestGameState', ({ gameId }) => {
    console.log('Requesting game state for:', gameId);
    try {
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
    } catch (error) {
      console.error('Error in requestGameState:', error);
      socket.emit('error', { message: 'Failed to get game state' });
    }
  });

  // Start game
  socket.on('startGame', ({ gameId }) => {
    console.log('startGame event received:', { gameId });
    console.log('Available games before startGame:', Array.from(games.keys()));
    try {
      const game = getGame(gameId);
      if (game) {
        console.log('Starting game:', { currentState: game.state, currentRound: game.currentRound });
        const updatedGame = updateGame(gameId, {
          state: 'playing',
          currentRound: 1,
          currentScenario: game.shuffledScenarios[0], // Use the first scenario from the shuffled array
          roundTimer: 180,
          lastTimerUpdate: Date.now()
        });
        console.log('Game started:', { newState: updatedGame.state, newRound: updatedGame.currentRound });
        console.log('Available games after startGame:', Array.from(games.keys()));
        console.log('Emitting gameState to room:', updatedGame.id);
        io.to(updatedGame.id).emit('gameState', updatedGame);
        console.log('gameState emitted successfully');
      } else {
        console.log('Game not found for startGame:', gameId);
        socket.emit('error', { message: 'Game not found' });
      }
    } catch (error) {
      console.error('Error in startGame:', error);
      socket.emit('error', { message: 'Failed to start game' });
    }
  });

  // Start round
  socket.on('startRound', ({ gameId }) => {
    try {
      const game = getGame(gameId);
      if (game) {
        if (game.state === 'finished') return;
        const currentScenario = game.shuffledScenarios[game.currentRound - 1];
        if (!game.rounds) game.rounds = [];
        // Add the current scenario to rounds if it's not already there
        if (currentScenario && !game.rounds.includes(currentScenario)) {
          game.rounds.push(currentScenario);
        }
        const updatedGame = updateGame(gameId, {
          state: 'round',
          roundTimer: 180,
          lastTimerUpdate: Date.now(),
          responses: [],
          playerSelections: {}
          // Keep the currentScenario as is - it should already be set for this round
        });
        io.to(updatedGame.id).emit('gameState', updatedGame);
        startGameTimer(gameId, 180);
      } else {
        socket.emit('error', { message: 'Game not found' });
      }
    } catch (error) {
      console.error('Error in startRound:', error);
      socket.emit('error', { message: 'Failed to start round' });
    }
  });

  // Submit response
  socket.on('submitResponse', ({ gameId, teamId, playerId, scriptureId, response, playerName }) => {
    try {
      const game = getGame(gameId);
      if (game) {
        if (game.state === 'finished') return;
        if (game.roundTimer <= 0) {
          socket.emit('responseRejected', { reason: 'Tiempo agotado. No se pueden enviar más respuestas.' });
          return;
        }
        const newResponse = {
          teamId,
          scriptureId,
          response,
          timestamp: Date.now(),
          speedScore: 0,
          qualityScore: 0,
          playerName,
          roundNumber: game.currentRound // Add current round number
        };
        const updatedResponses = [...game.responses, newResponse];
        const updatedGame = updateGame(gameId, { responses: updatedResponses });
        io.to(updatedGame.id).emit('gameState', updatedGame);
      } else {
        socket.emit('error', { message: 'Game not found' });
      }
    } catch (error) {
      console.error('Error in submitResponse:', error);
      socket.emit('error', { message: 'Failed to submit response' });
    }
  });

  // Set team round score
  socket.on('setTeamRoundScore', ({ gameId, teamId, roundNumber, speedScore, qualityScore, showedPhysically }) => {
    try {
      const game = getGame(gameId);
      if (game) {
        // Add 1 to totalScore if showedPhysically is true
        const extra = showedPhysically ? 1 : 0;
        const newScore = {
          teamId,
          roundNumber,
          speedScore,
          qualityScore,
          totalScore: speedScore + qualityScore + extra,
          showedPhysically: !!showedPhysically
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
        
        // Update responses for this team and round with the scores
        const updatedResponses = (game.responses || []).map(r => {
          if (r.teamId === teamId && r.roundNumber === roundNumber) {
            return { ...r, speedScore, qualityScore };
          }
          return r;
        });
        const updatedGame = updateGame(gameId, { teamRoundScores: updatedScores, responses: updatedResponses });
        io.to(updatedGame.id).emit('gameState', updatedGame);
      } else {
        socket.emit('error', { message: 'Game not found' });
      }
    } catch (error) {
      console.error('Error in setTeamRoundScore:', error);
      socket.emit('error', { message: 'Failed to set team score' });
    }
  });

  // Next round
  socket.on('nextRound', ({ gameId }) => {
    try {
      const game = getGame(gameId);
      if (game) {
        if (game.state === 'finished') return;
        // Stop any existing timer
        stopGameTimer(gameId);
        const nextRound = game.currentRound + 1;
        // If all rounds are done, finish the game
        if (nextRound > game.shuffledScenarios.length) {
          const updatedGame = updateGame(gameId, { state: 'finished' });
          io.to(updatedGame.id).emit('gameState', updatedGame);
          return;
        }
        // Get the scenario for this round from the shuffled array
        const scenarioIndex = nextRound - 1;
        const nextScenario = game.shuffledScenarios[scenarioIndex] || 'No scenario available for this round';
        const updatedGame = updateGame(gameId, {
          currentRound: nextRound,
          currentScenario: nextScenario,
          state: 'playing',
          responses: [],
          playerSelections: {},
          roundResults: [],
          roundTimer: 180, // Reset timer for next round
          lastTimerUpdate: Date.now()
        });
        io.to(updatedGame.id).emit('gameState', updatedGame);
      } else {
        socket.emit('error', { message: 'Game not found' });
      }
    } catch (error) {
      console.error('Error in nextRound:', error);
      socket.emit('error', { message: 'Failed to advance to next round' });
    }
  });

  // End game
  socket.on('endGame', ({ gameId }) => {
    try {
      const game = getGame(gameId);
      if (game) {
        stopGameTimer(gameId);
        // Calculate final results
        const results = {};
        for (const team of game.teams) {
          // Sum all round scores for this team
          const teamScores = (game.teamRoundScores || []).filter(s => s.teamId === team.id);
          results[team.id] = teamScores.reduce((sum, s) => sum + (s.totalScore || 0), 0);
        }
        // Save results
        const updatedGame = updateGame(gameId, { state: 'finished', gameResults: results });
        io.to(updatedGame.id).emit('gameState', updatedGame);
      } else {
        socket.emit('error', { message: 'Game not found' });
      }
    } catch (error) {
      console.error('Error in endGame:', error);
      socket.emit('error', { message: 'Failed to end game' });
    }
  });

  // Player selection update
  socket.on('updatePlayerSelection', ({ gameId, playerId, selectedScripture, teamResponse }) => {
    try {
      const game = getGame(gameId);
      if (game) {
        const updatedSelections = {
          ...game.playerSelections,
          [playerId]: { selectedScripture, teamResponse }
        };
        const updatedGame = updateGame(gameId, { playerSelections: updatedSelections });
        io.to(updatedGame.id).emit('gameState', updatedGame);
      } else {
        socket.emit('error', { message: 'Game not found' });
      }
    } catch (error) {
      console.error('Error in updatePlayerSelection:', error);
      socket.emit('error', { message: 'Failed to update player selection' });
    }
  });

  // Timer update
  socket.on('updateTimer', ({ gameId, timer }) => {
    try {
      const game = getGame(gameId);
      if (game) {
        const updatedGame = updateGame(gameId, {
          roundTimer: timer,
          lastTimerUpdate: Date.now()
        });
        io.to(updatedGame.id).emit('gameState', updatedGame);
      } else {
        socket.emit('error', { message: 'Game not found' });
      }
    } catch (error) {
      console.error('Error in updateTimer:', error);
      socket.emit('error', { message: 'Failed to update timer' });
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
    gameCode: game.gameCode, // Add this line
    state: game.state,
    currentRound: game.currentRound,
    teams: game.teams,
    createdAt: game.createdAt,
    rounds: game.rounds || game.shuffledScenarios || [] // Add rounds to response
  }));
  res.json(gameList);
});

app.get('/api/game/:id', (req, res) => {
  const game = getGame(req.params.id);
  if (!game) return res.status(404).json({ error: 'Game not found' });
  res.json({
    ...game,
    rounds: game.rounds || game.shuffledScenarios || [] // Add rounds to response
  });
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