/**
 * Arquivo: Controller_Report.gs
 * Funcionalidades: Gera relatórios textuais e exportações de dados das simulações para análise do sistema e do desempenho do jogador.
 * Integrações: Model_SimulationLog.gs, Model_Board.gs, Model_User.gs.
 * Dependências: Model_SimulationLog.gs, Model_Board.gs, Model_User.gs, Auth_Service.gs, Utils_Response.gs.
 */

function generateReport(payload) {
  const userId = Auth_Service.validateSessionToken(payload.token);
  if (!userId) {
    return Utils_Response.error("Invalid session.", 401);
  }

  const reportType = payload.reportType; // Ex: "user_performance", "board_analysis"
  const user = GameSheets.users.getById(userId);
  if (!user) return Utils_Response.error("User not found.", 404);

  let reportContent = "";

  switch (reportType) {
    case "user_performance":
      const userLogs = GameSheets.simulations.listByUser(userId);
      const totalSimulations = userLogs.length;
      const avgScore = totalSimulations > 0 ? userLogs.reduce((sum, log) => sum + (Number(log.score) || 0), 0) / totalSimulations : 0;

      reportContent = `# Relatório de Desempenho do Usuário: ${user.username}\n\n`;
      reportContent += `Total de Simulações Realizadas: ${totalSimulations}\n`;
      reportContent += `Pontuação Média: ${avgScore.toFixed(2)}\n\n`;
      reportContent += `### Histórico de Simulações:\n`;
      userLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).forEach(log => {
        const savedBoard = log.boardId ? GameSheets.boards.getById(log.boardId) : null;
        const boardName = log.boardName || (savedBoard ? savedBoard.name : "Tabuleiro Temporário");
        reportContent += `- Data: ${new Date(log.timestamp).toLocaleString()}, Tabuleiro: ${boardName}, Pontuação: ${log.score}\n`;
      });
      break;
    case "board_analysis":
      const boardId = payload.boardId;
      const board = GameSheets.boards.getById(boardId);
      if (!board || board.userId !== userId) {
        return Utils_Response.error("Board not found or unauthorized.", 404);
      }
      const boardLogs = GameSheets.simulations.list().filter(log => log.boardId === boardId);

      reportContent = `# Análise do Tabuleiro: ${board.name}\n\n`;
      reportContent += `Criado em: ${new Date(board.timestamp).toLocaleString()}\n`;
      reportContent += `Total de Simulações com este Tabuleiro: ${boardLogs.length}\n`;
      reportContent += `Pontuação Média: ${boardLogs.length > 0 ? (boardLogs.reduce((sum, log) => sum + log.score, 0) / boardLogs.length).toFixed(2) : 0}\n\n`;
      reportContent += `### Última Configuração do Tabuleiro (JSON):\n\n`;
      reportContent += '```json\n' + JSON.stringify(board.boardJson, null, 2) + '\n```\n';
      break;
    default:
      return Utils_Response.error("Invalid report type.", 400);
  }

  return Utils_Response.success({ report: reportContent, filename: `EcoGrow_Report_${reportType}_${new Date().getTime()}.md` });
}
