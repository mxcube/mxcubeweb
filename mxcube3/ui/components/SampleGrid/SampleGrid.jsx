import ReactDOM from 'react-dom'
import React from 'react'
import "./SampleGrid.css"
import SampleGridItem from './SampleGridItem'
import Isotope from 'isotope-layout'

export default class SampleGrid extends React.Component {
    propTypes: {
	samples_list: React.PropTypes.array.isRequired,
        toggleSelected: React.PropTypes.func.isRequired,
        filter_text: React.PropTypes.string 
    }

    componentDidMount() {
        if (! this.isotope) {
            let container = ReactDOM.findDOMNode(this);
            this.isotope = new Isotope(container, {itemSelector: '.samples-grid-item', layoutMode: 'masonry', masonry: { isFitWidth: true }, filter: (elem) => { return this._filter(elem) }});
	}
    }

    _filter(elem) {
        if (this.props.filter_text) {
          return false;
        } else {
          return true;
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.isotope) {
          if (this.props.samples_list != prevProps.samples_list) { 
	    this.isotope.reloadItems();
	    this.isotope.layout();
	  }
	  this.isotope.arrange(); 
        }
    }

    addTag(index, tag) {
    }

    setLoadable(index, loadable) {
    }

    render() {
        let samples_list = this.props.samples_list;
        return <div className='samples-grid'>
            { samples_list.map((sample, index) => {
		      let exp_type = sample.experimentType || "";
		      let sc_loc = sample.location;
		      return <SampleGridItem key={index} sample_id={sample.id} acronym={sample.proteinAcronym} name={sample.sampleName} dm="HA1234567" location={sc_loc} tags={exp_type} selected={this.props.samples_list[index].selected} onClick={() => this.props.toggleSelected(index)}/>
	     })}
        </div>;
    }    
}
