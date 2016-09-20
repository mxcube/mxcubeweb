import React from 'react';
import Isotope from 'isotope-layout';

import { SampleGridItem, SAMPLE_ITEM_WIDTH, SAMPLE_ITEM_HEIGHT,
         SAMPLE_ITEM_SPACE } from './SampleGridItem';
import './SampleGrid.css';

export default class SampleGrid extends React.Component {

  constructor(props) {
    super(props);
    this._doReorder = false;
    this._selectStartSeqId = -1;
    this.filter = this.filter.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.moveItem = this.moveItem.bind(this);
    this.canMove = this.canMove.bind(this);
    this.dragStartSelection = this.dragStartSelection.bind(this);
    this.dragSelectItem = this.dragSelectItem.bind(this);
  }


  componentDidMount() {
    document.addEventListener('keydown', this.onKeyDown, false);

    if (! this.isotope) {
      const options = { itemSelector: '.samples-grid-item',
                        resize: false,
                        initLayout: false,
                        layoutMode: 'fitRows',
                        getSortData: {
                          name: '.protein-acronym',
                          seqId: (itemElem) => {
                            const seqId = itemElem.getElementsByClassName('seq-id')[0].innerHTML;
                            return parseFloat(seqId);
                          }
                        },
                        fitRows: {
                          width: SAMPLE_ITEM_WIDTH,
                          height: SAMPLE_ITEM_HEIGHT,
                          gutter: SAMPLE_ITEM_SPACE
                        },
                        sortBy: 'seqId'
      };

      this.isotope = new Isotope(this.refs.container, options);
    }
  }


  shouldComponentUpdate(nextProps) {
    this._doReorder = false;

    if (this.props.order !== nextProps.order || this.props.sampleList !== nextProps.sampleList) {
      this._doReorder = true;
    }

    return true;
  }


  componentDidUpdate() {
    if (this.isotope && this._doReorder) {
      this.isotope.reloadItems();
      this.isotope.layout();
      this.isotope.arrange({ sortBy: 'seqId' });
    }
  }


  onKeyDown(event) {
    if (event.key === 'ArrowRight') {
      this.moveItem('RIGHT');
    } else if (event.key === 'ArrowLeft') {
      this.moveItem('LEFT');
    } else if (event.key === 'ArrowDown') {
      this.moveItem('DOWN');
    } else if (event.key === 'ArrowUp') {
      this.moveItem('UP');
    } else if (event.key === 'p') {
      this.props.pickSelected();
    }
  }


  gridDimension() {
    const colArray = [];
    const numItems = Object.keys(this.props.order).length;
    const numFullCols = Math.floor(this.props.gridWidth / 190);
    const numFullRows = Math.floor(numItems / numFullCols);
    const itemsOnLastRow = numItems - (numFullRows * numFullCols);

    for (let i = 0; i < numFullRows; i++) {
      colArray[i] = numFullCols;
    }

    if (itemsOnLastRow > 0) {
      colArray[numFullRows] = itemsOnLastRow;
    }

    return colArray;
  }


  itemGridPosition(key) {
    const gridDim = this.gridDimension();
    const numCols = gridDim[0];
    const pos = this.props.order[key];

    const rowPos = Math.floor(pos / numCols);
    const colPos = pos - (rowPos * numCols);

    return { row: rowPos, col: colPos, gridDimension: gridDim };
  }


  canMove(key) {
    let [up, down, left, right] = [true, true, true, true];
    const itemPos = this.itemGridPosition(key);

    if (Object.keys(this.props.selected).map(_key => this.props.selected[_key]).length === 1) {
      if (itemPos.col === 0) {
        left = false;
      }

      if (itemPos.row === 0) {
        up = false;
      }

      if (itemPos.row === (itemPos.gridDimension.length - 1)) {
        down = false;
      }

      if (itemPos.col > (itemPos.gridDimension[itemPos.row + 1] - 1)) {
        down = false;
      }

      if (itemPos.col === (itemPos.gridDimension[itemPos.row] - 1)) {
        right = false;
      }
    } else {
      [up, down, left, right] = [false, false, false, false];
    }

    return [up, down, left, right];
  }


  keysFromSeqId(start, end) {
    let [_start, _end] = [start, end];
    const keys = [];

    if (start > end) {
      [_start, _end] = [end, start];
    }

    for (const [key, value] of Object.entries(this.props.order)) {
      if (value >= _start && value <= _end) {
        keys.push(key);
      }
    }

    return keys;
  }


