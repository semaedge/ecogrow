/**
 * Arquivo: Controller_Module.gs
 * Funcionalidades: Fornece ao frontend um catálogo público, filtrável e estável dos módulos disponíveis para montagem do tabuleiro.
 * Integrações: GameSheets.modules, Model_Module.gs e Utils_Response.gs.
 * Dependências: GameSheets, Utils_Validation.gs, Utils_Response.gs e Utils_Logger.gs.
 */

function Controller_Module_publicView(module) {
  module = module || {};
  return {
    id: String(module.id || ""),
    name: String(module.name || ""),
    type: String(module.type || ""),
    capacity: Number(module.capacity) || 0,
    inputs: Array.isArray(module.inputs) ? module.inputs.slice() : [],
    outputs: Array.isArray(module.outputs) ? module.outputs.slice() : [],
    npkImpact: module.npkImpact && typeof module.npkImpact === "object" ? {
      N: Number(module.npkImpact.N) || 0,
      P: Number(module.npkImpact.P) || 0,
      K: Number(module.npkImpact.K) || 0
    } : { N: 0, P: 0, K: 0 },
    pathogenReduction: module.pathogenReduction && typeof module.pathogenReduction === "object" ? {
      bacteria: Number(module.pathogenReduction.bacteria) || 0,
      virus: Number(module.pathogenReduction.virus) || 0
    } : { bacteria: 0, virus: 0 }
  };
}

function listModules(payload) {
  payload = payload || {};
  const normalize = typeof Utils_Validation !== "undefined" && Utils_Validation.normalizeText
    ? Utils_Validation.normalizeText
    : function(value, maxLength) { return typeof value === "string" ? value.trim().substring(0, maxLength || 100) : ""; };
  const typeFilter = normalize(payload.type, 60).toLowerCase();
  const queryFilter = normalize(payload.query || payload.search, 80).toLowerCase();
  const requestedLimit = Number(payload.limit);
  const limit = isFinite(requestedLimit) && requestedLimit > 0 ? Math.min(100, Math.floor(requestedLimit)) : 100;

  try {
    const catalog = GameSheets.modules.list();
    const modules = (Array.isArray(catalog) ? catalog : [])
      .map(Controller_Module_publicView)
      .filter(function(module) {
        const matchesType = !typeFilter || module.type.toLowerCase() === typeFilter;
        const searchText = [module.id, module.name, module.type].join(" ").toLowerCase();
        return matchesType && (!queryFilter || searchText.indexOf(queryFilter) !== -1);
      })
      .sort(function(left, right) {
        return left.type.localeCompare(right.type) || left.name.localeCompare(right.name) || left.id.localeCompare(right.id);
      });
    const total = modules.length;
    return Utils_Response.success({
      modules: modules.slice(0, limit),
      total: total,
      limit: limit,
      filters: { type: typeFilter || null, query: queryFilter || null }
    }, "Module catalog loaded.", 200, { truncated: total > limit });
  } catch (e) {
    if (typeof Utils_Logger !== "undefined" && Utils_Logger.logError) Utils_Logger.logError("Controller_Module", "Failed to load module catalog.", e && e.stack);
    return Utils_Response.error("Unable to load module catalog.", 500);
  }
}
