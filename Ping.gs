/**
 * codex-frontend-backend-healthcheck
 * Sonda de saude leve: confirma que o frontend alcanca o backend via
 * google.script.run e recebe o envelope padrao do projeto.
 *
 * - Sem efeitos colaterais, sem dependencia de sessao ou planilha.
 * - Arquivo isolado de proposito: nao altera nenhuma rota existente.
 * - Usa o success() de Utils_Response.gs ({ success, status, message, data }),
 *   entao o frontend desempacota .data como em qualquer outra chamada.
 */
function ping() {
  try {
    return success({
      status: "ok",
      service: "backend",
      time: new Date().toISOString()
    }, "Backend acessivel.");
  } catch (error) {
    Logger.log("Erro em ping: " + error.message);
    throw error;
  }
}
