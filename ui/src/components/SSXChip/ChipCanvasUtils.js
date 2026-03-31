import 'fabric';

import { showContextMenu } from './ChipContextMenu';

const { fabric } = globalThis;

export function renderChip(
  chipSizeX,
  chipSizeY,
  rows,
  cols,
  blockSizeX,
  blockSizeY,
  spacing,
  offset,
  rowLabels = [],
  colLabels = [],
) {
  const objects = [];

  objects.push(
    new fabric.Rect({
      top: 0,
      left: 0,
      width: chipSizeX,
      height: chipSizeY,
      selectable: false,
      hasControls: false,
      borderColor: '#fff',
      lockMovementX: true,
      lockMovementY: true,
      lockScalingX: true,
      lockScalingY: true,
      lockSkewingX: true,
      lockSkewingY: true,
      lockRotation: true,
      hoverCursor: 'arrow',
      type: 'CHIP',
      objectIndex: [],
    }),
  );

  // Add labels

  for (let ci = 0; ci < cols; ci++) {
    let label = (ci + 1).toString();

    if (colLabels.length > 0) {
      label = colLabels[ci];
    }

    objects.push(
      new fabric.Text(label, {
        top: offset / 2,
        left:
          ci * (blockSizeX + spacing) + offset + blockSizeX + blockSizeX / 4,
        fontSize: blockSizeX * 0.7,
        fontFamily: 'arial',
        fill: '#f55',
        objectCaching: false,
        selectable: false,
        hasControls: false,
        borderColor: '#fff',
        lockMovementX: true,
        lockMovementY: true,
        lockScalingX: true,
        lockScalingY: true,
        lockSkewingX: true,
        lockSkewingY: true,
        lockRotation: true,
        hoverCursor: 'pointer',
        type: 'BLOCK',
      }),
    );
  }

  for (let ri = 0; ri < rows; ri++) {
    let label = (ri + 1).toString();

    if (colLabels.length > 0) {
      label = rowLabels[ri];
    }

    objects.push(
      new fabric.Text(label, {
        top: ri * (blockSizeY + spacing) + offset + blockSizeY,
        left: offset / 2,
        fontSize: blockSizeX * 0.7,
        fontFamily: 'arial',
        fill: '#f55',
        objectCaching: false,
        selectable: false,
        hasControls: false,
        borderColor: '#fff',
        lockMovementX: true,
        lockMovementY: true,
        lockScalingX: true,
        lockScalingY: true,
        lockSkewingX: true,
        lockSkewingY: true,
        lockRotation: true,
        hoverCursor: 'pointer',
        type: 'BLOCK',
      }),
    );
  }

  for (let ri = 0; ri < rows; ri++) {
    for (let ci = 0; ci < cols; ci++) {
      objects.push(
        new fabric.Rect({
          top: ri * (blockSizeY + spacing) + offset + blockSizeY,
          left: ci * (blockSizeX + spacing) + offset + blockSizeX,
          width: blockSizeX,
          height: blockSizeY,
          fontFamily: 'arial',
          fill: '#f55',
          objectCaching: false,
          hasControls: false,
          borderColor: '#fff',
          lockMovementX: true,
          lockMovementY: true,
          lockScalingX: true,
          lockScalingY: true,
          lockSkewingX: true,
          lockSkewingY: true,
          lockRotation: true,
          hoverCursor: 'pointer',
          type: 'BLOCK',
          objectIndex: [ri, ci],
        }),
      );
    }
  }

  return objects;
}

