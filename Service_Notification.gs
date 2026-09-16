/** Notificações derivadas de eventos do jogo e envio opcional por e-mail. */

function sendFrontendNotification(payload) {
  payload = payload || {};
  const message = Utils_Validation.normalizeText(payload.message, 500);
  if (!message) return Utils_Response.error("Notification message is required.", 400);
  return Utils_Response.success({ notification: { message: message, type: payload.type || "info" } });
}

function createSimulationNotifications(userId, logId, simulationResult) {
  const created = [];
  const score = Number(simulationResult.score) || 0;
  created.push(GameSheets.notifications.create(
    userId, score >= 75 ? "success" : score >= 50 ? "warning" : "error",
    "Simulação concluída", "Seu sistema alcançou " + score + " pontos.", "simulation:" + logId
  ));
  (simulationResult.feedback || []).filter(function(item) { return item.type === "critical" || item.type === "warning"; }).slice(0, 3).forEach(function(item) {
    created.push(GameSheets.notifications.create(userId, item.type === "critical" ? "error" : "warning", "Atenção no projeto", item.message, "simulation:" + logId));
  });
  return created;
}

function sendEmailNotification(userId, subject, body) {
  const user = GameSheets.users.getById(userId);
  if (!user || !user.email) return false;
  try {
    MailApp.sendEmail(user.email, Utils_Validation.normalizeText(subject, 150), String(body || "").substring(0, 10000));
    Utils_Logger.logInfo("Service_Notification", "Email sent to user " + userId);
    return true;
  } catch (error) {
    Utils_Logger.logError("Service_Notification", "Email delivery failed: " + error.message);
    return false;
  }
}
