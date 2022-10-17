import React from 'react';
import { Menu, Item, Separator, contextMenu } from 'react-contexify';
import 'fabric';
import './ssxchipcontrol.css';
import "react-contexify/dist/ReactContexify.css";

const { fabric } = window;

function _GridData(fabricObject) {
  return {
    screenCoord: [fabricObject.top, fabricObject.left],
    top: fabricObject.top,
    left: fabricObject.left,
    width: fabricObject.width,
    height: fabricObject.height,
    cellWidth: fabricObject.width,
    cellHeight: fabricObject.height,
    cellVSpace: 0,
    cellHSpace: 0,
    numCols: 1,
    numRows: 1,
    cellCountFun: null,
    selected: false,
    id: null,
    result: null,
    pixelsPerMMX: 1,
    pixelsPerMMY: 1,
  };
}

function ChipContextMenu(props) {
  return (
    <Menu  id="chip-context-menu">
      <li role="heading" aria-level="2" className="dropdown-header">
        <b>
          Chip
        </b>
      </li>
      <Separator />
      <Item
        id="moveto"
        data={{}}
        onClick={props.onMoveTo}
      >
        Move to
      </Item>
      <Item
        id="addtask"
        data={{}}
        onClick={props.onAddTask}
      >
        Add to queue
      </Item>
    </Menu>
  );
}

export default class SSXChip extends React.Component {
  constructor(props) {
    super(props);
    this.canvasRef = React.createRef();
    this.detailCanvasRef = React.createRef();
    this.freeFormCanvasRef = React.createRef();
    this.fc = null;
    this.detailCanvas = null;
    this.freeFormCanvas = null;
    this.handleKeyDown = this.handleKeyDown.bind(this);

    // Fix
    this.rect = null;
    this.isDown = false;
    this.origX = 0;
    this.origY = 0;
  }

  handleKeyDown(event) {
    if ([8, 46].includes(event.which)) {
      this.freeFormCanvas.remove(this.freeFormCanvas.getActiveObject())
      this.freeFormCanvas.renderAll();
    }

    return false;
  }

  showContextMenu(event, selection) {
    contextMenu.show({
      id: "chip-context-menu",
      event: event.e,
      position: {
        x: event.e.offsetX + 15,
        y: event.e.offsetY + 55,
      },
      props: {
        selection
      },
    });
  }

  renderChip(
    chipSizeX,
    chipSizeY,
    rows,
    cols,
    blockSizeX,
    blockSizeY,
    spacing,
    offset,
    rowLabels=[],
    colLabels=[],
  ) {
    const objects = [];

    objects.push(
      new fabric.Rect({
        top: 0,
        left: 0 ,
        width: chipSizeX,
        height: chipSizeY,
        selectable: false,
        hasControls: false,
        borderColor: "#fff",
        lockMovementX: true,
        lockMovementY: true,
        lockScalingX: true,
        lockScalingY: true,
        lockSkewingX: true,
        lockSkewingY: true,
        lockRotation: true,
        hoverCursor: "arrow",
        type: "CHIP",
        objectIndex: []
      })
    );

    // Add lables

    for(let ci=0; ci < cols; ci++) {
      let label = (ci + 1).toString();

      if (colLabels.length > 0) {
        label = colLabels[ci];
      }

      objects.push(
        new fabric.Text(label,{
          top: offset / 2,
          left: (ci*(blockSizeX+spacing)) + offset + blockSizeX + blockSizeX/4,
          fontSize: blockSizeX * 0.7,
          fontFamily: "arial",
          fill: '#f55',
          objectCaching: false,
          selectable: false,
          hasControls: false,
          borderColor: "#fff",
          lockMovementX: true,
          lockMovementY: true,
          lockScalingX: true,
          lockScalingY: true,
          lockSkewingX: true,
          lockSkewingY: true,
          lockRotation: true,
          hoverCursor: "pointer",
          type: "BLOCK",
        })
      );
    }

    for (let ri=0; ri < rows; ri++) {
      let label = (ri + 1).toString();

      if (colLabels.length > 0) {
        label = rowLabels[ri];
      }

      objects.push(
        new fabric.Text(label,{
          top: ri*(blockSizeY+spacing) + offset + blockSizeY,
          left: offset / 2,
          fontSize: blockSizeX * 0.7,
          fontFamily: "arial",
          fill: '#f55',
          objectCaching: false,
          selectable: false,
          hasControls: false,
          borderColor: "#fff",
          lockMovementX: true,
          lockMovementY: true,
          lockScalingX: true,
          lockScalingY: true,
          lockSkewingX: true,
          lockSkewingY: true,
          lockRotation: true,
          hoverCursor: "pointer",
          type: "BLOCK",
        })
      );
    }

    for (let ri=0; ri < rows; ri++) {
      for(let ci=0; ci < cols; ci++) {
        objects.push(
          new fabric.Rect({
            top: ri*(blockSizeY+spacing) + offset + blockSizeY,
            left: (ci*(blockSizeX+spacing)) + offset + blockSizeX,
            width: blockSizeX,
            height: blockSizeY,
            fontFamily: "arial",
            fill: '#f55',
            objectCaching: false,
            hasControls: false,
            borderColor: "#fff",
            lockMovementX: true,
            lockMovementY: true,
            lockScalingX: true,
            lockScalingY: true,
            lockSkewingX: true,
            lockSkewingY: true,
            lockRotation: true,
            hoverCursor: "pointer",
            type: "BLOCK",
            objectIndex: [ri, ci]
          })
        );
      }
    }

    return objects;
  }