export function initChipCanvas(currentChipLayout) {
  const [chipConfig] = currentChipLayout.sections;

  const numRows = chipConfig.number_of_rows;
  const numCols = chipConfig.number_of_collumns;
  const [blockSizeX] = chipConfig.block_size;
  const [blockSizeY] = chipConfig.block_size;
  const rowLabels = chipConfig.row_labels;
  const colLabels = chipConfig.column_lables;

  const [offset] = chipConfig.block_spacing;
  const [spacing] = chipConfig.block_spacing;

  const [numTargetsX] = chipConfig.targets_per_block;
  const [numTargetsY] = chipConfig.targets_per_block;

  const canvasWidth = numCols * (blockSizeX + spacing) + offset + blockSizeX;
  const canvasHeight = numRows * (blockSizeY + spacing) + offset + blockSizeY;

  const chipCanvas = new fabric.Canvas('chip-canvas', {
    width: canvasWidth,
    height: canvasHeight,
    backgroundColor: '#CCC',
    preserveObjectStacking: true,
    altSelectionKey: 'ctrlKey',
    selectionKey: 'ctrlKey',
    fireRightClick: true,
    stopContextMenu: true,
    renderOnAddRemove: false,
  });

  const detailCanvas = new fabric.Canvas('chip-detail-canvas', {
    width: canvasWidth,
    height: canvasHeight,
    backgroundColor: '#CCC',
    preserveObjectStacking: true,
    altSelectionKey: 'ctrlKey',
    selectionKey: 'ctrlKey',
    fireRightClick: true,
    stopContextMenu: true,
    renderOnAddRemove: false,
  });

  chipCanvas.on('mouse:down', (event) => {
    const object = chipCanvas.findTarget(event.e);

    if (event.button === 3) {
      let selection = [];

      if (object.type === 'BLOCK') {
        selection.push(object.objectIndex);
      }

      if (object.type === 'activeSelection') {
        selection = object._objects.map((o) => o.objectIndex);
      }

      if (selection.length > 0) {
        chipCanvas.setActiveObject(object);
        chipCanvas.requestRenderAll();
        showContextMenu(event, selection);
      }
    }
  });

  chipCanvas.on('selection:created', () => {
    if (chipCanvas.getActiveObject()) {
      chipCanvas.getActiveObject().lockMovementY = true;
      chipCanvas.getActiveObject().lockMovementX = true;
    }
  });

  chipCanvas.on('selection:updated', () => {
    if (chipCanvas.getActiveObject()) {
      chipCanvas.getActiveObject().lockMovementY = true;
      chipCanvas.getActiveObject().lockMovementX = true;
    }
  });

  chipCanvas.add(
    ...renderChip(
      canvasWidth,
      canvasHeight,
      numRows,
      numCols,
      blockSizeX,
      blockSizeY,
      spacing,
      offset,
      rowLabels,
      colLabels,
    ),
  );

  chipCanvas.requestRenderAll();

  detailCanvas.add(
    ...renderChip(
      canvasWidth,
      canvasHeight,
      numTargetsX,
      numTargetsX,
      canvasWidth / numTargetsX - (spacing / numTargetsX) * 4,
      canvasHeight / numTargetsY - (spacing / numTargetsY) * 4,
      spacing / numTargetsX,
      offset,
    ),
  );
  detailCanvas.renderAll();

  return [chipCanvas, detailCanvas];
}

export function initFoilCanvas(gridList) {
  const freeFormCanvas = new fabric.Canvas('chip-free-form-canvas', {
    width: 300,
    height: 300,
    backgroundColor: '#CCC',
    preserveObjectStacking: true,
    altSelectionKey: 'ctrlKey',
    selectionKey: 'ctrlKey',
    fireRightClick: true,
    stopContextMenu: true,
    renderOnAddRemove: false,
  });

  freeFormCanvas.on('mouse:down', (event) => {
    const pointer = freeFormCanvas.getPointer(event.e);

    if (!event.e.altKey) {
      return;
    }
    freeFormCanvas.discardActiveObject();

    const rect = new fabric.Rect({
      left: pointer.x,
      top: pointer.y,
      originX: 'left',
      originY: 'top',
      width: 0,
      height: 0,
      angle: 0,
      fill: 'rgba(255,0,0,0.5)',
      transparentCorners: false,
    });

    freeFormCanvas.add(rect);
    freeFormCanvas.setActiveObject(rect);
    freeFormCanvas.renderAll();
  });

  freeFormCanvas.on('mouse:move', (event) => {
    if (!event.e.altKey) {
      return;
    }

    const mouse = freeFormCanvas.getPointer(event);
    const rect = freeFormCanvas.getActiveObject();

    const w = Math.abs(mouse.x - rect.left);
    const h = Math.abs(mouse.y - rect.top);

    if (!w || !h) {
      return;
    }

    rect.set('width', w).set('height', h);

    freeFormCanvas.renderAll();
  });

  gridList.forEach((gridData) => {
    freeFormCanvas.add(
      new fabric.Rect({
        left: gridData.screenCoord[1],
        top: gridData.screenCoord[0],
        originX: 'left',
        originY: 'top',
        width: gridData.width,
        height: gridData.height,
        angle: 0,
        fill: 'rgba(255,0,0,0.5)',
        transparentCorners: false,
      }),
    );
  });

  freeFormCanvas.renderAll();

  return freeFormCanvas;
}
