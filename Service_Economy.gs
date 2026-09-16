/** Regras econômicas do jogo. */

function getModuleCost(moduleId) {
  const module = GameSheets.modules.getById(moduleId);
  return module ? Math.max(1, Math.round((Number(module.capacity) || 0) * 5 + 10)) : null;
}

function getPlantHarvestValue(plantId) {
  const plant = GameSheets.plants.getById(plantId);
  return plant ? (plant.type === "fruiting_plant" ? 20 : plant.type === "herb" ? 12 : 10) : null;
}

function calculateMaintenanceCost(boardData) {
  if (!boardData || !Array.isArray(boardData.modules)) return 0;
  return boardData.modules.reduce(function(total, boardModule) {
    const definition = GameSheets.modules.getById(Utils_Validation.getBoardModuleCatalogId(boardModule));
    return total + (definition ? Math.max(1, Math.ceil((Number(definition.capacity) || 0) * 0.02)) : 0);
  }, 0);
}

function calculateSimulationReward(score) {
  score = Math.max(0, Math.min(100, Number(score) || 0));
  return Math.floor(score / 5) + (score >= 90 ? 15 : score >= 75 ? 5 : 0);
}

function awardSimulationReward(userId, logId, score) {
  const reward = calculateSimulationReward(score);
  if (reward <= 0) return { applied: false, amount: 0 };
  return GameSheets.economy.apply(userId, "simulation_reward", reward, "simulation:" + logId, "Recompensa por simulação (score " + score + ")");
}

function updatePlayerBalance(userId, amount) {
  const transaction = GameSheets.economy.apply(userId, "adjustment", amount, "", "Ajuste de saldo");
  return transaction.balanceAfter;
}
