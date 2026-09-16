/**
 * Arquivo: Engine_Validation.gs
 * Funcionalidades: Valida puramente a lógica geométrica e física do tabuleiro. Verifica cotas, pisos, portas de entrada/saída, sentido do fluxo e alinhamento (módulo não pode flutuar).
 * Contexto Eco-Grow: Garante que o desenho hidrossanitário e de jardinagem faça sentido no tabuleiro 2D/3D da Tiny House.
 * Integrações: Engine_Core.gs, Rule_Definitions.gs, Utils_Matrix.gs.
 * Dependências: Rule_Definitions.gs, Utils_Matrix.gs.
 */

function validateBoard(boardData) {
  const schemaValidation = Utils_Validation.validateBoardData(boardData, { requireModules: true });
  if (!schemaValidation.isValid) return schemaValidation;
  let isValid = true;
  let messages = [];

  // Validação de limites do tabuleiro
  const maxX = Config.getConfig("BOARD_MAX_X");
  const maxY = Config.getConfig("BOARD_MAX_Y");
  const maxZ = Config.getConfig("BOARD_MAX_Z");

  const moduleByKey = Object.create(null);
  const definitionByKey = Object.create(null);
  boardData.modules.forEach(function(module) {
    const key = Utils_Validation.getBoardModuleKey(module);
    const definition = Model_Module.getModuleById(Utils_Validation.getBoardModuleCatalogId(module));
    moduleByKey[key] = module;
    definitionByKey[key] = definition;
    if (!definition) {
      isValid = false;
      messages.push(`Módulo desconhecido '${key}'.`);
    } else if (!module.type) {
      isValid = false;
      messages.push(`Tipo ausente no módulo '${key}'.`);
    } else if (module.type && module.type !== definition.type) {
      isValid = false;
      messages.push(`Tipo inconsistente no módulo '${key}'. Esperado: ${definition.type}.`);
    }
    // Verifica se o módulo está dentro dos limites do tabuleiro
    if (module.x < 0 || module.x >= maxX || module.y < 0 || module.y >= maxY || module.z < 0 || module.z >= maxZ) {
      isValid = false;
      messages.push(`Módulo '${module.name}' (${module.id}) está fora dos limites do tabuleiro.`);
    }

    // Validação de 'flutuação' (módulos devem estar apoiados ou conectados)
    // Simplificado: Assume que módulos no piso 0 estão no chão, outros precisam de suporte
    if (module.z > 0) {
      const neighbors = Utils_Matrix.getNeighbors(boardData.modules, module.x, module.y, module.z);
      const hasSupportBelow = neighbors.some(n => n.z === module.z - 1); // Verifica se há módulo abaixo
      if (!hasSupportBelow && !Rule_Definitions.isModuleSelfSupporting(module.type)) { // Ex: tubulações podem ser auto-suportadas
        isValid = false;
        messages.push(`Módulo '${module.name}' (${module.id}) está flutuando sem suporte.`);
      }
    }

    // Validação de portas de entrada/saída (se conectadas corretamente)
    // Esta é uma validação mais complexa e pode ser feita em Engine_FlowPath também
    // Exemplo: Verificar se todas as entradas obrigatórias estão conectadas
    // Portas são verificadas abaixo usando as conexões explícitas.
  });

  // Validação de sobreposição de módulos
  const positions = new Set();
  boardData.modules.forEach(function(module) {
    const posKey = `${module.x},${module.y},${module.z}`;
    if (positions.has(posKey)) {
      isValid = false;
      messages.push(`Módulos sobrepostos na posição (${module.x},${module.y},${module.z}).`);
    } else {
      positions.add(posKey);
    }
  });

  (boardData.connections || []).forEach(function(connection, index) {
    const fromId = connection.from.instanceId || connection.from.id;
    const toId = connection.to.instanceId || connection.to.id;
    const sourceDefinition = definitionByKey[fromId];
    const targetDefinition = definitionByKey[toId];
    if (sourceDefinition && sourceDefinition.outputs.indexOf(connection.from.output) === -1) {
      isValid = false;
      messages.push(`Saída '${connection.from.output}' não existe no módulo '${fromId}'.`);
    }
    if (targetDefinition && targetDefinition.inputs.indexOf(connection.to.input) === -1) {
      isValid = false;
      messages.push(`Entrada '${connection.to.input}' não existe no módulo '${toId}'.`);
    }
    if (!Rule_Definitions.areFlowPortsCompatible(connection.from.output, connection.to.input)) {
      isValid = false;
      messages.push(`Conexão ${index} é incompatível: '${connection.from.output}' não alimenta '${connection.to.input}'.`);
    }
  });

  boardData.modules.forEach(function(module) {
    const key = Utils_Validation.getBoardModuleKey(module);
    const minimumIncoming = Rule_Definitions.getMinimumIncomingConnections(module.type);
    if (!minimumIncoming) return;
    const incomingCount = (boardData.connections || []).filter(function(connection) {
      return (connection.to.instanceId || connection.to.id) === key;
    }).length;
    if (incomingCount < minimumIncoming) {
      isValid = false;
      messages.push(`Módulo '${module.name || key}' requer ao menos ${minimumIncoming} conexão(ões) de entrada.`);
    }
  });

  return { isValid: isValid, errors: messages, message: messages.join(" ") };
}
