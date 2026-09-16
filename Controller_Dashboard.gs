/**
 * Arquivo: Controller_Dashboard.gs
 * Funcionalidades: Agrega dados para a tela principal (dashboard) do jogador, como pontuações passadas, tabuleiros ativos e estatísticas gerais.
 * Integrações: Model_Board.gs, Model_SimulationLog.gs.
 * Dependências: Model_Board.gs, Model_SimulationLog.gs, Auth_Service.gs, Utils_Response.gs.
 */

function getDashboardData(payload) {
  const userId = Auth_Service.validateSessionToken(payload.token);
  if (!userId) {
    return Utils_Response.error("Invalid session.", 401);
  }

  const userBoards = GameSheets.boards.listByUser(userId);
  const userLogs = GameSheets.simulations.listByUser(userId);
  const user = GameSheets.users.getById(userId);

  // Processar dados para o dashboard
  const latestSimulations = userLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5);
  const totalBoards = userBoards.length;
  const averageScore = userLogs.length > 0 ? userLogs.reduce((sum, log) => sum + (Number(log.score) || 0), 0) / userLogs.length : 0;

  return Utils_Response.success({
    totalBoards: totalBoards,
    averageScore: averageScore,
    balance: user ? Number(user.balance) || 0 : 0,
    unreadNotifications: GameSheets.notifications.listByUser(userId, true, 100).length,
    latestSimulations: latestSimulations.map(function(log) {
      const board = log.boardId ? GameSheets.boards.getById(log.boardId) : null;
      return { id: log.id, boardName: log.boardName || (board ? board.name : "N/A"), score: Number(log.score) || 0, timestamp: log.timestamp };
    }),
    activeBoards: userBoards.map(board => ({ id: board.id, name: board.name, timestamp: board.timestamp }))
  });
}
