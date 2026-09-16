/**
 * Fachada única de persistência do EcoGrow.
 * Mantém os Models como adaptadores de cada aba e oferece aos controllers um
 * contrato estável para CRUD, autenticação e consultas agregadas.
 * O nome GameSheets evita colisão com o serviço avançado global `Sheets` do GAS.
 */

function Sheets_publicUser(user) {
  if (!user) return null;
  return {
    id: String(user.id || ''),
    username: user.username,
    displayName: user.displayName || user.username,
    role: user.role || "player",
    email: user.email || "",
    balance: Number(user.balance) || 0,
    createdAt: user.createdAt || ""
  };
}

function Sheets_authenticateUser(username, password) {
  const user = Model_User_getUserByUsername(username);
  if (!user || !verifyPassword(password, user.password)) return null;
  if (isLegacyPassword(user.password)) {
    Model_User_updateUser(user.id, { password: hashPassword(password) });
  }
  return Sheets_publicUser(user);
}

function Sheets_registerUser(username, password, role) {
  if (Model_User_getUserByUsername(username)) return null;
  const created = Model_User_createUser(username, hashPassword(password), role || "player");
  return Sheets_publicUser(created);
}

function Sheets_deleteRowsByField(sheetName, fieldName, value) {
  return DB_Connection.mutateSheetData(sheetName, function(data) {
    if (!Array.isArray(data) || !data.length) return { data: data, value: 0 };
    const fieldIndex = data[0].indexOf(fieldName);
    if (fieldIndex === -1) return { data: data, value: 0 };
    const kept = [data[0]];
    let removed = 0;
    data.slice(1).forEach(function(row) {
      if (row[fieldIndex] === value) removed += 1; else kept.push(row);
    });
    return { data: kept, value: removed };
  });
}

function Sheets_deleteUserCascade(userId) {
  if (!userId || !Model_User_getUserById(userId)) return false;
  // Dependências primeiro: se uma limpeza falhar, a conta permanece recuperável.
  ["Boards", "SimulationLogs", "EconomyTransactions", "Notifications"].forEach(function(sheetName) {
    Sheets_deleteRowsByField(sheetName, "userId", userId);
  });
  return Model_User_deleteUser(userId);
}

