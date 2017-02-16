import 'fabric';
const fabric = window.fabric;

/**
 * Fabric Shape for drawing grid (defined by GridData)
 */
const GridGroup = fabric.util.createClass(fabric.Group, {
  type: 'GridGroup',

  initialize(objects, options = {}) {
    this.callSuper('initialize', objects, options);
    this.id = options.id;
  }
});


/**
 * GridData object defines a grid
 *
 * @return {GridData} GridData object
 */
function _GridData() {
  return { top: null, left: null,
           width: null, height: null,
           cellWidth: null, cellHeight: null,
           cellVSpace: 0, cellHSpace: 0,
           numCols: null, numRows: null,
           label: 'Grid', cellCountFun: 'zig-zag',
           selected: false, id: null };
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
    this.snapToGrid = true;

    this.drawing = false;
    this.shapeGroup = null;
    this.gridData = _GridData();
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

    if (vSpace !== null && !isNaN(vSpace)) { gridData.cellVSpace = vSpace; }
    if (hSpace !== null && !isNaN(hSpace)) { gridData.cellHSpace = hSpace; }

    if (snapToGrid) {
      const cellTW = gridData.cellWidth + gridData.cellHSpace;
      const cellTH = gridData.cellHeight + gridData.cellVSpace;

      gridData.width = gridData.numCols * cellTW;
      gridData.height = gridData.numRows * cellTH;
    }

    return gridData;
  }


  /**
   * Sets cell spacing for current grid
   *
   * @param {float} hSpace
   * @param {float} vSpace
   */
  setCurrentCellSpace(hSpace, vSpace) {
    this.gridData = this.setCellSpace(this.gridData, this.snapToGrid, hSpace, vSpace);
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
      this.gridData.top = options.e.layerY;
      this.gridData.left = options.e.layerX;
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
    const validPosition = x > this.gridData.left && y > this.gridData.top;
    const draw = this.drawing && validPosition;
    const cellTW = this.gridData.cellWidth + this.gridData.cellHSpace;
    const cellTH = this.gridData.cellHeight + this.gridData.cellVSpace;

    let width = Math.abs(x - this.gridData.left);
    let height = Math.abs(y - this.gridData.top);

    const numCols = Math.ceil(width / this.gridData.cellWidth);
    const numRows = Math.ceil(height / this.gridData.cellHeight);

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
    canvas.add(this.shapeGroup);

    canvas.renderAll();
  }


  /**
   * Creates a Fabric GridGroup shape from a GridData object
   *
   * @param {GridData} gd
   * @return {Object} {shapeGroup, gridData}
   */
  shapeFromGridData(gd) {
    const gridData = { ...gd };
    const shapes = [];
    const cellWidth = gridData.cellWidth;
    const cellHeight = gridData.cellHeight;

    const cellTW = cellWidth + gridData.cellHSpace;
    const cellTH = cellHeight + gridData.cellVSpace;

    const color = gridData.selected ? 'rgba(0,255,0,1)' : 'rgba(0,0,100,0.8)';
    const strokeArray = gridData.selected ? [] : [5, 5];


    if (cellWidth > 0 && cellHeight > 0) {
      for (let nw = 1; nw < gridData.numCols; nw++) {
        shapes.push(new fabric.Line(
          [gridData.left + cellTW * nw, gridData.top,
           gridData.left + cellTW * nw, gridData.top + gridData.height],
          {
            strokeDashArray: strokeArray,
            stroke: color,
            hasControls: false,
            selectable: false
          }));
      }

      for (let nh = 1; nh < gridData.numRows; nh++) {
        shapes.push(new fabric.Line(
          [gridData.left, gridData.top + (cellTH) * nh,
           gridData.left + gridData.width, gridData.top + (cellTH) * nh],
          {
            strokeDashArray: strokeArray,
            stroke: color,
            hasControls: false,
            selectable: false
          }));
      }

      for (let nw = 0; nw < gridData.numCols; nw++) {
        for (let nh = 0; nh < gridData.numRows; nh++) {
          shapes.push(new fabric.Ellipse({
            left: gridData.left + gridData.cellHSpace / 2 + (cellTW) * nw,
            top: gridData.top + gridData.cellVSpace / 2 + (cellTH) * nh,
            width: cellWidth,
            height: cellHeight,
            fill: 'rgba(0,0,100,0.2)',
            stroke: 'rgba(0,0,0,0)',
            hasControls: false,
            selectable: false,
            originX: 'left',
            originY: 'top',
            rx: cellWidth / 2,
            ry: cellHeight / 2
          }));

          const cellCount = this.countCells(gridData.cellCountFun, nw, nh,
                                            gridData.numRows, gridData.numCols);

          shapes.push(new fabric.Text(cellCount, {
            left: gridData.left + gridData.cellHSpace / 2 + (cellTW) * nw + cellWidth / 2,
            top: gridData.top + gridData.cellVSpace / 2 + (cellTH) * nh + cellHeight / 2,
            originX: 'center',
            originY: 'center',
            fill: 'rgba(0, 0, 200, 1)',
            fontFamily: 'Helvetica',
            fontSize: 18
          }));
        }
      }
    }

    shapes.push(new fabric.Rect({
      left: gridData.left,
      top: gridData.top,
      width: gridData.width,
      height: gridData.height,
      fill: 'rgba(0,0,0,0)',
      strokeDashArray: strokeArray,
      stroke: color,
      hasControls: false,
      selectable: true,
      hoverCursor: 'pointer'
    }));

    if (gridData.label) {
      shapes.push(new fabric.Text(gridData.label, {
        left: gridData.left + gridData.width,
        top: gridData.top - 20,
        fill: color,
        fontFamily: 'Helvetica',
        fontSize: 18
      }));
    }

    const shapeGroup = new GridGroup(shapes, {
      hasBorders: false,
      hasControls: false,
      selectable: true,
      lockMovementX: true,
      lockMovementY: true,
      lockScalingX: true,
      lockScalingY: true,
      lockRotatio: true,
      hoverCursor: 'pointer',
      id: gd.id
    });

    return { shapeGroup, gridData };
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
   * Reset current grid, used to clear current grid.
   */
  reset() {
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
   * @param {Number} numRows - Total numver of rows in grid
   * @param {Number} numCols - Total number of columns in grid
   *
   * @return {String} - index
   */
  countCells(mode, currentRow, currentCol, numRows, numCols) {
    let count = '';

    if (mode === 'zig-zag') {
      count = this.zigZagCellCount(currentRow, currentCol, numRows, numCols);
    } else {
      count = this.leftRightCellCount(currentRow, currentCol, numRows, numCols);
    }

    return count.toString();
  }


  /**
   * zig-zag indexing of cells (see countCells for doc)
   */
  zigZagCellCount(currentRow, currentCol, numRows, numCols) {
    let cellCount = (currentRow + 1) + currentCol * numCols;

    if (currentCol % 2 !== 0) {
      cellCount = numCols * (currentCol + 1) - currentRow;
    }

    return cellCount;
  }

  /**
   * left-to-right indexing of cells (see countCells for doc)
   */
  leftRightCellCount(currentRow, currentCol, numRows, numCols) {
    return (currentRow + 1) + currentCol * numCols;
  }
}
