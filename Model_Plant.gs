/** CRUD consistente do catálogo de plantas. */

function Model_Plant_getPlantsSheet() { return DB_Connection.getSheet("Plants"); }

function Model_Plant_getAllPlants() {
  const data = DB_Connection.readAllData("Plants");
  if (data.length <= 1) return [];
  const headers = data[0];
  return data.slice(1).filter(function(row) { return row.some(function(value) { return value !== ""; }); }).map(function(row) { return Model_Plant_fromRow(headers, row); });
}

function Model_Plant_getPlantById(plantId) {
  return Model_Plant_getAllPlants().find(function(plant) { return plant.id === plantId; });
}

function Model_Plant_createPlant(plantData) {
  const normalized = Model_Plant_normalize(plantData, true);
  const created = DB_Connection.mutateSheetData("Plants", function(data) {
    data = Model_Plant_ensureTable(data);
    const headers = data[0];
    const idIndex = headers.indexOf("id");
    if (data.slice(1).some(function(row) { return row[idIndex] === normalized.id; })) return { data: data, value: null };
    data.push(Model_Plant_toRow(headers, normalized));
    return { data: data, value: normalized };
  });
  if (created) Utils_Logger.logInfo("Model_Plant", "Plant created: " + created.id);
  return created;
}

function Model_Plant_updatePlant(plantId, updates) {
  const updated = DB_Connection.mutateSheetData("Plants", function(data) {
    data = Model_Plant_ensureTable(data);
    const headers = data[0];
    const idIndex = headers.indexOf("id");
    for (let index = 1; index < data.length; index++) {
      if (data[index][idIndex] !== plantId) continue;
      const normalized = Model_Plant_normalize(Object.assign({}, Model_Plant_fromRow(headers, data[index]), updates || {}, { id: plantId }), false);
      data[index] = Model_Plant_toRow(headers, normalized);
      return { data: data, value: normalized };
    }
    return { data: data, value: null };
  });
  if (updated) Utils_Logger.logInfo("Model_Plant", "Plant updated: " + plantId);
  return updated;
}

function Model_Plant_deletePlant(plantId) {
  const deleted = DB_Connection.mutateSheetData("Plants", function(data) {
    data = Model_Plant_ensureTable(data);
    const idIndex = data[0].indexOf("id");
    const remaining = [data[0]];
    let removed = false;
    data.slice(1).forEach(function(row) { if (row[idIndex] === plantId) removed = true; else remaining.push(row); });
    return { data: remaining, value: removed };
  });
  if (deleted) Utils_Logger.logInfo("Model_Plant", "Plant deleted: " + plantId);
  return deleted;
}

function Model_Plant_normalize(plantData, allowGeneratedId) {
  plantData = plantData || {};
  const id = Utils_Validation.normalizeText(plantData.id, 100) || (allowGeneratedId ? Utilities.getUuid() : "");
  const name = Utils_Validation.normalizeText(plantData.name, 100);
  const type = Utils_Validation.normalizeText(plantData.type, 60);
  const water = Number(plantData.waterRequirements);
  if (!id || !name || !type) throw new Error("Plant id, name and type are required.");
  if (!isFinite(water) || water < 0) throw new Error("Plant water requirement must be a non-negative number.");
  return {
    id: id, name: name, type: type,
    npkRequirements: Model_Plant_normalizeVector(plantData.npkRequirements, ["N", "P", "K"], false),
    waterRequirements: water,
    pathogenTolerance: Model_Plant_normalizeVector(plantData.pathogenTolerance, ["bacteria", "virus"], true)
  };
}

function Model_Plant_normalizeVector(value, keys, clampUnit) {
  value = value || {};
  const result = {};
  keys.forEach(function(key) {
    const parsed = Number(value[key]);
    let number = isFinite(parsed) ? parsed : 0;
    number = Math.max(0, clampUnit ? Math.min(1, number) : number);
    result[key] = number;
  });
  return result;
}

function Model_Plant_ensureTable(data) {
  const headers = ["id", "name", "type", "npkRequirements", "waterRequirements", "pathogenTolerance"];
  return !data.length || !data[0].some(function(value) { return value !== ""; }) ? [headers] : data;
}

function Model_Plant_toRow(headers, plant) {
  return headers.map(function(header) {
    return ["npkRequirements", "pathogenTolerance"].indexOf(header) !== -1 ? Utils_JSON.stringify(plant[header]) : (plant[header] !== undefined ? plant[header] : "");
  });
}

function Model_Plant_fromRow(headers, row) {
  const plant = {};
  headers.forEach(function(header, index) {
    if (["npkRequirements", "pathogenTolerance"].indexOf(header) !== -1) plant[header] = row[index] ? Utils_JSON.parse(row[index]) : {};
    else if (header === "waterRequirements") plant[header] = Number(row[index]) || 0;
    else plant[header] = row[index];
  });
  return plant;
}
