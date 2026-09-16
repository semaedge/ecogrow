/**
 * Valida e normaliza dados que atravessam os limites da API.
 * Mantém compatibilidade com tabuleiros antigos, nos quais `id` identifica
 * simultaneamente a instância no tabuleiro e o item do catálogo.
 */

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizeText(value, maxLength) {
  if (typeof value !== "string") return "";
  const normalized = value.trim().replace(/\s+/g, " ");
  return typeof maxLength === "number" ? normalized.substring(0, maxLength) : normalized;
}

function isValidEmail(value) {
  if (typeof value !== "string") return false;
  const normalized = value.trim();
  return normalized.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}

function getBoardModuleKey(module) {
  if (!module) return "";
  return normalizeText(module.instanceId || module.id, 100);
}

function getBoardModuleCatalogId(module) {
  if (!module) return "";
  return normalizeText(module.moduleId || module.catalogId || module.id, 100);
}

function validateBoardData(boardData, options) {
  const settings = options || {};
  const errors = [];

  if (!isPlainObject(boardData)) {
    return { isValid: false, errors: ["Board data must be an object."], message: "Board data must be an object." };
  }
  if (!Array.isArray(boardData.modules)) {
    return { isValid: false, errors: ["Board data must contain a modules array."], message: "Board data must contain a modules array." };
  }
  if (settings.requireModules && boardData.modules.length === 0) {
    errors.push("Board must contain at least one module.");
  }
  if (boardData.modules.length > 300) {
    errors.push("Board exceeds the limit of 300 modules.");
  }

  const moduleKeys = Object.create(null);
  boardData.modules.forEach(function(module, index) {
    if (!isPlainObject(module)) {
      errors.push("Module at index " + index + " must be an object.");
      return;
    }
    const key = getBoardModuleKey(module);
    if (!key) {
      errors.push("Module at index " + index + " has no id or instanceId.");
    } else if (moduleKeys[key]) {
      errors.push("Duplicate module instance id: " + key + ".");
    } else {
      moduleKeys[key] = true;
    }
    ["x", "y", "z"].forEach(function(axis) {
      if (typeof module[axis] !== "number" || !isFinite(module[axis]) || Math.floor(module[axis]) !== module[axis]) {
        errors.push("Module " + (key || index) + " has an invalid " + axis + " coordinate.");
      }
    });
  });

  if (boardData.connections !== undefined && !Array.isArray(boardData.connections)) {
    errors.push("Board connections must be an array.");
  }
  const connections = Array.isArray(boardData.connections) ? boardData.connections : [];
  if (connections.length > 1000) {
    errors.push("Board exceeds the limit of 1000 connections.");
  }
  const connectionKeys = Object.create(null);
  connections.forEach(function(connection, index) {
    if (!isPlainObject(connection) || !isPlainObject(connection.from) || !isPlainObject(connection.to)) {
      errors.push("Connection at index " + index + " is malformed.");
      return;
    }
    const fromId = normalizeText(connection.from.instanceId || connection.from.id, 100);
    const toId = normalizeText(connection.to.instanceId || connection.to.id, 100);
    const output = normalizeText(connection.from.output, 100);
    const input = normalizeText(connection.to.input, 100);
    if (!fromId || !moduleKeys[fromId]) errors.push("Connection " + index + " has an unknown source module.");
    if (!toId || !moduleKeys[toId]) errors.push("Connection " + index + " has an unknown target module.");
    if (fromId && fromId === toId) errors.push("Connection " + index + " cannot connect a module to itself.");
    if (!output || !input) errors.push("Connection " + index + " must declare output and input ports.");
    const connectionKey = fromId + ":" + output + ">" + toId + ":" + input;
    if (connectionKeys[connectionKey]) errors.push("Duplicate connection: " + connectionKey + ".");
    connectionKeys[connectionKey] = true;
  });

  return { isValid: errors.length === 0, errors: errors, message: errors.join(" ") };
}
