import 'fabric';

const { fabric } = window;

/**
 * Fabric Shape for drawing grid (defined by GridData)
 */
const GridGroup = fabric.util.createClass(fabric.Group, {
  type: 'GridGroup',

  initialize(objects, options = {}) {
    this.callSuper('initialize', objects, options);
    this.id = options.id;
  },
});

/**
 * GridData object defines a grid
 *
 * @return {GridData} GridData object
 */
function _GridData() {
  return {
    screenCoord: [0, 0],
    top: 0,
    left: 0,
    width: 0,
    height: 0,
    cellWidth: 0,
    cellHeight: 0,
    cellVSpace: 0,
    cellHSpace: 0,
    numCols: 0,
    numRows: 0,
    cellCountFun: null,
    selected: false,
    id: null,
    result: '',
    pixelsPerMMX: 1,
    pixelsPerMMY: 1,
  };
}

export default class DrawGridPlugin {
  constructor() {
    this.startDrawing = this.startDrawing.bind(this);
    this.update = this.update.bind(this);
    this.endDrawing = this.endDrawing.bind(this);
    this.repaint = this.repaint.bind(this);
    this.currentGridData = this.currentGridData.bind(this);
    this.currentShape = this.currentShape.bind(this);
    this.setCellSize = this.setCellSize.bind(this);
    this.shapeFromGridData = this.shapeFromGridData.bind(this);
    this.reset = this.reset.bind(this);
    this.setGridResultFormat = this.setGridResultFormat.bind(this);
    this.snapToGrid = true;
    this.heatMapColorForValue = this.heatMapColorForValue.bind(this);
    this.initializeCellFilling = this.initializeCellFilling.bind(this);
    this.initializeGridResult = this.initializeGridResult.bind(this);
    this.setGridResult = this.setGridResult.bind(this);
    this.drawing = false;
    this.gridSaved = true;
    this.shapeGroup = null;
    this.include_cell_labels = false;
    this.mouseOverGridLabel = [];
    this.overlayLevel = 0.2;
    this.gridData = _GridData();
    this.scale = 0;
    this.resultType = 'heatmap';
    this.gridResultFormat = 'PNG';
    this.canvas = null;
  }

  /**
   * Sets cell couting method: 'zig-zag', 'inverse-zig-zag'
   *
   * @param {float} cellCounting
   */
  setCellCounting(cellCounting) {
    this.gridData.cellCountFun = cellCounting;
  }

  /**
   * Sets cell size of current grid
   *
   * @param {float} cellWidth
   * @param {float} cellHeight
   */
  setCellSize(cellWidth, cellHeight) {
    this.gridData.cellWidth = cellWidth;
    this.gridData.cellHeight = cellHeight;
  }

  /**
   * Sets cell spacing, of an arbitrary grid (specified by a GridData object)
   *
   * @param {GridData} gd - GridData object
   * @param {boolean} snapToGrid - True if grid is defined by whole cells,
   *                               false if fractions of a cell is allowed
   * @param {float} hSpace - horizontal space
   * @param {float} VSpace - vertical space
   */
  setCellSpace(gd, snapToGrid, hSpace, vSpace) {
    const gridData = { ...gd };

    if (vSpace !== null && !Number.isNaN(vSpace)) {
      gridData.cellVSpace = vSpace;
    }
    if (hSpace !== null && !Number.isNaN(hSpace)) {
      gridData.cellHSpace = hSpace;
    }

    if (snapToGrid) {
      const cellTW = gridData.cellWidth + gridData.cellHSpace;
      const cellTH = gridData.cellHeight + gridData.cellVSpace;

      gridData.width = gridData.numCols * cellTW;
      gridData.height = gridData.numRows * cellTH;
    }

    return gridData;
  }

  setGridResultFormat(format) {
    this.gridResultFormat = format;
  }

  setScale(scale) {
    this.scale = scale;
  }

  setPixelsPerMM(pixelsPerMM, gd = null) {
    const gridData = gd === null ? this.gridData : { ...gd };

    gridData.pixelsPerMMX = pixelsPerMM[0];
    gridData.pixelsPerMMY = pixelsPerMM[1];

    return gridData;
  }

  getCellWidth(gd) {
    return (gd.cellWidth / 1000) * this.scale * gd.pixelsPerMMX;
  }

  getCellHeight(gd) {
    return (gd.cellHeight / 1000) * this.scale * gd.pixelsPerMMY;
  }