  dragStartSelection(key, seqId) {
    this._selectStartSeqId = seqId;
    this.props.select(this.keysFromSeqId(this._selectStartSeqId, seqId));
  }


  dragSelectItem(key, seqId) {
    this.props.select(this.keysFromSeqId(this._selectStartSeqId, seqId));
  }


  selectedItem() {
    let selectedItemKey = '';

    for (const key in this.props.selected) {
      if (this.props.selected[key]) {
        selectedItemKey = key;
        break;
      }
    }

    return selectedItemKey;
  }


  sortSample(order, key, targetPos) {
    const newSampleOrder = Object.assign({}, order);
    const sourcePos = order[key];

    // Shift samples between the old and new position one step
    for (const [_key, _pos] of Object.entries(order)) {
      if (sourcePos < targetPos) {
        if ((sourcePos < _pos) && (_pos <= targetPos)) {
          newSampleOrder[_key] = _pos - 1;
        }
      } else if (sourcePos > targetPos) {
        if ((sourcePos > _pos) && (_pos >= targetPos)) {
          newSampleOrder[_key] = _pos + 1;
        }
      }
    }

    newSampleOrder[key] = targetPos;
    this.props.setSampleOrder(newSampleOrder);
  }


  moveItem(dir) {
    const selectedItemKey = this.selectedItem();

    if (!selectedItemKey) {
      return;
    }

    if (!this.props.moving[selectedItemKey]) {
      return;
    }

    const numCols = this.gridDimension()[0];
    let newPos = this.props.order[selectedItemKey];
    const [canMoveUp, canMoveDown, canMoveLeft, canMoveRight] = this.canMove(selectedItemKey);

    if (dir === 'RIGHT' && canMoveRight) {
      newPos = newPos + 1;
    } else if (dir === 'LEFT' && canMoveLeft) {
      newPos = newPos - 1;
    } else if (dir === 'DOWN' && canMoveDown) {
      newPos = newPos + numCols;
    } else if (dir === 'UP' && canMoveUp) {
      newPos = newPos - numCols;
    } else {
      return;
    }

    this.sortSample(this.props.order, selectedItemKey, newPos);
  }


  filter(key) {
    const sample = this.props.sampleList[key];
    let sampleFilter = `${sample.sampleName} ${sample.proteinAcronym} `;
    sampleFilter += `${sample.code} ${sample.location.toLowerCase()}`;

    let filterItem = sampleFilter.includes(this.props.filterText.toLowerCase());

    if (this.props.filterText.includes('is:picked')) {
      filterItem = this.props.picked[key];
    }

    return filterItem;
  }


  render() {
    const samplesList = this.props.sampleList;
    let [sampleGrid, i] = [[], 0];

    Object.keys(samplesList).forEach(key => {
      if (this.filter(key)) {
        const sample = samplesList[key];
        const [acronym, name, tags] = [sample.proteinAcronym, sample.sampleName, []];

        if (this.props.queue.queue[sample.sampleID]) {
          for (const task of this.props.queue.queue[sample.sampleID].tasks) {
            tags.push(task);
          }
        }

        sampleGrid.push(
          <SampleGridItem
            ref={i}
            seqId={this.props.order[key]}
            itemKey={key}
            sampleID={sample.sampleID}
            acronym={acronym}
            name={name}
            dm={sample.code}
            loadable={false}
            location={sample.location}
            queueOrder={sample.queueOrder}
            tags={tags}
            selected={this.props.selected}
            deleteTask={this.props.deleteTask}
            showTaskParametersForm={this.props.showTaskParametersForm}
            toggleMovable={this.props.toggleMovable}
            picked={this.props.queue.queue[sample.sampleID]}
            moving={this.props.moving[key]}
            moveItem={this.moveItem}
            canMove={this.canMove}
            pickSelected={this.props.pickSelected}
            pickSamples={this.props.pickSamples}
            dragStartSelection={this.dragStartSelection}
            dragSelectItem={this.dragSelectItem}
            toggleSelectedSample={this.props.toggleSelectedSample}
            showSampleGridContextMenu={this.props.showSampleGridContextMenu}
          />
        );

        ++i;
      }
    });

    return (
      <div ref="container" className="samples-grid" style={{ width: this.props.gridWidth }}>
        {sampleGrid}
      </div>
    );
  }
}
