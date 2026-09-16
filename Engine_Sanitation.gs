/**
 * Arquivo: Engine_Sanitation.gs
 * Funcionalidades: Aplica cálculos de redução de carga biológica (bactérias, vírus, etc.) aos fluxos de água e resíduos. Avalia a segurança sanitária dos efluentes e compostos.
 * Contexto Eco-Grow: Valida se a água de defecação passou por barreira robusta de tratamento e se a micção foi estabilizada. Se falhar, sinaliza risco biológico ativo.
 * Integrações: Engine_Core.gs, Rule_Definitions.gs, Model_Module.gs.
 * Dependências: Rule_Definitions.gs, Model_Module.gs, Utils_Logger.gs.
 */

function processSanitation(simulationState) {
  Utils_Logger.logInfo("Engine_Sanitation", "Processing sanitation for all flows.");

  // Inicializa a qualidade da água para cada módulo de saída
  simulationState.board.modules.forEach(function(module) {
    ensureWaterQualityEntry(simulationState, getSimulationModuleKey(module));
  });

  simulationState.flowPaths.forEach(flowPath => {
    let currentPathogens = { bacteria: Rule_Definitions.getInitialPathogenLoad(flowPath.flowType).bacteria, virus: Rule_Definitions.getInitialPathogenLoad(flowPath.flowType).virus };

    flowPath.path.forEach(function(moduleInPath) {
      const moduleDefinition = getSimulationModuleDefinition(moduleInPath);
      if (moduleDefinition && moduleDefinition.pathogenReduction) {
        currentPathogens.bacteria *= (1 - moduleDefinition.pathogenReduction.bacteria);
        currentPathogens.virus *= (1 - moduleDefinition.pathogenReduction.virus);
      }

      // Armazena a qualidade da água no ponto de saída de cada módulo
      const moduleKey = getSimulationModuleKey(moduleInPath);
      const quality = ensureWaterQualityEntry(simulationState, moduleKey);
      quality.pathogens.bacteria = Math.max(quality.pathogens.bacteria, currentPathogens.bacteria);
      quality.pathogens.virus = Math.max(quality.pathogens.virus, currentPathogens.virus);

      // Verifica se há risco biológico ativo em pontos críticos (ex: antes de irrigar plantas comestíveis)
      if (moduleInPath.type === "garden_output" && 
          (currentPathogens.bacteria > Rule_Definitions.getMaxPathogenTolerance("bacteria_for_edibles") || 
           currentPathogens.virus > Rule_Definitions.getMaxPathogenTolerance("virus_for_edibles"))) {
        flowPath.issues.push(`Risco biológico alto detectado no módulo de jardinagem '${moduleInPath.name}' (${moduleInPath.id}). Patógenos: B:${currentPathogens.bacteria.toFixed(2)}, V:${currentPathogens.virus.toFixed(2)}`);
        addSimulationIssue(simulationState, "warning", `Risco biológico em ${moduleInPath.name}`);
      }
    });
  });

  return simulationState;
}