  getCellVSpace(gd) {
    return (gd.cellVSpace / 1000) * gd.pixelsPerMMX * this.scale;
  }

  getCellHSpace(gd) {
    return (gd.cellHSpace / 1000) * gd.pixelsPerMMY * this.scale;
  }

  /**
   * Sets cell spacing for current grid
   *
   * @param {float} hSpace
   * @param {float} vSpace
   */
  setCurrentCellSpace(hSpace, vSpace) {
    this.gridData = this.setCellSpace(
      this.gridData,
      this.snapToGrid,
      hSpace,
      vSpace,
    );
  }

  setGridOverlay(level) {
    this.overlayLevel = level;
  }

  initializeGridResult(gridData) {
    const col = gridData.numCols;
    const row = gridData.numRows;
    const cellResultMatrix = [];

    if (this.gridResultFormat === 'RGB') {
      for (let c = 0; c < col; c++) {
        for (let r = 0; r < row; r++) {
          cellResultMatrix.append([0, [0, 0, 0]]);
        }
      }
    }

    return cellResultMatrix;
  }

  setGridResult(result) {
    this.gridData.result = result;
  }

  /**
   * Sart drawing grid
   *
   * @param {Object} options
   * @param {FabricCanvas} canvas
   * @param {boolean} snapToGrid - True if grid is defined by whole cells,
   *                               false if fractions of a cell is allowed
   */
  startDrawing(options, canvas, snapToGrid = true) {
    if (!canvas.getActiveObject() && !this.drawing) {
      this.snapToGrid = snapToGrid;
      this.drawing = true;
      this.gridSaved = false;
      this.currentTopLeftX = options.e.layerX;
      this.currentTopLeftY = options.e.layerY;
    }
  }

  /**
   * Updates current grid while drawing
   *
   * @param {FabricCanvas} canvas
   * @param {float} x - bottom x coordinate of grid, (mouse x position)
   * @param {float} y - bottom y coordinate of grid, (mouse y position)
   */
  update(canvas, x, y) {
    this.gridData.screenCoord[0] = this.currentTopLeftX;
    this.gridData.screenCoord[1] = this.currentTopLeftY;

    const [left, top] = this.gridData.screenCoord;
    const validPosition = x > left && y > top;

    const cellTW =
      this.getCellWidth(this.gridData) + this.getCellHSpace(this.gridData);
    const cellTH =
      this.getCellHeight(this.gridData) + this.getCellVSpace(this.gridData);

    let width = Math.abs(x - left);
    let height = Math.abs(y - top);

    const numCols = Math.ceil(width / cellTW);
    const numRows = Math.ceil(height / cellTH);

    const cellLimit = 200_000;

    const draw = this.drawing && validPosition && numCols * numRows < cellLimit;

    if (this.snapToGrid) {
      width = numCols * cellTW;
      height = numRows * cellTH;
    }

    if (draw) {
      this.gridData.width = width;
      this.gridData.height = height;
      this.gridData.numCols = numCols;
      this.gridData.numRows = numRows;

      this.repaint(canvas);
    }
  }

  /**
   * Repaint current grid
   *
   * @param {FabricCanvas} canvas
   */
  repaint(canvas) {
    const shape = this.shapeFromGridData(this.gridData);

    if (this.shapeGroup) {
      canvas.remove(this.shapeGroup);
    }

    this.shapeGroup = shape.shapeGroup;
    this.gridData = shape.gridData;

    if (this.shapeGroup) {
      canvas.add(this.shapeGroup);
      canvas.requestRenderAll();
    }
  }

  heatMapColorForValue(gd, value) {
    let dataFill = `rgba(${Number.parseInt(value[0], 10)}, ${Number.parseInt(
      value[1],
      10,
    )},`;
    dataFill += `${Number.parseInt(value[2], 10)}, ${this.overlayLevel})`;
    return dataFill;
  }

  setResulOnCell(col, row, val) {
    const gridData = this.currentGridData();
    gridData.result[col][row] = val;
    return gridData;
  }

  initializeCellFilling(gd, col, row) {
    const level = this.overlayLevel || 0.2;
    const fill = `rgba(0, 0, 200, ${level}`;
    return Array.from({ length: col }).map(() =>
      Array.from({ length: row }).fill(fill),
    );
  }

