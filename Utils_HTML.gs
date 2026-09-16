/**
 * Arquivo: Utils_HTML.gs
 * Funcionalidades: Função helper `include(filename)` para fragmentar arquivos HTML e contornar a limitação de arquivo único do Google Apps Script. Permite a construção de SPAs modulares.
 * Integrações: Usado em Index.html e outros arquivos .html para incluir sub-componentes.
 * Dependências: Nenhuma.
 */

function include(filename) {
  return HtmlService.createTemplateFromFile(filename).evaluate().getContent();
}

function includeInlineData(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent().replace(/\s+/g, '');
}

function getHtmlContent(filename) {
  const allowedViews = [
    "View_Dashboard", "View_BoardEditor", "View_Reports", "View_Login",
    "View_Register", "View_Profile", "View_Help"
  ];
  if (allowedViews.indexOf(filename) === -1) {
    throw new Error("View not allowed: " + String(filename || ""));
  }
  return HtmlService.createTemplateFromFile(filename).evaluate().getContent();
}
