/**
 * Arquivo: Engine_Nutrition.gs
 * Funcionalidades: Calcula a evolução e transformação de Nitrogênio (N), Fósforo (P) e Potássio (K) ao longo dos fluxos de água e resíduos. Compara a carga final de nutrientes com as exigências das plantas.
 * Contexto Eco-Grow: Registra excesso, deficiência ou compatibilidade de adubação, impactando a saúde e o crescimento das plantas.
 * Integrações: Engine_Core.gs, Rule_Definitions.gs, Model_Module.gs, Model_Plant.gs.
 * Dependências: Rule_Definitions.gs, Model_Module.gs, Model_Plant.gs, Utils_Logger.gs.
 */

function processNutrition(simulationState) {
  Utils_Logger.logInfo("Engine_Nutrition", "Processing nutrition for all flows.");

  // Inicializa os nutrientes para cada módulo de saída
  simulationState.board.modules.forEach(function(module) {
    ensureWaterQualityEntry(simulationState, getSimulationModuleKey(module));
  });

  simulationState.flowPaths.forEach(flowPath => {
    let currentNPK = { N: Rule_Definitions.getInitialNPKLoad(flowPath.flowType).N, P: Rule_Definitions.getInitialNPKLoad(flowPath.flowType).P, K: Rule_Definitions.getInitialNPKLoad(flowPath.flowType).K };

    flowPath.path.forEach(function(moduleInPath) {
      const moduleDefinition = getSimulationModuleDefinition(moduleInPath);
      if (moduleDefinition && moduleDefinition.npkImpact) {
        currentNPK.N += moduleDefinition.npkImpact.N;
        currentNPK.P += moduleDefinition.npkImpact.P;
        currentNPK.K += moduleDefinition.npkImpact.K;
      }

      // Garante que os valores de NPK não sejam negativos
      currentNPK.N = Math.max(0, currentNPK.N);
      currentNPK.P = Math.max(0, currentNPK.P);
      currentNPK.K = Math.max(0, currentNPK.K);

      // Armazena os nutrientes no ponto de saída de cada módulo
      const moduleKey = getSimulationModuleKey(moduleInPath);
      const quality = ensureWaterQualityEntry(simulationState, moduleKey);
      quality.npk.N = Math.max(quality.npk.N, currentNPK.N);
      quality.npk.P = Math.max(quality.npk.P, currentNPK.P);
      quality.npk.K = Math.max(quality.npk.K, currentNPK.K);

      // Se for um módulo de jardinagem, compara com as necessidades da planta
      if (moduleInPath.type === "garden_output") {
        const plant = simulationState.plants.find(p => p.id === moduleInPath.plantId); // Assumindo que módulos de jardim têm um plantId
        if (plant) {
          const requiredNPK = plant.npkRequirements;
          const receivedNPK = quality.npk;

          // Verifica deficiência ou excesso
          if (receivedNPK.N < requiredNPK.N * 0.8 || receivedNPK.N > requiredNPK.N * 1.2) {
            flowPath.issues.push(`Desequilíbrio de Nitrogênio (N) na planta ${plant.name} (${moduleInPath.id}). Necessário: ${requiredNPK.N.toFixed(2)}, Recebido: ${receivedNPK.N.toFixed(2)}`);
            addSimulationIssue(simulationState, "warning", `Desequilíbrio de N em ${plant.name}`);
          }
          if (receivedNPK.P < requiredNPK.P * 0.8 || receivedNPK.P > requiredNPK.P * 1.2) {
            flowPath.issues.push(`Desequilíbrio de Fósforo (P) na planta ${plant.name} (${moduleInPath.id}). Necessário: ${requiredNPK.P.toFixed(2)}, Recebido: ${receivedNPK.P.toFixed(2)}`);
            addSimulationIssue(simulationState, "warning", `Desequilíbrio de P em ${plant.name}`);
          }
          if (receivedNPK.K < requiredNPK.K * 0.8 || receivedNPK.K > requiredNPK.K * 1.2) {
            flowPath.issues.push(`Desequilíbrio de Potássio (K) na planta ${plant.name} (${moduleInPath.id}). Necessário: ${requiredNPK.K.toFixed(2)}, Recebido: ${receivedNPK.K.toFixed(2)}`);
            addSimulationIssue(simulationState, "warning", `Desequilíbrio de K em ${plant.name}`);
          }
        }
      }
    });
  });

  return simulationState;
}
