/**
 * Arquivo: Engine_Distribution.gs
 * Funcionalidades: Lógica do "Distribuidor Terminal". Divide volumes de fluxo conforme a capacidade de absorção da planta-alvo ou reservatório. Garante que os conectores finais atendam corretamente a matriz radicular ou o destino final.
 * Contexto Eco-Grow: Assegura que a água tratada e os nutrientes sejam distribuídos de forma eficiente e adequada para as plantas, evitando excessos ou deficiências de irrigação.
 * Integrações: Engine_Core.gs, Model_Module.gs, Model_Plant.gs, Rule_Definitions.gs.
 * Dependências: Model_Module.gs, Model_Plant.gs, Rule_Definitions.gs, Utils_Logger.gs.
 */

function processDistribution(simulationState) {
  Utils_Logger.logInfo("Engine_Distribution", "Processing flow distribution to final modules.");
  const deliveries = {};
  simulationState.flowPaths.forEach(function(flowPath) {
    if (!flowPath.path.length) return;
    const target = flowPath.path[flowPath.path.length - 1];
    if (target.type !== "garden_output") return;
    const key = getSimulationModuleKey(target);
    if (!deliveries[key]) deliveries[key] = { module: target, volume: 0, paths: [] };
    deliveries[key].volume += Math.max(0, Number(flowPath.waterVolume) || 0);
    deliveries[key].paths.push(flowPath);
  });

  Object.keys(deliveries).forEach(function(key) {
    const delivery = deliveries[key];
    const plant = simulationState.plants.find(function(candidate) { return candidate.id === delivery.module.plantId; });
    const quality = ensureWaterQualityEntry(simulationState, key);
    quality.waterVolume = delivery.volume;
    if (!plant) return;
    const waterRequired = Number(plant.waterRequirements) || 0;
    let message = "";
    if (delivery.volume < waterRequired * 0.8) message = `Deficiência hídrica em ${plant.name}`;
    else if (delivery.volume > waterRequired * 1.2) message = `Excesso hídrico em ${plant.name}`;
    if (message) {
      delivery.paths.forEach(function(path) { path.issues.push(message + `. Necessário: ${waterRequired}, recebido: ${delivery.volume}.`); });
      addSimulationIssue(simulationState, "warning", message);
      const currentHealth = simulationState.plantHealth[key] === undefined ? 100 : simulationState.plantHealth[key];
      simulationState.plantHealth[key] = Math.max(0, currentHealth - 15);
    }
  });

  return simulationState;
}
