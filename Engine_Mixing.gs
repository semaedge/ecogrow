/**
 * Arquivo: Engine_Mixing.gs
 * Funcionalidades: Valida o módulo de "Misturador Controlado" e outras junções de fluxo. Verifica se as correntes já passaram pela sanitização mínima obrigatória antes da união.
 * Contexto Eco-Grow: Pune com status "failed" misturas de água negra/efluente não tratado com água cinza/água tratada sem tratamento prévio adequado.
 * Integrações: Engine_Core.gs, Rule_Definitions.gs.
 * Dependências: Rule_Definitions.gs, Utils_Logger.gs.
 */

function processMixing(simulationState) {
  Utils_Logger.logInfo("Engine_Mixing", "Processing flow mixing validations.");
  const incomingByTarget = {};
  (simulationState.board.connections || []).forEach(function(connection) {
    const targetKey = connection.to.instanceId || connection.to.id;
    if (!incomingByTarget[targetKey]) incomingByTarget[targetKey] = [];
    incomingByTarget[targetKey].push(connection.from.output);
  });
  const modulesByKey = {};
  simulationState.board.modules.forEach(function(module) { modulesByKey[getSimulationModuleKey(module)] = module; });

  Object.keys(incomingByTarget).forEach(function(targetKey) {
    const flowTypes = incomingByTarget[targetKey].filter(function(value, index, values) { return values.indexOf(value) === index; });
    const target = modulesByKey[targetKey];
    if (!target || flowTypes.length < 2) return;
    for (let first = 0; first < flowTypes.length; first++) {
      for (let second = first + 1; second < flowTypes.length; second++) {
        if (Rule_Definitions.isMixingForbidden(flowTypes[first], flowTypes[second], target.type)) {
          addSimulationIssue(simulationState, "critical", `Mistura perigosa em ${target.name || targetKey}: ${flowTypes[first]} com ${flowTypes[second]}.`);
        }
      }
    }
  });

  return simulationState;
}
