/**
 * Arquivo: Engine_FlowPath.gs
 * Funcionalidades: Segue a rota da água (água cinza, água negra, urina, efluente tratado) dos pontos de origem (chuveiros, vasos sanitários) até as plantas ou descarte. Mapeia interrupções, vazamentos e misturas indevidas.
 * Contexto Eco-Grow: Cria a "Árvore de Fluxo" segregada. Se cruzar indevidamente ou houver vazamentos, sinaliza falha e penalidades.
 * Integrações: Engine_Core.gs, Rule_Definitions.gs, Model_Module.gs, Utils_Matrix.gs.
 * Dependências: Rule_Definitions.gs, Model_Module.gs, Utils_Matrix.gs, Utils_Logger.gs.
 */

function mapFlows(boardData) {
  const flowPaths = [];
  const modulesByKey = {};
  boardData.modules.forEach(function(module) {
    modulesByKey[Utils_Validation.getBoardModuleKey(module)] = module;
  });
  const connections = Array.isArray(boardData.connections) ? boardData.connections : [];

  // Identificar todos os pontos de origem (entradas de água cinza/negra)
  const originModules = boardData.modules.filter(module => 
    module.type === "greywater_input" || module.type === "blackwater_input"
  );

  originModules.forEach(function(origin) {
    const originDefinition = Model_Module.getModuleById(Utils_Validation.getBoardModuleCatalogId(origin));
    const currentPath = {
      originModule: origin,
      path: [origin],
      flowType: origin.type === "greywater_input" ? "greywater_raw" : "blackwater_raw",
      connections: [],
      waterVolume: typeof origin.waterVolume === "number" ? origin.waterVolume : (originDefinition ? Number(originDefinition.capacity) || 0 : 0),
      issues: []
    };
    traverseFlow(origin, currentPath, modulesByKey, connections, {}, flowPaths);
  });

  if (originModules.length === 0) {
    flowPaths.push({ originModule: null, path: [], flowType: "unknown", connections: [], waterVolume: 0, issues: ["Nenhuma origem de fluxo foi encontrada."] });
  }

  return flowPaths;
}

function traverseFlow(currentModule, currentPath, modulesByKey, connections, visited, flowPaths) {
  const currentKey = Utils_Validation.getBoardModuleKey(currentModule);
  if (visited[currentKey]) {
    currentPath.issues.push("Ciclo de fluxo detectado no módulo " + currentKey + ".");
    flowPaths.push(currentPath);
    return;
  }
  const branchVisited = Object.assign({}, visited);
  branchVisited[currentKey] = true;
  const outgoing = connections.filter(function(connection) {
    return (connection.from.instanceId || connection.from.id) === currentKey;
  });

  if (outgoing.length === 0) {
    if (currentModule.type !== "garden_output") currentPath.issues.push("Fluxo interrompido no módulo " + currentKey + ".");
    flowPaths.push(currentPath);
    return;
  }

  outgoing.forEach(function(connection) {
    const receiverKey = connection.to.instanceId || connection.to.id;
    const receiver = modulesByKey[receiverKey];
    if (!receiver) {
      const brokenPath = Object.assign({}, currentPath, { issues: currentPath.issues.concat(["Destino desconhecido: " + receiverKey + "."]) });
      flowPaths.push(brokenPath);
      return;
    }
    let volume = currentPath.waterVolume;
    if (typeof connection.waterVolume === "number") volume = connection.waterVolume;
    else if (typeof connection.from.waterVolume === "number") volume = connection.from.waterVolume;
    const nextPath = {
      originModule: currentPath.originModule,
      path: currentPath.path.concat([receiver]),
      flowType: currentPath.flowType,
      connections: currentPath.connections.concat([connection]),
      waterVolume: Math.max(0, Number(volume) || 0),
      issues: currentPath.issues.slice()
    };
    traverseFlow(receiver, nextPath, modulesByKey, connections, branchVisited, flowPaths);
  });
}
