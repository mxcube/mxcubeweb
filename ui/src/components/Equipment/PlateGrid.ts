interface WellOption {
  color: string;
}

interface PlateGrid {
  wellHeight: number;
  wellWidth: number;
  dropHeight: number;
  dropWidth: number;
  rowTitle: string[];
  colTitle: number[];
  numberOfDrops: number;
  dropPosy: number;
  type: string;
  title: string;
  wellOption: WellOption[];
  rotation: number;
}

const PLATE_GRID_DEFAULTS: PlateGrid = {
  wellHeight: 25,
  wellWidth: 25,
  dropHeight: 25,
  dropWidth: 25,
  rowTitle: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
  colTitle: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  numberOfDrops: 3,
  dropPosy: 70,
  type: 'square',
  title: '96 Deep Well Plate',
  wellOption: [{ color: '#eeeeee' }, { color: '#e0e0e0' }],
  rotation: 0,
};

function createPlateGrid(overrides: Partial<PlateGrid> = {}): PlateGrid {
  return { ...PLATE_GRID_DEFAULTS, ...overrides };
}

export const crystalDirect: PlateGrid = createPlateGrid();
export const crystalQUickX: PlateGrid = createPlateGrid({
  numberOfDrops: 2,
  dropPosy: 95,
});
export const mitegenInSitu1: PlateGrid = createPlateGrid({ rotation: -90 });
export const greinerImpact1536: PlateGrid = createPlateGrid({
  numberOfDrops: 1,
  dropPosy: 135,
  wellOption: [{ color: '#eeeeee' }],
});
export const chipX: PlateGrid = createPlateGrid({
  wellHeight: 130,
  wellWidth: 400,
  dropHeight: 20,
  dropWidth: 20,
  rowTitle: ['A', 'B'],
  colTitle: [1],
  numberOfDrops: 20,
  wellOption: [{ color: '#eeeeee' }],
});

export const PLATE_LABEL_TO_GRID = {
  'Crystal Direct': crystalDirect,
  'Crystal QuickX': crystalQUickX,
  'Mitegen InSitu-1': mitegenInSitu1,
  'Greiner Impact 1536': greinerImpact1536,
  ChipX: chipX,
};

// Static plate configuration -- never written to by any reducer, so it
// doesn't need to live in Redux state. Derived from PLATE_LABEL_TO_GRID
// (relying on JS's guaranteed string-key insertion order) rather than
// duplicated as a separately maintained list.
export const PLATE_GRIDS: PlateGrid[] = Object.values(PLATE_LABEL_TO_GRID);
