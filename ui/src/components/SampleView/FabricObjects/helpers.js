/**
 * Based on cell width and height in pixels,
 * decide if we should do drawing in 'small cell size' mode.
 *
 *  returns true if 'small cell size' mode should be used, false otherwise
 */
export function inSmallCellSizeMode(cellWidth, cellHeight) {
  const MIN_CELL_PIXELS_SIZE = 6;
  return cellWidth < MIN_CELL_PIXELS_SIZE || cellHeight < MIN_CELL_PIXELS_SIZE;
}
