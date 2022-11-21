import React from 'react';
import withRouter from '../components/WithRouter'
import { connect } from 'react-redux';
import { Col } from 'react-bootstrap';

import Collapsible from 'react-collapsible';

import { BsChevronUp, BsChevronDown} from "react-icons/bs";


import "react-contexify/dist/ReactContexify.css";

import {
  filterAction,
} from '../actions/sampleGrid';



class NewSampleFlexView extends React.Component {
  constructor(props) {
    super(props);

    this.renderCircle = this.renderCircle.bind(this);
    this.isCellSelected = this.isCellSelected.bind(this);

  }


  componentDidMount() {
    document.addEventListener('keydown', this.onKeyDown, false);

  }

  onClickCell(event, idx, disabled) {
    if (!disabled) {
    this.props.filter({cellFilter: `${idx+1}`});
  }
    event.stopPropagation()
  }

  isCellSelected(cell) {
    let isCellSelected = false;
    if (this.props.filterOptions.cellFilter === cell) {
      isCellSelected =  true;
    }
    return isCellSelected;
  }


  componentWillUnmount() {
  }

  renderCircle(nbCell , idx, isCellSelected) {

    const cellOrder= [8, 7, 6, 5, 4, 3, 2, 1];
    const percentage = (100 / nbCell) * cellOrder[idx];
    const circumference = 2 * Math.PI * 5; // 2*pi*rayon
    const strokeDash = (percentage * circumference) / 100;

    const angle = 2 * Math.PI* (strokeDash / circumference);

    const strokeDashArray = `${strokeDash} ${circumference}`;
    const rgbColorList= ['#e8ebee', '#cdced1', '#e8ebee', '#cdced1', '#e8ebee', '#cdced1', '#e8ebee', '#cdced1']

    const disableClasse =  this.props.cellSampleList(idx + 1)[0].length > 0 ?
      'has-sample' : 'empty-cell';

    const disabled =  this.props.cellSampleList(idx + 1)[0].length > 0 ?
    false : true;

    return (
      <g 
        className={`g-cell-cicle ${disableClasse}`}
        key={`circle-${idx}`}
        onClick={(e) => {this.onClickCell(e, idx, disabled) }}
        title="Sample #"
      >
        <circle
          r="5"
          cx="10" cy="10"
          key={`circle-${idx}`}
          id={`tpath${idx}`}
          className={disabled? 'cell-cicle-empty': 'cell-cicle'}
          stroke={isCellSelected ? '#6cb0f5' : rgbColorList[idx]}
          strokeWidth="10"
          strokeDasharray={strokeDashArray}
          transform="rotate(-90) translate(-20, 0)"
        >
          <title>
            {this.props.cellSampleList(idx + 1)[0].length > 0 ?
            `${this.props.cellSampleList(idx + 1)[0].length} Samples` : 'Empty'}
          </title>
        </circle>
        <g transform="rotate(-113) translate(-21.5, 0)">
          <text
            className='circle-text'
            x={8 + (Math.cos(angle) * 8) }
            y={5 + (Math.sin(angle) * 8) }
            fontSize="1"
            rotate="113"
          >
            {idx + 1}
            <title>
            {this.props.cellSampleList(idx + 1)[0].length > 0 ?
            `${this.props.cellSampleList(idx + 1)[0].length} Samples` : 'Empty'}
          </title>
          </text>
        </g>
      </g>
     )
  }

  getCollapsibleHeaderOpen(cssClass) {
    return (
      <div className='sample-items-collapsible-header'>
        <b>
            Cell
            <span className='ms-2 me-2'>
              {this.props.filterOptions.cellFilter}
            </span>
            Selected
          </b>
        <BsChevronUp className={cssClass} size="1em"/>
      </div>
    )
  }

  getCollapsibleHeaderClose(cssClass) {
    return (
      <div className='sample-items-collapsible-header'>
        <b>Cell
          <span className='ms-2 me-2'>
            {this.props.filterOptions.cellFilter}
          </span>
          Selected
        </b>
        <BsChevronDown className={cssClass} size="1em"/>
      </div>
    )
  }

  render() {
    // this is specific to 8 cells Baskets
    const scContent = [1, 2, 3, 4, 5, 6, 7, 8]
    return (
      <Col sm>
        <div  className='div-flex-pie-collapsible'>
          <Collapsible transitionTime={200}
            open
            trigger={this.getCollapsibleHeaderClose('collapsible-arrow-c')}
            triggerWhenOpen={this.getCollapsibleHeaderOpen('collapsible-arrow-c')}
          >
            <div className='div-svg-flex ps-4 pt-2 pb-2'>    
              <svg className='svg-flex' height="97%" width="97%" viewBox="0 0 20 20">
                <circle className='main-cicle-center' r="10" cx="10" cy="10" />
                {scContent.map((cell, idx) => { 
                  return (
                    this.renderCircle(scContent.length, idx, this.isCellSelected(cell))
                  )
                })}
                <circle className='cell-cicle-center' r="5" cx="10" cy="10" />
                <text x='10' y='10' fontSize="1" textAnchor="middle" fill="gray">Sample Changer</text>
              </svg>
            </div>
          </Collapsible>
        </div>
      </Col>
    );
  }
}

function mapStateToProps(state) {
  return {
    queue: state.queue,
    selected: state.sampleGrid.selected,
    sampleList: state.sampleGrid.sampleList,
    filterOptions: state.sampleGrid.filterOptions,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    filter: (filterOptions) => dispatch(filterAction(filterOptions)),
  };
}

NewSampleFlexView = withRouter(NewSampleFlexView);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(NewSampleFlexView);