/**
 * Arquivo: Rule_Definitions.gs
 * Funcionalidades: Dicionário contendo as constantes lógicas do jogo (limites de patógenos, tolerâncias nutricionais, regras de transição de cota, etc.).
 * Contexto Eco-Grow: Regras hardcoded que o motor consulta para não ter que inventar dados, garantindo consistência na simulação.
 * Integrações: Engine_Core.gs, Engine_Validation.gs, Engine_Sanitation.gs, Engine_Nutrition.gs, Engine_Mixing.gs, Engine_Scoring.gs.
 * Dependências: Nenhuma.
 */

const RULE_DEFINITIONS = {
  // Limites de Patógenos
  MAX_PATHOGEN_TOLERANCE: {
    overall_system: 0.1, // Carga patogênica máxima aceitável no sistema
    bacteria_for_edibles: 0.01, // Limite de bactérias para água/composto em plantas comestíveis
    virus_for_edibles: 0.005,   // Limite de vírus para água/composto em plantas comestíveis
    bacteria_for_non_edibles: 0.05, // Limite para plantas não comestíveis
    virus_for_non_edibles: 0.02
  },

  // Carga Patogênica Inicial por Tipo de Fluxo
  INITIAL_PATHOGEN_LOAD: {
    greywater_raw: { bacteria: 0.2, virus: 0.1 },
    blackwater_raw: { bacteria: 1.0, virus: 0.8 },
    urine_liquid: { bacteria: 0.05, virus: 0.02 },
    food_waste: { bacteria: 0.5, virus: 0.3 }
  },

  // Carga Nutricional Inicial por Tipo de Fluxo (NPK)
  INITIAL_NPK_LOAD: {
    greywater_raw: { N: 0.05, P: 0.01, K: 0.03 },
    blackwater_raw: { N: 0.5, P: 0.15, K: 0.2 },
    urine_liquid: { N: 0.3, P: 0.08, K: 0.15 },
    food_waste: { N: 0.2, P: 0.05, K: 0.1 }
  },

  // Regras de Mistura Proibida
  FORBIDDEN_MIXING_RULES: [
    { type1: "blackwater_raw", type2: "greywater_treated", allowedModuleTypes: ["blackwater_treatment"] },
    // Adicionar mais regras conforme a complexidade do jogo
  ],

  // Módulos que são auto-suportados (não precisam de módulo abaixo)
  SELF_SUPPORTING_MODULE_TYPES: [
    "pipe_vertical", "pump_module"
  ],

  // Módulos de tratamento primário de água negra
  PRIMARY_BLACKWATER_TREATMENT_MODULES: [
    "blackwater_treatment", "compost_treatment"
  ],

  // Quantidade mínima de alimentações para um módulo poder operar.
  MINIMUM_INCOMING_CONNECTIONS: {
    greywater_treatment: 1,
    blackwater_treatment: 1,
    compost_treatment: 1,
    garden_output: 1,
    mixer: 2
  }
};

function getMaxPathogenTolerance(key) {
  return RULE_DEFINITIONS.MAX_PATHOGEN_TOLERANCE[key] || 0;
}

function getInitialPathogenLoad(flowType) {
  return RULE_DEFINITIONS.INITIAL_PATHOGEN_LOAD[flowType] || { bacteria: 0, virus: 0 };
}

function getInitialNPKLoad(flowType) {
  return RULE_DEFINITIONS.INITIAL_NPK_LOAD[flowType] || { N: 0, P: 0, K: 0 };
}

function isMixingForbidden(flowType1, flowType2, moduleType) {
  return RULE_DEFINITIONS.FORBIDDEN_MIXING_RULES.some(rule => {
    const typesMatch = (rule.type1 === flowType1 && rule.type2 === flowType2) || (rule.type1 === flowType2 && rule.type2 === flowType1);
    const moduleAllowed = rule.allowedModuleTypes.indexOf(moduleType) !== -1;
    return typesMatch && !moduleAllowed;
  });
}

function isModuleSelfSupporting(moduleType) {
  return RULE_DEFINITIONS.SELF_SUPPORTING_MODULE_TYPES.includes(moduleType);
}

function isPrimaryBlackwaterTreatment(moduleType) {
  return RULE_DEFINITIONS.PRIMARY_BLACKWATER_TREATMENT_MODULES.includes(moduleType);
}

function areFlowPortsCompatible(outputPort, inputPort) {
  return typeof outputPort === "string" && outputPort.length > 0 && outputPort === inputPort;
}

function getMinimumIncomingConnections(moduleType) {
  return Math.max(0, Number(RULE_DEFINITIONS.MINIMUM_INCOMING_CONNECTIONS[moduleType]) || 0);
}
