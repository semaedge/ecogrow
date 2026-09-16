/**
 * Arquivo: Utils_Response.gs
 * Funcionalidades: Padroniza os retornos HTTP/AJAX para o frontend. Garante um formato consistente para sucesso e erro: {success, status, data, message}.
 * Integrações: API_Router.gs, Auth_Controller.gs, Controller_User.gs, Controller_Board.gs, Controller_Module.gs, Controller_Simulation.gs, Controller_Dashboard.gs, Controller_Report.gs.
 * Dependências: Nenhuma.
 */

function Utils_Response_normalizeStatus(status, fallback) {
  const numericStatus = Number(status);
  if (!isFinite(numericStatus) || numericStatus < 100 || numericStatus > 599) return fallback;
  return Math.floor(numericStatus);
}

function Utils_Response_normalizeMessage(message, fallback) {
  if (message === null || message === undefined) return fallback;
  const normalized = String(message).trim().replace(/\s+/g, " ");
  return normalized ? normalized.substring(0, 300) : fallback;
}

function Utils_Response_build(isSuccess, data, message, status, meta) {
  const response = {
    success: Boolean(isSuccess),
    status: Utils_Response_normalizeStatus(status, isSuccess ? 200 : 500),
    message: Utils_Response_normalizeMessage(message, isSuccess ? "Operation successful." : "Operation failed."),
    data: data === undefined ? null : data
  };
  // Meta é opcional para não alterar o contrato legado das respostas existentes.
  if (meta && typeof meta === "object" && !Array.isArray(meta)) response.meta = meta;
  return response;
}

function success(data, message, status, meta) {
  return Utils_Response_build(true, data, message, status, meta);
}

function error(message, status, data, meta) {
  return Utils_Response_build(false, data, message, status, meta);
}
