/**
 * Arquivo: Middleware_Auth.gs
 * Funcionalidades: Intercepta chamadas de API para verificar se o token de sessão do usuário é válido antes de permitir operações sensíveis (CRUD ou execução de simulação).
 * Integrações: API_Router.gs e Auth_Service.gs.
 * Dependências: Auth_Service.gs, Utils_Response.gs.
 */

function authenticate(route, payload) {
  // Rotas que não exigem autenticação (ex: login, registro)
  if (Utils_Session.isPublicApiRoute(route)) {
    return true; // Não precisa de autenticação para rotas públicas
  }

  // Para todas as outras rotas, verifica o token de sessão
  payload = payload || {};
  const token = Utils_Session.normalizeToken(payload.token);
  if (!token) {
    Utils_Logger.logError("Middleware_Auth", "No token provided for route: " + route);
    return false;
  }

  const isValid = Boolean(Utils_Session.getUserId(token));
  if (!isValid) {
    Utils_Logger.logError("Middleware_Auth", "Invalid or expired token for route: " + route);
  }
  return isValid;
}
