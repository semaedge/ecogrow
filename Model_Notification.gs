/** Caixa de notificações persistente por usuário. */

function Model_Notification_create(userId, type, title, message, source) {
  const notification = {
    id: Utilities.getUuid(), userId: userId,
    type: ["info", "success", "warning", "error"].indexOf(type) !== -1 ? type : "info",
    title: Utils_Validation.normalizeText(title, 100),
    message: Utils_Validation.normalizeText(message, 500),
    source: Utils_Validation.normalizeText(source, 100), read: false, timestamp: new Date().toISOString()
  };
  if (!userId || !notification.message) throw new Error("Notification requires userId and message.");
  DB_Connection.mutateSheetData("Notifications", function(data) {
    data = Model_Notification_ensureTable(data);
    data.push(data[0].map(function(header) { return notification[header] !== undefined ? notification[header] : ""; }));
    return { data: data, value: true };
  });
  return notification;
}

function Model_Notification_getByUserId(userId, unreadOnly, limit) {
  const data = DB_Connection.readAllData("Notifications");
  if (data.length <= 1) return [];
  const headers = data[0];
  const entries = data.slice(1).map(function(row) {
    const item = {};
    headers.forEach(function(header, index) { item[header] = header === "read" ? row[index] === true || String(row[index]).toLowerCase() === "true" : row[index]; });
    return item;
  }).filter(function(item) { return item.userId === userId && (!unreadOnly || !item.read); });
  return entries.sort(function(left, right) { return new Date(right.timestamp) - new Date(left.timestamp); }).slice(0, Math.max(1, Math.min(Number(limit) || 30, 100)));
}

function Model_Notification_markRead(userId, notificationId) {
  return DB_Connection.mutateSheetData("Notifications", function(data) {
    data = Model_Notification_ensureTable(data);
    const headers = data[0];
    const idIndex = headers.indexOf("id");
    const userIndex = headers.indexOf("userId");
    const readIndex = headers.indexOf("read");
    let changed = false;
    for (let index = 1; index < data.length; index++) {
      if (data[index][idIndex] === notificationId && data[index][userIndex] === userId) {
        data[index][readIndex] = true;
        changed = true;
        break;
      }
    }
    return { data: data, value: changed };
  });
}

function Model_Notification_ensureTable(data) {
  const headers = ["id", "userId", "type", "title", "message", "source", "read", "timestamp"];
  return !data.length || !data[0].some(function(value) { return value !== ""; }) ? [headers] : data;
}
