/**
 * Arquivo: Utils_Logger.gs
 * Funcionalidades: Grava logs de erro, debug e informações na aba "Logs" da planilha para auditoria e depuração. Ajuda a rastrear o comportamento do sistema.
 * Integrações: Todos os módulos backend que precisam registrar eventos ou erros.
 * Dependências: DB_Connection.gs.
 */

function log(level, component, message, stackTrace = "") {
  const timestamp = new Date().toISOString();
  const safeMessage = String(message || "").substring(0, 5000);
  const safeStack = String(stackTrace || "").substring(0, 20000);
  try {
    DB_Connection.appendRow("Logs", [timestamp, level, component, safeMessage, safeStack]);
  } catch (loggingError) {
    // Logging must never hide the original application failure (notably before setup).
    Logger.log(JSON.stringify({ timestamp: timestamp, level: level, component: component, message: safeMessage, loggingError: loggingError.message }));
  }
}

function logInfo(component, message) {
  log("INFO", component, message);
}

function logWarning(component, message) {
  log("WARNING", component, message);
}

function logError(component, message, stackTrace = "") {
  log("ERROR", component, message, stackTrace);
}
