/**
 * Arquivo: Controller_Board.gs
 * Funcionalidades: Salva o progresso do jogador (estado do tabuleiro), carrega tabuleiros salvos e valida a estrutura básica do tabuleiro antes de enviar ao motor de simulação.
 * Integrações: Model_Board.gs, Utils_JSON.gs.
 * Dependências: Model_Board.gs, Auth_Service.gs, Utils_Response.gs, Utils_JSON.gs.
 */

function saveBoard(payload) {
  const userId = Auth_Service.validateSessionToken(payload.token);
  if (!userId) {
    return Utils_Response.error("Invalid session.", 401);
  }
  const boardName = Utils_Validation.normalizeText(payload.name, 80);
  const boardData = payload.boardData; // O JSON completo do tabuleiro

  if (!boardName) return Utils_Response.error("Board name is required.", 400);
  const boardValidation = Utils_Validation.validateBoardData(boardData);
  if (!boardValidation.isValid) return Utils_Response.error("Invalid board data structure.", 400, { errors: boardValidation.errors });

  let existingBoard = null;
  if (payload.boardId) {
    existingBoard = GameSheets.boards.getById(payload.boardId);
    if (!existingBoard || existingBoard.userId !== userId) return Utils_Response.error("Board not found or unauthorized access.", 404);
  } else {
    existingBoard = GameSheets.boards.listByUser(userId).find(function(board) { return board.name === boardName; });
  }

  if (existingBoard) {
    // Atualiza o tabuleiro existente
    const success = GameSheets.boards.update(existingBoard.id, { name: boardName, boardJson: boardData });
    if (success) {
      return Utils_Response.success({ message: "Board updated successfully.", boardId: existingBoard.id });
    } else {
      return Utils_Response.error("Failed to update board.", 500);
    }
  } else {
    // Cria um novo tabuleiro
    const newBoard = GameSheets.boards.create(userId, boardName, boardData);
    if (newBoard) {
      return Utils_Response.success({ message: "Board saved successfully.", boardId: newBoard.id });
    } else {
      return Utils_Response.error("Failed to save new board.", 500);
    }
  }
}

function deleteBoard(payload) {
  const userId = Auth_Service.validateSessionToken((payload || {}).token);
  if (!userId) return Utils_Response.error("Invalid session.", 401);
  const board = GameSheets.boards.getById(payload.boardId);
  if (!board || board.userId !== userId) return Utils_Response.error("Board not found or unauthorized access.", 404);
  return GameSheets.boards.delete(board.id)
    ? Utils_Response.success({ boardId: board.id }, "Board deleted successfully.")
    : Utils_Response.error("Failed to delete board.", 500);
}

function loadBoard(payload) {
  const userId = Auth_Service.validateSessionToken(payload.token);
  if (!userId) {
    return Utils_Response.error("Invalid session.", 401);
  }
  const boardId = payload.boardId;

  const board = GameSheets.boards.getById(boardId);

  if (!board || board.userId !== userId) {
    return Utils_Response.error("Board not found or unauthorized access.", 404);
  }

  return Utils_Response.success({ boardData: board.boardJson, name: board.name });
}

function listUserBoards(payload) {
  const userId = Auth_Service.validateSessionToken(payload.token);
  if (!userId) {
    return Utils_Response.error("Invalid session.", 401);
  }

  const boards = GameSheets.boards.listByUser(userId);
  // Retorna apenas metadados dos boards, não o JSON completo para otimizar
  const boardList = boards.map(b => ({ id: b.id, name: b.name, timestamp: b.timestamp }));
  return Utils_Response.success({ boards: boardList });
}
