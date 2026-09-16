/**
 * Fachadas de compatibilidade para a arquitetura modular do projeto.
 * O Google Apps Script compartilha um único escopo global entre arquivos;
 * estas fachadas expõem as funções prefixadas no formato usado pelos controllers.
 * Métodos utilizam delegação em tempo de execução para evitar dependência de ordem de carga.
 */

var Utils_JSON = {
  parse: function(jsonString) { return parse(jsonString); },
  stringify: function(jsonObject, replacer, space) { return stringify(jsonObject, replacer, space); }
};

var Utils_Response = {
  success: function(data, message, status, meta) { return success(data, message, status, meta); },
  error: function(message, status, data, meta) { return error(message, status, data, meta); }
};

var Utils_Logger = {
  log: function(component, message, data) { return log(component, message, data); },
  logInfo: function(component, message, data) { return logInfo(component, message, data); },
  logWarning: function(component, message, data) { return logWarning(component, message, data); },
  logError: function(component, message, data) { return logError(component, message, data); }
};

var Utils_Matrix = {
  getModuleAt: function(boardData, x, y, z) { return getModuleAt(boardData, x, y, z); },
  getNeighbors: function(boardData, x, y, z) { return getNeighbors(boardData, x, y, z); },
  getAdjacentModules: function(boardData, x, y, z) { return getAdjacentModules(boardData, x, y, z); }
};

var Utils_Validation = {
  isPlainObject: function(obj) { return isPlainObject(obj); },
  normalizeText: function(text, maxLength) { return normalizeText(text, maxLength); },
  isValidEmail: function(email) { return isValidEmail(email); },
  getBoardModuleKey: function(mod) { return getBoardModuleKey(mod); },
  getBoardModuleCatalogId: function(mod) { return getBoardModuleCatalogId(mod); },
  validateBoardData: function(boardData, options) { return validateBoardData(boardData, options); }
};

var Utils_HTML = {
  include: function(filename) { return include(filename); },
  getHtmlContent: function(filename) { return getHtmlContent(filename); }
};

var Utils_Session = {
  normalizeToken: function(token) { return normalizeSessionToken(token); },
  getUserId: function(token) { return getUserIdFromSessionToken(token); },
  getContext: function(payload) { return getSessionContext(typeof payload === 'string' ? { token: payload } : payload); },
  requireUserId: function(payload) { return requireSessionUserId(typeof payload === 'string' ? { token: payload } : payload); },
  isPublicApiRoute: function(route) { return isPublicApiRoute(route); }
};

var Config = {
  getConfig: function(key) { return getConfig(key); },
  validateConfig: function() { return validateConfig(); }
};

var DB_Connection = {
  getSpreadsheet: function() { return getSpreadsheet(); },
  getSheet: function(sheetName) { return getSheet(sheetName); },
  readAllData: function(sheetName) { return readAllData(sheetName); },
  writeAllData: function(sheetName, data) { return writeAllData(sheetName, data); },
  appendRow: function(sheetName, rowData) { return appendRow(sheetName, rowData); },
  mutateSheetData: function(sheetName, mutatorFn) { return mutateSheetData(sheetName, mutatorFn); }
};

var Auth_Service = {
  generateSessionToken: function(userId, role) { return generateSessionToken(userId, role); },
  validateSessionToken: function(token) { return validateSessionToken(token); },
  invalidateSessionToken: function(token) { return invalidateSessionToken(token); },
  hashPassword: function(password) { return hashPassword(password); },
  verifyPassword: function(password, hash) { return verifyPassword(password, hash); },
  isLegacyPassword: function(password, hash) { return isLegacyPassword(password, hash); }
};

var Middleware_Auth = {
  authenticate: function(token, requiredRole) { return authenticate(token, requiredRole); }
};

var Model_User = {
  getAllUsers: function() { return Model_User_getAllUsers(); },
  getUserByUsername: function(username) { return Model_User_getUserByUsername(username); },
  getUserById: function(id) { return Model_User_getUserById(id); },
  createUser: function(username, password, role) { return Model_User_createUser(username, password, role); },
  updateUser: function(id, data) { return Model_User_updateUser(id, data); },
  deleteUser: function(id) { return Model_User_deleteUser(id); }
};

var Model_Board = {
  getAllBoards: function() { return Model_Board_getAllBoards(); },
  getBoardById: function(id) { return Model_Board_getBoardById(id); },
  getBoardsByUserId: function(userId) { return Model_Board_getBoardsByUserId(userId); },
  createBoard: function(userId, name, boardJson, legacyBoardData) {
    return Model_Board_createBoard(userId, name, legacyBoardData === undefined ? boardJson : legacyBoardData);
  },
  updateBoard: function(id, data) { return Model_Board_updateBoard(id, data); },
  deleteBoard: function(id) { return Model_Board_deleteBoard(id); }
};

var Model_Module = {
  getAllModules: function() { return Model_Module_getAllModules(); },
  getModuleById: function(id) { return Model_Module_getModuleById(id); },
  createModule: function(moduleData) { return Model_Module_createModule(moduleData); },
  updateModule: function(id, moduleData) { return Model_Module_updateModule(id, moduleData); },
  deleteModule: function(id) { return Model_Module_deleteModule(id); }
};

