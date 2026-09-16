/**
 * Arquivo: Service_Import.gs
 * Funcionalidades: Recebe o upload de um JSON do jogador, valida o schema e converte para estado do jogo no banco de dados (Google Sheet).
 * Integrações: Controller_Board.gs (para salvar o tabuleiro importado).
 * Dependências: Model_Board.gs, Utils_JSON.gs, Utils_Response.gs, Auth_Service.gs.
 */

function importBoardJson(payload) {
  const userId = Auth_Service.validateSessionToken(payload.token);
  if (!userId) {
    return Utils_Response.error("Invalid session.", 401);
  }

  const boardJsonString = payload.jsonContent; // Conteúdo JSON enviado pelo frontend
  const boardName = Utils_Validation.normalizeText(payload.name || "Imported Board", 80);

  try {
    const importedBoardData = Utils_JSON.parse(boardJsonString);

    const validation = Utils_Validation.validateBoardData(importedBoardData);
    if (!validation.isValid) return Utils_Response.error("Invalid JSON schema for board import.", 400, { errors: validation.errors });

    // Salva o tabuleiro importado como um novo tabuleiro para o usuário
    const newBoard = GameSheets.boards.create(userId, boardName, importedBoardData);

    if (newBoard) {
      return Utils_Response.success({ message: "Board imported successfully.", boardId: newBoard.id });
    } else {
      return Utils_Response.error("Failed to import board.", 500);
    }

  } catch (e) {
    Utils_Logger.logError("Service_Import", e.message, e.stack);
    // Não exponha detalhes do parser, caminhos internos ou dados recebidos.
    return Utils_Response.error("Error processing imported JSON.", 400);
  }
}
