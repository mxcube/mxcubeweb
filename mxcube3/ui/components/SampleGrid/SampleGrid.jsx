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
        var samples_list = this.props.samples_list;
        var sample_grid = [];
        var i = 0;
        Object.keys(samples_list).forEach(key => {
                let sample = samples_list[key]; 
                let sample_info = sample.sample_info;
                let acronym = "?";
                let name = "unnamed";
                let exp_type = ""; 

                try {
                    acronym = sample_info.proteinAcronym;
                    name = sample_info.sampleName;
                    exp_type = sample_info.experimentType;
                } catch(e) { }

                sample_grid.push(<SampleGridItem ref={i} key={key} sample_id={sample.id} acronym={acronym} name={name} dm={sample.code} location={sample.location} tags={exp_type} selected={sample.selected} onClick={() => this.props.toggleSelected(key)}/>);
                ++i;
        });
        return (<div className='samples-grid col-xs-12'>
                    {sample_grid}
                </div>);

    }    
}