function Sheets_getPlayerComparisons(currentUserId, options) {
  options = options || {};
  const limit = Math.max(3, Math.min(Number(options.limit) || 10, 50));
  const users = Model_User_getAllUsers().filter(function(user) {
    return user && user.id && user.username && ((user.role || "player") === "player" || user.id === currentUserId);
  });
  const knownUserIds = {};
  users.forEach(function(user) { knownUserIds[user.id] = true; });
  const logs = Model_SimulationLog_getAllLogs().filter(function(log) { return knownUserIds[log.userId]; });
  const boards = Model_Board_getAllBoards().filter(function(board) { return knownUserIds[board.userId]; });
  const logsByUser = {};
  const boardCountByUser = {};

  logs.forEach(function(log) {
    if (!logsByUser[log.userId]) logsByUser[log.userId] = [];
    logsByUser[log.userId].push(log);
  });
  boards.forEach(function(board) { boardCountByUser[board.userId] = (boardCountByUser[board.userId] || 0) + 1; });

  const players = users.map(function(user) {
    const userLogs = (logsByUser[user.id] || []).slice().sort(function(left, right) { return new Date(right.timestamp) - new Date(left.timestamp); });
    const scores = userLogs.map(function(log) { return Math.max(0, Math.min(100, Number(log.score) || 0)); });
    const totalScore = scores.reduce(function(total, score) { return total + score; }, 0);
    const recent = scores.slice(0, 5);
    const previous = scores.slice(5, 10);
    const recentAverage = recent.length ? recent.reduce(function(total, score) { return total + score; }, 0) / recent.length : 0;
    const previousAverage = previous.length ? previous.reduce(function(total, score) { return total + score; }, 0) / previous.length : recentAverage;
    return {
      userId: user.id,
      username: user.username,
      displayName: user.displayName || user.username,
      averageScore: scores.length ? totalScore / scores.length : 0,
      bestScore: scores.length ? Math.max.apply(null, scores) : 0,
      totalSimulations: scores.length,
      totalBoards: boardCountByUser[user.id] || 0,
      trend: Math.round((recentAverage - previousAverage) * 10) / 10,
      lastSimulationAt: userLogs.length ? userLogs[0].timestamp : null
    };
  });

  const ranked = players.filter(function(player) { return player.totalSimulations > 0; }).sort(function(left, right) {
    return right.averageScore - left.averageScore || right.bestScore - left.bestScore || right.totalSimulations - left.totalSimulations || String(left.username).localeCompare(String(right.username));
  });
  ranked.forEach(function(player, index) { player.rank = index + 1; });
  const current = players.find(function(player) { return player.userId === currentUserId; }) || null;
  const currentRanked = ranked.find(function(player) { return player.userId === currentUserId; });
  if (current) {
    current.rank = currentRanked ? currentRanked.rank : null;
    current.percentile = current.rank && ranked.length > 1 ? Math.round((ranked.length - current.rank) / (ranked.length - 1) * 100) : (current.rank ? 100 : null);
  }
  const allScores = logs.map(function(log) { return Math.max(0, Math.min(100, Number(log.score) || 0)); });

  return {
    leaderboard: ranked.slice(0, limit).map(function(player) {
      return {
        rank: player.rank,
        username: player.username,
        displayName: player.displayName,
        averageScore: Math.round(player.averageScore * 10) / 10,
        bestScore: player.bestScore,
        totalSimulations: player.totalSimulations,
        totalBoards: player.totalBoards,
        trend: player.trend,
        isCurrentUser: player.userId === currentUserId
      };
    }),
    currentPlayer: current ? {
      rank: current.rank,
      percentile: current.percentile,
      averageScore: Math.round(current.averageScore * 10) / 10,
      bestScore: current.bestScore,
      totalSimulations: current.totalSimulations,
      totalBoards: current.totalBoards,
      trend: current.trend
    } : null,
    // Janela de 5 linhas em volta do jogador: ate 2 com media maior ou igual e
    // ate 2 com media menor ou igual. O ranking completo acima continua
    // disponivel; esta e a leitura que cabe na tela do celular.
    vizinhanca: rankingVizinhanca(
      ranked.map(function(player) {
        return {
          id: player.userId,
          nome: player.displayName || player.username,
          pontuacao: Math.round(player.averageScore * 10) / 10
        };
      }),
      currentUserId),
    community: {
      rankedPlayers: ranked.length,
      totalSimulations: allScores.length,
      averageScore: allScores.length ? Math.round(allScores.reduce(function(total, score) { return total + score; }, 0) / allScores.length * 10) / 10 : 0
    }
  };
}

/**
 * Janela local do ranking. Mantida no diretório do web app para que o clasp a
 * publique junto com o jogo; a cópia canônica na raiz da frota não é enviada.
 */
function rankingVizinhanca(entradas, idAlvo, opcoes) {
  var config = opcoes || {};
  var vizinhos = config.vizinhos === undefined ? 2 : Number(config.vizinhos);
  if (!isFinite(vizinhos) || vizinhos < 0) vizinhos = 2;
  var menorMelhor = config.menorMelhor === true;
  var lista = (entradas || []).map(function(entrada, indice) {
    return {
      id: entrada && entrada.id !== undefined ? entrada.id : indice,
      nome: String((entrada && (entrada.nome || entrada.name || entrada.username)) || 'Sem nome'),
      pontuacao: Number((entrada && (entrada.pontuacao !== undefined ? entrada.pontuacao : entrada.score)) || 0)
    };
  }).filter(function(entrada) { return isFinite(entrada.pontuacao); });
  lista.sort(function(a, b) {
    if (b.pontuacao !== a.pontuacao) return menorMelhor ? a.pontuacao - b.pontuacao : b.pontuacao - a.pontuacao;
    return a.nome.localeCompare(b.nome, 'pt-BR');
  });
  lista.forEach(function(entrada, indice) { entrada.posicao = indice + 1; });
  var alvo = -1;
  for (var i = 0; i < lista.length; i++) {
    if (String(lista[i].id) === String(idAlvo)) { alvo = i; break; }
  }
  var inicio = alvo < 0 ? 0 : Math.max(0, alvo - vizinhos);
  var fim = alvo < 0 ? Math.min(lista.length, vizinhos * 2 + 1) : Math.min(lista.length, alvo + vizinhos + 1);
  var linhas = lista.slice(inicio, fim).map(function(entrada, indice) {
    var real = inicio + indice;
    var relacao = alvo < 0 || real < alvo ? 'acima' : (real > alvo ? 'abaixo' : 'alvo');
    return {
      posicao: entrada.posicao, id: entrada.id, nome: entrada.nome,
      pontuacao: entrada.pontuacao, relacao: relacao, destaque: relacao === 'alvo'
    };
  });
  return { posicao: alvo < 0 ? 0 : lista[alvo].posicao, total: lista.length, linhas: linhas };
}

