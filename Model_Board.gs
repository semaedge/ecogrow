/**
 * Arquivo: Model_Board.gs
 * Funcionalidades: Implementa as operações CRUD para as matrizes do tabuleiro de jogo. Salva o estado serializado (JSON) da Tiny House, cotas e posições dos módulos.
 * Integrações: DB_Connection.gs, Controller_Board.gs.
 * Dependências: DB_Connection.gs, Utils_JSON.gs, Utils_Logger.gs.
 */

function Model_Board_getBoardsSheet() {
  return DB_Connection.getSheet("Boards");
}

function Model_Board_getAllBoards() {
  const data = DB_Connection.readAllData("Boards");
  if (data.length <= 1) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    let board = {};
    headers.forEach((header, i) => {
      if (header === "boardJson" && row[i]) {
        board[header] = Utils_JSON.parse(row[i]);
      } else {
        board[header] = row[i];
      }
    });
    return board;
  });
}

function Model_Board_getBoardById(boardId) {
  const boards = Model_Board_getAllBoards();
  return boards.find(board => board.id === boardId);
}

function Model_Board_getBoardsByUserId(userId) {
  const boards = Model_Board_getAllBoards();
  return boards.filter(board => board.userId === userId);
}

function Model_Board_createBoard(userId, name, boardJson) {
  const newId = Utilities.getUuid();
  const newBoard = { id: newId, userId: userId, name: name, timestamp: new Date().toISOString(), boardJson: boardJson };
  DB_Connection.appendRow("Boards", [newBoard.id, newBoard.userId, newBoard.name, newBoard.timestamp, Utils_JSON.stringify(boardJson)]);
  Utils_Logger.logInfo("Model_Board", "New board created: " + name + " for user: " + userId);
  return newBoard;
}

function Model_Board_updateBoard(boardId, updates) {
  updates = updates || {};
  const updated = DB_Connection.mutateSheetData("Boards", function(data) {
    if (!data.length || !data[0].length) return { data: data, value: false };
    const headers = data[0];
    const idIndex = headers.indexOf("id");
    let changed = false;
    for (let i = 1; i < data.length; i++) {
      if (data[i][idIndex] !== boardId) continue;
      ["name", "boardJson"].forEach(function(key) {
        if (!Object.prototype.hasOwnProperty.call(updates, key)) return;
        const column = headers.indexOf(key);
        if (column !== -1) {
          data[i][column] = key === "boardJson" ? Utils_JSON.stringify(updates[key]) : updates[key];
          changed = true;
        }
      });
      if (changed) data[i][headers.indexOf("timestamp")] = new Date().toISOString();
      break;
    }
    return { data: data, value: changed };
  });
  if (updated) Utils_Logger.logInfo("Model_Board", "Board updated: " + boardId);
  return updated;
}

function Model_Board_deleteBoard(boardId) {
  const deleted = DB_Connection.mutateSheetData("Boards", function(data) {
    if (!data.length || !data[0].length) return { data: data, value: false };
    const idIndex = data[0].indexOf("id");
    const kept = [data[0]];
    let removed = false;
    data.slice(1).forEach(function(row) {
      if (row[idIndex] === boardId) removed = true;
      else kept.push(row);
    });
    return { data: kept, value: removed };
  });
  if (deleted) Utils_Logger.logInfo("Model_Board", "Board deleted: " + boardId);
  return deleted;
}
