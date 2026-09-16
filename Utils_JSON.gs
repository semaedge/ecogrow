/**
 * Arquivo: Utils_JSON.gs
 * Funcionalidades: Fornece funções seguras para parsing e stringify de objetos JSON. Inclui lógica para limpar caracteres inválidos que podem vir do Frontend antes de salvar no Google Sheet.
 * Integrações: API_Router.gs, Model_Board.gs, Model_Module.gs, Model_Plant.gs, Model_SimulationLog.gs.
 * Dependências: Nenhuma.
 */

function parse(jsonString) {
  try {
    if (jsonString !== null && typeof jsonString === "object") return jsonString;
    if (typeof jsonString !== "string" || !jsonString.trim()) {
      throw new Error("Expected a non-empty JSON string.");
    }
    if (jsonString.length > 1000000) {
      throw new Error("JSON payload exceeds the 1 MB limit.");
    }
    // Remove caracteres de controle inválidos que podem causar erros no JSON.parse
    const cleanedString = jsonString.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
    return JSON.parse(cleanedString);
  } catch (e) {
    // Não registre o payload bruto: ele pode conter senha, token ou dados pessoais.
    Utils_Logger.logError("Utils_JSON", "Failed to parse JSON string: " + e.message);
    throw new Error("Invalid JSON format.");
  }
}

function stringify(jsonObject, replacer, space) {
  try {
    return JSON.stringify(jsonObject, replacer || null, space);
  } catch (e) {
    Utils_Logger.logError("Utils_JSON", "Failed to stringify JSON object: " + e.message, jsonObject);
    throw new Error("Failed to serialize object to JSON.");
  }
}
