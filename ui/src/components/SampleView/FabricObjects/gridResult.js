import { FabricObject } from 'fabric';

import { inSmallCellSizeMode } from './helpers';

const TAU = Math.PI * 2;
/**
 * Custom Fabric shape, for displaying grid scan results.
 *
 * This is an optimization for drawing grids with large number of
 * cells. Using one single custom fabric object for drawing results for
 * all cells is faster, then having a per cell fabric object.
 *
 * Another optimization is to switch to drawing rectangles instead of ellipses,
 * when cells are small. When cell's are a handful of pixels large, there is no
 * noticeable visual difference between a rectangle and an ellipse. However, it
 * appears that drawing rectangles is much faster.
 *
 */
export class GridResult extends FabricObject {
  static type = 'GridResult';

  static customProperties = [
    'cellRows',
    'cellCols',
    'cellHSpace',
    'cellVSpace',
    'cellTW',
    'cellTH',
    'fillingMatrix',
  ];

  constructor(options = {}) {
    super(options);

    const { cellTW, cellTH, cellColumns, cellRows } = options;

    this.set({
      width: cellTW * cellColumns,
      height: cellTH * cellRows,
    });
  }

  _render(ctx) {
    const xOffset = -this.width / 2 + this.cellTH / 2;
    const yOffset = -this.height / 2 + this.cellTW / 2;

    if (inSmallCellSizeMode(this.cellTW, this.cellTH)) {
      //
      // the cells are small, draw them as rectangles
      //

      const width = this.cellTW - this.cellHSpace;
      const height = this.cellTH - this.cellVSpace;

      for (let y = 0; y < this.cellRows; y += 1) {
        for (let x = 0; x < this.cellColumns; x += 1) {
          ctx.beginPath();
          ctx.fillStyle = this.fillingMatrix[x][y]; // eslint-disable-line no-param-reassign
          ctx.fillRect(
            xOffset + x * this.cellTW,
            yOffset + y * this.cellTH,
            width,
            height,
          );
        }
      }
    } else {
      //
      // normal cells, draw them as ellipses
      //

      const width = (this.cellTW - this.cellHSpace) / 2;
      const height = (this.cellTH - this.cellVSpace) / 2;

      for (let y = 0; y < this.cellRows; y += 1) {
        for (let x = 0; x < this.cellColumns; x += 1) {
          ctx.beginPath();
          ctx.fillStyle = this.fillingMatrix[x][y]; // eslint-disable-line no-param-reassign
          ctx.ellipse(
            xOffset + x * this.cellTW,
            yOffset + y * this.cellTH,
            width,
            height,
            0,
            0,
            TAU,
          );
          ctx.fill();
        }
      }
    }
  }
}
