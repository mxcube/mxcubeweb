import { FabricObject } from 'fabric';

import { inSmallCellSizeMode } from './helpers';

/**
 * @typedef {Object} GridOptions
 * @property {number} cellRows - The number of rows in the grid.
 * @property {number} cellCols - The number of columns in the grid.
 * @property {number} cellWidth - The width of each cell in the grid.
 * @property {number} cellHeight - The height of each cell in the grid.
 * @property {number} cellHSpace - The horizontal space between cells.
 * @property {number} cellVSpace - The vertical space between cells.
 * @property {string} color - Color of the grid lines.
 * @property {number} cellTW - The total width of each cell, including the horizontal space.
 * @property {number} cellTH - The total height of each cell, including the vertical space.
 * @property {boolean} [selected = false] - Whether the grid is selected.
 */
/**
 * A custom Fabric.js object representing a grid.
 * @typedef {fabric.IObjectOptions & GridOptions} Grid
 * @extends FabricObject
 */
export class Grid extends FabricObject {
  static type = 'Grid';
  static ownDefaults = {
    selected: false,
  };

  static customProperties = [
    'cellRows',
    'cellCols',
    'cellWidth',
    'cellHeight',
    'cellHSpace',
    'cellVSpace',
    'color',
    'cellTW',
    'cellTH',
    'selected',
  ];

  constructor(options) {
    super(options);
    this.cellRows = Number(this.cellRows);
    this.cellCols = Number(this.cellCols);
    this.cellWidth = Number(this.cellWidth);
    this.cellHeight = Number(this.cellHeight);
    this.cellHSpace = Number(this.cellHSpace);
    this.cellVSpace = Number(this.cellVSpace);
    this.cellTW = Number(this.cellTW);
    this.cellTH = Number(this.cellTH);
    this.selected = !!options.selected;
  }

  /**
   * Renders the grid on the canvas.
   *
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
   * @private
   */
  _render(ctx) {
    if (this.selected) {
      this._drawInnerGridLines(ctx);
    }
    this._drawOuterBorder(ctx);
  }

  /**
   * Draws the inner grid lines.
   *
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
   * @private
   */
  _drawInnerGridLines(ctx) {
    // eslint-disable-next-line no-param-reassign
    ctx.strokeStyle = 'rgba(136, 255, 91, 0.5)';

    const [left, right, top, bottom] = [
      -this.width / 2,
      (this.cellTW * this.cellCols) / 2,
      -this.height / 2,
      (this.cellTH * this.cellRows) / 2,
    ];
    if (inSmallCellSizeMode(this.cellTW, this.cellTH)) {
      /* we don't draw inner lines for small cells, to reduce visual clutter */
      return;
    }
    // Draw horizontal lines
    for (let row = 1; row < this.cellRows; row++) {
      const y = top + row * this.cellTH;
      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(right, y);
      ctx.stroke();
    }

    // Draw vertical lines
    for (let col = 1; col < this.cellCols; col++) {
      const x = left + col * this.cellTW;
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(x, bottom);
      ctx.stroke();
    }
  }

  /**
   * Draws the outer border of the grid.
   *
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
   * @private
   */
  _drawOuterBorder(ctx) {
    // eslint-disable-next-line no-param-reassign
    ctx.strokeStyle = this.color;
    ctx.setLineDash(this.selected ? [] : [5, 5]);
    ctx.beginPath();
    ctx.rect(-this.width / 2, -this.height / 2, this.width, this.height);
    ctx.stroke();
  }
}
