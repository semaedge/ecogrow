/**
 * Arquivo: Code.gs
 * Funcionalidades: Ponto de entrada do Web App. Contém as funções doGet() e doPost() que roteiam a requisição inicial e entregam o Index.html.
 * Integrações: Chama Utils_HTML.gs para renderizar a página principal do SPA.
 * Dependências: Nenhuma direta, mas orquestra o carregamento do frontend.
 */

function doGet(e) {
  return HtmlService.createTemplateFromFile('Index')
      .evaluate()
      .setTitle('Eco-Grow: Tiny House Simulator');
}

function doPost(e) {
  let response;
  try {
    const body = e && e.postData && typeof e.postData.contents === "string"
      ? e.postData.contents
      : (e && e.parameter && typeof e.parameter.request === "string" ? e.parameter.request : "");
    response = body
      ? handleApiRequest(body)
      : Utils_JSON.stringify(Utils_Response.error("A JSON request body is required.", 400));
  } catch (error) {
    Utils_Logger.logError("Code.doPost", error.message, error.stack);
    response = Utils_JSON.stringify(Utils_Response.error("Internal server error.", 500));
  }
  return ContentService.createTextOutput(response).setMimeType(ContentService.MimeType.JSON);
}
