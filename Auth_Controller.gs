/**
 * Arquivo: Auth_Controller.gs
 * Funcionalidades: Gerencia login, registro e logout, com hash de senha e migração transparente de credenciais legadas.
 * Integrações: Model_User.gs (para buscar credenciais) e Auth_Service.gs (para gerar e validar tokens).
 * Dependências: Model_User.gs, Auth_Service.gs, Utils_Response.gs.
 */

function login(payload) {
  payload = payload || {};
  const username = Utils_Validation.normalizeText(payload.username, 32);
  const password = typeof payload.password === "string" ? payload.password : "";

  if (!username || !password) return Utils_Response.error("Username and password are required.", 400);

  const user = GameSheets.auth.authenticate(username, password);
  if (!user) {
    return Utils_Response.error("Invalid username or password.", 401);
  }

  const userId = String(user.id || 'legacy:' + username.toLowerCase());
  const token = Auth_Service.generateSessionToken(userId);
  return Utils_Response.success({ token: token, userId: userId, username: user.username, displayName: user.displayName || user.username, role: user.role, balance: Number(user.balance) || 0 });
}

function register(payload) {
  payload = payload || {};
  const username = Utils_Validation.normalizeText(payload.username, 32);
  const password = typeof payload.password === "string" ? payload.password : "";
  const role = "player"; // Nunca aceite elevação de privilégio pelo payload público.

  if (!/^[A-Za-z0-9_.-]{3,32}$/.test(username)) {
    return Utils_Response.error("Username must contain 3-32 letters, numbers, dots, dashes or underscores.", 400);
  }
  if (password.length < 8 || password.length > 128) {
    return Utils_Response.error("Password must contain 8-128 characters.", 400);
  }

  const newUser = GameSheets.auth.register(username, password, role);
  if (newUser) {
    const token = Auth_Service.generateSessionToken(newUser.id);
    return Utils_Response.success({ token: token, userId: newUser.id, username: newUser.username, displayName: newUser.displayName || newUser.username, role: newUser.role, balance: Number(newUser.balance) || 0 });
  } else {
    return Utils_Response.error("Username already exists.", 409);
  }
}

function logout(payload) {
  payload = payload || {};
  Auth_Service.invalidateSessionToken(payload.token);
  return Utils_Response.success(null, "Session ended successfully.");
}
