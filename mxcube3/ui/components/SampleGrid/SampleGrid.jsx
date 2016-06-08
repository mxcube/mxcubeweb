import ReactDOM from 'react-dom';
import React from 'react';
import SampleGridItem from './SampleGridItem';
import Isotope from 'isotope-layout';

import './SampleGrid.css';


export default class SampleGrid extends React.Component {

  constructor(props) {
    super(props);
    this.filter = this.filter.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
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
                        sortBy: 'seqId'
      };

      this.isotope = new Isotope(this.refs.container, options);
    }
  }

  _numberOfCols() {
    let [colArray, numRows, numCols] = [[], 0, 0];

    if (this.isotope.items.length > 0) {
      for (const idx in this.isotope.items){
        if(idx > 0) {
          if(this.isotope.items[idx].position.x == 0) {
            numRows++; 
            colArray.push(numCols);
            numCols = 0;
          }
        }

        numCols++;

       if(parseInt(idx) === (this.isotope.items.length - 1)){
         colArray.push(numCols);
       }

      }
    }

    return colArray;
  }


  _gridPosition(key) {
    let numCols = this._numberOfCols()[0];
    let pos = this.props.sampleOrder.get(key);

    let rowPos = Math.floor(pos/numCols)
    let colPos = pos - (rowPos * numCols)
    
    return {row:rowPos + 1, col:colPos + 1};
  }

 
  sortTest(event){
    let selectedItemKey, selected;

    for (const key in this.props.selected) {
      selected = this.props.selected[key];

      if (selected){
          selectedItemKey = key;
          break;
      }
    }

    this._numberOfCols();

    if (selectedItemKey){
      let numCols = this._numberOfCols()[0];
      let newPos = this.props.sampleOrder.get(selectedItemKey);

      if (event.key === 'ArrowRight'){ 
        newPos = newPos + 1;
      }
      else if(event.key === 'ArrowLeft'){
        newPos = newPos - 1;
      }
      else if(event.key === 'ArrowDown'){
        newPos = newPos + numCols;
      }
      else if(event.key === 'ArrowUp'){
        newPos = newPos - numCols;
      }
      else{
        return;
      }

      this.props.reorderSample(this.props.sampleOrder, selectedItemKey, newPos);
    }
  }


  onKeyDown(event){
    console.log(event);
    this.sortTest(event);
    this.isotope.reloadItems();
    this.isotope.layout();
    this.isotope.arrange({sortBy: 'seqId'});
  }

  componentDidUpdate(prevProps) {
    if (this.isotope) {
      if ((this.props.filter_text !== prevProps.filter_text) ||
          (this.props.samples_list !== prevProps.samples_list)) {
        this.isotope.reloadItems();
        this.isotope.layout();
      }
      this.isotope.arrange();
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
            ref={i} seqId={this.props.sampleOrder.get(key)} key={key} selectKey={key} 
            sample_id={sample.id} acronym={acronym} name={name} dm={sample.code} loadable={false} 
            location={sample.location} tags={tags} selected={this.props.selected[key]}
            deleteTask={this.props.deleteTask}
            showTaskParametersForm={this.props.showTaskParametersForm}
            onClick={this.props.toggleSelected}
          />
        );

        ++i;
      }
    });

    return (
      <div ref="container" className="samples-grid">
        {sampleGrid}
      </div>
    );
  }
}


SampleGrid.propTypes = {
  filter_text: React.PropTypes.string,
  toggleSelected: React.PropTypes.func.isRequired
};
