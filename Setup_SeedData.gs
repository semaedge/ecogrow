/**
 * Arquivo: Setup_SeedData.gs
 * Funcionalidades: Popula o banco de dados com dados iniciais para módulos (ex: Separador, Decantador, Biofiltro, Sanitizador) e plantas (com suas exigências de NPK, água e tolerância a patógenos).
 * Integrações: Model_Module.gs, Model_Plant.gs.
 * Dependências: Model_Module.gs, Model_Plant.gs.
 */

function seedInitialData() {
  // Módulos iniciais
  const initialModules = [
    { id: "mod001", name: "Vaso Sanitário Seco", type: "blackwater_input", capacity: 1, inputs: [], outputs: ["solids_compost", "urine_liquid"], npkImpact: {N: 0.1, P: 0.05, K: 0.02}, pathogenReduction: {bacteria: 0.1, virus: 0.05} },
    { id: "mod002", name: "Filtro de Água Cinza", type: "greywater_treatment", capacity: 100, inputs: ["greywater_raw"], outputs: ["greywater_treated"], npkImpact: {N: 0.01, P: 0.01, K: 0.01}, pathogenReduction: {bacteria: 0.7, virus: 0.5} },
    { id: "mod003", name: "Biodigestor Compacto", type: "blackwater_treatment", capacity: 50, inputs: ["blackwater_raw", "food_waste"], outputs: ["biofertilizer_liquid", "biogas"], npkImpact: {N: 0.2, P: 0.1, K: 0.05}, pathogenReduction: {bacteria: 0.9, virus: 0.8} },
    { id: "mod004", name: "Canteiro Elevado", type: "garden_output", capacity: 50, inputs: ["greywater_treated", "biofertilizer_liquid", "compost"], outputs: ["vegetables"], npkImpact: {N: -0.1, P: -0.05, K: -0.05}, pathogenReduction: {bacteria: 0, virus: 0} },
    { id: "mod005", name: "Horta Vertical", type: "garden_output", capacity: 20, inputs: ["greywater_treated", "biofertilizer_liquid"], outputs: ["herbs"], npkImpact: {N: -0.05, P: -0.02, K: -0.02}, pathogenReduction: {bacteria: 0, virus: 0} },
    { id: "mod006", name: "Composteira", type: "compost_treatment", capacity: 20, inputs: ["solids_compost", "food_waste"], outputs: ["compost"], npkImpact: {N: 0.05, P: 0.03, K: 0.01}, pathogenReduction: {bacteria: 0.95, virus: 0.9} },
    { id: "mod007", name: "Coletor de Água Cinza", type: "greywater_input", capacity: 12, inputs: [], outputs: ["greywater_raw"], npkImpact: {N: 0, P: 0, K: 0}, pathogenReduction: {bacteria: 0, virus: 0} },
    { id: "mod008", name: "Misturador Controlado", type: "mixer", capacity: 50, inputs: ["blackwater_raw", "greywater_treated"], outputs: ["mixed_effluent"], npkImpact: {N: 0, P: 0, K: 0}, pathogenReduction: {bacteria: 0, virus: 0} },
    { id: "mod009", name: "Coletor de Água Negra", type: "blackwater_input", capacity: 10, inputs: [], outputs: ["blackwater_raw"], npkImpact: {N: 0, P: 0, K: 0}, pathogenReduction: {bacteria: 0, virus: 0} }
  ];

  initialModules.forEach(module => {
    if (!GameSheets.modules.getById(module.id)) {
      GameSheets.modules.create(module);
    }
  });

  // Plantas iniciais
  const initialPlants = [
    { id: "plant001", name: "Alface", type: "leafy_green", npkRequirements: {N: 0.8, P: 0.3, K: 0.5}, waterRequirements: 10, pathogenTolerance: {bacteria: 0.1, virus: 0.05} },
    { id: "plant002", name: "Tomateiro", type: "fruiting_plant", npkRequirements: {N: 0.5, P: 0.7, K: 0.9}, waterRequirements: 15, pathogenTolerance: {bacteria: 0.05, virus: 0.02} },
    { id: "plant003", name: "Manjericão", type: "herb", npkRequirements: {N: 0.6, P: 0.2, K: 0.4}, waterRequirements: 5, pathogenTolerance: {bacteria: 0.15, virus: 0.08} }
  ];

  initialPlants.forEach(plant => {
    if (!GameSheets.plants.getById(plant.id)) {
      GameSheets.plants.create(plant);
    }
  });

  Logger.log("Initial data seeded successfully.");
}