var Model_Plant = {
  getAllPlants: function() { return Model_Plant_getAllPlants(); },
  getPlantById: function(id) { return Model_Plant_getPlantById(id); },
  createPlant: function(plantData) { return Model_Plant_createPlant(plantData); },
  updatePlant: function(id, plantData) { return Model_Plant_updatePlant(id, plantData); },
  deletePlant: function(id) { return Model_Plant_deletePlant(id); }
};

var Model_SimulationLog = {
  getAllLogs: function() { return Model_SimulationLog_getAllLogs(); },
  getLogById: function(id) { return Model_SimulationLog_getLogById(id); },
  getLogsByUserId: function(userId) { return Model_SimulationLog_getLogsByUserId(userId); },
  createLog: function(userId, boardId, simulationResult, feedback) { return Model_SimulationLog_createLog(userId, boardId, simulationResult, feedback); },
  review: function(logId, userId, reflection, nextChange) {
    if (userId && typeof userId === 'object') {
      var review = userId;
      userId = review.userId;
      reflection = review.reflection;
      nextChange = review.nextChange;
    }
    return Model_SimulationLog_review(logId, userId, reflection, nextChange);
  }
};

var Model_Economy = {
  getTransactionsByUserId: function(userId, limit) { return Model_Economy_getTransactionsByUserId(userId, limit); },
  applyTransaction: function(userId, type, amount, referenceId, description) {
    return Model_Economy_applyTransaction(userId, type, amount, referenceId, description);
  }
};

var Model_Notification = {
  create: function(userId, type, title, message, source) {
    if (arguments.length < 5) {
      source = message;
      message = title;
      title = '';
    }
    return Model_Notification_create(userId, type, title, message, source);
  },
  getByUserId: function(userId, unreadOnly, limit) {
    if (typeof unreadOnly === 'number' && limit === undefined) {
      limit = unreadOnly;
      unreadOnly = false;
    }
    return Model_Notification_getByUserId(userId, unreadOnly === true, limit);
  },
  markRead: function(userId, notificationId) { return Model_Notification_markRead(userId, notificationId); }
};

var Engine_Core = {
  run: function(boardData) { return run(boardData); }
};

var Engine_Validation = {
  validateBoard: function(boardData) { return validateBoard(boardData); }
};

var Engine_FlowPath = {
  mapFlows: function(boardData) { return mapFlows(boardData); }
};

var Engine_Sanitation = {
  processSanitation: function(boardData, flowPaths) { return processSanitation(boardData, flowPaths); }
};

var Engine_Nutrition = {
  processNutrition: function(boardData, flowPaths) { return processNutrition(boardData, flowPaths); }
};

var Engine_Mixing = {
  processMixing: function(boardData, flowPaths) { return processMixing(boardData, flowPaths); }
};

var Engine_Distribution = {
  processDistribution: function(boardData, flowPaths) { return processDistribution(boardData, flowPaths); }
};

var Engine_Scoring = {
  calculateScore: function(boardData, simulationDetails) { return calculateScore(boardData, simulationDetails); }
};

var Rule_Definitions = {
  getMaxPathogenTolerance: function(plantType) { return getMaxPathogenTolerance(plantType); },
  getInitialPathogenLoad: function(moduleType) { return getInitialPathogenLoad(moduleType); },
  getInitialNPKLoad: function(moduleType) { return getInitialNPKLoad(moduleType); },
  isMixingForbidden: function(sourceType, targetType) { return isMixingForbidden(sourceType, targetType); },
  isModuleSelfSupporting: function(moduleType) { return isModuleSelfSupporting(moduleType); },
  isPrimaryBlackwaterTreatment: function(moduleType) { return isPrimaryBlackwaterTreatment(moduleType); },
  areFlowPortsCompatible: function(outputPort, inputPort) { return areFlowPortsCompatible(outputPort, inputPort); },
  getMinimumIncomingConnections: function(moduleType) { return getMinimumIncomingConnections(moduleType); }
};

var Service_Economy = {
  getModuleCost: function(moduleType) { return getModuleCost(moduleType); },
  getPlantHarvestValue: function(plantType) { return getPlantHarvestValue(plantType); },
  calculateMaintenanceCost: function(boardData) { return calculateMaintenanceCost(boardData); },
  calculateSimulationReward: function(score) { return calculateSimulationReward(score); },
  awardSimulationReward: function(userId, logId, score) { return awardSimulationReward(userId, logId, score); },
  updatePlayerBalance: function(userId, amount) { return updatePlayerBalance(userId, amount); }
};

var Service_Import = {
  importBoardJson: function(jsonString) { return importBoardJson(jsonString); }
};

var Service_Export = {
  exportBoardJson: function(boardId) { return exportBoardJson(boardId); }
};

var Service_Notification = {
  sendFrontendNotification: function(payload, type, message) {
    if (arguments.length > 1) payload = { userId: payload, type: type, message: message };
    return sendFrontendNotification(payload);
  },
  createSimulationNotifications: function(userId, logId, simulationResult) { return createSimulationNotifications(userId, logId, simulationResult); },
  sendEmailNotification: function(userId, subject, message) { return sendEmailNotification(userId, subject, message); }
};