var GameSheets = {
  users: {
    list: Model_User_getAllUsers,
    getById: Model_User_getUserById,
    getByUsername: Model_User_getUserByUsername,
    create: Model_User_createUser,
    update: Model_User_updateUser,
    delete: Sheets_deleteUserCascade,
    publicView: Sheets_publicUser
  },
  boards: {
    list: Model_Board_getAllBoards,
    listByUser: Model_Board_getBoardsByUserId,
    getById: Model_Board_getBoardById,
    create: Model_Board_createBoard,
    update: Model_Board_updateBoard,
    delete: Model_Board_deleteBoard
  },
  modules: { list: Model_Module_getAllModules, getById: Model_Module_getModuleById, create: Model_Module_createModule, update: Model_Module_updateModule, delete: Model_Module_deleteModule },
  plants: { list: Model_Plant_getAllPlants, getById: Model_Plant_getPlantById, create: Model_Plant_createPlant, update: Model_Plant_updatePlant, delete: Model_Plant_deletePlant },
  simulations: { list: Model_SimulationLog_getAllLogs, listByUser: Model_SimulationLog_getLogsByUserId, getById: Model_SimulationLog_getLogById, create: Model_SimulationLog_createLog, review: Model_SimulationLog_review },
  economy: { listByUser: Model_Economy_getTransactionsByUserId, apply: Model_Economy_applyTransaction },
  notifications: { listByUser: Model_Notification_getByUserId, create: Model_Notification_create, markRead: Model_Notification_markRead },
  auth: { authenticate: Sheets_authenticateUser, register: Sheets_registerUser },
  comparisons: { players: Sheets_getPlayerComparisons }
};

