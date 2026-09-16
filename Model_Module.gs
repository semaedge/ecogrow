/** CRUD consistente do catálogo de módulos. */

function Model_Module_getModulesSheet() {
  return DB_Connection.getSheet("Modules");
}

function Model_Module_getAllModules() {
  const data = DB_Connection.readAllData("Modules");
  if (data.length <= 1) return [];
  const headers = data[0];
  return data.slice(1).filter(function(row) { return row.some(function(value) { return value !== ""; }); }).map(function(row) {
    const module = {};
    headers.forEach(function(header, index) {
      if (["inputs", "outputs", "npkImpact", "pathogenReduction"].indexOf(header) !== -1) module[header] = row[index] ? Utils_JSON.parse(row[index]) : Model_Module_defaultValue(header);
      else if (header === "capacity") module[header] = Number(row[index]) || 0;
      else module[header] = row[index];
    });
    return module;
  });
}

function Model_Module_getModuleById(moduleId) {
  return Model_Module_getAllModules().find(function(module) { return module.id === moduleId; });
}

function Model_Module_createModule(moduleData) {
  const normalized = Model_Module_normalize(moduleData, true);
  const created = DB_Connection.mutateSheetData("Modules", function(data) {
    data = Model_Module_ensureTable(data);
    const headers = data[0];
    const idIndex = headers.indexOf("id");
    if (data.slice(1).some(function(row) { return row[idIndex] === normalized.id; })) return { data: data, value: null };
    data.push(Model_Module_toRow(headers, normalized));
    return { data: data, value: normalized };
  });
  if (created) Utils_Logger.logInfo("Model_Module", "Module created: " + created.id);
  return created;
}

function Model_Module_updateModule(moduleId, updates) {
  const updated = DB_Connection.mutateSheetData("Modules", function(data) {
    data = Model_Module_ensureTable(data);
    const headers = data[0];
    const idIndex = headers.indexOf("id");
    for (let index = 1; index < data.length; index++) {
      if (data[index][idIndex] !== moduleId) continue;
      const current = Model_Module_fromRow(headers, data[index]);
      const merged = Object.assign({}, current, updates || {}, { id: moduleId });
      const normalized = Model_Module_normalize(merged, false);
      data[index] = Model_Module_toRow(headers, normalized);
      return { data: data, value: normalized };
    }
    return { data: data, value: null };
  });
  if (updated) Utils_Logger.logInfo("Model_Module", "Module updated: " + moduleId);
  return updated;
}

function Model_Module_deleteModule(moduleId) {
  const deleted = DB_Connection.mutateSheetData("Modules", function(data) {
    data = Model_Module_ensureTable(data);
    const idIndex = data[0].indexOf("id");
    const remaining = [data[0]];
    let removed = false;
    data.slice(1).forEach(function(row) { if (row[idIndex] === moduleId) removed = true; else remaining.push(row); });
    return { data: remaining, value: removed };
  });
  if (deleted) Utils_Logger.logInfo("Model_Module", "Module deleted: " + moduleId);
  return deleted;
}

function Model_Module_normalize(moduleData, allowGeneratedId) {
  moduleData = moduleData || {};
  const id = Utils_Validation.normalizeText(moduleData.id, 100) || (allowGeneratedId ? Utilities.getUuid() : "");
  const name = Utils_Validation.normalizeText(moduleData.name, 100);
  const type = Utils_Validation.normalizeText(moduleData.type, 60);
  const capacity = Number(moduleData.capacity);
  if (!id || !name || !type) throw new Error("Module id, name and type are required.");
  if (!isFinite(capacity) || capacity < 0) throw new Error("Module capacity must be a non-negative number.");
  if (!Array.isArray(moduleData.inputs) || !Array.isArray(moduleData.outputs)) throw new Error("Module inputs and outputs must be arrays.");
  return {
    id: id, name: name, type: type, capacity: capacity,
    inputs: Model_Module_normalizePorts(moduleData.inputs),
    outputs: Model_Module_normalizePorts(moduleData.outputs),
    npkImpact: Model_Module_normalizeVector(moduleData.npkImpact, ["N", "P", "K"]),
    pathogenReduction: Model_Module_normalizeReduction(moduleData.pathogenReduction)
  };
}

function Model_Module_normalizePorts(ports) {
  return ports.map(function(port) { return Utils_Validation.normalizeText(port, 100); }).filter(function(port, index, values) { return port && values.indexOf(port) === index; });
}

function Model_Module_normalizeVector(value, keys) {
  value = value || {};
  const result = {};
  keys.forEach(function(key) { const number = Number(value[key]); result[key] = isFinite(number) ? number : 0; });
  return result;
}

function Model_Module_normalizeReduction(value) {
  const result = Model_Module_normalizeVector(value, ["bacteria", "virus"]);
  result.bacteria = Math.max(0, Math.min(1, result.bacteria));
  result.virus = Math.max(0, Math.min(1, result.virus));
  return result;
}

function Model_Module_ensureTable(data) {
  const headers = ["id", "name", "type", "capacity", "inputs", "outputs", "npkImpact", "pathogenReduction"];
  return !data.length || !data[0].some(function(value) { return value !== ""; }) ? [headers] : data;
}

function Model_Module_toRow(headers, module) {
  return headers.map(function(header) {
    return ["inputs", "outputs", "npkImpact", "pathogenReduction"].indexOf(header) !== -1 ? Utils_JSON.stringify(module[header]) : (module[header] !== undefined ? module[header] : "");
  });
}

function Model_Module_fromRow(headers, row) {
  const result = {};
  headers.forEach(function(header, index) {
    result[header] = ["inputs", "outputs", "npkImpact", "pathogenReduction"].indexOf(header) !== -1 ? (row[index] ? Utils_JSON.parse(row[index]) : Model_Module_defaultValue(header)) : row[index];
  });
  return result;
}

function Model_Module_defaultValue(header) {
  if (header === "inputs" || header === "outputs") return [];
  if (header === "npkImpact") return { N: 0, P: 0, K: 0 };
  return { bacteria: 0, virus: 0 };
}
