/** Comparativos agregados entre jogadores, sem expor e-mail, saldo ou IDs. */

function getPlayerComparisons(payload) {
  const userId = Utils_Session.getUserId((payload || {}).token);
  if (!userId) return Utils_Response.error("Invalid session.", 401);
  return Utils_Response.success(GameSheets.comparisons.players(userId, { limit: payload.limit }));
}
