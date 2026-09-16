/** Helpers consistentes para os limites de autenticação da aplicação. */

const PUBLIC_API_ROUTES = ["auth/login", "auth/register", "module/list", "plant/list"];

function normalizeSessionToken(token) {
  if (typeof token !== "string") return "";
  const normalized = token.trim();
  return normalized && normalized.length <= 250 && !/\s/.test(normalized) ? normalized : "";
}

function getUserIdFromSessionToken(token) {
  const normalizedToken = normalizeSessionToken(token);
  return normalizedToken ? validateSessionToken(normalizedToken) : null;
}

function getSessionContext(payload) {
  const token = normalizeSessionToken(payload && payload.token);
  const userId = token ? validateSessionToken(token) : null;
  return { authenticated: Boolean(userId), token: token, userId: userId || null };
}

function requireSessionUserId(payload) {
  const context = getSessionContext(payload);
  if (!context.authenticated) throw new Error("Invalid or expired session.");
  return context.userId;
}

function isPublicApiRoute(route) {
  return PUBLIC_API_ROUTES.indexOf(route) !== -1;
}
