import React from 'react'
import ReactDOM from 'react-dom'
import { connect } from 'react-redux'
import SampleGrid from '../components/SampleGrid/SampleGrid'
import { Input, Button, Glyphicon, ButtonToolbar  } from "react-bootstrap"
import { doGetSamplesList, doUpdateSamples, doToggleSelected, doSelectAll, doFilter } from '../actions/samples_grid'
import { sendSample } from '../actions/queue'

class SampleGridContainer extends React.Component {
        addSamples() {

            // Loop through all samples, check which was selected and add to the queue. 
            Object.keys(this.props.samples_list).forEach(function (key) {

                if (this.props.samples_list[key].selected){
                  this.props.addSampleToQueue(key);
                }
               
            }.bind(this));
        }

	render() {
		const innerSearchIcon = (
			<Button onClick={() => { this.props.filter(this.refs.filter_input.getValue()) } }><Glyphicon glyph="search"/></Button>
		);

		return (<div>
                            <div className="row">
                                <div className="col-xs-5">
			            <form className="form-horizontal">
				        <Input type="text" ref="filter_input" defaultValue={this.props.filter_text} label="Filter" labelClassName="col-xs-1" wrapperClassName="col-xs-4" buttonAfter={innerSearchIcon}/>
			            </form>
                                </div>
                               <div className="col-xs-3">
			           <Button className="btn-primary" onClick={this.props.getSamples}>Check sample changer contents</Button>
                               </div>
                               <div className="col-xs-4">
			           <ButtonToolbar>
			               <Button className="btn-success pull-right" onClick={() => { this.addSamples() }}>
                                           <Glyphicon glyph="plus"/> Add samples
                                       </Button>
                                       <Button className="btn pull-right" onClick={this.props.selectAll}>Select all</Button>
			           </ButtonToolbar>
                               </div>
                            </div>
                            <div className="row"> 
				    <SampleGrid samples_list={this.props.samples_list} toggleSelected={this.props.toggleSelected} filter_text={this.props.filter_text}/>
                            </div>
			</div>)
	}
}

function mapStateToProps(state) {
    return state.samples_grid
}

function mapDispatchToProps(dispatch) {
    return {
        getSamples: () => dispatch(doGetSamplesList()),
        updateSamples: (samples_list) => dispatch(doUpdateSamples(samples_list)),
        toggleSelected: (index) => dispatch(doToggleSelected(index)), 
        selectAll: () => dispatch(doSelectAll()),
        filter: (filter_text) => dispatch(doFilter(filter_text)),
        addSampleToQueue: (id) => dispatch(sendSample(id))
    }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SampleGridContainer)

