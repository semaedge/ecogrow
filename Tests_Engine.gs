/**
 * Suíte de regressão executável no editor do Google Apps Script.
 * Requer initializeDatabase() e seedInitialData() executados previamente.
 */

function runEngineTests() {
  const tests = [
    testValidBoardSimulation,
    testInvalidBoardStructure,
    testPathogenContamination,
    testNutrientImbalance,
    testForbiddenMixing,
    testWaterDistribution
  ];
  let passed = 0;
  const failures = [];

  tests.forEach(function(testCase) {
    try {
      testCase();
      passed++;
      Logger.log("PASS: " + testCase.name);
    } catch (error) {
      failures.push(testCase.name + ": " + error.message);
      Logger.log("FAIL: " + testCase.name + " - " + error.message);
    }
  });

  const summary = { total: tests.length, passed: passed, failed: failures.length, failures: failures };
  Logger.log(JSON.stringify(summary));
  if (failures.length) throw new Error("Engine tests failed: " + failures.join(" | "));
  return summary;
}

function testValidBoardSimulation() {
  const result = Engine_Core.run(createGreywaterBoard(10));
  assertEngineTest(typeof result.score === "number" && result.score >= 0 && result.score <= 100, "Score must be between 0 and 100.");
  assertEngineTest(!result.feedback.some(function(item) { return item.type === "critical"; }), "A structurally valid board must not produce critical feedback.");
}

function testInvalidBoardStructure() {
  const board = {
    modules: [boardModule("garden", "mod004", "garden_output", 0, 0, 1, "plant001")],
    connections: []
  };
  const result = Engine_Core.run(board);
  assertEngineTest(result.feedback.some(function(item) { return item.type === "critical" && item.message.indexOf("flutuando") !== -1; }), "Floating module was not detected.");
}

function testPathogenContamination() {
  const result = Engine_Core.run(createGreywaterBoard(10));
  assertEngineTest(result.feedback.some(function(item) { return item.message.indexOf("Risco biológico") !== -1; }), "Biological risk was not detected.");
}

function testNutrientImbalance() {
  const result = Engine_Core.run(createGreywaterBoard(10));
  assertEngineTest(result.feedback.some(function(item) { return item.message.indexOf("Desequilíbrio de P") !== -1 || item.message.indexOf("Desequilíbrio de K") !== -1; }), "Nutrient imbalance was not detected.");
}

function testForbiddenMixing() {
  const board = {
    modules: [
      boardModule("black", "mod009", "blackwater_input", 0, 0, 0),
      boardModule("grey", "mod007", "greywater_input", 0, 1, 0),
      boardModule("filter", "mod002", "greywater_treatment", 1, 1, 0),
      boardModule("mixer", "mod008", "mixer", 2, 0, 0)
    ],
    connections: [
      boardConnection("black", "blackwater_raw", "mixer", "blackwater_raw", 10),
      boardConnection("grey", "greywater_raw", "filter", "greywater_raw", 10),
      boardConnection("filter", "greywater_treated", "mixer", "greywater_treated", 10)
    ]
  };
  const result = Engine_Core.run(board);
  assertEngineTest(result.feedback.some(function(item) { return item.type === "critical" && item.message.indexOf("Mistura perigosa") !== -1; }), "Forbidden mixing was not detected.");
}

function testWaterDistribution() {
  const result = Engine_Core.run(createGreywaterBoard(2));
  assertEngineTest(result.feedback.some(function(item) { return item.message.indexOf("Deficiência hídrica") !== -1; }), "Water deficit was not detected.");
}

function createGreywaterBoard(waterVolume) {
  return {
    modules: [
      boardModule("source", "mod007", "greywater_input", 0, 0, 0),
      boardModule("filter", "mod002", "greywater_treatment", 1, 0, 0),
      boardModule("garden", "mod004", "garden_output", 2, 0, 0, "plant001")
    ],
    connections: [
      boardConnection("source", "greywater_raw", "filter", "greywater_raw", waterVolume),
      boardConnection("filter", "greywater_treated", "garden", "greywater_treated", waterVolume)
    ]
  };
}

function boardModule(instanceId, moduleId, type, x, y, z, plantId) {
  return {
    id: instanceId,
    instanceId: instanceId,
    moduleId: moduleId,
    name: instanceId,
    type: type,
    x: x,
    y: y,
    z: z,
    plantId: plantId || null
  };
}

function boardConnection(fromId, output, toId, input, waterVolume) {
  return {
    from: { id: fromId, output: output, waterVolume: waterVolume },
    to: { id: toId, input: input }
  };
}

function assertEngineTest(condition, message) {
  if (!condition) throw new Error(message);
}