  cellFillingFromData(gd, col, row) {
    /**
     * Creates the heatmap data for later fill grid cells
     * @param {GridData} gd
     * @param 2d array data
     */
    const fillingMatrix = this.initializeCellFilling(gd, col, row);

    // Asume flat result object to remain compatible with old format only
    // suporting one type of results
    let { result } = gd;

    // Use selected result type if it exists
    if (gd.result !== null && this.resultType in gd.result) {
      result = gd.result[this.resultType];
    }

    if (
      result !== undefined &&
      result !== null &&
      gd.id !== null &&
      Object.values(result).length > 0
    ) {
      for (let nh = 0; nh < row; nh++) {
        for (let nw = 0; nw < col; nw++) {
          const index = nw + nh * col + 1;
          fillingMatrix[nw][nh] = this.heatMapColorForValue(
            gd,
            result[index][1],
          );
        }
      }
    }

    return fillingMatrix;
  }

  /**
   * Creates a Fabric GridGroup shape from a GridData object
   *
   * @param {GridData} gd
   * @return {Object} {shapeGroup, gridData}
   */
  // eslint-disable-next-line sonarjs/cognitive-complexity
  shapeFromGridData(gd) {
    const gridData = { ...gd };
    let [left, top] = gd.screenCoord;

    // Only apply scale to grids that have been "normalized"
    // (stored server side, id == null)
    if (gridData.id !== null) {
      left *= this.scale;
      top *= this.scale;
    }

    const shapes = [];
    const cellWidth = this.getCellWidth(gridData);
    const cellHeight = this.getCellHeight(gridData);
    const cellHSpace = this.getCellHSpace(gridData);
    const cellVSpace = this.getCellVSpace(gridData);

    const cellTW = cellWidth + cellHSpace;
    const cellTH = cellHeight + cellVSpace;

    const height = cellTH * gridData.numRows;
    const width = cellTW * gridData.numCols;

    let color = gridData.selected
      ? 'rgba(255, 255, 255, 1)'
      : 'rgba(255, 255, 255, 0.5)';
    color = gridData.result.length > 0 ? 'rgba(255, 255, 255, 1)' : color;
    const lineColor = gridData.selected
      ? 'rgba(255, 255, 255, 0.5)'
      : 'rgba(255, 255, 255, 0)';
    const outlineStrokeArray = gridData.selected ? [] : [5, 5];
    const innerStrokeArray = gridData.selected ? [5, 5] : [0, 0];

    if (cellTW > 0 && cellTH > 0) {
      for (let nw = 1; nw < gridData.numCols; nw++) {
        shapes.push(
          new fabric.Line(
            [left + cellTW * nw, top, left + cellTW * nw, top + height],
            {
              stroke: lineColor,
              strokeDashArray: innerStrokeArray,
              hasControls: false,
              selectable: false,
            },
          ),
        );
      }

      for (let nh = 1; nh < gridData.numRows; nh++) {
        shapes.push(
          new fabric.Line(
            [left, top + cellTH * nh, left + width, top + cellTH * nh],
            {
              stroke: lineColor,
              strokeDashArray: innerStrokeArray,
              hasControls: false,
              selectable: false,
            },
          ),
        );
      }

      if (!this.drawing) {
        if (this.gridResultFormat === 'RGB') {
          const fillingMatrix = this.cellFillingFromData(
            gridData,
            gridData.numCols,
            gridData.numRows,
          );

          for (let nw = 0; nw < gridData.numCols; nw++) {
            for (let nh = 0; nh < gridData.numRows; nh++) {
              const cellCount = this.countCells(
                gridData.cellCountFun,
                nw,
                nh,
                gridData.numRows,
                gridData.numCols,
              );

              shapes.push(
                new fabric.Ellipse({
                  left: left + cellHSpace / 2 + cellTW * nw,
                  top: top + cellVSpace / 2 + cellTH * nh,
                  width: cellWidth,
                  height: cellHeight,
                  fill: fillingMatrix[nw][nh],
                  stroke: 'rgba(0,0,0,0)',
                  hasControls: false,
                  selectable: false,
                  hasRotatingPoint: false,
                  lockMovementX: true,
                  lockMovementY: true,
                  lockScalingX: true,
                  lockScalingY: true,
                  lockRotation: true,
                  hoverCursor: 'pointer',
                  originX: 'left',
                  originY: 'top',
                  rx: cellWidth / 2,
                  ry: cellHeight / 2,
                  cell: cellCount,
                }),
              );

              if (this.include_cell_labels) {
                shapes.push(
                  new fabric.Text(cellCount, {
                    left: left + cellHSpace / 2 + cellTW * nw + cellWidth / 2,
                    top: top + cellVSpace / 2 + cellTH * nh + cellHeight / 2,
                    originX: 'center',
                    originY: 'center',
                    fill: 'rgba(0, 0, 200, 1)',
                    fontFamily: 'Helvetica',
                    fontSize: 18,
                  }),
                );
              }
            }
          }
        } else if (gridData.result && gridData.result.length > 0) {
          const imageElement = document.createElement('img');
          imageElement.src = `data:image/png;base64,${gridData.result}`;
          const image = new fabric.Image(imageElement);
          image.scaleToHeight(height);
          image.scaleX = width / imageElement.naturalWidth;
          image.set({ top, left });
          shapes.push(image);
        }
      }
    }

    shapes.push(
      new fabric.Rect({
        left,
        top,
        width,
        height,
        fill: 'rgba(0,0,0,0)',
        strokeDashArray: outlineStrokeArray,
        stroke: color,
        hasControls: false,
        selectable: true,
        hoverCursor: 'pointer',
      }),
    );

    if (gridData.name) {
      shapes.push(
        new fabric.Text(gridData.name, {
          left: left + width,
          top: top - 20,
          fill: color,
          fontFamily: 'Helvetica',
          fontSize: 18,
        }),
      );
    }

    const shapeGroup = new GridGroup(shapes, {
      hasBorders: false,
      hasControls: false,
      selectable: true,
      lockMovementX: true,
      lockMovementY: true,
      lockScalingX: true,
      lockScalingY: true,
      lockRotation: true,
      visible: true,
      hoverCursor: 'pointer',
      id: gd.id,
    });

    return { shapeGroup, gridData };
  }

