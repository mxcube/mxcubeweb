import ReactDOM from 'react-dom';
import React from 'react';
import Isotope from 'isotope-layout';

import { SampleGridItem, SAMPLE_ITEM_WIDTH, SAMPLE_ITEM_HEIGHT, SAMPLE_ITEM_SPACE } from './SampleGridItem';
import './SampleGrid.css';

export default class SampleGrid extends React.Component {

  constructor(props) {
    super(props);
    this.filter = this.filter.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.moveItem = this.moveItem.bind(this);
    this.canMove = this.canMove.bind(this);
  }


  componentDidMount() {
    document.addEventListener("keydown", this.onKeyDown, false);

    if (! this.isotope) {
      const container = ReactDOM.findDOMNode(this);
      const options = { itemSelector: '.samples-grid-item',
                        resize: false,
                        initLayout: false,
                        layoutMode: 'fitRows',
                        getSortData: {
                          name: '.protein-acronym',
                          seqId: function(itemElem) {
                            var seqId = itemElem.getElementsByClassName('seq-id')[0].innerHTML;
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


  gridDimension() {
    let colArray = [];
    let _numCols = {}

    const numItems = this.props.sampleOrder.size;
    const numFullCols = Math.floor(this.props.gridWidth / 190);
    const numFullRows = Math.floor(numItems / numFullCols);
    const itemsOnLastRow = numItems - (numFullRows * numFullCols);

    for(var i = 0; i < numFullRows; i++){
      colArray[i] = numFullCols;
    }

    if(itemsOnLastRow > 0) {
      colArray[numFullRows] = itemsOnLastRow;
    }

    return colArray;
  }


  itemGridPosition(key) {
    let gridDim = this.gridDimension();
    let numCols = gridDim[0];
    let pos = this.props.sampleOrder.get(key);

    let rowPos = Math.floor(pos/numCols);
    let colPos = pos - (rowPos * numCols);

    return {row:rowPos, col:colPos, gridDimension: gridDim};
  }


  canMove(key) {
    let [up, down, left, right] = [true, true, true, true]
    let itemPos = this.itemGridPosition(key);

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

    if (itemPos.col === (itemPos.gridDimension[itemPos.row] - 1 )) {
      right = false;
    }

    return [up, down, left, right];
  }


  moveItem(dir){
    let selectedItemKey, selected;

    for (const key in this.props.selected) {
      selected = this.props.selected[key];

      if (selected){
        selectedItemKey = key;
        break;
      }
    }

    if (!selectedItemKey) {
      return;
    }

    if (!this.props.moving[selectedItemKey]) {
      return;
    }

    let numCols = this.gridDimension()[0];
    let newPos = this.props.sampleOrder.get(selectedItemKey);
    let [canMoveUp, canMoveDown, canMoveLeft, canMoveRight] = this.canMove(selectedItemKey);

    if (dir === 'RIGHT' && canMoveRight){ 
      newPos = newPos + 1;
    }
    else if(dir === 'LEFT' && canMoveLeft){
      newPos = newPos - 1;
    }
    else if(dir === 'DOWN' && canMoveDown){
      newPos = newPos + numCols;
      //this.refs.container.scrollTop += 100; 
    }
    else if(dir === 'UP' && canMoveUp){
      newPos = newPos - numCols;
      //this.refs.container.scrollTop -= 100; 
    }
    else{
      return;
    }

    this.props.reorderSample(this.props.sampleOrder, selectedItemKey, newPos);
  }


  onKeyDown(event){
    if (event.key === 'ArrowRight'){ 
      this.moveItem('RIGHT');
    }
    else if(event.key === 'ArrowLeft'){
      this.moveItem('LEFT');
    }
    else if(event.key === 'ArrowDown'){
      this.moveItem('DOWN');
    }
    else if(event.key === 'ArrowUp'){
      this.moveItem('UP');
    }
    else if(event.key === ' '){
      //select sample
      return;
    }
    else{
      return;
    }
    
    this.props.reorderSample(this.props.sampleOrder, selectedItemKey, newPos);
  }

  componentDidUpdate(prevProps) {
    if (this.isotope) {
      this.isotope.reloadItems();
      this.isotope.layout();
      this.isotope.arrange({sortBy: 'seqId'});
    }
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
            ref={i} seqId={this.props.sampleOrder.get(key)} itemKey={key} selectKey={key} 
            sample_id={sample.id} acronym={acronym} name={name} dm={sample.code} loadable={false} 
            location={sample.location} tags={tags} selected={this.props.selected[key]}
            deleteTask={this.props.deleteTask}
            showTaskParametersForm={this.props.showTaskParametersForm}
            onClick={this.props.toggleSelected}
            toggleMoveable={this.props.toggleMoveable}
            moving={this.props.moving[key]}
            moveItem={this.moveItem}
            canMove={this.canMove}
          />
        );

        ++i;
      }
    });

    return (
      <div ref="container" className="samples-grid" style={{width:this.props.gridWidth, 'margin-left':'auto', 'margin-right':'auto'}}>
        {sampleGrid}
      </div>
    );
  }
}


SampleGrid.propTypes = {
  filter_text: React.PropTypes.string,
  toggleSelected: React.PropTypes.func.isRequired
};
