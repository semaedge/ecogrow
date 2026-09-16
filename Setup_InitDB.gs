/**
 * Arquivo: Setup_InitDB.gs
 * Funcionalidades: Script de inicialização. Cria as abas (Users, Boards, Modules, Plants, Logs, etc.) e os cabeçalhos caso a planilha esteja vazia ou as abas não existam.
 * Integrações: DB_Connection.gs.
 * Dependências: DB_Connection.gs.
 */

function initializeDatabase() {
  const sheetsToCreate = {
    "Users": ["id", "username", "password", "role", "email", "displayName", "balance", "createdAt"],
    "Boards": ["id", "userId", "name", "timestamp", "boardJson"], // boardJson serializado
    "Modules": ["id", "name", "type", "capacity", "inputs", "outputs", "npkImpact", "pathogenReduction"], // Catálogo de módulos
    "Plants": ["id", "name", "type", "npkRequirements", "waterRequirements", "pathogenTolerance"], // Catálogo de plantas
    "SimulationLogs": ["id", "userId", "boardId", "boardName", "timestamp", "score", "feedbackJson", "reflection", "nextChange", "reviewedAt"], // Histórico de simulações e revisão
    "EconomyTransactions": ["id", "userId", "type", "amount", "balanceAfter", "referenceId", "description", "timestamp"],
    "Notifications": ["id", "userId", "type", "title", "message", "source", "read", "timestamp"],
    "Logs": ["timestamp", "level", "component", "message", "stackTrace"]
  };

  for (let sheetName in sheetsToCreate) {
    const sheet = DB_Connection.getSheet(sheetName);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(sheetsToCreate[sheetName]);
    } else {
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      let changed = false;
      sheetsToCreate[sheetName].forEach(function(header) {
        if (headers.indexOf(header) === -1) {
          headers.push(header);
          for (let rowIndex = 1; rowIndex < data.length; rowIndex++) data[rowIndex].push("");
          changed = true;
        }
      });
      if (changed) DB_Connection.writeAllData(sheetName, data);
    }
  }
  Logger.log("Database initialized successfully.");
}