  clearMouseOverGridLabel(canvas) {
    if (this.mouseOverGridLabel) {
      canvas.remove(this.mouseOverGridLabel);
      this.mouseOverGridLabel = [];
    }
  }

  onCellMouseOver(options, canvas) {
    if (options.target && options.target.get('type') === 'GridGroup') {
      options.target.forEachObject((obj) => {
        if (obj.get('type') === 'ellipse') {
          const mpoint = new fabric.Point(options.e.offsetX, options.e.offsetY);

          if (obj.containsPoint(mpoint, null, true) && obj.cell) {
            this.clearMouseOverGridLabel(canvas);

            const objCenterX = obj.aCoords.tl.x + obj.width / 2;

            this.mouseOverGridLabel.push(
              new fabric.Ellipse({
                left: objCenterX,
                top: options.e.offsetY - 25,
                width: 40,
                height: 40,
                stroke: 'rgba(0, 0, 0, 1)',
                fill: 'rgba(0, 0, 200, 0.4)',
                hasControls: false,
                selectable: false,
                hasRotatingPoint: false,
                lockMovementX: true,
                lockMovementY: true,
                lockScalingX: true,
                lockScalingY: true,
                lockRotation: true,
                hoverCursor: 'pointer',
                originX: 'center',
                originY: 'center',
                rx: 20,
                ry: 20,
              }),
              new fabric.Text(obj.cell, {
                left: objCenterX,
                top: options.e.offsetY - 25,
                originX: 'center',
                originY: 'center',
                fill: 'rgba(200, 0, 0, 1)',
                fontFamily: 'Helvetica',
                fontSize: 18,
                hasControls: false,
                selectable: false,
                hasRotatingPoint: false,
                lockMovementX: true,
                lockMovementY: true,
                lockScalingX: true,
                lockScalingY: true,
                lockRotation: true,
              }),
            );

            this.mouseOverGridLabel = new GridGroup(this.mouseOverGridLabel, {
              hasBorders: false,
              hasControls: false,
              selectable: false,
              lockMovementX: true,
              lockMovementY: true,
              lockScalingX: true,
              lockScalingY: true,
              lockRotation: true,
              hoverCursor: 'pointer',
            });

            canvas.add(this.mouseOverGridLabel);
            canvas.requestRenderAll();
          }
        }
      });
    }
  }

  getClickedCell(shapeGroup, clickPoint) {
    let cell = null;

    shapeGroup.forEachObject((obj) => {
      if (
        obj.get('type') === 'ellipse' &&
        obj.containsPoint(clickPoint, null, true)
      ) {
        cell = obj;
      }
    });

    return cell;
  }

  /**
   * Ends drawing
   */
  endDrawing() {
    if (this.drawing) {
      this.drawing = false;
    }
  }