  componentWillUnmount() {
    document.removeEventListener("keydown", this.handleKeyDown);
  }

  componentDidMount() {
    document.addEventListener("keydown", this.handleKeyDown);
    const chipConfig = this.props.headConfiguration.sections[0]
    const numRows = chipConfig.number_of_rows;
    const numCols = chipConfig.number_of_collumns;
    const blockSizeX = chipConfig.block_size[0];
    const blockSizeY = chipConfig.block_size[0];
    const rowLabels = chipConfig.row_labels;
    const colLabels = chipConfig.column_lables;

    const offset = chipConfig.block_spacing[0];
    const spacing = chipConfig.block_spacing[0];

    const numTargetsX  = chipConfig.targets_per_block[0];
    const numTargetsY = chipConfig.targets_per_block[1];

    const canvasWidth = numCols * (blockSizeX + spacing) + offset + blockSizeX;
    const canvasHeight = numRows * (blockSizeY + spacing) + offset + blockSizeY;

    const canvas = new fabric.Canvas('chip-canvas', {
      width: canvasWidth,
      height: canvasHeight,
      backgroundColor: "#CCC",
      preserveObjectStacking: true,
      altSelectionKey: "ctrlKey",
      selectionKey: 'ctrlKey',
      fireRightClick: true,
      stopContextMenu: true,
      renderOnAddRemove: false,
    });

    const detailCanvas = new fabric.Canvas('chip-detail-canvas', {
      width: canvasWidth,
      height: canvasHeight,
      backgroundColor: "#CCC",
      preserveObjectStacking: true,
      altSelectionKey: "ctrlKey",
      selectionKey: 'ctrlKey',
      fireRightClick: true,
      stopContextMenu: true,
      renderOnAddRemove: false,
    });

    const freeFormCanvas = new fabric.Canvas('chip-free-form-canvas', {
      width: canvasWidth,
      height: canvasHeight,
      backgroundColor: "#CCC",
      preserveObjectStacking: true,
      altSelectionKey: "ctrlKey",
      selectionKey: 'ctrlKey',
      fireRightClick: true,
      stopContextMenu: true,
      renderOnAddRemove: false,
    });

    this.fc = canvas;
    this.detailCanvas = detailCanvas
    this.freeFormCanvas = freeFormCanvas

    this.fc.on('mouse:down', (event) => {
      const object = canvas.findTarget(event.e);

      if(event.button === 3) {
          let selection = [];

          if (object.type === "BLOCK") {
            selection.push([object.objectIndex]);
          }

          if (object.type === "activeSelection") {
            selection = object._objects.map((o) => o.objectIndex);
          }

          if (selection.length > 0) {
            this.fc.setActiveObject(object);
            this.fc.requestRenderAll();
            this.showContextMenu(event, selection);
          }
      }
    });

    this.fc.on('selection:created', ({ selected, target }) => {
      if (selected.some(obj => obj.lockMovementX)) {
        target.lockMovementX = true;
      }
        if (selected.some(obj => obj.lockMovementY)) {
        target.lockMovementY = true;
      }
    });

    this.fc.on('selection:updated', ({ selected, target }) => {
      if (selected.some(obj => obj.lockMovementX)) {
        target.lockMovementX = true;
      }
        if (selected.some(obj => obj.lockMovementY)) {
        target.lockMovementY = true;
      }
    });

//    this.fc.on('mouse:dblclick', (event) => {
//      const object = canvas.findTarget(event.e);
//    });

    this.fc.add(...this.renderChip(
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
    ));

    this.fc.requestRenderAll();

    this.detailCanvas.add(...this.renderChip(
      canvasWidth,
      canvasHeight,
      numTargetsX,
      numTargetsX,
      (canvasWidth / numTargetsX) - (spacing / numTargetsX)*4,
      (canvasHeight / numTargetsY) - (spacing / numTargetsY)*4,
      spacing / numTargetsX,
      offset
    ));
    this.detailCanvas.renderAll();

    this.freeFormCanvas.on('mouse:down', (event) => {
      const pointer = this.freeFormCanvas.getPointer(event.e);

      if (!event.e.altKey) { return };
      this.freeFormCanvas.discardActiveObject();

      this.isDown = true;

      console.log(pointer);
      this.rect = new fabric.Rect({
          left: pointer.x,
          top: pointer.y,
          originX: 'left',
          originY: 'top',
          width: 0,
          height: 0,
          angle: 0,
          fill: 'rgba(255,0,0,0.5)',
          transparentCorners: false
      });


      this.freeFormCanvas.add(this.rect);
      this.freeFormCanvas.setActiveObject(this.rect);
      this.freeFormCanvas.renderAll();
    });

    this.freeFormCanvas.on('mouse:move', (event) => {
      if (!this.isDown && !event.e.altKey) return;

      const mouse = this.freeFormCanvas.getPointer(event);
      const rect = this.freeFormCanvas.getActiveObject(); 

      const w = Math.abs(mouse.x - rect.left);
      const h = Math.abs(mouse.y - rect.top);
  
      if (!w || !h) {
          return;
      }

      rect.set('width', w).set('height', h);

      console.log(rect);

      this.freeFormCanvas.renderAll();
    });

    this.freeFormCanvas.on('mouse:up', (evnt) => {
      if (this.isDown) {
        this.isDown = false;
        this.props.onAddGrid(_GridData(this.freeFormCanvas.getActiveObject()));
        this.freeFormCanvas.discardActiveObject();
        this.freeFormCanvas.renderAll();
      }
    });

    this.props.gridList.map((gridData)=>{
      this.freeFormCanvas.add(
        new fabric.Rect({
          left: gridData.screenCoord[1],
          top: gridData.screenCoord[0],
          originX: 'left',
          originY: 'top',
          width: gridData.width,
          height: gridData.height,
          angle: 0,
          fill: 'rgba(255,0,0,0.5)',
          transparentCorners: false
      })
      )
    })

    this.freeFormCanvas.renderAll();
  }

  render() { 
    return (
      <div className="chip-container">
        <div className="chip-canvas-container">
          <canvas
            id="chip-canvas" 
            ref={this.canvasRef}
          />
          <ChipContextMenu {...this.props}/>
        </div>
        <div className="chip-detial-canvas-container">
          <canvas
            id="chip-detail-canvas"
            ref={this.detailCanvasRef}
          />
        </div>
        <div className="chip-free-form-canvas-container">
          <canvas
            id="chip-free-form-canvas"
            ref={this.freeFormCanvasRef}
          />
        </div>
    </div>
    );
  }
}
