import ReactDOM from 'react-dom'
import React from 'react'
import "./css/SampleGrid.css"
import { connect } from 'react-redux'
import { doUpdateSamples, doToggleSelected } from '../actions/samples_grid'
import SampleGridItem from './SampleGridItem'
import Isotope from 'isotope-layout'

class SampleGrid extends React.Component {
    propTypes: {
	samples_list: React.PropTypes.array.isRequired
    }

    componentDidMount() {
        if (! this.isotope) {
		let container = ReactDOM.findDOMNode(this);
		this.isotope = new Isotope(container, {itemSelector: '.samples-grid-item', layoutMode: 'masonry', masonry: { isFitWidth: true }});
	}
    }

    updateSamples(samples_list) {
        this.props.updateSamples(samples_list);
        if (this.isotope) { 
	    this.isotope.reloadItems();
	    this.isotope.layout();
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
            { samples_list.map((sample_info, index) => {
		      let exp_type = sample_info.experimentType || "";
		      let sc_loc = sample_info.containerSampleChangerLocation+":"+sample_info.sampleLocation
		      return <SampleGridItem key={index} ref={sample_info.sampleId} sample_id={sample_info.sampleId} acronym={sample_info.proteinAcronym} name={sample_info.sampleName} dm="HA1234567" location={sc_loc} tags={exp_type} selected={this.props.samples_list[index].selected} onClick={() => this.props.toggleSelected(index)}/>
	     })}
        </div>;
    }    
}

function mapStateToProps(state) {
        return state.samples_grid
}

function mapDispatchToProps(dispatch) {
	return {
	        updateSamples: (samples_list) => dispatch(doUpdateSamples(samples_list)),
                toggleSelected: (index) => dispatch(doToggleSelected(index))
	}
}

export default connect(
	mapStateToProps,
	mapDispatchToProps
)(SampleGrid);
