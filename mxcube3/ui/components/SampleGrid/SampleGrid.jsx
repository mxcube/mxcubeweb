import React from 'react';
import Isotope from 'isotope-layout';
import { isEqual } from 'lodash/lang';
import { SampleGridItem, SAMPLE_ITEM_WIDTH, SAMPLE_ITEM_HEIGHT,
         SAMPLE_ITEM_SPACE } from './SampleGridItem';
import './SampleGrid.css';
import { QUEUE_STOPPED } from '../../constants';

export default class SampleGrid extends React.Component {

  constructor(props) {
    super(props);

    this._doReorder = false;
    this._nVisibleSamples = 0;
    this._prevNVisibleSamples = 0;
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
                        initLayout: false,
                        layoutMode: 'fitRows',
                        fitRows: {
                          width: SAMPLE_ITEM_WIDTH,
                          height: SAMPLE_ITEM_HEIGHT,
                          gutter: SAMPLE_ITEM_SPACE
                        }
      };

      this.isotope = new Isotope(this.refs.container, options);
    }
  }

  componentWillUpdate(nextProps) {
    if (!(isEqual(this.props.order, nextProps.order) &&
          (this.props.sampleList.length === nextProps.sampleList.length))) {
      this._doReorder = true;
    }
  }

  componentDidUpdate() {
    if (this._prevNVisibleSamples !== this._nVisibleSamples) {
      this.prevNVisibleSamples = this._nVisibleSamples;
      this._doReorder = true;
    }
    if (this.isotope && this._doReorder) {
      this.isotope.reloadItems();
      this.isotope.layout();
      this.isotope.arrange();
      this._doReorder = false;
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
    const pos = this.props.order.indexOf(key);

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


  dragStartSelection(key) {
    this._selectStartSeqId = key;
    this.props.select([key]);
  }


  dragSelectItem(key) {
    this.props.select([key]);
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


  moveItem(dir) {
    const selectedItemKey = this.selectedItem();

    if (!selectedItemKey) {
      return;
    }

    if (!this.props.moving[selectedItemKey]) {
      return;
    }

    const numCols = this.gridDimension()[0];
    const sourcePos = this.props.order.indexOf(selectedItemKey);
    let targetPos = sourcePos;
    const [canMoveUp, canMoveDown, canMoveLeft, canMoveRight] = this.canMove(selectedItemKey);

    if (dir === 'RIGHT' && canMoveRight) {
      targetPos = targetPos + 1;
    } else if (dir === 'LEFT' && canMoveLeft) {
      targetPos = targetPos - 1;
    } else if (dir === 'DOWN' && canMoveDown) {
      targetPos = targetPos + numCols;
    } else if (dir === 'UP' && canMoveUp) {
      targetPos = targetPos - numCols;
    } else {
      return;
    }

    const newSampleOrder = [...this.props.order];
    newSampleOrder.splice(targetPos, 0, newSampleOrder.splice(sourcePos, 1)[0]);
    this.props.setSampleOrder(newSampleOrder);
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
    let [sampleGrid, i] = [[], 0];
    const samplesList = this.props.sampleList;
    const orderedList = [];
    this.props.order.forEach(key => {
      const sampleID = samplesList[key].sampleID;
      if (this.props.queue.queue[sampleID]) {
        orderedList.push(key);
      }
    });

    this.props.order.forEach(key => {
      if (this.filter(key)) {
        const sample = samplesList[key];
        const [acronym, name, tags] = [sample.proteinAcronym, sample.sampleName, []];
        const picked = this.props.queue.queue[sample.sampleID];

        if (picked) {
          for (const task of this.props.queue.queue[sample.sampleID].tasks) {
            tags.push(task);
          }
        }

        const deleteTaskFun = this.props.queue.queueStatus === QUEUE_STOPPED ?
                              this.props.deleteTask : '';

        sampleGrid.push(
          <SampleGridItem
            key={i}
            ref={i}
            queueOrder={orderedList.indexOf(key) + 1}
            itemKey={key}
            sampleData={samplesList[sample.sampleID]}
            sampleID={sample.sampleID}
            acronym={acronym}
            name={name}
            dm={sample.code}
            loadable={sample.loadable}
            location={sample.location}
            tags={tags}
            selected={this.props.selected}
            current={this.props.queue.current.node === sample.sampleID}
            collected={false}
            deleteTask={deleteTaskFun}
            showTaskParametersForm={this.props.showTaskParametersForm}
            toggleMovable={this.props.toggleMovable}
            picked={picked}
            rootPath={this.props.queue.rootPath}
            displayData={this.props.queueGUI.displayData[sample.sampleID]}
            moving={this.props.moving[key]}
            moveItem={this.moveItem}
            canMove={this.canMove}
            pickSelected={this.props.pickSelected}
            pickSamples={this.props.pickSamples}
            dragStartSelection={this.dragStartSelection}
            dragSelectItem={this.dragSelectItem}
            toggleSelectedSample={this.props.toggleSelectedSample}
          />
        );

        ++i;
      }
    });

    this._nVisibleSamples = sampleGrid.length;

    return (
      <div ref="container" className="samples-grid" style={{ width: this.props.gridWidth }}>
        {sampleGrid}
      </div>
    );
  }
}
