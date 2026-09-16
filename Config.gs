/**
 * Arquivo: Config.gs
 * Funcionalidades: Centraliza variáveis de ambiente e configurações globais do jogo. Inclui o SPREADSHEETS_ID, chaves de sessão e limites estruturais do tabuleiro.
 * Integrações: Acessado por DB_Connection.gs, Engine_Core.gs e outros módulos que necessitem de configurações globais.
 * Dependências: Nenhuma.
 */

// O ID deve vir das propriedades do deployment. Não mantenha um ID fictício no
// código: sem configuração, validateConfig() interrompe qualquer operação de banco.
const SPREADSHEETS_ID = '';
const SESSION_KEY_EXPIRATION_MINUTES = 30; // Tempo de expiração da sessão em minutos
const BOARD_MAX_X = 10; // Largura máxima do tabuleiro
const BOARD_MAX_Y = 10; // Altura máxima do tabuleiro
const BOARD_MAX_Z = 3;  // Número máximo de pisos/camadas

function getConfig(key) {
  // Valores sensíveis/de ambiente podem ser definidos em Project Settings >
  // Script Properties sem precisar alterar ou versionar o código.
  let propertyValue = null;
  // A frota migrou para DocumentProperties; manter ScriptProperties como
  // fallback evita quebrar instalações antigas do web app.
  try {
    propertyValue = PropertiesService.getDocumentProperties().getProperty(key);
  } catch (ignored) {}
  if (propertyValue === null) {
    propertyValue = PropertiesService.getScriptProperties().getProperty(key);
  }
  if (propertyValue !== null) {
    if (["SESSION_KEY_EXPIRATION_MINUTES", "BOARD_MAX_X", "BOARD_MAX_Y", "BOARD_MAX_Z"].indexOf(key) !== -1) {
      const numericValue = Number(propertyValue);
      if (!isFinite(numericValue) || numericValue <= 0 || Math.floor(numericValue) !== numericValue) {
        throw new Error("Invalid numeric configuration for " + key + ".");
      }
      return numericValue;
    }
    return String(propertyValue).trim();
  }
  switch (key) {
    case 'SPREADSHEETS_ID': return SPREADSHEETS_ID;
    case 'SESSION_KEY_EXPIRATION_MINUTES': return SESSION_KEY_EXPIRATION_MINUTES;
    case 'BOARD_MAX_X': return BOARD_MAX_X;
    case 'BOARD_MAX_Y': return BOARD_MAX_Y;
    case 'BOARD_MAX_Z': return BOARD_MAX_Z;
    default: return null;
  }
}

function validateConfig() {
  const spreadsheetId = getConfig("SPREADSHEETS_ID");
  var placeholderId = ['YOUR', 'SPREADSHEET', 'ID', 'HERE'].join('_');
  if (!spreadsheetId || spreadsheetId === placeholderId) {
    throw new Error("Configure SPREADSHEETS_ID in Script Properties before using the database.");
  }
  const sessionMinutes = getConfig("SESSION_KEY_EXPIRATION_MINUTES");
  if (sessionMinutes * 60 > 21600) {
    throw new Error("SESSION_KEY_EXPIRATION_MINUTES cannot exceed 360 minutes (CacheService limit).");
  }
  return true;
}
