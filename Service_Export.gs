/**
 * Arquivo: Service_Export.gs
 * Funcionalidades: Pega o estado do tabuleiro salvo e exporta um arquivo JSON para download pelo usuário.
 * Integrações: Controller_Board.gs (para obter o estado do tabuleiro).
 * Dependências: Model_Board.gs, Utils_JSON.gs, Utils_Response.gs.
 */

function exportBoardJson(payload) {
  const userId = Auth_Service.validateSessionToken(payload.token);
  if (!userId) {
    return Utils_Response.error("Invalid session.", 401);
  }
  const boardId = payload.boardId;

  const board = GameSheets.boards.getById(boardId);

  if (!board || board.userId !== userId) {
    return Utils_Response.error("Board not found or unauthorized access.", 404);
  }

  const boardJsonString = Utils_JSON.stringify(board.boardJson, null, 2);
  const safeName = String(board.name || "Board").replace(/[^A-Za-z0-9_-]+/g, "_").substring(0, 60);
  const filename = `EcoGrow_Board_${safeName}_${new Date().getTime()}.json`;

  // Em GAS, para download direto, geralmente se cria um Blob e retorna um URL temporário
  // ou se usa ContentService para servir o arquivo. Para este contexto, vamos retornar o JSON como string.
  return Utils_Response.success({ filename: filename, content: boardJsonString });
}

/**
 * Rotinas de backup e restauração de dados (backup and recovery).
 */
function backupDatabaseSnapshot() {
  var spreadsheetId = Config.getConfig("SPREADSHEETS_ID");
  if (!spreadsheetId) return Utils_Response.error("SPREADSHEET_ID not configured.", 500);
  try {
    var file = DriveApp.getFileById(spreadsheetId);
    var backupName = "EcoGrow_Backup_" + Utilities.formatDate(new Date(), "UTC", "yyyyMMdd_HHmmss");
    var backupCopy = file.makeCopy(backupName);
    return Utils_Response.success({ backupId: backupCopy.getId(), name: backupName, timestamp: new Date().toISOString() });
  } catch (err) {
    return Utils_Response.error("Backup failed: " + err.message, 500);
  }
}

function restoreDatabaseSnapshot(backupId) {
  if (!backupId || typeof backupId !== 'string') return Utils_Response.error("backupId required for recovery.", 400);
  try {
    var targetId = Config.getConfig("SPREADSHEETS_ID");
    if (!targetId) return Utils_Response.error("SPREADSHEETS_ID not configured.", 500);
    if (String(targetId) === String(backupId)) return Utils_Response.error("A origem do backup deve ser diferente da base atual.", 400);

    var source = SpreadsheetApp.openById(String(backupId));
    var target = SpreadsheetApp.openById(String(targetId));
    var restored = 0;
    source.getSheets().forEach(function(sourceSheet) {
      var values = sourceSheet.getDataRange().getValues();
      var targetSheet = target.getSheetByName(sourceSheet.getName());
      if (!targetSheet) targetSheet = target.insertSheet(sourceSheet.getName());
      targetSheet.clearContents();
      if (!values.length || !values[0].length) return;
      if (targetSheet.getMaxRows() < values.length) {
        targetSheet.insertRowsAfter(targetSheet.getMaxRows(), values.length - targetSheet.getMaxRows());
      }
      if (targetSheet.getMaxColumns() < values[0].length) {
        targetSheet.insertColumnsAfter(targetSheet.getMaxColumns(), values[0].length - targetSheet.getMaxColumns());
      }
      targetSheet.getRange(1, 1, values.length, values[0].length).setValues(values);
      restored += 1;
    });
    if (!restored) return Utils_Response.error("O backup não contém abas restauráveis.", 422);
    return Utils_Response.success({ status: "restored", backupId: backupId, sheetsRestored: restored });
  } catch (err) {
    Utils_Logger.logError("Service_Export.restoreDatabaseSnapshot", err.message, err.stack);
    return Utils_Response.error("Restore failed: " + err.message, 500);
  }
}