  /**
   * Is current grid saved
   * @return {boolean} Saved
   */
  saved() {
    return this.gridSaved;
  }

  /**
   * Save a grid, reset any scaling to original scale
   */
  saveGrid(_gd) {
    const gd = { ..._gd };

    gd.screenCoord[0] /= this.scale;
    gd.screenCoord[1] /= this.scale;
    gd.width /= this.scale;
    gd.height /= this.scale;

    return gd;
  }

  /**
   * Reset current grid, used to clear current grid.
   */
  reset() {
    this.gridSaved = true;
    this.drawing = false;
    this.shapeGroup = null;
    this.gridData = _GridData();
  }

  /**
   * Returns current GridGroup shape
   * @return {GridGroup}
   */
  currentShape() {
    return this.shapeGroup;
  }

  /**
   * Returns current GridData object
   * @return {GridData}
   */
  currentGridData() {
    return this.gridData;
  }

  /**
   * Maps cell at (currentRow, currentCol) in a grid with total number of rows
   * and columns (numRows, numCols) to a index. The mapping function used is
   * given by mode.
   *
   * @param {String} mode - method to use one of ['zig-zag', 'left-to-right']
   * @param {Number} currentRow - Row currently at
   * @param {Number} currentCol - Column currently at
   * @param {Number} numRows - Total number of rows in grid
   * @param {Number} numCols - Total number of columns in grid
   *
   * @return {String} - index
   */
  countCells(mode, currentRow, currentCol, numRows, numCols) {
    let count = '';

    switch (mode) {
      case 'zig-zag': {
        count = this.zigZagCellCount(currentRow, currentCol, numRows, numCols);

        break;
      }
      case 'top-down-zig-zag': {
        count = this.topDownZigZagCellCount(
          currentRow,
          currentCol,
          numRows,
          numCols,
        );

        break;
      }
      case 'top-down': {
        count = this.topDownCellCount(currentRow, currentCol, numRows, numCols);

        break;
      }
      case 'inverse-zig-zag': {
        count = this.inverseZigZagCellCount(
          currentRow,
          currentCol,
          numRows,
          numCols,
        );

        break;
      }
      default: {
        count = this.leftRightCellCount(
          currentRow,
          currentCol,
          numRows,
          numCols,
        );
      }
    }

    return count.toString();
  }

  /**
   * zig-zag indexing of cells (see countCells for doc)
   */
  zigZagCellCount(currentRow, currentCol, numRows, numCols) {
    let cellCount = currentRow * numCols + (currentCol + 1);

    if (currentRow % 2 !== 0) {
      cellCount = currentRow * numCols + (numCols - currentCol);
    }

    return cellCount;
  }

  /**
   * left-to-right indexing of cells (see countCells for doc)
   */
  leftRightCellCount(currentRow, currentCol, numRows, numCols) {
    return currentRow + 1 + currentCol * numCols;
  }

  /**
   * top down zig zag indexing of cells (see countCells for doc)
   * 1 6 7
   * 2 5 8
   * 3 4 9
   */
  topDownZigZagCellCount(currentRow, currentCol, numRows) {
    let cellCount = currentCol + 1 + currentRow * numRows;

    if (currentRow % 2 !== 0) {
      cellCount = numRows * (currentRow + 1) - currentCol;
    }

    return cellCount;
  }

  /**
   * top down indexing of cells (see countCells for doc)
   * 1 6 7
   * 2 5 8
   * 3 4 9
   */
  topDownCellCount(currentRow, currentCol, numRows) {
    return currentCol + 1 + currentRow * numRows;
  }

  /**
   * inverse bottom up indexing of cells (see countCells for doc)
   * 9 6 3
   * 8 5 2
   * 7 4 1
   */
  inverseBottomUp(currentRow, currentCol, numRows, numCols) {
    return numRows * numCols - currentRow * numRows - currentCol;
  }

  /**
   * inverse zig-zag indexing of cells (see countCells for doc)
   * 9 4 3
   * 8 5 2
   * 7 6 1
   */
  inverseZigZagCellCount(currentRow, currentCol, numRows, numCols) {
    let cellCount = numRows * numCols - currentRow * numRows - currentCol;

    if (currentRow !== numCols - 1 && (numCols - currentRow + 1) % 2 !== 0) {
      cellCount =
        numRows * numCols - currentRow * numRows + currentCol - numRows + 1;
    }

    return cellCount;
  }
}
