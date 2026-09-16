/** Ativação manual, única e idempotente para uma implantação nova do jogo. */

function activateEcoGrow() {
  validateConfig();
  initializeDatabase();
  seedInitialData();
  const status = getEcoGrowActivationStatus();
  Utils_Logger.logInfo("Setup_Activate", "EcoGrow activated with " + status.modules + " modules and " + status.plants + " plants.");
  return status;
}

function getEcoGrowActivationStatus() {
  validateConfig();
  return {
    active: true,
    users: GameSheets.users.list().filter(function(user) { return user && user.id; }).length,
    boards: GameSheets.boards.list().length,
    modules: GameSheets.modules.list().length,
    plants: GameSheets.plants.list().length,
    simulations: GameSheets.simulations.list().length,
    checkedAt: new Date().toISOString()
  };
}
