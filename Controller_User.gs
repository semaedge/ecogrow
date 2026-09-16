/**
 * Arquivo: Controller_User.gs
 * Funcionalidades: Gerencia rotas de criação de perfil, atualização de dados e exclusão de contas.
 * Integrações: Model_User.gs.
 * Dependências: Model_User.gs, Utils_Response.gs.
 */

function getProfile(payload) {
  const userId = Auth_Service.validateSessionToken(payload.token);
  if (!userId) {
    return Utils_Response.error("Invalid session.", 401);
  }
  const user = GameSheets.users.getById(userId);
  if (user) {
    // Remove a senha antes de enviar para o frontend
    const { password, ...userWithoutPassword } = user;
    return Utils_Response.success(userWithoutPassword);
  } else {
    return Utils_Response.error("User not found.", 404);
  }
}

function updateProfile(payload) {
  const userId = Auth_Service.validateSessionToken(payload.token);
  if (!userId) {
    return Utils_Response.error("Invalid session.", 401);
  }
  const requestedUpdates = Utils_Validation.isPlainObject(payload.updates) ? payload.updates : {};
  // Previne que a senha seja atualizada diretamente por aqui sem validação adicional
  if (requestedUpdates.password) {
    return Utils_Response.error("Password update not allowed via this route.", 403);
  }
  const updates = {};
  ["email", "displayName"].forEach(function(field) {
    if (Object.prototype.hasOwnProperty.call(requestedUpdates, field)) {
      updates[field] = Utils_Validation.normalizeText(requestedUpdates[field], field === "email" ? 254 : 80);
    }
  });
  if (Object.prototype.hasOwnProperty.call(updates, "email") && updates.email &&
      (!Utils_Validation.isValidEmail || !Utils_Validation.isValidEmail(updates.email))) {
    return Utils_Response.error("A valid email address is required.", 400);
  }
  if (Object.keys(updates).length === 0) return Utils_Response.error("No supported profile fields were provided.", 400);
  const success = GameSheets.users.update(userId, updates);
  if (success) {
    return Utils_Response.success({ message: "Profile updated successfully." });
  } else {
    return Utils_Response.error("Failed to update profile.", 500);
  }
}

function deleteAccount(payload) {
  const userId = Auth_Service.validateSessionToken(payload.token);
  if (!userId) {
    return Utils_Response.error("Invalid session.", 401);
  }
  const success = GameSheets.users.delete(userId);
  if (success) {
    Auth_Service.invalidateSessionToken(payload.token); // Invalida a sessão após exclusão
    return Utils_Response.success({ message: "Account deleted successfully." });
  } else {
    return Utils_Response.error("Failed to delete account.", 500);
  }
}
