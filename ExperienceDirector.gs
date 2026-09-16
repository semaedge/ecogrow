/**
 * Diretor de experiência de Eco Grow.
 * Inspirado em ZQuestClassic (capítulos/estado), Unciv (decisões por rodada)
 * e GCompris (andaimes e evidência formativa). Funções puras e determinísticas.
 *
 * Estrutura de fases:
 *   Fase 1 — Exploração (cap. 1–2): decisão binária clara, estado generoso.
 *   Fase 2 — Tensão     (cap. 3–4): 3 opções com trade-offs reais.
 *   Fase 3 — Crise      (cap. 5–6): decisões encadeadas, estado pressionado.
 */
var EXPERIENCE_GAME_ = {
  id: "eco-grow",
  title: "Eco Grow",
  sharedResource: "equilíbrio da água e dos nutrientes",
  chapters: [
    // ── FASE 1 · Exploração ──────────────────────────────────────────────────
    { id: "mapear-fluxo", order: 1, phase: 1, constraint: null,
      title: "A água que conta uma história",
      situation: "A horta cresceu de modo desigual. O grupo precisa descobrir por onde a água e os nutrientes estão passando antes de alterar qualquer coisa.",
      decisions: [
        { id: "medir",   label: "Medir o fluxo antes de alterar qualquer módulo",   delta: { knowledge: 2, cooperation: 1, pressure: -1 } },
        { id: "ampliar", label: "Ampliar todo o fluxo imediatamente",               delta: { knowledge: -1, cooperation: 0, pressure: 2 } }
      ]
    },
    { id: "nutricao-desequilibrio", order: 2, phase: 1, constraint: null,
      title: "Nutrição em desequilíbrio",
      situation: "Folhas amareladas em um canteiro. Pode ser falta de nitrogênio ou excesso de sal. O grupo precisa decidir como investigar antes de intervir.",
      decisions: [
        { id: "testar",  label: "Testar amostras de solo e comparar canteiros",     delta: { knowledge: 2, cooperation: 1, pressure: -1 } },
        { id: "adubar",  label: "Aplicar adubo nitrogenado sem confirmar a causa",  delta: { knowledge: -1, cooperation: 0, pressure: 2 } }
      ]
    },
    // ── FASE 2 · Tensão ──────────────────────────────────────────────────────
    { id: "conter-risco", order: 3, phase: 2, constraint: "Prazo curto: a turma tem apenas uma aula para decidir.",
      title: "O alerta invisível",
      situation: "Um indicador sugere contaminação possível, mas sem dado confirmado. O grupo precisa agir sob incerteza, sabendo que cada caminho tem custo.",
      decisions: [
        { id: "isolar",    label: "Isolar o canteiro suspeito e coletar amostras comparativas",   delta: { knowledge: 2, cooperation: 0, pressure: -1 } },
        { id: "monitorar", label: "Manter operando e monitorar por três dias",                    delta: { knowledge: 0, cooperation: 1, pressure: 1 } },
        { id: "parar",     label: "Parar todo o sistema até obter confirmação externa",           delta: { knowledge: 1, cooperation: -1, pressure: 2 } }
      ]
    },
    { id: "escassez-agua", order: 4, phase: 2, constraint: "Recurso limitado: há apenas 60% da água habitual disponível.",
      title: "Escassez de água",
      situation: "Período de estiagem. Há menos água que o necessário. O grupo precisa decidir como distribuir sem que nenhuma escolha seja neutra.",
      decisions: [
        { id: "priorizar-frageis", label: "Priorizar espécies mais frágeis e reduzir o resto",       delta: { knowledge: 1, cooperation: 1, pressure: 0 } },
        { id: "rodizio",           label: "Fazer rodízio de canteiros em dias alternados",            delta: { knowledge: 1, cooperation: 2, pressure: -1 } },
        { id: "reduzir-geral",     label: "Reduzir a irrigação em todos os canteiros igualmente",     delta: { knowledge: 0, cooperation: 0, pressure: 1 } }
      ]
    },
    // ── FASE 3 · Crise ───────────────────────────────────────────────────────
    { id: "redesenhar", order: 5, phase: 3, constraint: "Um membro do grupo está ausente e o orçamento foi cortado pela metade.",
      title: "Uma horta para todos",
      situation: "Orçamento mínimo e necessidades diversas. O grupo deve redesenhar o sistema e justificar prioridades sabendo que alguém ficará com menos.",
      decisions: [
        { id: "prototipar", label: "Testar um trecho barato e reversível, explicando o porquê",         delta: { knowledge: 1, cooperation: 2, pressure: -1 } },
        { id: "produzir",   label: "Escolher apenas a maior produção — eficiência máxima",              delta: { knowledge: 0, cooperation: -2, pressure: 1 } },
        { id: "incluir",    label: "Garantir que todos os canteiros tenham ao menos acesso mínimo",     delta: { knowledge: 1, cooperation: 1, pressure: 0 } }
      ]
    },
    { id: "colapso-parcial", order: 6, phase: 3, constraint: "O tempo acabou: a decisão precisa ser tomada agora e é irreversível.",
      title: "O modelo que falhou",
      situation: "Uma falha encadeada colapsou parte do sistema. Não é possível salvar tudo. O grupo escolhe o que preservar e precisa explicar a decisão para a turma.",
      decisions: [
        { id: "salvar-infra",    label: "Salvar a infraestrutura central — permite reconstruir depois",    delta: { knowledge: 2, cooperation: 0, pressure: -1 } },
        { id: "salvar-especies", label: "Salvar as espécies raras — perda irreversível se não agir agora", delta: { knowledge: 0, cooperation: 1, pressure: 0 } },
        { id: "recomecar",       label: "Recomeçar menor: desmontar e guardar o que ainda funciona",       delta: { knowledge: 1, cooperation: 1, pressure: -2 } }
      ]
    },

    // ── FASE 4 · Soberania e Abundância ──────────────────────────────────────────────────
    { id: "banco-sementes", order: 7, phase: 4, constraint: "Agrobiodiversidade: preservar sementes crioulas adaptadas ao clima local.",
      title: "O cofre vivo das sementes crioulas",
      situation: "Os estudantes organizam a casa de sementes da horta escolar para garantir variedades resistentes e partilha comunitária.",
      decisions: [
        { id: "guardioes-sementes", label: "Catalogar sementes tradicionais e formar uma rede de guardiões mirins de sementes", delta: { knowledge: 2, cooperation: 3, pressure: -1 } },
        { id: "sementes-transgenicas-exclusivas", label: "Depender exclusivamente de sementes comerciais que não podem ser replantadas", delta: { knowledge: -1, cooperation: -2, pressure: 2 } },
        { id: "oficina-multiplicacao", label: "Promover oficina prática ensinando técnicas agroecológicas de seleção e secagem", delta: { knowledge: 2, cooperation: 2, pressure: 0 } }
      ]
    },
    { id: "feira-agroecologica", order: 8, phase: 4, constraint: "Economia solidária: partilhar a colheita com famílias da vizinhança e merenda escolar.",
      title: "A colheita da abundância solidária",
      situation: "A horta agroecológica atinge seu auge produtivo e abastece a merenda da escola com alimentos frescos e orgânicos.",
      decisions: [
        { id: "partilha-solidaria", label: "Integrar a colheita à merenda escolar e organizar feira mensal de trocas solidárias", delta: { knowledge: 2, cooperation: 3, pressure: -1 } },
        { id: "vender-lucro-privado", label: "Vender os vegetais para terceiros sem destinar nada para os alunos e cozinheiras", delta: { knowledge: -1, cooperation: -3, pressure: 2 } },
        { id: "compostagem-circular", label: "Fechar o ciclo orgânico transformando todos os restos de comida da escola em adubo vivo", delta: { knowledge: 2, cooperation: 2, pressure: -1 } }
      ]
    }
  ]
};

