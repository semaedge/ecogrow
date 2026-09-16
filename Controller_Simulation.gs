/**
 * Arquivo: Controller_Simulation.gs
 * Funcionalidades: Ponto de partida do processamento lógico. Recebe o JSON do tabuleiro do frontend, aciona a Engine, e devolve o JSON de status e score.
 * Contexto Eco-Grow: Orquestra a simulação completa do sistema hidrossanitário da Tiny House, validando inputs, executando cálculos de fluxo, nutrição e saneamento.
 * Integrações: Engine_Core.gs, Engine_Validation.gs, Model_SimulationLog.gs, Model_Board.gs.
 * Dependências: Engine_Core.gs, Auth_Service.gs, Utils_Response.gs, Utils_Logger.gs.
 */

function runSimulation(payload) {
  const userId = Auth_Service.validateSessionToken(payload.token);
  if (!userId) {
    return Utils_Response.error("Invalid session.", 401);
  }

  const boardId = payload.boardId;
  const boardData = payload.boardData; // Pode vir diretamente ou ser carregado pelo ID

  let resolvedBoardData;
  let boardName = "Unnamed Board";

  // Um boardId sempre precisa pertencer à sessão, inclusive quando o cliente
  // envia uma versão ainda não salva do tabuleiro para simular.
  let persistedBoard = null;
  if (boardId) {
    persistedBoard = GameSheets.boards.getById(boardId);
    if (!persistedBoard || persistedBoard.userId !== userId) {
      return Utils_Response.error("Board not found or unauthorized access.", 404);
    }
  }
  if (!boardData && persistedBoard) {
    resolvedBoardData = persistedBoard.boardJson;
    boardName = persistedBoard.name;
  } else if (boardData) {
    resolvedBoardData = boardData;
    boardName = persistedBoard ? persistedBoard.name : (payload.boardName || boardName);
  } else {
    return Utils_Response.error("No board data provided.", 400);
  }

  const boardValidation = Utils_Validation.validateBoardData(resolvedBoardData, { requireModules: true });
  if (!boardValidation.isValid) return Utils_Response.error("Invalid board data structure.", 400, { errors: boardValidation.errors });

  try {
    Utils_Logger.logInfo("Controller_Simulation", `Starting simulation for user ${userId}, board: ${boardName}`);
    
    // Executa a simulação através do Engine_Core
    const simulationResult = Engine_Core.run(resolvedBoardData);

    // Registra o resultado no log de simulações
    const logEntry = GameSheets.simulations.create({
      userId: userId,
      boardId: boardId || null,
      boardName: boardName,
      score: simulationResult.score,
      feedback: simulationResult.feedback,
      breakdown: simulationResult.breakdown || null,
      timestamp: new Date().toISOString()
    });

    if (!logEntry) {
      Utils_Logger.logWarning("Controller_Simulation", "Failed to save simulation log, but simulation was successful.");
    }

    let economyReward = null;
    let notificationsCreated = 0;
    if (logEntry) {
      try {
        economyReward = Service_Economy.awardSimulationReward(userId, logEntry.id, simulationResult.score);
      } catch (economyError) {
        Utils_Logger.logWarning("Controller_Simulation", "Reward could not be applied: " + economyError.message);
      }
      try {
        notificationsCreated = Service_Notification.createSimulationNotifications(userId, logEntry.id, simulationResult).length;
      } catch (notificationError) {
        Utils_Logger.logWarning("Controller_Simulation", "Notifications could not be created: " + notificationError.message);
      }
    }

    Utils_Logger.logInfo("Controller_Simulation", `Simulation completed with score: ${simulationResult.score}`);

    // Retorna o resultado da simulação para o frontend
    return Utils_Response.success({
      score: simulationResult.score,
      feedback: simulationResult.feedback,
      breakdown: simulationResult.breakdown || {},
      flowPaths: simulationResult.flowPaths || [],
      waterQuality: simulationResult.waterQuality || {},
      plantHealth: simulationResult.plantHealth || {},
      logId: logEntry ? logEntry.id : null,
      reward: economyReward ? { amount: economyReward.amount || 0, balance: economyReward.balanceAfter, applied: economyReward.applied === true } : null,
      notificationsCreated: notificationsCreated,
      boardName: boardName,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    Utils_Logger.logError("Controller_Simulation", `Simulation failed: ${error.message}`, error.stack);
    return Utils_Response.error("Simulation failed.", 500);
  }
}
