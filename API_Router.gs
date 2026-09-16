/**
 * Arquivo: API_Router.gs
 * Funcionalidades: Recebe chamadas AJAX do frontend via google.script.run. Faz o parsing do JSON, verifica a rota solicitada e despacha para o Controller correto.
 * Integrações: Conecta o Frontend (Js_API.html) aos Controllers (Auth_Controller.gs, Controller_User.gs, etc.).
 * Dependências: Middleware_Auth.gs, Utils_Response.gs, Utils_JSON.gs.
 */

function handleApiRequest(request) {
  let response = {};
  try {
    const parsedRequest = Utils_JSON.parse(request);
    if (!Utils_Validation.isPlainObject(parsedRequest)) {
      return Utils_JSON.stringify(Utils_Response.error("Request must be a JSON object.", 400));
    }
    const route = Utils_Validation.normalizeText(parsedRequest.route, 100);
    const payload = parsedRequest.payload === undefined ? {} : parsedRequest.payload;
    if (!route || !Utils_Validation.isPlainObject(payload)) {
      return Utils_JSON.stringify(Utils_Response.error("Request requires a route and an object payload.", 400));
    }

    // Autenticação e Autorização (Middleware)
    if (!Middleware_Auth.authenticate(route, payload)) {
      return Utils_JSON.stringify(Utils_Response.error("Unauthorized access or invalid session.", 401));
    }

    switch (route) {
      case 'auth/login':
        response = login(payload);
        break;
      case 'auth/register':
        response = register(payload);
        break;
      case 'auth/logout':
        response = logout(payload);
        break;
      case 'user/profile':
        response = getProfile(payload);
        break;
      case 'user/update':
        response = updateProfile(payload);
        break;
      case 'user/delete':
        response = deleteAccount(payload);
        break;
      case 'board/save':
        response = saveBoard(payload);
        break;
      case 'board/load':
        response = loadBoard(payload);
        break;
      case 'board/listUserBoards':
      case 'board/list':
        response = listUserBoards(payload);
        break;
      case 'board/delete':
        response = deleteBoard(payload);
        break;
      case 'module/list':
        response = listModules(payload);
        break;
      case 'plant/list':
        response = Utils_Response.success({ plants: GameSheets.plants.list() });
        break;
      case 'simulation/run':
        response = runSimulation(payload);
        break;
      case 'dashboard/data':
        response = getDashboardData(payload);
        break;
      case 'comparison/players':
        response = getPlayerComparisons(payload);
        break;
      case 'workflow/status':
        response = getBasicWorkflowStatus(payload);
        break;
      case 'workflow/start':
        response = startBasicWorkflow(payload);
        break;
      case 'workflow/review':
        response = reviewBasicWorkflow(payload);
        break;
      case 'economy/summary':
        response = getEconomySummary(payload);
        break;
      case 'notification/list':
        response = listNotifications(payload);
        break;
      case 'notification/read':
        response = markNotificationRead(payload);
        break;
      case 'report/generate':
        response = generateReport(payload);
        break;
      case 'import/board':
        response = importBoardJson(payload);
        break;
      case 'export/board':
        response = exportBoardJson(payload);
        break;
      // Adicionar mais rotas conforme a necessidade
      default:
        response = Utils_Response.error("Route not found.", 404);
        break;
    }
  } catch (e) {
    Utils_Logger.logError("API_Router", e.message, e.stack);
    const malformedRequest = e && e.message === "Invalid JSON format.";
    response = Utils_Response.error(malformedRequest ? "Invalid JSON request." : "Internal server error.", malformedRequest ? 400 : 500);
  }
  return Utils_JSON.stringify(response);
}