function experienceClamp_(value) {
  return Math.max(0, Math.min(10, Number(value) || 0));
}

function getExperienceChapter(chapterId, year) {
  var chapter = EXPERIENCE_GAME_.chapters.filter(function (item) {
    return item.id === String(chapterId || '');
  })[0] || EXPERIENCE_GAME_.chapters[0];
  var schoolYear = Math.max(1, Math.min(5, Number(year) || 3));
  var phaseLabels = { 1: 'Exploração', 2: 'Tensão', 3: 'Crise', 4: 'Soberania e Abundância' };
  return {
    success: true,
    data: {
      gameId:         EXPERIENCE_GAME_.id,
      title:          chapter.title,
      situation:      chapter.situation,
      sharedResource: EXPERIENCE_GAME_.sharedResource,
      phase:          chapter.phase,
      phaseLabel:     phaseLabels[chapter.phase] || 'Exploração',
      constraint:     chapter.constraint || null,
      totalChapters:  EXPERIENCE_GAME_.chapters.length,
      decisions: chapter.decisions.map(function (item) { return { id: item.id, label: item.label }; }),
      cycle: {
        prediction:  schoolYear <= 2 ? 'Desenhe ou conte o que você acha que vai acontecer.' : 'Registre sua previsão e a evidência que pretende observar.',
        observation: 'O que mudou depois da escolha? Use um dado, sinal ou acontecimento do jogo.',
        explanation: 'Como a decisão contribuiu para esse resultado?',
        revision:    'O que o grupo manteria ou mudaria na próxima rodada?'
      },
      support: schoolYear <= 2 ? 'Leitura em voz alta, ícones e resposta oral.' : 'Tabela comparativa, pausa e papéis cooperativos.'
    }
  };
}

