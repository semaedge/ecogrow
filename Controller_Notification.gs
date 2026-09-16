/** Endpoints da caixa de notificações. */

function listNotifications(payload) {
  const userId = Auth_Service.validateSessionToken((payload || {}).token);
  if (!userId) return Utils_Response.error("Invalid session.", 401);
  const notifications = GameSheets.notifications.listByUser(userId, payload.unreadOnly === true, payload.limit);
  return Utils_Response.success({
    notifications: notifications,
    unreadCount: GameSheets.notifications.listByUser(userId, true, 100).length
  });
}

function markNotificationRead(payload) {
  const userId = Auth_Service.validateSessionToken((payload || {}).token);
  if (!userId) return Utils_Response.error("Invalid session.", 401);
  const notificationId = Utils_Validation.normalizeText(payload.notificationId, 100);
  if (!notificationId) return Utils_Response.error("notificationId is required.", 400);
  return GameSheets.notifications.markRead(userId, notificationId)
    ? Utils_Response.success({ notificationId: notificationId }, "Notification marked as read.")
    : Utils_Response.error("Notification not found.", 404);
}
