/** Jornada básica idempotente: sistema inicial, primeira simulação e leitura dos resultados. */

const BASIC_WORKFLOW_KEY = "basic_cycle_v1";

function Workflow_buildStarterBoard() {
  return {
    workflowKey: BASIC_WORKFLOW_KEY,
    modules: [
      { id: "mod007", instanceId: "starter-source", name: "Coletor de Água Cinza", type: "greywater_input", x: 1, y: 4, z: 0, orientation: "east", waterVolume: 12 },
      { id: "mod002", instanceId: "starter-filter", name: "Filtro de Água Cinza", type: "greywater_treatment", x: 4, y: 4, z: 0, orientation: "east" },
      { id: "mod004", instanceId: "starter-garden", name: "Canteiro Elevado", type: "garden_output", x: 7, y: 4, z: 0, orientation: "east", plantId: "plant001" }
    ],
    connections: [
      { from: { id: "starter-source", output: "greywater_raw" }, to: { id: "starter-filter", input: "greywater_raw" }, waterVolume: 12 },
      { from: { id: "starter-filter", output: "greywater_treated" }, to: { id: "starter-garden", input: "greywater_treated" }, waterVolume: 12 }
    ]
  };
}

function Workflow_assertStarterCatalog() {
  const missing = ["mod007", "mod002", "mod004"].filter(function(id) { return !GameSheets.modules.getById(id); });
  if (!GameSheets.plants.getById("plant001")) missing.push("plant001");
  return missing;
}

function Workflow_statusForUser(userId) {
  const boards = GameSheets.boards.listByUser(userId).slice().sort(function(left, right) { return new Date(right.timestamp) - new Date(left.timestamp); });
  const simulations = GameSheets.simulations.listByUser(userId).slice().sort(function(left, right) { return new Date(right.timestamp) - new Date(left.timestamp); });
  const starter = boards.find(function(board) { return board.boardJson && board.boardJson.workflowKey === BASIC_WORKFLOW_KEY; });
  const activeBoard = starter || boards[0] || null;
  const completedSimulation = activeBoard
    ? simulations.find(function(log) { return String(log.boardId) === String(activeBoard.id); }) || null
    : null;
  const workflowSimulations = activeBoard ? simulations.filter(function(log) { return String(log.boardId) === String(activeBoard.id); }) : [];
  const reviewed = Boolean(completedSimulation && completedSimulation.reflection && completedSimulation.nextChange);
  const bestScore = workflowSimulations.length ? Math.max.apply(null, workflowSimulations.map(function(log) { return Number(log.score) || 0; })) : null;
  const progress = reviewed ? 100 : completedSimulation ? 80 : activeBoard ? 50 : 20;
  return {
    key: BASIC_WORKFLOW_KEY,
    progress: progress,
    boardId: activeBoard ? activeBoard.id : null,
    bestScore: bestScore,
    steps: [
      { key: "account", label: "Entrar no laboratório", complete: true },
      { key: "board", label: "Montar um ecociclo", complete: Boolean(activeBoard) },
      { key: "simulation", label: "Executar o diagnóstico", complete: Boolean(completedSimulation) },
      { key: "results", label: "Interpretar e decidir a próxima mudança", complete: reviewed }
    ],
    nextAction: !activeBoard
      ? { type: "start", label: "Montar sistema inicial", view: "boardEditor" }
      : !completedSimulation
        ? { type: "continue", label: "Simular este sistema", view: "boardEditor", boardId: activeBoard.id }
        : !reviewed
          ? { type: "review", label: "Registrar minha decisão", boardId: activeBoard.id, simulationId: completedSimulation.id }
          : { type: "results", label: "Ver resultados", view: "reports", boardId: activeBoard.id }
  };
}

function reviewBasicWorkflow(payload) {
  const userId = Utils_Session.getUserId((payload || {}).token);
  if (!userId) return Utils_Response.error("Invalid session.", 401);
  const status = Workflow_statusForUser(userId);
  if (!status.boardId || !status.nextAction || status.nextAction.type !== "review") {
    return Utils_Response.error("Run the workflow simulation before reviewing it.", 409);
  }
  const simulationId = String(payload.simulationId || "");
  if (simulationId !== String(status.nextAction.simulationId)) {
    return Utils_Response.error("Simulation does not belong to the active workflow.", 404);
  }
  const reflection = Utils_Validation.normalizeText(payload.reflection, 420);
  const nextChange = Utils_Validation.normalizeText(payload.nextChange, 240);
  if (reflection.length < 12 || nextChange.length < 8) {
    return Utils_Response.error("Explain one finding and the next change you would test.", 400);
  }
  const reviewed = GameSheets.simulations.review(simulationId, userId, reflection, nextChange);
  if (!reviewed) return Utils_Response.error("Could not save the workflow review.", 500);
  return Utils_Response.success({ workflow: Workflow_statusForUser(userId), review: reviewed }, "Workflow review saved.");
}

function getBasicWorkflowStatus(payload) {
  const userId = Utils_Session.getUserId((payload || {}).token);
  if (!userId) return Utils_Response.error("Invalid session.", 401);
  return Utils_Response.success(Workflow_statusForUser(userId));
}

function startBasicWorkflow(payload) {
  const userId = Utils_Session.getUserId((payload || {}).token);
  if (!userId) return Utils_Response.error("Invalid session.", 401);
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const existingStatus = Workflow_statusForUser(userId);
    if (existingStatus.boardId) {
      return Utils_Response.success({ boardId: existingStatus.boardId, created: false, workflow: existingStatus }, "Workflow already started.");
    }
    const missingCatalogItems = Workflow_assertStarterCatalog();
    if (missingCatalogItems.length) {
      return Utils_Response.error("Game catalog is not initialized.", 503, { missing: missingCatalogItems });
    }
    const board = GameSheets.boards.create(userId, "Meu Primeiro Ecociclo", Workflow_buildStarterBoard());
    if (!board) return Utils_Response.error("Could not create starter board.", 500);
    GameSheets.notifications.create(userId, "info", "Jornada iniciada", "Seu primeiro ecociclo está pronto. Ajuste, simule e compare o resultado.", "workflow:" + BASIC_WORKFLOW_KEY);
    return Utils_Response.success({ boardId: board.id, created: true, workflow: Workflow_statusForUser(userId) }, "Starter workflow created.", 201);
  } finally {
    lock.releaseLock();
  }
}
