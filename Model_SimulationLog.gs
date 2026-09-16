/**
 * Arquivo: Model_SimulationLog.gs
 * Funcionalidades: Registra os resultados (JSON final) de cada processamento lógico rodado no motor do jogo para histórico e pontuação.
 * Integrações: DB_Connection.gs, Engine_Scoring.gs.
 * Dependências: DB_Connection.gs, Utils_JSON.gs, Utils_Logger.gs.
 */

function Model_SimulationLog_getSimulationLogsSheet() {
  return DB_Connection.getSheet("SimulationLogs");
}

function Model_SimulationLog_getAllLogs() {
  const data = DB_Connection.readAllData("SimulationLogs");
  if (data.length <= 1) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    let log = {};
    headers.forEach((header, i) => {
      if (header === "feedbackJson" && row[i]) {
        log[header] = Utils_JSON.parse(row[i]);
      } else {
        log[header] = row[i];
      }
    });
    return log;
  });
}

function Model_SimulationLog_getLogById(logId) {
  const logs = Model_SimulationLog_getAllLogs();
  return logs.find(log => log.id === logId);
}

function Model_SimulationLog_getLogsByUserId(userId) {
  const logs = Model_SimulationLog_getAllLogs();
  return logs.filter(log => log.userId === userId);
}

function Model_SimulationLog_createLog(userId, boardId, score, feedbackJson) {
  let boardName = "";
  if (userId && typeof userId === "object") {
    const entry = userId;
    userId = entry.userId;
    boardId = entry.boardId || "";
    boardName = entry.boardName || "";
    score = entry.score;
    feedbackJson = entry.feedback || [];
  }
  const newId = Utilities.getUuid();
  const newLog = { id: newId, userId: userId, boardId: boardId || "", boardName: boardName, timestamp: new Date().toISOString(), score: Number(score) || 0, feedbackJson: feedbackJson || [], reflection: "", nextChange: "", reviewedAt: "" };
  DB_Connection.mutateSheetData("SimulationLogs", function(data) {
    const requiredHeaders = ["id", "userId", "boardId", "boardName", "timestamp", "score", "feedbackJson", "reflection", "nextChange", "reviewedAt"];
    if (!data.length || !data[0].some(function(value) { return value !== ""; })) data = [requiredHeaders];
    const headers = data[0];
    requiredHeaders.forEach(function(header) {
      if (headers.indexOf(header) === -1) {
        headers.push(header);
        for (let index = 1; index < data.length; index++) data[index].push("");
      }
    });
    data.push(headers.map(function(header) {
      if (header === "feedbackJson") return Utils_JSON.stringify(newLog.feedbackJson);
      return newLog[header] !== undefined ? newLog[header] : "";
    }));
    return { data: data, value: true };
  });
  Utils_Logger.logInfo("Model_SimulationLog", "New simulation log created for user: " + userId + ", board: " + boardId);
  return newLog;
}

function Model_SimulationLog_review(logId, userId, reflection, nextChange) {
  return DB_Connection.mutateSheetData("SimulationLogs", function(data) {
    if (!data.length) return { data: data, value: null };
    const headers = data[0];
    ["reflection", "nextChange", "reviewedAt"].forEach(function(header) {
      if (headers.indexOf(header) === -1) {
        headers.push(header);
        for (let rowIndex = 1; rowIndex < data.length; rowIndex++) data[rowIndex].push("");
      }
    });
    const idIndex = headers.indexOf("id");
    const userIndex = headers.indexOf("userId");
    const row = data.slice(1).find(function(item) {
      return String(item[idIndex]) === String(logId) && String(item[userIndex]) === String(userId);
    });
    if (!row) return { data: data, value: null };
    const reviewedAt = new Date().toISOString();
    row[headers.indexOf("reflection")] = reflection;
    row[headers.indexOf("nextChange")] = nextChange;
    row[headers.indexOf("reviewedAt")] = reviewedAt;
    return { data: data, value: { id: logId, reflection: reflection, nextChange: nextChange, reviewedAt: reviewedAt } };
  });
}
