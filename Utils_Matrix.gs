/**
 * Arquivo: Utils_Matrix.gs
 * Funcionalidades: Helper para trabalhar com Arrays 3D (X, Y, Z/Piso) que representam o tabuleiro do jogo. Facilita encontrar adjacências e módulos vizinhos para validação e mapeamento de fluxo.
 * Integrações: Engine_Validation.gs, Engine_FlowPath.gs.
 * Dependências: Config.gs.
 */

function getModuleAt(modules, x, y, z) {
  return modules.find(module => module.x === x && module.y === y && module.z === z);
}

function getNeighbors(modules, x, y, z) {
  const neighbors = [];
  const directions = [
    { dx: 1, dy: 0, dz: 0 }, { dx: -1, dy: 0, dz: 0 }, // Leste, Oeste
    { dx: 0, dy: 1, dz: 0 }, { dx: 0, dy: -1, dz: 0 }, // Norte, Sul
    { dx: 0, dy: 0, dz: 1 }, { dx: 0, dy: 0, dz: -1 }  // Acima, Abaixo
  ];

  directions.forEach(dir => {
    const nx = x + dir.dx;
    const ny = y + dir.dy;
    const nz = z + dir.dz;

    const neighborModule = getModuleAt(modules, nx, ny, nz);
    if (neighborModule) {
      neighbors.push(neighborModule);
    }
  });
  return neighbors;
}

function getAdjacentModules(modules, x, y, z) {
  const adjacent = [];
  const directions = [
    { dx: 1, dy: 0, dz: 0 }, { dx: -1, dy: 0, dz: 0 }, // Leste, Oeste
    { dx: 0, dy: 1, dz: 0 }, { dx: 0, dy: -1, dz: 0 }  // Norte, Sul
  ];

  directions.forEach(dir => {
    const nx = x + dir.dx;
    const ny = y + dir.dy;
    const neighborModule = getModuleAt(modules, nx, ny, z);
    if (neighborModule) {
      adjacent.push(neighborModule);
    }
  });
  return adjacent;
}
