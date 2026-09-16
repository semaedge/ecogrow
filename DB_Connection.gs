/**
 * Arquivo: DB_Connection.gs
 * Funcionalidades: Instancia a conexão com o Google Spreadsheet via SpreadsheetApp.openById(). Otimiza chamadas usando getRange().getValues() e setValues() para evitar lentidão.
 * Integrações: Config.gs. Todos os Models (Model_User.gs, Model_Board.gs, etc.) dependem deste arquivo para interagir com a planilha.
 * Dependências: Config.gs.
 */

function getSpreadsheet() {
  validateConfig();
  const spreadsheetId = Config.getConfig("SPREADSHEETS_ID");
  return SpreadsheetApp.openById(spreadsheetId);
}

function getSheet(sheetName) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    // Se a aba não existe, cria uma nova
    sheet = ss.insertSheet(sheetName);
    // Opcional: Adicionar cabeçalhos padrão aqui ou em Setup_InitDB.gs
  }
  return sheet;
}

function readAllData(sheetName) {
  const sheet = getSheet(sheetName);
  const range = sheet.getDataRange();
  return range.getValues();
}

function writeAllData(sheetName, data) {
  validateDataMatrix(data);
  return withDatabaseLock(function() {
    writeAllDataUnlocked(sheetName, data);
    return true;
  });
}

function appendRow(sheetName, rowData) {
  if (!Array.isArray(rowData) || rowData.length === 0) throw new Error("rowData must be a non-empty array.");
  return withDatabaseLock(function() {
    getSheet(sheetName).appendRow(rowData);
    return true;
  });
}

function mutateSheetData(sheetName, mutator) {
  if (typeof mutator !== "function") throw new Error("mutator must be a function.");
  return withDatabaseLock(function() {
    const data = getSheet(sheetName).getDataRange().getValues();
    const result = mutator(data);
    if (!result || !Array.isArray(result.data)) throw new Error("mutator must return an object containing data.");
    validateDataMatrix(result.data);
    writeAllDataUnlocked(sheetName, result.data);
    return result.value;
  });
}

function writeAllDataUnlocked(sheetName, data) {
  const sheet = getSheet(sheetName);
  sheet.clearContents();
  if (data.length > 0) sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
}

function validateDataMatrix(data) {
  if (!Array.isArray(data)) throw new Error("data must be an array.");
  if (data.length === 0) return true;
  if (!Array.isArray(data[0]) || data[0].length === 0) throw new Error("data must contain non-empty rows.");
  const width = data[0].length;
  data.forEach(function(row) {
    if (!Array.isArray(row) || row.length !== width) throw new Error("All database rows must have the same width.");
  });
  return true;
}

function withDatabaseLock(callback) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    return callback();
  } finally {
    lock.releaseLock();
  }
}
