/**
 * Arquivo: Auth_Service.gs
 * Funcionalidades: Lógica de negócio da autenticação. Geração de tokens temporários (salvos em CacheService) e validação de permissões.
 * Integrações: Auth_Controller.gs e Middleware_Auth.gs.
 * Dependências: Config.gs.
 */

function generateSessionToken(userId) {
  userId = typeof userId === "string" ? userId.trim() : "";
  if (!userId) throw new Error("A valid userId is required.");
  const token = Utilities.getUuid(); // Gera um UUID único como token
  const expirationMinutes = Number(Config.getConfig("SESSION_KEY_EXPIRATION_MINUTES"));
  if (!isFinite(expirationMinutes) || expirationMinutes <= 0 || Math.floor(expirationMinutes) !== expirationMinutes || expirationMinutes * 60 > 21600) {
    throw new Error("Invalid session expiration configuration.");
  }
  CacheService.getScriptCache().put(token, userId, expirationMinutes * 60); // Salva o token com expiração
  return token;
}

function validateSessionToken(token) {
  token = typeof token === "string" ? token.trim() : "";
  if (!token || token.length > 250 || /\s/.test(token)) return null;
  const userId = CacheService.getScriptCache().get(token);
  if (userId) {
    // O token é válido, renova a expiração para manter a sessão ativa
    const expirationMinutes = Number(Config.getConfig("SESSION_KEY_EXPIRATION_MINUTES"));
    if (!isFinite(expirationMinutes) || expirationMinutes <= 0 || Math.floor(expirationMinutes) !== expirationMinutes || expirationMinutes * 60 > 21600) {
      CacheService.getScriptCache().remove(token);
      return null;
    }
    CacheService.getScriptCache().put(token, String(userId).trim(), expirationMinutes * 60);
    return String(userId).trim() || null; // Retorna o userId associado ao token
  }
  return null; // Token inválido ou expirado
}

function invalidateSessionToken(token) {
  token = typeof token === "string" ? token.trim() : "";
  if (token && token.length <= 250 && !/\s/.test(token)) CacheService.getScriptCache().remove(token);
}

/**
 * Credenciais versionadas e salgadas.
 *
 * O valor persistido usa `v1$<salt>$<digest>` para manter o schema atual
 * (`Users.password`) sem expor a senha original. Contas antigas em texto
 * continuam sendo aceitas apenas durante a leitura e são migradas pelo fluxo
 * de autenticação em Sheets_authenticateUser.
 */
function hashPassword(password, salt) {
  const resolvedSalt = String(salt || Utilities.getUuid());
  const value = String(password === null || password === undefined ? "" : password);
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    resolvedSalt + ":" + value,
    Utilities.Charset.UTF_8
  );
  const digest = Array.prototype.map.call(bytes || [], byte => {
    const normalized = (Number(byte) + 256) % 256;
    return normalized.toString(16).padStart(2, "0");
  }).join("");
  return "v1$" + resolvedSalt + "$" + digest;
}

/** Verifica hashes v1 e preserva leitura transitória de credenciais legadas. */
function verifyPassword(password, storedPassword) {
  if (typeof storedPassword !== "string") return false;
  const encoded = /^v1\$([^$]+)\$([0-9a-f]{64})$/i.exec(storedPassword);
  if (!encoded) return constantTimeEquals(String(password), storedPassword);
  return constantTimeEquals(hashPassword(password, encoded[1]), storedPassword);
}

/** Indica se o registro ainda precisa ser migrado para o formato v1. */
function isLegacyPassword(storedPassword) {
  return typeof storedPassword === "string" && !/^v1\$[^$]+\$[0-9a-f]{64}$/i.test(storedPassword);
}

function constantTimeEquals(left, right) {
  if (typeof left !== "string" || typeof right !== "string") return false;
  let mismatch = left.length ^ right.length;
  const length = Math.max(left.length, right.length);
  for (let i = 0; i < length; i++) {
    mismatch |= (i < left.length ? left.charCodeAt(i) : 0) ^ (i < right.length ? right.charCodeAt(i) : 0);
  }
  return mismatch === 0;
}

/**
 * Limitação de tentativas de login por identificador (rate limiting).
 */
function checkRateLimit(identifier, maxAttempts, windowSeconds) {
  var normalizedIdentifier = String(identifier == null ? "" : identifier).trim().toLowerCase();
  if (!normalizedIdentifier) return false;
  var limit = Number(maxAttempts == null ? 5 : maxAttempts);
  var window = Number(windowSeconds == null ? 300 : windowSeconds);
  if (!isFinite(limit) || limit <= 0 || Math.floor(limit) !== limit ||
      !isFinite(window) || window <= 0 || Math.floor(window) !== window) return false;
  var attemptsKey = "ratelimit:" + normalizedIdentifier;
  var attempts = Number(CacheService.getScriptCache().get(attemptsKey));
  if (!isFinite(attempts) || attempts < 0 || Math.floor(attempts) !== attempts) attempts = 0;
  if (attempts >= limit) return false;
  CacheService.getScriptCache().put(attemptsKey, String(attempts + 1), window);
  return true;
}

function resetRateLimit(identifier) {
  var normalizedIdentifier = String(identifier == null ? "" : identifier).trim().toLowerCase();
  if (!normalizedIdentifier) return;
  var attemptsKey = "ratelimit:" + normalizedIdentifier;
  CacheService.getScriptCache().remove(attemptsKey);
}
