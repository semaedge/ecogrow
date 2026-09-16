/** Endpoints de consulta da economia do jogador. */

function getEconomySummary(payload) {
  const userId = Auth_Service.validateSessionToken((payload || {}).token);
  if (!userId) return Utils_Response.error("Invalid session.", 401);
  const user = GameSheets.users.getById(userId);
  if (!user) return Utils_Response.error("User not found.", 404);
  return Utils_Response.success({
    balance: Number(user.balance) || 0,
    transactions: GameSheets.economy.listByUser(userId, payload.limit)
  });
}