function resolveExperienceDecision(state, chapterId, decisionId, evidence) {
  var chapter = EXPERIENCE_GAME_.chapters.filter(function (item) {
    return item.id === String(chapterId || '');
  })[0] || EXPERIENCE_GAME_.chapters[0];
  var decision = chapter.decisions.filter(function (item) {
    return item.id === String(decisionId || '');
  })[0];
  if (!decision) return { success: false, error: 'Escolha não reconhecida para este capítulo.' };
  var current = state || {};
  var next = {
    chapter:     Math.min(EXPERIENCE_GAME_.chapters.length, (Number(current.chapter) || chapter.order) + 1),
    knowledge:   experienceClamp_((Number(current.knowledge)   || 5) + decision.delta.knowledge),
    cooperation: experienceClamp_((Number(current.cooperation) || 5) + decision.delta.cooperation),
    pressure:    experienceClamp_((Number(current.pressure)    || 2) + decision.delta.pressure)
  };
  var balance = next.knowledge + next.cooperation - next.pressure;
  return {
    success:   true,
    gameId:    EXPERIENCE_GAME_.id,
    choice:    { id: decision.id, label: decision.label },
    phase:     chapter.phase,
    previousState: {
      knowledge:   experienceClamp_(Number(current.knowledge)   || 5),
      cooperation: experienceClamp_(Number(current.cooperation) || 5),
      pressure:    experienceClamp_(Number(current.pressure)    || 2)
    },
    nextState:   next,
    consequence: balance >= 8
      ? 'A decisão ampliou a capacidade do grupo de compreender e cuidar de ' + EXPERIENCE_GAME_.sharedResource + '.'
      : balance >= 4
      ? 'A decisão equilibrou ganhos e custos — há uma tensão aberta que o grupo precisa nomear.'
      : 'A decisão resolveu parte do desafio, mas criou uma pressão que precisa ser investigada.',
    evidence:    String(evidence || '').trim().substring(0, 420),
    reflection:  getExperienceChapter(chapterId, 3).data.cycle.revision,
    complete:    chapter.order >= EXPERIENCE_GAME_.chapters.length
  };
}

/**
 * Calcula o desfecho final com base no estado acumulado.
 * Retorna uma de três rotas: equilibrado, fragmentado ou sobrecarga.
 */
function getExperienceEndgame(state) {
  var s = state || {};
  var k = experienceClamp_(Number(s.knowledge)   || 5);
  var c = experienceClamp_(Number(s.cooperation) || 5);
  var p = experienceClamp_(Number(s.pressure)    || 2);
  var balance = k + c - p;
  var route, title, summary, recommendation;
  if (balance >= 10) {
    route          = 'equilibrado';
    title          = 'Horta em Equilíbrio';
    summary        = 'O grupo manteve conhecimento e cooperação acima da pressão ao longo das seis decisões. O sistema se auto-regula e pode ser expandido.';
    recommendation = 'Documente o fluxo de decisões e compartilhe o que funcionou com outras turmas.';
  } else if (p >= 7) {
    route          = 'sobrecarga';
    title          = 'Sistema sob Pressão';
    summary        = 'A pressão acumulada ultrapassou os recursos de conhecimento e cooperação. O sistema funciona, mas está frágil.';
    recommendation = 'Identifique o capítulo em que a pressão começou a crescer e discuta o que poderia ter sido feito diferente.';
  } else {
    route          = 'fragmentado';
    title          = 'Horta Fragmentada';
    summary        = 'Conhecimento e cooperação não cresceram juntos. Parte do sistema está saudável, mas há lacunas que precisam de atenção.';
    recommendation = 'Compare as decisões dos capítulos 3 e 4: onde o grupo priorizou individualmente em vez de coletivamente?';
  }
  return {
    success:        true,
    gameId:         EXPERIENCE_GAME_.id,
    route:          route,
    title:          title,
    summary:        summary,
    recommendation: recommendation,
    finalState:     { knowledge: k, cooperation: c, pressure: p, balance: balance }
  };
}