var SchemaService = (function() {
  var SCHEMAS = {
    Users: ["id", "username", "password", "role", "email", "displayName", "balance", "createdAt"],
    Boards: ["id", "userId", "name", "timestamp", "boardJson"],
    Modules: ["id", "name", "type", "capacity", "inputs", "outputs", "npkImpact", "pathogenReduction"],
    Plants: ["id", "name", "type", "npkRequirements", "waterRequirements", "pathogenTolerance"],
    SimulationLogs: ["id", "userId", "boardId", "boardName", "timestamp", "score", "feedbackJson", "reflection", "nextChange", "reviewedAt"],
    EconomyTransactions: ["id", "userId", "type", "amount", "balanceAfter", "referenceId", "description", "timestamp"],
    Notifications: ["id", "userId", "type", "title", "message", "source", "read", "timestamp"],
    Logs: ["timestamp", "level", "component", "message", "stackTrace"]
  };

  function montarOuRemontarPlanilhas(options) {
    options = options || {};
    var remount = options.mode === "remontar" || options.remount === true;
    if (remount && options.confirmation !== "REMONTAR_PLANILHAS") throw new Error('Confirme com "REMONTAR_PLANILHAS".');
    var ss = DB_Connection.getSpreadsheet();
    var results = Object.keys(SCHEMAS).map(function(name) {
      var sheet = ss.getSheetByName(name);
      var created = !sheet;
      if (!sheet) sheet = ss.insertSheet(name);
      if (remount) sheet.clear();
      var current = sheet.getLastColumn() ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0] : [];
      var missing = SCHEMAS[name].filter(function(header) { return current.indexOf(header) === -1; });
      if (remount || !current.length) sheet.getRange(1, 1, 1, SCHEMAS[name].length).setValues([SCHEMAS[name]]);
      else if (missing.length) sheet.getRange(1, current.length + 1, 1, missing.length).setValues([missing]);
      sheet.setFrozenRows(1);
      return { sheetName: name, created: created, remounted: remount, columns: SCHEMAS[name].length };
    });
    return { ok: true, mode: remount ? "remontar" : "montar", sheets: results };
  }

  /**
   * Popula duas linhas de demonstração por aba, sem tocar em registros reais.
   * As contas recebem digest salgado antes da gravação para permitir o
   * primeiro login de validação sem expor credenciais.
   * A operação é idempotente: o ID synthetic-* impede duplicações em novas
   * execuções e nunca substitui uma linha existente.
   */
  function popularDadosSinteticos(options) {
    options = options || {};
    montarOuRemontarPlanilhas(options.schema || {});
    var ss = DB_Connection.getSpreadsheet();
    var now = new Date().toISOString();
    var users = [
      { id: 'synthetic-eco-user-01', username: 'aluno01', password: 'senhafacil', role: 'player', email: 'aluno01@example.edu', displayName: 'Aluno 01', balance: 100 },
      { id: 'synthetic-eco-user-02', username: 'aluno02', password: 'senhafacil2', role: 'player', email: 'aluno02@example.edu', displayName: 'Aluno 02', balance: 80 }
    ];
    users.forEach(function(user) { user.password = hashPassword(user.password); });
    var rowsBySheet = {
      Users: users,
      Boards: users.map(function (u, i) { return { id: 'synthetic-eco-board-0' + (i + 1), userId: u.id, name: 'Horta demonstrativa ' + (i + 1), timestamp: now, boardJson: JSON.stringify({ soil: 'loam', plants: i + 1 }) }; }),
      Modules: [{ id: 'synthetic-eco-module-01', name: 'Compostagem', type: 'input', capacity: 10, inputs: 'residuos', outputs: 'composto', npkImpact: 2, pathogenReduction: 1 }, { id: 'synthetic-eco-module-02', name: 'Irrigação', type: 'output', capacity: 20, inputs: 'agua', outputs: 'umidade', npkImpact: 0, pathogenReduction: 0 }],
      Plants: [{ id: 'synthetic-eco-plant-01', name: 'Alface', type: 'leafy', npkRequirements: 'N:2,P:1,K:1', waterRequirements: 'moderate', pathogenTolerance: 2 }, { id: 'synthetic-eco-plant-02', name: 'Tomate', type: 'fruit', npkRequirements: 'N:3,P:2,K:3', waterRequirements: 'high', pathogenTolerance: 3 }],
      SimulationLogs: users.map(function (u, i) { return { id: 'synthetic-eco-log-0' + (i + 1), userId: u.id, boardId: 'synthetic-eco-board-0' + (i + 1), boardName: 'Horta demonstrativa ' + (i + 1), timestamp: now, score: 78 + i * 8, feedbackJson: JSON.stringify({ next: 'Ajustar nutrientes' }) }; }),
      EconomyTransactions: users.map(function (u, i) { return { id: 'synthetic-eco-tx-0' + (i + 1), userId: u.id, type: 'credit', amount: 25 + i * 10, balanceAfter: u.balance, referenceId: 'synthetic-eco-board-0' + (i + 1), description: 'Bônus de demonstração', timestamp: now }; }),
      Notifications: users.map(function (u, i) { return { id: 'synthetic-eco-notification-0' + (i + 1), userId: u.id, type: 'tip', title: 'Dica de cultivo', message: 'Observe a umidade do solo.', source: 'seed', read: false, timestamp: now }; }),
      Logs: [{ timestamp: now, level: 'INFO', component: 'seed', message: 'Seed sintético 1', stackTrace: '' }, { timestamp: now, level: 'INFO', component: 'seed', message: 'Seed sintético 2', stackTrace: '' }]
    };
    var report = {};
    Object.keys(SCHEMAS).forEach(function (name) {
      var sheet = ss.getSheetByName(name);
      var headers = SCHEMAS[name];
      var keyHeader = headers[0];
      var keyIndex = headers.indexOf(keyHeader);
      var existing = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues() : [];
      var known = {};
      existing.forEach(function (row) { known[String(row[keyIndex] || '')] = true; });
      var pending = (rowsBySheet[name] || []).filter(function (item) { return !known[String(item[keyHeader] || '')]; }).map(function (item) {
        return headers.map(function (header) { return item[header] === undefined ? '' : item[header]; });
      });
      if (pending.length) sheet.getRange(sheet.getLastRow() + 1, 1, pending.length, headers.length).setValues(pending);
      report[name] = pending.length;
    });
    return { ok: true, synthetic: true, credentials: users.map(function (u) { return { username: u.username, password: u.password }; }), seeded: report };
  }

  return { getSchemas: function() { return SCHEMAS; }, montarOuRemontarPlanilhas: montarOuRemontarPlanilhas, popularDadosSinteticos: popularDadosSinteticos };
})();

/** Inicializa diretamente as abas e colunas canônicas do Eco-Grow. */
function setupEcoGrowSchema(options) {
  return SchemaService.montarOuRemontarPlanilhas(options || {});
}

function popularDadosSinteticosEcoGrow(options) {
  return SchemaService.popularDadosSinteticos(options || {});
}
