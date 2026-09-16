/**
 * Arquivo: Engine_Core.gs
 * Funcionalidades: O coração do simulador "Eco-Grow". Orquestra a leitura da matriz do tabuleiro, invoca a verificação de caminhos de fluxo, aplica a sequência de transformação das águas e nutrientes, e calcula o score final.
 * Contexto Eco-Grow: Representa a realidade da Tiny House, garantindo que a segregação de águas ocorra, as regras de saneamento e nutrição sejam validadas e os recursos sejam otimizados para o crescimento das plantas.
 * Integrações: Engine_Validation.gs, Engine_FlowPath.gs, Engine_Sanitation.gs, Engine_Nutrition.gs, Engine_Mixing.gs, Engine_Distribution.gs, Engine_Scoring.gs, Rule_Definitions.gs, Model_Module.gs, Model_Plant.gs.
 * Dependências: Todos os módulos Engine_*, Rule_Definitions.gs, Model_Module.gs, Model_Plant.gs, Utils_Matrix.gs, Utils_Logger.gs.
 */

function run(boardData) {
  Utils_Logger.logInfo("Engine_Core", "Starting simulation for board.");

  let simulationState = {
    board: boardData,
    modules: Model_Module.getAllModules(), // Carrega todos os módulos disponíveis
    plants: Model_Plant.getAllPlants(),   // Carrega todas as plantas disponíveis
    flowPaths: [], // Caminhos de fluxo identificados
    waterQuality: {}, // Qualidade da água em cada ponto do fluxo (patógenos, NPK)
    plantHealth: {}, // Saúde e crescimento das plantas
    issues: [] // Problemas encontrados durante a simulação
  };

  // 1. Validação Estrutural e Geométrica
  const validationResult = Engine_Validation.validateBoard(simulationState.board);
  if (!validationResult.isValid) {
    simulationState.issues.push({ type: "critical", message: validationResult.message });
    return Engine_Scoring.calculateScore(simulationState); // Retorna score baixo imediatamente
  }

  // 2. Mapeamento dos Caminhos de Fluxo (Água Cinza, Água Negra)
  simulationState.flowPaths = Engine_FlowPath.mapFlows(simulationState.board);
  simulationState.flowPaths.forEach(function(path) {
    path.issues.forEach(function(message) { addSimulationIssue(simulationState, "warning", message); });
  });

  // 3. Aplicação das Transformações de Saneamento e Nutrição ao longo dos fluxos
  simulationState = Engine_Sanitation.processSanitation(simulationState);
  simulationState = Engine_Nutrition.processNutrition(simulationState);
  simulationState = Engine_Mixing.processMixing(simulationState);
  simulationState = evaluatePlantHealth(simulationState);
  simulationState = Engine_Distribution.processDistribution(simulationState);

  // 5. Cálculo do Score Final e Feedback
  const finalScore = Engine_Scoring.calculateScore(simulationState);
  // Expõe somente o diagnóstico necessário à UI; o estado interno completo não atravessa a API.
  finalScore.flowPaths = simulationState.flowPaths.map(function(flowPath) {
    return {
      flowType: flowPath.flowType,
      waterVolume: Number(flowPath.waterVolume) || 0,
      issues: Array.isArray(flowPath.issues) ? flowPath.issues.slice() : [],
      connections: Array.isArray(flowPath.connections) ? flowPath.connections : [],
      path: (flowPath.path || []).map(function(module) {
        return {
          instanceId: module.instanceId || module.id,
          id: module.id,
          name: module.name,
          type: module.type,
          x: Number(module.x) || 0,
          y: Number(module.y) || 0,
          z: Number(module.z) || 0
        };
      })
    };
  });
  finalScore.waterQuality = simulationState.waterQuality;
  finalScore.plantHealth = simulationState.plantHealth;

  Utils_Logger.logInfo("Engine_Core", "Simulation finished.");
  return finalScore;
}

function evaluatePlantHealth(simulationState) {
  simulationState.board.modules.forEach(function(module) {
    if (module.type === "garden_output") {
      const plant = simulationState.plants.find(function(candidate) { return candidate.id === module.plantId; });
      const key = getSimulationModuleKey(module);
      if (plant) {
        const quality = ensureWaterQualityEntry(simulationState, key);
        let health = 100;
        ["N", "P", "K"].forEach(function(nutrient) {
          const required = Number(plant.npkRequirements[nutrient]) || 0;
          if (required > 0 && (quality.npk[nutrient] < required * 0.8 || quality.npk[nutrient] > required * 1.2)) health -= 8;
        });
        if (quality.pathogens.bacteria > Number(plant.pathogenTolerance.bacteria || 0) || quality.pathogens.virus > Number(plant.pathogenTolerance.virus || 0)) health -= 25;
        simulationState.plantHealth[key] = Math.max(0, health);
      } else {
        simulationState.plantHealth[key] = 0;
        addSimulationIssue(simulationState, "critical", "Planta desconhecida no módulo " + key + ".");
      }
    }
  });
  return simulationState;
}

function getSimulationModuleKey(module) {
  return Utils_Validation.getBoardModuleKey(module);
}

function getSimulationModuleDefinition(module) {
  return Model_Module.getModuleById(Utils_Validation.getBoardModuleCatalogId(module));
}

function ensureWaterQualityEntry(simulationState, moduleKey) {
  if (!simulationState.waterQuality[moduleKey]) {
    simulationState.waterQuality[moduleKey] = {
      pathogens: { bacteria: 0, virus: 0 },
      npk: { N: 0, P: 0, K: 0 },
      waterVolume: 0
    };
  }
  const entry = simulationState.waterQuality[moduleKey];
  if (!entry.pathogens) entry.pathogens = { bacteria: 0, virus: 0 };
  if (!entry.npk) entry.npk = { N: 0, P: 0, K: 0 };
  if (typeof entry.waterVolume !== "number") entry.waterVolume = 0;
  return entry;
}

function addSimulationIssue(simulationState, type, message) {
  const exists = simulationState.issues.some(function(issue) { return issue.type === type && issue.message === message; });
  if (!exists) simulationState.issues.push({ type: type, message: message });
}