/**
 * Workflow mínimo compartilhado: orientar → prever → decidir → observar →
 * refletir. O estado retornado é serializável e pode ser salvo pelo cliente.
 */
function getExperienceBasicWorkflow(year) {
  var first = EXPERIENCE_GAME_.chapters[0];
  return {
    success: true,
    data: {
      gameId:    EXPERIENCE_GAME_.id,
      title:     EXPERIENCE_GAME_.title,
      chapterId: first.id,
      stage:     'briefing',
      stages:    ['briefing', 'prediction', 'decision', 'observation', 'reflection'],
      briefing:  getExperienceChapter(first.id, year).data,
      state:     { chapter: 1, knowledge: 5, cooperation: 5, pressure: 2 },
      complete:  false
    }
  };
}

function advanceExperienceBasicWorkflow(workflow, input, year) {
  var current = workflow && workflow.data ? workflow.data : workflow;
  if (!current || current.gameId !== EXPERIENCE_GAME_.id) {
    current = getExperienceBasicWorkflow(year).data;
  }
  var payload = input || {};
  var stages  = ['briefing', 'prediction', 'decision', 'observation', 'reflection'];
  var stage   = current.stage || 'briefing';
  var chapter = EXPERIENCE_GAME_.chapters.filter(function (item) {
    return item.id === String(current.chapterId || '');
  })[0] || EXPERIENCE_GAME_.chapters[0];

  // Verificação de pré-requisito na transição entre fases
  if (stage === 'briefing' && chapter.phase > 1) {
    var prevIdx     = chapter.order - 2;
    var prevChapter = prevIdx >= 0 ? EXPERIENCE_GAME_.chapters[prevIdx] : null;
    if (prevChapter && prevChapter.phase < chapter.phase &&
        (Number((current.state || {}).knowledge) || 5) < 3) {
      return {
        success:     true,
        needsReview: true,
        message:     'O grupo precisa consolidar o que aprendeu na fase anterior antes de avançar. Revise as decisões anteriores e tente novamente.',
        data:        current
      };
    }
  }

  var next = {
    gameId:      EXPERIENCE_GAME_.id,
    title:       EXPERIENCE_GAME_.title,
    chapterId:   chapter.id,
    stage:       stage,
    stages:      stages.slice(),
    briefing:    getExperienceChapter(chapter.id, year).data,
    state:       current.state || { chapter: chapter.order, knowledge: 5, cooperation: 5, pressure: 2 },
    prediction:  String(current.prediction  || ''),
    observation: String(current.observation || ''),
    reflection:  String(current.reflection  || ''),
    lastResult:  current.lastResult || null,
    complete:    false
  };

  if (stage === 'briefing') {
    next.stage = 'prediction';
  } else if (stage === 'prediction') {
    next.prediction = String(payload.text || payload.prediction || '').trim().substring(0, 420);
    if (!next.prediction) return { success: false, error: 'Registre uma previsão antes de decidir.', data: next };
    next.stage = 'decision';
  } else if (stage === 'decision') {
    var result = resolveExperienceDecision(next.state, chapter.id, payload.decisionId, payload.evidence);
    if (!result.success) return { success: false, error: result.error, data: next };
    next.state      = result.nextState;
    next.lastResult = result;
    next.stage      = 'observation';
  } else if (stage === 'observation') {
    next.observation = String(payload.text || payload.observation || '').trim().substring(0, 420);
    if (!next.observation) return { success: false, error: 'Registre uma evidência observada.', data: next };
    next.stage = 'reflection';
  } else {
    next.reflection = String(payload.text || payload.reflection || '').trim().substring(0, 420);
    if (!next.reflection) return { success: false, error: 'Registre o que manter ou revisar.', data: next };
    var nextChapter = EXPERIENCE_GAME_.chapters[chapter.order];
    if (!nextChapter) {
      next.complete = true;
      next.stage    = 'complete';
      next.endgame  = getExperienceEndgame(next.state);
    } else {
      next.chapterId   = nextChapter.id;
      next.stage       = 'briefing';
      next.briefing    = getExperienceChapter(nextChapter.id, year).data;
      next.prediction  = '';
      next.observation = '';
      next.reflection  = '';
    }
  }
  return { success: true, data: next };
}
