import React from 'react';
import Isotope from 'isotope-layout';

import { SampleGridItem, SAMPLE_ITEM_WIDTH, SAMPLE_ITEM_HEIGHT,
         SAMPLE_ITEM_SPACE } from './SampleGridItem';
import './SampleGrid.css';

export default class SampleGrid extends React.Component {

  constructor(props) {
    super(props);
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


  componentDidUpdate() {
    if (this.isotope) {
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
    const numItems = this.props.sampleOrder.size;
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
    const pos = this.props.sampleOrder.get(key);

    const rowPos = Math.floor(pos / numCols);
    const colPos = pos - (rowPos * numCols);

    return { row: rowPos, col: colPos, gridDimension: gridDim };
  }


  canMove(key) {
    let [up, down, left, right] = [true, true, true, true];
    const itemPos = this.itemGridPosition(key);

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

    return [up, down, left, right];
  }


  keysFromSeqId(start, end) {
    let [_start, _end] = [start, end];
    const keys = [];

    if (start > end) {
      [_start, _end] = [end, start];
    }

    for (const [key, value] of this.props.sampleOrder.entries()) {
      if (value >= _start && value <= _end) {
        keys.push(key);
      }
    }

    return keys;
  }


  dragStartSelection(key, seqId) {
    this._selectStartSeqId = seqId;
    this.props.selectRange(this.keysFromSeqId(this._selectStartSeqId, seqId));
  }


  dragSelectItem(key, seqId) {
    this.props.selectRange(this.keysFromSeqId(this._selectStartSeqId, seqId));
  }


  selectedItem() {
    let [selectedItemKey, selected] = ['', ''];

    for (const key in this.props.selected) {
      selected = this.props.selected[key];

      if (selected) {
        selectedItemKey = key;
        break;
      }
    }

    return selectedItemKey;
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
    let newPos = this.props.sampleOrder.get(selectedItemKey);
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

    this.props.reorderSample(this.props.sampleOrder, selectedItemKey, newPos);
  }


  toggleToBeCollected(itemKey) {
    let selectedItemKey = itemKey;

    if (!selectedItemKey) {
      selectedItemKey = this.selectedItem();
    }

    if (!selectedItemKey) {
      return;
    }

    this.props.toggleToBeCollected(selectedItemKey);
  }


  filter(key) {
    const sample = this.props.samples_list[key];
    let sampleFilter = `${sample.sampleName} ${sample.proteinAcronym} `;
    sampleFilter += `${sample.code} ${sample.location.toLowerCase()}`;

    return sampleFilter.includes(this.props.filter_text.toLowerCase());
  }


  render() {
    const samplesList = this.props.samples_list;
    let [sampleGrid, i] = [[], 0];

    Object.keys(samplesList).forEach(key => {
      if (this.filter(key)) {
        const sample = samplesList[key];
        const [acronym, name, tags] = [sample.proteinAcronym, sample.sampleName, []];

        for (const id in sample.tasks) {
          tags.push(sample.tasks[id]);
        }

        sampleGrid.push(
          <SampleGridItem
            ref={i} seqId={this.props.sampleOrder.get(key)} itemKey={key}
            sample_id={sample.id} acronym={acronym} name={name} dm={sample.code} loadable={false}
            location={sample.location} tags={tags} selected={this.props.selected[key]}
            deleteTask={this.props.deleteTask}
            showTaskParametersForm={this.props.showTaskParametersForm}
            onClick={this.props.toggleSelected}
            toggleMoveable={this.props.toggleMoveable}
            toBeCollected={this.props.samplesToBeCollected[key]}
            moving={this.props.moving[key]}
            moveItem={this.moveItem}
            canMove={this.canMove}
            toggleToBeCollected={this.props.toggleToBeCollected}
            dragStartSelection={this.dragStartSelection}
            dragSelectItem={this.dragSelectItem}
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


SampleGrid.propTypes = {
  filter_text: React.PropTypes.string,
  toggleActiveItem: React.PropTypes.func.isRequired
};
