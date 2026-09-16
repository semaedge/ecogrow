/**
 * Arquivo: Engine_Scoring.gs
 * Funcionalidades: Calcula o score final do tabuleiro de 0-100, baseado em diversos critérios como sanitização, nutrição, integridade do sistema, cobertura vegetal e ausência de contaminação. Gera um array de feedback detalhado.
 * Contexto Eco-Grow: Formata a saída JSON final estrita do simulador, fornecendo ao jogador uma avaliação abrangente de seu design.
 * Integrações: Engine_Core.gs, Rule_Definitions.gs.
 * Dependências: Rule_Definitions.gs, Utils_Logger.gs.
 */

function calculateScore(simulationState) {
  Utils_Logger.logInfo("Engine_Scoring", "Calculating final score.");

  let score = 100; // Começa com pontuação máxima
  let feedback = [];

  // Penalidades por problemas críticos
  simulationState.issues.forEach(issue => {
    if (issue.type === "critical") {
      score -= 30; // Grande penalidade por falhas críticas
      feedback.push({ type: "critical", message: issue.message });
    } else if (issue.type === "warning") {
      score -= 10; // Penalidade menor por avisos
      feedback.push({ type: "warning", message: issue.message });
    }
  });

  // Avaliação de Sanitização (35 pontos)
  let sanitationScore = 35;
  let totalPathogenLoad = 0;
  let maxAllowedPathogenLoad = Rule_Definitions.getMaxPathogenTolerance("overall_system");

  for (let moduleId in simulationState.waterQuality) {
    if (simulationState.waterQuality[moduleId].pathogens) {
      totalPathogenLoad += simulationState.waterQuality[moduleId].pathogens.bacteria + simulationState.waterQuality[moduleId].pathogens.virus;
    }
  }

  if (totalPathogenLoad > maxAllowedPathogenLoad) {
    sanitationScore -= Math.min(35, (totalPathogenLoad / maxAllowedPathogenLoad) * 15); // Penalidade proporcional
    feedback.push({ type: "sanitation", message: `Alta carga de patógenos no sistema. Carga total: ${totalPathogenLoad.toFixed(2)}.` });
  }
  score += sanitationScore - 35; // Ajusta o score total

  // Avaliação de Nutrição (25 pontos)
  let nutritionScore = 25;
  let plantHealthIssues = 0;
  for (let plantId in simulationState.plantHealth) {
    if (simulationState.plantHealth[plantId] < 80) {
      plantHealthIssues++;
    }
  }
  if (plantHealthIssues > 0) {
    nutritionScore -= Math.min(25, plantHealthIssues * 5); // Penalidade por plantas com saúde baixa
    feedback.push({ type: "nutrition", message: `${plantHealthIssues} plantas com problemas nutricionais ou hídricos.` });
  }
  score += nutritionScore - 25; // Ajusta o score total

  // Avaliação de Integridade (20 pontos) - Baseado nas validações da Engine_Validation e Engine_FlowPath
  let integrityScore = 20;
  const structuralTerms = ["flutuando", "sobrepostos", "fora dos limites", "desconhecido", "inconsistente"];
  const flowTerms = ["Mistura perigosa", "Mistura proibida", "Deficiência hídrica", "Excesso hídrico", "Fluxo interrompido", "Ciclo de fluxo"];
  const structuralIssues = simulationState.issues.filter(function(issue) {
    return issue.type === "critical" && structuralTerms.some(function(term) { return issue.message.indexOf(term) !== -1; });
  }).length;
  const flowIssues = simulationState.issues.filter(function(issue) {
    return flowTerms.some(function(term) { return issue.message.indexOf(term) !== -1; });
  }).length;

  integrityScore -= Math.min(20, structuralIssues * 10 + flowIssues * 5);
  if (structuralIssues > 0) feedback.push({ type: "integrity", message: `${structuralIssues} problemas estruturais detectados.` });
  if (flowIssues > 0) feedback.push({ type: "integrity", message: `${flowIssues} problemas de fluxo detectados.` });
  score += integrityScore - 20; // Ajusta o score total

  // Avaliação de Cobertura Vegetal (10 pontos) - (Pode ser implementado com base no número de módulos de jardinagem ativos)
  let coverageScore = 10;
  const gardenModules = simulationState.board.modules.filter(m => m.type === "garden_output").length;
  if (gardenModules < 3) { // Exemplo: penaliza se poucas plantas
    coverageScore -= (3 - gardenModules) * 3;
    feedback.push({ type: "coverage", message: `Baixa cobertura vegetal (${gardenModules} módulos de jardinagem).` });
  }
  score += coverageScore - 10; // Ajusta o score total

  // Avaliação de Ausência de Contaminação (10 pontos) - Já coberto em sanitização, mas pode ter foco em pontos específicos
  let cleanlinessScore = totalPathogenLoad <= maxAllowedPathogenLoad ? 10 : Math.max(0, 10 - Math.round(totalPathogenLoad * 10));

  score = Math.max(0, Math.min(100, score)); // Garante que o score esteja entre 0 e 100

  return {
    score: score,
    feedback: feedback,
    breakdown: {
      sanitation: Math.max(0, Math.round(sanitationScore)),
      nutrition: Math.max(0, Math.round(nutritionScore)),
      integrity: Math.max(0, Math.round(integrityScore)),
      coverage: Math.max(0, Math.round(coverageScore)),
      cleanliness: cleanlinessScore
    }
  };
}
